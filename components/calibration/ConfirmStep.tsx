import { CheckCircle, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

interface ConfirmStepProps {
  azimuthMin: number;
  azimuthMax: number;
  altitudeMin: number;
  altitudeMax: number;
  crossesNorth: boolean;
  viewName: string;
  onViewNameChange: (name: string) => void;
  onSave: () => void;
  onRedo: () => void;
}

function SkyWindowPreview({
  azimuthMin, azimuthMax, altitudeMin, altitudeMax, crossesNorth,
}: Omit<ConfirmStepProps, 'viewName' | 'onViewNameChange' | 'onSave' | 'onRedo'>) {
  const spread = crossesNorth
    ? (360 - azimuthMin) + azimuthMax
    : azimuthMax - azimuthMin;
  const startAngle = crossesNorth ? azimuthMin : azimuthMin;
  const cx = 100;
  const cy = 100;
  const r = 75;

  // Convert azimuth to SVG angle (north = up = -90deg in SVG)
  function azToRad(az: number) {
    return ((az - 90) * Math.PI) / 180;
  }

  const startRad = azToRad(startAngle);
  const endRad = azToRad(crossesNorth ? azimuthMax + 360 : azimuthMax);
  const spreadRad = endRad - startRad;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArc = spreadRad > Math.PI ? 1 : 0;

  // Altitude range (inner and outer arcs)
  const rInner = r * (altitudeMin / 90);
  const rOuter = r * (altitudeMax / 90);

  const xi1 = cx + rInner * Math.cos(startRad);
  const yi1 = cy + rInner * Math.sin(startRad);
  const xi2 = cx + rInner * Math.cos(endRad);
  const yi2 = cy + rInner * Math.sin(endRad);
  const xo1 = cx + rOuter * Math.cos(startRad);
  const yo1 = cy + rOuter * Math.sin(startRad);
  const xo2 = cx + rOuter * Math.cos(endRad);
  const yo2 = cy + rOuter * Math.sin(endRad);

  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
      {/* Horizon circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      {/* Zenith circle */}
      <circle cx={cx} cy={cy} r={4} fill="rgba(255,255,255,0.2)" />
      {/* N label */}
      <text x={cx} y={cy - r - 6} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">N</text>
      <text x={cx + r + 6} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">E</text>
      <text x={cx} y={cy + r + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">S</text>
      <text x={cx - r - 6} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">W</text>

      {/* Window arc fill */}
      <path
        d={[
          `M ${xo1} ${yo1}`,
          `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${xo2} ${yo2}`,
          `L ${xi2} ${yi2}`,
          `A ${rInner} ${rInner} 0 ${largeArc} 0 ${xi1} ${yi1}`,
          'Z',
        ].join(' ')}
        fill="rgba(244,200,66,0.15)"
        stroke="rgba(244,200,66,0.5)"
        strokeWidth="1.5"
      />

      {/* Outer border arc */}
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
        strokeDasharray="2 3"
      />

      {/* Spread label */}
      <text x={cx} y={cy + 4} textAnchor="middle" fill="rgba(244,200,66,0.8)" fontSize="10" fontWeight="bold">
        {Math.round(spread)}°
      </text>
    </svg>
  );
}

export function ConfirmStep({
  azimuthMin, azimuthMax, altitudeMin, altitudeMax, crossesNorth,
  viewName, onViewNameChange, onSave, onRedo,
}: ConfirmStepProps) {
  const spread = crossesNorth
    ? (360 - azimuthMin) + azimuthMax
    : azimuthMax - azimuthMin;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
        <h2 className="text-2xl font-bold text-white">Looking Good!</h2>
        <p className="text-white/60 text-base">Here's your calibrated sky window</p>
      </div>

      <SkyWindowPreview
        azimuthMin={azimuthMin}
        azimuthMax={azimuthMax}
        altitudeMin={altitudeMin}
        altitudeMax={altitudeMax}
        crossesNorth={crossesNorth}
      />

      <GlassCard className="w-full max-w-sm p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-white/40 text-xs">Azimuth Range</p>
            <p className="text-white font-medium">
              {Math.round(azimuthMin)}° – {Math.round(azimuthMax)}°
            </p>
          </div>
          <div>
            <p className="text-white/40 text-xs">Horizontal Spread</p>
            <p className="text-gold-400 font-medium">{Math.round(spread)}°</p>
          </div>
          <div>
            <p className="text-white/40 text-xs">Altitude Range</p>
            <p className="text-white font-medium">
              {Math.round(altitudeMin)}° – {Math.round(altitudeMax)}°
            </p>
          </div>
          <div>
            <p className="text-white/40 text-xs">Crosses North</p>
            <p className="text-white font-medium">{crossesNorth ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </GlassCard>

      <div className="w-full max-w-sm">
        <p className="text-white/50 text-sm mb-2">Name this view</p>
        <input
          type="text"
          value={viewName}
          onChange={e => onViewNameChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-gold-400/60 text-sm"
          placeholder="e.g. Bedroom Window"
        />
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onSave}
          className="w-full py-4 rounded-2xl bg-gold-400 text-navy-950 font-bold text-lg active:scale-95 transition-transform"
        >
          Save & Start Watching
        </button>
        <button
          onClick={onRedo}
          className="w-full py-3 rounded-2xl border border-white/20 text-white/60 font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <RotateCcw className="w-4 h-4" />
          Redo Calibration
        </button>
      </div>
    </div>
  );
}
