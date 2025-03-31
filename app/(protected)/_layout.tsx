import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Stack, usePathname } from 'expo-router';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';

import ActiveSeshSheet from '~/components/sheets/ActiveSeshSheet';
import DefaultSheet from '~/components/sheets/DefaultSheet';
import PoopPalsSheet from '~/components/sheets/PoopPalsSheet';
import ProfileSheet from '~/components/sheets/ProfileSheet';
import SelectedSeshSheet from '~/components/sheets/SelectedSeshSheet';
import { useAuth } from '~/context/authContext';
import { MapViewContextProvider } from '~/context/mapViewContext';
import { useSesh } from '~/context/seshContext';
import { useColorScheme } from '~/lib/useColorScheme';

export default function TabLayout() {
  const { colors } = useColorScheme();

  const { user } = useAuth();

  const pathname = usePathname();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const profileSheetRef = useRef<BottomSheetModal>(null);
  const poopPalsSheetRef = useRef<BottomSheetModal>(null);
  const isOnHomeScreen = pathname === '/';

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

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

  useEffect(() => {
    // Show the active sesh sheet
    if (activeSesh) {
      bottomSheetModalRef.current?.present();
    }

    // Set up keyboard listeners only when we have an active session
    if (activeSesh) {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        if (activeSesh) {
          // Add a small delay to ensure the sheet is ready
          setTimeout(() => {
            bottomSheetModalRef.current?.snapToIndex(1);
          }, 100);
        }
      });

      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        bottomSheetModalRef.current?.snapToIndex(0);
      });

      // Cleanup listeners when activeSesh changes or component unmounts
      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }
  }, [activeSesh]);

  const handleStartSesh = async () => {
    // Can't do two poops at once
    if (activeSesh) return;

    await startSesh();
  };

  const handleEndSesh = async () => {
    if (!activeSesh) return;

    await endSesh();
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
          ref={bottomSheetModalRef}
          sesh={selectedSesh}
          onClose={() => setSelectedSesh(null)}
          colors={colors}
          user={user}
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
            ref={bottomSheetModalRef}
            isOnHomeScreen={isOnHomeScreen}
            onProfilePress={() => profileSheetRef.current?.present()}
            user={user}
            isSeshPending={isSeshPending}
            onStartSesh={handleStartSesh}
            colors={colors}
          />
          <ProfileSheet
            ref={profileSheetRef}
            user={user}
            colors={colors}
            onPoopPalsPress={() => poopPalsSheetRef.current?.present()}
          />
          <PoopPalsSheet ref={poopPalsSheetRef} />
        </>
      )}
    </MapViewContextProvider>
  );
}
