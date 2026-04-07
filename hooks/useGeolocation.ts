'use client';

import { useState, useEffect } from 'react';

interface GeolocationState {
  lat: number | null;
  lon: number | null;
  error: string | null;
  loading: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lon: null,
    error: null,
    loading: true,
    permissionState: 'unknown',
  });

  useEffect(() => {
    // Always attempt — if already granted the browser resolves immediately.
    // If prompt, it shows the dialog. If denied, we get an error.
    navigator.geolocation.getCurrentPosition(
      pos => {
        setState({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          error: null,
          loading: false,
          permissionState: 'granted',
        });
      },
      err => {
        setState(s => ({
          ...s,
          loading: false,
          error: err.message,
          permissionState: err.code === 1 ? 'denied' : 'unknown',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  function requestLocation() {
    setState(s => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      pos => {
        setState({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          error: null,
          loading: false,
          permissionState: 'granted',
        });
      },
      err => {
        setState(s => ({
          ...s,
          loading: false,
          error: err.message,
          permissionState: err.code === 1 ? 'denied' : 'unknown',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  return { ...state, requestLocation };
}
