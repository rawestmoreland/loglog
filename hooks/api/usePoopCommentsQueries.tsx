import { useQuery } from '@tanstack/react-query';

import { usePocketBase } from '@/lib/pocketbaseConfig';
import type { PoopComment } from '@/lib/types';

export function usePoopComments(
  seshId: string | null | undefined,
  params: { enabled?: boolean; limit?: number } = { enabled: true, limit: 50 }
) {
  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['poop-comments', { seshId, limit: params.limit ?? 50 }],
    queryFn: async (): Promise<PoopComment[]> => {
      if (!seshId) return [];

      const res = await pb
        ?.collection('poop_comments')
        .getList(1, params.limit ?? 50, {
          filter: `sesh = "${seshId}"`,
          sort: '-created',
          expand: 'user',
        })
        .catch(console.error);

      return (res?.items ?? []) as unknown as PoopComment[];
    },
    enabled: !!pb && !!seshId && (params.enabled ?? true),
  });
}
