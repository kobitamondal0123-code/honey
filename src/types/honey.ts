export type DeckFilter = 'all' | 'woman' | 'man';

export type PremiumStatus = 'none' | 'pending' | 'active';

export type ProfileAvatarMode = 'photo' | 'none' | 'login-avatar';

export interface Profile {
  id: string;
  memberId: string;
  name: string;
  username: string;
  age: number;
  gender: 'woman' | 'man';
  city: string;
  country: string;
  nativeLanguage: string;
  portraitUrl: string;
  avatarMode?: ProfileAvatarMode;
  bio: string;
  flirtyPromptLine: string;
  interests: string[];
  isOnline: boolean;
  distanceLabel?: string;
  verified?: boolean;
}

export interface LiveReview {
  id: string;
  reviewerName: string;
  memberId: string;
  city: string;
  country: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface LoungeMember {
  memberId: string;
  name: string;
  username: string;
  age?: number;
  gender: 'woman' | 'man';
  city: string;
  country: string;
  nativeLanguage: string;
  avatarUrl?: string;
  isOnline: boolean;
  verified?: boolean;
  bio: string;
  flirtyPromptLine: string;
}

export interface LoungeRoom {
  id: string;
  name: string;
  city: string;
  country: string;
  language: string;
  topic: string;
  participantCount: number;
}

export interface LoungeMessage {
  id: string;
  roomId: string;
  type: 'sms' | 'system';
  memberId: string;
  memberName: string;
  username: string;
  gender?: 'woman' | 'man';
  avatarUrl?: string;
  city: string;
  country: string;
  nativeLanguage: string;
  isOnline: boolean;
  text: string;
  timestamp: string;
  isOwn?: boolean;
}

export interface RoomActivityPopup {
  id: string;
  memberName: string;
  memberId: string;
  avatarUrl?: string;
  city: string;
  country: string;
  roomId: string;
  roomName: string;
  timestamp: string;
}

export interface DirectMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  translation?: string;
  timestamp: string;
  seen?: boolean;
}

export interface ChatThread {
  memberId: string;
  name: string;
  username: string;
  age?: number;
  gender: 'woman' | 'man';
  avatarUrl?: string;
  verified?: boolean;
  country: string;
  city: string;
  nativeLanguage: string;
  bio: string;
  flirtyPromptLine: string;
  isOnline: boolean;
  isSpark?: boolean;
  isGroup?: boolean;
  unreadCount: number;
  lastActiveText: string;
  typing?: boolean;
  blockedUntilPremium?: boolean;
  dismissedHead?: boolean;
  messages: DirectMessage[];
}
