'use client';

import { useRouter } from 'next/navigation';
import { StarfieldCanvas } from '@/components/ui/StarfieldCanvas';
import { CalibrationWizard } from '@/components/calibration/CalibrationWizard';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin } from 'lucide-react';

export default function CalibratePage() {
  const router = useRouter();
  const geo = useGeolocation();

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
        <CalibrationWizard
          lat={geo.lat}
          lon={geo.lon}
          onComplete={handleComplete}
        />
      </div>
    </main>
  );
}
