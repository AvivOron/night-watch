'use client';

import { useState, useCallback } from 'react';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { saveSkyWindow, logCalibration } from '@/lib/storage/calibration';
import type { SkyWindow } from '@/types/astronomy';
import { IntroStep } from './IntroStep';
import { CompassStep } from './CompassStep';
import { TiltStep } from './TiltStep';
import { ConfirmStep } from './ConfirmStep';
import type { CalibrationState } from '@/types/calibration';

interface CalibrationWizardProps {
  lat: number;
  lon: number;
  onComplete: () => void;
}

const INITIAL_STATE: CalibrationState = {
  step: 'intro',
  rawReadings: { alpha: [], beta: [], gamma: [] },
  azimuthMin: null,
  azimuthMax: null,
  altitudeMin: null,
  altitudeMax: null,
  crossesNorth: false,
};

// headings are already computed compass bearings (0-360)
function computeAzimuthRange(headings: number[]): { min: number; max: number; crossesNorth: boolean } {
  if (headings.length === 0) return { min: 0, max: 180, crossesNorth: false };

  const min = Math.min(...headings);
  const max = Math.max(...headings);
  const spread = max - min;

  // If spread > 180°, the window likely crosses north (e.g. 330° → 30°)
  if (spread > 180) {
    const normalized = headings.map(h => (h > 180 ? h - 360 : h));
    const nMin = Math.min(...normalized);
    const nMax = Math.max(...normalized);
    return {
      min: (nMin + 360) % 360,
      max: (nMax + 360) % 360,
      crossesNorth: true,
    };
  }

  return { min, max, crossesNorth: false };
}

// altitudes are already computed elevation angles (0-90)
function computeAltitudeRange(altitudes: number[]): { min: number; max: number } {
  if (altitudes.length === 0) return { min: 0, max: 60 };
  return {
    min: Math.max(0, Math.min(...altitudes) - 2),
    max: Math.min(90, Math.max(...altitudes) + 2),
  };
}

export function CalibrationWizard({ lat, lon, onComplete }: CalibrationWizardProps) {
  const [state, setState] = useState<CalibrationState>(INITIAL_STATE);
  const [viewName, setViewName] = useState('My Window');
  const [notes, setNotes] = useState('');
  const orientation = useDeviceOrientation();

  const goToStep = useCallback(
    (step: CalibrationState['step']) => setState(s => ({ ...s, step })),
    []
  );

  const handleCompassDone = useCallback((alphas: number[]) => {
    const { min, max, crossesNorth } = computeAzimuthRange(alphas);
    setState(s => ({
      ...s,
      azimuthMin: min,
      azimuthMax: max,
      crossesNorth,
      step: 'tilt',
    }));
  }, []);

  const handleTiltDone = useCallback((betas: number[]) => {
    const { min, max } = computeAltitudeRange(betas);
    setState(s => ({
      ...s,
      altitudeMin: min,
      altitudeMax: max,
      step: 'confirm',
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (
      state.azimuthMin === null ||
      state.azimuthMax === null ||
      state.altitudeMin === null ||
      state.altitudeMax === null
    )
      return;

    const window: SkyWindow = {
      name: viewName,
      lat,
      lng: lon,
      azimuthMin: state.azimuthMin,
      azimuthMax: state.azimuthMax,
      altitudeMin: state.altitudeMin,
      altitudeMax: state.altitudeMax,
      crossesNorth: state.crossesNorth,
    };

    saveSkyWindow(window);
    try {
      await logCalibration({
        skyWindow: window,
        notes,
      });
    } catch (error) {
      console.error('Failed to send calibration log:', error);
    }
    onComplete();
  }, [state, viewName, lat, lon, notes, onComplete]);

  const handleRedo = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  if (state.step === 'intro') {
    return (
      <IntroStep
        onNext={async () => {
          if (!orientation.hasPermission) {
            await orientation.requestPermission();
          }
          goToStep('compass');
        }}
      />
    );
  }

  if (state.step === 'compass') {
    return (
      <CompassStep
        orientation={orientation}
        onDone={handleCompassDone}
      />
    );
  }

  if (state.step === 'tilt') {
    return (
      <TiltStep
        orientation={orientation}
        onDone={handleTiltDone}
      />
    );
  }

  if (state.step === 'confirm') {
    return (
      <ConfirmStep
        azimuthMin={state.azimuthMin!}
        azimuthMax={state.azimuthMax!}
        altitudeMin={state.altitudeMin!}
        altitudeMax={state.altitudeMax!}
        crossesNorth={state.crossesNorth}
        viewName={viewName}
        notes={notes}
        onViewNameChange={setViewName}
        onNotesChange={setNotes}
        onSave={handleSave}
        onRedo={handleRedo}
      />
    );
  }

  return null;
}
