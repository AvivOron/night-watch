'use client';

import { useEffect, useRef } from 'react';
import type { CelestialEvent } from '@/types/astronomy';
import { EventCard } from './EventCard';

interface EventTimelineProps {
  events: CelestialEvent[];
  nightStart: Date;
  nightEnd: Date;
  onEventTap: (event: CelestialEvent) => void;
}

export function EventTimeline({ events, onEventTap }: EventTimelineProps) {
  const now = new Date();
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lastPastIndex = events.reduce((lastIndex, event, index) => (event.time < now ? index : lastIndex), -1);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    if (lastPastIndex < 0) {
      scrollEl.scrollLeft = 0;
      return;
    }
    const cardEl = cardRefs.current[lastPastIndex];
    if (!cardEl) return;
    scrollEl.scrollLeft = Math.max(0, cardEl.offsetLeft - 4);
  }, [lastPastIndex, events]);

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      <div className="flex items-start gap-2 px-1">
        {events.map((event, index) => (
          <div
            key={event.id}
            ref={el => {
              cardRefs.current[index] = el;
            }}
            className={event.time < now ? 'opacity-35 shrink-0' : 'shrink-0'}
          >
            <EventCard event={event} onTap={() => onEventTap(event)} />
          </div>
        ))}
      </div>
    </div>
  );
}
