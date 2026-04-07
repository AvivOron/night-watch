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

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `/api/weather?lat=${lat}&lon=${lon}`;
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
  const current = hourly.find(h => h.time >= now) ?? hourly[0];
  const currentCloudCover = current?.cloudCoverPercent ?? 0;
  const currentCode = current?.weatherCode ?? 0;

  // Use both cloud cover and weather code for seeing
  const cloudQuality = cloudCoverToSeeing(currentCloudCover);
  const codeQuality = weatherCodeToSeeing(currentCode);
  const qualityOrder = ['excellent', 'good', 'fair', 'poor'];
  const quality = qualityOrder[
    Math.max(qualityOrder.indexOf(cloudQuality), qualityOrder.indexOf(codeQuality))
  ] as 'excellent' | 'good' | 'fair' | 'poor';

  return {
    fetchedAt: new Date(),
    hourly,
    currentCloudCover,
    seeingQuality: quality,
    seeingLabel: seeingLabel(quality),
  };
}
