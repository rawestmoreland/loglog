import { useQuery } from '@tanstack/react-query';

import { useFollowing } from './usePoopPalsQueries';

import { useAuth } from '@/context/authContext';
import { useMapViewContext } from '@/context/mapViewContext';
import { useNetwork } from '@/context/networkContext';
import { shiftCoords } from '@/lib/geo-helpers';
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
      } catch (error) {
        console.error(error);
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

  return useQuery({
    queryKey: ['poop-sesh-history', { user: user?.id }],
    queryFn: async (): Promise<PoopSesh[]> => {
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

export function usePublicPoopSeshHistory(
  params: {
    enabled?: boolean;
    viewportBounds?: {
      minLon: number;
      minLat: number;
      maxLon: number;
      maxLat: number;
    };
  } = { enabled: true, viewportBounds: undefined }
) {
  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['poop-sesh-history', { public: true }],
    queryFn: async (): Promise<PoopSesh[]> => {
      const filter = `is_public = true && started != null && ended != null`;
      const sort = `-started`;
      const expand = `user,poo_profile`;
      const seshes = await pb?.collection('poop_seshes').getFullList<PoopSesh>({
        filter,
        sort,
        expand,
      });

      const transformedSeshes = seshes?.map((sesh) => {
        if (sesh.expand?.poo_profile) {
          if (sesh.expand?.poo_profile?.shift_logs && sesh.coords) {
            const { coords } = sesh;
            const { latShift, lonShift } = shiftCoords(sesh.coords);
            coords!.lat += latShift;
            coords!.lon += lonShift;
          }
        }
        return sesh;
      });

      return transformedSeshes ?? [];
    },
    enabled: params.enabled,
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
          bristol_score: sesh?.bristol_score,
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

export function useFriendsPoopSeshHistory(
  params: {
    enabled?: boolean;
    viewportBounds?: {
      minLon: number;
      minLat: number;
      maxLon: number;
      maxLat: number;
    };
  } = { enabled: true, viewportBounds: undefined }
) {
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

      if (!params.viewportBounds) {
        return [];
      }

      const filter = `is_public = true && started != null && ended != null && (${followingIds
        .map((id) => `poo_profile="${id}"`)
        .join('||')}) && location.coordinates.lat >= ${
        params.viewportBounds.minLat
      } && location.coordinates.lat <= ${
        params.viewportBounds.maxLat
      } && location.coordinates.lon >= ${
        params.viewportBounds.minLon
      } && location.coordinates.lon <= ${params.viewportBounds.maxLon}`;
      const sort = `-started`;
      const expand = `user,poo_profile`;

      const sesh = await pb
        ?.collection('poop_seshes')
        .getList(1, params.viewportBounds ? 500 : 10, {
          filter,
          sort,
          expand,
        });
      return sesh?.items ?? [];
    },
    enabled: !isLoadingFollowing && !!pooProfile?.id && params.enabled,
  });
}

export function usePalPoopSeshHistory(
  params: {
    enabled?: boolean;
    viewportBounds?: {
      minLon: number;
      minLat: number;
      maxLon: number;
      maxLat: number;
    };
  } = { enabled: true, viewportBounds: undefined }
) {
  const { pb } = usePocketBase();
  const { palSelected } = useMapViewContext();

  return useQuery({
    queryKey: ['pal-poop-sesh-history', { palId: palSelected }],
    queryFn: async () => {
      let filter = `is_public = true && started != null && ended != null && poo_profile = '${palSelected}'`;
      if (params.viewportBounds) {
        filter += ` && location.coordinates.lat >= ${params.viewportBounds.minLat} && location.coordinates.lat <= ${params.viewportBounds.maxLat} && location.coordinates.lon >= ${params.viewportBounds.minLon} && location.coordinates.lon <= ${params.viewportBounds.maxLon}`;
      }
      const sort = `-started`;
      const expand = `user,poo_profile`;

      const sesh = await pb?.collection('poop_seshes').getFullList({
        filter,
        sort,
        expand,
      });
      return sesh ?? [];
    },
    enabled: !!palSelected && params.enabled,
  });
}
