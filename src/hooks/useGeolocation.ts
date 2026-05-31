import { useState, useCallback, useEffect } from "react";

export interface GeolocationState {
  loading: boolean;
  error: GeolocationError | null;
  position: GeolocationPosition | null;
  permissionStatus: PermissionState | null;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  region?: string;
  country?: string;
}

const ERROR_MESSAGES: Record<number, string> = {
  1: "Location access denied. Please enable location permissions in your browser settings.",
  2: "Unable to determine your location. Please check your device settings.",
  3: "Location request timed out. Please try again.",
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    loading: false,
    error: null,
    position: null,
    permissionStatus: null,
  });

  const [locationData, setLocationData] = useState<LocationData | null>(null);

  // Check permission status on mount
  useEffect(() => {
    if ("permissions" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setState((prev) => ({ ...prev, permissionStatus: result.state }));
          
          // Listen for permission changes
          result.addEventListener("change", () => {
            setState((prev) => ({ ...prev, permissionStatus: result.state }));
          });
        })
        .catch(() => {
          // Permissions API not fully supported
        });
    }
  }, []);

  // Reverse geocode to get city/region from coordinates
  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<Partial<LocationData>> => {
    try {
      // Using OpenStreetMap's Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      
      if (!response.ok) throw new Error("Geocoding failed");
      
      const data = await response.json();
      const address = data.address || {};
      
      return {
        city: address.city || address.town || address.village || address.municipality || address.county,
        region: address.state || address.region,
        country: address.country,
      };
    } catch {
      // Return empty if geocoding fails - coordinates are still available
      return {};
    }
  }, []);

  const requestLocation = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: {
          code: 0,
          message: "Geolocation is not supported by your browser.",
        },
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // Cache for 5 minutes
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      setState((prev) => ({
        ...prev,
        loading: false,
        position,
        permissionStatus: "granted",
        error: null,
      }));

      // Get location details via reverse geocoding
      const { latitude, longitude, accuracy } = position.coords;
      const geocodeData = await reverseGeocode(latitude, longitude);
      
      setLocationData({
        latitude,
        longitude,
        accuracy,
        ...geocodeData,
      });

    } catch (error) {
      const geoError = error as GeolocationPositionError;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: {
          code: geoError.code,
          message: ERROR_MESSAGES[geoError.code] || "An unknown error occurred.",
        },
        permissionStatus: geoError.code === 1 ? "denied" : prev.permissionStatus,
      }));
      setLocationData(null);
    }
  }, [reverseGeocode]);

  const clearLocation = useCallback(() => {
    setState({
      loading: false,
      error: null,
      position: null,
      permissionStatus: state.permissionStatus,
    });
    setLocationData(null);
  }, [state.permissionStatus]);

  return {
    ...state,
    locationData,
    requestLocation,
    clearLocation,
    isSupported: "geolocation" in navigator,
  };
}
