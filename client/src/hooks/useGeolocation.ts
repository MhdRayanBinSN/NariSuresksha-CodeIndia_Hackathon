import { useState, useEffect, useCallback } from 'react';
import { GeolocationPosition, getCurrentLocation, watchLocation, clearLocationWatch, getDemoLocation, simulateMovement } from '../lib/geolocation';
import { useDemo } from '../contexts/DemoContext';

export const useGeolocation = () => {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { demoMode } = useDemo();

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (demoMode) {
        const demoPos = getDemoLocation();
        setPosition(demoPos);
      } else {
        const pos = await getCurrentLocation();
        setPosition(pos);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  const startWatching = useCallback(() => {
    if (watchId !== null) return;

    setError(null);

    if (demoMode) {
      // Simulate location updates in demo mode
      const demoWatchId = window.setInterval(() => {
        setPosition(prev => prev ? simulateMovement(prev) : getDemoLocation());
      }, 10000);
      setWatchId(demoWatchId);
    } else {
      try {
        const id = watchLocation(
          (pos) => setPosition(pos),
          (err) => setError(`Location tracking error: ${err.message}`)
        );
        setWatchId(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start location tracking');
      }
    }
  }, [demoMode, watchId]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      if (demoMode) {
        clearInterval(watchId);
      } else {
        clearLocationWatch(watchId);
      }
      setWatchId(null);
    }
  }, [watchId, demoMode]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        if (demoMode) {
          clearInterval(watchId);
        } else {
          clearLocationWatch(watchId);
        }
      }
    };
  }, [watchId, demoMode]);

  return {
    position,
    error,
    loading,
    getLocation,
    startWatching,
    stopWatching,
    isWatching: watchId !== null,
  };
};
