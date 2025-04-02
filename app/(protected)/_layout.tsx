import { Stack, usePathname } from 'expo-router';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

import { useSheetRef } from '~/components/nativewindui/Sheet';
import ActiveSeshSheet from '~/components/sheets/ActiveSeshSheet';
import DefaultSheet from '~/components/sheets/DefaultSheet';
import PoopHistorySheet from '~/components/sheets/PoopHistorySheet';
import PoopPalsSheet from '~/components/sheets/PoopPalsSheet';
import ProfileSheet from '~/components/sheets/ProfileSheet';
import SelectedSeshSheet from '~/components/sheets/SelectedSeshSheet';
import { useAuth } from '~/context/authContext';
import { MapViewContextProvider } from '~/context/mapViewContext';
import { useSesh } from '~/context/seshContext';
import { useColorScheme } from '~/lib/useColorScheme';
import PoopDetailsSheet from '~/components/sheets/PoopDetailsSheet';

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

  useEffect(() => {
    // Only present sheets when on home screen
    if (isOnHomeScreen) {
      // When returning to home screen, show the appropriate sheet based on state
      if (selectedSesh) {
        selectedSeshSheetRef.current?.present();
      } else if (activeSesh) {
        bottomSheetModalRef.current?.present();
      } else {
        defaultSheetRef.current?.present();
      }
    } else {
      // Hide all sheets when not on home screen
      bottomSheetModalRef.current?.dismiss();
      defaultSheetRef.current?.dismiss();
      selectedSeshSheetRef.current?.dismiss();
      profileSheetRef.current?.dismiss();
      poopPalsSheetRef.current?.dismiss();
    }
  }, [isOnHomeScreen, selectedSesh, activeSesh]);

  useEffect(() => {
    // Only handle active sesh sheet logic when on home screen
    if (!isOnHomeScreen) return;

    if (activeSesh) {
      bottomSheetModalRef.current?.present();
    } else {
      defaultSheetRef.current?.present();
    }

    // Set up keyboard listeners only when we have an active session
    if (activeSesh) {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        if (activeSesh) {
          setTimeout(() => {
            bottomSheetModalRef.current?.snapToIndex(1);
          }, 100);
        }
      });

      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        bottomSheetModalRef.current?.snapToIndex(0);
      });

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }
  }, [activeSesh, selectedSesh, isOnHomeScreen]);

  useEffect(() => {
    // Only handle selected sesh sheet logic when on home screen
    if (!isOnHomeScreen) return;

    if (selectedSesh) {
      selectedSeshSheetRef.current?.present();
    } else {
      selectedSeshSheetRef.current?.dismiss();
      bottomSheetModalRef.current?.present();
    }
  }, [selectedSesh, isOnHomeScreen]);

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
          ref={selectedSeshSheetRef}
          sesh={selectedSesh}
          onClose={() => setSelectedSesh(null)}
          colors={colors}
          user={user}
          pooProfile={pooProfile}
        />
      ) : activeSesh ? (
        <ActiveSeshSheet
          ref={bottomSheetModalRef}
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
          <PoopPalsSheet ref={poopPalsSheetRef} />
          <PoopHistorySheet ref={poopHistorySheetRef} onViewPoop={handleViewPoopDetails} />
          <PoopDetailsSheet
            ref={poopDetailsSheetRef}
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
