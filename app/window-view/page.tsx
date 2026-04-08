'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Clock, Monitor, Telescope } from 'lucide-react';
import { StarfieldCanvas } from '@/components/ui/StarfieldCanvas';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkyWindow } from '@/hooks/useSkyWindow';
import { CELESTIAL_BODIES } from '@/lib/astronomy/bodies';
import { getAltAz, getSunsetSunrise } from '@/lib/astronomy/calculations';
import { computeVisibilityScore, isAzimuthInWindow, isInWindow, minutesInWindowFromNow } from '@/lib/astronomy/visibility';
import { ObjectDetails } from '@/components/recommendation/ObjectDetails';
import type { CelestialEvent, SkyWindow } from '@/types/astronomy';

const BODY_COLORS: Record<string, string> = {
  Moon: '#FFFDE7',
  Venus: '#FFF9C4',
  Mars: '#EF9A9A',
  Jupiter: '#FFE0B2',
  Saturn: '#FFF8E1',
  Mercury: '#B0BEC5',
  Uranus: '#B2EBF2',
  Neptune: '#90CAF9',
  Sirius: '#E3F2FD',
  Canopus: '#FFF8E1',
  Arcturus: '#FFE0B2',
  Vega: '#E1F5FE',
  Capella: '#FFFDE7',
  Rigel: '#E8EAF6',
  Procyon: '#FFFDE7',
  Betelgeuse: '#FFCCBC',
  Aldebaran: '#FFCC80',
  Spica: '#E3F2FD',
  Altair: '#FAFAFA',
  Deneb: '#ECEFF1',
};

