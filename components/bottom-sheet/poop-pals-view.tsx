/* eslint-disable @typescript-eslint/no-unused-vars */
import { SheetType } from '@/constants/sheet';
import {
  useAcceptFollowRequest,
  useDeclineFollowRequest,
  useRemovePoopPal,
} from '@/hooks/api/usePoopPalMutations';
import {
  useFollowing,
  useFollowMeRequests,
  useMyFollowers,
} from '@/hooks/api/usePoopPalsQueries';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { FlashList } from '@shopify/flash-list';
import { ChevronRight, User, X } from '@tamagui/lucide-icons';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  AlertDialog,
  Button,
  ListItem,
  Square,
  Text,
  XGroup,
  XStack,
  YStack,
} from 'tamagui';
import PoopPalsSearchModal from '../poop-pals-search-modal';

export function PoopPalsView({
  modal = false,
  isPercent = false,
  innerOpen = false,
  setInnerOpen = () => {},
  setOpen = () => {},
  sheetType,
  setSheetType,
}: {
  modal?: boolean;
  isPercent?: boolean;
  innerOpen?: boolean;
  setInnerOpen?: (open: boolean) => void;
  setOpen?: (open: boolean) => void;
  sheetType?: SheetType;
  setSheetType?: (type: SheetType) => void;
}) {
  const foreground = useThemeColor({}, 'foreground');
  const background = useThemeColor({}, 'background');

  const [requestAlertDialogPalId, setRequestAlertDialogPalId] = useState<
    string | null
  >(null);
  const [removePalAlertDialogPalId, setRemovePalAlertDialogPalId] = useState<
    string | null
  >(null);

  const { showActionSheetWithOptions } = useActionSheet();

  const { data: myFollowers, isLoading: isLoadingMyFollowers } = useMyFollowers(
    {
      enabled: sheetType === SheetType.POOP_PALS,
    }
  );
  const { data: following, isLoading: isLoadingFollowing } = useFollowing({
    enabled: sheetType === SheetType.POOP_PALS,
  });
  const { data: followMeRequests, isLoading: isLoadingFollowMeRequests } =
    useFollowMeRequests({
      enabled: sheetType === SheetType.POOP_PALS,
    });
  const { mutateAsync: removePoopPal } = useRemovePoopPal();

  const {
    mutateAsync: declineFollowRequest,
    isPending: isDecliningFollowRequest,
  } = useDeclineFollowRequest();
  const {
    mutateAsync: acceptFollowRequest,
    isPending: isAcceptingFollowRequest,
  } = useAcceptFollowRequest();

  const handleRemovePoopPal = async (palId: string) => {
    try {
      await removePoopPal(palId);
      setSheetType?.(SheetType.USER_SETTINGS);
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

  const listData = useMemo(() => {
    const listData: (
      | string
      | {
          id: string;
          title: string;
          followsYou: boolean;
          theirProfileId: string;
          followRequest?: boolean;
        }
    )[] = [];
    if (
      isLoadingMyFollowers ||
      isLoadingFollowing ||
      isLoadingFollowMeRequests
    ) {
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
          followsYou: true,
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
          followsYou: false,
          followRequest: true,
        }))
      );
    }
    return listData;
  }, [
    isLoadingMyFollowers,
    isLoadingFollowing,
    isLoadingFollowMeRequests,
    myFollowers,
    following,
    followMeRequests,
  ]);

  const stickyHeaderIndices = listData
    .map((item, index) => {
      if (typeof item === 'string') {
        return index;
      } else {
        return null;
      }
    })
    .filter((item) => item !== null) as number[];

  return (
    <YStack flex={1}>
      <XStack justify='space-between' items='center'>
        <Text fontWeight={'bold'}>Poop Pals</Text>
        <Button
          icon={X}
          circular
          theme='yellow'
          size='$2'
          onPress={() => setSheetType?.(SheetType.USER_SETTINGS)}
        />
      </XStack>
      <XGroup>
        <PoopPalsSearchModal />
      </XGroup>
      <YStack flex={1} mt='$2'>
        <FlashList
          data={listData}
          ItemSeparatorComponent={() => <Square size={10} />}
          stickyHeaderIndices={stickyHeaderIndices}
          getItemType={(item) => {
            return typeof item === 'string' ? 'sectionHeader' : 'row';
          }}
          renderItem={({ item }) => {
            if (typeof item === 'string') {
              return <Text>{item}</Text>;
            } else {
              return (
                <ListItem
                  pressTheme
                  title={item.title ?? 'Unknown'}
                  icon={User}
                  iconAfter={ChevronRight}
                  onPress={() => {
                    // Disabled
                    if (
                      isLoadingMyFollowers ||
                      isLoadingFollowing ||
                      isLoadingFollowMeRequests ||
                      isDecliningFollowRequest ||
                      isAcceptingFollowRequest
                    ) {
                      return;
                    }

                    if (item.followRequest) {
                      setRequestAlertDialogPalId(item.id);
                    } else {
                      setRemovePalAlertDialogPalId(item.id);
                    }
                  }}
                />
              );
            }
          }}
        />
        <RequestAlertDialog
          open={!!requestAlertDialogPalId}
          onClose={() => setRequestAlertDialogPalId(null)}
          onAccept={() =>
            handleAcceptFollowRequest(requestAlertDialogPalId ?? '')
          }
          onReject={() =>
            handleDeclineFollowRequest(requestAlertDialogPalId ?? '')
          }
        />
        <RemovePalAlertDialog
          open={!!removePalAlertDialogPalId}
          onClose={() => setRemovePalAlertDialogPalId(null)}
          onAccept={() => handleRemovePoopPal(removePalAlertDialogPalId ?? '')}
        />
      </YStack>
    </YStack>
  );
}

