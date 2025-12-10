import { SheetContentProps, SheetType } from '@/constants/sheet';
import { Colors } from '@/constants/theme';
import { useMyPoopSeshHistory } from '@/hooks/api/usePoopSeshQueries';
import { bristolScoreToImage } from '@/lib/helpers';
import { FlashList } from '@shopify/flash-list';
import { Globe, Lock, X } from '@tamagui/lucide-icons';
import { differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { useMemo } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { Card, Image, Separator, Text, XStack, YStack } from 'tamagui';

const getBristolEmoji = (score?: number) => {
  if (!score) return '💩';
  const emojis = ['', '🥜', '🌭', '🍫', '🌊', '💧', '☕'];
  return emojis[score] || '💩';
};

const getSessionDuration = (started: Date | string, ended?: Date) => {
  if (!ended) return null;
  const minutes = differenceInMinutes(new Date(ended), new Date(started));
  if (minutes < 1) return '< 1 min';
  if (minutes === 1) return '1 min';
  return `${minutes} mins`;
};

export function PoopHistoryView({
  modal = false,
  isPercent = false,
  innerOpen = false,
  setInnerOpen = () => {},
  setOpen = () => {},
  setSheetType,
  poopDetailsId = null,
  setPoopDetailsId,
}: SheetContentProps) {
  const { data: poopHistory, isLoading } = useMyPoopSeshHistory();
  const scheme = useColorScheme() ?? 'light';

  const stats = useMemo(() => {
    if (!poopHistory?.length) return null;

    const total = poopHistory.length;
    const companyTime = poopHistory.filter((p) => p.company_time).length;
    const avgBristol =
      poopHistory
        .filter((p) => p.bristol_score)
        .reduce((acc, p) => acc + (p.bristol_score || 0), 0) /
        poopHistory.filter((p) => p.bristol_score).length || 0;

    return { total, companyTime, avgBristol };
  }, [poopHistory]);

  return (
    <YStack flex={1} gap='$4' mb='$4'>
      {/* Header */}
      <XStack justify='space-between' items='center'>
        <YStack gap='$1'>
          <Text fontSize='$7' fontWeight='800' color='$color'>
            The Log Book 📚
          </Text>
          {stats && (
            <Text fontSize='$2' color='$color11' fontWeight='500'>
              {stats.total} sessions · {stats.companyTime} on company time
            </Text>
          )}
        </YStack>
        <Pressable
          aria-label='Close'
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
            scale: pressed ? 0.95 : 1,
            backgroundColor: Colors[scheme].primary as any,
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          })}
          onPress={() => setSheetType?.(SheetType.HOME)}
        >
          <X
            size={16}
            pointerEvents='none'
            color={Colors[scheme].primaryForeground as any}
          />
        </Pressable>
      </XStack>

      {/* Stats Banner */}
      {stats && stats.avgBristol > 0 && (
        <Card
          backgroundColor={Colors[scheme].primary as any}
          padding='$3'
          borderRadius='$4'
          elevate
        >
          <XStack justify='space-around' items='center'>
            <YStack items='center' gap='$1'>
              <Text
                fontSize='$6'
                fontWeight='800'
                color={Colors[scheme].primaryForeground as any}
              >
                {stats.total}
              </Text>
              <Text
                fontSize='$1'
                color={Colors[scheme].primaryForeground as any}
                opacity={0.8}
                fontWeight='600'
              >
                TOTAL LOGS
              </Text>
            </YStack>
            <Separator
              vertical
              bg={Colors[scheme].primaryForeground as any}
              opacity={0.2}
            />
            <YStack items='center' gap='$1'>
              <Text
                fontSize='$6'
                fontWeight='800'
                color={Colors[scheme].primaryForeground as any}
              >
                {stats.avgBristol.toFixed(1)}
              </Text>
              <Text
                fontSize='$1'
                color={Colors[scheme].primaryForeground as any}
                opacity={0.8}
                fontWeight='600'
              >
                AVG BRISTOL
              </Text>
            </YStack>
            <Separator
              vertical
              bg={Colors[scheme].primaryForeground as any}
              opacity={0.2}
            />
            <YStack items='center' gap='$1'>
              <Text
                fontSize='$6'
                fontWeight='800'
                color={Colors[scheme].primaryForeground as any}
              >
                {stats.companyTime}
              </Text>
              <Text
                fontSize='$1'
                color={Colors[scheme].primaryForeground as any}
                opacity={0.8}
                fontWeight='600'
              >
                PAID POOPS
              </Text>
            </YStack>
          </XStack>
        </Card>
      )}

      {/* History List */}
      {!poopHistory?.length ? (
        <YStack flex={1} justify='center' items='center' gap='$3' py='$8'>
          <Text fontSize='$8' opacity={0.5}>
            💩
          </Text>
          <Text fontSize='$5' fontWeight='600' color='$color11'>
            No logs yet
          </Text>
          <Text fontSize='$3' color='$color11' verticalAlign='center'>
            Start tracking your bathroom adventures!
          </Text>
        </YStack>
      ) : (
        <FlashList
          data={poopHistory}
          ItemSeparatorComponent={() => <YStack height={12} />}
          renderItem={({ item }) => {
            const duration = getSessionDuration(item.started, item.ended);
            const timeAgo = formatDistanceToNow(new Date(item.started), {
              addSuffix: true,
            });

            return (
              <Card
                pressStyle={{ opacity: 0.8, scale: 0.98 }}
                animation='quick'
                padding='$3.5'
                borderRadius='$4'
                borderWidth={2}
                borderColor={Colors[scheme].border as any}
                bg={Colors[scheme].background as any}
                elevate
                onPress={() => {
                  if (item.id) {
                    setSheetType?.(SheetType.POOP_DETAILS);
                    setPoopDetailsId?.(item.id);
                  }
                }}
              >
                <XStack justify='space-between' items='center'>
                  <XStack gap='$8' items='center'>
                    {item.bristol_score ? (
                      <Image
                        height={28}
                        width={38}
                        source={bristolScoreToImage(item.bristol_score)}
                      />
                    ) : (
                      <Text fontSize='$6' fontWeight='800'>
                        💩
                      </Text>
                    )}
                    <YStack gap='$2'>
                      <XStack items='center' gap='$1'>
                        {item.is_public ? (
                          <Globe size={14} />
                        ) : (
                          <Lock size={14} />
                        )}
                        <Text fontSize='$2' fontWeight='600'>
                          {`${item.is_public ? 'Public' : 'Private'} Session`}
                        </Text>
                      </XStack>
                      <Text fontSize='$2' fontWeight='600'>
                        {timeAgo}
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack items='center' gap='$1'>
                    <Text fontSize='$2' fontWeight='600'>
                      {duration}
                    </Text>
                  </XStack>
                </XStack>
              </Card>
            );
          }}
        />
      )}
    </YStack>
  );
}
