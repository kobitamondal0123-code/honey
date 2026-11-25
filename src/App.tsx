import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Crown, Globe2, MessageSquare, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ActionModals, type ActiveModalType, type UserAccount } from './components/ActionModals';
import { AmbientBackground } from './components/AmbientBackground';
import { DiscoveryPortraitCard } from './components/DiscoveryPortraitCard';
import { FloatingRoomActivity } from './components/FloatingRoomActivity';
import { LeftColumnImpressions } from './components/LeftColumnImpressions';
import { LiveLoungesModal } from './components/LiveLoungesModal';
import { MemberAvatar } from './components/MemberAvatar';
import { MessengerWidget, type IncomingSmsPopup } from './components/MessengerWidget';
import { RightColumnCards } from './components/RightColumnCards';
import {
  ALL_COUNTRIES,
  BAD_LIVE_REVIEWS,
  DISCOVERY_PROFILES,
  GLOBAL_LOUNGE_MEMBERS,
  GOOD_LIVE_REVIEWS,
  LIVE_LOUNGES,
  LIVE_REVIEWS,
  NATURAL_DM_GREETINGS,
  TOPIC_DISCUSSION_LINES,
  generateUniqueDiscoveryProfile,
} from './data/honeyData';
import type {
  ChatThread,
  DeckFilter,
  LiveReview,
  LoungeMember,
  LoungeMessage,
  LoungeRoom,
  PremiumStatus,
  Profile,
  RoomActivityPopup,
} from './types/honey';

const ACCOUNTS_STORAGE_KEY = 'honey_chat_accounts_v1';
const SESSION_STORAGE_KEY = 'honey_chat_session_v1';

function formatNowTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  // Dynamic fluctuating online count in header (fluctuates organically + rises/drops when entering/leaving Live Chat)
  const [onlineCount, setOnlineCount] = useState<number>(() => 1428 + Math.floor(Math.random() * 45));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOnlineCount((prev) => {
        const delta = Math.floor(Math.random() * 11) - 5; // -5 to +5
        return Math.max(980, prev + delta);
      });
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  // Discovery Deck State (Random/Girls/Boys + Global Country Picker + Never-Repeating Unique Profiles)
  const [deckFilter, setDeckFilter] = useState<DeckFilter>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('All Countries');
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement | null>(null);
  const seenProfileKeysRef = useRef<Set<string>>(new Set());

  const [currentProfile, setCurrentProfile] = useState<Profile>(() => {
    const first = DISCOVERY_PROFILES[0];
    seenProfileKeysRef.current.add(`${first.name}|${first.city}|${first.country}`);
    return first;
  });
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [isCardPaused, setIsCardPaused] = useState(false);
  const [sparkFeedback, setSparkFeedback] = useState<string | null>(null);
  const [favourites, setFavourites] = useState<Profile[]>([]);

  // Left Column Member Impressions & Live Room Activity
  const [reviews, setReviews] = useState<LiveReview[]>(LIVE_REVIEWS);
  const [roomActivities, setRoomActivities] = useState<RoomActivityPopup[]>(() =>
    LIVE_LOUNGES.slice(0, 5).map((room, idx) => {
      const member = GLOBAL_LOUNGE_MEMBERS[idx % GLOBAL_LOUNGE_MEMBERS.length];
      return {
        id: `init-act-${idx}`,
        memberId: member.memberId,
        memberName: member.name,
        avatarUrl: member.avatarUrl,
        city: member.city,
        country: member.country,
        roomId: room.id,
        roomName: room.name,
        timestamp: idx === 0 ? 'just now' : `${idx * 2}m ago`,
      };
    })
  );

  const adLinkRef = useRef<HTMLAnchorElement | null>(null);

  // Auth & Accounts state (persisted in localStorage)
  const [registeredAccounts, setRegisteredAccounts] = useState<UserAccount[]>(() => {
    try {
      const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserAccount[]) : [];
    } catch {
      return [];
    }
  });
  const [userAccount, setUserAccount] = useState<UserAccount | null>(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserAccount) : null;
    } catch {
      return null;
    }
  });

  // Premium Payment & Per-Member Free 5-Message Counter State
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus>('none');
  const [submittedTxId, setSubmittedTxId] = useState<string | null>(null);
  const [freeMessagesByMember, setFreeMessagesByMember] = useState<Record<string, number>>({});
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);

  const premiumStatusRef = useRef<PremiumStatus>(premiumStatus);
  const userAccountRef = useRef<UserAccount | null>(userAccount);
  const activeModalRef = useRef<ActiveModalType>(activeModal);
  useEffect(() => {
    premiumStatusRef.current = premiumStatus;
  }, [premiumStatus]);
  useEffect(() => {
    userAccountRef.current = userAccount;
  }, [userAccount]);
  useEffect(() => {
    activeModalRef.current = activeModal;
  }, [activeModal]);

  // Global Landing Page Ad Link:
  // Triggers during account creation (Create Account button & modal) AND everywhere after sign-in
  // (landing page, Live Chat, Chat open, Calls); stops only when Premium VIP is active.
  useEffect(() => {
    const handleGlobalAdClick = (e: MouseEvent) => {
      if (!e.isTrusted) return;
      const target = e.target as HTMLElement | null;
      const isCreateFreeAccountSubmit = Boolean(
        target?.closest('[data-create-account-submit="true"]')
      );
      if (!userAccountRef.current && !isCreateFreeAccountSubmit) return;
      if (premiumStatusRef.current === 'active') return;
      if (!adLinkRef.current) return;
      if (target === adLinkRef.current || adLinkRef.current.contains(target)) return;
      if (
        target?.closest('[data-no-ad="true"]') ||
        target?.closest('label') ||
        (target instanceof HTMLInputElement && target.type === 'file')
      ) {
        return;
      }
      adLinkRef.current.click();
    };
    document.addEventListener('click', handleGlobalAdClick, true);
    return () => document.removeEventListener('click', handleGlobalAdClick, true);
  }, []);

  const requireAccount = useCallback(() => {
    if (!userAccount) {
      setActiveModal({
        type: 'create-account',
        reason: 'Please create an account or log in first to unlock Honey Chat.',
      });
      return false;
    }
    return true;
  }, [userAccount]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCountryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangeDeckFilter = useCallback(
    (nextFilter: DeckFilter) => {
      if (!requireAccount()) return;
      setDeckFilter(nextFilter);
      setSlideDirection(1);
      setCurrentProfile(
        generateUniqueDiscoveryProfile(
          nextFilter,
          selectedCountry,
          seenProfileKeysRef.current
        )
      );
    },
    [requireAccount, selectedCountry]
  );

  const handleSelectCountry = useCallback(
    (country: string) => {
      if (!requireAccount()) return;
      setSelectedCountry(country);
      setIsCountryMenuOpen(false);
      setSlideDirection(1);
      setCurrentProfile(
        generateUniqueDiscoveryProfile(
          deckFilter,
          country,
          seenProfileKeysRef.current
        )
      );
    },
    [deckFilter, requireAccount]
  );

  const advanceDeck = useCallback(
    (direction: 1 | -1 = 1) => {
      setSlideDirection(direction);
      setCurrentProfile(
        generateUniqueDiscoveryProfile(
          deckFilter,
          selectedCountry,
          seenProfileKeysRef.current
        )
      );
    },
    [deckFilter, selectedCountry]
  );

  const handleManualPass = useCallback(() => {
    if (!requireAccount()) return;
    advanceDeck(-1);
  }, [requireAccount, advanceDeck]);

  const handleManualNext = useCallback(() => {
    if (!requireAccount()) return;
    advanceDeck(1);
  }, [requireAccount, advanceDeck]);

  // Auto-advance every 8 seconds unless paused by hover
  useEffect(() => {
    if (isCardPaused) return;
    const timer = window.setInterval(() => {
      advanceDeck(1);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [isCardPaused, advanceDeck, currentProfile.id]);

  // Periodic Live Room Activity arrivals for Left Column
  useEffect(() => {
    const timer = window.setInterval(() => {
      const room = pickRandom(LIVE_LOUNGES);
      const member = pickRandom(GLOBAL_LOUNGE_MEMBERS);
      setRoomActivities((prev) => {
        const entry: RoomActivityPopup = {
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          memberId: member.memberId,
          memberName: member.name,
          avatarUrl: member.avatarUrl,
          city: member.city,
          country: member.country,
          roomId: room.id,
          roomName: room.name,
          timestamp: 'just now',
        };
        return [entry, ...prev].slice(0, 6);
      });
    }, 9000);
    return () => window.clearInterval(timer);
  }, []);

  // Live streaming website reviews: 20 good reviews followed by 1 bad review
  const reviewStreamCountRef = useRef(LIVE_REVIEWS.length);
  const goodReviewIdxRef = useRef(0);
  const badReviewIdxRef = useRef(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const isBadSlot = reviewStreamCountRef.current % 21 === 20;
      const nextTemplate = isBadSlot
        ? BAD_LIVE_REVIEWS[badReviewIdxRef.current % BAD_LIVE_REVIEWS.length]
        : GOOD_LIVE_REVIEWS[goodReviewIdxRef.current % GOOD_LIVE_REVIEWS.length];
      if (isBadSlot) {
        badReviewIdxRef.current += 1;
      } else {
        goodReviewIdxRef.current += 1;
      }
      reviewStreamCountRef.current += 1;
      const incomingReview: LiveReview = {
        id: `rev-live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        reviewerName: nextTemplate.reviewerName,
        memberId: nextTemplate.memberId,
        city: nextTemplate.city,
        country: nextTemplate.country,
        rating: nextTemplate.rating,
        comment: nextTemplate.comment,
        timestamp: 'just now',
      };
      setReviews((prev) => [
        incomingReview,
        ...prev
          .map((item, idx) =>
            item.timestamp === 'just now' ? { ...item, timestamp: `${idx + 1}m ago` } : item
          )
          .slice(0, 7),
      ]);
    }, 6500);
    return () => window.clearInterval(timer);
  }, []);

  const handleAddOpinion = useCallback(
    (opinionText: string, rating = 5) => {
      if (!userAccount) return;
      const newRev: LiveReview = {
        id: `rev-${Date.now()}`,
        reviewerName: userAccount.name,
        memberId: userAccount.memberId,
        city: userAccount.city || 'Global',
        country: userAccount.country || 'Lounge',
        rating,
        comment: opinionText,
        timestamp: 'just now',
      };
      setReviews((prev) => [newRev, ...prev.slice(0, 7)]);
    },
    [userAccount]
  );

  // Live Lounges State (12 global rooms with fast real-time discussions & fluctuating online counts)
  const [lounges, setLounges] = useState<LoungeRoom[]>(LIVE_LOUNGES);
  const [isLoungesModalOpen, setIsLoungesModalOpen] = useState(false);
  const [activeLoungeId, setActiveLoungeId] = useState<string>(LIVE_LOUNGES[0].id);
  const joinedRoomOnOpenRef = useRef<string | null>(null);

  const [loungeMessagesByRoom, setLoungeMessagesByRoom] = useState<
    Record<string, LoungeMessage[]>
  >(() => {
    const initial: Record<string, LoungeMessage[]> = {};
    const nowTime = formatNowTime();
    LIVE_LOUNGES.forEach((room, roomIdx) => {
      const m1 = GLOBAL_LOUNGE_MEMBERS[roomIdx % GLOBAL_LOUNGE_MEMBERS.length];
      const m2 = GLOBAL_LOUNGE_MEMBERS[(roomIdx + 5) % GLOBAL_LOUNGE_MEMBERS.length];
      const m3 = GLOBAL_LOUNGE_MEMBERS[(roomIdx + 11) % GLOBAL_LOUNGE_MEMBERS.length];
      const topicLines = TOPIC_DISCUSSION_LINES[room.id] ?? [
        `Loving tonight’s vibe in ${room.name}—what keeps everyone awake at this hour?`,
      ];
      initial[room.id] = [
        {
          id: `init-sms-${room.id}-1`,
          roomId: room.id,
          type: 'sms',
          memberId: m1.memberId,
          memberName: m1.name,
          username: m1.username,
          gender: m1.gender,
          avatarUrl: m1.avatarUrl,
          city: m1.city,
          country: m1.country,
          nativeLanguage: m1.nativeLanguage,
          isOnline: m1.isOnline,
          text: topicLines[0] ?? m1.flirtyPromptLine,
          timestamp: nowTime,
        },
        {
          id: `init-sms-${room.id}-2`,
          roomId: room.id,
          type: 'sms',
          memberId: m2.memberId,
          memberName: m2.name,
          username: m2.username,
          gender: m2.gender,
          avatarUrl: m2.avatarUrl,
          city: m2.city,
          country: m2.country,
          nativeLanguage: m2.nativeLanguage,
          isOnline: m2.isOnline,
          text: topicLines[1] ?? topicLines[0],
          timestamp: nowTime,
        },
        {
          id: `init-sms-${room.id}-3`,
          roomId: room.id,
          type: 'sms',
          memberId: m3.memberId,
          memberName: m3.name,
          username: m3.username,
          gender: m3.gender,
          avatarUrl: m3.avatarUrl,
          city: m3.city,
          country: m3.country,
          nativeLanguage: m3.nativeLanguage,
          isOnline: m3.isOnline,
          text: topicLines[2] ?? topicLines[0],
          timestamp: nowTime,
        },
      ];
    });
    return initial;
  });

  const loungesRef = useRef(lounges);
  const loungeMessagesRef = useRef(loungeMessagesByRoom);
  const isLoungesModalOpenRef = useRef(isLoungesModalOpen);
  const activeLoungeIdRef = useRef(activeLoungeId);
  useEffect(() => {
    loungesRef.current = lounges;
  }, [lounges]);
  useEffect(() => {
    loungeMessagesRef.current = loungeMessagesByRoom;
  }, [loungeMessagesByRoom]);
  useEffect(() => {
    isLoungesModalOpenRef.current = isLoungesModalOpen;
  }, [isLoungesModalOpen]);
  useEffect(() => {
    activeLoungeIdRef.current = activeLoungeId;
  }, [activeLoungeId]);

  // Fluctuate room participant counts naturally (members joining & leaving rooms)
  useEffect(() => {
    const timer = window.setInterval(() => {
      const target = pickRandom(LIVE_LOUNGES);
      const delta = Math.random() < 0.55 ? 1 : -1;
      setLounges((prev) =>
        prev.map((r) =>
          r.id === target.id
            ? { ...r, participantCount: Math.max(8, r.participantCount + delta) }
            : r
        )
      );
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  // Fast live chat stream inside Live Lounges (every 2.5–5s when modal is open, 8–14s in background)
  useEffect(() => {
    let timerId = 0;
    let cancelled = false;

    const pushLoungeTopicMessage = async () => {
      if (cancelled) return;

      const allRooms = loungesRef.current;
      const modalOpen = isLoungesModalOpenRef.current;
      const targetRoom = modalOpen
        ? allRooms.find((r) => r.id === activeLoungeIdRef.current) ?? pickRandom(allRooms)
        : pickRandom(allRooms);

      const currentRoomMsgs = (loungeMessagesRef.current[targetRoom.id] ?? []).filter(
        (m) => m.type === 'sms'
      );
      const lastSpeakerId = currentRoomMsgs[currentRoomMsgs.length - 1]?.memberId;
      const memberPool = GLOBAL_LOUNGE_MEMBERS.filter((m) => m.memberId !== lastSpeakerId);
      const member = pickRandom(memberPool.length > 0 ? memberPool : GLOBAL_LOUNGE_MEMBERS);
      const recentTexts = new Set(currentRoomMsgs.slice(-6).map((m) => m.text));
      const pool = (TOPIC_DISCUSSION_LINES[targetRoom.id] ?? []).filter(
        (line) => !recentTexts.has(line)
      );
      let smsText =
        pool.length > 0
          ? pickRandom(pool)
          : pickRandom(
              TOPIC_DISCUSSION_LINES[targetRoom.id] ?? [
                `Loving tonight’s discussion here in ${targetRoom.name}.`,
              ]
            );

      if (modalOpen) {
        try {
          const res = await fetch('/api/lounge-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomName: targetRoom.name,
              roomCity: targetRoom.city,
              roomCountry: targetRoom.country,
              roomLanguage: targetRoom.language,
              roomTopic: targetRoom.topic,
              responderName: member.name,
              responderId: member.memberId,
              responderCountry: member.country,
              responderCity: member.city,
              responderLanguage: member.nativeLanguage,
              recentMessages: currentRoomMsgs.slice(-6).map((m) => ({
                memberName: m.memberName,
                text: m.text,
                isOwn: m.isOwn,
              })),
            }),
          });
          const data = (await res.json()) as { reply?: string };
          if (res.ok && data.reply && !recentTexts.has(data.reply)) {
            smsText = data.reply;
          }
        } catch {
          // keep fresh topic fallback
        }
      }

      if (cancelled) return;

      const newMsg: LoungeMessage = {
        id: `lounge-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        roomId: targetRoom.id,
        type: 'sms',
        memberId: member.memberId,
        memberName: member.name,
        username: member.username,
        gender: member.gender,
        avatarUrl: member.avatarUrl,
        city: member.city,
        country: member.country,
        nativeLanguage: member.nativeLanguage,
        isOnline: member.isOnline,
        text: smsText,
        timestamp: formatNowTime(),
      };

      setLoungeMessagesByRoom((prev) => {
        const list = prev[targetRoom.id] ?? [];
        return {
          ...prev,
          [targetRoom.id]: [...list, newMsg],
        };
      });
    };

    const scheduleNextLoungeMessage = () => {
      const randomDelayMs = isLoungesModalOpenRef.current
        ? 2500 + Math.floor(Math.random() * 2500) // fast 2.5–5s live stream while inside lounge
        : 8000 + Math.floor(Math.random() * 6000);
      timerId = window.setTimeout(async () => {
        await pushLoungeTopicMessage();
        if (!cancelled) scheduleNextLoungeMessage();
      }, randomDelayMs);
    };

    scheduleNextLoungeMessage();

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, []);

  // Messenger State: COMPLETELY EMPTY before account creation (no SMS or popups before sign up / login!)
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [incomingPopup, setIncomingPopup] = useState<IncomingSmsPopup | null>(null);

  const activeChatIdRef = useRef<string | null>(null);
  const isChatMinimizedRef = useRef<boolean>(false);
  const threadsRef = useRef<ChatThread[]>(threads);
  const pendingTimeoutsRef = useRef<number[]>([]);
  const popupTimerRef = useRef<number | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    isChatMinimizedRef.current = isChatMinimized;
  }, [activeChatId, isChatMinimized]);
  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  useEffect(() => {
    return () => {
      pendingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      if (popupTimerRef.current) window.clearTimeout(popupTimerRef.current);
    };
  }, []);

  const showIncomingSmsPopup = useCallback((popup: IncomingSmsPopup) => {
    setIncomingPopup(popup);
    if (popupTimerRef.current) {
      window.clearTimeout(popupTimerRef.current);
    }
    popupTimerRef.current = window.setTimeout(() => {
      setIncomingPopup((prev) => (prev?.id === popup.id ? null : prev));
    }, 12000);
  }, []);

  // Realistic incoming SMS ONLY after account creation, every 1–2 minutes (triggers popup!)
  const isSignedIn = Boolean(userAccount);
  useEffect(() => {
    if (!isSignedIn) return;

    let timerId = 0;
    let cancelled = false;

    const scheduleNextDmArrival = () => {
      const delayMs = 60000 + Math.floor(Math.random() * 60001); // 1 to 2 minutes
      timerId = window.setTimeout(() => {
        if (cancelled) return;

        const candidates = GLOBAL_LOUNGE_MEMBERS.filter((m) => {
          const isCurrentlyOpen =
            activeChatIdRef.current === m.memberId && !isChatMinimizedRef.current;
          const thread = threadsRef.current.find((t) => t.memberId === m.memberId);
          const lastMsg = thread?.messages[thread.messages.length - 1];
          const alreadyHasUnrepliedGreeting = Boolean(
            thread && lastMsg && lastMsg.sender === 'them'
          );
          return (
            !isCurrentlyOpen &&
            !thread?.blockedUntilPremium &&
            !alreadyHasUnrepliedGreeting
          );
        });

        if (candidates.length > 0) {
          const sender = pickRandom(candidates);
          const usedGreetings = new Set(
            threadsRef.current
              .slice(0, 8)
              .map((t) => t.messages[t.messages.length - 1]?.text)
              .filter(Boolean)
          );
          const availableGreetings = NATURAL_DM_GREETINGS.filter(
            (g) => !usedGreetings.has(g)
          );
          const text =
            availableGreetings.length > 0
              ? pickRandom(availableGreetings)
              : pickRandom(NATURAL_DM_GREETINGS);
          const stamp = formatNowTime();
          const msgId = `inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          setThreads((prev) => {
            const existingIdx = prev.findIndex((t) => t.memberId === sender.memberId);
            const incomingMsg = {
              id: msgId,
              sender: 'them' as const,
              text,
              timestamp: stamp,
            };

            if (existingIdx >= 0) {
              const existing = prev[existingIdx];
              const updated: ChatThread = {
                ...existing,
                unreadCount: existing.unreadCount + 1,
                dismissedHead: false,
                messages: [...existing.messages, incomingMsg],
              };
              const rest = prev.filter((_, idx) => idx !== existingIdx);
              return [updated, ...rest];
            }

            const created: ChatThread = {
              memberId: sender.memberId,
              name: sender.name,
              username: sender.username,
              age: sender.age,
              gender: sender.gender,
              avatarUrl: sender.avatarUrl,
              verified: sender.verified,
              country: sender.country,
              city: sender.city,
              nativeLanguage: sender.nativeLanguage,
              bio: sender.bio,
              flirtyPromptLine: sender.flirtyPromptLine,
              isOnline: sender.isOnline,
              unreadCount: 1,
              lastActiveText: sender.isOnline ? 'Active now' : '12m ago',
              messages: [incomingMsg],
            };
            return [created, ...prev];
          });

          showIncomingSmsPopup({
            id: msgId,
            memberId: sender.memberId,
            name: sender.name,
            age: sender.age,
            city: sender.city,
            country: sender.country,
            avatarUrl: sender.avatarUrl,
            verified: sender.verified,
            text,
          });
        }

        scheduleNextDmArrival();
      }, delayMs);
    };

    scheduleNextDmArrival();

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [isSignedIn, showIncomingSmsPopup]);

  // Opening a thread from a Discovery Profile starts with ZERO pre-existing SMS
  const openOrCreateThreadAndFocus = useCallback(
    (
      member: Pick<
        LoungeMember,
        | 'memberId'
        | 'name'
        | 'username'
        | 'age'
        | 'gender'
        | 'city'
        | 'country'
        | 'nativeLanguage'
        | 'avatarUrl'
        | 'verified'
        | 'isOnline'
        | 'bio'
        | 'flirtyPromptLine'
      >
    ) => {
      setChatError(null);
      setIncomingPopup((prev) => (prev?.memberId === member.memberId ? null : prev));
      const prevList = threadsRef.current;
      const existingIdx = prevList.findIndex((t) => t.memberId === member.memberId);
      let nextList: ChatThread[];
      if (existingIdx >= 0) {
        const updated: ChatThread = {
          ...prevList[existingIdx],
          unreadCount: 0,
          dismissedHead: false,
        };
        nextList = [...prevList];
        nextList[existingIdx] = updated;
      } else {
        const created: ChatThread = {
          memberId: member.memberId,
          name: member.name,
          username: member.username,
          age: member.age,
          gender: member.gender,
          avatarUrl: member.avatarUrl,
          verified: member.verified,
          country: member.country,
          city: member.city,
          nativeLanguage: member.nativeLanguage,
          bio: member.bio,
          flirtyPromptLine: member.flirtyPromptLine,
          isOnline: member.isOnline,
          unreadCount: 0,
          lastActiveText: member.isOnline ? 'Active now' : '15m ago',
          messages: [], // NO pre-seeded SMS!
        };
        nextList = [created, ...prevList];
      }
      threadsRef.current = nextList;
      setThreads(nextList);
      setActiveChatId(member.memberId);
      setIsChatMinimized(false);
      setIsInboxOpen(false);
    },
    []
  );

  const handleOpenChatById = useCallback(
    (memberId: string) => {
      if (!requireAccount()) return;
      setChatError(null);
      setIncomingPopup((prev) => (prev?.memberId === memberId ? null : prev));
      setThreads((prev) =>
        prev.map((t) =>
          t.memberId === memberId ? { ...t, unreadCount: 0, dismissedHead: false } : t
        )
      );
      setActiveChatId(memberId);
      setIsChatMinimized(false);
      setIsInboxOpen(false);
    },
    [requireAccount]
  );

  const handleToggleFavourite = useCallback(
    (profile: Profile) => {
      if (!requireAccount()) return;
      setFavourites((prev) => {
        const exists = prev.some((p) => p.id === profile.id);
        if (exists) {
          return prev.filter((p) => p.id !== profile.id);
        }
        setSparkFeedback(`Saved ${profile.name} to Your Favourites`);
        window.setTimeout(() => setSparkFeedback(null), 1800);
        return [profile, ...prev];
      });
    },
    [requireAccount]
  );

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoungesModalOpen || activeModal) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleManualPass();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleManualNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoungesModalOpen, activeModal, handleManualPass, handleManualNext]);

  // Direct message handler:
  // - 5 free SMS limit per member -> prompts Unlock Premium
  // - Minimum 49s before Seen
  // - 30s Typing... after Seen
  // - Ultra-short natural human reply from Gemini (~10 chars) + popup if thread is closed
  const handleSendDirectMessage = useCallback(
    async (memberId: string, text: string) => {
      if (!requireAccount()) return;
      setChatError(null);

      const targetThread = threadsRef.current.find((t) => t.memberId === memberId);
      if (!targetThread) return;

      const sentToThisMember = freeMessagesByMember[memberId] ?? 0;

      if (
        premiumStatus !== 'active' &&
        (targetThread.blockedUntilPremium || sentToThisMember >= 5)
      ) {
        setActiveModal({
          type: 'unlock-premium',
          reason: `You have used all 5 free messages with ${targetThread.name}. Unlock Honey Chat Premium ($15 USDT / month) to continue messaging or calling ${targetThread.name}.`,
        });
        return;
      }

      const outgoingId = `me-${Date.now()}`;
      const stamp = formatNowTime();

      const updatedOutgoing = {
        id: outgoingId,
        sender: 'me' as const,
        text,
        timestamp: stamp,
        seen: false,
      };
      const historySnapshot = [...targetThread.messages, updatedOutgoing].slice(-10);

      let reachedLimitNow = false;
      if (premiumStatus !== 'active') {
        const nextCount = sentToThisMember + 1;
        setFreeMessagesByMember((prev) => ({
          ...prev,
          [memberId]: nextCount,
        }));
        if (nextCount >= 5) {
          reachedLimitNow = true;
        }
      }

      setThreads((prev) =>
        prev.map((t) =>
          t.memberId === memberId
            ? {
                ...t,
                unreadCount: 0,
                blockedUntilPremium: reachedLimitNow ? true : t.blockedUntilPremium,
                messages: [...t.messages, updatedOutgoing],
              }
            : t
        )
      );

      // Minimum 49s before Seen -> 30s Typing... -> Reply delivered
      const sentAt = Date.now();
      const seenDelayMs = 49000 + Math.floor(Math.random() * 6000); // 49s - 55s
      const typingTargetAt = sentAt + seenDelayMs + 500;
      const deliverTargetAt = sentAt + seenDelayMs + 30000; // 30s of Typing...

      const seenTimer = window.setTimeout(() => {
        setThreads((prev) =>
          prev.map((t) =>
            t.memberId === memberId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === outgoingId ? { ...m, seen: true } : m
                  ),
                }
              : t
          )
        );
      }, seenDelayMs);
      pendingTimeoutsRef.current.push(seenTimer);

      if (reachedLimitNow) {
        const limitPromptTimer = window.setTimeout(() => {
          setActiveModal({
            type: 'unlock-premium',
            reason: `You have sent 5 free messages to ${targetThread.name}. Unlock Honey Chat Premium ($15 USDT / month) to keep messaging and calling ${targetThread.name}.`,
          });
        }, 700);
        pendingTimeoutsRef.current.push(limitPromptTimer);
      }

      if (targetThread.blockedUntilPremium && premiumStatus !== 'active') {
        return;
      }

      try {
        const requestPayload = JSON.stringify({
          memberName: targetThread.name,
          memberId: targetThread.memberId,
          country: targetThread.country,
          city: targetThread.city,
          nativeLanguage: targetThread.nativeLanguage,
          bio: targetThread.bio,
          flirtyPromptLine: targetThread.flirtyPromptLine,
          userMessage: text,
          history: historySnapshot.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        });

        let data: { reply?: string; translation?: string; error?: string } = {};
        let succeeded = false;
        let lastErrorMessage = 'Connection was briefly busy. Please send your message again.';
        const retryBackoffs = [0, 4000, 7000, 10000];

        for (let attempt = 0; attempt < retryBackoffs.length; attempt += 1) {
          if (retryBackoffs[attempt] > 0) {
            await new Promise((resolve) => setTimeout(resolve, retryBackoffs[attempt]));
          }
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestPayload,
          });
          data = (await res.json()) as {
            reply?: string;
            translation?: string;
            error?: string;
          };
          if (res.ok && data.reply) {
            succeeded = true;
            break;
          }
          if (res.status < 500 && res.status !== 429) {
            lastErrorMessage = data.error || lastErrorMessage;
            break;
          }
          lastErrorMessage = data.error || lastErrorMessage;
        }

        if (!succeeded || !data.reply) {
          throw new Error(lastErrorMessage);
        }

        const now = Date.now();
        const remainingTypingMs = Math.max(0, typingTargetAt - now);
        const remainingDeliverMs = Math.max(remainingTypingMs + 1500, deliverTargetAt - now);

        const typingTimer = window.setTimeout(() => {
          setThreads((prev) =>
            prev.map((t) =>
              t.memberId === memberId ? { ...t, typing: true } : t
            )
          );
        }, remainingTypingMs);

        const deliverTimer = window.setTimeout(() => {
          const isActiveVisible =
            activeChatIdRef.current === memberId && !isChatMinimizedRef.current;
          const replyId = `ai-${Date.now()}`;

          setThreads((prev) =>
            prev.map((t) => {
              if (t.memberId !== memberId) return t;
              return {
                ...t,
                typing: false,
                unreadCount: isActiveVisible ? 0 : t.unreadCount + 1,
                messages: [
                  ...t.messages,
                  {
                    id: replyId,
                    sender: 'them',
                    text: data.reply!,
                    translation: data.translation || undefined,
                    timestamp: formatNowTime(),
                  },
                ],
              };
            })
          );

          if (!isActiveVisible) {
            showIncomingSmsPopup({
              id: replyId,
              memberId: targetThread.memberId,
              name: targetThread.name,
              age: targetThread.age,
              city: targetThread.city,
              country: targetThread.country,
              avatarUrl: targetThread.avatarUrl,
              verified: targetThread.verified,
              text: data.reply!,
            });
          }
        }, remainingDeliverMs);

        pendingTimeoutsRef.current.push(typingTimer, deliverTimer);
      } catch (err: unknown) {
        const rawErr = err instanceof Error ? err.message : '';
        const friendlyErr =
          rawErr &&
          !rawErr.trim().startsWith('{') &&
          !rawErr.toLowerCase().includes('this model')
            ? rawErr
            : 'Connection was briefly busy. Please send your message again.';
        setChatError(friendlyErr);
        setThreads((prev) =>
          prev.map((t) => (t.memberId === memberId ? { ...t, typing: false } : t))
        );
      }
    },
    [requireAccount, premiumStatus, freeMessagesByMember, showIncomingSmsPopup]
  );

  // Non-premium 15-second voice/video call cutoff fallback
  const handleNonPremiumCallCutoff = useCallback((memberId: string) => {
    const isActiveVisible =
      activeChatIdRef.current === memberId && !isChatMinimizedRef.current;

    setThreads((prev) =>
      prev.map((t) =>
        t.memberId === memberId
          ? {
              ...t,
              blockedUntilPremium: true,
              typing: false,
              dismissedHead: false,
              unreadCount: isActiveVisible ? 0 : t.unreadCount + 1,
              messages: [
                ...t.messages,
                {
                  id: `cutoff-${Date.now()}`,
                  sender: 'them',
                  text: 'Unlock Premium first to continue voice or video calls.',
                  timestamp: formatNowTime(),
                },
              ],
            }
          : t
      )
    );

    setActiveModal({
      type: 'unlock-premium',
      reason:
        'Unlock Honey Chat Premium ($15 USDT / month) for unlimited audio/video calls, unlimited SMS, and an ad-free app.',
    });
  }, []);

  // Fast live lounge reply (3–6s)
  const handlePostLoungeMessage = useCallback(
    async (roomId: string, text: string) => {
      if (!requireAccount()) return;
      const room = lounges.find((r) => r.id === roomId) ?? lounges[0];
      const ownMsg: LoungeMessage = {
        id: `own-${Date.now()}`,
        roomId,
        type: 'sms',
        memberId: userAccount?.memberId ?? 'HC-YOU',
        memberName: userAccount?.name ?? 'You',
        username: userAccount?.username ?? 'guest',
        gender: userAccount?.gender,
        avatarUrl: userAccount?.avatarUrl,
        city: userAccount?.city ?? 'Guest Suite',
        country: userAccount?.country ?? 'Global',
        nativeLanguage: userAccount?.nativeLanguage ?? 'Multilingual',
        isOnline: true,
        text,
        timestamp: formatNowTime(),
        isOwn: true,
      };

      setLoungeMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...(prev[roomId] ?? []), ownMsg],
      }));

      const replyDelayMs = 3000 + Math.floor(Math.random() * 3000); // Fast 3–6s reply
      const replyTimer = window.setTimeout(async () => {
        const responder = pickRandom(GLOBAL_LOUNGE_MEMBERS);
        const recentSnapshot = (loungeMessagesRef.current[roomId] ?? [])
          .filter((m) => m.type === 'sms')
          .slice(-8)
          .map((m) => ({
            memberName: m.memberName,
            text: m.text,
            isOwn: m.isOwn,
          }));

        try {
          const res = await fetch('/api/lounge-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomName: room.name,
              roomCity: room.city,
              roomCountry: room.country,
              roomLanguage: room.language,
              roomTopic: room.topic,
              responderName: responder.name,
              responderId: responder.memberId,
              responderCountry: responder.country,
              responderCity: responder.city,
              responderLanguage: responder.nativeLanguage,
              userMessage: text,
              recentMessages: recentSnapshot,
            }),
          });
          const data = (await res.json()) as { reply?: string };
          if (res.ok && data.reply) {
            const replyMsg: LoungeMessage = {
              id: `lounge-ai-${Date.now()}`,
              roomId,
              type: 'sms',
              memberId: responder.memberId,
              memberName: responder.name,
              username: responder.username,
              gender: responder.gender,
              avatarUrl: responder.avatarUrl,
              city: responder.city,
              country: responder.country,
              nativeLanguage: responder.nativeLanguage,
              isOnline: responder.isOnline,
              text: data.reply,
              timestamp: formatNowTime(),
            };
            setLoungeMessagesByRoom((prev) => ({
              ...prev,
              [roomId]: [...(prev[roomId] ?? []), replyMsg],
            }));
          }
        } catch {
          // Silent fallback
        }
      }, replyDelayMs);

      pendingTimeoutsRef.current.push(replyTimer);
    },
    [requireAccount, lounges, userAccount]
  );

  // Entering Live Chat increases online count + room participant count; leaving decreases them!
  const handleOpenLounges = useCallback(
    (roomId?: string) => {
      if (!requireAccount()) return;
      const targetId = roomId ?? activeLoungeId;
      setActiveLoungeId(targetId);
      if (!joinedRoomOnOpenRef.current) {
        joinedRoomOnOpenRef.current = targetId;
        setOnlineCount((c) => c + 1);
        setLounges((prev) =>
          prev.map((r) =>
            r.id === targetId ? { ...r, participantCount: r.participantCount + 1 } : r
          )
        );
      }
      setIsLoungesModalOpen(true);
    },
    [requireAccount, activeLoungeId]
  );

  const handleCloseLounges = useCallback(() => {
    const joinedId = joinedRoomOnOpenRef.current;
    if (joinedId) {
      joinedRoomOnOpenRef.current = null;
      setOnlineCount((c) => Math.max(980, c - 1));
      setLounges((prev) =>
        prev.map((r) =>
          r.id === joinedId
            ? { ...r, participantCount: Math.max(1, r.participantCount - 1) }
            : r
        )
      );
    }
    setIsLoungesModalOpen(false);
  }, []);

  const handleSwitchLoungeRoom = useCallback((nextRoomId: string) => {
    const prevJoined = joinedRoomOnOpenRef.current;
    if (prevJoined && prevJoined !== nextRoomId) {
      joinedRoomOnOpenRef.current = nextRoomId;
      setLounges((prev) =>
        prev.map((r) => {
          if (r.id === prevJoined) {
            return { ...r, participantCount: Math.max(1, r.participantCount - 1) };
          }
          if (r.id === nextRoomId) {
            return { ...r, participantCount: r.participantCount + 1 };
          }
          return r;
        })
      );
    }
    setActiveLoungeId(nextRoomId);
  }, []);

  const handleMessageProfile = useCallback(
    (profile: Profile) => {
      if (!requireAccount()) return;
      openOrCreateThreadAndFocus({
        memberId: profile.memberId,
        name: profile.name,
        username: profile.username,
        age: profile.age,
        gender: profile.gender,
        city: profile.city,
        country: profile.country,
        nativeLanguage: profile.nativeLanguage,
        avatarUrl: profile.avatarMode === 'photo' ? profile.portraitUrl : undefined,
        verified: profile.verified,
        isOnline: profile.isOnline,
        bio: profile.bio,
        flirtyPromptLine: profile.flirtyPromptLine,
      });
    },
    [requireAccount, openOrCreateThreadAndFocus]
  );

  const handleSignUp = useCallback((account: UserAccount) => {
    setRegisteredAccounts((prev) => {
      const next = [account, ...prev];
      try {
        window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    setUserAccount(account);
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(account));
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = useCallback((account: UserAccount) => {
    setUserAccount(account);
    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(account));
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = useCallback(() => {
    pendingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    pendingTimeoutsRef.current = [];
    if (popupTimerRef.current) {
      window.clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
    setUserAccount(null);
    setActiveChatId(null);
    setIsInboxOpen(false);
    setIsChatMinimized(false);
    setChatError(null);
    setIncomingPopup(null);
    setThreads([]);
    try {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const handleUpdateAvatar = useCallback((avatarUrl?: string) => {
    setUserAccount((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, avatarUrl };
      try {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      setRegisteredAccounts((list) => {
        const nextList = list.map((a) =>
          a.memberId === updated.memberId ? updated : a
        );
        try {
          window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(nextList));
        } catch {
          // ignore
        }
        return nextList;
      });
      return updated;
    });
  }, []);

  const handleSubmitPremiumPayment = useCallback((txId: string, _amountText: string) => {
    setSubmittedTxId(txId);
    setPremiumStatus('pending');
  }, []);

  const handleCallAttempt = useCallback(
    (mode: 'voice' | 'video', thread: ChatThread) => {
      if (!requireAccount()) return;
      if (premiumStatus !== 'active') {
        setActiveModal({
          type: 'unlock-premium',
          reason: `Unlock Honey Chat Premium ($15 USDT / month) to make private ${mode} calls with ${thread.name} and enjoy unlimited messaging.`,
        });
        return;
      }
      setActiveModal({
        type: 'call',
        mode,
        name: thread.name,
        username: thread.username,
        gender: thread.gender,
        memberId: thread.memberId,
        city: thread.city,
        country: thread.country,
        nativeLanguage: thread.nativeLanguage,
        bio: thread.bio,
        avatarUrl: thread.avatarUrl,
        greeting: thread.flirtyPromptLine,
      });
    },
    [requireAccount, premiumStatus]
  );

  const isCurrentFavourite = favourites.some((p) => p.id === currentProfile.id);
  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  return (
    <div className="relative min-h-screen w-full text-white">
      <a
        ref={adLinkRef}
        href="https://auctionr.org/4/44f1324a3594d458a62905ffae3a29e3"
        target="_blank"
        rel="noopener noreferrer"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <AmbientBackground />

      {/* Top Navigation Bar */}
      <header className="relative z-30 mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-5 sm:px-8">
        {/* Zone 1: Brand + Live Fluctuating Online Count */}
        <div className="flex items-center gap-4 shrink-0">
          <a
            href="#discover"
            className="font-editorial text-2xl sm:text-3xl font-semibold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Honey <span className="animate-gold-pink-shimmer">Chat</span>
          </a>

          <div
            aria-live="polite"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-white/80 whitespace-nowrap"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
            <span className="font-mono-id font-semibold text-emerald-200 tabular-nums">
              {onlineCount.toLocaleString()}
            </span>
            <span className="hidden sm:inline text-white/60">online now</span>
          </div>
        </div>

        {/* Zone 2: Global Country Picker + Random/Girls/Boys + Unlock Premium + Create Account */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global Country Dropdown Button */}
          <div className="relative" ref={countryDropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (!requireAccount()) return;
                setIsInboxOpen(false);
                setIsCountryMenuOpen((o) => !o);
              }}
              aria-expanded={isCountryMenuOpen}
              aria-label="Select country"
              className="glass-3d-button inline-flex items-center gap-1.5 rounded-full border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap shrink-0"
            >
              <Globe2 className="h-3.5 w-3.5 text-amber-300 shrink-0" aria-hidden="true" />
              <span>
                {selectedCountry === 'All Countries' ? 'Global' : selectedCountry}
              </span>
              <ChevronDown className="h-3 w-3 text-white/65 shrink-0" aria-hidden="true" />
            </button>

            <AnimatePresence>
              {isCountryMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -6, scale: 0.96, filter: 'blur(4px)' }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="honey-scroll absolute right-0 top-11 z-50 max-h-72 w-52 overflow-y-auto rounded-2xl border border-white/15 bg-[#120D1F]/95 p-1.5 backdrop-blur-2xl shadow-2xl"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectCountry('All Countries')}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                      selectedCountry === 'All Countries'
                        ? 'bg-gradient-to-r from-fuchsia-500/35 to-amber-500/30 text-white'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>All Countries (Global)</span>
                  </button>
                  {ALL_COUNTRIES.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => handleSelectCountry(country)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                        selectedCountry === country
                          ? 'bg-gradient-to-r from-fuchsia-500/35 to-amber-500/30 text-white'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span>{country}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Random | Girls | Boys Selector */}
          <div
            className="hidden sm:flex items-center gap-0.5 rounded-full border border-white/15 bg-white/[0.06] p-1 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
            role="group"
            aria-label="Filter discovery stream"
          >
            {(
              [
                { id: 'all', label: 'Random' },
                { id: 'woman', label: 'Girls' },
                { id: 'man', label: 'Boys' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleChangeDeckFilter(opt.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  deckFilter === opt.id
                    ? 'bg-gradient-to-r from-fuchsia-500/80 via-rose-500/80 to-amber-500/80 text-white shadow-[0_4px_14px_rgba(244,114,182,0.35)]'
                    : 'text-white/65 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              if (!requireAccount()) return;
              setActiveModal({ type: 'unlock-premium' });
            }}
            className={`glass-3d-button inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 ${
              premiumStatus === 'active'
                ? 'border-amber-300/65 bg-gradient-to-r from-amber-400/30 via-rose-500/25 to-amber-300/30 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.35)]'
                : 'border-amber-300/40 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-fuchsia-500/20 text-amber-200'
            }`}
          >
            <Crown className="h-4 w-4 text-amber-300 shrink-0" aria-hidden="true" />
            <span className="hidden lg:inline">
              {premiumStatus === 'active'
                ? 'Premium VIP'
                : premiumStatus === 'pending'
                  ? 'Pending Approval'
                  : 'Unlock Premium'}
            </span>
          </button>

          {/* Create Account / Signed-in User Profile */}
          <button
            type="button"
            data-create-account-trigger="true"
            onClick={() => setActiveModal({ type: 'create-account' })}
            aria-label={userAccount ? `Account: ${userAccount.name}` : 'Create Account'}
            title={
              userAccount
                ? `${userAccount.name} (@${userAccount.username})`
                : 'Create Account / Login'
            }
            className="glass-3d-button inline-flex items-center gap-2 rounded-full border-sky-300/35 bg-gradient-to-r from-indigo-500/25 via-fuchsia-500/20 to-sky-400/25 px-3 py-1.5 text-xs sm:text-sm font-semibold text-white whitespace-nowrap shrink-0"
          >
            {userAccount ? (
              <>
                <MemberAvatar
                  name={userAccount.name}
                  avatarUrl={userAccount.avatarUrl}
                  sizeClass="h-6 w-6"
                  textSizeClass="text-[9px]"
                />
                <div className="hidden md:flex flex-col items-start leading-tight text-left">
                  <span className="text-xs font-semibold text-white">{userAccount.name}</span>
                  <span className="font-mono-id text-[10px] text-fuchsia-200/85">
                    @{userAccount.username}
                  </span>
                </div>
              </>
            ) : (
              <>
                <UserRound className="h-4 w-4 text-sky-300 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">Create Account</span>
              </>
            )}
          </button>

          {/* Header Inbox Button (popups drop vertically underneath) */}
          <button
            type="button"
            onClick={() => {
              if (!requireAccount()) return;
              setIsCountryMenuOpen(false);
              if (activeChatId && !isChatMinimized) {
                setIsChatMinimized(true);
                setIsInboxOpen(true);
              } else {
                setIsInboxOpen((v) => !v);
              }
            }}
            aria-expanded={isInboxOpen}
            aria-label="Open Messenger Inbox"
            className="glass-3d-button relative inline-flex items-center gap-1.5 rounded-full border-white/20 bg-gradient-to-r from-rose-500/85 via-fuchsia-500/80 to-amber-500/85 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_10px_28px_rgba(244,63,94,0.36)] whitespace-nowrap shrink-0"
          >
            <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Inbox</span>
            {totalUnread > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-rose-600 tabular-nums">
                {totalUnread}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Three-Column Balanced Grid */}
      <main
        id="discover"
        className="relative z-10 mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 pb-12 pt-2 sm:px-8 lg:grid-cols-12 lg:items-start"
      >
        {/* Left Column: Live Room Activity + Member Impressions */}
        <div className="order-2 flex flex-col gap-5 lg:order-1 lg:col-span-4">
          <FloatingRoomActivity
            activities={roomActivities}
            onJoinRoom={(roomId) => handleOpenLounges(roomId)}
          />
          <LeftColumnImpressions
            reviews={reviews}
            onSubmitOpinion={handleAddOpinion}
            onRequireAccount={requireAccount}
          />
        </div>

        {/* Center Column: Global Discovery Portrait Card */}
        <div className="order-1 lg:order-2 lg:col-span-4">
          <DiscoveryPortraitCard
            profile={currentProfile}
            direction={slideDirection}
            onPauseChange={setIsCardPaused}
            onPass={handleManualPass}
            onNext={handleManualNext}
            onMessage={handleMessageProfile}
            isFavourite={isCurrentFavourite}
            onToggleFavourite={handleToggleFavourite}
            sparkFeedback={sparkFeedback}
          />
        </div>

        {/* Right Column: Live Global Lounges (Scrollable) + Your Favourites */}
        <div className="order-3 lg:col-span-4">
          <RightColumnCards
            deckFilter={deckFilter}
            onChangeDeckFilter={handleChangeDeckFilter}
            lounges={lounges}
            favourites={favourites}
            onToggleFavourite={handleToggleFavourite}
            onMessageProfile={handleMessageProfile}
            onOpenLiveLounges={(roomId) => handleOpenLounges(roomId)}
          />
        </div>
      </main>

      {/* Fast Global Live Lounges Modal */}
      <LiveLoungesModal
        isOpen={isLoungesModalOpen}
        onClose={handleCloseLounges}
        lounges={lounges}
        activeRoomId={activeLoungeId}
        onSelectRoom={handleSwitchLoungeRoom}
        messagesByRoom={loungeMessagesByRoom}
        onPostMessage={handlePostLoungeMessage}
        onStartDirectChat={(member) => {
          if (!requireAccount()) return;
          openOrCreateThreadAndFocus(member);
          handleCloseLounges();
        }}
        allMembers={GLOBAL_LOUNGE_MEMBERS}
      />

      {/* Action Modals */}
      <ActionModals
        modal={activeModal}
        onClose={() => setActiveModal(null)}
        onSwitchToPremium={(reason) => setActiveModal({ type: 'unlock-premium', reason })}
        favourites={favourites}
        onToggleFavourite={handleToggleFavourite}
        onMessageProfile={handleMessageProfile}
        onSendMatchDateInvite={(profile, inviteText) => {
          handleMessageProfile(profile);
          void handleSendDirectMessage(profile.memberId, inviteText);
        }}
        userAccount={userAccount}
        registeredAccounts={registeredAccounts}
        onSignUp={handleSignUp}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onUpdateAvatar={handleUpdateAvatar}
        premiumStatus={premiumStatus}
        submittedTxId={submittedTxId}
        onSubmitPremiumPayment={handleSubmitPremiumPayment}
        onNonPremiumCallCutoff={handleNonPremiumCallCutoff}
      />

      {/* Top-Right Vertical Messenger Popups (under header Inbox) */}
      <MessengerWidget
        threads={threads}
        activeChatId={activeChatId}
        isChatMinimized={isChatMinimized}
        isInboxOpen={isInboxOpen}
        chatError={chatError}
        isFreeMessageLimitReached={
          premiumStatus !== 'active' &&
          Boolean(
            activeChatId &&
              (threads.find((t) => t.memberId === activeChatId)?.blockedUntilPremium ||
                (freeMessagesByMember[activeChatId] ?? 0) >= 5)
          )
        }
        incomingPopup={incomingPopup}
        onDismissIncomingPopup={() => setIncomingPopup(null)}
        onUnlockPremium={() => {
          const lockedName =
            threads.find((t) => t.memberId === activeChatId)?.name ?? 'this member';
          setActiveModal({
            type: 'unlock-premium',
            reason: `You have used all 5 free messages with ${lockedName}. Unlock Honey Chat Premium ($15 USDT / month) to continue messaging and calling.`,
          });
        }}
        onCloseInbox={() => setIsInboxOpen(false)}
        onOpenChat={handleOpenChatById}
        onBackToInbox={() => {
          setActiveChatId(null);
          setIsInboxOpen(true);
        }}
        onCloseChat={() => setActiveChatId(null)}
        onToggleMinimizeChat={() => setIsChatMinimized((v) => !v)}
        onDismissChatHead={(memberId) =>
          setThreads((prev) =>
            prev.map((t) =>
              t.memberId === memberId ? { ...t, dismissedHead: true } : t
            )
          )
        }
        onSendMessage={handleSendDirectMessage}
        onStartVoiceCall={(thread) => handleCallAttempt('voice', thread)}
        onStartVideoCall={(thread) => handleCallAttempt('video', thread)}
      />
    </div>
  );
}
