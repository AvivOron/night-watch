import { CELESTIAL_BODIES } from './bodies';
import { getAltAz, getRiseSetTimes, getMoonPhase, getMoonPhaseName, getSunsetSunrise } from './calculations';
import { isInWindow, computeVisibilityScore, findWindowVisibility, minutesInWindowFromNow } from './visibility';
import type { CelestialEvent, NightSummary, SkyWindow } from '@/types/astronomy';

const DEDUPE_WINDOW_MS = 20 * 60 * 1000;

function dedupeEvents(events: CelestialEvent[]): CelestialEvent[] {
  const deduped: CelestialEvent[] = [];

  for (const event of events) {
    const duplicateIndex = deduped.findIndex(existing =>
      existing.body.name === event.body.name &&
      Math.abs(existing.time.getTime() - event.time.getTime()) <= DEDUPE_WINDOW_MS &&
      (
        (existing.type === 'visible' && event.type === 'rise') ||
        (existing.type === 'rise' && event.type === 'visible')
      )
    );

    if (duplicateIndex === -1) {
      deduped.push(event);
      continue;
    }

    const existing = deduped[duplicateIndex];
    if (event.type === 'visible') {
      deduped[duplicateIndex] = event;
      continue;
    }

    if (existing.type === 'visible') {
      continue;
    }
  }

  return deduped;
}

const VISIBILITY_ORDER: Record<string, number> = {
  excellent: 3,
  good: 2,
  low: 1,
  'not-visible': 0,
};

function sortRecommendationCandidates(a: CelestialEvent, b: CelestialEvent): number {
  const scoreDiff = (VISIBILITY_ORDER[b.visibilityScore] ?? 0) - (VISIBILITY_ORDER[a.visibilityScore] ?? 0);
  if (scoreDiff !== 0) return scoreDiff;
  return a.time.getTime() - b.time.getTime();
}

export async function buildNightSummary(
  lat: number,
  lon: number,
  skyWindow: SkyWindow | null,
  cloudCover: number,
  date: Date = new Date()
): Promise<NightSummary> {
  const now = new Date();
  const moonPhase = getMoonPhase(date);
  const moonPhaseName = getMoonPhaseName(moonPhase);
  const { sunset, sunrise } = getSunsetSunrise(lat, lon, date);

  const nightStart = sunset ?? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 20, 0, 0);
  const nightEnd = sunrise ?? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 6, 0, 0);

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

    if (skyWindow) {
      const visibleWindow = findWindowVisibility(body.name, lat, lon, skyWindow, nightStart, nightEnd);

      if (visibleWindow) {
        const altAz = getAltAz(body.name, lat, lon, visibleWindow.entryTime);
        const visScore = computeVisibilityScore(
          altAz,
          skyWindow,
          cloudCover,
          moonPhase,
          body.magnitude,
          body.category
        );

        events.push({
          id: `${body.name}-visible-${visibleWindow.entryTime.getTime()}`,
          body,
          type: 'visible',
          time: visibleWindow.entryTime,
          altAz,
          inSkyWindow: true,
          visibilityScore: visScore,
          durationInWindow: visibleWindow.durationMinutes,
        });
      }
    }
  }

  // Sort chronologically
  events.sort((a, b) => a.time.getTime() - b.time.getTime());
  const visibleEvents = dedupeEvents(events);

  // Find best recommendation: prefer objects actually visible right now during the active night.
  const isActiveNight = now >= nightStart && now <= nightEnd;
  let recommendation: CelestialEvent | null = null;

  if (skyWindow && isActiveNight) {
    const currentVisibleCandidates: CelestialEvent[] = [];

    for (const body of CELESTIAL_BODIES) {
      if (body.name === 'Sun') continue;

      const altAz = getAltAz(body.name, lat, lon, now);
      if (!isInWindow(altAz, skyWindow)) {
        continue;
      }

      const visibilityScore = computeVisibilityScore(
        altAz,
        skyWindow,
        cloudCover,
        moonPhase,
        body.magnitude,
        body.category
      );

      if (visibilityScore === 'not-visible') {
        continue;
      }

      currentVisibleCandidates.push({
        id: `${body.name}-visible-now-${now.getTime()}`,
        body,
        type: 'visible',
        time: now,
        altAz,
        inSkyWindow: true,
        visibilityScore,
        durationInWindow: minutesInWindowFromNow(body.name, lat, lon, skyWindow, now),
      });
    }

    currentVisibleCandidates.sort(sortRecommendationCandidates);
    recommendation = currentVisibleCandidates[0] ?? null;
  }

  if (!recommendation) {
    const candidates = visibleEvents.filter(
      e => e.inSkyWindow && e.visibilityScore !== 'not-visible' && (!isActiveNight || e.time >= now)
    );
    candidates.sort(sortRecommendationCandidates);
    recommendation = candidates[0] ?? null;
  }

  // Overall quality score
  const excellentCount = visibleEvents.filter(e => e.visibilityScore === 'excellent').length;
  const goodCount = visibleEvents.filter(e => e.visibilityScore === 'good').length;
  const qualityScore = Math.min(
    100,
    excellentCount * 20 + goodCount * 10 + ((100 - cloudCover) / 100) * 30
  );

  return {
    date: now,
    events: visibleEvents,
    moonPhase,
    moonPhaseName,
    recommendation,
    qualityScore,
  };
}
