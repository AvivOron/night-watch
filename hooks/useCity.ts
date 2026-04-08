'use client';

import { useState, useEffect } from 'react';

export function useCity(lat: number | null, lon: number | null): string | null {
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    if (lat === null || lon === null) return;

    let cancelled = false;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        const addr = data?.address;
        const name =
          addr?.city ?? addr?.town ?? addr?.village ?? addr?.county ?? null;
        setCity(name);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [lat, lon]);

  return city;
}
