import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { useConnection } from '~/context/connectionContext';

export default function NoConnectionScreen() {
  const { isConnected } = useConnection();
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white px-4 dark:bg-gray-900">
      <View className="items-center gap-4">
        <Icon source="wifi-off" size={64} />
        <Text className="text-2xl font-semibold text-gray-900 dark:text-white">
          No Internet Connection
        </Text>
        <Text className="text-center text-base text-gray-500 dark:text-gray-400">
          Please check your connection and try again. We need internet access to properly log your
          logs.
        </Text>
        <Button
          onPress={() => {
            if (isConnected) {
              router.replace('/');
            }
          }}
          className="mt-4">
          <Text>Try Again</Text>
        </Button>
      </View>
    </View>
  );
}
