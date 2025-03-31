import { Ionicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { forwardRef } from 'react';
import { Pressable, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { Button } from '~/components/nativewindui/Button';
import { Sheet } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { useAuth } from '~/context/authContext';
import { COLORS } from '~/theme/colors';

const ProfileSheet = forwardRef(
  (
    {
      user,
      colors,
      onPoopPalsPress,
    }: {
      user: any;
      colors: any;
      onPoopPalsPress: () => void;
    },
    ref: any
  ) => {
    const { signOut } = useAuth();
    return (
      <Sheet
        ref={ref}
        enablePanDownToClose
        snapPoints={['50%', '90%']}
        handleComponent={() => <></>}>
        <BottomSheetView className="flex-1 p-4">
          {/* Header */}
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-xl font-semibold">Profile</Text>
            <Button
              style={{
                backgroundColor: COLORS.light.primary,
                height: 30,
                width: 30,
                borderRadius: 15,
              }}
              size="icon"
              onPress={() => ref.current?.dismiss()}>
              <Icon source="close" size={24} color={COLORS.dark.background} />
            </Button>
          </View>

          <View className="mb-4 max-w-36">
            <Pressable
              className="flex-row items-center justify-center gap-2 rounded-lg border-2 border-border bg-background"
              onPress={onPoopPalsPress}>
              <Ionicons name="people" size={16} color={colors.foreground} />
              <Text className="text-sm">Poop Pals</Text>
            </Pressable>
          </View>

          {/* Profile Content */}
          <View className="gap-4">
            <View>
              <Text className="text-sm text-gray-500">Code Name</Text>
              <Text className="text-lg">{user?.codeName}</Text>
            </View>

            {/* Add more profile fields as needed */}
            <View>
              <Text className="text-sm text-gray-500">Email</Text>
              <Text className="text-lg">{user?.email}</Text>
            </View>

            {/* Actions */}
            <View className="mt-6">
              <Button
                style={{ backgroundColor: COLORS.light.primary }}
                variant="primary"
                onPress={signOut}>
                <Text style={{ color: COLORS.light.foreground }}>Logout</Text>
              </Button>
            </View>
          </View>
        </BottomSheetView>
      </Sheet>
    );
  }
);

export default ProfileSheet;
