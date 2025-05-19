import { BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { View } from 'react-native';
import { usePathname } from 'expo-router';

import { Sheet, SheetRef } from '../nativewindui/Sheet';
import ActiveSeshContent from './content/ActiveSeshContent';
import DefaultContent from './content/DefaultContent';
import PoopDetailsContent from './content/PoopDetailsContent';
import PoopHistoryContent from './content/PoopHistoryContent';
import PoopPalsContent from './content/PoopPalsContent';
import ProfileContent from './content/ProfileContent';
import SelectedSeshContent from './content/SelectedSeshContent';
import { useMapViewContext } from '~/context/mapViewContext';

export type SheetContentType =
  | 'default'
  | 'activeSesh'
  | 'selectedSesh'
  | 'profile'
  | 'poopPals'
  | 'poopHistory'
  | 'poopDetails';

export type UnifiedSheetRef = SheetRef & {
  changeContent: (contentType: SheetContentType, props?: any) => void;
};

interface UnifiedSheetProps {
  initialContentType?: SheetContentType;
  initialSnapPoint?: string;
  backdropComponent?: (props: BottomSheetBackdropProps) => React.ReactNode;
  preventDismissalOnHome?: boolean;
}

const getSnapPointForContent = (contentType: SheetContentType): string[] => {
  switch (contentType) {
    case 'default':
      return ['20%'];
    case 'activeSesh':
    case 'selectedSesh':
      return ['50%'];
    case 'profile':
    case 'poopPals':
    case 'poopHistory':
    case 'poopDetails':
      return ['75%'];
    default:
      return ['20%'];
  }
};

const UnifiedSheet = forwardRef<UnifiedSheetRef, UnifiedSheetProps>((props, ref) => {
  const {
    initialContentType = 'default',
    initialSnapPoint,
    backdropComponent,
    preventDismissalOnHome = true,
  } = props;

  const { poopsToView, setPoopsToView, palSelected, setPalSelected } = useMapViewContext();

  const pathname = usePathname();
  const isOnHomeScreen = pathname === '/' || pathname === '/index';

  const [contentType, setContentType] = useState<SheetContentType>(initialContentType);
  const [contentProps, setContentProps] = useState<any>({});
  const [snapPoints, setSnapPoints] = useState<string[]>(
    initialSnapPoint ? [initialSnapPoint] : getSnapPointForContent(initialContentType)
  );
  const [isPresented, setIsPresented] = useState(false);

  const sheetRef = React.useRef<SheetRef>(null);

  // Add logging for content props changes
  useEffect(() => {
    console.log('UnifiedSheet - contentProps changed:', contentProps);
  }, [contentProps]);

  // Add logging for content type changes
  useEffect(() => {
    console.log('UnifiedSheet - contentType changed:', contentType);
  }, [contentType]);

  // Handle pathname changes
  useEffect(() => {
    if (isOnHomeScreen) {
      // When returning to home, present the sheet
      setTimeout(() => {
        sheetRef.current?.present();
        setIsPresented(true);
      }, 50);
    } else {
      // When leaving home, dismiss the sheet
      sheetRef.current?.dismiss();
      setIsPresented(false);
    }
  }, [pathname]);

  // To handle presentation state properly across re-renders
  useEffect(() => {
    if (isPresented && sheetRef.current) {
      // This ensures the sheet stays presented after component updates
      const timer = setTimeout(() => {
        sheetRef.current?.present();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isPresented, contentType, snapPoints]);

  useImperativeHandle(ref, () => ({
    present: () => {
      sheetRef.current?.present();
      setIsPresented(true);
    },
    dismiss: () => {
      if (!isOnHomeScreen || !preventDismissalOnHome) {
        sheetRef.current?.dismiss();
        setIsPresented(false);
      } else {
        sheetRef.current?.present();
        setIsPresented(true);
      }
    },
    changeContent: (newContentType: SheetContentType, newContentProps = {}) => {
      console.log('UnifiedSheet - changeContent called with:', { newContentType, newContentProps });
      // First update content props
      setContentProps(newContentProps);

      // Then update content type and snap points
      setContentType(newContentType);
      setSnapPoints(getSnapPointForContent(newContentType));

      // Always present sheet after content change
      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.present();
          setIsPresented(true);
        }
      }, 50);
    },
  }));

  const handleOnDismiss = () => {
    // Only update presented state if dismissal is allowed
    if (!isOnHomeScreen || !preventDismissalOnHome) {
      setIsPresented(false);
    } else {
      // If on home screen and prevention is enabled, re-present
      setTimeout(() => {
        sheetRef.current?.present();
        setIsPresented(true);
      }, 50);
    }
  };

  const handleOnPresent = () => {
    setIsPresented(true);
  };

  const renderContent = () => {
    const contextProps = {
      poopsToView,
      setPoopsToView,
      palSelected,
      setPalSelected,
    };

    // Merge context props with content props
    const mergedProps = {
      ...contentProps,
      ...contextProps,
    };

    console.log('UnifiedSheet - rendering content with props:', {
      contentType,
      mergedProps,
      contentProps,
      contextProps,
    });

    switch (contentType) {
      case 'default':
        return <DefaultContent {...mergedProps} />;
      case 'activeSesh':
        return <ActiveSeshContent {...mergedProps} />;
      case 'selectedSesh':
        return <SelectedSeshContent {...mergedProps} />;
      case 'profile':
        return <ProfileContent {...mergedProps} />;
      case 'poopPals':
        return <PoopPalsContent {...mergedProps} />;
      case 'poopHistory':
        return <PoopHistoryContent {...mergedProps} />;
      case 'poopDetails':
        return <PoopDetailsContent {...mergedProps} />;
      default:
        return <DefaultContent {...mergedProps} />;
    }
  };

  // Determine if we should prevent dismissal
  // Sheet should not be dismissible when on home screen (if preventDismissalOnHome is true)
  // or for specific content types that should never dismiss
  const shouldPreventDismissal =
    isOnHomeScreen &&
    preventDismissalOnHome &&
    ['default', 'poopHistory', 'poopPals', 'profile', 'activeSesh', 'poopDetails'].includes(
      contentType
    );

  return (
    <Sheet
      ref={sheetRef}
      snapPoints={snapPoints}
      onPresent={handleOnPresent}
      onDismiss={handleOnDismiss}
      handleComponent={() => <View className="h-4" />}
      preventDismissal={shouldPreventDismissal}
      backdropComponent={
        backdropComponent || (() => <View className="absolute inset-0 bg-transparent" />)
      }>
      <BottomSheetView className="relative flex-1">{renderContent()}</BottomSheetView>
    </Sheet>
  );
});

export default UnifiedSheet;
