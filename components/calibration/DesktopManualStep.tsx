import { Monitor, Compass, ArrowUpDown } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface DesktopManualStepProps {
  centerAzimuth: number;
  horizontalSpread: number;
  altitudeMin: number;
  altitudeMax: number;
  onCenterAzimuthChange: (value: number) => void;
  onHorizontalSpreadChange: (value: number) => void;
  onAltitudeMinChange: (value: number) => void;
  onAltitudeMaxChange: (value: number) => void;
  onDone: () => void;
}

const DIRECTION_PRESETS = [
  { label: 'N', value: 0 },
  { label: 'NE', value: 45 },
  { label: 'E', value: 90 },
  { label: 'SE', value: 135 },
  { label: 'S', value: 180 },
  { label: 'SW', value: 225 },
  { label: 'W', value: 270 },
  { label: 'NW', value: 315 },
];

const WIDTH_PRESETS = [30, 60, 90, 120];

function azimuthToCardinal(azimuth: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round((((azimuth % 360) + 360) % 360) / 45) % directions.length];
}

export function DesktopManualStep({
  centerAzimuth,
  horizontalSpread,
  altitudeMin,
  altitudeMax,
  onCenterAzimuthChange,
  onHorizontalSpreadChange,
  onAltitudeMinChange,
  onAltitudeMaxChange,
  onDone,
}: DesktopManualStepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 space-y-6">
      <div className="text-center space-y-3 max-w-lg">
        <div className="w-16 h-16 mx-auto rounded-full bg-gold-400/20 flex items-center justify-center">
          <Monitor className="w-8 h-8 text-gold-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Desktop Calibration</h2>
        <p className="text-white/60 text-base leading-relaxed">
          Night Watch works best on mobile where it can use your sensors and camera. On desktop, set a simple
          viewing cone so the event list still stays useful.
        </p>
      </div>

      <GlassCard className="w-full max-w-xl p-5 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white">
            <Compass className="w-4 h-4 text-gold-400" />
            <p className="font-medium">Which direction are you facing?</p>
          </div>
          <p className="text-white/50 text-sm">
            Center your view around the direction you usually look from this window or balcony.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {DIRECTION_PRESETS.map(preset => (
              <button
                key={preset.label}
                onClick={() => onCenterAzimuthChange(preset.value)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  Math.abs(centerAzimuth - preset.value) < 0.5
                    ? 'border-gold-400/70 bg-gold-400/15 text-gold-400'
                    : 'border-white/10 bg-white/5 text-white/70'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label className="block space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Facing direction</span>
              <span className="text-white font-medium">
                {Math.round(centerAzimuth)}° ({azimuthToCardinal(centerAzimuth)})
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={359}
              value={centerAzimuth}
              onChange={e => onCenterAzimuthChange(Number(e.target.value))}
              className="w-full accent-gold-400"
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white">
            <ArrowUpDown className="w-4 h-4 text-gold-400" />
            <p className="font-medium">How wide is your horizontal view?</p>
          </div>
          <div className="flex gap-2">
            {WIDTH_PRESETS.map(width => (
              <button
                key={width}
                onClick={() => onHorizontalSpreadChange(width)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  Math.abs(horizontalSpread - width) < 0.5
                    ? 'border-gold-400/70 bg-gold-400/15 text-gold-400'
                    : 'border-white/10 bg-white/5 text-white/70'
                }`}
              >
                {width}°
              </button>
            ))}
          </div>
          <label className="block space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Horizontal spread</span>
              <span className="text-white font-medium">{Math.round(horizontalSpread)}°</span>
            </div>
            <input
              type="range"
              min={20}
              max={180}
              step={5}
              value={horizontalSpread}
              onChange={e => onHorizontalSpreadChange(Number(e.target.value))}
              className="w-full accent-gold-400"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Lowest visible altitude</span>
              <span className="text-white font-medium">{Math.round(altitudeMin)}°</span>
            </div>
            <input
              type="range"
              min={0}
              max={45}
              step={1}
              value={altitudeMin}
              onChange={e => onAltitudeMinChange(Number(e.target.value))}
              className="w-full accent-gold-400"
            />
          </label>

          <label className="block space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">Highest visible altitude</span>
              <span className="text-white font-medium">{Math.round(altitudeMax)}°</span>
            </div>
            <input
              type="range"
              min={10}
              max={90}
              step={1}
              value={altitudeMax}
              onChange={e => onAltitudeMaxChange(Number(e.target.value))}
              className="w-full accent-gold-400"
            />
          </label>
        </div>
      </GlassCard>

      <button
        onClick={onDone}
        className="w-full max-w-xl py-4 rounded-2xl bg-gold-400 text-navy-950 font-bold text-lg active:scale-95 transition-transform"
      >
        Continue
      </button>
    </div>
  );
}
