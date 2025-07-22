import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { forwardRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { DuringSeshView } from './active/DuringSeshView';

import { Sheet } from '~/components/nativewindui/Sheet';
import type { PoopSesh } from '~/lib/types';
import { useColorScheme } from '~/lib/useColorScheme';

type ActiveSeshSheetProps = {
  sesh: PoopSesh;
  isLoading: boolean;
  isSeshPending: boolean;
  onEnd: () => Promise<void>;
  poopForm: any;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
};

const ActiveSeshSheet = forwardRef<BottomSheetModal, ActiveSeshSheetProps>(
  ({ sesh, isLoading, isSeshPending, onEnd, poopForm, updateActiveSesh }, ref: any) => {
    const { colors } = useColorScheme();

    return (
      <Sheet
        ref={ref}
        enablePanDownToClose={false}
        enableDismissOnClose={false}
        backdropComponent={() => <View className="absolute inset-0 bg-transparent" />}
        snapPoints={['80%', '90%']}>
        <BottomSheetView className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <DuringSeshView
              isLoading={isSeshPending}
              handleEndSesh={onEnd}
              poopForm={poopForm}
              activeSesh={sesh}
              updateActiveSesh={updateActiveSesh}
              userLocation={sesh.location?.coordinates}
            />
          )}
        </BottomSheetView>
      </Sheet>
    );
  }
);

export default ActiveSeshSheet;