const RequestAlertDialog = ({
  open,
  onClose,
  onAccept,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose} modal>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key='overlay'
          animation='quick'
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          zIndex={150_000}
        />
        <AlertDialog.Content
          bordered
          elevate
          key='content'
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          scale={1}
          opacity={1}
          y={0}
          z={200_000}
        >
          <YStack gap='$4'>
            <AlertDialog.Title>Follow Request</AlertDialog.Title>
            <AlertDialog.Description>
              Would you like to accept or decline this follow request?
            </AlertDialog.Description>

            <XStack gap='$3' justify='flex-end'>
              <AlertDialog.Cancel asChild>
                <Button onPress={onClose}>Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  theme='accent'
                  onPress={() => {
                    onAccept().then(onClose);
                  }}
                >
                  Accept
                </Button>
              </AlertDialog.Action>
              <AlertDialog.Action asChild>
                <Button
                  theme='accent'
                  onPress={() => {
                    onReject().then(onClose);
                  }}
                >
                  Reject
                </Button>
              </AlertDialog.Action>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
};

const RemovePalAlertDialog = ({
  open,
  onClose,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>;
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose} modal>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key='overlay'
          animation='quick'
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          zIndex={150_000}
        />
        <AlertDialog.Content
          bordered
          elevate
          key='content'
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          scale={1}
          opacity={1}
          y={0}
          z={200_000}
        >
          <YStack gap='$4'>
            <AlertDialog.Title>Remove Pal</AlertDialog.Title>
            <AlertDialog.Description>
              Would you like to remove this pal from your poop pals? This action
              cannot be undone. They will not get an alert.
            </AlertDialog.Description>

            <XStack gap='$3' justify='flex-end'>
              <AlertDialog.Cancel asChild>
                <Button onPress={onClose}>Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  theme='accent'
                  onPress={() => {
                    onAccept().then(onClose);
                  }}
                >
                  Flush &apos;em
                </Button>
              </AlertDialog.Action>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
};
