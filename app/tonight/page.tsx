'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Camera, Telescope } from 'lucide-react';
import { StarfieldCanvas } from '@/components/ui/StarfieldCanvas';
import { WeatherBar } from '@/components/weather/WeatherBar';
import { RecommendationCard } from '@/components/recommendation/RecommendationCard';
import { EventTimeline } from '@/components/timeline/EventTimeline';
import { TimelineFilters, type FilterType } from '@/components/timeline/TimelineFilters';
import { ObjectDetails } from '@/components/recommendation/ObjectDetails';
import { CardSkeleton } from '@/components/ui/LoadingPulse';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkyWindow } from '@/hooks/useSkyWindow';
import { useWeather } from '@/hooks/useWeather';
import { useCelestialEvents } from '@/hooks/useCelestialEvents';
import type { CelestialEvent } from '@/types/astronomy';
import { getSunsetSunrise } from '@/lib/astronomy/calculations';

export default function TonightPage() {
  const router = useRouter();
  const geo = useGeolocation();
  const { skyWindow } = useSkyWindow();
  const { weather, loading: weatherLoading } = useWeather(geo.lat, geo.lon);
  const { summary, loading: eventsLoading } = useCelestialEvents(
    geo.lat,
    geo.lon,
    skyWindow,
    weather?.currentCloudCover ?? 0
  );

  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedEvent, setSelectedEvent] = useState<CelestialEvent | null>(null);

  const now = new Date();
  const times = geo.lat !== null && geo.lon !== null
    ? getSunsetSunrise(geo.lat, geo.lon, now)
    : { sunset: null, sunrise: null };

  const nightStart = times.sunset ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
  const nightEnd = times.sunrise ?? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 6, 0, 0);

  const filteredEvents = (summary?.events ?? []).filter(e => {
    if (filter === 'all') return true;
    return e.body.category === filter;
  });

  const moonPhaseLabel = summary?.moonPhaseName ?? '';
  const moonPhaseEmoji = getMoonEmoji(summary?.moonPhase ?? 0);

  return (
    <main className="relative min-h-dvh flex flex-col pb-20">
      <StarfieldCanvas />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-12 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Tonight</h1>
            <p className="text-white/40 text-sm">
              {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
              {moonPhaseLabel && (
                <span className="ml-2">{moonPhaseEmoji} {moonPhaseLabel}</span>
              )}
            </p>
          </div>
          <button
            onClick={() => router.push('/calibrate')}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Settings className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Weather bar */}
        <WeatherBar weather={weather} loading={weatherLoading} />

        {/* No calibration banner */}
        {!skyWindow && (
          <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center gap-3">
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

        <div className="flex-1 px-4 space-y-5 mt-5">
          {/* Recommendation */}
          <section>
            {eventsLoading ? (
              <CardSkeleton />
            ) : (
              <RecommendationCard
                event={summary?.recommendation ?? null}
                loading={eventsLoading}
              />
            )}
          </section>

          {/* Timeline */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Tonight&apos;s Sky</h2>
              {summary && (
                <span className="text-white/40 text-xs">
                  {summary.events.length} events
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

          {/* Sky quality */}
          {summary && (
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Night Quality</p>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-400/50 to-gold-400 transition-all"
                    style={{ width: `${summary.qualityScore}%` }}
                  />
                </div>
              </div>
              <p className="text-gold-400 font-bold text-2xl tabular-nums">
                {Math.round(summary.qualityScore)}
              </p>
            </section>
          )}
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
          onClick={() => router.push('/sky')}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-white/40"
        >
          <Camera className="w-5 h-5" />
          <span className="text-xs">AR Sky</span>
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