type WindowPoint = {
  event: CelestialEvent;
  xPercent: number;
  yPercent: number;
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getNightAnchorDate(now: Date, lat: number | null, lon: number | null): Date {
  if (lat === null || lon === null) {
    const anchor = startOfDay(now);
    if (now.getHours() < 6) {
      anchor.setDate(anchor.getDate() - 1);
    }
    return anchor;
  }

  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayNight = getSunsetSunrise(lat, lon, yesterday);
  if (yesterdayNight.sunrise && now < yesterdayNight.sunrise) {
    return yesterday;
  }

  return today;
}

function getWindowWidth(window: SkyWindow): number {
  return window.crossesNorth
    ? (360 - window.azimuthMin) + window.azimuthMax
    : window.azimuthMax - window.azimuthMin;
}

function getAzimuthOffset(azimuth: number, window: SkyWindow): number | null {
  if (!isAzimuthInWindow(azimuth, window)) return null;

  if (!window.crossesNorth) {
    return azimuth - window.azimuthMin;
  }

  if (azimuth >= window.azimuthMin) {
    return azimuth - window.azimuthMin;
  }

  return (360 - window.azimuthMin) + azimuth;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function buildWindowPoints(
  lat: number,
  lon: number,
  skyWindow: SkyWindow,
  time: Date
): WindowPoint[] {
  const windowWidth = getWindowWidth(skyWindow);
  const altitudeRange = Math.max(1, skyWindow.altitudeMax - skyWindow.altitudeMin);
  const points: WindowPoint[] = [];

  for (const body of CELESTIAL_BODIES) {
    if (body.name === 'Sun') continue;

    const altAz = getAltAz(body.name, lat, lon, time);
    if (!isInWindow(altAz, skyWindow)) continue;

    const azimuthOffset = getAzimuthOffset(altAz.azimuth, skyWindow);
    if (azimuthOffset === null) continue;

    const xPercent = (azimuthOffset / windowWidth) * 100;
    const yPercent = 100 - (((altAz.altitude - skyWindow.altitudeMin) / altitudeRange) * 100);

    points.push({
      event: {
        id: `${body.name}-${time.getTime()}`,
        body,
        type: 'visible',
        time,
        altAz,
        inSkyWindow: true,
        visibilityScore: computeVisibilityScore(altAz, skyWindow, 0, 0, body.magnitude, body.category),
        durationInWindow: minutesInWindowFromNow(body.name, lat, lon, skyWindow, time),
      },
      xPercent,
      yPercent,
    });
  }

  points.sort((a, b) => a.event.body.magnitude - b.event.body.magnitude);
  return points;
}

export default function WindowViewPage() {
  const router = useRouter();
  const params = useSearchParams();
  const targetBody = params.get('body');
  const geo = useGeolocation();
  const { skyWindow } = useSkyWindow();
  const [selectedEvent, setSelectedEvent] = useState<CelestialEvent | null>(null);
  const [offsetMinutes, setOffsetMinutes] = useState(0);
  const [hasScrubbed, setHasScrubbed] = useState(false);
  const now = new Date();
  const nightAnchorDate = getNightAnchorDate(now, geo.lat, geo.lon);

  const nightWindow = geo.lat === null || geo.lon === null
    ? null
    : (() => {
        const night = getSunsetSunrise(geo.lat, geo.lon, nightAnchorDate);
        return {
          sunset: night.sunset ?? new Date(
            nightAnchorDate.getFullYear(),
            nightAnchorDate.getMonth(),
            nightAnchorDate.getDate(),
            20,
            0,
            0
          ),
          sunrise: night.sunrise ?? new Date(
            nightAnchorDate.getFullYear(),
            nightAnchorDate.getMonth(),
            nightAnchorDate.getDate() + 1,
            6,
            0,
            0
          ),
        };
      })();

  const isActiveNight = !!nightWindow && now > nightWindow.sunset && now < nightWindow.sunrise;
  const scrubStart = nightWindow ? nightWindow.sunset : now;
  const maxOffsetMinutes = nightWindow
    ? Math.max(0, Math.round((nightWindow.sunrise.getTime() - scrubStart.getTime()) / 60000))
    : 720;
  const currentNightOffsetMinutes = nightWindow
    ? Math.max(0, Math.min(maxOffsetMinutes, Math.round((now.getTime() - scrubStart.getTime()) / 60000)))
    : 0;
  const effectiveOffsetMinutes = hasScrubbed ? offsetMinutes : (isActiveNight ? currentNightOffsetMinutes : 0);
  const clampedOffsetMinutes = Math.min(effectiveOffsetMinutes, maxOffsetMinutes);
  const showingCurrentTime = !!nightWindow && !hasScrubbed && !isActiveNight;
  const displayTime = showingCurrentTime
    ? now
    : new Date(scrubStart.getTime() + clampedOffsetMinutes * 60000);
  const sliderStartLabel = formatTime(scrubStart);
  const sliderEndLabel = nightWindow ? formatTime(nightWindow.sunrise) : formatTime(new Date(scrubStart.getTime() + maxOffsetMinutes * 60000));

  useEffect(() => {
    if (hasScrubbed || !isActiveNight) return;
    setOffsetMinutes(currentNightOffsetMinutes);
  }, [currentNightOffsetMinutes, hasScrubbed, isActiveNight]);

  const points = geo.lat !== null && geo.lon !== null && skyWindow
    ? buildWindowPoints(geo.lat, geo.lon, skyWindow, displayTime)
    : [];

  const targetPoint = targetBody ? points.find(point => point.event.body.name === targetBody) ?? null : null;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-navy-950">
      <StarfieldCanvas />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-8 pt-12 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-white/70 active:scale-95 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Window View</h1>
            <p className="text-sm text-white/45">Desktop fallback for planning what will cross your calibrated sky window</p>
          </div>
        </div>

        {(!skyWindow || geo.lat === null || geo.lon === null) ? (
          <div className="mt-8 flex flex-1 items-center justify-center">
            <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <Telescope className="mx-auto h-10 w-10 text-gold-400/70" />
              <p className="mt-4 text-lg font-semibold text-white">Calibration required</p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Window View needs your location and a saved sky window to place objects inside your actual view.
              </p>
              <button
                onClick={() => router.push('/calibrate')}
                className="mt-5 rounded-2xl bg-gold-400 px-5 py-3 font-semibold text-navy-950 active:scale-95 transition-transform"
              >
                Calibrate
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
            <section className="min-w-0 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">Looking Through</p>
                    <p className="mt-1 text-lg font-semibold text-white">{skyWindow.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.28em] text-white/35">Time</p>
                    <p className="mt-1 text-lg font-semibold text-gold-400">{formatTime(displayTime)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[28px] border border-gold-400/25 bg-[radial-gradient(circle_at_top,rgba(244,200,66,0.14),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.92))] p-4">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] border border-gold-400/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%),linear-gradient(180deg,rgba(11,15,35,0.96),rgba(4,8,24,0.96))]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/5 to-transparent" />
                    <div className="pointer-events-none absolute inset-3 rounded-[18px] border border-dashed border-gold-400/20" />

                    {points.map(point => {
                      const isTarget = point.event.body.name === targetBody;
                      const color = BODY_COLORS[point.event.body.name] ?? '#FFFFFF';

                      return (
                        <button
                          key={point.event.id}
                          onClick={() => setSelectedEvent(point.event)}
                          className="absolute -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }}
                        >
                          <span
                            className={`block rounded-full border ${isTarget ? 'border-gold-400/90 shadow-[0_0_18px_rgba(244,200,66,0.45)]' : 'border-white/25'}`}
                            style={{
                              width: isTarget ? 16 : 12,
                              height: isTarget ? 16 : 12,
                              backgroundColor: color,
                            }}
                          />
                          <span className={`mt-2 block whitespace-nowrap text-xs font-medium ${isTarget ? 'text-gold-400' : 'text-white/80'}`}>
                            {point.event.body.displayName}
                          </span>
                        </button>
                      );
                    })}

                    {points.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-sm text-white/35">Nothing is inside this window at {formatTime(displayTime)}</p>
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[11px] uppercase tracking-[0.28em] text-white/30">
                      Left Edge
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[11px] uppercase tracking-[0.28em] text-white/30">
                      Right Edge
                    </div>
                    <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 text-[11px] uppercase tracking-[0.28em] text-white/35">
                      High
                    </div>
                    <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.28em] text-white/35">
                      Horizon
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-white/60">
                      <Clock className="h-4 w-4 text-gold-400" />
                      <span>{showingCurrentTime ? 'Viewing now, slider starts at sunset' : 'Scrub through the night'}</span>
                    </div>
                    <span className="text-white/80">{showingCurrentTime ? `Now · ${formatTime(displayTime)}` : formatTime(displayTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxOffsetMinutes}
                    step={10}
                    value={clampedOffsetMinutes}
                    onChange={e => {
                      setHasScrubbed(true);
                      setOffsetMinutes(Number(e.target.value));
                    }}
                    className="w-full accent-gold-400"
                  />
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/35">
                    <span>{sliderStartLabel}</span>
                    <span>{sliderEndLabel}</span>
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-gold-400" />
                  <p className="text-sm font-medium text-white">Desktop Helper</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  This is the desktop substitute for AR. It shows what should sit inside your saved window at the selected time.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Target</p>
                {targetBody ? (
                  targetPoint ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-lg font-semibold text-gold-400">{targetPoint.event.body.displayName}</p>
                      <p className="text-sm text-white/60">
                        Inside your window at {formatTime(displayTime)}.
                      </p>
                      <button
                        onClick={() => setSelectedEvent(targetPoint.event)}
                        className="rounded-2xl border border-gold-400/30 bg-gold-400/10 px-4 py-2 text-sm font-medium text-gold-400"
                      >
                        Open details
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <p className="text-lg font-semibold text-white">{targetBody}</p>
                      <p className="text-sm text-white/50">
                        Not inside your calibrated window at {formatTime(displayTime)}.
                      </p>
                    </div>
                  )
                ) : (
                  <p className="mt-3 text-sm text-white/50">Open this view from a recommendation card to lock onto a specific object.</p>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Visible Now</p>
                <div className="mt-3 space-y-2">
                  {points.slice(0, 6).map(point => (
                    <button
                      key={point.event.id}
                      onClick={() => setSelectedEvent(point.event)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-left"
                    >
                      <span className="text-sm font-medium text-white">{point.event.body.displayName}</span>
                      <span className="text-xs text-white/45">
                        {Math.round(point.event.altAz.altitude)}° · {Math.round(point.event.altAz.azimuth)}°
                      </span>
                    </button>
                  ))}
                  {points.length === 0 && (
                    <p className="text-sm text-white/45">No objects are currently inside your calibrated frame.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {selectedEvent && (
        <ObjectDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} source="ar" />
      )}
    </main>
  );
}
