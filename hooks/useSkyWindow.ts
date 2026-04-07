'use client';

import { useState, useEffect } from 'react';
import { loadSkyWindow } from '@/lib/storage/calibration';
import type { SkyWindow } from '@/types/astronomy';

export function useSkyWindow() {
  const [skyWindow, setSkyWindow] = useState<SkyWindow | null>(null);

  useEffect(() => {
    setSkyWindow(loadSkyWindow());
  }, []);

  function refresh() {
    setSkyWindow(loadSkyWindow());
  }

  return { skyWindow, refresh };
}
