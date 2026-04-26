import { Colors } from '@/constants/theme';
import { X } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';

export function HeaderBackButton() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';

  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
        padding: 4,
      })}
    >
      <X size={22} color={Colors[scheme].icon as string} />
    </Pressable>
  );
}
