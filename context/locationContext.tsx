import * as Location from 'expo-location';
import { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const LocationContext = createContext<{
  userLocation: { lat: number; lon: number };
  setUserLocation: (location: { lat: number; lon: number }) => void;
  isLoadingLocation: boolean;
}>({
  userLocation: { lat: 0, lon: 0 },
  setUserLocation: () => {},
  isLoadingLocation: false,
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
    lat: 37.783333,
    lon: -122.416667,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    const getCurrentLocation = async () => {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoadingLocation(false);
        Alert.alert(
          'Permission not granted',
          'Please grant permission to access your location'
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync();

      setUserLocation({
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      });
      setIsLoadingLocation(false);
    };

    getCurrentLocation();
  }, []);

  return (
    <LocationContext.Provider
      value={{ userLocation, setUserLocation, isLoadingLocation }}
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
