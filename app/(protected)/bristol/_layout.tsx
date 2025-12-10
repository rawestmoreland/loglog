import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { Text } from 'tamagui';

export default function ChatLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          title: 'Bristol Scale',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text>Done</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
