// ─────────────────────────────────────────────────────────
// @talking-mirror/shared — barrel exports
// ─────────────────────────────────────────────────────────

// Types
export type {
  UserRole,
  AvatarGender,
  UserDoc,
  ComplimentCategory,
  Language,
  ComplimentTier,
  ComplimentDoc,
  ColorCategory,
  ColorAdviceDoc,
  Theme,
  UserPreferencesDoc,
  HistoryDoc,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionDoc,
  ZodiacSign,
  DailyFocus,
  DayVibe,
  DailyImpulseDoc,
} from './types/index';

export { ZODIAC_SIGNS } from './types/index';

// Hooks
export { useCompliment } from './hooks/useCompliment';
export { useColorAdvice } from './hooks/useColorAdvice';

// Components
export { default as ComplimentCard } from './components/ComplimentCard';
export { default as ProfileSetupView } from './components/ProfileSetupView';

// Shaders
export { BEAUTY_SHADER_SRC, createBeautyEffect } from './shaders/beautyShader';

// Store
export { useUserStore } from './store/userStore';
