'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Telescope, MapPin, ArrowRight } from 'lucide-react';
import { StarfieldCanvas } from '@/components/ui/StarfieldCanvas';
import { loadSkyWindow } from '@/lib/storage/calibration';

export default function LandingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const existing = loadSkyWindow();
    if (existing) {
      router.replace('/tonight');
      return;
    }
    setChecked(true);
  }, [router]);

  function handleStart() {
    router.push('/calibrate');
  }

  if (!checked) return null;

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center px-6 py-12 overflow-hidden">
      <StarfieldCanvas />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-gold-400/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-10 max-w-sm w-full animate-fade-in">
        <div className="space-y-4">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-gold-400/10 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-gold-400/10 flex items-center justify-center">
              <Telescope className="w-12 h-12 text-gold-400" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Night Watch</h1>
            <p className="text-gold-400 text-sm font-medium mt-1 tracking-widest uppercase">
              Your Sky, Personalized
            </p>
          </div>
        </div>

        <p className="text-white/60 text-base leading-relaxed">
          See exactly which planets, moons, and galaxies are visible through{' '}
          <span className="text-white font-medium">your window</span> — right now.
        </p>

        <div className="w-full space-y-2 text-left">
          {[
            'Calibrated to your exact view',
            'Real-time celestial positions',
            'AR overlay on your camera',
            'Weather-adjusted visibility',
          ].map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0" />
              <p className="text-white/70 text-sm">{f}</p>
            </div>
          ))}
        </div>

        <div className="w-full space-y-3">
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gold-400 text-navy-950 font-bold text-lg active:scale-95 transition-transform"
          >
            <MapPin className="w-5 h-5" />
            See What&apos;s Visible Tonight
          </button>

          <button
            onClick={() => router.push('/tonight')}
            className="w-full flex items-center justify-center gap-2 py-3 text-white/40 text-sm"
          >
            Skip setup
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
