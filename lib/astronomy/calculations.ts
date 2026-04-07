import * as Astronomy from 'astronomy-engine';
import type { AltAz, BodyName } from '@/types/astronomy';

type EnginePlanet = Exclude<BodyName, 'M31' | 'M42' | 'M45' | 'M13'>;

// Fixed RA/Dec for deep sky objects (J2000 epoch)
const DSO_COORDS: Partial<Record<BodyName, { ra: number; dec: number }>> = {
  M31: { ra: 0.7123, dec: 41.269 },  // Andromeda Galaxy
  M42: { ra: 5.5887, dec: -5.391 }, // Orion Nebula
  M45: { ra: 3.7906, dec: 24.117 }, // Pleiades
  M13: { ra: 16.6948, dec: 36.46 }, // Hercules Cluster
};

function toAstronomyBody(name: EnginePlanet): Astronomy.Body {
  switch (name) {
    case 'Moon': return Astronomy.Body.Moon;
    case 'Mercury': return Astronomy.Body.Mercury;
    case 'Venus': return Astronomy.Body.Venus;
    case 'Mars': return Astronomy.Body.Mars;
    case 'Jupiter': return Astronomy.Body.Jupiter;
    case 'Saturn': return Astronomy.Body.Saturn;
    case 'Uranus': return Astronomy.Body.Uranus;
    case 'Neptune': return Astronomy.Body.Neptune;
    case 'Sun': return Astronomy.Body.Sun;
    default: throw new Error(`Unknown body: ${name}`);
  }
}

function isDSOName(name: BodyName): boolean {
  return name in DSO_COORDS;
}

export function getAltAz(name: BodyName, lat: number, lon: number, date: Date): AltAz {
  const observer = new Astronomy.Observer(lat, lon, 0);
  const time = Astronomy.MakeTime(date);

  if (isDSOName(name)) {
    const coords = DSO_COORDS[name]!;
    const hor = Astronomy.Horizon(time, observer, coords.ra, coords.dec, 'normal');
    return { altitude: hor.altitude, azimuth: hor.azimuth };
  }

  const body = toAstronomyBody(name as EnginePlanet);
  const equ = Astronomy.Equator(body, time, observer, true, true);
  const hor = Astronomy.Horizon(time, observer, equ.ra, equ.dec, 'normal');
  return { altitude: hor.altitude, azimuth: hor.azimuth };
}

export function getRiseSetTimes(
  name: BodyName,
  lat: number,
  lon: number,
  date: Date
): { rise: Date | null; transit: Date | null; set: Date | null } {
  const observer = new Astronomy.Observer(lat, lon, 0);

  if (isDSOName(name)) {
    const coords = DSO_COORDS[name]!;
    return computeDSOTimes(coords.ra, coords.dec, lat, lon, date);
  }

  const body = toAstronomyBody(name as EnginePlanet);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  let rise: Date | null = null;
  let transit: Date | null = null;
  let set: Date | null = null;

  try {
    const r = Astronomy.SearchRiseSet(body, observer, 1, startOfDay, 1);
    rise = r ? r.date : null;
  } catch { /* body may not rise today */ }

  try {
    const s = Astronomy.SearchRiseSet(body, observer, -1, startOfDay, 1);
    set = s ? s.date : null;
  } catch { /* body may not set today */ }

  try {
    const t = Astronomy.SearchHourAngle(body, observer, 0, Astronomy.MakeTime(startOfDay), 1);
    transit = t ? t.time.date : null;
  } catch { /* transit search failed */ }

  return { rise, transit, set };
}

function computeDSOTimes(
  ra: number,
  dec: number,
  lat: number,
  lon: number,
  date: Date
): { rise: Date | null; transit: Date | null; set: Date | null } {
  const latRad = (lat * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const horizonDip = -0.5667;
  const horizonRad = (horizonDip * Math.PI) / 180;

  const cosH =
    (Math.sin(horizonRad) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));

  if (Math.abs(cosH) > 1) {
    return { rise: null, transit: null, set: null };
  }

  const H = (Math.acos(cosH) * 180) / Math.PI;

  const jd = Astronomy.MakeTime(date).ut + 2451545.0;
  const T = (jd - 2451545.0) / 36525;
  const gst = (280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T) % 360;
  const lst = ((gst + lon) % 360 + 360) % 360;
  const lha = ((lst - ra * 15) % 360 + 360) % 360;

  const transitHoursFromNow = ((360 - lha) % 360) / 15;
  const riseHoursFromNow = ((transitHoursFromNow - H / 15) % 24 + 24) % 24;
  const setHoursFromNow = ((transitHoursFromNow + H / 15) % 24 + 24) % 24;

  const msNow = date.getTime();
  return {
    rise: new Date(msNow + riseHoursFromNow * 3600000),
    transit: new Date(msNow + transitHoursFromNow * 3600000),
    set: new Date(msNow + setHoursFromNow * 3600000),
  };
}

export function getMoonPhase(date: Date): number {
  const angle = Astronomy.MoonPhase(date);
  return angle / 360;
}

export function getMoonPhaseName(phase: number): string {
  if (phase < 0.0625 || phase >= 0.9375) return 'New Moon';
  if (phase < 0.1875) return 'Waxing Crescent';
  if (phase < 0.3125) return 'First Quarter';
  if (phase < 0.4375) return 'Waxing Gibbous';
  if (phase < 0.5625) return 'Full Moon';
  if (phase < 0.6875) return 'Waning Gibbous';
  if (phase < 0.8125) return 'Last Quarter';
  return 'Waning Crescent';
}

export function getSunsetSunrise(
  lat: number,
  lon: number,
  date: Date
): { sunset: Date | null; sunrise: Date | null } {
  const observer = new Astronomy.Observer(lat, lon, 0);
  const startOfDay = new Date(date);
  startOfDay.setHours(12, 0, 0, 0); // search from noon

  try {
    const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, startOfDay, 1);
    const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, startOfDay, 1);
    return {
      sunset: sunset ? sunset.date : null,
      sunrise: sunrise ? sunrise.date : null,
    };
  } catch {
    return { sunset: null, sunrise: null };
  }
}
