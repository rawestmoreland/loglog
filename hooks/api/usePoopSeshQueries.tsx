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
          id: sesh?.id,
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
    queryKey: ['poop-sesh-history', user?.id],
    queryFn: async (): Promise<PoopSesh[]> => {
      // Get public and user's private sesh
      const filter = `user = '${user?.id}'`;

      const sesh = await pb?.collection('poop_seshes').getFullList<PoopSesh>(1, {
        filter,
      });
      return sesh ?? [];
    },
    enabled: !!user,
  });
}

export function usePublicPoopSeshHistory() {
  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['public-poop-sesh-history'],
    queryFn: async (): Promise<PoopSesh[]> => {
      const sesh = await pb?.collection('poop_seshes').getFullList<PoopSesh>(100, {
        filter: 'is_public = true',
      });
      return sesh ?? [];
    },
  });
}
