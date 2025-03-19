import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '~/context/authContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { PoopSesh } from '~/lib/types';

export function useStartPoopSesh() {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (poopSesh: PoopSesh): Promise<PoopSesh> => {
      const sesh = await pb?.collection('poop_seshes').create({
        ...poopSesh,
        user: user?.id,
        started: new Date(),
      });

      return {
        id: sesh?.id!,
        location: sesh?.location,
        started: sesh?.started,
        ended: sesh?.ended,
        revelations: sesh?.revelations,
        user: sesh?.user,
        is_public: sesh?.is_public,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-poop-sesh'] });
    },
  });
}

export function useUpdatePoopSesh() {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poopSesh }: { poopSesh: PoopSesh }) => {
      const sesh = await pb?.collection('poop_seshes').update(poopSesh.id!, poopSesh);

      return {
        id: sesh?.id!,
        location: sesh?.location,
        started: sesh?.started,
        ended: sesh?.ended,
        revelations: sesh?.revelations,
        user: sesh?.user,
        is_public: sesh?.is_public,
      };
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['active-poop-sesh'] });
      queryClient.invalidateQueries({ queryKey: ['poop-sesh-history'] });
    },
  });
}

export function useDeletePoop() {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ poopId }: { poopId: string }) => {
      try {
        await pb?.collection('poop_seshes').delete(poopId);
      } catch (error) {
        console.error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poop-sesh-history'] });
    },
  });
}
