import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { ActivityIndicator, Alert, Keyboard, View } from 'react-native';

import { Timer } from '~/components/Timer';
import { Button } from '~/components/nativewindui/Button';
import { Sheet } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';
import { Toggle } from '~/components/nativewindui/Toggle';
import { useSesh } from '~/context/seshContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { PoopSesh } from '~/lib/types';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

export default function TabLayout() {
  const { colors } = useColorScheme();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  useEffect(() => {
    // Set up keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // When keyboard appears, snap to the desired index
      bottomSheetModalRef.current?.snapToIndex(1);
    });

    // Optional: handle keyboard hiding
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      bottomSheetModalRef.current?.snapToIndex(0);
    });

    // Cleanup listeners on component unmount
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const {
    startSesh,
    activeSesh,
    endSesh,
    isLoadingActiveSesh,
    poopForm,
    updateActiveSesh,
    isSeshPending,
  } = useSesh();

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
        snapPoints={activeSesh ? ['40%', '80%'] : ['10%']}>
        <BottomSheetView className="flex-1">
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
          ) : (
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
          )}
        </BottomSheetView>
      </Sheet>
    </>
  );
}

function PublicToggle({
  activeSesh,
  updateActiveSesh,
}: {
  activeSesh: PoopSesh;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
}) {
  const { pb } = usePocketBase();

  const [isPublic, setIsPublic] = useState(activeSesh.is_public);

  useEffect(() => {
    const updateActiveSesh = async () => {
      await pb?.collection('poop_seshes').update(activeSesh.id!, { is_public: isPublic });
    };

    updateActiveSesh();
  }, [isPublic]);

  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm">Public log?</Text>
      <Toggle value={isPublic} onValueChange={() => setIsPublic(!isPublic)} />
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
          <PublicToggle activeSesh={activeSesh} updateActiveSesh={updateActiveSesh} />
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
