import { zodResolver } from '@hookform/resolvers/zod';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { z } from 'zod';

import { useLocation } from '@/context/locationContext';
import { useNetwork } from '@/context/networkContext';
import { useNotification } from '@/context/notificationContext';
import { isValidLocation } from '@/lib/location-helpers';

import {
  useDeletePoop,
  useStartPoopSesh,
  useUpdatePoopSesh,
} from '@/hooks/api/usePoopSeshMutations';
import { useActivePoopSesh } from '@/hooks/api/usePoopSeshQueries';
import {
  deleteOfflineSession,
  startOfflineSession,
  updateOfflineSession,
} from '@/lib/helpers';
import { PoopSesh } from '@/lib/types';
import { toast } from 'burnt';
import { v4 as uuid } from 'uuid';

export const SeshContext = createContext<{
  activeSesh: PoopSesh | null | undefined;
  selectedSesh: PoopSesh | null | undefined;
  setSelectedSesh: (sesh: PoopSesh | null) => void;
  isLoadingActiveSesh: boolean;
  startSesh: () => Promise<void>;
  endSesh: () => Promise<void>;
  cancelActiveSesh: () => Promise<void>;
  poopForm: any;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
  isSeshPending: boolean;
}>({
  activeSesh: null,
  selectedSesh: null,
  setSelectedSesh: () => {},
  isLoadingActiveSesh: false,
  startSesh: () => Promise.resolve(),
  endSesh: () => Promise.resolve(),
  cancelActiveSesh: () => Promise.resolve(),
  poopForm: {},
  updateActiveSesh: () => Promise.resolve(),
  isSeshPending: false,
});

