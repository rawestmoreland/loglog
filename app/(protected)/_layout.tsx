import { Stack, usePathname, useFocusEffect } from 'expo-router';
import * as React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Keyboard, AppState } from 'react-native';

import UnifiedSheet, { UnifiedSheetRef, SheetContentType } from '~/components/sheets/UnifiedSheet';
import { useAuth } from '~/context/authContext';
import { MapViewContextProvider } from '~/context/mapViewContext';
import { useSesh } from '~/context/seshContext';
import { useColorScheme } from '~/lib/useColorScheme';

export default function TabLayout() {
  const { colors } = useColorScheme();
  const { user, pooProfile } = useAuth();
  const pathname = usePathname();

  const unifiedSheetRef = useRef<UnifiedSheetRef>(null);
  const appState = useRef(AppState.currentState);
  const isOnHomeScreen = pathname === '/' || pathname === '/index';

  const {
    startSesh,
    activeSesh,
    selectedSesh,
    setSelectedSesh,
    endSesh,
    isLoadingActiveSesh,
    poopForm,
    updateActiveSesh,
    isSeshPending,
  } = useSesh();

  const [selectedPoopId, setSelectedPoopId] = useState<string | null>(null);
  const [currentSheetContent, setCurrentSheetContent] = useState<SheetContentType>('default');
  const [isSessionOperationInProgress, setIsSessionOperationInProgress] = useState(false);

  // Helper to change sheet content - simplified to avoid unnecessary state updates
  const changeSheetContent = useCallback((contentType: SheetContentType, contentProps?: any) => {
    setCurrentSheetContent(contentType);
    if (unifiedSheetRef.current) {
      unifiedSheetRef.current.changeContent(contentType, contentProps);
    }
  }, []);

  // Helper for profile and related actions
  const handleProfilePress = useCallback(() => {
    changeSheetContent('profile', {
      user,
      colors,
      onPoopPalsPress: () => changeSheetContent('poopPals'),
      onClose: () => updateSheetContent(), // Simply return to default state based on current app state
    });
  }, [user, colors]);

  // Helper for poop history
  const handlePoopHistoryPress = useCallback(() => {
    changeSheetContent('poopHistory', {
      onViewPoop: handleViewPoopDetails,
      onClose: () => updateSheetContent(), // Simply return to default state based on current app state
    });
  }, [user, colors]);

  // Default content props for reuse
  const getDefaultContentProps = useCallback(() => {
    return {
      isOnHomeScreen,
      user,
      isSeshPending,
      onStartSesh: handleStartSesh,
      onPoopHistoryPress: handlePoopHistoryPress,
      colors,
      onProfilePress: handleProfilePress,
    };
  }, [isOnHomeScreen, user, isSeshPending, colors]);

  // Update sheet visibility and content when screen focus changes
  useFocusEffect(
    useCallback(() => {
      // This runs when the screen comes into focus
      if (isOnHomeScreen && !isSessionOperationInProgress) {
        updateSheetContent();
        setTimeout(() => {
          if (unifiedSheetRef.current) {
            unifiedSheetRef.current.present();
          }
        }, 250); // Slight delay to ensure navigation has completed
      }

      return () => {
        // This runs when the screen goes out of focus
        if (!isOnHomeScreen && !isSessionOperationInProgress) {
          if (unifiedSheetRef.current) {
            unifiedSheetRef.current.dismiss();
          }
        }
      };
    }, [isOnHomeScreen, selectedSesh, activeSesh, isSessionOperationInProgress])
  );

  // Listen for app state changes to handle background/foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isOnHomeScreen
      ) {
        // App has come to the foreground
        setTimeout(() => {
          updateSheetContent();
          if (unifiedSheetRef.current) {
            unifiedSheetRef.current.present();
          }
        }, 250);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isOnHomeScreen, selectedSesh, activeSesh]);

  // Update sheet when path changes
  useEffect(() => {
    if (isOnHomeScreen) {
      updateSheetContent();
      setTimeout(() => {
        if (unifiedSheetRef.current) {
          unifiedSheetRef.current.present();
        }
      }, 250);
    } else {
      if (unifiedSheetRef.current) {
        unifiedSheetRef.current.dismiss();
      }
    }
  }, [isOnHomeScreen]);

  // Handle keyboard interactions with the sheet
  useEffect(() => {
    if (!isOnHomeScreen) return;

    let keyboardDidShowListener: any;
    let keyboardDidHideListener: any;

    if (activeSesh) {
      keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        if (activeSesh && unifiedSheetRef.current?.present) {
          setTimeout(() => {
            unifiedSheetRef.current?.present();
          }, 100);
        }
      });

      keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        if (unifiedSheetRef.current?.present) {
          unifiedSheetRef.current.present();
        }
      });
    }

    return () => {
      if (keyboardDidShowListener?.remove) keyboardDidShowListener.remove();
      if (keyboardDidHideListener?.remove) keyboardDidHideListener.remove();
    };
  }, [activeSesh, isOnHomeScreen]);

  // Update sheet content when selected session or active session changes
  useEffect(() => {
    // Only update if we're on the home screen
    if (!isOnHomeScreen) return;

    // Ensure sheet is visible and content is updated
    const timer = setTimeout(() => {
      updateSheetContent();
      if (unifiedSheetRef.current) {
        unifiedSheetRef.current.present();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [selectedSesh, activeSesh, isOnHomeScreen]);

  // Function to update sheet content based on current state
  const updateSheetContent = useCallback(() => {
    if (!isOnHomeScreen) return;

    if (selectedSesh) {
      changeSheetContent('selectedSesh', {
        sesh: selectedSesh,
        onClose: () => setSelectedSesh(null),
        colors,
        user,
        pooProfile,
      });
    } else if (activeSesh) {
      changeSheetContent('activeSesh', {
        sesh: activeSesh,
        isLoading: isLoadingActiveSesh,
        isSeshPending,
        onEnd: handleEndSesh,
        poopForm,
        updateActiveSesh,
      });
    } else {
      changeSheetContent('default', getDefaultContentProps());
    }

    // Always ensure sheet is presented after content update
    if (unifiedSheetRef.current) {
      unifiedSheetRef.current.present();
    }
  }, [
    selectedSesh,
    activeSesh,
    colors,
    user,
    pooProfile,
    isLoadingActiveSesh,
    isSeshPending,
    poopForm,
    isOnHomeScreen,
  ]);

  // Add effect to handle session state changes
  useEffect(() => {
    if (isOnHomeScreen) {
      updateSheetContent();
    }
  }, [activeSesh, selectedSesh, isOnHomeScreen, updateSheetContent]);

  const handleStartSesh = async () => {
    // Can't do two poops at once
    if (activeSesh) return;

    try {
      setIsSessionOperationInProgress(true);

      // Ensure sheet is visible before starting session
      if (unifiedSheetRef.current && isOnHomeScreen) {
        unifiedSheetRef.current.present();
      }

      // Start the session
      await startSesh();

      // Update content and keep sheet visible
      if (isOnHomeScreen) {
        updateSheetContent();
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      // Ensure sheet is still visible and updated even if session start fails
      if (isOnHomeScreen) {
        updateSheetContent();
      }
    } finally {
      setIsSessionOperationInProgress(false);
    }
  };

  const handleEndSesh = async () => {
    if (!activeSesh) return;

    try {
      setIsSessionOperationInProgress(true);

      // Ensure sheet is visible before ending session
      if (unifiedSheetRef.current && isOnHomeScreen) {
        unifiedSheetRef.current.present();
      }

      // End the session
      await endSesh();

      // Update content and keep sheet visible
      if (isOnHomeScreen) {
        changeSheetContent('default', getDefaultContentProps());
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      // Ensure sheet is still visible and updated even if session end fails
      if (isOnHomeScreen) {
        updateSheetContent();
      }
    } finally {
      setIsSessionOperationInProgress(false);
    }
  };

  const handleViewPoopDetails = (poopId: string) => {
    setSelectedPoopId(poopId);
    changeSheetContent('poopDetails', {
      poopId,
      onClose: () => {
        setSelectedPoopId(null);
        changeSheetContent('poopHistory', {
          onViewPoop: handleViewPoopDetails,
          onClose: () => updateSheetContent(), // Use updateSheetContent to determine the correct content
        });
      },
    });
  };

  return (
    <MapViewContextProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen
          name="index"
          options={{
            title: '',
          }}
        />
      </Stack>

      <UnifiedSheet
        ref={unifiedSheetRef}
        initialContentType={selectedSesh ? 'selectedSesh' : activeSesh ? 'activeSesh' : 'default'}
        preventDismissalOnHome={true}
      />
    </MapViewContextProvider>
  );
}
