'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface OrientationState {
  heading: number | null;  // true compass bearing 0-360 (N=0, E=90)
  altitude: number | null; // elevation angle -90 to 90 (0=horizon, 90=zenith)
  beta: number | null;     // raw beta, for fallback use
  hasPermission: boolean;
  isAbsolute: boolean;
}

function smoothAngle(prev: number | null, next: number, factor: number): number {
  if (prev === null) return next;
  let diff = next - prev;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (prev + diff * factor + 360) % 360;
}

function smoothLinear(prev: number | null, next: number, factor: number): number {
  if (prev === null) return next;
  return prev + (next - prev) * factor;
}

const SMOOTH = 0.12;

/**
 * Extract compass heading from a DeviceOrientationEvent.
 *
 * Priority:
 * 1. webkitCompassHeading (iOS Safari) — already in degrees from magnetic north
 * 2. deviceorientationabsolute alpha — true north bearing = (360 - alpha) % 360
 *    because alpha is counter-clockwise when viewed from above
 * 3. Regular alpha (relative, unreliable for compass) — last resort
 */
function extractHeading(e: DeviceOrientationEvent, isAbsolute: boolean): number | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webkit = (e as any).webkitCompassHeading as number | undefined;
  if (webkit != null && webkit >= 0) {
    return webkit; // iOS: already correct bearing
  }
  if (isAbsolute && e.alpha != null) {
    // absolute alpha is CCW from north → convert to CW bearing
    return (360 - e.alpha) % 360;
  }
  if (e.alpha != null) {
    return (360 - e.alpha) % 360; // best-effort on Android
  }
  return null;
}

/**
 * Extract sky elevation (altitude) from beta/gamma.
 *
 * When holding phone in portrait, screen facing you, pointing at horizon:
 *   beta ≈ 90 (upright), gamma ≈ 0
 * When tilting top of phone upward toward zenith:
 *   beta decreases toward 0 (flat on back) or goes negative (past zenith)
 *
 * For this device orientation mapping:
 *   beta ≈ 90  => horizon (0°)
 *   beta > 90  => phone tilting upward (+ altitude)
 *   beta < 90  => phone tilting downward (- altitude)
 * Clamp to -90..90 so AR can keep moving even below the horizon.
 */
function extractAltitude(beta: number | null): number | null {
  if (beta === null) return null;
  // Observed behavior: phone upright portrait = beta ~90 = horizon (0°)
  // Tilting top away from you (pointing up) increases beta past 90.
  // Tilting top toward the ground decreases beta below 90.
  return Math.max(-90, Math.min(90, beta - 90));
}

export function useDeviceOrientation() {
  const [state, setState] = useState<OrientationState>({
    heading: null,
    altitude: null,
    beta: null,
    hasPermission: false,
    isAbsolute: false,
  });

  const rawRef = useRef<{ heading: number | null; altitude: number | null; beta: number | null }>({
    heading: null, altitude: null, beta: null,
  });

  const smoothedRef = useRef<{ heading: number | null; altitude: number | null }>({
    heading: null, altitude: null,
  });

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    const isAbsolute = (e as DeviceOrientationEvent & { absolute?: boolean }).absolute ?? false;
    const rawHeading = extractHeading(e, isAbsolute);
    const rawAltitude = extractAltitude(e.beta);

    rawRef.current = { heading: rawHeading, altitude: rawAltitude, beta: e.beta };

    const smoothHeading = rawHeading !== null
      ? smoothAngle(smoothedRef.current.heading, rawHeading, SMOOTH)
      : null;
    const smoothAltitude = rawAltitude !== null
      ? smoothLinear(smoothedRef.current.altitude, rawAltitude, SMOOTH)
      : null;

    smoothedRef.current = { heading: smoothHeading, altitude: smoothAltitude };

    setState({
      heading: smoothHeading,
      altitude: smoothAltitude,
      beta: e.beta,
      isAbsolute,
      hasPermission: true,
    });
  }, []);

  const requestPermission = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DevOri = DeviceOrientationEvent as any;
    if (typeof DevOri.requestPermission === 'function') {
      try {
        const result = await DevOri.requestPermission();
        if (result !== 'granted') {
          throw new Error('Device orientation permission denied');
        }
      } catch (err) {
        console.error('Permission request failed:', err);
        throw err;
      }
    }
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener);
    window.addEventListener('deviceorientation', handleOrientation as EventListener);
    setState(s => ({ ...s, hasPermission: true }));
  }, [handleOrientation]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DevOri = DeviceOrientationEvent as any;
    if (typeof DevOri.requestPermission === 'function') {
      // iOS: permission may already be granted from a previous call — try attaching directly.
      // If not granted, the events simply won't fire until requestPermission() is called.
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener);
      window.addEventListener('deviceorientation', handleOrientation as EventListener);
    } else {
      // Android / desktop — no permission needed
      window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener);
      window.addEventListener('deviceorientation', handleOrientation as EventListener);
      setState(s => ({ ...s, hasPermission: true }));
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener);
    };
  }, [handleOrientation]);

  return { ...state, rawRef, requestPermission };
}
