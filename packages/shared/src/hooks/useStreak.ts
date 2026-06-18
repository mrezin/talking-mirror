import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import {
  getTodayKey,
  getTimeContext,
  calculateStreak,
  buildStreakState,
  getDefaultStreakData,
  getGraceMessage,
  getContextMeta,
} from '../utils/streak';
import type { StreakState, StreakData, TimeContext } from '../types/index';
import type { ContextMeta } from '../utils/streak';
import { useUserStore } from '../store/userStore';

// ─────────────────────────────────────────────────────────
// AsyncStorage keys
// ─────────────────────────────────────────────────────────

const STREAK_CACHE_KEY = 'talking_mirror_streak';

// ─────────────────────────────────────────────────────────
// Persistence helpers
// ─────────────────────────────────────────────────────────

async function loadFromStorage(): Promise<StreakData | null> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_CACHE_KEY);
    if (raw) return JSON.parse(raw) as StreakData;
  } catch {
    // Silently ignore — treat as first open
  }
  return null;
}

async function saveToStorage(data: StreakData): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Best-effort cache
  }
}

async function loadFromFirestore(uid: string): Promise<StreakData | null> {
  try {
    const db = getFirestore(getApp());
    const snap = await getDoc(doc(db, 'userPreferences', uid));
    const prefs = snap.data();
    if (prefs?.streak) return prefs.streak as StreakData;
  } catch {
    // Offline / error — fall back to local cache
  }
  return null;
}

async function saveToFirestore(uid: string, data: StreakData): Promise<void> {
  try {
    const db = getFirestore(getApp());
    await setDoc(
      doc(db, 'userPreferences', uid),
      { streak: data },
      { merge: true },
    );
  } catch {
    // Best-effort cloud sync — local cache is authoritative
  }
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export interface UseStreakResult {
  /** Full UI-ready streak state. */
  streak: StreakState;
  /** Loading flag — true while resolving persisted state. */
  loading: boolean;
  /** Grace message if currently on a grace day, empty string otherwise. */
  graceMessage: string;
  /** Time-of-day context metadata (greeting, emoji, subtitle). */
  contextMeta: ContextMeta;
  /** Manually recalculate streak (e.g. after app foreground). */
  refresh: () => Promise<void>;
}

/**
 * Anti-fragile streak hook.
 *
 * On mount and each refresh call:
 *  1. Load persisted streak from AsyncStorage (fast) and Firestore (sync).
 *  2. Calculate the new streak state based on today's date.
 *  3. Persist the result back to AsyncStorage + Firestore.
 *
 * Grace days preserve the streak — a missed day doesn't punish.
 */
export function useStreak(): UseStreakResult {
  const [streakState, setStreakState] = useState<StreakState>(() => {
    const today = getTodayKey();
    const ctx = getTimeContext();
    return buildStreakState(getDefaultStreakData(today), ctx);
  });
  const [loading, setLoading] = useState(true);

  const calculateAndSync = useCallback(async () => {
    try {
      setLoading(true);
      const today = getTodayKey();

      // 1. Load from local cache (fast)
      let persisted = await loadFromStorage();

      // 2. Try Firestore for potentially fresher data
      const store = useUserStore.getState();
      if (store.user?.uid) {
        const remote = await loadFromFirestore(store.user.uid);
        // Use remote if present and more recent
        if (remote && (!persisted || remote.lastActiveDate > persisted.lastActiveDate)) {
          persisted = remote;
        }
      }

      // 3. Calculate new state
      const prev = persisted ?? getDefaultStreakData(today);
      const nextData = calculateStreak({ prev, today });

      // 4. Persist to both stores
      await Promise.all([
        saveToStorage(nextData),
        store.user?.uid ? saveToFirestore(store.user.uid, nextData) : Promise.resolve(),
      ]);

      // 5. Build UI state
      const timeContext = getTimeContext();
      const nextState = buildStreakState(nextData, timeContext);
      setStreakState(nextState);
    } catch (err) {
      // Fallback: keep current state, compute time context fresh
      const timeContext = getTimeContext();
      setStreakState((prev) => ({ ...prev, timeContext }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    calculateAndSync();
  }, [calculateAndSync]);

  const graceMessage = getGraceMessage(
    streakState.graceDaysUsed,
    streakState.currentStreak,
  );
  const contextMeta = getContextMeta(streakState.timeContext);

  return {
    streak: streakState,
    loading,
    graceMessage,
    contextMeta,
    refresh: calculateAndSync,
  };
}
