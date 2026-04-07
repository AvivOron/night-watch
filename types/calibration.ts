export type CalibrationStep = 'intro' | 'location' | 'compass' | 'tilt' | 'confirm';

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
