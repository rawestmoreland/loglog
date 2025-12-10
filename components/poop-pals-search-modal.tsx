import { useActionSheet } from '@expo/react-native-action-sheet';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  View,
} from 'react-native';

import { Button, Input, ListItem, Text, XStack } from 'tamagui';

import { useAuth } from '@/context/authContext';

import { useAddPal } from '@/hooks/api/usePoopPalMutations';
import { useFollowing } from '@/hooks/api/usePoopPalsQueries';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  FollowsResponse,
  PooProfilesRecord,
  PooProfilesResponse,
} from '@/lib/pocketbase-types';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { ChevronRight, User, UserPlus, X } from '@tamagui/lucide-icons';

type PooPalSearchItem = PooProfilesRecord & { isPending: boolean };

export default function PoopPalsSearchModal() {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();

  const { pooProfile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [addPalsOpen, setAddPalsOpen] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const foregroundColor = useThemeColor({}, 'foreground');

  const { showActionSheetWithOptions } = useActionSheet();

  const { data: following, isLoading: followingLoading } = useFollowing();

  const { mutateAsync: addPal } = useAddPal();

  const { data: pals, isLoading: palsLoading } = useQuery({
    queryKey: ['poo_profiles', debouncedSearchQuery],
    queryFn: async () => {
      const pendingPals = await pb
        ?.collection<FollowsResponse>('follows')
        .getFullList({
          filter: `follower = '${pooProfile?.id}' && status = 'pending'`,
        })
        .catch((e) => []);

      const pals = await pb
        ?.collection<PooProfilesResponse>('poo_profiles')
        .getFullList(100, {
          filter: `codeName ~ "${debouncedSearchQuery}" && id != "${
            pooProfile?.id
          }" && id != "${following
            ?.map((f) => f.expand?.following?.id)
            .join('" && id != "')}"`,
        })
        .catch((e) => []);

      const doctoredPals: PooPalSearchItem[] = (pals ?? []).map((pal) => ({
        ...pal,
        isPending:
          pendingPals?.some(
            (p) => p.following === pal.id && p.status === 'pending'
          ) ?? false,
      }));

      return doctoredPals ?? [];
    },
    enabled: !!debouncedSearchQuery && !!pb && !followingLoading,
  });

  // Create a stable debounced function with useCallback
  const debouncedSetSearch = useCallback(
    debounce((query: string) => {
      setDebouncedSearchQuery(query);
    }, 500),
    [] // Empty dependencies since we want this to be stable
  );

  useEffect(() => {
    if (!searchQuery) {
      setDebouncedSearchQuery('');
      queryClient.setQueryData(['poo_profiles', debouncedSearchQuery], null);
      return;
    }

    debouncedSetSearch(searchQuery);

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchQuery, debouncedSetSearch, queryClient, debouncedSearchQuery]);

  const handleAddPal = async (item: PooPalSearchItem) => {
    if (!item.id) {
      Alert.alert('Error', 'Poo profile ID not found');
      return;
    }

    try {
      await addPal(item.id);
      setAddPalsOpen(false);
      setSearchQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add pal');
    }
  };

  const handleAddPalSheet = (item: PooPalSearchItem) => {
    const options = item.isPending ? ['Cancel'] : ['Add Pal', 'Cancel'];
    const cancelButtonIndex =
      Platform.OS === 'ios' ? options.length : options.length - 1;

    const title = item.isPending ? 'Pending Follow Request' : 'Add Pal';
    const message = item.isPending
      ? 'This person has not yet approved your follow request.'
      : 'This person will need to approve your follow request.';

    showActionSheetWithOptions(
      {
        options,
        title,
        message,
        cancelButtonIndex,
      },
      (selectedIndex?: number) => {
        switch (selectedIndex) {
          case 0:
            if (!item.isPending) {
              handleAddPal(item);
            }
            break;

          case cancelButtonIndex:
            // Cancel
            break;
        }
      }
    );
  };

  return (
    <>
      {/* Add pals button */}
      <Button
        size='$2'
        variant='outlined'
        icon={UserPlus}
        onPress={() => setAddPalsOpen(true)}
      >
        Add Pals
      </Button>

      {/* Add pals modal */}
      <Modal
        animationType='slide'
        visible={addPalsOpen}
        onRequestClose={() => setAddPalsOpen(false)}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: backgroundColor as unknown as string,
          }}
        >
          <XStack justify='space-between' items='center' px='$4' mb='$4'>
            <Text fontWeight='bold'>Add Pals</Text>
            <Button
              theme='yellow'
              size='$2'
              circular
              icon={X}
              onPress={() => setAddPalsOpen(false)}
            />
          </XStack>
          <View style={{ flex: 1, gap: 8, paddingHorizontal: 16 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Input
                placeholder='Search by nickname...'
                style={{
                  backgroundColor: backgroundColor as unknown as string,
                }}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {palsLoading && !!debouncedSearchQuery ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator />
                </View>
              ) : pals?.length ? (
                <View style={{ flex: 1 }}>
                  <FlashList
                    data={pals}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                      return (
                        <ListItem
                          icon={User}
                          iconAfter={ChevronRight}
                          pressTheme
                          onPress={() => handleAddPalSheet(item)}
                          title={item.codeName}
                          subTitle={item.isPending ? 'Pending' : 'Add Pal'}
                        />
                      );
                      // <Pressable
                      //   style={{
                      //     flexDirection: 'row',
                      //     alignItems: 'center',
                      //     gap: 8,
                      //   }}
                      //   onPress={() => handleAddPalSheet(item)}
                      // >
                      //   <Avatar circular backgroundColor='$blue10'>
                      //     <User color='$white1' />
                      //   </Avatar>
                      //   <Text>{item.codeName}</Text>
                      // </Pressable>
                    }}
                  />
                </View>
              ) : !palsLoading && pals?.length === 0 ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text>No pals found</Text>
                </View>
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text>Search for pals by nickname</Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
