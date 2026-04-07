import type { CelestialEvent } from '@/types/astronomy';
import { VisibilityDot } from '@/components/ui/VisibilityDot';

interface EventCardProps {
  event: CelestialEvent;
  onTap: () => void;
}

const BODY_ICONS: Record<string, string> = {
  planet: '●',
  moon: '◐',
  dso: '✦',
  star: '★',
  satellite: '◆',
};

const EVENT_LABELS: Record<string, string> = {
  rise: 'Rises',
  set: 'Sets',
  transit: 'Peak',
  moon_phase: 'Phase',
};

export function EventCard({ event, onTap }: EventCardProps) {
  const { body, type, time, visibilityScore, inSkyWindow } = event;

  const timeStr = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <button
      onClick={onTap}
      className={[
        'w-[72px] rounded-xl p-2 text-center transition-all active:scale-95',
        'border backdrop-blur-md',
        inSkyWindow
          ? 'bg-gold-400/10 border-gold-400/30 shadow-sm shadow-gold-400/20'
          : 'bg-white/5 border-white/10',
      ].join(' ')}
    >
      <div className={`text-xl mb-1 ${body.color}`}>
        {BODY_ICONS[body.category] ?? '●'}
      </div>
      <p className="text-white text-[10px] font-semibold leading-tight truncate">{body.displayName}</p>
      <p className="text-white/40 text-[9px] mt-0.5">{EVENT_LABELS[type]}</p>
      <p className="text-white/70 text-[10px] font-mono mt-1">{timeStr}</p>
      <div className="mt-1.5 flex justify-center">
        <VisibilityDot score={visibilityScore} />
      </div>
    </button>
  );
}
