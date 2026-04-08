'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchWeather } from '@/lib/weather/openmeteo';
import type { WeatherData } from '@/types/weather';

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function useWeather(lat: number | null, lon: number | null, date: Date = new Date()) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dateKey = date.toDateString();

  useEffect(() => {
    if (lat === null || lon === null) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeather(lat!, lon!, date);
        setWeather(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Weather fetch failed');
      } finally {
        setLoading(false);
      }
    }

    load();
    timerRef.current = setInterval(load, REFRESH_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, dateKey]);

  return { weather, loading, error };
}
