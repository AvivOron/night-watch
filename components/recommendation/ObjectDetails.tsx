import { X, Lightbulb, CalendarPlus } from 'lucide-react';
import type { CelestialEvent } from '@/types/astronomy';
import { VisibilityDot } from '@/components/ui/VisibilityDot';

interface ObjectDetailsProps {
  event: CelestialEvent;
  onClose: () => void;
}

const BODY_EMOJIS: Record<string, string> = {
  Moon: '🌙', Venus: '✨', Mars: '🔴', Jupiter: '🪐', Saturn: '💫',
  Mercury: '⚫', Uranus: '🔵', Neptune: '💙', M31: '🌌', M42: '🌠', M45: '⭐', M13: '✦',
};

export function ObjectDetails({ event, onClose }: ObjectDetailsProps) {
  const { body, time, altAz, visibilityScore } = event;
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full rounded-t-3xl border-t border-white/10 bg-navy-900/95 backdrop-blur-xl p-6 space-y-5 pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{BODY_EMOJIS[body.name] ?? '⭐'}</span>
            <div>
              <h3 className="text-xl font-bold text-white">{body.displayName}</h3>
              <VisibilityDot score={visibilityScore} showLabel />
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-white/70 text-sm leading-relaxed">{body.description}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3 space-y-1">
            <p className="text-white/40 text-xs">Event Time</p>
            <p className="text-white font-medium">{timeStr}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 space-y-1">
            <p className="text-white/40 text-xs">Altitude</p>
            <p className="text-white font-medium">{Math.round(altAz.altitude)}° above horizon</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 space-y-1">
            <p className="text-white/40 text-xs">Direction</p>
            <p className="text-white font-medium">{Math.round(altAz.azimuth)}° ({azimuthToCardinal(altAz.azimuth)})</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 space-y-1">
            <p className="text-white/40 text-xs">Difficulty</p>
            <p className="text-white font-medium capitalize">{body.difficulty.replace('-', ' ')}</p>
          </div>
        </div>

        <div className="rounded-xl bg-gold-400/10 border border-gold-400/20 p-4 flex gap-3">
          <Lightbulb className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
          <p className="text-white/70 text-sm">{body.funFact}</p>
        </div>

        <div className="flex gap-2">
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/8 border border-white/10 text-white/70 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <CalendarPlus className="w-4 h-4" />
            Google
          </a>
          <button
            onClick={() => downloadICS(event)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/8 border border-white/10 text-white/70 text-sm font-medium active:scale-[0.98] transition-transform"
          >
            <CalendarPlus className="w-4 h-4" />
            Apple / ICS
          </button>
        </div>
      </div>
    </div>
  );
}

function toICSDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
}

const EVENT_LABELS: Record<string, string> = { rise: 'Rises', set: 'Sets', transit: 'Peak', moon_phase: 'Phase' };

function googleCalendarUrl(event: CelestialEvent): string {
  const { body, time, type, altAz } = event;
  const title = `[NightWatch] ${body.displayName} ${EVENT_LABELS[type] ?? type}`;
  const end = new Date(time.getTime() + 30 * 60 * 1000);
  const details = `${body.description}\n\nAltitude: ${Math.round(altAz.altitude)}° | Direction: ${Math.round(altAz.azimuth)}° (${azimuthToCardinal(altAz.azimuth)})\n\n${body.funFact}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toICSDate(time)}/${toICSDate(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function downloadICS(event: CelestialEvent): void {
  const { body, time, type, altAz } = event;
  const title = `${body.displayName} ${EVENT_LABELS[type] ?? type}`;
  const end = new Date(time.getTime() + 30 * 60 * 1000);
  const description = `${body.description}\\n\\nAltitude: ${Math.round(altAz.altitude)}° | Direction: ${Math.round(altAz.azimuth)}° (${azimuthToCardinal(altAz.azimuth)})\\n\\n${body.funFact}`;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Night Watch//EN',
    'BEGIN:VEVENT',
    `UID:${time.getTime()}-${body.name}@night-watch`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(time)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${body.name}-${type}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

function azimuthToCardinal(az: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(az / 45) % 8];
}
