'use client';

import { useRef, useEffect, useState } from 'react';
import type { CelestialEvent } from '@/types/astronomy';
import { EventCard } from './EventCard';
import { TimeMarker } from './TimeMarker';

interface EventTimelineProps {
  events: CelestialEvent[];
  nightStart: Date;
  nightEnd: Date;
  onEventTap: (event: CelestialEvent) => void;
}

const PX_PER_MINUTE = 3;
const CARD_WIDTH = 76; // px, matches w-[72px] + gap
const MIN_GAP = 4; // px minimum between cards

// Resolve x positions so no two cards overlap, nudging right as needed
function resolvePositions(rawXs: number[]): number[] {
  const positions = [...rawXs];
  for (let i = 1; i < positions.length; i++) {
    const minX = positions[i - 1] + CARD_WIDTH + MIN_GAP;
    if (positions[i] < minX) {
      positions[i] = minX;
    }
  }
  return positions;
}

export function EventTimeline({ events, nightStart, nightEnd, onEventTap }: EventTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now] = useState(new Date());

  const totalMinutes = (nightEnd.getTime() - nightStart.getTime()) / 60000;

  // Raw x positions from time
  const rawXs = events.map(e =>
    Math.max(0, ((e.time.getTime() - nightStart.getTime()) / 60000) * PX_PER_MINUTE - CARD_WIDTH / 2)
  );
  const resolvedXs = resolvePositions(rawXs);

  // Track width must accommodate pushed-out cards
  const maxX = resolvedXs.length > 0 ? resolvedXs[resolvedXs.length - 1] + CARD_WIDTH + 16 : 0;
  const trackWidth = Math.max(totalMinutes * PX_PER_MINUTE, 400, maxX);

  const nowOffset = Math.max(
    0,
    Math.min(
      ((now.getTime() - nightStart.getTime()) / 60000) * PX_PER_MINUTE,
      trackWidth
    )
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, nowOffset - el.clientWidth / 2);
  }, [nowOffset]);

  function timeToX(t: Date): number {
    return ((t.getTime() - nightStart.getTime()) / 60000) * PX_PER_MINUTE;
  }

  function formatHour(t: Date): string {
    return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  const ticks: Date[] = [];
  const start = new Date(nightStart);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  while (start < nightEnd) {
    ticks.push(new Date(start));
    start.setHours(start.getHours() + 1);
  }

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto pb-4"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      <div className="relative" style={{ width: trackWidth, height: 160, minWidth: '100%' }}>
        {/* Hour ticks */}
        {ticks.map(tick => {
          const x = timeToX(tick);
          return (
            <div key={tick.getTime()} className="absolute top-0 flex flex-col items-center" style={{ left: x }}>
              <div className="w-px h-full bg-white/5" />
              <span className="absolute bottom-0 text-[10px] text-white/30 whitespace-nowrap -translate-x-1/2">
                {formatHour(tick)}
              </span>
            </div>
          );
        })}

        {/* Event cards — positions de-overlapped */}
        {events.map((event, i) => (
          <div key={event.id} className="absolute top-4" style={{ left: resolvedXs[i] }}>
            <EventCard event={event} onTap={() => onEventTap(event)} />
          </div>
        ))}

        <TimeMarker x={nowOffset} />
      </div>
    </div>
  );
}
