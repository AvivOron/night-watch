'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface OrientationData {
  heading: number | null;
  altitude: number | null;
  beta: number | null;
  rawRef: React.RefObject<{ heading: number | null; altitude: number | null; beta: number | null }>;
}

interface TiltStepProps {
  orientation: OrientationData;
  onDone: (altitudes: number[]) => void;
}

export function TiltStep({ orientation, onDone }: TiltStepProps) {
  const [recording, setRecording] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [minAlt, setMinAlt] = useState<number | null>(null);
  const [maxAlt, setMaxAlt] = useState<number | null>(null);
  const samplesRef = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(() => {
    samplesRef.current = [];
    setSampleCount(0);
    setMinAlt(null);
    setMaxAlt(null);
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setRecording(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    // Compute range only at the end, ignoring near-zero noise
    const valid = samplesRef.current.filter(a => a > 1);
    const finalSamples = valid.length > 0 ? valid : samplesRef.current;
    const min = Math.min(...finalSamples);
    const max = Math.max(...finalSamples);
    setMinAlt(min);
    setMaxAlt(max);
    onDone(finalSamples);
  }, [onDone]);

  useEffect(() => {
    if (!recording) return;
    intervalRef.current = setInterval(() => {
      const raw = orientation.rawRef.current.altitude;
      if (raw === null) return;
      samplesRef.current.push(raw);
      setSampleCount(samplesRef.current.length);
      // Don't update min/max live — avoids showing floor-clamped noise
    }, 150);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  // CalibrationWizard passes raw altitudes now — we just use the computed altitude directly
  const currentAlt = orientation.altitude ?? 0;
  const tiltPercent = currentAlt / 90;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 space-y-8">
      <div className="text-center space-y-2">
        <p className="text-white/50 text-sm uppercase tracking-widest">Step 2 of 2</p>
        <h2 className="text-2xl font-bold text-white">Map Your Vertical Range</h2>
        <p className="text-white/60 text-base leading-relaxed">
          {recording
            ? 'Tilt your phone from the bottom to the top of your window, then tap Done'
            : 'Point your phone at the bottom of your window, then tap Start'}
        </p>
      </div>

      {/* Altitude bar */}
      <div className="relative flex items-center gap-6">
        <div className="relative w-10 h-56 rounded-full bg-white/10 overflow-hidden">
          <div
            className="absolute bottom-0 w-full bg-gradient-to-t from-gold-400 to-gold-400/30 rounded-full transition-all duration-100"
            style={{ height: `${tiltPercent * 100}%` }}
          />
          {maxAlt !== null && minAlt !== null && (
            <div
              className="absolute w-full bg-emerald-400/30 transition-all duration-100"
              style={{
                bottom: `${(minAlt / 90) * 100}%`,
                height: `${((maxAlt - minAlt) / 90) * 100}%`,
              }}
            />
          )}
        </div>
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <span className="text-white/40">Zenith (90°)</span>
          </div>
          <div className="flex items-center gap-2 mt-36">
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <span className="text-white/40">Horizon (0°)</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-4xl font-bold text-white tabular-nums">{Math.round(currentAlt)}°</p>
        <p className="text-white/50 text-sm mt-1">
          {currentAlt < 10 ? 'Near horizon' : currentAlt < 45 ? 'Low sky' : currentAlt < 70 ? 'Mid sky' : 'High sky'}
        </p>
        <p className="text-white/20 text-xs mt-1 font-mono">β={Math.round(orientation.beta ?? 0)}°</p>
      </div>

      {sampleCount > 0 && minAlt !== null && maxAlt !== null && (
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide">Bottom</p>
            <p className="text-white font-bold text-lg">{Math.round(minAlt)}°</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide">Range</p>
            <p className="text-gold-400 font-bold text-lg">{Math.round(maxAlt - minAlt)}°</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-wide">Top</p>
            <p className="text-white font-bold text-lg">{Math.round(maxAlt)}°</p>
          </div>
        </div>
      )}

      {!recording ? (
        <button onClick={startRecording}
          className="w-full max-w-xs py-4 rounded-2xl bg-gold-400 text-navy-950 font-bold text-lg active:scale-95 transition-transform">
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
