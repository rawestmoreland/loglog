import * as Location from 'expo-location';
import { createContext, useContext, useEffect, useState } from 'react';

export const LocationContext = createContext<{
  userLocation: { lat: number; lon: number };
  setUserLocation: (location: { lat: number; lon: number }) => void;
  isLoadingLocation: boolean;
  hasLocation: boolean | undefined;
  isPermissionDenied: boolean;
}>({
  userLocation: { lat: 0, lon: 0 },
  setUserLocation: () => {},
  isLoadingLocation: false,
  hasLocation: undefined,
  isPermissionDenied: false,
});

export function LocationContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
  }>({
    lat: 0,
    lon: 0,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasLocation, setHasLocation] = useState<boolean | undefined>(
    undefined
  );
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  useEffect(() => {
    const getCurrentLocation = async () => {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsPermissionDenied(status === 'denied');
        setHasLocation(false);
        setIsLoadingLocation(false);
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setHasLocation(false);
        setIsLoadingLocation(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync();
        if (location.coords.latitude && location.coords.longitude) {
          setHasLocation(true);
        }
        setUserLocation({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      } catch {
        setHasLocation(false);
      } finally {
        setIsLoadingLocation(false);
      }
    };

    getCurrentLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{ userLocation, setUserLocation, isLoadingLocation, hasLocation, isPermissionDenied }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error(
      'useLocation must be used within a LocationContextProvider'
    );
  }
  return context;
}
