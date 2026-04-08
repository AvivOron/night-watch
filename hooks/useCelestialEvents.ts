'use client';

import { useState, useEffect } from 'react';
import { buildNightSummary } from '@/lib/astronomy/events';
import type { NightSummary, SkyWindow } from '@/types/astronomy';

export function useCelestialEvents(
  lat: number | null,
  lon: number | null,
  skyWindow: SkyWindow | null,
  cloudCover: number | null,
  date: Date
) {
  const [summary, setSummary] = useState<NightSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateKey = date.toDateString();

  useEffect(() => {
    if (lat === null || lon === null || cloudCover === null) {
      setSummary(null);
      setLoading(false);
      return;
    }

    const resolvedCloudCover = cloudCover;

    let cancelled = false;

    async function compute() {
      setLoading(true);
      setError(null);
      try {
        const result = await buildNightSummary(lat!, lon!, skyWindow, resolvedCloudCover, date);
        if (!cancelled) setSummary(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to compute events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    compute();

    // Only auto-refresh for tonight
    const isTonight = date.toDateString() === new Date().toDateString();
    if (!isTonight) return () => { cancelled = true; };

    const timer = setInterval(compute, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, skyWindow, cloudCover, dateKey]);

  return { summary, loading, error };
}
