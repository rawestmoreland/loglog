import { useThemeColor } from '@/hooks/use-theme-color';
import {
  TextInput as NativeTextInput,
  type TextInputProps,
} from 'react-native';

export function TextInput({ ...props }: TextInputProps) {
  const borderColor = useThemeColor({}, 'border');

  return (
    <NativeTextInput
      style={{
        borderWidth: 1,
        borderColor,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
      }}
      {...props}
    />
  );
}
