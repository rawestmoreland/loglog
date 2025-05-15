import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';

export default function ChatLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="[participant2]"
        options={{
          title: 'Chat',
          headerLeft: () => (
            <Button variant="plain" onPress={() => router.back()} className="items-center gap-2">
              <MaterialIcons name="chevron-left" size={22} />
              <Text>Back</Text>
            </Button>
          ),
        }}
      />
    </Stack>
  );
}
