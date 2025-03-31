import { useActionSheet } from '@expo/react-native-action-sheet';
import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { ListRenderItemInfo } from '@shopify/flash-list';
import React, { forwardRef, useMemo } from 'react';
import { Alert, View } from 'react-native';
import { Icon } from 'react-native-paper';

import PoopPalsSearchModal from './PoopPalsSearchModal';
import { Avatar, AvatarFallback } from '../nativewindui/Avatar';
import { Button } from '../nativewindui/Button';
import {
  ESTIMATED_ITEM_HEIGHT,
  List,
  ListDataItem,
  ListItem,
  ListSectionHeader,
} from '../nativewindui/List';
import { Sheet } from '../nativewindui/Sheet';
import { Text } from '../nativewindui/Text';

import {
  useAcceptFollowRequest,
  useDeclineFollowRequest,
  useRemovePoopPal,
} from '~/hooks/api/usePoopPalMutations';
import { useFollowing, useFollowMeRequests, useMyFollowers } from '~/hooks/api/usePoopPalsQueries';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

type PoopPalsSheetProps = object;

const PoopPalsSheet = forwardRef<BottomSheetModal, PoopPalsSheetProps>(
  (props: PoopPalsSheetProps, ref: any) => {
    const { colorScheme, colors } = useColorScheme();
    const { showActionSheetWithOptions } = useActionSheet();
    const { data: myFollowers, isLoading: isLoadingMyFollowers } = useMyFollowers();
    const { data: following, isLoading: isLoadingFollowing } = useFollowing();
    const { data: followMeRequests, isLoading: isLoadingFollowMeRequests } = useFollowMeRequests();
    const { mutateAsync: removePoopPal } = useRemovePoopPal();

    const { mutateAsync: declineFollowRequest, isPending: isDecliningFollowRequest } =
      useDeclineFollowRequest();
    const { mutateAsync: acceptFollowRequest, isPending: isAcceptingFollowRequest } =
      useAcceptFollowRequest();

    const handleRemovePoopPal = async (palId: string) => {
      try {
        await removePoopPal(palId);
        ref.current?.dismiss();
      } catch (error) {
        Alert.alert('Error', 'Failed to remove pal');
      }
    };

    const handleDeclineFollowRequest = async (palId: string) => {
      try {
        await declineFollowRequest(palId);
      } catch (error) {
        Alert.alert('Error', 'Failed to decline follow request');
      }
    };

    const handleAcceptFollowRequest = async (palId: string) => {
      try {
        await acceptFollowRequest(palId);
      } catch (error) {
        Alert.alert('Error', 'Failed to accept follow request');
      }
    };

    const handleShowRequestActionSheet = async (item: {
      id: string;
      title: string;
      followsYou?: boolean;
      followRequest?: boolean;
    }) => {
      const options = ['Accept', 'Decline', 'Cancel'];
      const destructiveButtonIndex = 1;
      const cancelButtonIndex = 2;

      const title = 'Accept of Decline';
      const message = 'Accept or decline this follow request.';

      showActionSheetWithOptions(
        {
          title,
          message,
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          containerStyle: {
            backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
          },
          textStyle: {
            color: colors.foreground,
          },
        },
        (selectedIndex) => {
          switch (selectedIndex) {
            case 0:
              handleAcceptFollowRequest(item.id);
              break;
            case destructiveButtonIndex:
              handleDeclineFollowRequest(item.id);
              break;
            case cancelButtonIndex:
            // Cancel button
          }
        }
      );
    };

    const handleShowRemoveActionSheet = async (item: {
      id: string;
      title: string;
      followsYou?: boolean;
      followRequest?: boolean;
    }) => {
      const options = ["Flush 'em", 'Cancel'];
      const destructiveButtonIndex = 0;
      const cancelButtonIndex = 1;

      const title = 'Remove Pal';
      const message =
        'Are you sure you want to remove this pal? This action cannot be undone and they will not get an alert.';

      showActionSheetWithOptions(
        {
          title,
          message,
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          containerStyle: {
            backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
          },
          textStyle: {
            color: colors.foreground,
          },
        },
        (selectedIndex) => {
          switch (selectedIndex) {
            case destructiveButtonIndex:
              handleRemovePoopPal(item.id);
              break;
            case cancelButtonIndex:
            // Cancel button
          }
        }
      );
    };

    const listData = useMemo(() => {
      const listData: ListDataItem[] = [];
      if (isLoadingMyFollowers || isLoadingFollowing || isLoadingFollowMeRequests) {
        return listData;
      }

      if (following && following.length > 0) {
        listData.push('Following');
        listData.push(
          ...(following ?? []).map((pal) => {
            return {
              id: pal.id,
              title: pal.expand?.following?.codeName,
              followsYou: pal.followsYou,
            };
          })
        );
      }

      if (myFollowers && myFollowers.length > 0) {
        listData.push('Followers');
        listData.push(
          ...(myFollowers ?? []).map((follower) => ({
            id: follower.id,
            title: follower.expand?.follower?.codeName,
            followsYou: follower.followsYou,
          }))
        );
      }

      if (followMeRequests && followMeRequests.length > 0) {
        listData.push('Follow Requests');
        listData.push(
          ...(followMeRequests ?? []).map((request) => ({
            id: request.id,
            title: request.expand?.follower?.codeName,
            followRequest: true,
          }))
        );
      }
      return listData;
    }, [myFollowers, followMeRequests, isLoadingMyFollowers, isLoadingFollowMeRequests, following]);

    return (
      <Sheet ref={ref} snapPoints={['90%']} handleComponent={() => <></>}>
        <BottomSheetView className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4">
            <Text className="text-xl font-semibold">Poop Pals</Text>
            <Button
              disabled={isDecliningFollowRequest || isAcceptingFollowRequest}
              style={{
                backgroundColor: COLORS.light.primary,
                height: 30,
                width: 30,
                borderRadius: 15,
              }}
              size="icon"
              onPress={() => ref.current?.dismiss()}>
              <Icon source="close" size={24} color={COLORS.dark.background} />
            </Button>
          </View>

          <PoopPalsSearchModal />

          {/* Poop Pals List */}
          <View className="flex-1">
            <List
              variant="insets"
              keyExtractor={keyExtractor}
              data={listData}
              ItemSeparatorComponent={() => <View className="h-2" />}
              renderItem={(info) => {
                return renderItem(
                  info,
                  (info.item as { followRequest?: boolean }).followRequest
                    ? handleShowRequestActionSheet
                    : handleShowRemoveActionSheet
                );
              }}
              estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
            />
          </View>
        </BottomSheetView>
      </Sheet>
    );
  }
);

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
  return typeof item === 'string' ? item : item.id;
}

function renderItem(
  info: ListRenderItemInfo<string | { id: string; title: string }>,
  handleShowActionSheet: (item: { id: string; title: string; followsYou?: boolean }) => void
) {
  if (typeof info.item === 'string') {
    return <ListSectionHeader className="bg-card" {...info} />;
  }
  const item = info.item as { id: string; title: string; followsYou: boolean };
  return (
    <ListItem
      className="border-b-border border-t-border"
      leftView={
        <View className="flex-1 justify-center pr-2">
          <Avatar alt={item.title ?? ''}>
            <AvatarFallback>
              <Text>{item.title?.[0]}</Text>
            </AvatarFallback>
          </Avatar>
        </View>
      }
      rightView={
        item.followsYou && <Text className="text-xs text-muted-foreground">Follows you</Text>
      }
      {...info}
      onPress={() => handleShowActionSheet(item)}
    />
  );
}

export default PoopPalsSheet;
