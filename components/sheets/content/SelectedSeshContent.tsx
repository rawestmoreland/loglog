import { format, intervalToDuration } from 'date-fns';
import React from 'react';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import type { PoopSesh } from '~/lib/types';

export interface SelectedSeshContentProps {
  sesh: PoopSesh;
  onClose: () => void;
  colors: any;
  user: any;
  pooProfile: any;
}

const SelectedSeshContent = ({
  sesh,
  onClose,
  colors
}: SelectedSeshContentProps) => {
  return (
    <View className="flex-1">
      <View className="flex-1 gap-2">
        <View className="flex-row items-center justify-between gap-2 px-8">
          <Text className="font-semibold">
            {format(new Date(sesh.started), 'MM/dd/yyyy h:mm a')}
          </Text>
          <Button variant="plain" size="icon" onPress={onClose}>
            <Icon source="close" size={24} color={colors.foreground} />
          </Button>
        </View>

        <View className="relative flex-1 px-8">
          <View className="gap-2">
            <Text variant="title1" className="font-semibold">
              Sesh Details
            </Text>
            <Text>
              <Text className="font-semibold">Time:</Text>{' '}
              {format(new Date(sesh.started), 'h:mm a')}
            </Text>
            <Text>
              <Text className="font-semibold">Duration:</Text>{' '}
              {`${intervalToDuration({ start: new Date(sesh.started), end: new Date(sesh.ended!) })?.minutes ?? 0}m ${intervalToDuration({ start: new Date(sesh.started), end: new Date(sesh.ended!) })?.seconds ?? 0}s`}
            </Text>
            {sesh.revelations && (
              <Text>
                <Text className="font-semibold">Revelations:</Text> {sesh.revelations}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default SelectedSeshContent;