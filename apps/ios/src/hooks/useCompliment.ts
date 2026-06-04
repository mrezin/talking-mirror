// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

interface Compliment {
  id: string;
  text: string;
  category: string;
  language: string;
  audioUrl: string;
  tier: string;
}

export function useCompliment() {
  const [compliment, setCompliment] = useState<Compliment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompliment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const functions = getFunctions(getApp());
      const getDaily = httpsCallable(functions, 'getDailyCompliment');
      const result = await getDaily();
      setCompliment(result.data as Compliment);
    } catch (err: any) {
      setError(err.message || 'Failed to load compliment');
      // Fallback: show a static compliment
      setCompliment({
        id: 'fallback',
        text: 'You are radiant today! ✨',
        category: 'basic',
        language: 'en',
        audioUrl: '',
        tier: 'free',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompliment();
  }, [fetchCompliment]);

  return { compliment, loading, error, refresh: fetchCompliment };
}
