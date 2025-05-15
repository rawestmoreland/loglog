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
  alert(errorMessage);
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
}>({
  expoPushToken: '',
  notification: undefined,
  setNotification: () => {},
  sendNotification: async () => {},
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
    if (!pooProfile?.id || !pb) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted' && !expoPushToken) {
      const token = await registerForPushNotificationsAsync(pb, pooProfile.id);
      setExpoPushToken(token ?? '');
    }
  };

  useEffect(() => {
    if (!pooProfile?.id || hasRegistered.current || !pb) return;

    hasRegistered.current = true;

    // Initial registration attempt
    registerForPushNotificationsAsync(pb, pooProfile?.id)
      .then((token) => setExpoPushToken(token ?? ''))
      .catch((error: any) => setExpoPushToken(`${error}`));

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

    console.log('POOPROFILE', pooProfile);

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
