import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';
import { Toggle } from '~/components/nativewindui/Toggle';
import { useUpdatePoopSesh } from '~/hooks/api/usePoopSeshMutations';
import { usePoopSesh } from '~/hooks/api/usePoopSeshQueries';
import { useColorScheme } from '~/lib/useColorScheme';

export default function PoopSesh() {
  const insets = useSafeAreaInsets();
  const { colors } = useColorScheme();
  const { poopId } = useLocalSearchParams();

  const updateSesh = useUpdatePoopSesh();

  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  if (!poopId) {
    router.dismissTo(`(protected)`);
  }

  const { data: poopSesh, isLoading: isPoopSeshLoading } = usePoopSesh(poopId as string);

  const isLoading = useMemo(() => {
    return isPoopSeshLoading;
  }, [isPoopSeshLoading]);

  const poopSchema = z.object({
    id: z.string(),
    started: z.date(),
    ended: z.date(),
    revelations: z.string().optional(),
    is_public: z.boolean(),
  });

  const poopForm = useForm({
    resolver: zodResolver(poopSchema),
    defaultValues: {
      id: poopSesh?.id,
      started: poopSesh?.started ?? new Date(),
      ended: poopSesh?.ended ?? new Date(),
      revelations: poopSesh?.revelations,
      is_public: poopSesh?.is_public,
    },
  });

  useEffect(() => {
    if (poopSesh) {
      poopForm.setValue('id', poopSesh.id!);
      poopForm.setValue('started', poopSesh.started);
      poopForm.setValue('ended', poopSesh.ended!);
      poopForm.setValue('revelations', poopSesh.revelations);
      poopForm.setValue('is_public', poopSesh.is_public);
    }
  }, [poopSesh]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!poopSesh) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>No poop sesh found</Text>
      </View>
    );
  }

  const handleSaveSesh = async (data: z.infer<typeof poopSchema>) => {
    try {
      await updateSesh.mutateAsync({
        poopSesh: {
          id: poopId as string,
          started: data.started,
          ended: data.ended,
          revelations: data.revelations,
          is_public: data.is_public,
        },
      });
      router.dismissTo('/(protected)');
    } catch (error) {
      console.error(error);
      Alert.alert('Could not update the sesh');
    }
  };

  return (
    <View className="flex-1" style={{ paddingBottom: insets.bottom }}>
      <KeyboardAwareScrollView
        bottomOffset={Platform.select({ ios: 8 })}
        bounces={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="ios:pt-12 pt-20">
        <View className="flex-1 gap-2">
          <View className="gap-2 px-8">
            <Text>Poop Start</Text>
            <Button variant="tonal" onPress={() => setStartPickerOpen(true)}>
              <Text>{format(poopForm.watch('started') ?? new Date(), 'M/dd/yyyy hh:mm a')}</Text>
            </Button>
            <Controller
              name="started"
              control={poopForm.control}
              render={({ field: { value } }) => (
                <DatePicker
                  modal
                  open={startPickerOpen}
                  date={value ?? new Date()}
                  onConfirm={(value) => {
                    poopForm.setValue('started', value);
                    setStartPickerOpen(false);
                  }}
                  onCancel={() => setStartPickerOpen(false)}
                />
              )}
            />
          </View>
          <View className="gap-2 px-8">
            <Text>Poop End</Text>
            <Button variant="tonal" onPress={() => setEndPickerOpen(true)}>
              <Text>{format(poopForm.watch('ended') ?? new Date(), 'M/dd/yyyy hh:mm a')}</Text>
            </Button>
            <Controller
              name="ended"
              control={poopForm.control}
              render={({ field: { value, onChange } }) => (
                <DatePicker
                  modal
                  open={endPickerOpen}
                  date={value ?? new Date()}
                  onConfirm={(value) => {
                    onChange(value);
                    setEndPickerOpen(false);
                  }}
                  onCancel={() => setEndPickerOpen(false)}
                />
              )}
            />
          </View>
          <View className="gap-2 px-8">
            <Text>Revelations</Text>
            <Controller
              name="revelations"
              control={poopForm.control}
              render={({ field }) => (
                <TextField
                  value={field.value}
                  onChangeText={field.onChange}
                  multiline
                  numberOfLines={4}
                  placeholder="Enter revelations"
                  containerClassName="border rounded-md h-28"
                />
              )}
            />
          </View>
          <View className="flex-row items-center justify-between gap-2 px-8">
            <Text>Is Public?</Text>
            <Controller
              name="is_public"
              control={poopForm.control}
              render={({ field }) => <Toggle value={field.value} onValueChange={field.onChange} />}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView
        className="px-8"
        offset={{ closed: insets.bottom - 100, opened: insets.bottom }}>
        <Button
          disabled={poopForm.formState.isSubmitting}
          onPress={poopForm.handleSubmit(handleSaveSesh)}>
          <Text>{poopForm.formState.isSubmitting ? 'Saving...' : 'Save'}</Text>
        </Button>
      </KeyboardStickyView>
    </View>
  );
}
