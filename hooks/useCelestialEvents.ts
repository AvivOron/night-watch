'use client';

import { useState, useEffect } from 'react';
import { buildNightSummary } from '@/lib/astronomy/events';
import type { NightSummary, SkyWindow } from '@/types/astronomy';

export function useCelestialEvents(
  lat: number | null,
  lon: number | null,
  skyWindow: SkyWindow | null,
  cloudCover: number
) {
  const [summary, setSummary] = useState<NightSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === null || lon === null) return;

    let cancelled = false;

    async function compute() {
      setLoading(true);
      setError(null);
      try {
        const result = await buildNightSummary(lat!, lon!, skyWindow, cloudCover);
        if (!cancelled) setSummary(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to compute events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    compute();

    // Refresh every 5 minutes
    const timer = setInterval(compute, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [lat, lon, skyWindow, cloudCover]);

  return { summary, loading, error };
}
