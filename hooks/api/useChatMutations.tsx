import { useMutation, useQueryClient } from '@tanstack/react-query';

import { usePocketBase } from '@/lib/pocketbaseConfig';

export function useCreateChatMessage(chatId: string) {
  const queryClient = useQueryClient();
  const { pb } = usePocketBase();

  const createMessage = async ({
    content,
    sender,
  }: {
    content: string;
    sender: string;
  }) => {
    const message = await pb?.collection('poo_messages').create({
      chat: chatId,
      content,
      sender,
    });

    return message;
  };

  return useMutation({
    mutationFn: ({ content, sender }: { content: string; sender: string }) =>
      createMessage({ content, sender }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', chatId] });
    },
  });
}
