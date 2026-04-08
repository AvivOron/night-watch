'use client';

import { useState, useEffect } from 'react';
import { buildNightSummary } from '@/lib/astronomy/events';
import { fetchWeather } from '@/lib/weather/openmeteo';
import type { SkyWindow } from '@/types/astronomy';

export interface DayScore {
  date: Date;
  qualityScore: number;
  moonPhase: number;
  moonPhaseName: string;
  excellentCount: number;
  goodCount: number;
  hasWeather: boolean;
}

const DAYS = 30;

export function useBestNights(
  lat: number | null,
  lon: number | null,
  skyWindow: SkyWindow | null,
) {
  const [days, setDays] = useState<DayScore[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat === null || lon === null) return;

    let cancelled = false;

    async function compute() {
      setLoading(true);

      // Fetch weather once — contains all 16 days of hourly data
      let weatherData: Awaited<ReturnType<typeof fetchWeather>> | null = null;
      try {
        weatherData = await fetchWeather(lat!, lon!);
      } catch { /* proceed without weather */ }

      if (cancelled) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dates = Array.from({ length: DAYS }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
      });

      // Get cloud cover per day from the already-fetched hourly data
      function cloudCoverForDate(date: Date): { cover: number; hasWeather: boolean } {
        if (!weatherData) return { cover: 0, hasWeather: false };
        const y = date.getFullYear(), mo = date.getMonth(), d = date.getDate();
        const slot =
          weatherData.hourly.find(h => h.time.getFullYear() === y && h.time.getMonth() === mo && h.time.getDate() === d && h.time.getHours() === 22) ??
          weatherData.hourly.find(h => h.time.getFullYear() === y && h.time.getMonth() === mo && h.time.getDate() === d && h.time.getHours() >= 20) ??
          weatherData.hourly.find(h => h.time.getFullYear() === y && h.time.getMonth() === mo && h.time.getDate() === d) ??
          null;
        return slot ? { cover: slot.cloudCoverPercent, hasWeather: true } : { cover: 0, hasWeather: false };
      }

      // Run all summaries in parallel
      const summaries = await Promise.all(
        dates.map(date => {
          const { cover, hasWeather } = cloudCoverForDate(date);
          return buildNightSummary(lat!, lon!, skyWindow, cover, date)
            .then(s => ({
              date,
              qualityScore: s.qualityScore,
              moonPhase: s.moonPhase,
              moonPhaseName: s.moonPhaseName,
              excellentCount: s.events.filter(e => e.visibilityScore === 'excellent').length,
              goodCount: s.events.filter(e => e.visibilityScore === 'good').length,
              hasWeather,
            }));
        })
      );

      if (!cancelled) {
        setDays(summaries);
        setLoading(false);
      }
    }

    compute();
    return () => { cancelled = true; };
  }, [lat, lon, skyWindow]);

  return { days, loading };
}
