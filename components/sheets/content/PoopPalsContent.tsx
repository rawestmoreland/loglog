import { useActionSheet } from '@expo/react-native-action-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import { ListRenderItemInfo } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Avatar, AvatarFallback } from '~/components/nativewindui/Avatar';
import { Button } from '~/components/nativewindui/Button';
import {
  ESTIMATED_ITEM_HEIGHT,
  List,
  ListDataItem,
  ListItem,
  ListSectionHeader,
} from '~/components/nativewindui/List';
import { Text } from '~/components/nativewindui/Text';
import { useAuth } from '~/context/authContext';
import {
  useAcceptFollowRequest,
  useDeclineFollowRequest,
  useRemovePoopPal,
} from '~/hooks/api/usePoopPalMutations';
import { useFollowing, useFollowMeRequests, useMyFollowers } from '~/hooks/api/usePoopPalsQueries';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';
import PoopPalsSearchModal from '../PoopPalsSearchModal';

export interface PoopPalsContentProps {
  onClose?: () => void;
}

const PoopPalsContent = ({ onClose }: PoopPalsContentProps) => {
  const { pooProfile } = useAuth();
  const { colorScheme, colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const [isPresented, setIsPresented] = useState(true);

  const { data: myFollowers, isLoading: isLoadingMyFollowers } = useMyFollowers({
    enabled: isPresented,
  });
  const { data: following, isLoading: isLoadingFollowing } = useFollowing({
    enabled: isPresented,
  });
  const { data: followMeRequests, isLoading: isLoadingFollowMeRequests } = useFollowMeRequests({
    enabled: isPresented,
  });
  const { mutateAsync: removePoopPal } = useRemovePoopPal();

  const { mutateAsync: declineFollowRequest, isPending: isDecliningFollowRequest } =
    useDeclineFollowRequest();
  const { mutateAsync: acceptFollowRequest, isPending: isAcceptingFollowRequest } =
    useAcceptFollowRequest();

  const handleRemovePoopPal = async (palId: string) => {
    try {
      await removePoopPal(palId);
      if (onClose) onClose();
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

    const title = 'Follow Request';
    const message = 'Would you like to accept or decline this follow request?';

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
            theirProfileId: pal.expand?.following?.id,
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
          theirProfileId: follower.expand?.follower?.id,
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
          theirProfileId: request.expand?.follower?.id,
          followRequest: true,
        }))
      );
    }
    return listData;
  }, [myFollowers, followMeRequests, isLoadingMyFollowers, isLoadingFollowMeRequests, following]);

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4">
        <Text className="text-xl font-semibold">Poop Pals</Text>
        {onClose && (
          <Button
            disabled={isDecliningFollowRequest || isAcceptingFollowRequest}
            style={{
              backgroundColor: COLORS.light.primary,
              height: 30,
              width: 30,
              borderRadius: 15,
            }}
            size="icon"
            onPress={onClose}>
            <Icon source="close" size={24} color={COLORS.dark.background} />
          </Button>
        )}
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
                : handleShowRemoveActionSheet,
              pooProfile?.id ?? '',
              (info.item as { theirProfileId: string }).theirProfileId ?? '',
              colors
            );
          }}
          estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
        />
      </View>
    </View>
  );
};

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
  return typeof item === 'string' ? item : item.id;
}

function renderItem(
  info: ListRenderItemInfo<string | { id: string; title: string }>,
  handleShowActionSheet: (item: { id: string; title: string; followsYou?: boolean }) => void,
  myProfileId: string,
  theirProfileId: string,
  colors: any
) {
  if (typeof info.item === 'string') {
    return <ListSectionHeader className="bg-card" {...info} />;
  }
  const item = info.item as {
    id: string;
    title: string;
    followsYou?: boolean;
    theirProfileId?: string;
  };

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
        item.followsYou &&
        item.theirProfileId &&
        item.theirProfileId !== myProfileId && (
          <TouchableOpacity
            onPress={() => {
              router.push(`/chat/${myProfileId}/${item.theirProfileId}`);
            }}>
            <MaterialIcons name="chat" size={24} color={colors.foreground} />
          </TouchableOpacity>
        )
      }
      {...info}
      onPress={() => handleShowActionSheet(item)}
    />
  );
}

export default PoopPalsContent;