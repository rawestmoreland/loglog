import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/authContext';
import { usePocketBase } from '@/lib/pocketbaseConfig';

export function useCreatePoopComment() {
  const queryClient = useQueryClient();
  const { pb } = usePocketBase();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      seshId,
      content,
    }: {
      seshId: string;
      content: string;
    }) => {
      if (!user?.id) throw new Error('not-authenticated');
      if (!content.trim()) throw new Error('empty');

      console.log({ seshId, user: user.id, content });

      return await pb?.collection('poop_comments').create({
        sesh: seshId,
        user: user.id,
        content: content.trim(),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['poop-comments'],
        exact: false,
      });
    },
  });
}

export function useDeletePoopComment() {
  const queryClient = useQueryClient();
  const { pb } = usePocketBase();

  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => {
      await pb?.collection('poop_comments').delete(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['poop-comments'],
        exact: false,
      });
    },
  });
}
