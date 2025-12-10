import { SheetContentProps, SheetType } from '@/constants/sheet';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { useTimeOnToilet } from '@/hooks/api/usePoopStats';
import { Cog, Users, X } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { Pressable, useColorScheme } from 'react-native';
import { Button, Card, Separator, Text, XStack, YStack } from 'tamagui';

export function UserSettingsView({
  modal = false,
  isPercent = false,
  innerOpen = false,
  setInnerOpen = () => {},
  setOpen = () => {},
  setSheetType,
  sheetType,
}: SheetContentProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const { data: timeOnToilet } = useTimeOnToilet({
    enabled: sheetType === SheetType.USER_SETTINGS,
  });

  return (
    <YStack gap='$4' mb='$4'>
      {/* Header */}
      <XStack justify='space-between' items='center'>
        <YStack gap='$1'>
          <Text fontSize='$7' fontWeight='800' color='$color'>
            Profile 👤
          </Text>
          <Text fontSize='$2' color='$color11' fontWeight='500'>
            Your poop tracking journey
          </Text>
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

      {/* Action Buttons */}
      <XStack gap='$3'>
        <Button
          flex={1}
          icon={Users}
          size='$4'
          borderWidth={2}
          borderColor={Colors[scheme].border as any}
          bg={Colors[scheme].background as any}
          pressStyle={{ opacity: 0.8, scale: 0.98 }}
          onPress={() => setSheetType?.(SheetType.POOP_PALS)}
        >
          <Text fontWeight='600'>Poo pals</Text>
        </Button>
        <Button
          flex={1}
          icon={Cog}
          size='$4'
          borderWidth={2}
          borderColor={Colors[scheme].border as any}
          bg={Colors[scheme].background as any}
          pressStyle={{ opacity: 0.8, scale: 0.98 }}
          onPress={() => router.push('/settings')}
        >
          <Text fontWeight='600'>Settings</Text>
        </Button>
      </XStack>

      {/* Stats Card */}
      <Card
        backgroundColor={Colors[scheme].primary as any}
        padding='$4'
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
              {timeOnToilet?.totalTime || '0m'}
            </Text>
            <Text
              fontSize='$1'
              color={Colors[scheme].primaryForeground as any}
              opacity={0.8}
              fontWeight='600'
            >
              TOTAL TIME
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
              {timeOnToilet?.count || 0}
            </Text>
            <Text
              fontSize='$1'
              color={Colors[scheme].primaryForeground as any}
              opacity={0.8}
              fontWeight='600'
            >
              TOTAL POOPS
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
              {timeOnToilet?.cityCount || 0}
            </Text>
            <Text
              fontSize='$1'
              color={Colors[scheme].primaryForeground as any}
              opacity={0.8}
              fontWeight='600'
            >
              CITIES
            </Text>
          </YStack>
        </XStack>
      </Card>

      {/* Company Time Card */}
      {timeOnToilet?.companyTime && (
        <Card
          backgroundColor={Colors[scheme].background as any}
          padding='$4'
          borderRadius='$4'
          borderWidth={2}
          borderColor={Colors[scheme].border as any}
          elevate
        >
          <YStack items='center' gap='$2'>
            <Text fontSize='$1' color='$color11' fontWeight='600'>
              PAID POOP TIME 💰
            </Text>
            <Text fontSize='$8' fontWeight='800' color='$color'>
              {timeOnToilet.companyTime}
            </Text>
            <Text fontSize='$2' color='$color11' verticalAlign='center'>
              Boss makes a dollar, I make a dime...
            </Text>
          </YStack>
        </Card>
      )}

      {/* Log Out Button */}
      <Button
        size='$5'
        theme='red'
        fontWeight='700'
        pressStyle={{ opacity: 0.8, scale: 0.98 }}
        onPress={signOut}
      >
        Log out
      </Button>
    </YStack>
  );
}
