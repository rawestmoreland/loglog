import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useFollowing } from './usePoopPalsQueries';

import { useAuth } from '@/context/authContext';
import { useMapViewContext } from '@/context/mapViewContext';
import { useNetwork } from '@/context/networkContext';
import { applyPrivacyShift, Bounds, boundsFilter } from '@/lib/geo-helpers';
import { getOfflineSessions } from '@/lib/helpers';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { PoopSesh } from '@/lib/types';

export function useActivePoopSesh() {
  const { isConnected, isNetworkInitialized } = useNetwork();
  const { pb } = usePocketBase();

  const { user, pooProfile } = useAuth();

  return useQuery({
    queryKey: ['active-poop-sesh'],
    queryFn: async (): Promise<PoopSesh | null> => {
      try {
        if (isConnected === false && isNetworkInitialized) {
          const offline = await getOfflineSessions();
          const newestOffline = offline
            .filter((s) => !!s.started && !Boolean(s.ended))
            .sort(
              (a, b) =>
                new Date(b.started).getTime() - new Date(a.started).getTime()
            )[0];
          return newestOffline ? { ...newestOffline, is_local: true } : null;
        }

        const sesh = await pb
          ?.collection('poop_seshes')
          .getFirstListItem(
            `started != null && ended = null && (user = '${user?.id}' || poo_profile = '${pooProfile?.id}')`,
            {
              expand: `place_id`,
            }
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
          is_airplane: sesh?.is_airplane,
          company_time: sesh?.company_time,
          flight_number: sesh?.flight_number,
          airline: sesh?.airline,
          departure_airport: sesh?.departure_airport,
          arrival_airport: sesh?.arrival_airport,
          place_id: sesh?.place_id,
          place: sesh?.expand?.place_id,
          custom_place_name: sesh?.custom_place_name,
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        return null;
      }
    },
    enabled: !!user,
  });
}

export function useMyPoopSeshHistory(
  params: {
    enabled?: boolean;
  } = { enabled: true }
) {
  const { pb } = usePocketBase();
  const { user, pooProfile } = useAuth();
  const { isConnected, isNetworkInitialized } = useNetwork();

  return useQuery({
    queryKey: ['poop-sesh-history', { user: user?.id }],
    queryFn: async (): Promise<PoopSesh[]> => {
      const hasNoConnection =
        isConnected === false && isNetworkInitialized === true;

      if (hasNoConnection) {
        const offline = await getOfflineSessions();
        return (
          offline
            .filter((s) => Boolean(s.started) && Boolean(s.ended))
            .sort(
              (a, b) =>
                new Date(b.started).getTime() - new Date(a.started).getTime()
            ) ?? []
        );
      }

      // Get public and user's private sesh
      const filter = `(user = '${user?.id}' || poo_profile = '${pooProfile?.id}') && started != null && ended != null`;
      const sort = `-started`;
      const expand = `user`;

      const sesh = await pb?.collection('poop_seshes').getFullList<PoopSesh>({
        filter,
        sort,
        expand,
      });
      return sesh ?? [];
    },
    enabled: !!user && params.enabled,
  });
}

// Max seshes fetched per viewport query; newest first
const MAP_PAGE_SIZE = 500;

export function usePublicPoopSeshHistory(
  params: {
    enabled?: boolean;
    viewportBounds?: Bounds;
  } = { enabled: true, viewportBounds: undefined }
) {
  const { pb } = usePocketBase();
  const { viewportBounds } = params;

  return useQuery({
    queryKey: ['poop-sesh-history', { public: true, bounds: viewportBounds }],
    queryFn: async (): Promise<PoopSesh[]> => {
      if (!viewportBounds) {
        return [];
      }

      const filter = `is_public = true && started != null && ended != null && ${boundsFilter(viewportBounds)}`;
      const sort = `-started`;
      const expand = `user,poo_profile`;
      const seshes = await pb
        ?.collection('poop_seshes')
        .getList<PoopSesh>(1, MAP_PAGE_SIZE, {
          filter,
          sort,
          expand,
          skipTotal: true,
        });

      return seshes?.items.map(applyPrivacyShift) ?? [];
    },
    enabled: !!pb && !!viewportBounds && params.enabled,
    placeholderData: keepPreviousData,
  });
}

export function usePoopSesh(
  poopId: string | null,
  params: { enabled?: boolean } = { enabled: true }
) {
  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['poop-sesh', { poopId }],
    queryFn: async (): Promise<PoopSesh | null> => {
      if (!poopId) return null;
      const expand = `user,place_id`;
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
          bristol_score: sesh?.bristol_score,
          started: new Date(sesh?.started ?? new Date()),
          ended: sesh?.ended ? new Date(sesh?.ended) : null,
          revelations: sesh?.revelations,
          user: sesh?.user,
          is_public: sesh?.is_public ?? false,
          company_time: sesh?.company_time ?? false,
          place_id: sesh?.place_id,
          place: sesh?.expand?.place_id,
          custom_place_name: sesh?.custom_place_name,
          place_type: sesh?.place_type,
          is_airplane: sesh?.is_airplane,
          flight_number: sesh?.flight_number,
          airline: sesh?.airline,
          departure_airport: sesh?.departure_airport,
          arrival_airport: sesh?.arrival_airport,
        } as PoopSesh;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    enabled: !!poopId && params.enabled,
  });
}

