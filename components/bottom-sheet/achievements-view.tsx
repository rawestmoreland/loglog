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
import { Pressable, useColorScheme } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

function AchievementBadge({ achievement }: { achievement: AchievementWithStatus }) {
  const scheme = useColorScheme() ?? 'light';
  const asset = getAchievementAsset(achievement.name);

  return (
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
          renderItem={({ item }) => <AchievementBadge achievement={item} />}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </YStack>
  );
}
