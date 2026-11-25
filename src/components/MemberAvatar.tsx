import { useState } from 'react';

interface MemberAvatarProps {
  name: string;
  avatarUrl?: string;
  sizeClass?: string;
  textSizeClass?: string;
  isOnline?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'HC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function MemberAvatar({
  name,
  avatarUrl,
  sizeClass = 'h-10 w-10',
  textSizeClass = 'text-xs',
  isOnline,
}: MemberAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`relative shrink-0 rounded-full ${sizeClass}`}>
      {avatarUrl && !imgFailed ? (
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full rounded-full object-cover ring-1 ring-white/20"
        />
      ) : (
        <div
          aria-label={name}
          className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-rose-500/80 via-fuchsia-600/75 to-amber-500/80 font-semibold text-white ring-1 ring-white/20 ${textSizeClass}`}
        >
          {getInitials(name)}
        </div>
      )}
      {isOnline && (
        <span
          aria-label="Online"
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0E091A]"
        />
      )}
    </div>
  );
}
