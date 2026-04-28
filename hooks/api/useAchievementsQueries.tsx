import { useAuth } from '@/context/authContext';
import { AchievementsRecord } from '@/lib/pocketbase-types';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { useQuery } from '@tanstack/react-query';

export type AchievementWithStatus = AchievementsRecord & {
  id: string;
  earned: boolean;
  unlockedAt?: string;
};

export function useAchievements() {
  const { pb } = usePocketBase();
  const { pooProfile } = useAuth();

  return useQuery({
    queryKey: ['achievements', pooProfile?.id],
    queryFn: async (): Promise<AchievementWithStatus[]> => {
      const [allAchievements, userAchievements] = await Promise.all([
        pb?.collection('achievements').getFullList<AchievementsRecord & { id: string }>() ?? [],
        pb
          ?.collection('user_achievement')
          .getFullList({
            filter: `poo_profile = "${pooProfile?.id}"`,
            expand: 'achievement',
          })
          .catch(() => []) ?? [],
      ]);

      const earnedMap = new Map(
        userAchievements.map((ua) => [ua.achievement as string, ua.unlocked_at as string])
      );

      return allAchievements.map((achievement) => ({
        ...achievement,
        earned: earnedMap.has(achievement.id),
        unlockedAt: earnedMap.get(achievement.id),
      }));
    },
    enabled: !!pooProfile?.id && !!pb,
  });
}
