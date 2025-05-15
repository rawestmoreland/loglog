import { Controller } from 'react-hook-form';
import { Keyboard, View } from 'react-native';

import { PublicToggle } from './PublicToggle';

import { Timer } from '~/components/Timer';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';
import type { PoopSesh } from '~/lib/types';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';
import { Toggle } from '~/components/nativewindui/Toggle';
import { CompanyTimeToggle } from './CompanyTimeToggle';

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
