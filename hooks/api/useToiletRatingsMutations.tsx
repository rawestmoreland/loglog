import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/authContext';
import { usePocketBase } from '@/lib/pocketbaseConfig';

export function useUpdatePlaceRating(placeId: string) {
  const queryClient = useQueryClient();
  const { pooProfile } = useAuth();
  const { pb } = usePocketBase();

  if (!pooProfile?.id) {
    throw new Error('Poo profile or place ID is missing');
  }

  return useMutation({
    mutationFn: async ({ rating }: { rating: number }) => {
      const ratingToUpdate = await pb
        ?.collection('toilet_ratings')
        .getFirstListItem(
          `user_id = "${pooProfile?.id}" && place_id = "${placeId}"`
        )
        .catch(() => null);
      console.log(ratingToUpdate);
      if (ratingToUpdate) {
        return await pb
          ?.collection('toilet_ratings')
          .update(ratingToUpdate.id, {
            rating,
          });
      }
      return await pb?.collection('toilet_ratings').create({
        user_id: pooProfile?.id,
        place_id: placeId,
        rating,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['toiletRatingForPlace', placeId],
      });
    },
  });
}
