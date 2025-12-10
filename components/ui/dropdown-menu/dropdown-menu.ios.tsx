import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';

export function DropdownMenu({
  children,
  items,
}: {
  children: React.ReactNode;
  items: { label: string; onPress: () => void }[];
}) {
  return (
    <Host matchContents>
      <ContextMenu>
        <ContextMenu.Items>
          {items?.map((item) => (
            <Button key={item.label} onPress={item.onPress}>
              {item.label}
            </Button>
          ))}
        </ContextMenu.Items>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}
