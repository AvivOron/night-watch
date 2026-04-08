'use client';

import { useRef, useEffect, useState } from 'react';
import type { CelestialEvent } from '@/types/astronomy';
import { EventCard } from './EventCard';

interface EventTimelineProps {
  events: CelestialEvent[];
  nightStart: Date;
  nightEnd: Date;
  onEventTap: (event: CelestialEvent) => void;
}

const CARD_WIDTH = 76;
const CARD_GAP = 8;
const CARD_STRIDE = CARD_WIDTH + CARD_GAP;
const CARD_TOP = 8;
const CARD_HEIGHT = 110;
const BAR_Y = CARD_TOP + CARD_HEIGHT + 16;
const TOTAL_HEIGHT = BAR_Y + 20;

export function EventTimeline({ events, nightStart, nightEnd, onEventTap }: EventTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now] = useState(new Date());

  const cardXs = events.map((_, i) => i * CARD_STRIDE + 8);

  const trackWidth = Math.max(
    cardXs.length > 0 ? cardXs[cardXs.length - 1] + CARD_WIDTH + 16 : 0,
    400
  );

  function cardCenter(i: number): number {
    return cardXs[i] + CARD_WIDTH / 2;
  }

  // Map a real time → x position on the bar (stretched between first and last card center)
  function timeToX(t: Date): number {
    if (events.length < 2) return cardCenter(0);
    const frac = Math.max(0, Math.min(1,
      (t.getTime() - nightStart.getTime()) / (nightEnd.getTime() - nightStart.getTime())
    ));
    return cardCenter(0) + frac * (cardCenter(events.length - 1) - cardCenter(0));
  }

  const nowX = timeToX(now);
  const barLeft = cardCenter(0);
  const barRight = cardCenter(events.length - 1);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, nowX - el.clientWidth / 2);
  }, [nowX]);

  const nowIsOnBar = nowX >= barLeft && nowX <= barRight;

  return (
    <div
      ref={scrollRef}
      className="overflow-x-auto"
      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
    >
      <div className="relative" style={{ width: trackWidth, height: TOTAL_HEIGHT, minWidth: '100%' }}>

        {/* Event cards */}
        {events.map((event, i) => (
          <div
            key={event.id}
            className={`absolute ${event.time < now ? 'opacity-35' : ''}`}
            style={{ left: cardXs[i], top: CARD_TOP }}
          >
            <EventCard event={event} onTap={() => onEventTap(event)} />
          </div>
        ))}

        <svg
          className="absolute inset-0 pointer-events-none"
          width={trackWidth}
          height={TOTAL_HEIGHT}
        >
          {/* Timeline bar — past portion */}
          <line
            x1={barLeft} y1={BAR_Y}
            x2={Math.min(nowX, barRight)} y2={BAR_Y}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
          {/* Timeline bar — future portion */}
          <line
            x1={Math.max(nowX, barLeft)} y1={BAR_Y}
            x2={barRight} y2={BAR_Y}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />

          {/* Dashed drop lines + event dots */}
          {events.map((event, i) => {
            const cx = cardCenter(i);
            const dotX = timeToX(event.time);
            const isPast = event.time < now;
            const dotColor = isPast
              ? 'rgba(255,255,255,0.2)'
              : event.inSkyWindow
              ? 'rgb(251,191,36)'
              : 'rgba(255,255,255,0.45)';

            return (
              <g key={event.id}>
                <line
                  x1={cx} y1={CARD_TOP + CARD_HEIGHT}
                  x2={cx} y2={BAR_Y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  strokeDasharray="2 3"
                />
                <circle cx={dotX} cy={BAR_Y} r={3} fill={dotColor} />
              </g>
            );
          })}

          {/* Now marker */}
          {nowIsOnBar && (
            <g>
              <circle cx={nowX} cy={BAR_Y} r={4} fill="rgb(251,191,36)" />
              <line
                x1={nowX} y1={CARD_TOP}
                x2={nowX} y2={BAR_Y - 4}
                stroke="rgb(251,191,36)"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
            </g>
          )}
        </svg>

        {/* NOW label */}
        {nowIsOnBar && (
          <div
            className="absolute text-[9px] font-mono text-gold-400 whitespace-nowrap"
            style={{ left: nowX, top: BAR_Y + 6, transform: 'translateX(-50%)' }}
          >
            NOW
          </div>
        )}
      </div>
    </div>
  );
}
