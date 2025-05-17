import { useQuery } from '@tanstack/react-query';

import { usePocketBase } from '~/lib/pocketbaseConfig';

export function usePooProfile() {
  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['poo-profile', pb?.authStore.record?.id],
    queryFn: async () =>
      await pb?.collection('poo_profiles').getFirstListItem(`user = "${pb?.authStore.record?.id}"`),
    enabled: !!pb?.authStore.record?.id,
  });
}
