import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/authContext';
import { usePocketBase } from '@/lib/pocketbaseConfig';

export function useUpdatePlaceRating(placeId: string) {
  const queryClient = useQueryClient();
  const { pooProfile } = useAuth();
  const { pb } = usePocketBase();

  return useMutation({
    mutationFn: async ({ rating }: { rating: number }) => {
      if (!pooProfile?.id || !placeId) {
        return;
      }
      const ratingToUpdate = await pb
        ?.collection('toilet_ratings')
        .getFirstListItem(
          `poo_profile = "${pooProfile?.id}" && place_id = "${placeId}"`
        )
        .catch(console.error);
      if (ratingToUpdate) {
        return await pb
          ?.collection('toilet_ratings')
          .update(ratingToUpdate.id, {
            rating,
          })
          .catch(console.error);
      }
      return await pb?.collection('toilet_ratings').create({
        poo_profile: pooProfile?.id,
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
