import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowRight,
  CalendarHeart,
  Check,
  Clock,
  Copy,
  Crown,
  Heart,
  LogOut,
  MessageCircle,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PremiumStatus, Profile } from '../types/honey';
import { MemberAvatar } from './MemberAvatar';

export interface UserAccount {
  memberId: string;
  name: string;
  username: string;
  email?: string;
  password?: string;
  gender: 'woman' | 'man';
  city: string;
  country: string;
  nativeLanguage: string;
  avatarUrl?: string;
}

export type ActiveModalType =
  | { type: 'create-account'; reason?: string }
  | { type: 'unlock-premium'; reason?: string }
  | { type: 'match-date'; profile: Profile }
  | { type: 'favourite' }
  | { type: 'invite-new' }
  | {
      type: 'call';
      mode: 'voice' | 'video';
      name: string;
      username: string;
      gender: 'woman' | 'man';
      memberId: string;
      city: string;
      country: string;
      nativeLanguage: string;
      bio: string;
      avatarUrl?: string;
      greeting: string;
    }
  | null;

interface ActionModalsProps {
  modal: ActiveModalType;
  onClose: () => void;
  onSwitchToPremium: (reason?: string) => void;
  favourites: Profile[];
  onToggleFavourite: (profile: Profile) => void;
  onMessageProfile: (profile: Profile) => void;
  onSendMatchDateInvite: (profile: Profile, inviteText: string) => void;
  userAccount: UserAccount | null;
  registeredAccounts: UserAccount[];
  onSignUp: (account: UserAccount) => void;
  onLogin: (account: UserAccount) => void;
  onLogout: () => void;
  onUpdateAvatar: (avatarUrl?: string) => void;
  premiumStatus: PremiumStatus;
  submittedTxId: string | null;
  onSubmitPremiumPayment: (txId: string, amountText: string) => void;
  onNonPremiumCallCutoff: (memberId: string) => void;
}

const BINANCE_UID = '940777946';

