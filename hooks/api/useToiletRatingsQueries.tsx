import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/authContext';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { RecordModel } from 'pocketbase';

export function useToiletRatings() {
  const { pooProfile } = useAuth();

  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['toiletRatings', pooProfile?.id],
    queryFn: () =>
      pb?.collection('toilet_ratings').getFullList({
        filter: `user_id = ${pooProfile?.id}`,
      }),
    enabled: !!pooProfile?.id,
  });
}

export function useToiletRatingForPlace(placeId: string) {
  const { pooProfile } = useAuth();

  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['toiletRatingForPlace', placeId],
    queryFn: () =>
      pb
        ?.collection('toilet_ratings')
        .getFirstListItem(
          `poo_profile="${pooProfile?.id}" && place_id = "${placeId}"`
        ),
    enabled: !!pooProfile?.id && !!placeId,
  });
}

export function useAverageToiletRatings() {
  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['averageToiletRatings'],
    queryFn: async (): Promise<RecordModel[]> => {
      const ratings = await pb
        ?.collection('average_ratings')
        .getFullList({ expand: 'place_id' })
        .catch((e) => {
          console.error(e);
          return [];
        });

      if (ratings && ratings.length > 0) {
        return ratings.map((rating: RecordModel) => ({
          ...rating,
          type: 'toilet',
        }));
      }

      return [];
    },
    enabled: !!pb,
  });
}
