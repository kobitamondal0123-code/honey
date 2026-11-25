import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  CheckCheck,
  ChevronLeft,
  Crown,
  Minus,
  Phone,
  Send,
  ShieldCheck,
  Video,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ChatThread } from '../types/honey';
import { MemberAvatar } from './MemberAvatar';

export interface IncomingSmsPopup {
  id: string;
  memberId: string;
  name: string;
  age?: number;
  city: string;
  country: string;
  avatarUrl?: string;
  verified?: boolean;
  text: string;
}

interface MessengerWidgetProps {
  threads: ChatThread[];
  activeChatId: string | null;
  isChatMinimized: boolean;
  isInboxOpen: boolean;
  chatError: string | null;
  isFreeMessageLimitReached: boolean;
  incomingPopup: IncomingSmsPopup | null;
  onDismissIncomingPopup: () => void;
  onUnlockPremium: () => void;
  onCloseInbox: () => void;
  onOpenChat: (memberId: string) => void;
  onBackToInbox: () => void;
  onCloseChat: () => void;
  onToggleMinimizeChat: () => void;
  onDismissChatHead: (memberId: string) => void;
  onSendMessage: (memberId: string, text: string) => Promise<void> | void;
  onStartVoiceCall: (thread: ChatThread) => void;
  onStartVideoCall: (thread: ChatThread) => void;
}

