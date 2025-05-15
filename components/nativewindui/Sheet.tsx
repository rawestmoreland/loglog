import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, useImperativeHandle } from 'react';

import { useColorScheme } from '~/lib/useColorScheme';

export type SheetRef = {
  present: () => void;
  dismiss: () => void;
};

export const useSheetRef = () => {
  return React.useRef<SheetRef>(null);
};

interface SheetProps extends Omit<BottomSheetModalProps, 'ref'> {
  onPresent?: () => void;
}

export const Sheet = forwardRef<SheetRef, SheetProps>(({ onPresent, ...props }, ref) => {
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const { colors } = useColorScheme();

  useImperativeHandle(ref, () => ({
    present: () => {
      bottomSheetRef.current?.present();
      onPresent?.();
    },
    dismiss: () => {
      bottomSheetRef.current?.dismiss();
    },
  }));

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />,
    []
  );
  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      backgroundStyle={
        props.backgroundStyle ?? {
          backgroundColor: colors.card,
        }
      }
      style={
        props.style ?? {
          borderWidth: 1,
          borderColor: colors.grey5,
          borderTopStartRadius: 16,
          borderTopEndRadius: 16,
        }
      }
      handleIndicatorStyle={
        props.handleIndicatorStyle ?? {
          backgroundColor: colors.grey4,
        }
      }
      backdropComponent={renderBackdrop}
      {...props}
    />
  );
});
