import * as admin from 'firebase-admin';

// ─────────────────────────────────────────────────────────
// Re-export shared types for use in Cloud Functions
// ─────────────────────────────────────────────────────────

export type UserRole = 'guest' | 'free' | 'premium' | 'admin';
export type AvatarGender = 'female' | 'male';
export type Language = 'en' | 'ru' | 'zh';
export type Theme = 'light' | 'dark' | 'custom';
export type ComplimentCategory = 'basic' | 'standard' | 'personalized' | 'seasonal';
export type ColorCategory = 'generic' | 'basic' | 'advanced';
export type SubscriptionPlan = 'weekly' | 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'expired' | 'canceled';

// ─────────────────────────────────────────────────────────
// Firestore Document Types (server-side, using admin.firestore.Timestamp)
// ─────────────────────────────────────────────────────────

export interface UserDocument {
  email: string | null;
  role: UserRole;
  subscriptionId?: string;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  lastLogin: admin.firestore.Timestamp | admin.firestore.FieldValue;
  avatarGender?: AvatarGender;
}

export interface UserPreferencesDocument {
  language: Language;
  notificationTime: string;
  theme: Theme;
  favorites: string[];
  cardHeightPct: number;
  notificationsEnabled: boolean;
  fcmToken?: string;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
}

export interface ComplimentDocument {
  text: string;
  category: ComplimentCategory;
  language: Language;
  audioUrl: string;
  tier: 'free' | 'premium';
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  createdBy: string;
}

export interface ColorAdviceDocument {
  hexCode: string;
  meaning: string;
  category: ColorCategory;
  date?: string; // 'YYYY-MM-DD'
  audioUrl?: string;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  createdBy: string;
}

export interface HistoryDocument {
  userId: string;
  complimentId: string;
  colorId: string;
  timestamp: admin.firestore.Timestamp | admin.firestore.FieldValue;
  favorited: boolean;
}

export interface SubscriptionDocument {
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: admin.firestore.Timestamp | admin.firestore.FieldValue;
  endDate: admin.firestore.Timestamp | admin.firestore.FieldValue;
  renewalDate: admin.firestore.Timestamp | admin.firestore.FieldValue;
  trialEndsAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
}
