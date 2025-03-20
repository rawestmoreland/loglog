import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { format, intervalToDuration } from 'date-fns';
import { router, Stack, usePathname } from 'expo-router';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { ActivityIndicator, Keyboard, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Timer } from '~/components/Timer';
import { Button } from '~/components/nativewindui/Button';
import { Sheet } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';
import { Toggle } from '~/components/nativewindui/Toggle';
import { useAuth } from '~/context/authContext';
import { useSesh } from '~/context/seshContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { PoopSesh } from '~/lib/types';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

export default function TabLayout() {
  const { colors } = useColorScheme();

  const { user } = useAuth();

  const pathname = usePathname();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

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
    // Set up keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // When keyboard appears, snap to the desired index
      if (activeSesh) {
        bottomSheetModalRef.current?.snapToIndex(1);
      }
    });

    // Optional: handle keyboard hiding
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (activeSesh) {
        bottomSheetModalRef.current?.snapToIndex(0);
      }
    });

    // Cleanup listeners on component unmount
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
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
    <>
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
      <Sheet
        ref={bottomSheetModalRef}
        enablePanDownToClose={false}
        backdropComponent={() => <View className="absolute inset-0 bg-transparent" />}
        snapPoints={
          selectedSesh ? ['90%'] : activeSesh ? ['40%', '80%'] : !isOnHomeScreen ? ['10%'] : ['17%']
        }>
        <BottomSheetView className="flex-1">
          <View className="flex-1 gap-2">
            {!selectedSesh ? (
              <View className="flex-row items-center justify-between gap-2 px-8">
                <Text className="font-semibold">{user?.codeName}</Text>
                {isOnHomeScreen ? (
                  <Button
                    variant="tonal"
                    size="icon"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => router.push('/(protected)/(screens)/poop-history')}>
                    <Icon
                      source="book-open-page-variant"
                      size={24}
                      color={COLORS.light.foreground}
                    />
                  </Button>
                ) : (
                  <Button
                    variant="tonal"
                    size="icon"
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => router.dismissTo('/(protected)')}>
                    <Icon source="map-marker" size={24} color={COLORS.light.foreground} />
                  </Button>
                )}
              </View>
            ) : (
              <View className="flex-row items-center justify-between gap-2 px-8">
                <Text className="font-semibold">
                  {format(new Date(selectedSesh.started), 'MM/dd/yyyy HH:mm')}
                </Text>
                <Button variant="plain" size="icon" onPress={() => setSelectedSesh(null)}>
                  <Icon source="close" size={24} color={COLORS.light.foreground} />
                </Button>
              </View>
            )}
            {isLoadingActiveSesh ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : activeSesh ? (
              <DuringSeshView
                isLoading={isSeshPending}
                handleEndSesh={handleEndSesh}
                poopForm={poopForm}
                activeSesh={activeSesh}
                updateActiveSesh={updateActiveSesh}
              />
            ) : isOnHomeScreen && !selectedSesh ? (
              <View className="relative flex-1 px-8">
                <View>
                  <Button
                    disabled={isSeshPending}
                    style={{ backgroundColor: COLORS.light.primary }}
                    variant="primary"
                    onPress={handleStartSesh}>
                    <Text style={{ color: COLORS.light.foreground }}>
                      {isSeshPending ? 'Hold on...' : 'Drop a Log'}
                    </Text>
                  </Button>
                </View>
              </View>
            ) : selectedSesh ? (
              <View className="relative flex-1 px-8">
                <View className="gap-2">
                  <Text variant="title1" className="font-semibold">
                    Sesh Details
                  </Text>
                  <Text>
                    <Text className="font-semibold">Time:</Text>{' '}
                    {format(new Date(selectedSesh.started), 'HH:mm')}
                  </Text>
                  <Text>
                    <Text className="font-semibold">Duration:</Text>{' '}
                    {`${intervalToDuration({ start: new Date(selectedSesh.started), end: new Date(selectedSesh.ended!) })?.minutes ?? 0}m ${intervalToDuration({ start: new Date(selectedSesh.started), end: new Date(selectedSesh.ended!) })?.seconds ?? 0}s`}
                  </Text>
                  {selectedSesh.revelations && (
                    <Text>
                      <Text className="font-semibold">Revelations:</Text> {selectedSesh.revelations}
                    </Text>
                  )}
                  {selectedSesh.expand?.user?.id === user?.id && (
                    <Button
                      style={{ backgroundColor: colors.primary }}
                      onPress={() => {
                        setSelectedSesh(null);
                        router.push({
                          pathname: `/(protected)/(screens)/poop-details/${selectedSesh.id}`,
                          params: {
                            poopId: selectedSesh.id,
                          },
                        });
                      }}>
                      <Icon source="pencil" size={24} color={COLORS.light.foreground} />
                      <Text style={{ color: COLORS.light.foreground }}>Edit this sesh</Text>
                    </Button>
                  )}
                </View>
              </View>
            ) : null}
          </View>
        </BottomSheetView>
      </Sheet>
    </>
  );
}

function PublicToggle({
  isLoading,
  activeSesh,
  updateActiveSesh,
}: {
  isLoading: boolean;
  activeSesh: PoopSesh;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const { pb } = usePocketBase();

  const [isPublic, setIsPublic] = useState(activeSesh.is_public);

  useEffect(() => {
    const updateActiveSesh = async () => {
      const cachedSesh = queryClient.getQueryData<PoopSesh>(['active-poop-sesh']);

      // Update the cached sesh
      if (cachedSesh) {
        queryClient.setQueryData(['active-poop-sesh'], {
          ...cachedSesh,
          is_public: isPublic,
        });
      } else {
        await pb?.collection('poop_seshes').update(activeSesh.id!, { is_public: isPublic });
      }
    };

    updateActiveSesh();
  }, [isPublic]);

  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm">Public log?</Text>
      <Toggle value={isPublic} onValueChange={() => setIsPublic(!isPublic)} disabled={isLoading} />
    </View>
  );
}

function DuringSeshView({
  isLoading,
  handleEndSesh,
  poopForm,
  activeSesh,
  updateActiveSesh,
}: {
  isLoading: boolean;
  handleEndSesh: () => Promise<void>;
  poopForm: any;
  activeSesh: PoopSesh;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
}) {
  const { colors } = useColorScheme();

  return (
    <View className="relative flex-1 px-8">
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold">Log Details</Text>
          <PublicToggle
            isLoading={isLoading}
            activeSesh={activeSesh}
            updateActiveSesh={updateActiveSesh}
          />
        </View>
        <Timer startTime={new Date(activeSesh.started)} />
        <Controller
          control={poopForm.control}
          name="revelations"
          render={({ field }) => (
            <TextField
              className="h-20 rounded-md border border-gray-300"
              onChangeText={field.onChange}
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              onSubmitEditing={() => Keyboard.dismiss()}
              value={field.value}
              label="Revelations"
              placeholder="How will we change the world?"
              multiline
              maxLength={160}
              numberOfLines={4}
            />
          )}
        />
        <Button
          style={{ backgroundColor: colors.primary }}
          onPress={handleEndSesh}
          disabled={isLoading}>
          <Text style={{ color: COLORS.light.foreground }}>
            {isLoading ? 'Hold on...' : 'Pinch it Off'}
          </Text>
        </Button>
      </View>
    </View>
  );
}
