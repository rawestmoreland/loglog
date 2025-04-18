import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '~/context/authContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { PoopSesh } from '~/lib/types';

export function useStartPoopSesh() {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();
  const { user, pooProfile } = useAuth();
  return useMutation({
    mutationFn: async (poopSesh: PoopSesh): Promise<PoopSesh> => {
      // Check for a sesh made within the last 5 minutes for rate limiting
      const lastSesh = await pb
        ?.collection('poop_seshes')
        .getFirstListItem(
          `poo_profile = "${pooProfile?.id}" && started >= "${new Date(Date.now() - 5 * 60 * 1000).toISOString().replace('T', ' ')}"`
        )
        .catch((e) => console.log('sesherror', e));

      if (lastSesh) {
        throw new Error('rate-limit');
      }

      const sesh = await pb?.collection('poop_seshes').create({
        ...poopSesh,
        user: user?.id,
        poo_profile: pooProfile?.id,
        started: new Date(),
      });

      return {
        id: sesh?.id!,
        location: sesh?.location,
        started: sesh?.started,
        ended: sesh?.ended,
        revelations: sesh?.revelations,
        user: sesh?.user,
        poo_profile: sesh?.poo_profile,
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
        poo_profile: sesh?.poo_profile,
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
