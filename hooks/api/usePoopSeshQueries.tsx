import { useQuery } from '@tanstack/react-query';

import { useAuth } from '~/context/authContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { PoopSesh } from '~/lib/types';

export function useActivePoopSesh() {
  const { pb } = usePocketBase();

  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-poop-sesh'],
    queryFn: async (): Promise<PoopSesh | null> => {
      try {
        const sesh = await pb
          ?.collection('poop_seshes')
          .getFirstListItem(`started != null && ended = null && user = '${user?.id}'`);
        return {
          id: sesh?.id!,
          location: sesh?.location,
          started: sesh?.started,
          ended: sesh?.ended,
          revelations: sesh?.revelations,
          user: sesh?.user,
          is_public: sesh?.is_public,
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    enabled: !!user,
  });
}

export function useMyPoopSeshHistory() {
  const { pb } = usePocketBase();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['poop-sesh-history', { user: user?.id }],
    queryFn: async (): Promise<PoopSesh[]> => {
      // Get public and user's private sesh
      const filter = `user = '${user?.id}' && started != null && ended != null`;
      const sort = `-started`;
      const expand = `user`;

      const sesh = await pb?.collection('poop_seshes').getFullList<PoopSesh>(1, {
        filter,
        sort,
        expand,
      });
      return sesh ?? [];
    },
    enabled: !!user,
  });
}

export function usePublicPoopSeshHistory() {
  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['poop-sesh-history', { public: true }],
    queryFn: async (): Promise<PoopSesh[]> => {
      const filter = `is_public = true && started != null && ended != null`;
      const sort = `-started`;
      const expand = `user`;
      const sesh = await pb?.collection('poop_seshes').getFullList<PoopSesh>(100, {
        filter,
        sort,
        expand,
      });
      return sesh ?? [];
    },
  });
}

export function usePoopSesh(poopId: string) {
  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['poop-sesh', { poopId }],
    queryFn: async (): Promise<PoopSesh | null> => {
      const expand = `user`;
      try {
        const sesh = await pb?.collection('poop_seshes').getOne(poopId, {
          expand,
        });

        return {
          id: sesh?.id!,
          location: {
            coordinates: {
              lat: sesh?.location?.coordinates?.lat ?? 0,
              lon: sesh?.location?.coordinates?.lon ?? 0,
            },
          },
          started: new Date(sesh?.started ?? new Date()),
          ended: sesh?.ended ? new Date(sesh?.ended) : null,
          revelations: sesh?.revelations,
          user: sesh?.user,
          is_public: sesh?.is_public ?? false,
        } as PoopSesh;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    enabled: !!poopId,
  });
}
