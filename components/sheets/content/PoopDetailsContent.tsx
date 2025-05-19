import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Link } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Image, Platform, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Icon } from 'react-native-paper';
import { z } from 'zod';

import { Button } from '~/components/nativewindui/Button';
import { Stepper } from '~/components/nativewindui/Stepper';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';
import { Toggle } from '~/components/nativewindui/Toggle';
import { NotificationProvider } from '~/context/notificationContext';
import { useUpdatePoopSesh } from '~/hooks/api/usePoopSeshMutations';
import { usePoopSesh } from '~/hooks/api/usePoopSeshQueries';
import { bristolScoreToImage } from '~/lib/helpers';
import { useColorScheme } from '~/lib/useColorScheme';

export interface PoopDetailsContentProps {
  poopId: string | null;
  onClose: () => void;
}

const PoopDetailsContent = ({ poopId, onClose }: PoopDetailsContentProps) => {
  const updateSesh = useUpdatePoopSesh();
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);
  const [isPresented, setIsPresented] = useState(true);

  const { colors } = useColorScheme();

  const { data: poopSesh, isLoading: isPoopSeshLoading } = usePoopSesh(poopId as string, {
    enabled: isPresented,
  });

  const isLoading = useMemo(() => {
    return isPoopSeshLoading;
  }, [isPoopSeshLoading]);

  const poopSchema = z.object({
    id: z.string(),
    started: z.date(),
    ended: z.date(),
    revelations: z.string().optional(),
    is_public: z.boolean(),
    bristol_score: z.number().min(1).max(7).optional(),
    company_time: z.boolean(),
  });

  const poopForm = useForm({
    resolver: zodResolver(poopSchema),
    defaultValues: {
      id: poopSesh?.id,
      started: poopSesh?.started ?? new Date(),
      ended: poopSesh?.ended ?? new Date(),
      revelations: poopSesh?.revelations,
      is_public: poopSesh?.is_public,
      bristol_score: poopSesh?.bristol_score,
      company_time: poopSesh?.company_time,
    },
  });

  useEffect(() => {
    if (poopSesh) {
      poopForm.setValue('id', poopSesh.id!);
      poopForm.setValue('started', poopSesh.started);
      poopForm.setValue('ended', poopSesh.ended!);
      poopForm.setValue('revelations', poopSesh.revelations);
      poopForm.setValue('is_public', poopSesh.is_public);
      poopForm.setValue('company_time', poopSesh.company_time);
    }
  }, [poopSesh]);

  const handleSaveSesh = async (data: z.infer<typeof poopSchema>) => {
    try {
      await updateSesh.mutateAsync({
        poopSesh: {
          id: poopId as string,
          started: data.started,
          ended: data.ended,
          revelations: data.revelations,
          is_public: data.is_public,
          company_time: data.company_time,
        },
      });
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Could not update the sesh');
    }
  };

  return (
    <NotificationProvider>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : !poopSesh ? (
        <View className="flex-1 items-center justify-center">
          <Text>No poop sesh found</Text>
        </View>
      ) : (
        <KeyboardAwareScrollView
          bottomOffset={Platform.select({ ios: 8 })}
          bounces={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pt-4">
          <View className="flex-1 gap-2">
            <View className="gap-2 px-8">
              <Text>Poop Start</Text>
              <Button variant="tonal" onPress={() => setStartPickerOpen(true)}>
                <Text>
                  {format(poopForm.watch('started') ?? new Date(), 'M/dd/yyyy hh:mm a')}
                </Text>
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
                <Text>
                  {format(poopForm.watch('ended') ?? new Date(), 'M/dd/yyyy hh:mm a')}
                </Text>
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
                render={({ field }) => (
                  <Toggle value={field.value} onValueChange={field.onChange} />
                )}
              />
            </View>
            <View className="flex-row items-center justify-between gap-2 px-8">
              <Text>Company Time?</Text>
              <Controller
                name="company_time"
                control={poopForm.control}
                render={({ field }) => (
                  <Toggle value={field.value} onValueChange={field.onChange} />
                )}
              />
            </View>
            <View className="flex-row items-center justify-between gap-2 px-8">
              <View className="flex-row items-center gap-2">
                <Text>Bristol Score</Text>
                <Link href="/bristol">
                  <Icon source="information-outline" size={16} color={colors.primary} />
                </Link>
              </View>
              <Controller
                name="bristol_score"
                control={poopForm.control}
                render={({ field }) => (
                  <View className="flex-row items-center gap-2">
                    <Image
                      source={bristolScoreToImage(field.value || 1)}
                      className="h-10 w-10"
                      resizeMode="contain"
                    />
                    <Stepper
                      subtractButton={{
                        disabled: field.value === 1,
                        onPress: () => {
                          const newValue = (field.value || 1) - 1;
                          if (newValue >= 1) {
                            field.onChange(newValue);
                          }
                        },
                      }}
                      addButton={{
                        disabled: field.value === 7,
                        onPress: () => {
                          const newValue = (field.value || 1) + 1;
                          if (newValue <= 7) {
                            field.onChange(newValue);
                          }
                        },
                      }}
                    />
                  </View>
                )}
              />
            </View>
            <View className="px-8 pt-4">
              <Button
                disabled={poopForm.formState.isSubmitting}
                onPress={poopForm.handleSubmit(handleSaveSesh)}>
                <Text>{poopForm.formState.isSubmitting ? 'Saving...' : 'Save'}</Text>
              </Button>
            </View>
          </View>
        </KeyboardAwareScrollView>
      )}
    </NotificationProvider>
  );
};

export default PoopDetailsContent;