export function useFriendsPoopSeshHistory(
  params: {
    enabled?: boolean;
    viewportBounds?: Bounds;
  } = { enabled: true, viewportBounds: undefined }
) {
  const { pb } = usePocketBase();
  const { pooProfile } = useAuth();
  const { viewportBounds } = params;

  const { data: following, isLoading: isLoadingFollowing } = useFollowing();

  return useQuery({
    queryKey: [
      'friends-poop-sesh-history',
      { poo_profile: pooProfile?.id, bounds: viewportBounds },
    ],
    queryFn: async () => {
      if (!following || following.length === 0 || !viewportBounds) {
        return [];
      }

      const followingIds = following.map((friend) => friend.following);

      const filter = `is_public = true && started != null && ended != null && (${followingIds
        .map((id) => `poo_profile="${id}"`)
        .join('||')}) && ${boundsFilter(viewportBounds)}`;
      const sort = `-started`;
      const expand = `user,poo_profile`;

      const sesh = await pb
        ?.collection('poop_seshes')
        .getList(1, MAP_PAGE_SIZE, {
          filter,
          sort,
          expand,
          skipTotal: true,
        });
      return sesh?.items.map(applyPrivacyShift) ?? [];
    },
    enabled:
      !isLoadingFollowing &&
      !!pb &&
      !!pooProfile?.id &&
      !!viewportBounds &&
      params.enabled,
    placeholderData: keepPreviousData,
  });
}

export function usePalPoopSeshHistory(
  params: {
    enabled?: boolean;
    viewportBounds?: Bounds;
  } = { enabled: true, viewportBounds: undefined }
) {
  const { pb } = usePocketBase();
  const { palSelected } = useMapViewContext();
  const { viewportBounds } = params;

  return useQuery({
    queryKey: [
      'pal-poop-sesh-history',
      { palId: palSelected, bounds: viewportBounds },
    ],
    queryFn: async () => {
      if (!viewportBounds) {
        return [];
      }

      const filter = `is_public = true && started != null && ended != null && poo_profile = '${palSelected}' && ${boundsFilter(viewportBounds)}`;
      const sort = `-started`;
      const expand = `user,poo_profile`;

      const sesh = await pb
        ?.collection('poop_seshes')
        .getList(1, MAP_PAGE_SIZE, {
          filter,
          sort,
          expand,
          skipTotal: true,
        });
      return sesh?.items.map(applyPrivacyShift) ?? [];
    },
    enabled: !!pb && !!palSelected && !!viewportBounds && params.enabled,
    // Keep pins while the viewport changes, but not when switching pals
    placeholderData: (previousData, previousQuery) =>
      (previousQuery?.queryKey[1] as { palId?: string | null } | undefined)
        ?.palId === palSelected
        ? previousData
        : undefined,
  });
}
