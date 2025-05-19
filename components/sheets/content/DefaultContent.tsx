import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Button } from '~/components/nativewindui/Button';
import { DropdownMenu } from '~/components/nativewindui/DropdownMenu';
import { createDropdownItem } from '~/components/nativewindui/DropdownMenu/utils';
import { Text } from '~/components/nativewindui/Text';
import { useMapViewContext } from '~/context/mapViewContext';
import { useFollowing } from '~/hooks/api/usePoopPalsQueries';
import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

export interface DefaultContentProps {
  isOnHomeScreen: boolean;
  user: any;
  isSeshPending: boolean;
  onStartSesh: () => void;
  colors: any;
  onProfilePress: () => void;
  onPoopHistoryPress: () => void;
}

const DefaultContent = ({
  isOnHomeScreen,
  user,
  isSeshPending,
  onStartSesh,
  colors: passedColors,
  onProfilePress,
  onPoopHistoryPress,
}: DefaultContentProps) => {
  const { colors } = useColorScheme();
  const { poopsToView, setPoopsToView, palSelected, setPalSelected } = useMapViewContext();
  const [isPresented, setIsPresented] = useState(true);

  // Use passed colors if available, otherwise use from context
  const effectiveColors = passedColors || colors;

  const { data: following, isLoading: isFollowingLoading } = useFollowing({
    enabled: isPresented && poopsToView === 'friends',
  });

  return (
    <>
      <View
        className={cn(
          poopsToView === 'friends' ? 'mb-2' : 'mb-4',
          `flex-row items-center justify-between gap-2 px-8`
        )}>
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
            <Icon source="chevron-down" size={24} color={effectiveColors.foreground} />
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
              onPress={onPoopHistoryPress}>
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
      {/* Friend Selector */}
      {poopsToView === 'friends' && !isFollowingLoading && (
        <View className="mb-2 px-8">
          <FlashList
            estimatedItemSize={100}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View className="w-2" />}
            data={[
              {
                id: 'all',
                expand: { following: { codeName: 'All', id: 'all' } },
              },
              ...(following ?? []),
            ]}
            horizontal
            renderItem={({ item }) => {
              return (
                <Pressable
                  onPress={() => setPalSelected(item.expand?.following.id)}
                  className={cn(
                    palSelected === item.expand?.following.id
                      ? 'rounded-lg border border-border bg-gray-100 px-2 py-1 dark:border-muted-foreground dark:bg-gray-100/50'
                      : 'rounded-lg border border-border bg-transparent px-2 py-1 dark:border-muted-foreground dark:bg-transparent'
                  )}>
                  <Text className="text-sm text-foreground">{item.expand?.following.codeName}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      )}
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
    </>
  );
};

export default DefaultContent;
