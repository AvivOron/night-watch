import { CELESTIAL_BODIES } from './bodies';
import { getAltAz, getRiseSetTimes, getMoonPhase, getMoonPhaseName, getSunsetSunrise } from './calculations';
import { isInWindow, computeVisibilityScore } from './visibility';
import type { CelestialEvent, NightSummary, SkyWindow } from '@/types/astronomy';

export async function buildNightSummary(
  lat: number,
  lon: number,
  skyWindow: SkyWindow | null,
  cloudCover: number
): Promise<NightSummary> {
  const now = new Date();
  const moonPhase = getMoonPhase(now);
  const moonPhaseName = getMoonPhaseName(moonPhase);
  const { sunset, sunrise } = getSunsetSunrise(lat, lon, now);

  const nightStart = sunset ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
  const nightEnd = sunrise ?? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 6, 0, 0);

  const events: CelestialEvent[] = [];

  for (const body of CELESTIAL_BODIES) {
    if (body.name === 'Sun') continue;

    const times = getRiseSetTimes(body.name, lat, lon, nightStart);
    const eventEntries: Array<{ type: CelestialEvent['type']; time: Date | null }> = [
      { type: 'rise', time: times.rise },
      { type: 'transit', time: times.transit },
      { type: 'set', time: times.set },
    ];

    for (const entry of eventEntries) {
      if (!entry.time) continue;
      // Only include events during astronomical night
      if (entry.time < nightStart || entry.time > nightEnd) continue;

      const altAz = getAltAz(body.name, lat, lon, entry.time);
      const inWindow = skyWindow ? isInWindow(altAz, skyWindow) : false;
      const visScore = skyWindow
        ? computeVisibilityScore(altAz, skyWindow, cloudCover, moonPhase, body.magnitude, body.category)
        : 'not-visible';

      events.push({
        id: `${body.name}-${entry.type}-${entry.time.getTime()}`,
        body,
        type: entry.type,
        time: entry.time,
        altAz,
        inSkyWindow: inWindow,
        visibilityScore: visScore,
      });
    }
  }

  // Sort chronologically
  events.sort((a, b) => a.time.getTime() - b.time.getTime());

  // Find best recommendation: highest scoring event that's in window and in the future
  const future = events.filter(
    e => e.time >= now && e.inSkyWindow && e.visibilityScore !== 'not-visible'
  );
  future.sort((a, b) => {
    const order: Record<string, number> = { excellent: 3, good: 2, low: 1, 'not-visible': 0 };
    return (order[b.visibilityScore] ?? 0) - (order[a.visibilityScore] ?? 0);
  });
  const recommendation = future[0] ?? null;

  // Overall quality score
  const excellentCount = events.filter(e => e.visibilityScore === 'excellent').length;
  const goodCount = events.filter(e => e.visibilityScore === 'good').length;
  const qualityScore = Math.min(
    100,
    excellentCount * 20 + goodCount * 10 + ((100 - cloudCover) / 100) * 30
  );

  return {
    date: now,
    events,
    moonPhase,
    moonPhaseName,
    recommendation,
    qualityScore,
  };
}
