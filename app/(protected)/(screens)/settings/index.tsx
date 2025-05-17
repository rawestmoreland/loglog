import { Alert, SafeAreaView, View } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { Toggle } from '~/components/nativewindui/Toggle';
import { useAuth } from '~/context/authContext';
import { useUpdatePooProfile } from '~/hooks/api/usePooProfileMutations';
import { usePooProfile } from '~/hooks/api/usePooProfileQueries';

export default function SettingsPage() {
  const { pooProfile } = useAuth();
  const updatePooProfile = useUpdatePooProfile();
  const { refetch: refetchPooProfile } = usePooProfile();

  const handleShiftLogsChange = async (value: boolean) => {
    try {
      await updatePooProfile.mutateAsync({
        id: pooProfile?.id,
        shift_logs: value,
      });
      refetchPooProfile();
    } catch (error) {
      Alert.alert('Error', 'Failed to update poop profile');
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="gap-4 px-4">
        <Text variant="title1">Privacy</Text>
        <View className="flex-row items-center justify-between">
          <View className="w-2/3">
            <Text variant="heading">Shift my poop logs</Text>
            <Text variant="subhead">
              This will shift poop pins on the map to a random location. This is useful if you want
              to keep your location private.
            </Text>
          </View>
          <View className="w-1/3 items-end">
            <Toggle
              disabled={updatePooProfile.isPending}
              value={pooProfile?.shift_logs ?? false}
              onValueChange={(value) => handleShiftLogsChange(value)}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
