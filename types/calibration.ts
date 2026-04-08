export type CalibrationStep = 'intro' | 'location' | 'compass' | 'tilt' | 'manual' | 'confirm';

export interface RawReadings {
  alpha: number[]; // compass heading samples
  beta: number[];  // pitch samples
  gamma: number[]; // roll samples
}

export interface CalibrationState {
  step: CalibrationStep;
  rawReadings: RawReadings;
  azimuthMin: number | null;
  azimuthMax: number | null;
  altitudeMin: number | null;
  altitudeMax: number | null;
  crossesNorth: boolean;
}

export interface CalibrationLogPayload {
  skyWindow: {
    name: string;
    lat: number;
    lng: number;
    azimuthMin: number;
    azimuthMax: number;
    altitudeMin: number;
    altitudeMax: number;
    crossesNorth: boolean;
  };
  notes?: string;
  context?: {
    address?: string;
    facingDirection?: string;
    obstructionSummary?: string;
    whyMoonMayBeMissing?: string;
  };
  recordedAt?: string;
}
