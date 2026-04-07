export type BodyName =
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Sun'
  | 'M31'
  | 'M42'
  | 'M45'
  | 'M13';

export type EventType = 'rise' | 'set' | 'transit' | 'moon_phase';

export interface AltAz {
  altitude: number; // degrees above horizon, negative = below
  azimuth: number;  // degrees from North, 0-360
}

export interface CelestialBody {
  name: BodyName;
  displayName: string;
  category: 'planet' | 'moon' | 'dso' | 'star';
  magnitude: number;
  description: string;
  funFact: string;
  difficulty: 'naked-eye' | 'binoculars' | 'telescope';
  color: string; // tailwind text color class
  iconType: 'circle' | 'crescent' | 'star' | 'galaxy';
}

export interface CelestialEvent {
  id: string;
  body: CelestialBody;
  type: EventType;
  time: Date;
  altAz: AltAz;
  inSkyWindow: boolean;
  visibilityScore: VisibilityScore;
  durationInWindow?: number; // minutes body stays in window from event time
}

export interface SkyWindow {
  name: string;
  lat: number;
  lng: number;
  azimuthMin: number;
  azimuthMax: number;
  altitudeMin: number;
  altitudeMax: number;
  crossesNorth: boolean;
}

export type VisibilityScore = 'not-visible' | 'low' | 'good' | 'excellent';

export interface NightSummary {
  date: Date;
  events: CelestialEvent[];
  moonPhase: number; // 0-1
  moonPhaseName: string;
  recommendation: CelestialEvent | null;
  qualityScore: number; // 0-100
}
