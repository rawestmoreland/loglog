import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/authContext';
import {
  type FollowsResponse,
  type PooProfilesResponse,
} from '@/lib/pocketbase-types';
import { usePocketBase } from '@/lib/pocketbaseConfig';

// Expand type for follows with expanded following and follower relations
export type FollowsExpand = {
  following: PooProfilesResponse;
  follower: PooProfilesResponse;
};

// Type for follows response with expanded relations
export type FollowsWithExpand = FollowsResponse<FollowsExpand>;

// Type for following query result with additional followsYou property
export type FollowingWithFollowsYou = FollowsWithExpand & {
  followsYou: boolean;
};

/**
 * Get all users that follow the user
 * @returns list of users
 */
export function useMyFollowers(
  params: { enabled?: boolean } = { enabled: true }
) {
  const { pb } = usePocketBase();

  const { pooProfile } = useAuth();

  return useQuery<FollowsWithExpand[]>({
    queryKey: ['my-followers'],
    queryFn: async () => {
      const followers = await pb?.collection('follows').getFullList({
        filter: `(following = '${pooProfile?.id}') && status = 'approved'`,
        expand: `following,follower`,
      });

      return (followers ?? []) as FollowsWithExpand[];
    },
    enabled: !!pooProfile?.id && params.enabled,
  });
}

/**
 * Get all users that the user is following
 * @returns list of users
 */
export function useFollowing(
  params: { enabled?: boolean } = { enabled: true }
) {
  const { pb } = usePocketBase();

  const { pooProfile } = useAuth();

  const { data: myFollowers, isLoading: isLoadingMyFollowers } =
    useMyFollowers();

  return useQuery<FollowingWithFollowsYou[]>({
    queryKey: ['following'],
    queryFn: async () => {
      const following = await pb?.collection('follows').getFullList({
        filter: `(follower = '${pooProfile?.id}') && status = 'approved'`,
        expand: `following,follower`,
      });

      return (
        following?.map((pal) => {
          const typedPal = pal as FollowsWithExpand;
          return {
            ...typedPal,
            followsYou:
              myFollowers?.some(
                (follower) =>
                  follower.expand?.follower?.id ===
                  typedPal.expand?.following?.id
              ) ?? false,
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
export function useFollowMeRequests(
  params: { enabled?: boolean } = { enabled: true }
) {
  const { pb } = usePocketBase();

  const { pooProfile } = useAuth();

  return useQuery<FollowsWithExpand[]>({
    queryKey: ['follow-me-requests'],
    queryFn: async () => {
      const requests = await pb
        ?.collection('follows')
        .getFullList({
          filter: `(following = '${pooProfile?.id}') && status = 'pending'`,
          expand: `following,follower`,
        })
        .catch(() => {
          return [];
        });

      return (requests ?? []) as FollowsWithExpand[];
    },
    enabled: !!pooProfile?.id && params.enabled,
  });
}
