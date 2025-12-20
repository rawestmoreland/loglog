import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/authContext';
import { useNetwork } from '@/context/networkContext';
import { getCityFromCoords } from '@/lib/geo-helpers';
import { getOfflineSessions } from '@/lib/helpers';
import { PoopSeshesResponse } from '@/lib/pocketbase-types';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { PoopSesh } from '@/lib/types';

export function useStartPoopSesh() {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();
  const { user, pooProfile } = useAuth();
  const { isConnected, isNetworkInitialized } = useNetwork();

  return useMutation({
    mutationFn: async (poopSesh: PoopSesh): Promise<PoopSesh> => {
      // Check for a sesh made within the last 5 minutes for rate limiting
      let shouldLimit = false;
      if (isConnected === false && isNetworkInitialized) {
        const offline = await getOfflineSessions();
        const lastOfflineSesh = offline
          .filter((s) => s.poo_profile === pooProfile?.id)
          .sort(
            (a, b) =>
              new Date(b.started).getTime() - new Date(a.started).getTime()
          )[0];
        if (
          lastOfflineSesh &&
          new Date(lastOfflineSesh.started).getTime() >
            new Date(Date.now() - 5 * 60 * 1000).getTime()
        ) {
          shouldLimit = true;
        }
      } else {
        const lastSesh = await pb
          ?.collection('poop_seshes')
          .getFirstListItem<PoopSeshesResponse>(
            `poo_profile = "${pooProfile?.id}" && started >= "${new Date(
              Date.now() - 5 * 60 * 1000
            )
              .toISOString()
              .replace('T', ' ')}"`
          )
          .catch((e) => {
            console.log('sesherror', e);
            return null;
          });

        if (lastSesh && !__DEV__) {
          shouldLimit = true;
        }
      }

      if (shouldLimit) {
        throw new Error('rate-limit');
      }

      // Skip geocoding for airplane sessions
      if (!poopSesh.is_airplane && poopSesh.location?.coordinates) {
        const city = await getCityFromCoords({
          latitude: poopSesh.location.coordinates.lat,
          longitude: poopSesh.location.coordinates.lon,
        });

        if (city && poopSesh.location) {
          poopSesh.location.city = city;
        }
      }

      const sesh = await pb?.collection('poop_seshes').create({
        ...poopSesh,
        user: user?.id,
        poo_profile: pooProfile?.id,
      });

      return {
        id: sesh?.id!,
        location: sesh?.location,
        coords: sesh?.coords,
        started: sesh?.started,
        ended: sesh?.ended,
        revelations: sesh?.revelations,
        user: sesh?.user,
        poo_profile: sesh?.poo_profile,
        is_public: sesh?.is_public,
        company_time: sesh?.company_time,
        bristol_score: sesh?.bristol_score,
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
      let sesh = await pb
        ?.collection('poop_seshes')
        .update(poopSesh.id!, poopSesh)
        .catch(() => {
          console.error('error updating poop sesh', poopSesh);
          return poopSesh;
        });

      if (!sesh) {
        sesh = poopSesh;
      }

      return {
        id: sesh.id,
        location: sesh.location,
        coords: sesh.coords,
        started: sesh.started,
        ended: sesh.ended,
        revelations: sesh.revelations,
        user: sesh.user,
        poo_profile: sesh.poo_profile,
        is_public: sesh.is_public,
        company_time: sesh.company_time,
        bristol_score: sesh.bristol_score,
      };
    },
    onSuccess: (sesh) => {
      queryClient.removeQueries({ queryKey: ['active-poop-sesh'] });
      queryClient.invalidateQueries({ queryKey: ['poop-sesh-history'] });
      queryClient.invalidateQueries({ queryKey: ['time-on-toilet'] });
      queryClient.invalidateQueries({
        queryKey: ['poop-sesh', { poopId: sesh.id }],
      });
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
      queryClient.invalidateQueries({ queryKey: ['active-poop-sesh'] });
    },
  });
}
