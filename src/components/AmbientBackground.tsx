export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#07040f]"
    >
      {/* Layered Drifting Aurora Ribbons */}
      <div className="animate-aurora absolute -top-44 left-[14%] h-[620px] w-[620px] rounded-full bg-rose-500/18 blur-[155px]" />
      <div className="animate-aurora-reverse absolute top-[18%] -right-32 h-[560px] w-[560px] rounded-full bg-amber-400/15 blur-[155px]" />
      <div className="animate-aurora absolute -bottom-40 left-[6%] h-[540px] w-[540px] rounded-full bg-fuchsia-600/18 blur-[155px]" />
      <div className="animate-aurora-reverse absolute bottom-[10%] right-[18%] h-[420px] w-[420px] rounded-full bg-indigo-500/14 blur-[140px]" />

      {/* Center Champagne & Rose Velvet Wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(253,224,171,0.065),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(244,63,94,0.06),transparent_62%)]" />

      {/* Subtle Masked Architectural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_38%,transparent_82%)]" />

      {/* Slow-Rotating Luminous Orbital Halo */}
      <div className="animate-slow-spin absolute left-1/2 top-1/2 h-[980px] w-[980px] rounded-full border border-amber-200/[0.045] shadow-[0_0_90px_rgba(251,191,36,0.04)]">
        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-300/45 shadow-[0_0_14px_rgba(251,191,36,0.85)]" />
        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-rose-400/45 shadow-[0_0_14px_rgba(244,63,94,0.85)]" />
      </div>

      {/* Drifting Champagne & Rose Light Motes */}
      <span className="animate-mote-1 absolute left-[12%] top-[24%] h-1.5 w-1.5 rounded-full bg-amber-200/55 shadow-[0_0_12px_rgba(253,230,138,0.8)]" />
      <span className="animate-mote-2 absolute left-[28%] top-[72%] h-2 w-2 rounded-full bg-rose-300/45 shadow-[0_0_14px_rgba(253,164,175,0.75)]" />
      <span className="animate-mote-3 absolute right-[16%] top-[32%] h-1.5 w-1.5 rounded-full bg-amber-300/50 shadow-[0_0_12px_rgba(252,211,77,0.8)]" />
      <span className="animate-mote-1 absolute right-[24%] bottom-[22%] h-2 w-2 rounded-full bg-fuchsia-300/40 shadow-[0_0_14px_rgba(240,171,252,0.7)]" />
      <span className="animate-mote-2 absolute left-[52%] top-[14%] h-1.5 w-1.5 rounded-full bg-amber-100/50 shadow-[0_0_10px_rgba(254,243,199,0.75)]" />
    </div>
  );
}
