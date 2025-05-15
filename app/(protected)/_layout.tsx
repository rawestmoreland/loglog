import { Stack, usePathname } from 'expo-router';
import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Keyboard } from 'react-native';

import { useSheetRef } from '~/components/nativewindui/Sheet';
import ActiveSeshSheet from '~/components/sheets/ActiveSeshSheet';
import DefaultSheet from '~/components/sheets/DefaultSheet';
import PoopDetailsSheet from '~/components/sheets/PoopDetailsSheet';
import PoopHistorySheet from '~/components/sheets/PoopHistorySheet';
import PoopPalsSheet from '~/components/sheets/PoopPalsSheet';
import ProfileSheet from '~/components/sheets/ProfileSheet';
import SelectedSeshSheet from '~/components/sheets/SelectedSeshSheet';
import { useAuth } from '~/context/authContext';
import { MapViewContextProvider } from '~/context/mapViewContext';
import { useSesh } from '~/context/seshContext';
import { useColorScheme } from '~/lib/useColorScheme';

export default function TabLayout() {
  const { colors } = useColorScheme();

  const { user, pooProfile } = useAuth();

  const pathname = usePathname();

  const bottomSheetModalRef = useSheetRef();
  const selectedSeshSheetRef = useSheetRef();
  const defaultSheetRef = useSheetRef();
  const profileSheetRef = useSheetRef();
  const poopPalsSheetRef = useSheetRef();
  const poopHistorySheetRef = useSheetRef();
  const poopDetailsSheetRef = useSheetRef();
  const isOnHomeScreen = pathname === '/';

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

  // Helper function to safely dismiss all sheets
  const dismissAllSheets = useCallback(async () => {
    const sheets = [
      bottomSheetModalRef,
      defaultSheetRef,
      selectedSeshSheetRef,
      profileSheetRef,
      poopPalsSheetRef,
      poopHistorySheetRef,
      poopDetailsSheetRef,
    ];

    // Dismiss all sheets with a slight delay to prevent race conditions
    for (const sheet of sheets) {
      if (sheet.current?.dismiss) {
        try {
          await sheet.current.dismiss();
        } catch (error) {
          console.log('Error dismissing sheet:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleVisibilityChange = async () => {
      if (!mounted) return;

      if (!isOnHomeScreen) {
        // When leaving home screen, forcefully dismiss all sheets
        await dismissAllSheets();
      } else {
        // When returning to home screen, show appropriate sheet after a brief delay
        setTimeout(() => {
          if (!mounted) return;

          if (selectedSesh && selectedSeshSheetRef.current?.present) {
            selectedSeshSheetRef.current.present();
          } else if (activeSesh && bottomSheetModalRef.current?.present) {
            bottomSheetModalRef.current.present();
          } else if (defaultSheetRef.current?.present) {
            defaultSheetRef.current.present();
          }
        }, 100);
      }
    };

    handleVisibilityChange();

    // Cleanup function to dismiss sheets when component unmounts
    return () => {
      mounted = false;
      dismissAllSheets();
    };
  }, [isOnHomeScreen, selectedSesh, activeSesh, dismissAllSheets]);

  useEffect(() => {
    if (!isOnHomeScreen) return;

    let keyboardDidShowListener: any;
    let keyboardDidHideListener: any;

    if (activeSesh) {
      keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        if (activeSesh && bottomSheetModalRef.current?.present) {
          setTimeout(() => {
            bottomSheetModalRef.current?.present();
          }, 100);
        }
      });

      keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        if (bottomSheetModalRef.current?.present) {
          bottomSheetModalRef.current.present();
        }
      });
    }

    return () => {
      if (keyboardDidShowListener?.remove) keyboardDidShowListener.remove();
      if (keyboardDidHideListener?.remove) keyboardDidHideListener.remove();
    };
  }, [activeSesh, isOnHomeScreen]);

  useEffect(() => {
    if (!isOnHomeScreen) return;

    let mounted = true;

    const updateSheetVisibility = async () => {
      if (!mounted) return;

      if (selectedSesh && selectedSeshSheetRef.current?.present) {
        await dismissAllSheets();
        selectedSeshSheetRef.current.present();
      } else if (!selectedSesh && bottomSheetModalRef.current?.present) {
        selectedSeshSheetRef.current?.dismiss();
        bottomSheetModalRef.current.present();
      }
    };

    updateSheetVisibility();

    return () => {
      mounted = false;
    };
  }, [selectedSesh, isOnHomeScreen, dismissAllSheets]);

  const handleStartSesh = async () => {
    // Can't do two poops at once
    if (activeSesh) return;

    await startSesh();
  };

  const handleEndSesh = async () => {
    if (!activeSesh) return;

    await endSesh();
  };

  const handleViewPoopDetails = (poopId: string) => {
    setSelectedPoopId(poopId);
    poopDetailsSheetRef.current?.present();
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

      {selectedSesh ? (
        <SelectedSeshSheet
          ref={selectedSeshSheetRef as any}
          sesh={selectedSesh}
          onClose={() => setSelectedSesh(null)}
          colors={colors}
          user={user}
          pooProfile={pooProfile}
        />
      ) : activeSesh ? (
        <ActiveSeshSheet
          ref={bottomSheetModalRef as any}
          sesh={activeSesh}
          isLoading={isLoadingActiveSesh}
          isSeshPending={isSeshPending}
          onEnd={handleEndSesh}
          poopForm={poopForm}
          updateActiveSesh={updateActiveSesh}
        />
      ) : (
        <>
          <DefaultSheet
            ref={defaultSheetRef}
            isOnHomeScreen={isOnHomeScreen}
            onProfilePress={() => profileSheetRef.current?.present()}
            user={user}
            isSeshPending={isSeshPending}
            onStartSesh={handleStartSesh}
            onPoopHistoryPress={() => poopHistorySheetRef.current?.present()}
            colors={colors}
          />
          <ProfileSheet
            ref={profileSheetRef}
            user={user}
            colors={colors}
            onPoopPalsPress={() => poopPalsSheetRef.current?.present()}
          />
          <PoopPalsSheet ref={poopPalsSheetRef as any} />
          <PoopHistorySheet ref={poopHistorySheetRef as any} onViewPoop={handleViewPoopDetails} />
          <PoopDetailsSheet
            ref={poopDetailsSheetRef as any}
            poopId={selectedPoopId}
            onClose={() => {
              setSelectedPoopId(null);
              poopDetailsSheetRef.current?.dismiss();
            }}
          />
        </>
      )}
    </MapViewContextProvider>
  );
}
