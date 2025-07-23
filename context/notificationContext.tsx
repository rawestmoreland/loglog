import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { usePathname, useRouter } from 'expo-router';
import Client from 'pocketbase';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform, AppState } from 'react-native';

import { useAuth } from '~/context/authContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';

export enum NotificationTypeEnum {
  PoopSesh = 'poop_sesh',
}
export type NotificationType = NotificationTypeEnum.PoopSesh;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function sendPushNotification({
  pb,
  expoPushToken,
  title,
  body,
  pooProfile,
  notificationType,
  data,
}: {
  pb: Client;
  expoPushToken: string;
  title: string;
  body: string;
  pooProfile: { user: string; codeName: string };
  notificationType: NotificationType;
  data?: Record<string, any>;
}) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    throw new Error(`Error sending push notification: ${error}`);
  }
}

function handleRegistrationError(errorMessage: string) {
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync(pb: Client, pooProfileId: string) {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      // Remove the token from the user's profile
      await pb.collection('poo_profiles').update(pooProfileId, {
        expo_push_token: null,
      });
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      // Save the push token to the user's profile
      await pb.collection('poo_profiles').update(pooProfileId, {
        expo_push_token: pushTokenString,
      });

      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    // handleRegistrationError('Must use physical device for push notifications');
  }
}

