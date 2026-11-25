import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Globe2, MessageCircle, Send, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { LoungeMember, LoungeMessage, LoungeRoom } from '../types/honey';
import { MemberAvatar } from './MemberAvatar';

interface LiveLoungesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lounges: LoungeRoom[];
  activeRoomId: string;
  onSelectRoom: (roomId: string) => void;
  messagesByRoom: Record<string, LoungeMessage[]>;
  onPostMessage: (roomId: string, text: string) => Promise<void> | void;
  onStartDirectChat: (member: LoungeMember) => void;
  allMembers: LoungeMember[];
}

export function LiveLoungesModal({
  isOpen,
  onClose,
  lounges,
  activeRoomId,
  onSelectRoom,
  messagesByRoom,
  onPostMessage,
  onStartDirectChat,
  allMembers,
}: LiveLoungesModalProps) {
  const [draft, setDraft] = useState('');
  const streamEndRef = useRef<HTMLDivElement | null>(null);

  const activeRoom = lounges.find((r) => r.id === activeRoomId) ?? lounges[0];
  const roomMessages = messagesByRoom[activeRoom.id] ?? [];

  useEffect(() => {
    if (!isOpen) return;
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, activeRoom.id, roomMessages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    void onPostMessage(activeRoom.id, trimmed);
    setDraft('');
  };

  const handleMemberClick = (msg: LoungeMessage) => {
    if (msg.isOwn) return;
    const matched = allMembers.find((m) => m.memberId === msg.memberId);
    if (matched) {
      onStartDirectChat(matched);
      return;
    }
    onStartDirectChat({
      memberId: msg.memberId,
      name: msg.memberName,
      username: msg.username,
      gender: msg.gender ?? 'woman',
      city: msg.city,
      country: msg.country,
      nativeLanguage: msg.nativeLanguage,
      avatarUrl: msg.avatarUrl,
      isOnline: msg.isOnline,
      bio: `Met inside ${activeRoom.name} (${activeRoom.city}).`,
      flirtyPromptLine: `Loved chatting with you in ${activeRoom.name}.`,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="live-lounges-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Global Live Lounges"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="live-lounges-dialog"
            initial={{ opacity: 0, scale: 0.93, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 16, filter: 'blur(6px)' }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#100B1C] shadow-[0_32px_90px_rgba(0,0,0,0.75)] lg:flex-row"
          >
        {/* Left Sidebar: 10 Global Lounges */}
        <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-white/[0.025] lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <h2 className="font-editorial text-xl font-semibold text-white">
                City Lounges
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close lounges"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="honey-scroll flex flex-row gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">
            {lounges.map((room) => {
              const isSelected = room.id === activeRoom.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onSelectRoom(room.id)}
                  className={`flex min-w-[190px] flex-col rounded-2xl border p-3 text-left transition-all lg:min-w-0 ${
                    isSelected
                      ? 'border-amber-300/45 bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-fuchsia-500/15'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-white">
                      {room.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-200 tabular-nums shrink-0">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      {room.participantCount}
                    </span>
                  </div>
                  <span className="mt-0.5 truncate text-[11px] text-white/55">
                    {room.city}, {room.country} · {room.language}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center: Active Topic Stream */}
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-editorial text-2xl font-semibold text-white">
                  {activeRoom.name}
                </h3>
                <span className="text-xs text-white/55">
                  · {activeRoom.city}, {activeRoom.country} · {activeRoom.language}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-amber-200/85">
                Topic: {activeRoom.topic}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close lounges"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition-colors hover:bg-white/15 hover:text-white lg:flex shrink-0"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="honey-scroll flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
            {roomMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-start gap-3 ${msg.isOwn ? 'flex-row-reverse text-right' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => handleMemberClick(msg)}
                  disabled={msg.isOwn}
                  title={msg.isOwn ? 'You' : `Message ${msg.memberName} privately`}
                  className={msg.isOwn ? 'cursor-default' : 'transition-transform hover:scale-105'}
                >
                  <MemberAvatar
                    name={msg.memberName}
                    avatarUrl={msg.avatarUrl}
                    sizeClass="h-9 w-9"
                    textSizeClass="text-[11px]"
                    isOnline={msg.isOnline}
                  />
                </button>

                <div
                  className={`max-w-[78%] rounded-2xl border px-3.5 py-2.5 ${
                    msg.isOwn
                      ? 'border-rose-400/30 bg-gradient-to-r from-rose-500/25 to-amber-500/20 text-white'
                      : 'border-white/10 bg-white/[0.04] text-white/90'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 text-[11px] ${
                      msg.isOwn ? 'justify-end' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleMemberClick(msg)}
                      disabled={msg.isOwn}
                      className={`font-semibold ${
                        msg.isOwn
                          ? 'text-amber-200 cursor-default'
                          : 'text-amber-200 hover:underline'
                      }`}
                    >
                      {msg.memberName}
                    </button>
                    <span className="text-white/45">
                      {msg.city} · {msg.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))}
            <div ref={streamEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2.5 border-t border-white/10 bg-white/[0.02] px-5 py-3.5"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Join the conversation in ${activeRoom.name}...`}
              className="h-11 flex-1 rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 px-5 text-xs sm:text-sm font-semibold text-white transition-all hover:brightness-110 whitespace-nowrap shrink-0"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Right Roster: Active Global Guests (click to DM) */}
        <aside className="hidden w-64 shrink-0 flex-col border-l border-white/10 bg-white/[0.02] xl:flex">
          <div className="border-b border-white/10 px-4 py-4">
            <h3 className="text-xs font-semibold text-white/85">
              Members Online ({allMembers.filter((m) => m.isOnline).length})
            </h3>
            <p className="mt-0.5 text-[11px] text-white/50">
              Click any member for 1-on-1 DM
            </p>
          </div>
          <div className="honey-scroll flex-1 space-y-1.5 overflow-y-auto p-3">
            {allMembers.map((member) => (
              <button
                key={member.memberId}
                type="button"
                onClick={() => onStartDirectChat(member)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-white/10 hover:bg-white/[0.05]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <MemberAvatar
                    name={member.name}
                    avatarUrl={member.avatarUrl}
                    sizeClass="h-8 w-8"
                    textSizeClass="text-[10px]"
                    isOnline={member.isOnline}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white">
                      {member.name}
                    </p>
                    <p className="truncate text-[11px] text-white/50">
                      {member.city}, {member.country}
                    </p>
                  </div>
                </div>
                <MessageCircle className="h-3.5 w-3.5 text-white/45 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
