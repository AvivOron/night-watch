'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Telescope, Info } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSkyWindow } from '@/hooks/useSkyWindow';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';

const AROverlay = dynamic(
  () => import('@/components/ar/AROverlay').then(m => ({ default: m.AROverlay })),
  { ssr: false }
);

function ARHint({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  if (!visible) return null;
  return (
    <div className="absolute bottom-28 left-4 right-4 z-20 rounded-2xl bg-navy-900/80 backdrop-blur-md border border-white/10 p-4 flex gap-3 animate-slide-up">
      <Info className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-white text-sm font-medium">Point your camera at the sky</p>
        <p className="text-white/50 text-xs mt-0.5">
          The gold rectangle shows your calibrated window. Stars and planets are labeled as dots.
        </p>
      </div>
      <button onClick={onClose} className="text-white/40 text-lg leading-none">×</button>
    </div>
  );
}

function SkyPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const targetBody = params.get('body') ?? undefined;
  const geo = useGeolocation();
  const { skyWindow } = useSkyWindow();
  const orientation = useDeviceOrientation();
  const [sensorPermissionNeeded, setSensorPermissionNeeded] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Check if we need to ask for iOS sensor permission
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DevOri = DeviceOrientationEvent as any;
    if (typeof DevOri.requestPermission === 'function') {
      setSensorPermissionNeeded(true);
    }
  }, []);

  async function handleSensorPermission() {
    try {
      await orientation.requestPermission();
      setSensorPermissionNeeded(false);
    } catch {
      // permission denied
    }
  }

  const needsLocation = geo.lat === null || geo.lon === null;

  return (
    <main className="relative min-h-dvh bg-navy-950 overflow-hidden">
      {!needsLocation && !sensorPermissionNeeded && (
        <AROverlay
          lat={geo.lat!}
          lon={geo.lon!}
          skyWindow={skyWindow}
          targetBody={targetBody}
          onDetailsOpen={() => setShowHint(false)}
        />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 pt-12 pb-4 bg-gradient-to-b from-navy-950/70 to-transparent pointer-events-none">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-navy-900/60 backdrop-blur-md border border-white/10 flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="pointer-events-none">
          <h1 className="text-white font-bold">AR Sky View</h1>
          {targetBody && <p className="text-gold-400 text-xs">Targeting: {targetBody}</p>}
        </div>
      </div>

      {/* iOS sensor permission gate */}
      {sensorPermissionNeeded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center space-y-4">
          <div className="text-5xl">🧭</div>
          <p className="text-white font-semibold text-lg">Allow Motion Access</p>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            AR mode needs your device compass and gyroscope to overlay stars on the correct position in the sky.
          </p>
          <button
            onClick={handleSensorPermission}
            className="px-8 py-4 rounded-2xl bg-gold-400 text-navy-950 font-bold text-lg active:scale-95 transition-transform"
          >
            Allow Sensors
          </button>
        </div>
      )}

      {/* Location needed */}
      {needsLocation && !sensorPermissionNeeded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 text-center space-y-4">
          <Telescope className="w-16 h-16 text-gold-400/50" />
          <p className="text-white/60">Location required for AR mode</p>
          <button
            onClick={() => geo.requestLocation()}
            className="px-6 py-3 rounded-xl bg-gold-400 text-navy-950 font-bold active:scale-95 transition-transform"
          >
            Allow Location
          </button>
        </div>
      )}

      {!sensorPermissionNeeded && <ARHint visible={showHint} onClose={() => setShowHint(false)} />}

      {/* Bottom nav */}
      <nav className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-navy-900/70 backdrop-blur-md flex">
        <button onClick={() => router.push('/tonight')} className="flex-1 flex flex-col items-center gap-1 py-3 text-white/40">
          <Telescope className="w-5 h-5" />
          <span className="text-xs">Tonight</span>
        </button>
        <button className="flex-1 flex flex-col items-center gap-1 py-3 text-gold-400">
          <span className="text-xl">📡</span>
          <span className="text-xs">AR Sky</span>
        </button>
        <button onClick={() => router.push('/calibrate')} className="flex-1 flex flex-col items-center gap-1 py-3 text-white/40">
          <span className="text-xl">⚙️</span>
          <span className="text-xs">Calibrate</span>
        </button>
      </nav>
    </main>
  );
}

export default function SkyPage() {
  return (
    <Suspense>
      <SkyPageContent />
    </Suspense>
  );
}
