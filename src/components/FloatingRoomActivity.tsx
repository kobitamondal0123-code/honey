import { Radio } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { RoomActivityPopup } from '../types/honey';
import { MemberAvatar } from './MemberAvatar';

interface FloatingRoomActivityProps {
  activities: RoomActivityPopup[];
  onJoinRoom: (roomId: string) => void;
}

export function FloatingRoomActivity({
  activities,
  onJoinRoom,
}: FloatingRoomActivityProps) {
  return (
    <section
      aria-label="Live room arrivals"
      className="premium-card-shine rounded-3xl border border-white/15 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-2xl"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/90">
            Live Room Activity
          </h2>
        </div>
        <span className="text-[11px] font-medium text-emerald-300">Live</span>
      </div>

      <div className="relative flex h-[288px] flex-col gap-2 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {activities.slice(0, 5).map((item) => (
            <motion.button
              key={item.id}
              layout
              initial={{ opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              type="button"
              onClick={() => onJoinRoom(item.roomId)}
              className="flex w-full shrink-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-amber-300/35 hover:bg-white/[0.06]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <MemberAvatar
                  name={item.memberName}
                  avatarUrl={item.avatarUrl}
                  sizeClass="h-8 w-8"
                  textSizeClass="text-[10px]"
                  isOnline
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white">
                    {item.memberName}{' '}
                    <span className="text-white/55">joined</span>{' '}
                    <span className="text-amber-200">{item.roomName}</span>
                  </p>
                  <p className="truncate text-[11px] text-white/50">
                    {item.city}, {item.country} · {item.timestamp}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
