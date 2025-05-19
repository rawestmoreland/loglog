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
  onDismiss?: () => void;
  preventDismissal?: boolean;
}

export const Sheet = forwardRef<SheetRef, SheetProps>(
  ({ onPresent, onDismiss, preventDismissal = false, ...props }, ref) => {
    const bottomSheetRef = React.useRef<BottomSheetModal>(null);
    const { colors } = useColorScheme();

    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.present();
        onPresent?.();
      },
      dismiss: () => {
        if (!preventDismissal) {
          bottomSheetRef.current?.dismiss();
          onDismiss?.();
        } else {
          // For sheets that should not dismiss, we re-present to ensure they stay open
          bottomSheetRef.current?.present();
        }
      },
    }));

    const renderBackdrop = React.useCallback(
      (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />,
      []
    );
    
    // Handle attempts to dismiss the sheet
    const handleDismiss = () => {
      if (preventDismissal) {
        // Re-present the sheet to prevent it from being dismissed
        setTimeout(() => {
          bottomSheetRef.current?.present();
        }, 50);
        return;
      }
      
      // Otherwise proceed with normal dismiss
      onDismiss?.();
    };
    
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
        onDismiss={handleDismiss}
        enablePanDownToClose={!preventDismissal}
        enableDismissOnClose={!preventDismissal}
        {...props}
      />
    );
  }
);