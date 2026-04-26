import { SheetType } from '@/constants/sheet';
import { Colors } from '@/constants/theme';
import {
  useAcceptFollowRequest,
  useDeclineFollowRequest,
  useRemovePoopPal,
} from '@/hooks/api/usePoopPalMutations';
import {
  useFollowing,
  useFollowMeRequests,
  useMyFollowers,
  useMyPendingRequests,
} from '@/hooks/api/usePoopPalsQueries';
import { FlashList } from '@shopify/flash-list';
import { Check, ChevronRight, Clock, X } from '@tamagui/lucide-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, useColorScheme } from 'react-native';
import {
  AlertDialog,
  Button,
  Card,
  Separator,
  Text,
  XStack,
  YStack,
} from 'tamagui';
import PoopPalsSearchModal from '../poop-pals-search-modal';

type PalListItem = {
  id: string;
  title: string;
  theirProfileId: string;
  followsYou: boolean;
  section: 'following' | 'follower' | 'followRequest' | 'pendingRequest';
};

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
  const scheme = useColorScheme() ?? 'light';

  const [removePalAlertDialogPalId, setRemovePalAlertDialogPalId] = useState<
    string | null
  >(null);
  const [cancelRequestAlertDialogPalId, setCancelRequestAlertDialogPalId] =
    useState<string | null>(null);

  const { data: myFollowers, isLoading: isLoadingMyFollowers } = useMyFollowers(
    { enabled: sheetType === SheetType.POOP_PALS }
  );
  const { data: following, isLoading: isLoadingFollowing } = useFollowing({
    enabled: sheetType === SheetType.POOP_PALS,
  });
  const { data: followMeRequests, isLoading: isLoadingFollowMeRequests } =
    useFollowMeRequests({ enabled: sheetType === SheetType.POOP_PALS });
  const { data: myPendingRequests, isLoading: isLoadingMyPendingRequests } =
    useMyPendingRequests({ enabled: sheetType === SheetType.POOP_PALS });

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
    } catch {
      Alert.alert('Error', 'Failed to remove pal');
    }
  };

  const handleDeclineFollowRequest = async (palId: string) => {
    try {
      await declineFollowRequest(palId);
    } catch {
      Alert.alert('Error', 'Failed to decline follow request');
    }
  };

  const handleAcceptFollowRequest = async (palId: string) => {
    try {
      await acceptFollowRequest(palId);
    } catch {
      Alert.alert('Error', 'Failed to accept follow request');
    }
  };

  const handleCancelFollowRequest = async (palId: string) => {
    try {
      await removePoopPal(palId);
    } catch {
      Alert.alert('Error', 'Failed to cancel request');
    }
  };

  const isLoading =
    isLoadingMyFollowers ||
    isLoadingFollowing ||
    isLoadingFollowMeRequests ||
    isLoadingMyPendingRequests;

  const listData = useMemo(() => {
    const data: (string | PalListItem)[] = [];
    if (isLoading) return data;

    if (following?.length) {
      data.push(`FOLLOWING · ${following.length}`);
      data.push(
        ...following.map((pal) => ({
          id: pal.id,
          title: pal.expand?.following?.codeName ?? 'Unknown',
          theirProfileId: pal.expand?.following?.id ?? '',
          followsYou: pal.followsYou,
          section: 'following' as const,
        }))
      );
    }

    if (myFollowers?.length) {
      data.push(`FOLLOWERS · ${myFollowers.length}`);
      data.push(
        ...myFollowers.map((follower) => ({
          id: follower.id,
          title: follower.expand?.follower?.codeName ?? 'Unknown',
          theirProfileId: follower.expand?.follower?.id ?? '',
          followsYou: true,
          section: 'follower' as const,
        }))
      );
    }

    if (followMeRequests?.length) {
      data.push(`FOLLOW REQUESTS · ${followMeRequests.length}`);
      data.push(
        ...followMeRequests.map((request) => ({
          id: request.id,
          title: request.expand?.follower?.codeName ?? 'Unknown',
          theirProfileId: request.expand?.follower?.id ?? '',
          followsYou: false,
          section: 'followRequest' as const,
        }))
      );
    }

    if (myPendingRequests?.length) {
      data.push(`PENDING · ${myPendingRequests.length}`);
      data.push(
        ...myPendingRequests.map((request) => ({
          id: request.id,
          title: request.expand?.following?.codeName ?? 'Unknown',
          theirProfileId: request.expand?.following?.id ?? '',
          followsYou: false,
          section: 'pendingRequest' as const,
        }))
      );
    }

    return data;
  }, [isLoading, myFollowers, following, followMeRequests, myPendingRequests]);

  const stickyHeaderIndices = listData
    .map((item, index) => (typeof item === 'string' ? index : null))
    .filter((index): index is number => index !== null);

  const totalPals = (following?.length ?? 0) + (myFollowers?.length ?? 0);

  return (
    <YStack flex={1} gap='$4' mb='$4'>
      {/* Header */}
      <XStack justify='space-between' items='center'>
        <YStack gap='$1'>
          <Text fontSize='$7' fontWeight='800' color='$color'>
            Poop Pals 💩
          </Text>
          {!isLoading && (
            <Text fontSize='$2' color='$color11' fontWeight='500'>
              {totalPals} pal{totalPals !== 1 ? 's' : ''} in your circle
            </Text>
          )}
        </YStack>
        <Pressable
          aria-label='Close'
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
            scale: pressed ? 0.95 : 1,
            backgroundColor: Colors[scheme].primary as string,
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9999,
          })}
          onPress={() => setSheetType?.(SheetType.USER_SETTINGS)}
        >
          <X
            size={16}
            pointerEvents='none'
            color={Colors[scheme].primaryForeground as string}
          />
        </Pressable>
      </XStack>

      {/* Search */}
      <PoopPalsSearchModal />

      {/* List */}
      <YStack flex={1}>
        {isLoading ? (
          <YStack flex={1} justify='center' items='center' py='$8'>
            <Text color='$color11' fontWeight='500'>
              Loading pals...
            </Text>
          </YStack>
        ) : listData.length === 0 ? (
          <YStack flex={1} justify='center' items='center' gap='$3' py='$8'>
            <Text fontSize='$8' opacity={0.5}>
              💩
            </Text>
            <Text fontSize='$5' fontWeight='600' color='$color11'>
              No pals yet
            </Text>
            <Text fontSize='$3' color='$color11' textAlign='center'>
              Search for friends to add them as poop pals!
            </Text>
          </YStack>
        ) : (
          <FlashList
            data={listData}
            ItemSeparatorComponent={() => <YStack height={8} />}
            stickyHeaderIndices={stickyHeaderIndices}
            estimatedItemSize={64}
            getItemType={(item) =>
              typeof item === 'string' ? 'sectionHeader' : 'row'
            }
            renderItem={({ item }) => {
              if (typeof item === 'string') {
                return (
                  <YStack
                    backgroundColor={Colors[scheme].background as any}
                    pt='$2'
                    pb='$1'
                  >
                    <XStack gap='$2' items='center'>
                      <Text
                        fontSize='$1'
                        fontWeight='700'
                        color={Colors[scheme].mutedForeground as any}
                      >
                        {item}
                      </Text>
                      <Separator
                        flex={1}
                        borderColor={Colors[scheme].border as any}
                      />
                    </XStack>
                  </YStack>
                );
              }

              const initial = (item.title ?? '?')[0].toUpperCase();

              if (item.section === 'followRequest') {
                return (
                  <Card
                    borderRadius='$4'
                    borderWidth={2}
                    borderColor={Colors[scheme].border as any}
                    bg={Colors[scheme].background as any}
                    elevate
                    padding='$3'
                  >
                    <XStack gap='$3' items='center'>
                      <YStack
                        width={44}
                        height={44}
                        borderRadius={22}
                        backgroundColor={Colors[scheme].muted as any}
                        borderWidth={2}
                        borderColor={Colors[scheme].primary as any}
                        items='center'
                        justify='center'
                      >
                        <Text
                          fontWeight='800'
                          fontSize='$5'
                          color={Colors[scheme].primary as any}
                        >
                          {initial}
                        </Text>
                      </YStack>
                      <YStack flex={1} gap='$0.5'>
                        <Text fontWeight='700' fontSize='$4' color='$color'>
                          {item.title}
                        </Text>
                        <Text
                          fontSize='$2'
                          color={Colors[scheme].mutedForeground as any}
                        >
                          wants to be your pal
                        </Text>
                      </YStack>
                      <XStack gap='$2'>
                        <Button
                          size='$3'
                          circular
                          backgroundColor={Colors[scheme].success as any}
                          pressStyle={{ opacity: 0.8, scale: 0.96 }}
                          disabled={
                            isAcceptingFollowRequest || isDecliningFollowRequest
                          }
                          onPress={() => handleAcceptFollowRequest(item.id)}
                          icon={
                            <Check
                              size={14}
                              color={Colors[scheme].successForeground as any}
                            />
                          }
                        />
                        <Button
                          size='$3'
                          circular
                          backgroundColor={Colors[scheme].destructive as any}
                          pressStyle={{ opacity: 0.8, scale: 0.96 }}
                          disabled={
                            isAcceptingFollowRequest || isDecliningFollowRequest
                          }
                          onPress={() => handleDeclineFollowRequest(item.id)}
                          icon={
                            <X
                              size={14}
                              color={Colors[scheme].destructiveForeground as any}
                            />
                          }
                        />
                      </XStack>
                    </XStack>
                  </Card>
                );
              }

              if (item.section === 'pendingRequest') {
                return (
                  <Card
                    borderRadius='$4'
                    borderWidth={2}
                    borderColor={Colors[scheme].border as any}
                    bg={Colors[scheme].background as any}
                    elevate
                    padding='$3'
                    pressStyle={{ opacity: 0.85, scale: 0.98 }}
                    animation='quick'
                    onPress={() => setCancelRequestAlertDialogPalId(item.id)}
                  >
                    <XStack gap='$3' items='center'>
                      <YStack
                        width={44}
                        height={44}
                        borderRadius={22}
                        backgroundColor={Colors[scheme].muted as any}
                        borderWidth={2}
                        borderColor={Colors[scheme].border as any}
                        items='center'
                        justify='center'
                      >
                        <Text
                          fontWeight='800'
                          fontSize='$5'
                          color={Colors[scheme].mutedForeground as any}
                        >
                          {initial}
                        </Text>
                      </YStack>
                      <YStack flex={1} gap='$0.5'>
                        <Text fontWeight='700' fontSize='$4' color='$color'>
                          {item.title}
                        </Text>
                        <XStack gap='$1' items='center'>
                          <Clock
                            size={12}
                            color={Colors[scheme].mutedForeground as any}
                          />
                          <Text
                            fontSize='$2'
                            color={Colors[scheme].mutedForeground as any}
                          >
                            Awaiting response
                          </Text>
                        </XStack>
                      </YStack>
                      <YStack
                        backgroundColor={Colors[scheme].muted as any}
                        borderRadius='$10'
                        px='$2'
                        py='$1'
                      >
                        <Text
                          fontSize='$1'
                          fontWeight='700'
                          color={Colors[scheme].mutedForeground as any}
                        >
                          PENDING
                        </Text>
                      </YStack>
                    </XStack>
                  </Card>
                );
              }

              // Following / Follower
              return (
                <Card
                  borderRadius='$4'
                  borderWidth={2}
                  borderColor={Colors[scheme].border as any}
                  bg={Colors[scheme].background as any}
                  elevate
                  padding='$3'
                  pressStyle={{ opacity: 0.85, scale: 0.98 }}
                  animation='quick'
                  onPress={() => setRemovePalAlertDialogPalId(item.id)}
                >
                  <XStack gap='$3' items='center'>
                    <YStack
                      width={44}
                      height={44}
                      borderRadius={22}
                      backgroundColor={Colors[scheme].primary as any}
                      items='center'
                      justify='center'
                    >
                      <Text
                        fontWeight='800'
                        fontSize='$5'
                        color={Colors[scheme].primaryForeground as any}
                      >
                        {initial}
                      </Text>
                    </YStack>
                    <YStack flex={1} gap='$0.5'>
                      <Text fontWeight='700' fontSize='$4' color='$color'>
                        {item.title}
                      </Text>
                      {item.section === 'following' && item.followsYou && (
                        <Text
                          fontSize='$2'
                          color={Colors[scheme].mutedForeground as any}
                        >
                          Mutual pals 💩
                        </Text>
                      )}
                    </YStack>
                    <ChevronRight
                      size={18}
                      color={Colors[scheme].mutedForeground as any}
                    />
                  </XStack>
                </Card>
              );
            }}
          />
        )}
      </YStack>

      <CancelRequestAlertDialog
        open={!!cancelRequestAlertDialogPalId}
        onClose={() => setCancelRequestAlertDialogPalId(null)}
        onAccept={() =>
          handleCancelFollowRequest(cancelRequestAlertDialogPalId ?? '')
        }
      />
      <RemovePalAlertDialog
        open={!!removePalAlertDialogPalId}
        onClose={() => setRemovePalAlertDialogPalId(null)}
        onAccept={() => handleRemovePoopPal(removePalAlertDialogPalId ?? '')}
      />
    </YStack>
  );
}

const CancelRequestAlertDialog = ({
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
            <AlertDialog.Title>Cancel Request</AlertDialog.Title>
            <AlertDialog.Description>
              Would you like to cancel this pending follow request?
            </AlertDialog.Description>

            <XStack gap='$3' justify='flex-end'>
              <AlertDialog.Cancel asChild>
                <Button onPress={onClose}>Keep</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  theme='accent'
                  onPress={() => {
                    onAccept().then(onClose);
                  }}
                >
                  Cancel Request
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
