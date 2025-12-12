import { Colors } from '@/constants/theme';
import { Pressable, PressableProps, useColorScheme } from 'react-native';

export function RoundButton({
  icon,
  ...props
}: {
  icon: React.ComponentType<any>;
} & PressableProps) {
  const scheme = useColorScheme() ?? 'light';

  const Icon = icon;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
        scale: pressed ? 0.95 : 1,
        backgroundColor: Colors[scheme].primary as any,
        color: Colors[scheme].primaryForeground as any,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
      })}
    >
      <Icon
        size={14}
        pointerEvents='none'
        color={Colors[scheme].primaryForeground as any}
      />
    </Pressable>
  );
}