export function MessengerWidget({
  threads,
  activeChatId,
  isChatMinimized,
  isInboxOpen,
  chatError,
  isFreeMessageLimitReached,
  incomingPopup,
  onDismissIncomingPopup,
  onUnlockPremium,
  onCloseInbox,
  onOpenChat,
  onBackToInbox,
  onCloseChat,
  onToggleMinimizeChat,
  onDismissChatHead,
  onSendMessage,
  onStartVoiceCall,
  onStartVideoCall,
}: MessengerWidgetProps) {
  const [draft, setDraft] = useState('');
  const [showProfileCard, setShowProfileCard] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeThread = threads.find((t) => t.memberId === activeChatId) ?? null;
  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  const floatingHeads = threads
    .filter(
      (t) =>
        !t.dismissedHead &&
        ((t.memberId === activeChatId && isChatMinimized) ||
          (t.memberId !== activeChatId && t.unreadCount > 0))
    )
    .slice(0, 4);

  useEffect(() => {
    setShowProfileCard(false);
  }, [activeChatId]);

  useEffect(() => {
    if (!activeThread || isChatMinimized) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread, activeThread?.messages.length, activeThread?.typing, isChatMinimized]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activeThread) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    void onSendMessage(activeThread.memberId, trimmed);
    setDraft('');
  };

  return (
    <div className="pointer-events-none fixed right-4 top-[76px] z-40 flex max-h-[calc(100vh-92px)] flex-col items-end gap-2.5 sm:right-8">
      {/* Active Chat Popup (drops down vertically below header Inbox) */}
      <AnimatePresence>
        {activeThread && !isChatMinimized && (
          <motion.section
            key={`chat-${activeThread.memberId}`}
            initial={{ opacity: 0, y: -18, scale: 0.94, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, scale: 0.94, filter: 'blur(6px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            aria-label={`Chat with ${activeThread.name}`}
            className="pointer-events-auto flex h-[min(460px,calc(100vh-140px))] w-[min(92vw,380px)] origin-top-right flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#120D1F]/95 shadow-[0_24px_70px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
          >
          <header className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={onBackToInbox}
                aria-label="Back to inbox"
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white shrink-0"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setShowProfileCard((s) => !s)}
                title="View member profile"
                className="flex min-w-0 items-center gap-2.5 text-left hover:opacity-90"
              >
                <MemberAvatar
                  name={activeThread.name}
                  avatarUrl={activeThread.avatarUrl}
                  sizeClass="h-9 w-9"
                  textSizeClass="text-[11px]"
                  isOnline={activeThread.isOnline}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-xs font-semibold text-white">
                      {activeThread.name}
                      {activeThread.age ? `, ${activeThread.age}` : ''}
                    </p>
                    {activeThread.verified && (
                      <ShieldCheck
                        className="h-3.5 w-3.5 text-amber-300 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <p className="truncate text-[11px] text-white/60">
                    {activeThread.typing
                      ? 'Typing...'
                      : `${activeThread.city}, ${activeThread.country} · ${
                          activeThread.isOnline ? 'Active now' : activeThread.lastActiveText
                        }`}
                  </p>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onStartVoiceCall(activeThread)}
                aria-label="Start voice call"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-amber-300"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onStartVideoCall(activeThread)}
                aria-label="Start video call"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-amber-300"
              >
                <Video className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onToggleMinimizeChat}
                aria-label="Minimize chat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onCloseChat}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Expandable Profile Details Card inside Messenger */}
          <AnimatePresence>
            {showProfileCard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-b border-white/10 bg-white/[0.04] px-4 py-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <MemberAvatar
                    name={activeThread.name}
                    avatarUrl={activeThread.avatarUrl}
                    sizeClass="h-12 w-12"
                    isOnline={activeThread.isOnline}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {activeThread.name}
                      {activeThread.age ? `, ${activeThread.age}` : ''} · @{activeThread.username}
                    </p>
                    <p className="text-[11px] text-amber-200/85">
                      {activeThread.city}, {activeThread.country} · Speaks {activeThread.nativeLanguage}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-white/75">
                  {activeThread.bio}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="honey-scroll flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            {activeThread.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <MemberAvatar
                  name={activeThread.name}
                  avatarUrl={activeThread.avatarUrl}
                  sizeClass="h-14 w-14"
                  isOnline={activeThread.isOnline}
                />
                <p className="mt-3 text-xs font-semibold text-white">
                  {activeThread.name}
                  {activeThread.age ? `, ${activeThread.age}` : ''}
                </p>
                <p className="mt-0.5 text-[11px] text-white/55">
                  {activeThread.city}, {activeThread.country} · Speaks {activeThread.nativeLanguage}
                </p>
                <p className="mt-3 text-xs text-white/50">
                  No messages yet. Say hello to start chatting.
                </p>
              </div>
            ) : (
              activeThread.messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      msg.sender === 'me'
                        ? 'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-white'
                        : 'border border-white/10 bg-white/[0.06] text-white/90'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.translation && (
                      <p className="mt-1 border-t border-white/15 pt-1 text-[11px] italic text-amber-200/85">
                        {msg.translation}
                      </p>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-white/45">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'me' && msg.seen && (
                      <span className="inline-flex items-center gap-0.5 text-amber-200/80">
                        <CheckCheck className="h-3 w-3" aria-hidden="true" />
                        Seen
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}

            {activeThread.typing && (
              <div className="flex items-start">
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs italic text-white/70">
                  Typing...
                </div>
              </div>
            )}

            {chatError && (
              <div className="rounded-xl border border-rose-400/35 bg-rose-500/15 px-3 py-2 text-[11px] text-rose-200">
                {chatError}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {isFreeMessageLimitReached ? (
            <div className="border-t border-amber-300/25 bg-amber-500/10 p-3 text-center">
              <p className="text-[11px] text-amber-100/90">
                Free 5-message limit reached for {activeThread.name.split(' ')[0]}.
              </p>
              <button
                type="button"
                onClick={onUnlockPremium}
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 py-2 text-xs font-semibold text-white shadow-md hover:brightness-110"
              >
                <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Unlock Premium ($15 USDT / mo)</span>
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-white/10 bg-white/[0.02] px-3 py-2.5"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${activeThread.name.split(' ')[0]}...`}
                className="h-9 flex-1 rounded-full border border-white/15 bg-white/[0.06] px-3.5 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Send message"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white transition-all hover:brightness-110 shrink-0"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </form>
          )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Inbox Drawer (drops down vertically below header Inbox) */}
      <AnimatePresence>
        {isInboxOpen && (
          <motion.section
            key="messenger-inbox-drawer"
            initial={{ opacity: 0, y: -18, scale: 0.94, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -14, scale: 0.95, filter: 'blur(6px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Messages inbox"
            className="pointer-events-auto flex max-h-[min(460px,calc(100vh-140px))] w-[min(92vw,365px)] origin-top-right flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#120D1F]/95 shadow-[0_24px_70px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <div>
                <h2 className="font-editorial text-xl font-semibold text-white">
                  Messages
                </h2>
                <p className="text-[11px] text-white/55">
                  {threads.length} conversations · {totalUnread} unread
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseInbox}
                aria-label="Close inbox"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="honey-scroll flex-1 divide-y divide-white/8 overflow-y-auto">
              {threads.length === 0 ? (
                <p className="p-6 text-center text-xs text-white/55">
                  No messages yet. New messages from online members will appear here shortly.
                </p>
              ) : (
                threads.map((t) => {
                  const last = t.messages[t.messages.length - 1];
                  return (
                    <button
                      key={t.memberId}
                      type="button"
                      onClick={() => onOpenChat(t.memberId)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.05]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <MemberAvatar
                          name={t.name}
                          avatarUrl={t.avatarUrl}
                          sizeClass="h-11 w-11"
                          isOnline={t.isOnline}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="truncate text-xs font-semibold text-white">
                              {t.name}
                              {t.age ? `, ${t.age}` : ''}
                            </p>
                            {t.verified && (
                              <ShieldCheck
                                className="h-3 w-3 text-amber-300 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          <p className="truncate text-[10px] text-amber-200/75">
                            {t.city}, {t.country} · {t.nativeLanguage}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-white/65">
                            {t.typing
                              ? 'Typing...'
                              : last?.text ?? 'Tap to start chatting'}
                          </p>
                        </div>
                      </div>
                      {t.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white tabular-nums shrink-0">
                          {t.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Minimized / Unread Chat Heads stacked vertically underneath */}
      <AnimatePresence>
        {floatingHeads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pointer-events-auto flex flex-col items-end gap-2"
          >
            {floatingHeads.map((head) => (
              <motion.div
                key={head.memberId}
                initial={{ opacity: 0, scale: 0.75, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75, y: -8 }}
                transition={{ duration: 0.25 }}
                className="group relative"
              >
                <button
                  type="button"
                  onClick={() => onOpenChat(head.memberId)}
                  title={`${head.name} (${head.city}, ${head.country})`}
                  className="relative flex items-center gap-2 rounded-full border border-white/15 bg-[#120D1F]/90 p-1 pr-3 shadow-xl backdrop-blur-xl transition-transform hover:scale-[1.03]"
                >
                  <MemberAvatar
                    name={head.name}
                    avatarUrl={head.avatarUrl}
                    sizeClass="h-9 w-9"
                    textSizeClass="text-[10px]"
                    isOnline={head.isOnline}
                  />
                  <span className="max-w-[110px] truncate text-xs font-medium text-white/90">
                    {head.name}
                  </span>
                  {head.unreadCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white tabular-nums">
                      {head.unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDismissChatHead(head.memberId)}
                  aria-label={`Dismiss ${head.name} bubble`}
                  className="absolute -left-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#1C142D] text-[10px] text-white/80 ring-1 ring-white/25 group-hover:flex"
                >
                  <X className="h-2.5 w-2.5" aria-hidden="true" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming SMS Notification Popup (drops down vertically below header Inbox) */}
      <AnimatePresence>
        {incomingPopup &&
          !isInboxOpen &&
          !(
            activeThread &&
            !isChatMinimized &&
            activeThread.memberId === incomingPopup.memberId
          ) && (
            <motion.div
              key={incomingPopup.id}
              initial={{ opacity: 0, y: -14, scale: 0.94, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, scale: 0.94, filter: 'blur(6px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              role="status"
              aria-live="polite"
              className="pointer-events-auto w-[min(92vw,345px)] origin-top-right overflow-hidden rounded-2xl border border-amber-300/35 bg-[#161028]/95 p-3.5 shadow-[0_20px_55px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onDismissIncomingPopup();
                    onOpenChat(incomingPopup.memberId);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <MemberAvatar
                    name={incomingPopup.name}
                    avatarUrl={incomingPopup.avatarUrl}
                    sizeClass="h-11 w-11"
                    isOnline
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <p className="truncate text-xs font-semibold text-white">
                        {incomingPopup.name}
                        {incomingPopup.age ? `, ${incomingPopup.age}` : ''}
                      </p>
                      {incomingPopup.verified && (
                        <ShieldCheck
                          className="h-3 w-3 text-amber-300 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="truncate text-[10px] text-amber-200/80">
                      {incomingPopup.city}, {incomingPopup.country} · New Message
                    </p>
                    <p className="mt-1 truncate text-xs text-white/90">
                      “{incomingPopup.text}”
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onDismissIncomingPopup}
                  aria-label="Dismiss incoming message notification"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white shrink-0"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
