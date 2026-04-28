import { SheetContentProps, SheetType } from '@/constants/sheet';
import { Colors } from '@/constants/theme';
import {
  AchievementWithStatus,
  useAchievements,
} from '@/hooks/api/useAchievementsQueries';
import { getAchievementAsset } from '@/lib/achievementAssets';
import { FlashList } from '@shopify/flash-list';
import { Lock, X } from '@tamagui/lucide-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { Dialog, Text, XStack, YStack } from 'tamagui';

function BadgeDetailDialog({
  achievement,
  open,
  onClose,
}: {
  achievement: AchievementWithStatus | null;
  open: boolean;
  onClose: () => void;
}) {
  const scheme = useColorScheme() ?? 'light';

  if (!achievement) return null;

  const asset = getAchievementAsset(achievement.name);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          key='overlay'
          animation='quick'
          opacity={0.6}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key='content'
          animation={[
            'quick',
            { opacity: { overshootClamping: true } },
          ]}
          enterStyle={{ y: -10, opacity: 0, scale: 0.95 }}
          exitStyle={{ y: 10, opacity: 0, scale: 0.95 }}
          style={{ marginHorizontal: 24 }}
          bg={Colors[scheme].background as any}
          borderColor={Colors[scheme].border as any}
          borderWidth={1}
        >
          <YStack gap='$4' items='center' px='$2' py='$2'>
            {/* Close button */}
            <XStack width='100%' justify='flex-end'>
              <Dialog.Close asChild>
                <Pressable
                  aria-label='Close'
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    backgroundColor: Colors[scheme].primary as any,
                    padding: 8,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                  })}
                >
                  <X
                    size={14}
                    pointerEvents='none'
                    color={Colors[scheme].primaryForeground as any}
                  />
                </Pressable>
              </Dialog.Close>
            </XStack>

            {/* Badge image */}
            <YStack position='relative' items='center'>
              <Image
                source={asset}
                style={{
                  width: 150,
                  height: 150,
                  opacity: achievement.earned ? 1 : 0.2,
                }}
                contentFit='contain'
              />
              {!achievement.earned && (
                <YStack
                  position='absolute'
                  bottom={4}
                  right={4}
                  bg={Colors[scheme].background as any}
                  borderRadius={999}
                  padding={6}
                  borderWidth={1}
                  borderColor={Colors[scheme].border as any}
                >
                  <Lock size={18} color={Colors[scheme].foreground as any} />
                </YStack>
              )}
            </YStack>

            {/* Name */}
            <Dialog.Title asChild>
              <Text
                fontSize='$6'
                fontWeight='800'
                color={achievement.earned ? '$color' : '$color10'}
                textAlign='center'
              >
                {achievement.name}
              </Text>
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description asChild>
              <Text
                fontSize='$3'
                color={achievement.earned ? '$color11' : '$color9'}
                textAlign='center'
                lineHeight='$4'
              >
                {achievement.description}
              </Text>
            </Dialog.Description>

            {/* Locked label */}
            {!achievement.earned && (
              <XStack
                gap='$1'
                items='center'
                bg={Colors[scheme].muted as any}
                px='$3'
                py='$2'
                borderRadius='$4'
              >
                <Lock size={12} color={Colors[scheme].mutedForeground as any} />
                <Text fontSize='$2' color={Colors[scheme].mutedForeground as any} fontWeight='600'>
                  Not yet unlocked
                </Text>
              </XStack>
            )}
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}

function AchievementBadge({
  achievement,
  onPress,
}: {
  achievement: AchievementWithStatus;
  onPress: (achievement: AchievementWithStatus) => void;
}) {
  const scheme = useColorScheme() ?? 'light';
  const asset = getAchievementAsset(achievement.name);

  return (
    <Pressable
      onPress={() => onPress(achievement)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flex: 1 })}
    >
      <YStack items='center' gap='$1' px='$1' py='$2' flex={1}>
        <YStack position='relative'>
          <Image
            source={asset}
            style={{
              width: 90,
              height: 90,
              opacity: achievement.earned ? 1 : 0.2,
            }}
            contentFit='contain'
          />
          {!achievement.earned && (
            <YStack
              position='absolute'
              bottom={2}
              right={2}
              bg={Colors[scheme].background as any}
              borderRadius={999}
              padding={3}
              borderWidth={1}
              borderColor={Colors[scheme].border as any}
            >
              <Lock size={12} color={Colors[scheme].foreground as any} />
            </YStack>
          )}
        </YStack>
        <Text
          fontSize='$1'
          fontWeight='600'
          color={achievement.earned ? '$color' : '$color10'}
          textAlign='center'
          numberOfLines={2}
        >
          {achievement.name}
        </Text>
      </YStack>
    </Pressable>
  );
}

export function AchievementsView({
  modal = false,
  isPercent = false,
  innerOpen = false,
  setInnerOpen = () => {},
  setOpen = () => {},
  setSheetType,
}: SheetContentProps) {
  const scheme = useColorScheme() ?? 'light';
  const { data: achievements, isLoading } = useAchievements();
  const [selectedAchievement, setSelectedAchievement] =
    useState<AchievementWithStatus | null>(null);

  const earnedCount = achievements?.filter((a) => a.earned).length ?? 0;
  const total = achievements?.length ?? 0;

  return (
    <YStack flex={1} gap='$3'>
      {/* Header */}
      <XStack justify='space-between' items='center' px='$1'>
        <YStack gap='$1'>
          <Text fontSize='$7' fontWeight='800' color='$color'>
            Badges 🏆
          </Text>
          {!isLoading && total > 0 && (
            <Text fontSize='$2' color='$color11' fontWeight='500'>
              {earnedCount} / {total} unlocked
            </Text>
          )}
        </YStack>
        <Pressable
          aria-label='Close'
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
            backgroundColor: Colors[scheme].primary as any,
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 999,
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

      {/* Badge Grid */}
      {isLoading ? (
        <YStack flex={1} justify='center' items='center' gap='$3' py='$8'>
          <Text fontSize='$8' opacity={0.5}>
            🏆
          </Text>
          <Text fontSize='$5' fontWeight='600' color='$color11'>
            Loading...
          </Text>
        </YStack>
      ) : (
        <FlashList
          data={achievements ?? []}
          numColumns={3}
          estimatedItemSize={110}
          renderItem={({ item }) => (
            <AchievementBadge
              achievement={item}
              onPress={setSelectedAchievement}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Badge detail dialog */}
      <BadgeDetailDialog
        achievement={selectedAchievement}
        open={selectedAchievement !== null}
        onClose={() => setSelectedAchievement(null)}
      />
    </YStack>
  );
}
