import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { RecordModel } from 'pocketbase';
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, SafeAreaView, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Avatar, AvatarFallback } from '../nativewindui/Avatar';
import { SearchInput } from '../nativewindui/SearchInput';
import { Text } from '../nativewindui/Text';

import { useAddPal } from '~/hooks/api/usePoopPalMutations';
import { useFollowing } from '~/hooks/api/usePoopPalsQueries';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { useColorScheme } from '~/lib/useColorScheme';

export default function PoopPalsSearchModal() {
  const { pb } = usePocketBase();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [addPalsOpen, setAddPalsOpen] = useState(false);
  const { colors } = useColorScheme();

  const { showActionSheetWithOptions } = useActionSheet();

  const { data: following, isLoading: followingLoading } = useFollowing();

  const { mutateAsync: addPal } = useAddPal();

  const { data: pals, isLoading: palsLoading } = useQuery({
    queryKey: ['poo_profiles', debouncedSearchQuery],
    queryFn: async () => {
      const pals = await pb
        ?.collection('poo_profiles')
        .getList(1, 10, {
          filter: `codeName ~ "${debouncedSearchQuery}" && ${following?.map((f) => `codeName != "${f.expand?.following.codeName}"`).join(' && ')}`,
        })
        .catch((e) => console.error(e));

      return pals?.items ?? [];
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

  const handleAddPal = async (item: RecordModel) => {
    if (!item.id) {
      Alert.alert('Error', 'Poo profile ID not found');
      return;
    }

    try {
      await addPal(item.id);
      setAddPalsOpen(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add pal');
    }
  };

  const handleAddPalSheet = (item: RecordModel) => {
    const options = ['Add Pal', 'Cancel'];
    const cancelButtonIndex = 1;

    const title = 'Add Pal';
    const message = 'This person will need to approve your follow request.';

    showActionSheetWithOptions(
      {
        title,
        message,
        options,
        cancelButtonIndex,
        containerStyle: {
          backgroundColor: colors.background,
        },
        textStyle: {
          color: colors.foreground,
        },
      },
      (selectedIndex) => {
        switch (selectedIndex) {
          case 0:
            handleAddPal(item);
            break;

          case cancelButtonIndex:
          // Canceled
        }
      }
    );
  };

  return (
    <>
      {/* Add pals button */}
      <View className="mb-4 ml-4 max-w-36">
        <Pressable
          className="flex-row items-center justify-center gap-2 rounded-lg border-2 border-border bg-background"
          onPress={() => setAddPalsOpen(true)}>
          <Ionicons name="people" size={16} color={colors.foreground} />
          <Text className="text-sm">Add Pals</Text>
        </Pressable>
      </View>

      {/* Add pals modal */}
      <Modal
        animationType="slide"
        visible={addPalsOpen}
        onRequestClose={() => setAddPalsOpen(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1 gap-2">
            <View className="flex-row items-center justify-between px-4">
              <Pressable onPress={() => setAddPalsOpen(false)}>
                <Icon source="close" size={24} color={colors.foreground} />
              </Pressable>
              <Text className="text-xl font-semibold">Add Pals</Text>
            </View>
            <View className="flex-1 gap-2 px-4">
              <SearchInput
                placeholder="Search by nickname..."
                className="bg-muted-background border border-border"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {palsLoading && !!debouncedSearchQuery ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator />
                </View>
              ) : pals?.length ? (
                <View className="flex-1">
                  <FlashList
                    data={pals}
                    estimatedItemSize={100}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => {
                      return (
                        <Pressable
                          onPress={() => handleAddPalSheet(item)}
                          className={`flex-row items-center gap-2  ${index !== pals.length - 1 ? 'border-b border-border' : ''}`}>
                          <Avatar alt={item.codeName}>
                            <AvatarFallback>
                              <Text>{item.codeName.charAt(0)}</Text>
                            </AvatarFallback>
                          </Avatar>
                          <Text>{item.codeName}</Text>
                        </Pressable>
                      );
                    }}
                  />
                </View>
              ) : !palsLoading && pals?.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                  <Text>No pals found</Text>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center">
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
