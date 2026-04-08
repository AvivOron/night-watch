'use client';

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

  return (
    <div
      className="overflow-x-auto"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      <div className="flex items-start gap-2 px-1">
        {events.map(event => (
          <div key={event.id} className={event.time < now ? 'opacity-35 shrink-0' : 'shrink-0'}>
            <EventCard event={event} onTap={() => onEventTap(event)} />
          </div>
        ))}
      </div>
    </div>
  );
}