export function ActionModals({
  modal,
  onClose,
  favourites,
  onToggleFavourite,
  onMessageProfile,
  onSendMatchDateInvite,
  userAccount,
  registeredAccounts,
  onSignUp,
  onLogin,
  onLogout,
  onUpdateAvatar,
  premiumStatus,
  submittedTxId,
  onSubmitPremiumPayment,
  onNonPremiumCallCutoff,
}: ActionModalsProps) {
  // Auth state
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'woman' | 'man'>('man');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [pendingAvatar, setPendingAvatar] = useState<string | undefined>(undefined);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Premium Payment 2-step flow (Step 1: Binance UID 940777946 -> Next -> Step 2: Transaction ID)
  const [premiumStep, setPremiumStep] = useState<'pay' | 'txid'>('pay');
  const [txIdInput, setTxIdInput] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Match Date state
  const [dateVibe, setDateVibe] = useState('Candlelit Espresso & Conversation');
  const [dateTiming, setDateTiming] = useState('Tonight · 9:30 PM');
  const [dateNote, setDateNote] = useState('');

  // Call state: Calling... -> Ringing... -> Connected
  const [callPhase, setCallPhase] = useState<'calling' | 'ringing' | 'connected'>('calling');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cutoffTriggeredRef = useRef(false);

  useEffect(() => {
    setAuthError(null);
    if (modal?.type === 'unlock-premium') {
      setPremiumStep('pay');
    }
  }, [modal, authTab]);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, onClose]);

  // Messenger-authentic call flow: Calling... (0-2.5s) -> Ringing... (2.5-6s) -> Connected
  useEffect(() => {
    if (modal?.type !== 'call') {
      setCallSeconds(0);
      setCallPhase('calling');
      setIsMuted(false);
      setIsCameraOff(false);
      cutoffTriggeredRef.current = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      return;
    }

    const ringingTimer = window.setTimeout(() => {
      setCallPhase('ringing');
    }, 2500);

    const connectTimer = window.setTimeout(() => {
      setCallPhase('connected');
    }, 6000);

    if (modal.mode === 'video' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Graceful silent fallback if camera access denied
        });
    }

    return () => {
      window.clearTimeout(ringingTimer);
      window.clearTimeout(connectTimer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [modal]);

  useEffect(() => {
    if (modal?.type !== 'call' || callPhase !== 'connected') return;
    const interval = window.setInterval(() => {
      setCallSeconds((prev) => {
        const next = prev + 1;
        if (
          premiumStatus !== 'active' &&
          next >= 15 &&
          !cutoffTriggeredRef.current
        ) {
          cutoffTriggeredRef.current = true;
          window.setTimeout(() => {
            onNonPremiumCallCutoff(modal.memberId);
          }, 50);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [modal, callPhase, premiumStatus, onNonPremiumCallCutoff]);

  const copyText = (key: string, value: string) => {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(value);
    }
    setCopiedField(key);
    window.setTimeout(() => setCopiedField(null), 1600);
  };

  const handleAvatarUpload = (
    e: ChangeEvent<HTMLInputElement>,
    applyImmediately: boolean
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : undefined;
      if (!result) return;
      if (applyImmediately) {
        onUpdateAvatar(result);
      } else {
        setPendingAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignUpSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanName || !cleanUsername || !password.trim()) {
      setAuthError('Please enter your name, username, and password.');
      return;
    }
    const exists = registeredAccounts.some(
      (a) =>
        a.username.toLowerCase() === cleanUsername ||
        (cleanEmail && a.email?.toLowerCase() === cleanEmail)
    );
    if (exists) {
      setAuthError('An account with that username or email already exists.');
      return;
    }

    const newAccount: UserAccount = {
      memberId: `HC-${1000 + Math.floor(Math.random() * 8999)}`,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail || undefined,
      password: password.trim(),
      gender,
      city: city.trim() || 'Global',
      country: country.trim() || 'Lounge',
      nativeLanguage: nativeLanguage.trim() || 'English',
      avatarUrl: pendingAvatar,
    };
    onSignUp(newAccount);
    onClose();
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    const id = loginIdentifier.trim().replace(/^@/, '').toLowerCase();
    const match = registeredAccounts.find(
      (a) =>
        (a.username.toLowerCase() === id || a.email?.toLowerCase() === id) &&
        a.password === loginPassword.trim()
    );
    if (!match) {
      setAuthError('No matching account found. Check your username/email and password.');
      return;
    }
    onLogin(match);
    onClose();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const rem = (secs % 60).toString().padStart(2, '0');
    return `${mins}:${rem}`;
  };

  const inviteLink = `https://honeychat.app/invite/${userAccount?.memberId ?? 'HC-VIP88'}`;

  const callStatusLabel =
    callPhase === 'calling'
      ? 'Calling...'
      : callPhase === 'ringing'
        ? 'Ringing...'
        : formatTimer(callSeconds);

  return (
    <AnimatePresence>
      {modal && (
        <motion.div
          key="action-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && modal.type !== 'call') onClose();
          }}
        >
          <motion.div
            key={modal.type}
            initial={{ opacity: 0, scale: 0.92, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.94, y: 16, filter: 'blur(6px)' }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="flex w-full justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget && modal.type !== 'call') onClose();
            }}
          >
            {/* 1. CREATE ACCOUNT / LOGIN / PROFILE */}
            {modal.type === 'create-account' && (
              <div
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#120D1F] p-6 shadow-2xl"
              >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account dialog"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          {userAccount ? (
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-white">
                Your Member Pass
              </h2>
              <p className="mt-1 text-xs text-white/60">
                Signed in as @{userAccount.username} · {userAccount.memberId}
              </p>

              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <MemberAvatar
                  name={userAccount.name}
                  avatarUrl={userAccount.avatarUrl}
                  sizeClass="h-16 w-16"
                  textSizeClass="text-lg"
                  isOnline
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-white">
                    {userAccount.name}
                  </p>
                  <p className="truncate text-xs text-white/65">
                    {userAccount.city}, {userAccount.country} · {userAccount.nativeLanguage}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white hover:bg-white/15">
                      <Upload className="h-3 w-3" aria-hidden="true" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleAvatarUpload(e, true)}
                      />
                    </label>
                    {userAccount.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => onUpdateAvatar(undefined)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-1 text-[11px] font-semibold text-rose-200 hover:bg-rose-500/25"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-400/35 bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Log Out</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/15"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-white">
                {authTab === 'signup' ? 'Join Honey Chat' : 'Welcome Back'}
              </h2>
              {modal.reason && (
                <p className="mt-1.5 text-xs leading-relaxed text-amber-200/90">
                  {modal.reason}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-white/12 bg-white/[0.04] p-1">
                <button
                  type="button"
                  onClick={() => setAuthTab('signup')}
                  className={`rounded-full py-1.5 text-xs font-semibold transition-all ${
                    authTab === 'signup'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white'
                      : 'text-white/65 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className={`rounded-full py-1.5 text-xs font-semibold transition-all ${
                    authTab === 'login'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white'
                      : 'text-white/65 hover:text-white'
                  }`}
                >
                  Log In
                </button>
              </div>

              {authError && (
                <p className="mt-3 rounded-xl border border-rose-400/35 bg-rose-500/15 px-3 py-2 text-xs text-rose-200">
                  {authError}
                </p>
              )}

              {authTab === 'signup' ? (
                <form onSubmit={handleSignUpSubmit} className="mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <MemberAvatar
                      name={name || 'You'}
                      avatarUrl={pendingAvatar}
                      sizeClass="h-12 w-12"
                    />
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10">
                      <Upload className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                      <span>{pendingAvatar ? 'Change Photo' : 'Add Profile Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleAvatarUpload(e, false)}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full Name"
                      className="h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email (optional)"
                      className="h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                    />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'woman' | 'man')}
                      className="h-10 rounded-xl border border-white/15 bg-[#1B142B] px-2.5 text-xs text-white focus:border-amber-300/60 focus:outline-none"
                    >
                      <option value="man">Man</option>
                      <option value="woman">Woman</option>
                    </select>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      className="h-10 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                    />
                  </div>

                  <input
                    type="text"
                    value={nativeLanguage}
                    onChange={(e) => setNativeLanguage(e.target.value)}
                    placeholder="Native Language (e.g. English, French)"
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                  />

                  <button
                    type="submit"
                    data-create-account-submit="true"
                    className="h-11 w-full rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110"
                  >
                    Create Free Account
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Username or Email"
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                  />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-11 w-full rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110"
                  >
                    Log In
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. UNLOCK PREMIUM (ONLY BINANCE UID 940777946 -> NEXT -> TRANSACTION ID -> ADMIN APPROVAL) */}
      {modal.type === 'unlock-premium' && (
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-300/30 bg-[#120D1F] p-6 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close premium dialog"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-300">
              <Crown className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-white">
                Honey Chat Premium VIP
              </h2>
              <p className="text-xs text-amber-200/85">
                $15 USDT / month · Unlimited SMS, Voice &amp; Video Calls, Ad-Free
              </p>
            </div>
          </div>

          {modal.reason && (
            <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/15 px-4 py-2.5 text-xs leading-relaxed text-rose-100">
              {modal.reason}
            </p>
          )}

          {premiumStatus === 'active' ? (
            <div className="mt-5 rounded-2xl border border-emerald-400/35 bg-emerald-500/15 p-4 text-sm text-emerald-100">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                <span>Premium VIP Active</span>
              </div>
              <p className="mt-1 text-xs text-emerald-100/80">
                Your membership has been approved. Enjoy unlimited direct messages, HD calls, and an ad-free experience.
              </p>
            </div>
          ) : premiumStatus === 'pending' ? (
            <div className="mt-5 rounded-2xl border border-amber-300/35 bg-amber-500/15 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Payment Submitted — Pending Admin Approval</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/85">
                Thank you! Your Binance Transaction ID{' '}
                <span className="font-mono-id font-semibold text-amber-200">
                  {submittedTxId}
                </span>{' '}
                has been submitted successfully. An administrator will verify your $15 USDT transfer to Binance UID <span className="font-mono-id text-white">{BINANCE_UID}</span> and approve your Premium VIP access shortly.
              </p>
            </div>
          ) : premiumStep === 'pay' ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-amber-300/25 bg-white/[0.04] p-4">
                <p className="text-xs font-medium text-white/65">
                  Step 1 of 2 · Send <span className="font-semibold text-amber-200">$15 USDT</span> via Binance Pay to this UID:
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-black/25 px-4 py-3">
                  <div>
                    <p className="text-[11px] text-white/55">Binance UID</p>
                    <p className="font-mono-id text-xl font-bold tracking-wider text-amber-200">
                      {BINANCE_UID}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText('uid', BINANCE_UID)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    {copiedField === 'uid' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{copiedField === 'uid' ? 'Copied' : 'Copy UID'}</span>
                  </button>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/70">
                  After completing your $15 USDT payment in Binance to UID{' '}
                  <span className="font-mono-id text-white">{BINANCE_UID}</span>, click{' '}
                  <strong className="text-white">Next</strong> to submit your Transaction ID for admin approval.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPremiumStep('txid')}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110"
              >
                <span>I Have Paid — Next</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleanTx = txIdInput.trim();
                if (!cleanTx) return;
                onSubmitPremiumPayment(cleanTx, '$15 USDT');
                setTxIdInput('');
              }}
              className="mt-5 space-y-4"
            >
              <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
                <p className="text-xs font-medium text-white/75">
                  Step 2 of 2 · Enter your Binance Transaction ID
                </p>
                <p className="mt-1 text-[11px] text-white/55">
                  Paste your Binance Pay Order ID or Transaction ID for verification. Once reviewed, the admin will approve your Premium VIP membership.
                </p>
                <input
                  type="text"
                  required
                  value={txIdInput}
                  onChange={(e) => setTxIdInput(e.target.value)}
                  placeholder="Enter Binance Transaction ID..."
                  className="mt-3 h-11 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 font-mono-id text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPremiumStep('pay')}
                  className="h-11 rounded-full border border-white/15 bg-white/[0.06] px-5 text-xs font-semibold text-white/80 hover:bg-white/10"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="h-11 flex-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-fuchsia-500 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110"
                >
                  Submit for Admin Approval
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. MATCH DATE PLANNER */}
      {modal.type === 'match-date' && (
        <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#120D1F] p-6 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close match date dialog"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-3">
            <MemberAvatar
              name={modal.profile.name}
              avatarUrl={modal.profile.portraitUrl}
              sizeClass="h-12 w-12"
              isOnline={modal.profile.isOnline}
            />
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-white">
                Match Date with {modal.profile.name.split(' ')[0]}
              </h2>
              <p className="text-xs text-white/60">
                {modal.profile.city}, {modal.profile.country}
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const inviteText = `Match Date Invite (${dateTiming}): ${dateVibe}.${
                dateNote.trim() ? ` ${dateNote.trim()}` : ''
              }`;
              onSendMatchDateInvite(modal.profile, inviteText);
              onClose();
            }}
            className="mt-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-white/70">
                Choose Evening Vibe
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  'Candlelit Espresso & Conversation',
                  'Rooftop Acoustic Call',
                  'Midnight Film Watchalong',
                  'Sunset Walk & Audio Note',
                ].map((vibe) => (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => setDateVibe(vibe)}
                    className={`rounded-xl border p-2.5 text-left text-xs font-medium transition-all ${
                      dateVibe === vibe
                        ? 'border-amber-300/60 bg-amber-500/20 text-amber-100'
                        : 'border-white/10 bg-white/[0.03] text-white/70 hover:text-white'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70">
                Timing
              </label>
              <select
                value={dateTiming}
                onChange={(e) => setDateTiming(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-xl border border-white/15 bg-[#1B142B] px-3 text-xs text-white focus:border-amber-300/60 focus:outline-none"
              >
                <option value="Tonight · 9:30 PM">Tonight · 9:30 PM</option>
                <option value="Tomorrow · Dusk">Tomorrow · Dusk</option>
                <option value="This Weekend · Evening">This Weekend · Evening</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/70">
                Personal Note (optional)
              </label>
              <input
                type="text"
                value={dateNote}
                onChange={(e) => setDateNote(e.target.value)}
                placeholder={`Say something warm to ${modal.profile.name.split(' ')[0]}...`}
                className="mt-1.5 h-10 w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 text-xs text-white placeholder:text-white/40 focus:border-amber-300/60 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110"
            >
              <CalendarHeart className="h-4 w-4" aria-hidden="true" />
              <span>Send Match Date Invite</span>
            </button>
          </form>
        </div>
      )}

      {/* 4. FAVOURITE LIST */}
      {modal.type === 'favourite' && (
        <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#120D1F] p-6 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close favourites dialog"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-400" aria-hidden="true" />
            <h2 className="font-editorial text-2xl font-semibold text-white">
              Saved Favourites ({favourites.length})
            </h2>
          </div>

          {favourites.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
              Tap the heart or Super Spark on any discovery profile to keep them here.
            </p>
          ) : (
            <div className="honey-scroll mt-4 max-h-80 space-y-2.5 overflow-y-auto pr-1">
              {favourites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <MemberAvatar
                      name={fav.name}
                      avatarUrl={fav.portraitUrl}
                      sizeClass="h-11 w-11"
                      isOnline={fav.isOnline}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {fav.name}, {fav.age}
                      </p>
                      <p className="truncate text-xs text-white/60">
                        {fav.city}, {fav.country} · {fav.nativeLanguage}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onMessageProfile(fav);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white"
                    >
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleFavourite(fav)}
                      aria-label={`Remove ${fav.name} from favourites`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-rose-300 hover:bg-rose-500/20"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. INVITE NEW */}
      {modal.type === 'invite-new' && (
        <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#120D1F] p-6 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invite dialog"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-editorial text-2xl font-semibold text-white">
                Invite a Friend
              </h2>
              <p className="text-xs text-white/60">
                Share your private Honey Chat guest pass
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/12 bg-white/[0.04] p-4">
            <p className="text-xs text-white/60">Personal Invite Link</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="truncate font-mono-id text-xs text-amber-200">{inviteLink}</p>
              <button
                type="button"
                onClick={() => copyText('invite', inviteLink)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white shrink-0"
              >
                {copiedField === 'invite' ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{copiedField === 'invite' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. VOICE / VIDEO CALL MODAL (Messenger-authentic Calling... -> Ringing... -> Connected) */}
      {modal.type === 'call' && (
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-[#110B1E] p-6 text-center shadow-2xl">
          <div className="flex flex-col items-center">
            {modal.mode === 'video' ? (
              <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/15 bg-black/50">
                {modal.avatarUrl ? (
                  <img
                    src={modal.avatarUrl}
                    alt={modal.name}
                    referrerPolicy="no-referrer"
                    className={`h-full w-full object-cover transition-all duration-500 ${
                      callPhase !== 'connected' ? 'scale-105 brightness-75 blur-[2px]' : ''
                    }`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <MemberAvatar name={modal.name} sizeClass="h-24 w-24" textSizeClass="text-2xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />

                {!isCameraOff && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute bottom-3 right-3 h-24 w-20 rounded-xl border border-white/25 bg-[#1B142B] object-cover shadow-lg"
                  />
                )}

                <div className="absolute bottom-3 left-3 text-left">
                  <p className="text-sm font-semibold text-white">{modal.name}</p>
                  <p className="font-mono-id text-xs text-amber-200">{callStatusLabel}</p>
                </div>
              </div>
            ) : (
              <div className="my-4 flex flex-col items-center">
                <div
                  className={`rounded-full p-1.5 transition-all ${
                    callPhase === 'ringing'
                      ? 'ring-4 ring-amber-400/35 animate-pulse'
                      : ''
                  }`}
                >
                  <MemberAvatar
                    name={modal.name}
                    avatarUrl={modal.avatarUrl}
                    sizeClass="h-24 w-24"
                    textSizeClass="text-2xl"
                    isOnline
                  />
                </div>
                <h2 className="mt-4 font-editorial text-3xl font-semibold text-white">
                  {modal.name}
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  {modal.city}, {modal.country} · {modal.nativeLanguage}
                </p>
                <p className="mt-3 font-mono-id text-sm font-medium text-amber-200 tabular-nums">
                  {callStatusLabel}
                </p>
              </div>
            )}

            {callPhase === 'connected' && (
              <p className="mt-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs italic text-white/80">
                “{modal.greeting}”
              </p>
            )}

            {premiumStatus !== 'active' && callPhase === 'connected' && (
              <p className="mt-3 text-[11px] font-medium text-amber-200/85 tabular-nums">
                Free preview: {Math.max(0, 15 - callSeconds)}s remaining
              </p>
            )}

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                  isMuted
                    ? 'border-amber-300/50 bg-amber-500/25 text-amber-200'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Mic className="h-5 w-5" aria-hidden="true" />
                )}
              </button>

              {modal.mode === 'video' && (
                <button
                  type="button"
                  onClick={() => setIsCameraOff((c) => !c)}
                  aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                    isCameraOff
                      ? 'border-amber-300/50 bg-amber-500/25 text-amber-200'
                      : 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {isCameraOff ? (
                    <VideoOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Video className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="End call"
                className="flex h-12 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition-colors hover:bg-rose-500"
              >
                <PhoneOff className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
