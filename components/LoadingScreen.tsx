import { View } from 'react-native';
import { Text } from './nativewindui/Text';

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-lg text-muted-foreground">Loading...</Text>
    </View>
  );
}
