import { router, Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-paper';

import { Text } from '~/components/nativewindui/Text';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="poop-history"
        options={{
          title: 'History',
          headerLeft: () => (
            <TouchableOpacity className="flex-row items-center gap-1" onPress={() => router.back()}>
              <Icon source="chevron-left" size={36} />
              <Text>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="poop-details/[poop-id]" options={{ title: 'Sesh Details' }} />
    </Stack>
  );
}
