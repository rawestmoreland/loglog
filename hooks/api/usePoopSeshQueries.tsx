import { useQuery } from '@tanstack/react-query';

import { useFollowing } from './usePoopPalsQueries';

import { useAuth } from '~/context/authContext';
import { useMapViewContext } from '~/context/mapViewContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { PoopSesh } from '~/lib/types';

export function useActivePoopSesh() {
  const { pb } = usePocketBase();

  const { user, pooProfile } = useAuth();

  return useQuery({
    queryKey: ['active-poop-sesh'],
    queryFn: async (): Promise<PoopSesh | null> => {
      try {
        const sesh = await pb
          ?.collection('poop_seshes')
          .getFirstListItem(
            `started != null && ended = null && (user = '${user?.id}' || poo_profile = '${pooProfile?.id}')`
          );
        return {
          id: sesh?.id!,
          location: sesh?.location,
          started: sesh?.started,
          ended: sesh?.ended,
          revelations: sesh?.revelations,
          user: sesh?.user,
          poo_profile: sesh?.poo_profile,
          is_public: sesh?.is_public,
          company_time: sesh?.company_time,
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    enabled: !!user,
  });
}

export function useMyPoopSeshHistory(params: { enabled?: boolean } = { enabled: true }) {
  const { pb } = usePocketBase();
  const { user, pooProfile } = useAuth();

  return useQuery({
    queryKey: ['poop-sesh-history', { user: user?.id }],
    queryFn: async (): Promise<PoopSesh[]> => {
      // Get public and user's private sesh
      const filter = `(user = '${user?.id}' || poo_profile = '${pooProfile?.id}') && started != null && ended != null`;
      const sort = `-started`;
      const expand = `user`;

      const sesh = await pb?.collection('poop_seshes').getFullList<PoopSesh>(1, {
        filter,
        sort,
        expand,
      });
      return sesh ?? [];
    },
    enabled: !!user && params.enabled,
  });
}

export function usePublicPoopSeshHistory(params: { enabled?: boolean } = { enabled: true }) {
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
    enabled: params.enabled,
  });
}

export function usePoopSesh(poopId: string, params: { enabled?: boolean } = { enabled: true }) {
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
          company_time: sesh?.company_time ?? false,
        } as PoopSesh;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    enabled: !!poopId && params.enabled,
  });
}

export function useFriendsPoopSeshHistory(params: { enabled?: boolean } = { enabled: true }) {
  const { pb } = usePocketBase();
  const { pooProfile } = useAuth();

  const { data: following, isLoading: isLoadingFollowing } = useFollowing();

  return useQuery({
    queryKey: ['friends-poop-sesh-history', pooProfile?.id],
    queryFn: async () => {
      if (!following || following.length === 0) {
        return [];
      }

      const followingIds = following.map((friend) => friend.following);

      const filter = `is_public = true && started != null && ended != null && (${followingIds.map((id) => `poo_profile="${id}"`).join('||')})`;
      const sort = `-started`;
      const expand = `user,poo_profile`;

      const sesh = await pb?.collection('poop_seshes').getFullList(100, {
        filter,
        sort,
        expand,
      });
      return sesh ?? [];
    },
    enabled: !isLoadingFollowing && !!pooProfile?.id && params.enabled,
  });
}

export function usePalPoopSeshHistory(params: { enabled?: boolean } = { enabled: true }) {
  const { pb } = usePocketBase();
  const { palSelected } = useMapViewContext();

  return useQuery({
    queryKey: ['poop-sesh-history', { palId: palSelected }],
    queryFn: async () => {
      const filter = `is_public = true && started != null && ended != null && poo_profile = '${palSelected}'`;
      const sort = `-started`;
      const expand = `user,poo_profile`;

      const sesh = await pb?.collection('poop_seshes').getFullList(100, {
        filter,
        sort,
        expand,
      });
      return sesh ?? [];
    },
    enabled: palSelected !== 'all' && params.enabled,
  });
}
