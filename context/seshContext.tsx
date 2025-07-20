import { zodResolver } from '@hookform/resolvers/zod';
import { createContext, useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { z } from 'zod';

import { useLocation } from './locationContext';
import { useNotification } from './notificationContext';

import { useStartPoopSesh, useUpdatePoopSesh } from '~/hooks/api/usePoopSeshMutations';
import { useActivePoopSesh } from '~/hooks/api/usePoopSeshQueries';
import { PoopSesh } from '~/lib/types';

export const SeshContext = createContext<{
  activeSesh: PoopSesh | null | undefined;
  selectedSesh: PoopSesh | null | undefined;
  setSelectedSesh: (sesh: PoopSesh | null) => void;
  isLoadingActiveSesh: boolean;
  startSesh: () => Promise<void>;
  endSesh: () => Promise<void>;
  poopForm: any;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
  isSeshPending: boolean;
}>({
  activeSesh: {
    is_public: false,
    location: {
      coordinates: {
        lat: 0,
        lon: 0,
      },
    },
    started: new Date(),
    company_time: false,
  },
  selectedSesh: null,
  setSelectedSesh: () => {},
  isLoadingActiveSesh: false,
  startSesh: () => Promise.resolve(),
  endSesh: () => Promise.resolve(),
  poopForm: {},
  updateActiveSesh: () => Promise.resolve(),
  isSeshPending: false,
});

export const SeshContextProvider = ({ children }: { children: React.ReactNode }) => {
  const startSeshMutation = useStartPoopSesh();
  const updateSeshMutation = useUpdatePoopSesh();
  const { data: activeSesh, isLoading: isLoadingActiveSesh } = useActivePoopSesh();

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

  const { userLocation } = useLocation();

  const startSesh = async () => {
    try {
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

      // Schedule a notification for 10 minutes from now
      await scheduleNotification({
        identifier: 'poop-sesh-started',
        sendAt: new Date(Date.now() + 1000 * 60 * 10),
        title: 'Are you ok?',
        body: "You've been sitting there for a while. Are you ok?",
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'rate-limit') {
        Alert.alert('You can only make one poop sesh every 5 minutes');
      } else {
        console.error(error);
        Alert.alert('We had trouble starting the poop sesh');
      }
    }
  };

  const updateActiveSesh = async (payload: Partial<PoopSesh>) => {
    if (!activeSesh) return;

    try {
      await updateSeshMutation.mutateAsync({
        poopSesh: {
          ...activeSesh,
          ...payload,
        },
      });
    } catch (error) {
      console.error(error);
      Alert.alert('We had trouble updating the poop sesh');
    }
  };

  const endSesh = async () => {
    if (!activeSesh) return;

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
  };

  return (
    <SeshContext.Provider
      value={{
        activeSesh,
        isLoadingActiveSesh,
        startSesh,
        endSesh,
        poopForm,
        updateActiveSesh,
        selectedSesh,
        setSelectedSesh,
        isSeshPending: startSeshMutation.isPending || updateSeshMutation.isPending,
      }}>
      {children}
    </SeshContext.Provider>
  );
};

export const useSesh = () => {
  const context = useContext(SeshContext);
  if (!context) {
    throw new Error('useSesh must be used within a SeshContextProvider');
  }
  return context;
};
