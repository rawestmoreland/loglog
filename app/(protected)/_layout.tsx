import { Stack, usePathname } from 'expo-router';
import * as React from 'react';
import { useEffect } from 'react';
import { Keyboard } from 'react-native';

import { useSheetRef } from '~/components/nativewindui/Sheet';
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

  const { user, pooProfile } = useAuth();

  const pathname = usePathname();

  const bottomSheetModalRef = useSheetRef();
  const selectedSeshSheetRef = useSheetRef();
  const defaultSheetRef = useSheetRef();

  const profileSheetRef = useSheetRef();
  const poopPalsSheetRef = useSheetRef();
  const isOnHomeScreen = pathname === '/';

  useEffect(() => {
    bottomSheetModalRef.current?.present();
    defaultSheetRef.current?.present();
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
    } else {
      defaultSheetRef.current?.present();
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

  useEffect(() => {
    if (selectedSesh) {
      selectedSeshSheetRef.current?.present();
    } else {
      selectedSeshSheetRef.current?.dismiss();
      bottomSheetModalRef.current?.present();
    }
  }, [selectedSesh]);

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
