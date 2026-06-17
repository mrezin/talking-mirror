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
  TimeContext,
  StreakState,
  StreakData,
} from './types/index';

export { ZODIAC_SIGNS } from './types/index';

// Hooks
export { useCompliment } from './hooks/useCompliment';
export { useColorAdvice } from './hooks/useColorAdvice';
export { useStreak } from './hooks/useStreak';

// Components
export { default as ComplimentCard } from './components/ComplimentCard';
export { default as ProfileSetupView } from './components/ProfileSetupView';
export { default as StreakPill } from './components/StreakPill';
export { default as TimeContextBadge } from './components/TimeContextBadge';

// Utils (pure functions)
export {
  getTodayKey,
  daysBetween,
  getTimeContext,
  calculateStreak,
  buildStreakState,
  getDefaultStreakData,
  getGraceMessage,
  getContextMeta,
  getTimeContextGreeting,
  getTimeContextSubtitle,
  getTimeContextEmoji,
} from './utils/streak';

// Shaders
export { BEAUTY_SHADER_SRC, createBeautyEffect } from './shaders/beautyShader';

// Store
export { useUserStore } from './store/userStore';
