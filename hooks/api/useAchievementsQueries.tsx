import { useAuth } from '@/context/authContext';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { useQuery } from '@tanstack/react-query';

export function useAchievements() {
  const { pb } = usePocketBase();
  const { pooProfile } = useAuth();

  return useQuery({
    queryKey: ['achievements', pooProfile?.id],
    queryFn: async () => {
      const fileToken = await pb?.files.getToken();
      const achievements = await pb
        ?.collection('user_achievement')
        .getFullList({
          filter: `poo_profile = "${pooProfile?.id}"`,
          expand: `achievement`,
        })
        .catch((e) => {
          console.log('error', e);
          return [];
        });

      const achievementsWithIcons =
        achievements?.map((a) => {
          const iconUrl = pb?.files.getURL(
            a.expand?.achievement,
            a.expand?.achievement?.icon,
            { token: fileToken }
          );
          return {
            ...a,
            iconUrl,
          };
        }) ?? [];
      return achievementsWithIcons ?? [];
    },
    enabled: !!pooProfile?.id && !!pb,
  });
}
