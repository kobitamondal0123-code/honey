import { Globe2, Heart, MessageCircle, Users, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { DeckFilter, LoungeRoom, Profile } from '../types/honey';
import { MemberAvatar } from './MemberAvatar';

interface RightColumnCardsProps {
  deckFilter: DeckFilter;
  onChangeDeckFilter: (filter: DeckFilter) => void;
  lounges: LoungeRoom[];
  favourites: Profile[];
  onToggleFavourite: (profile: Profile) => void;
  onMessageProfile: (profile: Profile) => void;
  onOpenLiveLounges: (roomId?: string) => void;
}

export function RightColumnCards({
  deckFilter,
  onChangeDeckFilter,
  lounges,
  favourites,
  onToggleFavourite,
  onMessageProfile,
  onOpenLiveLounges,
}: RightColumnCardsProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Mobile Quick Stream Filter */}
      <div className="flex sm:hidden items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-2">
        <span className="pl-2 text-xs font-medium text-white/70">Discovery</span>
        <div className="flex items-center gap-1" role="group" aria-label="Filter stream">
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
              onClick={() => onChangeDeckFilter(opt.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                deckFilter === opt.id
                  ? 'bg-gradient-to-r from-fuchsia-500/80 to-amber-500/80 text-white'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* #1 Live Global Lounges (More Rooms + Scrollable Container) */}
      <motion.section
        aria-label="Live global lounges"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="premium-card-shine rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-rose-500/[0.04] p-5 backdrop-blur-2xl shadow-[0_24px_65px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-editorial text-2xl font-semibold tracking-tight text-white">
              Live Global Lounges
            </h2>
            <p className="mt-0.5 text-xs text-white/60">
              Scroll to enter any live city room
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenLiveLounges()}
            className="glass-3d-button inline-flex items-center gap-1.5 rounded-full border-amber-300/45 bg-gradient-to-r from-amber-500/25 via-rose-500/20 to-fuchsia-500/25 px-3.5 py-1.5 text-xs font-semibold text-amber-100 whitespace-nowrap shrink-0"
          >
            <Globe2 className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
            <span>{lounges.length} Rooms</span>
          </button>
        </div>

        {/* Scrollable Room List */}
        <div className="honey-scroll mt-4 flex max-h-[320px] flex-col gap-2.5 overflow-y-auto pr-1">
          {lounges.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => onOpenLiveLounges(room.id)}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left transition-all hover:border-amber-300/45 hover:bg-white/[0.07]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">
                  {room.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/55">
                  {room.city}, {room.country} · {room.language}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 tabular-nums shrink-0">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                {room.participantCount}
              </span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* #5 Your Favourites (Live inline list: hearted profiles appear here immediately!) */}
      <motion.section
        aria-label="Your favourites"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="premium-card-shine rounded-3xl border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/[0.08] via-white/[0.035] to-transparent p-5 backdrop-blur-2xl shadow-[0_18px_45px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-400 fill-rose-400" aria-hidden="true" />
            <h2 className="font-editorial text-xl font-semibold text-white">
              Your Favourites
            </h2>
          </div>
          <span className="font-mono-id text-xs font-semibold text-rose-200 tabular-nums">
            {favourites.length}
          </span>
        </div>

        {favourites.length === 0 ? (
          <p className="mt-3 text-xs leading-relaxed text-white/55">
            Tap the heart on any discovery profile to keep them right here.
          </p>
        ) : (
          <div className="honey-scroll mt-3 flex max-h-44 flex-col gap-2 overflow-y-auto pr-1">
            {favourites.map((fav) => (
              <div
                key={fav.id}
                className="flex items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <MemberAvatar
                    name={fav.name}
                    avatarUrl={fav.avatarMode === 'photo' ? fav.portraitUrl : undefined}
                    sizeClass="h-9 w-9"
                    isOnline={fav.isOnline}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">
                      {fav.name}, {fav.age}
                    </p>
                    <p className="truncate text-[11px] text-white/55">
                      {fav.city}, {fav.country}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onMessageProfile(fav)}
                    aria-label={`Message ${fav.name}`}
                    className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-3 py-1 text-[11px] font-semibold text-white hover:brightness-110"
                  >
                    <MessageCircle className="h-3 w-3" aria-hidden="true" />
                    <span>Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleFavourite(fav)}
                    aria-label={`Remove ${fav.name} from favourites`}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/5 text-rose-300 hover:bg-rose-500/20"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
