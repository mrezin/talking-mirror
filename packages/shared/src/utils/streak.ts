// ─────────────────────────────────────────────────────────
// Anti-Fragile Streak System — pure, testable functions
// ─────────────────────────────────────────────────────────

import type { TimeContext, StreakData, StreakState } from '../types/index';

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

/** Maximum consecutive grace days before streak resets. */
const MAX_GRACE_DAYS = 2;

/** Consecutive active days required to reset grace counter. */
const GRACE_RESET_DAYS = 7;

// ─────────────────────────────────────────────────────────
// Date Helpers
// ─────────────────────────────────────────────────────────

/** Return today's date as 'YYYY-MM-DD' in local timezone. */
export function getTodayKey(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Days between two 'YYYY-MM-DD' strings. Positive when `b` is later. */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

// ─────────────────────────────────────────────────────────
// Time Context
// ─────────────────────────────────────────────────────────

/**
 * Determine the time-of-day context from a Date.
 *
 * Morning:  05:00–11:59 — full ritual
 * Day:      12:00–17:59 — day reset
 * Evening:  18:00–04:59 — evening detox
 */
export function getTimeContext(date: Date = new Date()): TimeContext {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  return 'evening';
}

// ─────────────────────────────────────────────────────────
// Context Mode Metadata
// ─────────────────────────────────────────────────────────

export interface ContextMeta {
  emoji: string;
  greeting: string;
  subtitle: string;
}

const CONTEXT_META: Record<TimeContext, ContextMeta> = {
  morning: {
    emoji: '🌅',
    greeting: 'Good morning, your mirror is ready',
    subtitle: 'Start fresh. One breath at a time.',
  },
  day: {
    emoji: '☀️',
    greeting: 'Day in full swing? Reset your vibe.',
    subtitle: 'A quick pause is all you need.',
  },
  evening: {
    emoji: '🌙',
    greeting: 'The day is winding down. Take a moment for yourself.',
    subtitle: 'Reflect. Release. Restore.',
  },
};

export function getContextMeta(ctx: TimeContext): ContextMeta {
  return CONTEXT_META[ctx];
}

// ─────────────────────────────────────────────────────────
// Grace Messages
// ─────────────────────────────────────────────────────────

/**
 * Return a warm grace message based on how many grace days are in use.
 * Celebrates the silence — never punishes.
 */
export function getGraceMessage(graceDaysUsed: number, currentStreak: number): string {
  if (graceDaysUsed <= 0) return '';

  switch (graceDaysUsed) {
    case 1:
      return '🕊️ Yesterday was a silence day? Great choice. Your progress is saved.';
    case 2:
      return `🕊️ Two quiet days. No worries — your ${currentStreak}-day streak is safe.`;
    default:
      return '';
  }
}

// ─────────────────────────────────────────────────────────
// Streak Calculation — the pure core
// ─────────────────────────────────────────────────────────

export interface StreakInput {
  prev: StreakData;
  today: string;
}

/**
 * Pure function: given previous streak data and today's date key,
 * compute the new streak state.
 *
 * Rules:
 *  1. Same day              → no change
 *  2. Consecutive day (+1)  → increment streak, reset grace counter
 *  3. Gap 2-3 days          → grace day(s), streak preserved
 *  4. Gap >3 days           → streak resets to 1
 *  5. 7 consecutive active days after grace → graceDaysUsed resets
 */
export function calculateStreak(input: StreakInput): StreakData {
  const { prev, today } = input;
  const diff = daysBetween(prev.lastActiveDate, today);

  // Same day — nothing to do
  if (diff === 0) return { ...prev };

  // ── Consecutive day ──────────────────────────────────
  if (diff === 1) {
    const activeDaysSinceGrace = prev.activeDaysSinceGrace + 1;
    // Reset grace counter after a full week of consistency
    const graceDaysUsed =
      activeDaysSinceGrace >= GRACE_RESET_DAYS ? 0 : prev.graceDaysUsed;

    const next: StreakData = {
      currentStreak: prev.currentStreak + 1,
      longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
      lastActiveDate: today,
      graceDaysUsed,
      activeDaysSinceGrace,
    };
    return next;
  }

  // ── Gap — check grace days ───────────────────────────
  // Number of consecutive days the user missed
  const consecutiveMissed = diff - 1;

  if (consecutiveMissed <= MAX_GRACE_DAYS) {
    // Within grace window — streak survives
    const next: StreakData = {
      currentStreak: prev.currentStreak,
      longestStreak: prev.longestStreak,
      lastActiveDate: today,
      graceDaysUsed: consecutiveMissed,
      activeDaysSinceGrace: 0, // reset — grace day isn't an active day
    };
    return next;
  }

  // ── Streak broken — gap too large ────────────────────
  return {
    currentStreak: 1,
    longestStreak: prev.longestStreak, // preserve the record
    lastActiveDate: today,
    graceDaysUsed: 0,
    activeDaysSinceGrace: 0,
  };
}

// ─────────────────────────────────────────────────────────
// StreakState Builder
// ─────────────────────────────────────────────────────────

/** Combine StreakData + time context into the UI-facing StreakState. */
export function buildStreakState(
  data: StreakData,
  timeContext: TimeContext,
): StreakState {
  return {
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak,
    lastActiveDate: data.lastActiveDate,
    graceDaysUsed: data.graceDaysUsed,
    timeContext,
    isGraceDay: data.graceDaysUsed > 0,
  };
}

/** Default streak data for a brand-new user. */
export function getDefaultStreakData(today?: string): StreakData {
  return {
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: today ?? getTodayKey(),
    graceDaysUsed: 0,
    activeDaysSinceGrace: 0,
  };
}

// ─────────────────────────────────────────────────────────
// Time Context Greeting
// ─────────────────────────────────────────────────────────

/** Return the appropriate greeting for the current time context. */
export function getTimeContextGreeting(timeContext: TimeContext): string {
  return getContextMeta(timeContext).greeting;
}

/** Return the subtitle for the current time context. */
export function getTimeContextSubtitle(timeContext: TimeContext): string {
  return getContextMeta(timeContext).subtitle;
}

/** Return the emoji for the current time context. */
export function getTimeContextEmoji(timeContext: TimeContext): string {
  return getContextMeta(timeContext).emoji;
}
