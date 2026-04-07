import { X, Lightbulb } from 'lucide-react';
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
      </div>
    </div>
  );
}

function azimuthToCardinal(az: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(az / 45) % 8];
}
