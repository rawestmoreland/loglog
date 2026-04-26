import { HeaderBackButton } from '@/components/ui/header-back-button';
import { Stack } from 'expo-router';

export default function BristolLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='index'
        options={{
          title: 'Bristol Scale',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  );
}
