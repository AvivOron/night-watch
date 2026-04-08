import type { WeatherData, HourlySlot } from '@/types/weather';

function weatherCodeToSeeing(code: number): 'excellent' | 'good' | 'fair' | 'poor' {
  // WMO weather codes: 0 = clear, 1-3 = partly cloudy, 45+ = fog/rain/etc
  if (code === 0) return 'excellent';
  if (code <= 3) return 'good';
  if (code <= 9) return 'fair';
  return 'poor';
}

function cloudCoverToSeeing(cloud: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (cloud < 10) return 'excellent';
  if (cloud < 30) return 'good';
  if (cloud < 60) return 'fair';
  return 'poor';
}

function seeingLabel(quality: 'excellent' | 'good' | 'fair' | 'poor'): string {
  switch (quality) {
    case 'excellent': return 'Perfect skies tonight';
    case 'good': return 'Good viewing conditions';
    case 'fair': return 'Some clouds expected';
    case 'poor': return 'Heavy cloud cover';
  }
}

function pickRepresentativeNightSlot(hourly: HourlySlot[], date: Date): HourlySlot | null {
  const y = date.getFullYear();
  const mo = date.getMonth();
  const d = date.getDate();

  const sameNightLate = hourly.filter(h =>
    h.time.getFullYear() === y &&
    h.time.getMonth() === mo &&
    h.time.getDate() === d &&
    h.time.getHours() >= 20
  );

  if (sameNightLate.length > 0) {
    return (
      sameNightLate.find(h => h.time.getHours() === 22) ??
      sameNightLate[0]
    );
  }

  const nextDayOvernight = new Date(date);
  nextDayOvernight.setDate(nextDayOvernight.getDate() + 1);
  const y2 = nextDayOvernight.getFullYear();
  const mo2 = nextDayOvernight.getMonth();
  const d2 = nextDayOvernight.getDate();

  const overnight = hourly.filter(h =>
    h.time.getFullYear() === y2 &&
    h.time.getMonth() === mo2 &&
    h.time.getDate() === d2 &&
    h.time.getHours() < 6
  );

  if (overnight.length > 0) {
    return (
      overnight.find(h => h.time.getHours() === 0) ??
      overnight[0]
    );
  }

  return (
    hourly.find(h =>
      h.time.getFullYear() === y &&
      h.time.getMonth() === mo &&
      h.time.getDate() === d
    ) ?? null
  );
}

function pickNearestCurrentSlot(hourly: HourlySlot[], now: Date): HourlySlot | null {
  let best: HourlySlot | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const slot of hourly) {
    const diff = Math.abs(slot.time.getTime() - now.getTime());
    if (diff < bestDiff) {
      best = slot;
      bestDiff = diff;
    }
  }

  return best;
}

export async function fetchWeather(lat: number, lon: number, date: Date = new Date()): Promise<WeatherData> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const url = `${basePath}/api/weather?lat=${lat}&lon=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');
  const data = await res.json();

  const hourlyTimes: string[] = data.hourly?.time ?? [];
  const cloudCoverArr: number[] = data.hourly?.cloud_cover ?? [];
  const visibilityArr: number[] = data.hourly?.visibility ?? [];
  const precipArr: number[] = data.hourly?.precipitation_probability ?? [];
  const weatherCodeArr: number[] = data.hourly?.weather_code ?? [];

  const hourly: HourlySlot[] = hourlyTimes.map((t, i) => ({
    time: new Date(t),
    cloudCoverPercent: cloudCoverArr[i] ?? 0,
    visibilityMeters: visibilityArr[i] ?? 10000,
    precipitationProbability: precipArr[i] ?? 0,
    weatherCode: weatherCodeArr[i] ?? 0,
  }));

  const now = new Date();
  const isSelectedDateToday = (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );

  const current = isSelectedDateToday
    ? pickNearestCurrentSlot(hourly, now)
    : pickRepresentativeNightSlot(hourly, date);

  const noForecast = current === null;
  const currentCloudCover = current?.cloudCoverPercent ?? 0;
  const currentCode = current?.weatherCode ?? 0;

  const cloudQuality = cloudCoverToSeeing(currentCloudCover);
  const codeQuality = weatherCodeToSeeing(currentCode);
  const qualityOrder = ['excellent', 'good', 'fair', 'poor'];
  const quality = noForecast
    ? 'excellent' // no data — don't penalize
    : qualityOrder[
        Math.max(qualityOrder.indexOf(cloudQuality), qualityOrder.indexOf(codeQuality))
      ] as 'excellent' | 'good' | 'fair' | 'poor';

  return {
    fetchedAt: new Date(),
    hourly,
    currentCloudCover: noForecast ? 0 : currentCloudCover,
    seeingQuality: quality,
    seeingLabel: noForecast ? 'No forecast available' : seeingLabel(quality),
  };
}
