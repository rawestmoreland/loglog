import { Link } from 'expo-router';
import { Controller } from 'react-hook-form';
import { Keyboard, View, Image } from 'react-native';
import { Icon } from 'react-native-paper';

import { CompanyTimeToggle } from './CompanyTimeToggle';
import { PublicToggle } from './PublicToggle';

import { Timer } from '~/components/Timer';
import { Button } from '~/components/nativewindui/Button';
import { Stepper } from '~/components/nativewindui/Stepper';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';
import { bristolScoreToImage } from '~/lib/helpers';
import type { PoopSesh } from '~/lib/types';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

type DuringSeshViewProps = {
  isLoading: boolean;
  handleEndSesh: () => Promise<void>;
  poopForm: {
    control: any; // Consider using proper react-hook-form types
  };
  activeSesh: PoopSesh;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
};

export function DuringSeshView({
  isLoading,
  handleEndSesh,
  poopForm,
  activeSesh,
  updateActiveSesh,
}: DuringSeshViewProps) {
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
        <CompanyTimeToggle
          isLoading={isLoading}
          activeSesh={activeSesh}
          updateActiveSesh={updateActiveSesh}
        />
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text className="">Bristol Score</Text>
            <Link href="/bristol">
              <Icon source="information-outline" size={16} color={colors.primary} />
            </Link>
          </View>
          <View className="flex-row items-center gap-2">
            <Controller
              control={poopForm.control}
              name="bristol_score"
              defaultValue={0}
              render={({ field }) => (
                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center gap-2">
                    <Text>{field.value || ''}</Text>
                    {field.value ? (
                      <Image
                        source={bristolScoreToImage(field.value || 0)}
                        className="h-10 w-10"
                        resizeMode="contain"
                      />
                    ) : (
                      <Text>No Score</Text>
                    )}
                  </View>
                  <Stepper
                    subtractButton={{
                      disabled: field.value === 0,
                      onPress: () => {
                        const newValue = (field.value || 0) - 1;
                        if (newValue >= 0) {
                          field.onChange(newValue);
                        }
                      },
                    }}
                    addButton={{
                      disabled: field.value === 7,
                      onPress: () => {
                        const newValue = (field.value || 0) + 1;
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
        </View>
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