export const SeshContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const startSeshMutation = useStartPoopSesh();
  const updateSeshMutation = useUpdatePoopSesh();
  const deleteSeshMutation = useDeletePoop();
  const {
    data: activeSesh,
    isLoading: isLoadingActiveSesh,
    refetch: refetchActiveSesh,
  } = useActivePoopSesh();

  const { scheduleNotification, cancelNotification } = useNotification();

  const [selectedSesh, setSelectedSesh] = useState<PoopSesh | null>(null);

  const poopFormSchema = z.object({
    revelations: z.string().max(160).optional(),
    bristol_score: z.number().min(0).max(7).optional(),
  });

  const poopForm = useForm<z.infer<typeof poopFormSchema>>({
    resolver: zodResolver(poopFormSchema),
    defaultValues: {
      revelations: '',
      bristol_score: 0,
    },
  });

  const { userLocation, setUserLocation } = useLocation();
  const { isConnected, isNetworkInitialized } = useNetwork();

  const startSesh = useCallback(async () => {
    // Check if location is valid
    if (!isValidLocation(userLocation)) {
      Alert.alert(
        'Location Unavailable',
        "We couldn't get your location. Are you on an airplane?",
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Try Again',
            onPress: async () => {
              try {
                const { status } =
                  await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                  const location = await Location.getCurrentPositionAsync();
                  setUserLocation({
                    lat: location.coords.latitude,
                    lon: location.coords.longitude,
                  });
                  // Retry starting session after getting location
                  startSesh();
                } else {
                  Alert.alert(
                    'Permission Denied',
                    'Location permission is required to track your poop session'
                  );
                }
              } catch (error) {
                console.error('Failed to get location:', error);
                Alert.alert('Failed to get location');
              }
            },
          },
          {
            text: "I'm on an Airplane",
            onPress: async () => {
              const session: PoopSesh = {
                id: uuid(),
                is_public: true,
                is_airplane: true,
                bristol_score: 0,
                started: new Date(),
                company_time: false,
              };
              try {
                if (!isConnected) {
                  // Store session in async storage
                  await startOfflineSession(session);
                  await refetchActiveSesh();
                } else {
                  // Create airplane session without location
                  await startSeshMutation.mutateAsync(session);
                }

                const sendAt = new Date(Date.now() + 1000 * 60 * 10);
                console.log('About to schedule notification for:', sendAt);

                if (isConnected) {
                  try {
                    const notificationId = await scheduleNotification({
                      identifier: 'poop-sesh-started',
                      sendAt,
                      title: 'Are you ok?',
                      body: "You've been sitting there for a while. Are you ok?",
                    });
                    console.log(
                      'Notification scheduled successfully with ID:',
                      notificationId
                    );
                  } catch (notificationError) {
                    console.error(
                      'Failed to schedule notification:',
                      notificationError
                    );
                  }
                }
              } catch (error) {
                if (error instanceof Error && error.message === 'rate-limit') {
                  Alert.alert(
                    'You can only make one poop sesh every 5 minutes'
                  );
                } else {
                  console.error(error);
                  Alert.alert('We had trouble starting the poop sesh');
                }
              }
            },
          },
        ]
      );
      return;
    }

    // Normal session with valid location
    try {
      if (!isConnected) {
        await startOfflineSession({
          is_public: true,
          location: {
            coordinates: {
              lat: userLocation.lat,
              lon: userLocation.lon,
            },
          },
          coords: {
            lat: userLocation.lat,
            lon: userLocation.lon,
          },
          bristol_score: 0,
          started: new Date(),
          company_time: false,
        });
        await refetchActiveSesh();
        return;
      }
      await startSeshMutation.mutateAsync({
        is_public: true,
        location: {
          coordinates: {
            lat: userLocation.lat,
            lon: userLocation.lon,
          },
        },
        coords: {
          lat: userLocation.lat,
          lon: userLocation.lon,
        },
        bristol_score: 0,
        started: new Date(),
        company_time: false,
      });

      const sendAt = new Date(Date.now() + 1000 * 60 * 10);

      console.log('About to schedule notification for:', sendAt);

      // Schedule a notification for 10 minutes from now
      try {
        const notificationId = await scheduleNotification({
          identifier: 'poop-sesh-started',
          sendAt,
          title: 'Are you ok?',
          body: "You've been sitting there for a while. Are you ok?",
        });
        console.log(
          'Notification scheduled successfully with ID:',
          notificationId
        );
      } catch (notificationError) {
        console.error('Failed to schedule notification:', notificationError);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'rate-limit') {
        Alert.alert('You can only make one poop sesh every 5 minutes');
      } else {
        console.error(error);
        Alert.alert('We had trouble starting the poop sesh');
      }
    }
  }, [startSeshMutation, userLocation, setUserLocation, scheduleNotification]);

  const updateActiveSesh = useCallback(
    async (payload: Partial<PoopSesh>) => {
      if (!activeSesh) return;

      try {
        if (!isConnected) {
          // Get the sessions from async storage
          await updateOfflineSession(activeSesh.id!, payload);
        } else {
          await updateSeshMutation.mutateAsync({
            poopSesh: {
              ...activeSesh,
              ...payload,
            },
          });
        }
      } catch (error) {
        console.error(error);
        Alert.alert('We had trouble updating the poop sesh');
      }
    },
    [activeSesh, updateSeshMutation]
  );

  const endSesh = useCallback(async () => {
    if (!activeSesh) return;

    if (!isConnected) {
      await updateOfflineSession(activeSesh.id!, {
        revelations: poopForm.getValues('revelations'),
        bristol_score: poopForm.getValues('bristol_score'),
        ended: new Date(),
      });
      return;
    }

    try {
      await updateSeshMutation.mutateAsync({
        poopSesh: {
          ...activeSesh,
          revelations: poopForm.getValues('revelations'),
          bristol_score: poopForm.getValues('bristol_score'),
          ended: new Date(),
        },
      });

      await cancelNotification({ identifier: 'poop-sesh-started' });
    } catch (error) {
      console.error(error);
      Alert.alert('We had trouble ending the poop sesh');
    }
  }, [activeSesh, updateSeshMutation, cancelNotification, poopForm]);

  const cancelActiveSesh = useCallback(async () => {
    if (!isNetworkInitialized || !activeSesh) return;

    try {
      if (isConnected === false) {
        await deleteOfflineSession(activeSesh.id!);
        await refetchActiveSesh();
        toast({
          title: 'Success',
          preset: 'done',
          message: 'Poop sesh canceled successfully',
        });
      } else {
        await deleteSeshMutation.mutateAsync({ poopId: activeSesh.id! });
        toast({
          title: 'Success',
          preset: 'done',
          message: 'Poop sesh canceled successfully',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        preset: 'error',
        message: 'We had trouble canceling the poop sesh',
      });
    } finally {
      await cancelNotification({ identifier: 'poop-sesh-started' });
    }
  }, [
    isNetworkInitialized,
    activeSesh,
    isConnected,
    refetchActiveSesh,
    deleteSeshMutation,
    cancelNotification,
  ]);

  const contextValue = useMemo(
    () => ({
      activeSesh,
      isLoadingActiveSesh,
      startSesh,
      endSesh,
      cancelActiveSesh,
      poopForm,
      updateActiveSesh,
      selectedSesh,
      setSelectedSesh,
      isSeshPending:
        startSeshMutation.isPending || updateSeshMutation.isPending,
    }),
    [
      activeSesh,
      isLoadingActiveSesh,
      startSesh,
      endSesh,
      cancelActiveSesh,
      poopForm,
      updateActiveSesh,
      selectedSesh,
      setSelectedSesh,
      startSeshMutation.isPending,
      updateSeshMutation.isPending,
    ]
  );

  return (
    <SeshContext.Provider value={contextValue}>{children}</SeshContext.Provider>
  );
};

export const useSesh = () => {
  const context = useContext(SeshContext);
  if (!context) {
    throw new Error('useSesh must be used within a SeshContextProvider');
  }
  return context;
};
