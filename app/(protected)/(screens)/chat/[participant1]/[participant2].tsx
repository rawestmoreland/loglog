import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';

import { useAuth } from '~/context/authContext';
import { useChat, useChatMessages } from '~/hooks/api/useChatQueries';
import { usePocketBase } from '~/lib/pocketbaseConfig';

export default function ChatScreen() {
  const { pb } = usePocketBase();
  const [giftedMessages, setGiftedMessages] = useState<any[]>([]);
  const { pooProfile } = useAuth();
  const params = useLocalSearchParams();

  // Extract and validate participants
  const participant1 = params.participant1 as string;
  const participant2 = params.participant2 as string;

  const { data: chat } = useChat(participant1, participant2);
  const { data: messages } = useChatMessages(chat?.id);

  const handleSend = useCallback(
    (messages: IMessage[]) => {
      const message = messages[0];
      pb?.collection('poo_messages').create({
        chat: chat?.id,
        content: message.text,
        sender: pooProfile?.id,
      });
    },
    [pb, chat?.id, pooProfile?.id]
  );

  // Fetch initial messages
  useEffect(() => {
    if (!chat || !pb || !!giftedMessages.length) return;

    pb.collection('poo_messages')
      .getList(1, 50, {
        filter: `chat="${chat.id}"`,
        sort: '-created',
        expand: 'sender',
      })
      .then((res) => {
        setGiftedMessages(
          res.items.map((message) => ({
            _id: message.id!,
            text: message.content,
            createdAt: new Date(message.created),
            user: {
              _id: message.sender,
              name: message.expand?.sender?.codeName,
            },
          }))
        );
      });
  }, [chat, pb, giftedMessages.length]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!chat || !pb) return;

    let unsubscribe: (() => void) | undefined;

    pb.collection('poo_messages')
      .subscribe(
        `*`,
        (data) => {
          setGiftedMessages((prev) => [
            {
              _id: data.record.id!,
              text: data.record.content,
              createdAt: new Date(data.record.created),
              user: {
                _id: data.record.sender,
                name: data.record.expand?.sender?.codeName,
              },
            },
            ...prev,
          ]);
        },
        { filter: `chat="${chat.id}"`, expand: 'sender' }
      )
      .then((func) => {
        unsubscribe = func;
      });

    return () => {
      unsubscribe?.();
    };
  }, [messages, chat, pb]);

  // If we're missing required parameters, show an error state
  if (!participant1 || !participant2) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: Missing participant information</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GiftedChat
        messages={giftedMessages ?? []}
        user={{ _id: pooProfile?.id ?? '' }}
        onSend={handleSend}
      />
    </SafeAreaView>
  );
}
