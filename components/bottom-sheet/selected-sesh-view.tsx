import { RoundButton } from '@/components/ui/round-button';
import { SheetContentProps, SheetType } from '@/constants/sheet';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { useSesh } from '@/context/seshContext';
import { usePoopComments } from '@/hooks/api/usePoopCommentsQueries';
import { useFollowing, useMyFollowers } from '@/hooks/api/usePoopPalsQueries';
import { bristolScoreToImage } from '@/lib/helpers';
import type { PoopComment } from '@/lib/types';
import { Plus, X } from '@tamagui/lucide-icons';
import { differenceInMinutes, format } from 'date-fns';
import { useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import {
  Button,
  Card,
  Image,
  Separator,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDurationMinutes(start: Date | null, end: Date | null) {
  if (!start || !end) return null;
  const minutes = differenceInMinutes(end, start);
  if (minutes < 1) return '< 1 min';
  if (minutes === 1) return '1 min';
  return `${minutes} mins`;
}

export function SelectedSeshView({
  modal = false,
  isPercent = false,
  innerOpen = false,
  setInnerOpen = () => {},
  setOpen = () => {},
  setSheetType,
  poopDetailsId = null,
  setPoopDetailsId,
}: SheetContentProps) {
  const scheme = useColorScheme() ?? 'light';
  const { selectedSesh, setSelectedSesh } = useSesh();
  const { user, pooProfile } = useAuth();

  const {
    nickname,
    startedAt,
    endedAt,
    durationLabel,
    revelations,
    bristolScore,
  } = useMemo(() => {
    const sesh: any = selectedSesh;

    const nickname =
      sesh?.expand?.poo_profile?.codeName ||
      sesh?.expand?.user?.codeName ||
      sesh?.expand?.user?.username ||
      sesh?.expand?.user?.name ||
      'Mystery Pooper';

    const startedAt = toDate(sesh?.started);
    const endedAt = toDate(sesh?.ended);
    const durationLabel = formatDurationMinutes(startedAt, endedAt);

    return {
      nickname,
      startedAt,
      endedAt,
      durationLabel,
      revelations: sesh?.revelations || '',
      bristolScore:
        typeof sesh?.bristol_score === 'number'
          ? sesh.bristol_score
          : undefined,
    };
  }, [selectedSesh]);

  const seshId = (selectedSesh as any)?.id as string | undefined;
  const seshOwnerProfileId =
    ((selectedSesh as any)?.poo_profile as string | undefined) ??
    ((selectedSesh as any)?.expand?.poo_profile?.id as string | undefined);

  const { data: following } = useFollowing({ enabled: !!seshOwnerProfileId });
  const { data: myFollowers } = useMyFollowers({
    enabled: !!seshOwnerProfileId,
  });

  const canComment = useMemo(() => {
    if (!user?.id || !pooProfile?.id || !seshOwnerProfileId) return false;
    if (seshOwnerProfileId === pooProfile.id) return true;

    const iFollowThem =
      following?.some((r) => (r as any)?.following === seshOwnerProfileId) ??
      false;
    const theyFollowMe =
      myFollowers?.some((r) => (r as any)?.follower === seshOwnerProfileId) ??
      false;

    return iFollowThem || theyFollowMe;
  }, [user?.id, pooProfile?.id, seshOwnerProfileId, following, myFollowers]);

  const {
    data: comments,
    isLoading: isLoadingComments,
    isError: isCommentsError,
  } = usePoopComments(seshId, { enabled: !!seshId });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} gap='$4' mb='$4'>
        <XStack justify='space-between' items='center'>
          <Text fontWeight='bold'>{`${nickname}'s Sesh`}</Text>
          <RoundButton
            icon={X}
            onPress={() => {
              setSelectedSesh(null);
              setSheetType?.(SheetType.HOME);
            }}
          />
        </XStack>

        {/* Fun banner */}
        <Card
          backgroundColor={Colors[scheme].primary as any}
          padding='$4'
          borderRadius='$4'
          elevate
        >
          <XStack items='center' justify='space-between'>
            <YStack gap='$1'>
              {bristolScore ? (
                <Image
                  source={bristolScoreToImage(bristolScore)}
                  height={28}
                  width={38}
                />
              ) : (
                <Text
                  fontSize='$8'
                  fontWeight='900'
                  color={Colors[scheme].primaryForeground as any}
                >
                  💩
                </Text>
              )}
              <Text
                fontSize='$2'
                fontWeight='700'
                opacity={0.85}
                color={Colors[scheme].primaryForeground as any}
              >
                SESSION SNAPSHOT
              </Text>
            </YStack>

            <YStack items='flex-end' gap='$1'>
              <Text
                fontSize='$6'
                fontWeight='900'
                color={Colors[scheme].primaryForeground as any}
              >
                {durationLabel ?? '—'}
              </Text>
              <Text
                fontSize='$1'
                fontWeight='700'
                opacity={0.85}
                color={Colors[scheme].primaryForeground as any}
              >
                TOTAL TIME
              </Text>
            </YStack>
          </XStack>
        </Card>

        {/* Time details */}
        <Card
          padding='$3.5'
          borderRadius='$4'
          borderWidth={2}
          borderColor={Colors[scheme].border as any}
          bg={Colors[scheme].background as any}
          elevate
        >
          <XStack justify='space-around' items='center'>
            <YStack items='center' gap='$1' flex={1}>
              <Text fontSize='$2' fontWeight='800'>
                Start
              </Text>
              <Text fontSize='$2' color='$color11'>
                {startedAt ? format(startedAt, 'dd/MM/yyyy h:mm a') : '—'}
              </Text>
            </YStack>
            <Separator
              vertical
              bg={Colors[scheme].border as any}
              opacity={0.6}
            />
            <YStack items='center' gap='$1' flex={1}>
              <Text fontSize='$2' fontWeight='800'>
                End
              </Text>
              <Text fontSize='$2' color='$color11'>
                {endedAt
                  ? format(endedAt, 'dd/MM/yyyy h:mm a')
                  : 'Still cookin’…'}
              </Text>
            </YStack>
          </XStack>
        </Card>

        {/* Revelations */}
        <YStack gap='$2'>
          <Text fontWeight='700'>Revelations</Text>
          <TextArea
            value={revelations}
            editable={false}
            placeholder='No revelations were recorded. Tragic.'
            size='$4'
            opacity={revelations ? 1 : 0.8}
          />
        </YStack>

        {/* Comments */}
        <Card
          padding='$3'
          borderRadius='$4'
          borderWidth={2}
          borderColor={Colors[scheme].border as any}
          bg={Colors[scheme].background as any}
        >
          <YStack gap='$3'>
            <XStack justify='space-between' items='center'>
              <YStack>
                <Text fontWeight='700'>Comments</Text>
                <Text fontSize='$2' color='$color11'>
                  {comments?.length ?? 0}{' '}
                  {comments?.length === 1 ? 'comment' : 'comments'}
                </Text>
              </YStack>
              {canComment && (
                <Button
                  variant='outlined'
                  size='$2'
                  icon={Plus}
                  onPress={() => setSheetType?.(SheetType.POOP_COMMENT)}
                >
                  Add
                </Button>
              )}
            </XStack>

            {isLoadingComments ? (
              <Text color='$color11'>Loading comments…</Text>
            ) : isCommentsError ? (
              <Text color='$red10'>Couldn’t load comments.</Text>
            ) : comments && comments.length > 0 ? (
              <YStack gap='$3'>
                {comments.map((c: PoopComment) => {
                  const author =
                    c.expand?.user?.codeName ||
                    c.expand?.user?.username ||
                    c.expand?.user?.name ||
                    'Unknown';
                  return (
                    <YStack key={c.id} gap='$1'>
                      <XStack justify='space-between' items='center'>
                        <Text fontWeight='800' fontSize='$2'>
                          {author}
                        </Text>
                        <Text fontSize='$1' color='$color11'>
                          {c.created
                            ? format(new Date(c.created), 'MMM d, h:mm a')
                            : ''}
                        </Text>
                      </XStack>
                      <Text fontSize='$3'>{c.content}</Text>
                      <Separator opacity={0.25} />
                    </YStack>
                  );
                })}
              </YStack>
            ) : (
              <Text color='$color11'>No comments yet.</Text>
            )}

            {!canComment ? (
              <Text color='$color11' fontSize='$2'>
                Only poop pals can comment.
              </Text>
            ) : null}
          </YStack>
        </Card>
      </YStack>
    </KeyboardAvoidingView>
  );
}
