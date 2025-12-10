import { Button, ContextMenu } from '@expo/ui/jetpack-compose';
import { StyleProp, ViewStyle } from 'react-native';

export function DropdownMenu({
  children,
  items,
  containerStyle = { width: 150, height: 50 },
}: {
  children: React.ReactNode;
  items: { label: string; onPress: () => void }[];
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ContextMenu style={containerStyle}>
      <ContextMenu.Items>
        {items?.map((item) => (
          <Button key={item.label} onPress={item.onPress}>
            {item.label}
          </Button>
        ))}
      </ContextMenu.Items>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
    </ContextMenu>
  );
}
