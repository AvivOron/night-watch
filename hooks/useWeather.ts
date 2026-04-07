'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchWeather } from '@/lib/weather/openmeteo';
import type { WeatherData } from '@/types/weather';

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function useWeather(lat: number | null, lon: number | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (lat === null || lon === null) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWeather(lat!, lon!);
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
  }, [lat, lon]);

  return { weather, loading, error };
}
