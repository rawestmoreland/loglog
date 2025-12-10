import { Stack, useRouter } from 'expo-router';
import { Button } from 'react-native';

export default function SettingsLayout() {
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          title: 'Settings',
          headerRight: () => (
            <Button onPress={() => router.back()} title='Back' />
          ),
        }}
      />
    </Stack>
  );
}
