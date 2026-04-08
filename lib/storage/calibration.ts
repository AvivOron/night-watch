import type { SkyWindow } from '@/types/astronomy';
import type { CalibrationLogPayload } from '@/types/calibration';

const KEY = 'night-watch-sky-windows';
const ACTIVE_KEY = 'night-watch-active-window';

interface StoredWindows {
  windows: (SkyWindow & { savedAt: string })[];
}

export function saveSkyWindow(window: SkyWindow): void {
  if (typeof localStorage === 'undefined') return;
  const stored = loadStoredWindows();
  const existing = stored.windows.findIndex(w => w.name === window.name);
  const entry = { ...window, savedAt: new Date().toISOString() };
  if (existing >= 0) {
    stored.windows[existing] = entry;
  } else {
    stored.windows.push(entry);
  }
  localStorage.setItem(KEY, JSON.stringify(stored));
  localStorage.setItem(ACTIVE_KEY, window.name);
}

export async function logCalibration(payload: CalibrationLogPayload): Promise<void> {
  const res = await fetch('/api/calibration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      recordedAt: payload.recordedAt ?? new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    throw new Error(`Calibration log failed with status ${res.status}`);
  }
}

export function loadSkyWindow(): SkyWindow | null {
  if (typeof localStorage === 'undefined') return null;
  const activeName = localStorage.getItem(ACTIVE_KEY);
  if (!activeName) return null;
  const stored = loadStoredWindows();
  const window = stored.windows.find(w => w.name === activeName);
  if (!window) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { savedAt: _, ...skyWindow } = window;
  return skyWindow;
}

export function listSkyWindows(): SkyWindow[] {
  const stored = loadStoredWindows();
  return stored.windows.map(({ savedAt: _, ...w }) => w);
}

export function setActiveWindow(name: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(ACTIVE_KEY, name);
}

export function clearCalibration(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(ACTIVE_KEY);
}

function loadStoredWindows(): StoredWindows {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { windows: [] };
    return JSON.parse(raw) as StoredWindows;
  } catch {
    return { windows: [] };
  }
}
