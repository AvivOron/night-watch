'use client';

import { useState, useEffect } from 'react';
import { buildNightSummary } from '@/lib/astronomy/events';
import { fetchWeather, pickForecastSlotForDate } from '@/lib/weather/openmeteo';
import { getSunsetSunrise } from '@/lib/astronomy/calculations';
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

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getNightAnchorDate(now: Date, lat: number | null, lon: number | null): Date {
  if (lat === null || lon === null) {
    const anchor = startOfDay(now);
    if (now.getHours() < 6) {
      anchor.setDate(anchor.getDate() - 1);
    }
    return anchor;
  }

  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayNight = getSunsetSunrise(lat, lon, yesterday);
  if (yesterdayNight.sunrise && now < yesterdayNight.sunrise) {
    return yesterday;
  }

  return today;
}

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

      const today = getNightAnchorDate(new Date(), lat, lon);

      const dates = Array.from({ length: DAYS }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return d;
      });

      // Get cloud cover per day from the already-fetched hourly data
      function cloudCoverForDate(date: Date): { cover: number; hasWeather: boolean } {
        if (!weatherData) return { cover: 0, hasWeather: false };
        const slot = pickForecastSlotForDate(weatherData.hourly, date, new Date());
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
