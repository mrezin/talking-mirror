// @ts-nocheck
import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

interface ColorAdvice {
  id: string;
  hexCode: string;
  meaning: string;
  category: string;
  date?: string;
}

export function useColorAdvice() {
  const [color, setColor] = useState<ColorAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const functions = getFunctions(getApp());
        const getColor = httpsCallable(functions, 'getLuckyColor');
        const result = await getColor();
        if (mounted) setColor(result.data as ColorAdvice);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load color advice');
          // Fallback color
          setColor({
            id: 'fallback',
            hexCode: '#9b59b6',
            meaning: 'Royal purple — embrace your uniqueness',
            category: 'generic',
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { color, loading, error };
}
