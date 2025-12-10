import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/authContext';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { PooProfile } from '@/lib/types';

export function useUpdatePooProfile() {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();
  const { pooProfile } = useAuth();

  if (!pooProfile) {
    throw new Error('Poo profile not found');
  }

  return useMutation({
    mutationFn: async (data: PooProfile) => {
      return await pb?.collection('poo_profiles').update(pooProfile.id!, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poo-profile'] });
    },
  });
}
