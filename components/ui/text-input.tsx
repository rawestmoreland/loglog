import { useThemeColor } from '@/hooks/use-theme-color';
import {
  TextInput as NativeTextInput,
  type TextInputProps,
} from 'react-native';

export function TextInput({ style, ...props }: TextInputProps) {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'foreground');

  return (
    <NativeTextInput
      style={[
        {
          borderWidth: 1,
          borderColor,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 8,
          color: textColor,
        },
        style,
      ]}
      {...props}
    />
  );
}