export const NotificationContext = createContext<{
  expoPushToken: string;
  notification: Notifications.Notification | undefined;
  setNotification: (notification: Notifications.Notification | undefined) => void;
  sendNotification: ({
    pb,
    pooProfileId,
    title,
    body,
    notificationType,
    data,
  }: {
    pb: Client;
    pooProfileId: string;
    title: string;
    body: string;
    notificationType: NotificationType;
    data?: Record<string, any>;
  }) => Promise<void>;
  scheduleNotification: ({
    identifier,
    sendAt,
    title,
    body,
    data,
  }: {
    identifier: string;
    sendAt: Date;
    title: string;
    body: string;
    data?: Record<string, any>;
  }) => Promise<string>;
  cancelNotification: ({ identifier }: { identifier: string }) => Promise<void>;
}>({
  expoPushToken: '',
  notification: undefined,
  setNotification: () => {},
  sendNotification: async () => {},
  scheduleNotification: async () => '',
  cancelNotification: async () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { pooProfile } = useAuth();
  const { pb } = usePocketBase();
  const hasRegistered = useRef(false);

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(
    undefined
  );

  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  // Add this function to check permissions and register if granted
  const checkAndRegisterForNotifications = async () => {
    if (!pooProfile?.id || !pb) {
      console.log('📱 Cannot check notifications: pooProfile or pb missing');
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    console.log('📱 Current notification permission status:', status);
    console.log('📱 Current expoPushToken:', expoPushToken ? 'exists' : 'missing');

    if (status === 'granted' && !expoPushToken) {
      console.log('📱 Permissions granted but no token, registering...');
      const token = await registerForPushNotificationsAsync(pb, pooProfile.id);
      setExpoPushToken(token ?? '');
    } else if (status !== 'granted') {
      console.log('📱 Notification permissions not granted');
    } else {
      console.log('📱 Permissions granted and token already exists');
    }
  };

  useEffect(() => {
    if (!pooProfile?.id || hasRegistered.current || !pb) {
      console.log('📱 Skipping notification registration:', {
        pooProfileId: pooProfile?.id,
        hasRegistered: hasRegistered.current,
        pb: !!pb,
      });
      return;
    }

    console.log('📱 Starting initial notification registration for profile:', pooProfile.id);
    hasRegistered.current = true;

    // Initial registration attempt
    registerForPushNotificationsAsync(pb, pooProfile?.id)
      .then((token) => {
        console.log('📱 Initial registration success, token:', token ? 'received' : 'none');
        setExpoPushToken(token ?? '');
      })
      .catch((error: any) => {
        console.log('📱 Initial registration failed:', error);
        setExpoPushToken(`${error}`);
      });

    // Add foreground listener to check permissions when app becomes active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAndRegisterForNotifications();
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Don't show notifications if the user is in the chat screen
      if (pathname.includes('chat')) {
        return null;
      }

      setNotification(notification);

      updateBadgeCount();
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};

      resetBadgeCount();

      if (data.screen) {
        router.push(data.screen);
      }
    });

    return () => {
      subscription.remove();
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [pooProfile]);

  const handleScheduleNotification = async ({
    identifier,
    sendAt,
    title,
    body,
    data,
  }: {
    identifier: string;
    sendAt: Date;
    title: string;
    body: string;
    data?: Record<string, any>;
  }) => {
    console.log('🔔 handleScheduleNotification called with:', {
      identifier,
      sendAt,
      title,
      body,
      data,
    });

    // Check permissions for local notifications
    const { status } = await Notifications.getPermissionsAsync();
    console.log('🔔 Current notification permissions for scheduling:', status);

    if (status !== 'granted') {
      console.log('🔔 Requesting notification permissions...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      console.log('🔔 Permission request result:', newStatus);

      if (newStatus !== 'granted') {
        throw new Error('Notification permissions not granted');
      }
    }

    // Check existing scheduled notifications
    const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📋 Existing scheduled notifications:', existingNotifications.length);

    try {
      const id = await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title,
          body,
          data,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: sendAt,
        },
      });

      console.log('✅ Notification scheduled successfully with ID:', id);
      return id;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      throw error;
    }
  };

  const handleCancelNotification = async ({ identifier }: { identifier: string }) => {
    console.log('🚫 Cancelling notification with identifier:', identifier);
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('✅ Notification cancelled successfully');
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
      throw error;
    }
  };

  const handleSendNotification = async ({
    pb,
    pooProfileId,
    title,
    body,
    notificationType,
    data,
  }: {
    pb: Client;
    pooProfileId: string;
    title: string;
    body: string;
    notificationType: NotificationType;
    data?: Record<string, any>;
  }) => {
    const pooProfile = await pb
      .collection('poo_profiles')
      .getOne(pooProfileId)
      .catch((e) => console.error(e));

    if (!pooProfile) {
      throw new Error('Poo profile not found');
    }

    if (!pooProfile.expo_push_token) {
      throw new Error('Poo profile does not have an Expo push token');
    }

    await sendPushNotification({
      pb,
      expoPushToken: pooProfile.expo_push_token,
      title,
      body,
      pooProfile: {
        user: pooProfile.user,
        codeName: pooProfile.code_name,
      },
      notificationType,
      data,
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        setNotification,
        sendNotification: async ({
          pb,
          pooProfileId,
          title,
          body,
          notificationType,
          data,
        }: {
          pb: Client;
          pooProfileId: string;
          title: string;
          body: string;
          notificationType: NotificationType;
          data?: Record<string, any>;
        }) =>
          handleSendNotification({
            pb,
            pooProfileId,
            title,
            body,
            notificationType,
            data,
          }),
        scheduleNotification: async ({
          identifier,
          sendAt,
          title,
          body,
          data,
        }: {
          identifier: string;
          sendAt: Date;
          title: string;
          body: string;
          data?: Record<string, any>;
        }) => {
          console.log(
            '📨 scheduleNotification context method called, forwarding to handleScheduleNotification'
          );
          return handleScheduleNotification({ identifier, sendAt, title, body, data });
        },
        cancelNotification: async ({ identifier }: { identifier: string }) =>
          handleCancelNotification({ identifier }),
      }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);

  // Throw an error if not used in a NotificationProvider
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }

  return context;
};

export const resetBadgeCount = async () => {
  await Notifications.setBadgeCountAsync(0);
};

const updateBadgeCount = async () => {
  const currentBadge = await Notifications.getBadgeCountAsync();
  await Notifications.setBadgeCountAsync(currentBadge + 1);
};
