import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { usePocketBase } from '~/lib/pocketbaseConfig';

export function useChat(participant1: string, participant2: string) {
  const { pb } = usePocketBase();

  return useQuery({
    queryKey: ['chat', participant1, participant2],
    queryFn: async () => {
      let chat = await pb
        ?.collection('poo_chats')
        .getList(1, 1, {
          filter: `(participant1 = "${participant1}" && participant2 = "${participant2}") || (participant1 = "${participant2}" && participant2 = "${participant1}")`,
        })
        .catch((e) => {
          console.log('error', e);
          return null;
        });

      // If no chat is found, create a new one
      if (!chat?.items?.length) {
        const newChat = await pb
          ?.collection('poo_chats')
          .create({
            participant1,
            participant2,
          })
          .catch((e) => {
            console.log('error', e);
            return null;
          });

        return newChat;
      }

      return chat.items[0];
    },
    enabled: !!participant1 && !!participant2 && !!pb,
  });
}

export function useChatMessages(chatId?: string, options?: { page?: number; perPage?: number }) {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!pb || !chatId) return;

    let unsubscribe: (() => void) | undefined;

    // Subscribe to realtime updates
    pb.collection('poo_messages')
      .subscribe(`chat="${chatId}"`, (data) => {
        // Handle different types of realtime events
        if (data.action === 'create') {
          queryClient.setQueryData(
            ['chat-messages', chatId, options?.page, options?.perPage],
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                items: [...old.items, data.record],
                totalItems: old.totalItems + 1,
              };
            }
          );
        } else if (data.action === 'update') {
          queryClient.setQueryData(
            ['chat-messages', chatId, options?.page, options?.perPage],
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.map((item: any) =>
                  item.id === data.record.id ? data.record : item
                ),
              };
            }
          );
        } else if (data.action === 'delete') {
          queryClient.setQueryData(
            ['chat-messages', chatId, options?.page, options?.perPage],
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.filter((item: any) => item.id !== data.record.id),
                totalItems: old.totalItems - 1,
              };
            }
          );
        }
      })
      .then((unsub) => {
        unsubscribe = unsub;
      });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [pb, chatId, queryClient, options?.page, options?.perPage]);

  return useQuery({
    queryKey: ['chat-messages', chatId, options?.page, options?.perPage],
    queryFn: () =>
      pb?.collection('poo_messages').getList(options?.page ?? 1, options?.perPage ?? 50, {
        filter: `chat = "${chatId}"`,
        order: 'created',
      }),
    enabled: !!chatId && !!pb,
    staleTime: 1000 * 60 * 5,
  });
}
