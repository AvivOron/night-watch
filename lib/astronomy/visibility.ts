import type { AltAz, SkyWindow, VisibilityScore } from '@/types/astronomy';
import { getAltAz } from './calculations';
import type { BodyName } from '@/types/astronomy';

export function isAzimuthInWindow(az: number, window: SkyWindow): boolean {
  if (window.crossesNorth) {
    return az >= window.azimuthMin || az <= window.azimuthMax;
  }
  return az >= window.azimuthMin && az <= window.azimuthMax;
}

export function isInWindow(altAz: AltAz, window: SkyWindow): boolean {
  if (altAz.altitude < window.altitudeMin || altAz.altitude > window.altitudeMax) {
    return false;
  }
  return isAzimuthInWindow(altAz.azimuth, window);
}

export function minutesUntilInWindow(
  name: BodyName,
  lat: number,
  lon: number,
  window: SkyWindow,
  fromDate: Date
): number | null {
  const STEP_MINUTES = 5;
  const MAX_HOURS = 12;

  for (let i = 0; i <= (MAX_HOURS * 60) / STEP_MINUTES; i++) {
    const t = new Date(fromDate.getTime() + i * STEP_MINUTES * 60000);
    const altAz = getAltAz(name, lat, lon, t);
    if (isInWindow(altAz, window)) {
      return i * STEP_MINUTES;
    }
  }
  return null;
}

export function minutesInWindowFromNow(
  name: BodyName,
  lat: number,
  lon: number,
  window: SkyWindow,
  fromDate: Date
): number {
  const STEP_MINUTES = 5;
  const MAX_HOURS = 12;

  let minutes = 0;
  for (let i = 0; i <= (MAX_HOURS * 60) / STEP_MINUTES; i++) {
    const t = new Date(fromDate.getTime() + i * STEP_MINUTES * 60000);
    const altAz = getAltAz(name, lat, lon, t);
    if (!isInWindow(altAz, window)) break;
    minutes += STEP_MINUTES;
  }
  return minutes;
}

export function computeVisibilityScore(
  altAz: AltAz,
  window: SkyWindow,
  cloudCover: number,
  moonPhase: number,
  bodyMagnitude: number,
  bodyCategory: string
): VisibilityScore {
  if (!isInWindow(altAz, window)) return 'not-visible';

  let score = 0;

  // Altitude component (higher is better, 0-30 pts)
  const altRange = window.altitudeMax - window.altitudeMin;
  const altNorm = altRange > 0 ? (altAz.altitude - window.altitudeMin) / altRange : 0.5;
  score += altNorm * 30;

  // Weather component (0-30 pts)
  score += ((100 - cloudCover) / 100) * 30;

  // Moon interference (0-20 pts, penalize DSOs in bright moon)
  if (bodyCategory === 'dso' && moonPhase > 0.6) {
    score += (1 - moonPhase) * 20;
  } else {
    score += 20;
  }

  // Brightness (0-20 pts, lower magnitude = brighter)
  // Scale from mag 8 (faint, 0 pts) to mag -5 (very bright, 20 pts)
  const magScore = Math.max(0, Math.min(20, ((8 - bodyMagnitude) / 13) * 20));
  score += magScore;

  if (score >= 75) return 'excellent';
  if (score >= 50) return 'good';
  return 'low';
}
