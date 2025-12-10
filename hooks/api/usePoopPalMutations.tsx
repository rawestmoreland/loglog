import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/authContext';
import { usePocketBase } from '@/lib/pocketbaseConfig';

export function useAddPal() {
  const queryClient = useQueryClient();
  const { pb } = usePocketBase();

  const { pooProfile } = useAuth();

  if (!pooProfile) {
    throw new Error('Poo profile not found');
  }

  return useMutation({
    mutationFn: async (palId: string) =>
      await pb
        ?.collection('follows')
        .create({
          follower: pooProfile?.id,
          following: palId,
          status: 'pending',
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-me-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
}

export function useRemovePoopPal() {
  const queryClient = useQueryClient();
  const { pb } = usePocketBase();

  return useMutation({
    mutationFn: async (palId: string) =>
      await pb?.collection('follows').delete(`${palId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['follow-me-requests'] });
    },
    onError: (error) => {
      console.error(error);
    },
  });
}

export function useDeclineFollowRequest() {
  const queryClient = useQueryClient();
  const { pb } = usePocketBase();

  return useMutation({
    mutationFn: async (palId: string) =>
      await pb?.collection('follows').update(palId, { status: 'rejected' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-me-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
}

export function useAcceptFollowRequest() {
  const { pooProfile } = useAuth();
  const queryClient = useQueryClient();
  const { pb } = usePocketBase();

  return useMutation({
    mutationFn: async (palId: string) => {
      await pb?.collection('follows').update(palId, { status: 'approved' });

      // create the chat record
      await pb
        ?.collection('poo_chats')
        .create({
          participant1: pooProfile?.id,
          participant2: palId,
        })
        .catch((e) => {
          console.error('Error creating the poo chat record', e);
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-me-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['poo-chats'] });
    },
  });
}
