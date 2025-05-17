import { useQueryClient } from '@tanstack/react-query';
import { router, useNavigationContainerRef, useRouter, useSegments } from 'expo-router';
import { AuthRecord } from 'pocketbase';
import { createContext, useContext, useEffect, useState } from 'react';

import { LoadingScreen } from '~/components/LoadingScreen';
import { usePooProfile } from '~/hooks/api/usePooProfileQueries';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { PooProfile } from '~/lib/types';

export type AuthContextProps = {
  user: AuthRecord | null;
  pooProfile: PooProfile | undefined;
  isLoggedIn: boolean;
  isLoadingUserData: boolean;
  signIn: ({ email, password }: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthContextProviderProps = {
  children: React.ReactNode;
};

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  pooProfile: undefined,
  isLoggedIn: false,
  isLoadingUserData: true,
  signIn: async () => {},
  signOut: async () => {},
});

function useProtectedRoute(isLoggedIn: boolean, isLoadingUserData: boolean) {
  const router = useRouter();
  const segments = useSegments();

  // Check that navigation is all good
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const rootNavRef = useNavigationContainerRef();

  // Set ups a listener to check and see if the navigator is ready.
  useEffect(() => {
    const unsubscribe = rootNavRef?.addListener('state', (event) => {
      setIsNavigationReady(true);
    });
    return function cleanup() {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [rootNavRef.current]);

  useEffect(() => {
    // Navigation isn't set up or we're still loading. Do nothing.
    if (!isNavigationReady || isLoadingUserData) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !isLoggedIn &&
      !inAuthGroup
    ) {
      // Redirect to the sign-in page.
      router.replace('/(auth)');
    } else if (isLoggedIn && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace('/(protected)');
    }
  }, [isLoggedIn, segments, isNavigationReady, isLoadingUserData]);
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const { pb, isLoading: isPocketBaseLoading } = usePocketBase();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthRecord | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const { data: pooProfile, refetch: refetchPooProfile } = usePooProfile();

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (isPocketBaseLoading) {
        return; // Wait for PocketBase to initialize
      }

      if (!pb) {
        console.error('PocketBase instance not initialized');
        setIsLoadingUserData(false);
        return;
      }

      try {
        setIsLoadingUserData(true);
        const isLoggedIn = pb.authStore.isValid;
        setIsLoggedIn(isLoggedIn);
        setUser(isLoggedIn ? pb.authStore.record : null);

        if (isLoggedIn) {
          refetchPooProfile();
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoadingUserData(false);
      }
    };

    checkAuthStatus();
  }, [pb, isPocketBaseLoading]);

  const handleSignOut = async () => {
    if (!pb) {
      throw new Error('PocketBase not initialized');
    }

    pb.authStore.clear();
    setIsLoggedIn(false);
    setUser(null);
    queryClient.clear();
  };

  const handleSignIn = async ({ email, password }: { email: string; password: string }) => {
    if (isPocketBaseLoading) {
      throw new Error('PocketBase is still initializing');
    }

    if (!pb) {
      throw new Error('PocketBase not initialized');
    }

    try {
      const { record } = await pb.collection('users').authWithPassword(email, password);

      refetchPooProfile();
      setUser(record);
      setIsLoggedIn(true);
      router.replace('/(protected)');
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  useProtectedRoute(isLoggedIn, isLoadingUserData);

  // Show loading screen while PocketBase is initializing or checking auth status
  if (isPocketBaseLoading || isLoadingUserData) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        pooProfile: pooProfile as PooProfile | undefined,
        isLoadingUserData,
        isLoggedIn,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
}
