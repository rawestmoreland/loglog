import { Colors } from '@/constants/theme';
import { useCallback, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Switch, type SwitchProps } from 'tamagui';

export function LogSwitch({
  checked: checkedProp,
  defaultChecked,
  onCheckedChange,
  ...props
}: SwitchProps) {
  const scheme = useColorScheme() ?? 'light';
  const [uncontrolledChecked, setUncontrolledChecked] = useState<boolean>(
    Boolean(defaultChecked)
  );

  const checked = checkedProp ?? uncontrolledChecked;

  const handleCheckedChange = useCallback(
    (next: boolean) => {
      if (checkedProp === undefined) setUncontrolledChecked(next);
      onCheckedChange?.(next);
    },
    [checkedProp, onCheckedChange]
  );

  return (
    <Switch
      {...props}
      checked={checked}
      onCheckedChange={handleCheckedChange}
      bg={(checked ? Colors[scheme].primary : Colors[scheme].border) as any}
      borderColor={
        (checked ? Colors[scheme].primary : Colors[scheme].border) as any
      }
    >
      <Switch.Thumb animation='quicker' />
    </Switch>
  );
}
