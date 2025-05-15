import { useActionSheet } from '@expo/react-native-action-sheet';
import { differenceInMinutes, format } from 'date-fns';
import { router } from 'expo-router';
import React, { forwardRef, useMemo } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

import {
  ESTIMATED_ITEM_HEIGHT,
  List,
  ListDataItem,
  ListItem,
  ListRenderItemInfo,
  ListSectionHeader,
} from '~/components/nativewindui/List';
import { Sheet } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { useDeletePoop } from '~/hooks/api/usePoopSeshMutations';
import { useMyPoopSeshHistory } from '~/hooks/api/usePoopSeshQueries';
import { useColorScheme } from '~/lib/useColorScheme';

interface PoopHistorySheetProps {
  onViewPoop: (poopId: string) => void;
}

const PoopHistorySheet = forwardRef<any, PoopHistorySheetProps>(({ onViewPoop }, ref) => {
  const { colors } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();

  const { data: privateLogs, isLoading: isMyPoopSeshLoading } = useMyPoopSeshHistory();
  const deletePoopSesh = useDeletePoop();

  const isLoading = useMemo(() => {
    return isMyPoopSeshLoading || deletePoopSesh.isPending;
  }, [isMyPoopSeshLoading]);

  const handleDeletePoop = async (poopId: string) => {
    try {
      deletePoopSesh.mutateAsync({ poopId });
    } catch (error) {
      console.error(error);
      Alert.alert('Unable to delete this poop sesh');
    }
  };

  const handleActionSheet = (poopId: string) => {
    const options = ['View / Edit', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (selectedIndex?: number) => {
        if (selectedIndex === undefined) return;
        switch (selectedIndex) {
          case 0:
            onViewPoop(poopId);
            break;
          case destructiveButtonIndex:
            Alert.alert('Warning!', 'Are you sure you want to delete this poop sesh?', [
              {
                text: 'Flush it down (delete)',
                onPress: () => handleDeletePoop(poopId),
                style: 'destructive',
              },
              { text: 'Let it mellow (nevermind)', style: 'cancel' },
            ]);
            break;
          case cancelButtonIndex:
            // Cancel
            break;
        }
      }
    );
  };

  const logHistory = useMemo(() => {
    return [
      'My Logs',
      ...(privateLogs ?? [])
        .sort((a, b) => {
          return new Date(b.started).getTime() - new Date(a.started).getTime();
        })
        .map((log) => {
          const isPublic = log.is_public;
          const title = isPublic ? 'Public poop' : 'Private poop';
          const subTitle = format(new Date(log.started), 'MMM d, yyyy h:mm a');
          const poopInMinutes = log.ended ? differenceInMinutes(log.ended, log.started) : 0;
          return {
            id: log.id!,
            title,
            subTitle,
            poopInMinutes,
          };
        }),
    ];
  }, [privateLogs]);

  return (
    <Sheet ref={ref} snapPoints={['90%']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <List
          variant="insets"
          data={logHistory ?? []}
          estimatedItemSize={ESTIMATED_ITEM_HEIGHT.titleOnly}
          renderItem={(item) => renderItem(item, handleActionSheet)}
          keyExtractor={keyExtractor}
        />
      )}
    </Sheet>
  );
});

function renderItem<T extends ListDataItem>(
  info: ListRenderItemInfo<T>,
  handlePress: (id: string) => void
) {
  if (typeof info.item === 'string') {
    return <ListSectionHeader {...info} />;
  }
  return (
    <ListItem
      leftView={
        <View className="flex-1 justify-center px-4">
          <Text>💩</Text>
        </View>
      }
      rightView={
        <View className="flex-1 justify-center px-4">
          <Text variant="caption1" className="ios:px-0 px-2 text-muted-foreground">
            {info.item.poopInMinutes ?? 0}m
          </Text>
        </View>
      }
      {...info}
      onPress={() => {
        if (typeof info.item !== 'string') {
          handlePress(info.item.id);
        }
      }}
    />
  );
}

function keyExtractor(item: (Omit<ListDataItem, string> & { id: string }) | string) {
  return typeof item === 'string' ? item : item.id;
}

export default PoopHistorySheet;
