import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { DuringSeshView } from '../active/DuringSeshView';

import type { PoopSesh } from '~/lib/types';
import { useColorScheme } from '~/lib/useColorScheme';

export interface ActiveSeshContentProps {
  sesh: PoopSesh;
  isLoading: boolean;
  isSeshPending: boolean;
  onEnd: () => Promise<void>;
  poopForm: any;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
}

const ActiveSeshContent = ({
  sesh,
  isLoading,
  isSeshPending,
  onEnd,
  poopForm,
  updateActiveSesh,
}: ActiveSeshContentProps) => {
  const { colors } = useColorScheme();

  // Add effect to handle when session becomes null/undefined
  React.useEffect(() => {
    if (!sesh) {
      console.log('Active sesh is null or undefined in ActiveSeshContent');
    }
  }, [sesh]);

  // If we don't have a session object, show a loading indicator
  if (!sesh) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <DuringSeshView
          isLoading={isSeshPending}
          handleEndSesh={onEnd}
          poopForm={poopForm}
          activeSesh={sesh}
          updateActiveSesh={updateActiveSesh}
        />
      )}
    </View>
  );
};

export default ActiveSeshContent;
