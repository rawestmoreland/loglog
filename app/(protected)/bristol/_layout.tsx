import { Stack, useRouter } from 'expo-router';

import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';

export default function ChatLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Bristol Scale',
          headerRight: () => (
            <Button variant="plain" onPress={() => router.back()} className="items-center gap-2">
              <Text>Done</Text>
            </Button>
          ),
        }}
      />
    </Stack>
  );
}
