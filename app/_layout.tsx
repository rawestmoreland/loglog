import '../global.css';
import 'expo-dev-client';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import MapboxGL from '@rnmapbox/maps';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { PaperProvider, Portal } from 'react-native-paper';

import { AuthContextProvider } from '~/context/authContext';
import { LocationContextProvider } from '~/context/locationContext';
import { SeshContextProvider } from '~/context/seshContext';
import { PocketBaseProvider } from '~/lib/pocketbaseConfig';
import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  const queryClient = new QueryClient();

  useEffect(() => {
    MapboxGL.setAccessToken(
      'sk.eyJ1Ijoid2VzdG1vcmVsYW5kY3JlYXRpdmUiLCJhIjoiY204YXByd3cyMTYycjJuczd2bm45ZWp2cCJ9.GSFFjqjMGoAMqxQxE_6aEw'
    );
  }, []);

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />
      {/* WRAP YOUR APP WITH ANY ADDITIONAL PROVIDERS HERE */}
      {/* <ExampleProvider> */}
      <PocketBaseProvider>
        <LocationContextProvider>
          <AuthContextProvider>
            <QueryClientProvider client={queryClient}>
              <SeshContextProvider>
                <PaperProvider>
                  <Portal>
                    <ActionSheetProvider>
                      <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
                        <GestureHandlerRootView style={{ flex: 1 }}>
                          <BottomSheetModalProvider>
                            <NavThemeProvider value={NAV_THEME[colorScheme]}>
                              <Stack screenOptions={SCREEN_OPTIONS}>
                                <Stack.Screen name="(auth)" />
                                <Stack.Screen name="(protected)" />
                              </Stack>
                              <PortalHost />
                            </NavThemeProvider>
                          </BottomSheetModalProvider>
                        </GestureHandlerRootView>
                      </KeyboardProvider>
                    </ActionSheetProvider>
                  </Portal>
                </PaperProvider>
              </SeshContextProvider>
            </QueryClientProvider>
          </AuthContextProvider>
        </LocationContextProvider>
      </PocketBaseProvider>

      {/* </ExampleProvider> */}
    </>
  );
}

const SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'ios_from_right', // for android
} as const;
