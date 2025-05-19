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
    preventDismissalOnHome = true
  } = props;

  const pathname = usePathname();
  const isOnHomeScreen = pathname === '/' || pathname === '/index';
  
  const [contentType, setContentType] = useState<SheetContentType>(initialContentType);
  const [contentProps, setContentProps] = useState<any>({});
  const [snapPoints, setSnapPoints] = useState<string[]>(
    initialSnapPoint ? [initialSnapPoint] : getSnapPointForContent(initialContentType)
  );
  const [isPresented, setIsPresented] = useState(false);
  
  const sheetRef = React.useRef<SheetRef>(null);

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
      // Only allow dismissal if not on home screen or if dismissal is explicitly allowed even on home
      if (!isOnHomeScreen || !preventDismissalOnHome) {
        sheetRef.current?.dismiss();
        setIsPresented(false);
      } else {
        // On home screen with prevention enabled, re-present instead of dismissing
        sheetRef.current?.present();
        setIsPresented(true);
      }
    },
    changeContent: (newContentType: SheetContentType, newContentProps = {}) => {
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
    }
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
    switch (contentType) {
      case 'default':
        return <DefaultContent {...contentProps} />;
      case 'activeSesh':
        return <ActiveSeshContent {...contentProps} />;
      case 'selectedSesh':
        return <SelectedSeshContent {...contentProps} />;
      case 'profile':
        return <ProfileContent {...contentProps} />;
      case 'poopPals':
        return <PoopPalsContent {...contentProps} />;
      case 'poopHistory':
        return <PoopHistoryContent {...contentProps} />;
      case 'poopDetails':
        return <PoopDetailsContent {...contentProps} />;
      default:
        return <DefaultContent {...contentProps} />;
    }
  };

  // Determine if we should prevent dismissal
  // Sheet should not be dismissible when on home screen (if preventDismissalOnHome is true)
  // or for specific content types that should never dismiss
  const shouldPreventDismissal = (isOnHomeScreen && preventDismissalOnHome) || 
    ['default', 'poopHistory', 'poopPals', 'profile', 'activeSesh'].includes(contentType);

  return (
    <Sheet
      ref={sheetRef}
      snapPoints={snapPoints}
      onPresent={handleOnPresent}
      onDismiss={handleOnDismiss}
      handleComponent={() => <View className="h-4" />}
      preventDismissal={shouldPreventDismissal}
      backdropComponent={backdropComponent || (() => <View className="absolute inset-0 bg-transparent" />)}
    >
      <BottomSheetView className="relative flex-1">
        {renderContent()}
      </BottomSheetView>
    </Sheet>
  );
});

export default UnifiedSheet;