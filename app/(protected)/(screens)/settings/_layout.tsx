import { HeaderBackButton } from '@/components/ui/header-back-button';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          title: 'Settings',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  );
}
