// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ComplimentDoc, ZodiacSign, DailyFocus } from '../types/index';
import { useUserStore } from '../store/userStore';

const CACHE_KEY_PREFIX = 'daily_impulse_';

function getTodayKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${CACHE_KEY_PREFIX}${yyyy}-${mm}-${dd}`;
}

interface CachedCompliment extends ComplimentDoc {
  id: string;
}

export function useCompliment() {
  const [compliment, setCompliment] = useState<CachedCompliment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompliment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check daily cache first
      const cacheKey = getTodayKey();
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setCompliment(JSON.parse(cached) as CachedCompliment);
        return;
      }

      // Get user profile for personalization
      const store = useUserStore.getState();
      let zodiacSign: ZodiacSign | undefined;
      let dailyFocus: DailyFocus | undefined;

      if (store.user?.uid) {
        try {
          const db = getFirestore(getApp());
          const prefsSnap = await getDoc(doc(db, 'userPreferences', store.user.uid));
          const prefs = prefsSnap.data();
          zodiacSign = prefs?.zodiacSign;
          dailyFocus = prefs?.dailyFocus;
        } catch {
          // Silently skip — will use legacy compliments
        }
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

      const functions = getFunctions(getApp());
      const getDaily = httpsCallable(functions, 'getDailyCompliment');
      const result = await getDaily({ zodiacSign, focus: dailyFocus, timezone });
      const data = result.data as CachedCompliment;
      setCompliment(data);

      // Store in daily cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'Failed to load daily impulse');
      // Fallback: contextual impulse — honest, not flattering
      const fallback: CachedCompliment = {
        id: 'fallback',
        text: 'A new day is here. Take one deep breath, focus on what matters, and let the rest wait. You have everything you need.',
        category: 'basic',
        language: 'en',
        tier: 'free',
        audioUrl: '',
        createdAt: null,
        createdBy: '',
      };
      setCompliment(fallback);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompliment();
  }, [fetchCompliment]);

  return { compliment, loading, error, refresh: fetchCompliment };
}
