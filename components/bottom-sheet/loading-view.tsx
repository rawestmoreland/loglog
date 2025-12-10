import { View } from 'react-native';
import { Text } from 'tamagui';

export function LoadingView({
  modal = false,
  isPercent = false,
  innerOpen = false,
  setInnerOpen = () => {},
  setOpen = () => {},
}: {
  modal?: boolean;
  isPercent?: boolean;
  innerOpen?: boolean;
  setInnerOpen?: (open: boolean) => void;
  setOpen?: (open: boolean) => void;
}) {
  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <View style={{}}>
        <Text>Loading...</Text>
      </View>
    </View>
  );
}
