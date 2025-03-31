import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { format, intervalToDuration } from 'date-fns';
import { router } from 'expo-router';
import * as React from 'react';
import { forwardRef } from 'react';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Button } from '~/components/nativewindui/Button';
import { Sheet } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import type { PoopSesh } from '~/lib/types';
import { COLORS } from '~/theme/colors';

type SelectedSeshSheetProps = {
  sesh: PoopSesh;
  onClose: () => void;
  colors: any;
  user: any;
  pooProfile: any;
};

const SelectedSeshSheet = forwardRef<BottomSheetModal, SelectedSeshSheetProps>(
  ({ sesh, onClose, colors, user, pooProfile }, ref) => {
    return (
      <Sheet
        ref={ref}
        enablePanDownToClose={false}
        handleComponent={() => <View className="h-4" />}
        snapPoints={['90%']}
        backdropComponent={() => <View className="absolute inset-0 bg-transparent" />}>
        <BottomSheetView className="flex-1">
          <View className="flex-1 gap-2">
            <View className="flex-row items-center justify-between gap-2 px-8">
              <Text className="font-semibold">
                {format(new Date(sesh.started), 'MM/dd/yyyy HH:mm')}
              </Text>
              <Button variant="plain" size="icon" onPress={onClose}>
                <Icon source="close" size={24} color={colors.foreground} />
              </Button>
            </View>

            <View className="relative flex-1 px-8">
              <View className="gap-2">
                <Text variant="title1" className="font-semibold">
                  Sesh Details
                </Text>
                <Text>
                  <Text className="font-semibold">Time:</Text>{' '}
                  {format(new Date(sesh.started), 'h:mm a')}
                </Text>
                <Text>
                  <Text className="font-semibold">Duration:</Text>{' '}
                  {`${intervalToDuration({ start: new Date(sesh.started), end: new Date(sesh.ended!) })?.minutes ?? 0}m ${intervalToDuration({ start: new Date(sesh.started), end: new Date(sesh.ended!) })?.seconds ?? 0}s`}
                </Text>
                {sesh.revelations && (
                  <Text>
                    <Text className="font-semibold">Revelations:</Text> {sesh.revelations}
                  </Text>
                )}
                {sesh.expand?.poo_profile?.id === pooProfile?.id && (
                  <Button
                    style={{ backgroundColor: colors.primary }}
                    onPress={() => {
                      onClose();
                      router.push({
                        pathname: `/(protected)/(screens)/poop-details/${sesh.id}`,
                        params: { poopId: sesh.id },
                      });
                    }}>
                    <Icon source="pencil" size={24} color={COLORS.light.foreground} />
                    <Text style={{ color: COLORS.light.foreground }}>Edit this sesh</Text>
                  </Button>
                )}
              </View>
            </View>
          </View>
        </BottomSheetView>
      </Sheet>
    );
  }
);

export default SelectedSeshSheet;
