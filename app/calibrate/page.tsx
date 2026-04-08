'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StarfieldCanvas } from '@/components/ui/StarfieldCanvas';
import { CalibrationWizard } from '@/components/calibration/CalibrationWizard';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin, Smartphone } from 'lucide-react';

export default function CalibratePage() {
  const router = useRouter();
  const geo = useGeolocation();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(pointer: fine)');
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  function handleComplete() {
    router.push('/tonight');
  }

  if (geo.loading) {
    return (
      <main className="relative min-h-dvh flex items-center justify-center">
        <StarfieldCanvas />
        <div className="relative z-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin mx-auto" />
          <p className="text-white/50">Getting your location…</p>
        </div>
      </main>
    );
  }

  if (geo.permissionState === 'denied' || geo.error) {
    return (
      <main className="relative min-h-dvh flex items-center justify-center px-6">
        <StarfieldCanvas />
        <div className="relative z-10 text-center space-y-6 max-w-sm">
          <MapPin className="w-12 h-12 text-gold-400/50 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Location Required</h2>
            <p className="text-white/60 text-sm leading-relaxed">
              Night Watch needs your location to calculate which stars are above your horizon.
              Please allow location access in your browser settings.
            </p>
          </div>
          <button
            onClick={() => geo.requestLocation()}
            className="w-full py-4 rounded-2xl bg-gold-400 text-navy-950 font-bold active:scale-95 transition-transform"
          >
            Allow Location
          </button>
        </div>
      </main>
    );
  }

  // Wait for coordinates
  if (geo.lat === null || geo.lon === null) {
    return (
      <main className="relative min-h-dvh flex items-center justify-center px-6">
        <StarfieldCanvas />
        <div className="relative z-10 text-center space-y-6 max-w-sm">
          <h2 className="text-xl font-bold text-white">Waiting for Location</h2>
          <button
            onClick={() => geo.requestLocation()}
            className="w-full py-4 rounded-2xl bg-gold-400 text-navy-950 font-bold active:scale-95 transition-transform"
          >
            Grant Location Access
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh">
      <StarfieldCanvas />
      <div className="relative z-10">
        {isDesktop && (
          <div className="mx-auto max-w-2xl px-6 pt-6">
            <div className="rounded-2xl border border-white/10 bg-navy-900/70 px-4 py-3 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                <div>
                  <p className="text-sm font-medium text-white">Night Watch is built for mobile</p>
                  <p className="mt-1 text-sm text-white/60">
                    The best experience uses phone sensors, camera, and live AR. Desktop calibration is a simplified
                    fallback so you can still get a useful event list.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <CalibrationWizard
          lat={geo.lat}
          lon={geo.lon}
          onComplete={handleComplete}
        />
      </div>
    </main>
  );
}
