'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Compass } from 'lucide-react';

interface OrientationData {
  heading: number | null;
  altitude: number | null;
  rawRef: React.RefObject<{ heading: number | null; altitude: number | null; beta: number | null }>;
}

interface CompassStepProps {
  orientation: OrientationData;
  onDone: (headings: number[]) => void;
}

function headingToCardinal(h: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(h / 45) % 8];
}

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function CompassStep({ orientation, onDone }: CompassStepProps) {
  const [recording, setRecording] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [minSample, setMinSample] = useState<number | null>(null);
  const [maxSample, setMaxSample] = useState<number | null>(null);
  const samplesRef = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(() => {
    samplesRef.current = [];
    setSampleCount(0);
    setMinSample(null);
    setMaxSample(null);
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    onDone(samplesRef.current);
  }, [onDone]);

  useEffect(() => {
    if (!recording) return;
    intervalRef.current = setInterval(() => {
      const raw = orientation.rawRef.current.heading;
      if (raw === null) return;
      samplesRef.current.push(raw);
      const min = Math.min(...samplesRef.current);
      const max = Math.max(...samplesRef.current);
      setSampleCount(samplesRef.current.length);
      setMinSample(min);
      setMaxSample(max);
    }, 150);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const heading = orientation.heading ?? 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <p className="text-white/50 text-sm uppercase tracking-widest">Step 1 of 2</p>
        <h2 className="text-2xl font-bold text-white">Map Your Horizontal View</h2>
        <p className="text-white/60 text-base leading-relaxed">
          {recording
            ? 'Slowly pan your phone across your entire window, then tap Done'
            : 'Point your phone at one edge of your window, then tap Start'}
        </p>
      </div>

      {/* Compass dial */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-4 rounded-full border border-white/5 bg-white/5" />

        {CARDINALS.map((dir, i) => {
          const angle = i * 45;
          const rad = ((angle - 90) * Math.PI) / 180;
          const r = 100;
          const x = 128 + r * Math.cos(rad);
          const y = 128 + r * Math.sin(rad);
          return (
            <span key={dir} className="absolute text-white/30 text-xs font-mono" style={{ left: x - 8, top: y - 8 }}>
              {dir}
            </span>
          );
        })}

        {/* Recorded range arc */}
        {recording && minSample !== null && maxSample !== null && minSample !== maxSample && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 256">
            {(() => {
              const spread = maxSample - minSample;
              const cx = 128, cy = 128, r = 90;
              const startRad = ((minSample - 90) * Math.PI) / 180;
              const endRad = ((maxSample - 90) * Math.PI) / 180;
              const x1 = cx + r * Math.cos(startRad);
              const y1 = cy + r * Math.sin(startRad);
              const x2 = cx + r * Math.cos(endRad);
              const y2 = cy + r * Math.sin(endRad);
              const largeArc = spread > 180 ? 1 : 0;
              return (
                <path
                  d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                  fill="none" stroke="rgba(244,200,66,0.5)" strokeWidth="6" strokeLinecap="round"
                />
              );
            })()}
          </svg>
        )}

        {/* Needle — points in heading direction */}
        <div
          className="absolute w-1 h-24 bottom-1/2 left-1/2 origin-bottom"
          style={{ transform: `translateX(-50%) rotate(${heading}deg)` }}
        >
          <div className="w-full h-1/2 bg-gradient-to-t from-transparent to-gold-400 rounded-full" />
          <div className="w-full h-1/2 bg-gradient-to-b from-transparent to-white/30 rounded-full" />
        </div>

        <div className="text-center z-10 pointer-events-none">
          <p className="text-2xl font-bold text-white tabular-nums">{Math.round(heading)}°</p>
          <p className="text-gold-400 text-sm font-medium">{headingToCardinal(heading)}</p>
        </div>
      </div>

      {sampleCount > 0 && minSample !== null && maxSample !== null && (
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide">Left</p>
            <p className="text-white font-bold text-lg">{Math.round(minSample)}°</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide">Spread</p>
            <p className="text-gold-400 font-bold text-lg">{Math.round(maxSample - minSample)}°</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide">Right</p>
            <p className="text-white font-bold text-lg">{Math.round(maxSample)}°</p>
          </div>
        </div>
      )}

      {!recording ? (
        <button onClick={startRecording}
          className="w-full max-w-xs py-4 rounded-2xl bg-gold-400 text-navy-950 font-bold text-lg active:scale-95 transition-transform flex items-center justify-center gap-2">
          <Compass className="w-5 h-5" />
          Start Scanning
        </button>
      ) : (
        <button onClick={stopRecording}
          className="w-full max-w-xs py-4 rounded-2xl bg-emerald-500 text-white font-bold text-lg active:scale-95 transition-transform">
          Done — {sampleCount} readings
        </button>
      )}
    </div>
  );
}
