'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Camera, Telescope, ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import { StarfieldCanvas } from '@/components/ui/StarfieldCanvas';
import { WeatherBar } from '@/components/weather/WeatherBar';
import { RecommendationCard } from '@/components/recommendation/RecommendationCard';
import { EventTimeline } from '@/components/timeline/EventTimeline';
import { TimelineFilters, type FilterType } from '@/components/timeline/TimelineFilters';
import { ObjectDetails } from '@/components/recommendation/ObjectDetails';
import { CardSkeleton } from '@/components/ui/LoadingPulse';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkyWindow } from '@/hooks/useSkyWindow';
import { useCity } from '@/hooks/useCity';
import { useBestNights } from '@/hooks/useBestNights';
import { useWeather } from '@/hooks/useWeather';
import { useCelestialEvents } from '@/hooks/useCelestialEvents';
import type { CelestialEvent } from '@/types/astronomy';
import { getSunsetSunrise } from '@/lib/astronomy/calculations';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fallbackNightAnchorDate(now: Date): Date {
  const anchor = startOfDay(now);
  if (now.getHours() < 6) {
    anchor.setDate(anchor.getDate() - 1);
  }
  return anchor;
}

function getNightAnchorDate(now: Date, lat: number | null, lon: number | null): Date {
  if (lat === null || lon === null) {
    return fallbackNightAnchorDate(now);
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

export default function TonightPage() {
  const router = useRouter();
  const geo = useGeolocation();
  const city = useCity(geo.lat, geo.lon);
  const { skyWindow } = useSkyWindow();
  const [selectedDate, setSelectedDate] = useState(() => fallbackNightAnchorDate(new Date()));
  const autoDateRef = useRef(true);
  const { weather, loading: weatherLoading } = useWeather(geo.lat, geo.lon, selectedDate);

  const { days: bestNights, loading: bestNightsLoading } = useBestNights(geo.lat, geo.lon, skyWindow);

  const { summary, loading: eventsLoading } = useCelestialEvents(
    geo.lat,
    geo.lon,
    skyWindow,
    weather?.currentCloudCover ?? null,
    selectedDate,
  );

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedEvent, setSelectedEvent] = useState<CelestialEvent | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const anchorToday = getNightAnchorDate(new Date(), geo.lat, geo.lon);
  const isToday = selectedDate.getTime() === anchorToday.getTime();
  const dayOffset = Math.round((selectedDate.getTime() - anchorToday.getTime()) / 86400000);

  useEffect(() => {
    if (!autoDateRef.current) return;
    setSelectedDate(prev => (
      prev.getTime() === anchorToday.getTime() ? prev : anchorToday
    ));
  }, [anchorToday]);

  function shiftDay(delta: number) {
    autoDateRef.current = false;
    setSelectedDate(d => {
      const next = new Date(d);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }

  const times = geo.lat !== null && geo.lon !== null
    ? getSunsetSunrise(geo.lat, geo.lon, selectedDate)
    : { sunset: null, sunrise: null };

  const nightStart = times.sunset ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 20, 0, 0);
  const nightEnd = times.sunrise ?? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1, 6, 0, 0);

  const filteredEvents = (summary?.events ?? []).filter(e => {
    if (skyWindow && !e.inSkyWindow) return false;
    if (filter === 'all') return true;
    return e.body.category === filter;
  });

  const moonPhaseLabel = summary?.moonPhaseName ?? '';
  const moonPhaseEmoji = getMoonEmoji(summary?.moonPhase ?? 0);
  const showQualitySkeleton = eventsLoading || weatherLoading || !summary;
  const showRecommendationSkeleton = eventsLoading || weatherLoading || !summary;

  return (
    <main className="relative min-h-dvh flex flex-col pb-20">
      <StarfieldCanvas />

      <div className="relative z-10 flex flex-col flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-12 pb-4 md:px-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isToday ? 'Tonight' : dayOffset === 1 ? 'Tomorrow' : selectedDate.toLocaleDateString([], { weekday: 'long' })}
              </h1>
              <p className="text-white/40 text-sm">
                {selectedDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                {moonPhaseLabel && (
                  <span className="ml-2">{moonPhaseEmoji} {moonPhaseLabel}</span>
                )}
              </p>
              {city && (
                <p className="text-white/30 text-xs mt-0.5">{city}</p>
              )}
            </div>
            <button
              onClick={() => router.push('/calibrate')}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Settings className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Date navigation */}
          <div className="flex items-center justify-center gap-3 px-4 pb-2 md:px-6">
            <button
              onClick={() => shiftDay(-1)}
              disabled={isToday}
              className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-20"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>

            {/* Date picker trigger */}
            <label className={`relative px-3 py-1 rounded-lg text-xs font-medium cursor-pointer active:scale-95 transition-transform ${isToday ? 'bg-gold-400/20 text-gold-400' : 'bg-white/8 text-white/50'}`}>
              {isToday ? 'Tonight' : selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              <input
                type="date"
                min={anchorToday.toISOString().slice(0, 10)}
                value={selectedDate.toISOString().slice(0, 10)}
                onChange={e => {
                  if (!e.target.value) return;
                  autoDateRef.current = false;
                  setSelectedDate(new Date(e.target.value + 'T00:00:00'));
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>

            <button
              onClick={() => shiftDay(1)}
              className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Weather bar */}
          <div className="px-4 md:px-6">
            <WeatherBar weather={weather} loading={weatherLoading} />
          </div>

          {/* Sky quality */}
          {showQualitySkeleton ? (
            <div className="mx-4 mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 animate-pulse md:mx-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded-full bg-white/10" />
                  <div className="h-1.5 w-full rounded-full bg-white/10" />
                  <div className="h-3 w-40 rounded-full bg-white/10" />
                </div>
                <div className="h-8 w-10 rounded-full bg-white/10" />
              </div>
            </div>
          ) : (
            <div className="mx-4 mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-4 md:mx-6">
              <div className="flex-1">
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Night Quality</p>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-400/50 to-gold-400 transition-all"
                    style={{ width: `${summary.qualityScore}%` }}
                  />
                </div>
                <p className="text-white/30 text-[11px] mt-1.5 leading-snug">
                  {getNightQualityExplanation(summary)}
                </p>
              </div>
              <p className="text-gold-400 font-bold text-2xl tabular-nums">
                {Math.round(summary.qualityScore)}
              </p>
            </div>
          )}

          {/* No calibration banner */}
          {!skyWindow && (
            <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center gap-3 md:mx-6">
              <Telescope className="w-5 h-5 text-gold-400 shrink-0" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Calibrate your sky window</p>
                <p className="text-white/50 text-xs">See what&apos;s visible from your specific view</p>
              </div>
              <button
                onClick={() => router.push('/calibrate')}
                className="text-gold-400 text-sm font-medium shrink-0"
              >
                Set up →
              </button>
            </div>
          )}

          <div className="flex-1 px-4 mt-5 md:px-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
              <div className="space-y-5 min-w-0">
                {/* Recommendation */}
                <section>
                  {showRecommendationSkeleton ? (
                    <CardSkeleton />
                  ) : (
                    <RecommendationCard
                      event={summary?.recommendation ?? null}
                      loading={showRecommendationSkeleton}
                    />
                  )}
                </section>

                {/* Timeline */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-white font-semibold">Tonight&apos;s Sky</h2>
                    {summary && (
                      <span className="text-white/40 text-xs">
                        {filteredEvents.length} events
                      </span>
                    )}
                  </div>

                  <TimelineFilters active={filter} onChange={setFilter} />

                  {eventsLoading ? (
                    <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
                  ) : filteredEvents.length > 0 ? (
                    <EventTimeline
                      events={filteredEvents}
                      nightStart={nightStart}
                      nightEnd={nightEnd}
                      onEventTap={setSelectedEvent}
                    />
                  ) : (
                    <div className="h-32 rounded-2xl bg-white/5 flex items-center justify-center">
                      <p className="text-white/30 text-sm">No events in this category tonight</p>
                    </div>
                  )}
                </section>
              </div>

              {/* Best nights */}
              <section className="space-y-3 pb-2 xl:sticky xl:top-6 self-start">
                <h2 className="text-white font-semibold">Best Nights Ahead</h2>
                {bestNightsLoading ? (
                  <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
                ) : (
                  <div className="space-y-2">
                    {[...bestNights]
                      .sort((a, b) => b.qualityScore - a.qualityScore)
                      .slice(0, 7)
                      .map(day => {
                        const isSelected = day.date.toDateString() === selectedDate.toDateString();
                        const isToday = day.date.toDateString() === anchorToday.toDateString();
                        const label = isToday ? 'Tonight' : day.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                        return (
                          <button
                            key={day.date.getTime()}
                            onClick={() => {
                              autoDateRef.current = false;
                              setSelectedDate(day.date);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all active:scale-[0.98] ${isSelected ? 'bg-gold-400/10 border-gold-400/30' : 'bg-white/5 border-white/8'}`}
                          >
                            <div className="flex-1 text-left">
                              <p className={`text-sm font-medium ${isSelected ? 'text-gold-400' : 'text-white'}`}>{label}</p>
                              <p className="text-white/30 text-xs mt-0.5">{day.moonPhaseName}{!day.hasWeather ? ' · No forecast' : ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {day.excellentCount > 0 && (
                                <span className="text-[10px] text-gold-400 bg-gold-400/10 px-1.5 py-0.5 rounded-md">{day.excellentCount} excellent</span>
                              )}
                              <div className="w-10 text-right">
                                <span className={`text-sm font-bold tabular-nums ${day.qualityScore >= 60 ? 'text-gold-400' : 'text-white/50'}`}>
                                  {Math.round(day.qualityScore)}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-navy-900/80 backdrop-blur-md flex">
        <button
          className="flex-1 flex flex-col items-center gap-1 py-3 text-gold-400"
        >
          <Telescope className="w-5 h-5" />
          <span className="text-xs">Tonight</span>
        </button>
        <button
          onClick={() => router.push(isDesktop ? '/window-view' : '/sky')}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-white/40"
        >
          {isDesktop ? <Monitor className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          <span className="text-xs">{isDesktop ? 'Window View' : 'AR Sky'}</span>
        </button>
        <button
          onClick={() => router.push('/calibrate')}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-white/40"
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs">Calibrate</span>
        </button>
      </nav>

      {/* Object details sheet */}
      {selectedEvent && (
        <ObjectDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </main>
  );
}

function getNightQualityExplanation(summary: import('@/types/astronomy').NightSummary): string {
  const excellent = summary.events.filter(e => e.visibilityScore === 'excellent').length;
  const good = summary.events.filter(e => e.visibilityScore === 'good').length;
  const parts: string[] = [];
  if (excellent > 0) parts.push(`${excellent} excellent ${excellent === 1 ? 'target' : 'targets'}`);
  if (good > 0) parts.push(`${good} good ${good === 1 ? 'target' : 'targets'}`);
  if (parts.length === 0) parts.push('No well-placed targets tonight');
  return parts.join(', ') + ' in your window';
}

function getMoonEmoji(phase: number): string {
  if (phase < 0.0625 || phase >= 0.9375) return '🌑';
  if (phase < 0.1875) return '🌒';
  if (phase < 0.3125) return '🌓';
  if (phase < 0.4375) return '🌔';
  if (phase < 0.5625) return '🌕';
  if (phase < 0.6875) return '🌖';
  if (phase < 0.8125) return '🌗';
  return '🌘';
}
