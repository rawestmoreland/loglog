import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/authContext';
import { useNotification } from '@/context/notificationContext';
import { useUpdatePooProfile } from '@/hooks/api/usePooProfileMutations';
import { usePooProfile } from '@/hooks/api/usePooProfileQueries';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { AlertTriangle, Bell, BellOff, Shield } from '@tamagui/lucide-icons';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  Label,
  Separator,
  Switch,
  Text,
  XStack,
  YStack,
} from 'tamagui';

export default function SettingsPage() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const { pb } = usePocketBase();

  const { signOut } = useAuth();
  const { expoPushToken } = useNotification();

  const { pooProfile } = useAuth();
  const updatePooProfile = useUpdatePooProfile();
  const { refetch: refetchPooProfile } = usePooProfile();

  const [notificationStatus, setNotificationStatus] = useState<
    'granted' | 'denied' | 'undetermined'
  >('undetermined');

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationStatus(status);
  };

  const openNotificationSettings = () => {
    Linking.openSettings();
  };

  const handleShiftLogsChange = async (value: boolean) => {
    try {
      await updatePooProfile.mutateAsync({
        id: pooProfile?.id,
        shift_logs: value,
      });
      refetchPooProfile();
    } catch {
      Alert.alert('Error', 'Failed to update poop profile');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await pb?.send('/api/delete-account', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pb?.authStore.token}`,
        },
      });
      signOut();
    } catch {
      Alert.alert('Error', 'Failed to delete account');
    }
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: Colors[scheme].background as any,
      }}
      contentContainerStyle={{
        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 16 : 16,
      }}
    >
      <YStack gap='$4' p='$4'>
        {/* Header */}
        <YStack gap='$2'>
          <Text fontSize='$8' fontWeight='800' color='$color'>
            Settings ⚙️
          </Text>
          <Text fontSize='$3' color='$color11' fontWeight='500'>
            Manage your preferences and account
          </Text>
        </YStack>

        {/* Notifications Section */}
        <YStack gap='$3'>
          <XStack items='center' gap='$2'>
            {notificationStatus === 'granted' ? (
              <Bell size={20} color={Colors[scheme].primary as any} />
            ) : (
              <BellOff size={20} color='#ef4444' />
            )}
            <Text fontSize='$6' fontWeight='700' color='$color'>
              Notifications
            </Text>
          </XStack>

          <Card
            backgroundColor={Colors[scheme].background as any}
            padding='$4'
            borderRadius='$4'
            borderWidth={2}
            borderColor={Colors[scheme].border as any}
            elevate
          >
            <YStack gap='$3'>
              <XStack justify='space-between' items='center'>
                <YStack flex={1} gap='$2'>
                  <Text fontSize='$4' fontWeight='600' color='$color'>
                    {notificationStatus === 'granted'
                      ? 'Notifications Enabled'
                      : 'Notifications Disabled'}
                  </Text>
                  <Text fontSize='$3' color='$color11' lineHeight={20}>
                    {notificationStatus === 'granted'
                      ? 'You will receive notifications about poop pal activities'
                      : 'Enable notifications to stay updated on poop pal activities'}
                  </Text>
                </YStack>
                {notificationStatus === 'granted' ? (
                  <Bell size={24} color={Colors[scheme].primary as any} />
                ) : (
                  <BellOff size={24} color='#ef4444' />
                )}
              </XStack>

              {notificationStatus !== 'granted' && (
                <Button
                  size='$4'
                  bg={Colors[scheme].primary as any}
                  color={Colors[scheme].primaryForeground as any}
                  fontWeight='700'
                  pressStyle={{ opacity: 0.8, scale: 0.98 }}
                  onPress={openNotificationSettings}
                >
                  Open Settings
                </Button>
              )}

              {notificationStatus === 'granted' && expoPushToken && (
                <XStack p='$2' bg='$color3' items='center' gap='$2'>
                  <Text fontSize='$1' color='$color11' opacity={0.6}>
                    ✓ Push notifications configured
                  </Text>
                </XStack>
              )}
            </YStack>
          </Card>
        </YStack>

        <Separator borderColor={Colors[scheme].border as any} />

        {/* Privacy Section */}
        <YStack gap='$3'>
          <XStack items='center' gap='$2'>
            <Shield size={20} color={Colors[scheme].primary as any} />
            <Text fontSize='$6' fontWeight='700' color='$color'>
              Privacy
            </Text>
          </XStack>

          <Card
            backgroundColor={Colors[scheme].background as any}
            padding='$4'
            borderRadius='$4'
            borderWidth={2}
            borderColor={Colors[scheme].border as any}
            elevate
          >
            <XStack justify='space-between' items='center' gap='$3'>
              <YStack flex={1} gap='$2'>
                <Label
                  htmlFor='shift-logs-switch'
                  fontSize='$4'
                  fontWeight='600'
                  color='$color'
                >
                  Shift logs
                </Label>
                <Text fontSize='$3' color='$color11' lineHeight={20}>
                  Shift poop pins on the map to a random location to keep your
                  exact location private
                </Text>
              </YStack>
              <Switch
                id='shift-logs-switch'
                size='$4'
                defaultChecked={pooProfile?.shift_logs ?? false}
                onCheckedChange={(checked) => handleShiftLogsChange(checked)}
                disabled={updatePooProfile.isPending}
              >
                <Switch.Thumb animation='quicker' />
              </Switch>
            </XStack>
          </Card>
        </YStack>

        <Separator borderColor={Colors[scheme].border as any} />

        {/* Danger Zone Section */}
        <YStack gap='$3'>
          <XStack items='center' gap='$2'>
            <AlertTriangle size={20} color='#ef4444' />
            <Text fontSize='$6' fontWeight='700' color='#ef4444'>
              Danger Zone
            </Text>
          </XStack>

          <Card
            backgroundColor='#fef2f2'
            padding='$4'
            borderRadius='$4'
            borderWidth={2}
            borderColor='#fecaca'
            elevate
          >
            <YStack gap='$3'>
              <YStack gap='$2'>
                <Text fontSize='$4' fontWeight='600' color='#991b1b'>
                  Delete Account
                </Text>
                <Text fontSize='$3' color='#7f1d1d' lineHeight={20}>
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </Text>
              </YStack>
              <DeleteAccountButton handleDeleteAccount={handleDeleteAccount} />
            </YStack>
          </Card>
        </YStack>

        {/* App Info */}
        <Card
          backgroundColor={Colors[scheme].primary as any}
          padding='$3'
          borderRadius='$4'
          elevate
          marginTop='$4'
        >
          <YStack items='center' gap='$1'>
            <Text
              fontSize='$2'
              color={Colors[scheme].primaryForeground as any}
              opacity={0.8}
              fontWeight='600'
            >
              LOGLOG APP
            </Text>
            <Text
              fontSize='$1'
              color={Colors[scheme].primaryForeground as any}
              opacity={0.6}
            >
              Track your bathroom adventures
            </Text>
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}

const DeleteAccountButton = ({
  handleDeleteAccount,
}: {
  handleDeleteAccount: () => void;
}) => {
  return (
    <Button
      size='$4'
      bg='#dc2626'
      color='white'
      fontWeight='700'
      pressStyle={{ opacity: 0.8, scale: 0.98 }}
      onPress={() => {
        Alert.alert(
          'Delete Account',
          'Are you sure you want to delete your account? This action is irreversible. You will lose all your data and will not be able to recover it.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => handleDeleteAccount(),
            },
          ]
        );
      }}
    >
      Delete Account
    </Button>
  );
};
