import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import MapboxGL from '@rnmapbox/maps';

import { AuthContextProvider } from '@/context/authContext';
import { LocationContextProvider } from '@/context/locationContext';
import { MapViewContextProvider } from '@/context/mapViewContext';
import { NotificationProvider } from '@/context/notificationContext';
import { SeshContextProvider } from '@/context/seshContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PocketBaseProvider } from '@/lib/pocketbaseConfig';
import tamaguiConfig from '@/tamagui.config';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { PortalProvider } from '@tamagui/portal';
import { ToastProvider, ToastViewport } from '@tamagui/toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { TamaguiProvider } from 'tamagui';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const queryClient = new QueryClient();

  useEffect(() => {
    MapboxGL.setAccessToken(
      'sk.eyJ1Ijoid2VzdG1vcmVsYW5kY3JlYXRpdmUiLCJhIjoiY204YXByd3cyMTYycjJuczd2bm45ZWp2cCJ9.GSFFjqjMGoAMqxQxE_6aEw'
    );
  }, []);

  return (
    <KeyboardProvider>
      <PocketBaseProvider>
        <QueryClientProvider client={queryClient}>
          <AuthContextProvider>
            <ActionSheetProvider>
              <NotificationProvider>
                <LocationContextProvider>
                  <SeshContextProvider>
                    <MapViewContextProvider>
                      <TamaguiProvider
                        config={tamaguiConfig}
                        defaultTheme={colorScheme === 'dark' ? 'dark' : 'light'}
                      >
                        <ThemeProvider
                          value={
                            colorScheme === 'dark' ? DarkTheme : DefaultTheme
                          }
                        >
                          <PortalProvider shouldAddRootHost>
                            <ToastProvider>
                              <Stack>
                                <Stack.Screen
                                  name='(auth)'
                                  options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                  name='(protected)'
                                  options={{ headerShown: false }}
                                />
                              </Stack>
                              <StatusBar style='auto' />
                              <ToastViewport />
                            </ToastProvider>
                          </PortalProvider>
                        </ThemeProvider>
                      </TamaguiProvider>
                    </MapViewContextProvider>
                  </SeshContextProvider>
                </LocationContextProvider>
              </NotificationProvider>
            </ActionSheetProvider>
          </AuthContextProvider>
        </QueryClientProvider>
      </PocketBaseProvider>
    </KeyboardProvider>
  );
}
