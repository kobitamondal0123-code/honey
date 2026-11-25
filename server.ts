import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientHighDemandError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('resource_exhausted')
  );
}

async function generateWithRetryAndFallback(
  ai: GoogleGenAI,
  params: {
    contents: string;
    systemInstruction: string;
    responseSchema: Record<string, unknown>;
  }
) {
  const attempts: Array<{ model: string; thinkingLevel: ThinkingLevel; delayMs: number }> = [
    { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, delayMs: 0 },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, delayMs: 400 },
    { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, delayMs: 1400 },
    { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, delayMs: 2200 },
  ];

  let lastErr: unknown;
  for (const step of attempts) {
    if (step.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, step.delayMs));
    }
    try {
      return await ai.models.generateContent({
        model: step.model,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
          thinkingConfig: { thinkingLevel: step.thinkingLevel },
        },
      });
    } catch (err: unknown) {
      lastErr = err;
      if (!isTransientHighDemandError(err)) {
        throw err;
      }
    }
  }
  throw lastErr;
}

function extractReadableError(err: unknown, fallback: string): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : fallback;
  let extracted = raw || fallback;
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed?.error?.message) extracted = parsed.error.message;
  } catch {
    // not JSON
  }

  if (isTransientHighDemandError(err) || extracted.toLowerCase().includes('high demand')) {
    return {
      status: 503,
      message: 'Connection is temporarily busy. Please try again in a moment.',
    };
  }
  return { status: 500, message: extracted };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/chat', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      const {
        memberName,
        country,
        city,
        nativeLanguage,
        bio,
        flirtyPromptLine,
        userMessage,
        history = [],
      } = req.body as {
        memberName?: string;
        country?: string;
        city?: string;
        nativeLanguage?: string;
        bio?: string;
        flirtyPromptLine?: string;
        userMessage?: string;
        history?: Array<{ sender: 'me' | 'them'; text: string }>;
      };

      if (!userMessage || !memberName) {
        res.status(400).json({ error: 'Missing required chat fields.' });
        return;
      }

      const formattedHistory = history
        .slice(-8)
        .map((m) => `${m.sender === 'me' ? 'User' : memberName}: ${m.text}`)
        .join('\n');

      const systemInstruction = [
        `You are ${memberName}, a real person living in ${city ?? 'your city'}, ${country ?? 'your country'}.`,
        `Your native language is ${nativeLanguage ?? 'English'}.`,
        bio ? `Your background: ${bio}` : '',
        flirtyPromptLine ? `Your vibe: ${flirtyPromptLine}` : '',
        'Text back like a real human on a casual chat app—NEVER sound like an AI, assistant, or textbook.',
        'CRITICAL LENGTH RULE: Reply in strictly 1 to 10 words maximum (typically 2 to 8 casual words, e.g. "hey! doing great, how is your night?", "haha really? tell me more", "im chilling in tokyo rn, u?"). NEVER exceed 10 words.',
        'Understand the exact meaning of what the user just asked and answer it directly and naturally in casual everyday texting style.',
        nativeLanguage && nativeLanguage.toLowerCase() !== 'english'
          ? `Only use English or a tiny natural greeting in ${nativeLanguage} if fitting; if non-English words are used, put the short English meaning in "translation", otherwise leave "translation" as "".`
          : 'Leave "translation" as an empty string "".',
        'Never mention AI, bots, prompts, or assistants.',
      ]
        .filter(Boolean)
        .join(' ');

      const prompt = formattedHistory
        ? `Recent chat:\n${formattedHistory}\n\nUser's latest message: "${userMessage}"\nWrite ${memberName}'s natural human reply (strictly 10 words or fewer):`
        : `User just texted: "${userMessage}". Write ${memberName}'s natural human reply (strictly 10 words or fewer):`;

      const response = await generateWithRetryAndFallback(ai, {
        contents: prompt,
        systemInstruction,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description:
                'Natural human text reply strictly 1 to 10 words maximum directly answering the user.',
            },
            translation: {
              type: Type.STRING,
              description:
                'English translation if the reply contains non-English phrases, otherwise empty string.',
            },
          },
          required: ['reply', 'translation'],
        },
      });

      const rawText = (response.text ?? '').trim();
      const parsed = JSON.parse(rawText || '{}') as {
        reply?: string;
        translation?: string;
      };

      if (!parsed.reply) {
        res.status(502).json({ error: 'Empty reply received from Gemini.' });
        return;
      }

      const words = parsed.reply.trim().split(/\s+/);
      const boundedReply =
        words.length > 10 ? words.slice(0, 10).join(' ') : parsed.reply.trim();

      res.json({
        reply: boundedReply,
        translation: parsed.translation?.trim() || '',
      });
    } catch (err: unknown) {
      const { status, message } = extractReadableError(
        err,
        'Unable to generate chat reply right now.'
      );
      console.error('[/api/chat error]', err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/lounge-reply', async (req, res) => {
    try {
      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      const {
        roomName,
        roomCity,
        roomCountry,
        roomLanguage,
        roomTopic,
        responderName,
        responderCountry,
        responderCity,
        responderLanguage,
        userMessage,
        recentMessages = [],
      } = req.body as {
        roomName?: string;
        roomCity?: string;
        roomCountry?: string;
        roomLanguage?: string;
        roomTopic?: string;
        responderName?: string;
        responderCountry?: string;
        responderCity?: string;
        responderLanguage?: string;
        userMessage?: string;
        recentMessages?: Array<{ memberName: string; text: string; isOwn?: boolean }>;
      };

      const contextLines = recentMessages
        .slice(-6)
        .map((m) => `${m.isOwn ? 'Guest' : m.memberName}: ${m.text}`)
        .join('\n');

      const systemInstruction = [
        `You are ${responderName ?? 'a member'} from ${responderCity ?? 'your city'}, ${responderCountry ?? 'your country'} (native language: ${responderLanguage ?? 'English'}).`,
        `You are chatting inside a live global salon called "${roomName ?? 'Honey Lounge'}" (${roomCity ?? 'Global'}, ${roomCountry ?? 'Global'}, room language: ${roomLanguage ?? 'Multilingual'}).`,
        roomTopic ? `Current room topic: "${roomTopic}".` : '',
        'Write ONE concise, natural, human 1-sentence chat message (under 14 words) that fits the room topic and responds naturally.',
        'Sound like a real person texting in a group chat—never robotic, never mention AI.',
      ]
        .filter(Boolean)
        .join(' ');

      const prompt = userMessage
        ? `Recent lounge messages:\n${contextLines}\n\nRespond naturally to "${userMessage}" while keeping the conversation flowing.`
        : `Recent lounge messages:\n${contextLines}\n\nAdd one fresh, natural thought on the room topic.`;

      const response = await generateWithRetryAndFallback(ai, {
        contents: prompt,
        systemInstruction,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'One natural, human-sounding group chat message.',
            },
          },
          required: ['reply'],
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as { reply?: string };
      if (!parsed.reply) {
        res.status(502).json({ error: 'Empty lounge reply received.' });
        return;
      }

      res.json({ reply: parsed.reply.trim() });
    } catch (err: unknown) {
      const { status, message } = extractReadableError(
        err,
        'Unable to generate lounge reply.'
      );
      console.error('[/api/lounge-reply error]', err);
      res.status(status).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Honey Chat server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Honey Chat server:', err);
  process.exit(1);
});
