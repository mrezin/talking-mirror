import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ComplimentDoc } from '@talking-mirror/shared';

const CACHE_KEY_PREFIX = 'daily_compliment_';

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

      const functions = getFunctions(getApp());
      const getDaily = httpsCallable(functions, 'getDailyCompliment');
      const result = await getDaily();
      const data = result.data as CachedCompliment;
      setCompliment(data);

      // Store in daily cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err: any) {
      setError(err.message || 'Failed to load compliment');
      // Fallback: show a static compliment
      const fallback: CachedCompliment = {
        id: 'fallback',
        text: 'You are radiant today! ✨',
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
