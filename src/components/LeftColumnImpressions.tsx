import { useState, type FormEvent } from 'react';
import { Radio, Send, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { LiveReview } from '../types/honey';

interface LeftColumnImpressionsProps {
  reviews: LiveReview[];
  onSubmitOpinion: (opinionText: string, rating: number) => void;
  onRequireAccount: () => boolean;
}

export function LeftColumnImpressions({
  reviews,
  onSubmitOpinion,
  onRequireAccount,
}: LeftColumnImpressionsProps) {
  const [opinionInput, setOpinionInput] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [posted, setPosted] = useState(false);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 5;
  const roundedAvg = Math.round(avgRating);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!onRequireAccount()) return;
    const trimmed = opinionInput.trim();
    if (!trimmed) return;
    onSubmitOpinion(trimmed, selectedRating);
    setOpinionInput('');
    setSelectedRating(5);
    setPosted(true);
    window.setTimeout(() => setPosted(false), 2000);
  };

  return (
    <section
      aria-label="Live website reviews"
      className="premium-card-shine rounded-3xl border border-white/15 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
          <h2 className="font-editorial text-xl font-semibold text-white">
            Live Website Reviews
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center gap-0.5"
            aria-label={`Average rating ${avgRating.toFixed(1)} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i <= roundedAvg
                    ? 'fill-amber-300 text-amber-300'
                    : 'text-white/20'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="font-mono-id text-[11px] font-semibold text-amber-200 tabular-nums">
            {avgRating.toFixed(1)}
          </span>
          <span className="text-[11px] font-medium text-emerald-300">Live</span>
        </div>
      </div>

      {/* Animated Live Review Stream (locked height so new reviews never push the form below down) */}
      <div className="honey-scroll relative mt-3 flex h-52 flex-col gap-2.5 overflow-y-auto overflow-x-hidden pr-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {reviews.slice(0, 6).map((rev) => (
            <motion.div
              key={rev.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-2xl border px-3 py-2.5 ${
                rev.rating <= 2
                  ? 'border-rose-400/20 bg-rose-500/[0.045]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-xs font-semibold text-white">
                    {rev.reviewerName}
                  </span>
                  <span className="truncate text-[11px] text-white/50">
                    · {rev.city}, {rev.country}
                  </span>
                </div>
                <span className="text-[10px] text-white/45 shrink-0">{rev.timestamp}</span>
              </div>

              <div className="mt-1 flex items-center gap-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <Star
                      key={starIdx}
                      className={`h-2.5 w-2.5 ${
                        starIdx <= rev.rating
                          ? rev.rating <= 2
                            ? 'fill-rose-400 text-rose-400'
                            : 'fill-amber-300 text-amber-300'
                          : 'text-white/20'
                      }`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="font-mono-id text-[10px] text-white/55 tabular-nums">
                  {rev.rating}.0
                </span>
              </div>

              <p className="mt-1 text-xs leading-relaxed text-white/80">
                {rev.comment}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Give Your Review Form (Rating + Comment + Post) */}
      <form onSubmit={handleSubmit} className="mt-3.5 space-y-2 border-t border-white/10 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-white/65">
            Rate Honey Chat:
          </span>
          <div className="flex items-center gap-1" role="group" aria-label="Select star rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                aria-label={`Rate ${star} stars`}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-3.5 w-3.5 ${
                    star <= selectedRating
                      ? 'fill-amber-300 text-amber-300'
                      : 'text-white/25'
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={opinionInput}
            onChange={(e) => setOpinionInput(e.target.value)}
            placeholder="Write a live review..."
            className="h-9 flex-1 rounded-full border border-white/15 bg-white/[0.06] px-3.5 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-3.5 text-xs font-semibold text-white hover:brightness-110 shrink-0"
          >
            <Send className="h-3 w-3" aria-hidden="true" />
            <span>{posted ? 'Posted!' : 'Post'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
