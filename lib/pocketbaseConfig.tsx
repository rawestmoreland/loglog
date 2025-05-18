import AsyncStorage from '@react-native-async-storage/async-storage';
import PocketBase, { AsyncAuthStore } from 'pocketbase';
import React, { createContext, useContext, useState, useEffect } from 'react';
import eventsource from 'react-native-sse';

// @ts-ignore
global.EventSource = eventsource;

const PocketBaseContext = createContext<{
  pb: PocketBase | null;
  isLoading: boolean;
  error: string | null;
}>({
  pb: null,
  isLoading: true,
  error: null,
});

export const usePocketBase = () => useContext(PocketBaseContext);

export const PocketBaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [pb, setPb] = useState<PocketBase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializePocketBase = async () => {
      if (pb) return;
      try {
        console.log('Initializing PocketBase...');
        // This is where our auth session will be stored. It's PocketBase magic.
        const store = new AsyncAuthStore({
          save: async (serialized) => AsyncStorage.setItem('pb_auth', serialized),
          initial: (await AsyncStorage.getItem('pb_auth')) ?? undefined,
          clear: async () => AsyncStorage.removeItem('pb_auth'),
        });

        const baseUrl =
          process.env.EXPO_PUBLIC_POCKETBASE_URL || 'https://loglog-pocketbase-backend.fly.dev';

        console.log('Connecting to PocketBase at:', baseUrl);
        const pbInstance = new PocketBase(baseUrl, store);
        pbInstance.autoCancellation(false);

        // Test the connection
        await pbInstance.health.check();
        console.log('PocketBase connection successful');

        setPb(pbInstance);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize PocketBase:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize PocketBase');
      } finally {
        setIsLoading(false);
      }
    };

    initializePocketBase();
  }, []);

  if (error) {
    console.error('PocketBase initialization error:', error);
  }

  return (
    <PocketBaseContext.Provider value={{ pb, isLoading, error }}>
      {children}
    </PocketBaseContext.Provider>
  );
};
