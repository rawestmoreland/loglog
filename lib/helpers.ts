import AsyncStorage from '@react-native-async-storage/async-storage';
import { toast } from 'burnt';
import Client from 'pocketbase';
// This is needed for the uuid library to work
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { getCityFromCoords } from './geo-helpers';
import { PoopSesh } from './types';

export const bristolScoreToImage = (score: number) => {
  switch (score) {
    case 0:
      return require('@/assets/bristol/1.webp');
    case 1:
      return require('@/assets/bristol/1.webp');
    case 2:
      return require('@/assets/bristol/2.webp');
    case 3:
      return require('@/assets/bristol/3.webp');
    case 4:
      return require('@/assets/bristol/4.webp');
    case 5:
      return require('@/assets/bristol/5.webp');
    case 6:
      return require('@/assets/bristol/6.webp');
    case 7:
      return require('@/assets/bristol/7.webp');
  }
};

export const startOfflineSession = async (
  sessionData: PoopSesh
): Promise<void> => {
  const session = {
    id: uuid(),
    ...sessionData,
  };
  const sessions = await AsyncStorage.getItem('offline-sessions');
  const poops = sessions ? JSON.parse(sessions) : [];

  poops.push(session);

  await AsyncStorage.setItem('offline-sessions', JSON.stringify(poops));
  toast({ title: 'Session stored offline', preset: 'done' });
};

export const getOfflineSessions = async (): Promise<PoopSesh[]> => {
  const sessions = await AsyncStorage.getItem('offline-sessions');
  const poops = sessions ? JSON.parse(sessions) : [];
  return poops;
};

export const updateOfflineSession = async (
  seesionId: string,
  sessionData: Partial<PoopSesh>
): Promise<void> => {
  const sessions = await AsyncStorage.getItem('offline-sessions');
  let poops = sessions ? JSON.parse(sessions) : [];
  const session: PoopSesh | undefined = poops.find(
    (p: PoopSesh) => p.id === seesionId
  );
  if (session) {
    const updatedSession = {
      ...session,
      ...sessionData,
    };
    const newPoops = poops.map((p: PoopSesh) =>
      p.id === seesionId ? updatedSession : p
    );
    await AsyncStorage.setItem('offline-sessions', JSON.stringify(newPoops));
  } else {
    return;
  }
};

export const deleteOfflineSession = async (id: string) => {
  const sessions = await getOfflineSessions();
  const newSessions = sessions.filter((session) => session.id !== id);
  await AsyncStorage.setItem('offline-sessions', JSON.stringify(newSessions));
};

export const syncOfflineSessions = async (
  pb: Client,
  user: string,
  pooProfile: string
): Promise<{ syncedCount: number; failedCount: number }> => {
  const sessions = await getOfflineSessions();
  if (sessions?.length > 0) {
    toast({ title: `Syncing ${sessions.length} sessions...` });
    // Build an array of promises
    const promises = sessions.map(async (session) => {
      // Remove the id from the session
      const { id, ...sessionData } = session;
      let city;
      if (
        sessionData.location?.coordinates?.lat &&
        sessionData.location?.coordinates?.lon
      ) {
        city = await getCityFromCoords({
          latitude: sessionData.location?.coordinates?.lat ?? 0,
          longitude: sessionData.location?.coordinates?.lon ?? 0,
        });
        if (city) {
          sessionData.location = {
            ...sessionData.location,
            city,
          };
        }
      }
      return pb
        .collection('poop_seshes')
        .create({
          ...sessionData,
          user,
          poo_profile: pooProfile,
        })
        .then(async () => {
          if (id) {
            await deleteOfflineSession(id);
            console.log('offline session deleted', id);
          }
        })
        .catch((_e: any) => console.log('error syncing offline session', _e));
    });
    let syncedCount = 0;
    let failedCount = 0;
    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        syncedCount++;
      } else {
        failedCount++;
      }
    });
    console.log('syncedCount', syncedCount);
    console.log('failedCount', failedCount);
    if (syncedCount > 0) {
      toast({ title: `Synced ${syncedCount} sessions` });
    }
    if (failedCount > 0) {
      toast({ title: `Failed to sync ${failedCount} sessions` });
    }
    return { syncedCount, failedCount };
  } else {
    return { syncedCount: 0, failedCount: 0 };
  }
};
