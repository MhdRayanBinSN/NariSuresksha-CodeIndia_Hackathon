export interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const getCurrentLocation = (options?: GeolocationOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      defaultOptions
    );
  });
};

export const watchLocation = (
  callback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void,
  options?: GeolocationOptions
): number => {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by this browser");
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000,
    ...options,
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    errorCallback,
    defaultOptions
  );
};

export const clearLocationWatch = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId);
};

// Demo mode helpers
export const getDemoLocation = (): GeolocationPosition => {
  return {
    lat: 28.6139,
    lng: 77.2090,
    accuracy: 5,
    timestamp: Date.now(),
  };
};

export const simulateMovement = (basePosition: GeolocationPosition): GeolocationPosition => {
  const variance = 0.0001; // Small movement simulation
  return {
    lat: basePosition.lat + (Math.random() - 0.5) * variance,
    lng: basePosition.lng + (Math.random() - 0.5) * variance,
    accuracy: basePosition.accuracy,
    timestamp: Date.now(),
  };
};

// Haversine distance calculation
export const calculateDistance = (pos1: GeolocationPosition, pos2: GeolocationPosition): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const dLon = ((pos2.lng - pos1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pos1.lat * Math.PI) / 180) *
      Math.cos((pos2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
};
