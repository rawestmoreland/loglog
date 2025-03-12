import { zodResolver } from '@hookform/resolvers/zod';
import { createContext, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useLocation } from './locationContext';

import { useStartPoopSesh, useUpdatePoopSesh } from '~/hooks/api/usePoopSeshMutations';
import { useActivePoopSesh } from '~/hooks/api/usePoopSeshQueries';
import { PoopSesh } from '~/lib/types';

export const SeshContext = createContext<{
  activeSesh: PoopSesh | null | undefined;
  isLoadingActiveSesh: boolean;
  startSesh: () => Promise<void>;
  endSesh: () => Promise<void>;
  poopForm: any;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
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
  },
  isLoadingActiveSesh: false,
  startSesh: () => Promise.resolve(),
  endSesh: () => Promise.resolve(),
  poopForm: {},
  updateActiveSesh: () => Promise.resolve(),
});

export const SeshContextProvider = ({ children }: { children: React.ReactNode }) => {
  const startSeshMutation = useStartPoopSesh();
  const updateSeshMutation = useUpdatePoopSesh();
  const { data: activeSesh, isLoading: isLoadingActiveSesh } = useActivePoopSesh();

  const poopFormSchema = z.object({
    revelations: z.string().max(160).optional(),
  });

  const poopForm = useForm<z.infer<typeof poopFormSchema>>({
    resolver: zodResolver(poopFormSchema),
    defaultValues: {
      revelations: '',
    },
  });

  const { userLocation } = useLocation();

  const startSesh = async () => {
    try {
      await startSeshMutation.mutateAsync({
        is_public: false,
        location: {
          coordinates: {
            lat: userLocation.lat,
            lon: userLocation.lon,
          },
        },
        started: new Date(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const updateActiveSesh = async (payload: Partial<PoopSesh>) => {
    if (!activeSesh) return;

    console.log(payload);

    await updateSeshMutation.mutateAsync({
      poopSesh: {
        ...activeSesh,
        ...payload,
      },
    });
  };

  const endSesh = async () => {
    if (!activeSesh) return;

    try {
      await updateSeshMutation.mutateAsync({
        poopSesh: {
          ...activeSesh,
          revelations: poopForm.getValues('revelations'),
          ended: new Date(),
        },
      });
    } catch (error) {
      console.error(error);
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
