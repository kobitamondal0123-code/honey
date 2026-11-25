import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  Heart,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Profile } from '../types/honey';
import { MemberAvatar } from './MemberAvatar';

interface DiscoveryPortraitCardProps {
  profile: Profile;
  direction: 1 | -1;
  onPauseChange: (paused: boolean) => void;
  onPass: () => void;
  onNext: () => void;
  onMessage: (profile: Profile) => void;
  isFavourite: boolean;
  onToggleFavourite: (profile: Profile) => void;
  sparkFeedback: string | null;
}

export function DiscoveryPortraitCard({
  profile,
  direction,
  onPauseChange,
  onPass,
  onNext,
  onMessage,
  isFavourite,
  onToggleFavourite,
  sparkFeedback,
}: DiscoveryPortraitCardProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [profile.id]);

  const avatarMode = profile.avatarMode ?? 'photo';

  return (
    <section
      aria-label="Global discovery card"
      className="premium-card-shine relative overflow-hidden rounded-3xl border border-white/15 bg-[#120D1F] shadow-[0_28px_75px_rgba(0,0,0,0.65)]"
      onMouseEnter={() => onPauseChange(true)}
      onMouseLeave={() => onPauseChange(false)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={profile.id}
            initial={{
              opacity: 0,
              scale: 0.94,
              x: direction * 54,
              filter: 'blur(6px)',
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              x: direction * -54,
              filter: 'blur(6px)',
            }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {avatarMode === 'photo' && !imgError ? (
              <img
                src={profile.portraitUrl}
                alt={`${profile.name} from ${profile.city}, ${profile.country}`}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.03]"
              />
            ) : avatarMode === 'login-avatar' ? (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1C1232] via-[#120C21] to-[#281326] p-8 text-center">
                <div className="rounded-full bg-gradient-to-tr from-amber-400/35 via-rose-500/35 to-fuchsia-500/35 p-2 shadow-[0_0_50px_rgba(244,114,182,0.28)]">
                  <MemberAvatar
                    name={profile.name}
                    sizeClass="h-32 w-32"
                    textSizeClass="text-4xl"
                    isOnline={profile.isOnline}
                  />
                </div>
                <p className="mt-5 text-xs font-medium text-white/60">
                  Member Avatar Profile
                </p>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#181228] via-[#100B1C] to-[#1D1226] p-8 text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white/45 shadow-inner">
                  <UserRound className="h-14 w-14" aria-hidden="true" />
                </div>
                <p className="mt-4 text-xs font-medium text-white/55">
                  No profile photo uploaded
                </p>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080510] via-[#080510]/38 to-black/15" />
          </motion.div>
        </AnimatePresence>

        {/* Top Row: #2 Globe Icon + Country Name (left) + Favourite Heart (right) */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 sm:p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={profile.country}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25 }}
              aria-label={`From ${profile.country}`}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3.5 text-xs font-semibold text-white backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
            >
              <Globe2 className="h-4 w-4 text-amber-300 shrink-0" aria-hidden="true" />
              <span>{profile.country}</span>
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={() => onToggleFavourite(profile)}
            aria-label={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
            className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all ${
              isFavourite
                ? 'border-rose-400/70 bg-rose-500/35 text-rose-200'
                : 'border-white/20 bg-black/35 text-white/80 hover:border-white/40 hover:text-white'
            }`}
          >
            <Heart
              className={`h-4 w-4 ${isFavourite ? 'fill-rose-400 text-rose-300' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* #3 Left Edge & #4 Right Edge Next/Previous Buttons */}
        <button
          type="button"
          onClick={onPass}
          aria-label="Previous profile"
          className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/90 backdrop-blur-xl transition-all hover:border-amber-300/60 hover:bg-black/65 hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label="Next profile"
          className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/90 backdrop-blur-xl transition-all hover:border-amber-300/60 hover:bg-black/65 hover:scale-105 active:scale-95"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Transient Favourite Feedback Banner */}
        <AnimatePresence>
          {sparkFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute inset-x-5 top-16 z-20 rounded-xl border border-amber-300/40 bg-[#140E22]/90 px-4 py-2 text-center text-xs font-semibold text-amber-200 backdrop-blur-xl shadow-lg"
            >
              {sparkFeedback}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Identity & Clean Message CTA */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6">
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              {profile.name}
            </h1>
            {profile.verified && (
              <ShieldCheck
                className="h-4 w-4 text-amber-300 shrink-0 self-center"
                aria-label="Verified member"
              />
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-white/80">
            <span>
              {profile.city}, {profile.country}
            </span>
            <span aria-hidden="true">·</span>
            <span>Speaks {profile.nativeLanguage}</span>
          </div>

          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-white/85">
            “{profile.flirtyPromptLine}”
          </p>

          <div className="mt-4 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onMessage(profile)}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(244,63,94,0.38)] transition-all hover:brightness-110 active:scale-[0.98] whitespace-nowrap"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Message</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
