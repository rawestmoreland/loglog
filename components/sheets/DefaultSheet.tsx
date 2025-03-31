import { BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { forwardRef } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { DropdownMenu } from '../nativewindui/DropdownMenu';
import { createDropdownItem } from '../nativewindui/DropdownMenu/utils';

import { Button } from '~/components/nativewindui/Button';
import { Sheet } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { useMapViewContext } from '~/context/mapViewContext';
import { COLORS } from '~/theme/colors';

const DefaultSheet = forwardRef(
  (
    {
      isOnHomeScreen,
      user,
      isSeshPending,
      onStartSesh,
      colors,
      onProfilePress,
    }: {
      isOnHomeScreen: boolean;
      user: any;
      isSeshPending: boolean;
      onStartSesh: () => void;
      colors: any;
      onProfilePress: () => void;
    },
    ref: any
  ) => {
    const { poopsToView, setPoopsToView } = useMapViewContext();

    return (
      <Sheet
        ref={ref}
        enablePanDownToClose={false}
        enableDismissOnClose={false}
        backdropComponent={() => <View className="absolute inset-0 bg-transparent" />}
        snapPoints={!isOnHomeScreen ? ['10%'] : ['17%']}>
        <BottomSheetView className="flex-1">
          <View className="mb-4 flex-row items-center justify-between gap-2 px-8">
            <DropdownMenu
              items={[
                createDropdownItem({
                  actionKey: 'yours',
                  title: 'Your Poops',
                }),
                createDropdownItem({
                  actionKey: 'friends',
                  title: 'Friends',
                }),
                createDropdownItem({
                  actionKey: 'all',
                  title: 'All Poops',
                }),
              ]}
              onItemPress={(item) => {
                setPoopsToView(item.actionKey as 'friends' | 'yours' | 'all');
              }}>
              <Pressable className="flex-row items-center gap-2">
                <Text>
                  {poopsToView === 'all'
                    ? 'All Poops'
                    : poopsToView === 'friends'
                      ? "Friends' Poops"
                      : 'Your Poops'}
                </Text>
                <Icon source="chevron-down" size={24} color={colors.foreground} />
              </Pressable>
            </DropdownMenu>
            {/* Navigation buttons */}
            <View className="flex-row-reverse items-center gap-2">
              <Button
                style={{ backgroundColor: COLORS.light.primary, height: 30, width: 30 }}
                size="icon"
                onPress={onProfilePress}>
                <Icon source="account" size={24} color={COLORS.dark.background} />
              </Button>
              {isOnHomeScreen ? (
                <Button
                  style={{ backgroundColor: COLORS.light.primary, height: 30, width: 30 }}
                  variant="plain"
                  size="icon"
                  onPress={() => router.push('/(protected)/(screens)/poop-history')}>
                  <Icon source="book-open-page-variant" size={24} color={COLORS.dark.background} />
                </Button>
              ) : (
                <View className="flex-row items-center gap-2">
                  <Button
                    style={{ backgroundColor: COLORS.light.primary, height: 30, width: 30 }}
                    size="icon"
                    onPress={() => router.push('/')}>
                    <Icon source="map-marker" size={24} color={COLORS.dark.background} />
                  </Button>
                </View>
              )}
            </View>
          </View>
          {isOnHomeScreen && (
            <View className="relative flex-1 px-8">
              <Button
                disabled={isSeshPending}
                style={{ backgroundColor: COLORS.light.primary }}
                variant="primary"
                onPress={onStartSesh}>
                <Text style={{ color: COLORS.light.foreground }}>
                  {isSeshPending ? 'Hold on...' : 'Drop a Log'}
                </Text>
              </Button>
            </View>
          )}
        </BottomSheetView>
      </Sheet>
    );
  }
);

export default DefaultSheet;
