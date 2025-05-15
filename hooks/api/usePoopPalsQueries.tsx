import { useQuery } from '@tanstack/react-query';

import { useAuth } from '~/context/authContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';

/**
 * Get all users that follow the user
 * @returns list of users
 */
export function useMyFollowers(params: { enabled?: boolean } = { enabled: true }) {
  const { pb } = usePocketBase();

  const { pooProfile } = useAuth();

  return useQuery({
    queryKey: ['my-followers'],
    queryFn: async () => {
      const followers = await pb?.collection('follows').getFullList({
        filter: `(following = '${pooProfile?.id}') && status = 'approved'`,
        expand: `following,follower`,
      });

      return followers ?? [];
    },
    enabled: !!pooProfile?.id && params.enabled,
  });
}

/**
 * Get all users that the user is following
 * @returns list of users
 */
export function useFollowing(params: { enabled?: boolean } = { enabled: true }) {
  const { pb } = usePocketBase();

  const { pooProfile } = useAuth();

  const { data: myFollowers, isLoading: isLoadingMyFollowers } = useMyFollowers();

  return useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const following = await pb?.collection('follows').getFullList({
        filter: `(follower = '${pooProfile?.id}') && status = 'approved'`,
        expand: `following,follower`,
      });

      return (
        following?.map((pal) => {
          return {
            ...pal,
            following: pal.following,
            follower: pal.follower,
            followsYou: myFollowers?.some(
              (follower) => follower.expand?.follower?.id === pal.expand?.following?.id
            ),
          };
        }) ?? []
      );
    },
    enabled: !!pooProfile?.id && !isLoadingMyFollowers && params.enabled,
  });
}

/**
 * Get all follow requests where the user is receiving a follow request
 * @returns list of follow requests
 */
export function useFollowMeRequests(params: { enabled?: boolean } = { enabled: true }) {
  const { pb } = usePocketBase();

  const { pooProfile } = useAuth();

  return useQuery({
    queryKey: ['follow-me-requests'],
    queryFn: async () => {
      const requests = await pb
        ?.collection('follows')
        .getFullList({
          filter: `following = '${pooProfile?.id}' && status = 'pending'`,
          expand: `following,follower`,
        })
        .catch((error) => console.error(error));
      return requests ?? [];
    },
    enabled: !!pooProfile?.id && params.enabled,
  });
}
