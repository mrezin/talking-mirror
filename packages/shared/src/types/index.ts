// ─────────────────────────────────────────────────────────
// User Types
// ─────────────────────────────────────────────────────────

export type UserRole = 'guest' | 'free' | 'premium' | 'admin';

export type AvatarGender = 'female' | 'male';

export interface UserDoc {
  email: string | null;
  role: UserRole;
  subscriptionId?: string;
  createdAt: unknown; // Firestore Timestamp / serverTimestamp
  lastLogin: unknown; // Firestore Timestamp / serverTimestamp
  avatarGender?: AvatarGender;
}

// ─────────────────────────────────────────────────────────
// Compliment Types
// ─────────────────────────────────────────────────────────

export type ComplimentCategory = 'basic' | 'standard' | 'personalized' | 'seasonal';
export type Language = 'en' | 'ru' | 'zh';

export interface ComplimentDoc {
  text: string;
  category: ComplimentCategory;
  language: Language;
  audioUrl: string;
  createdAt: unknown;
  createdBy: string;
}

// ─────────────────────────────────────────────────────────
// Color Advice Types
// ─────────────────────────────────────────────────────────

export type ColorCategory = 'generic' | 'basic' | 'advanced';

export interface ColorAdviceDoc {
  hexCode: string;
  meaning: string;
  category: ColorCategory;
  audioUrl?: string;
  createdAt: unknown;
  createdBy: string;
}

// ─────────────────────────────────────────────────────────
// User Preferences Types
// ─────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'custom';

export interface UserPreferencesDoc {
  language: Language;
  notificationTime: string; // 'HH:MM'
  theme: Theme;
  favorites: string[]; // compliment/color IDs
  cardHeightPct: number; // 15-30
  notificationsEnabled: boolean;
  fcmToken?: string;
  createdAt: unknown;
}

// ─────────────────────────────────────────────────────────
// History Types
// ─────────────────────────────────────────────────────────

export interface HistoryDoc {
  userId: string;
  complimentId: string;
  colorId: string;
  timestamp: unknown;
  favorited: boolean;
}

// ─────────────────────────────────────────────────────────
// Subscription Types
// ─────────────────────────────────────────────────────────

export type SubscriptionPlan = 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'canceled';

export interface SubscriptionDoc {
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: unknown;
  endDate: unknown;
  renewalDate: unknown;
  trialEndsAt: unknown;
}
