import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconProps } from '@roninoss/icons';
import { Tabs } from 'expo-router';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  PressableProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Timer } from '~/components/Timer';
import { Badge } from '~/components/nativewindui/Badge';
import { Button } from '~/components/nativewindui/Button';
import { Sheet } from '~/components/nativewindui/Sheet';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';
import { Toggle } from '~/components/nativewindui/Toggle';
import { useSesh } from '~/context/seshContext';
import { cn } from '~/lib/cn';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import { PoopSesh } from '~/lib/types';
import { useColorScheme } from '~/lib/useColorScheme';

export default function TabLayout() {
  const { colors } = useColorScheme();

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const { startSesh, activeSesh, endSesh, isLoadingActiveSesh, poopForm, updateActiveSesh } =
    useSesh();

  const openBottomSheet = () => {
    bottomSheetModalRef.current?.present();
    setIsBottomSheetOpen(true);
  };

  const handleStartSesh = async () => {
    // Can't do two poops at once
    if (activeSesh) return;

    await startSesh();
  };

  const handleEndSesh = async () => {
    if (!activeSesh) return;

    await endSesh();
  };

  return (
    <>
      <Tabs
        tabBar={TAB_BAR}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarIcon(props) {
              return <Icon name="home" {...props} size={27} />;
            },
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: 'Log',
            tabBarButton: (props) => (
              <TouchableOpacity
                className="-mt-2 flex-1 items-center justify-center"
                onPress={openBottomSheet}>
                <Icon name="plus" {...props} size={27} color={colors.primary} />
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>
      <Sheet ref={bottomSheetModalRef} snapPoints={activeSesh ? ['80%'] : ['50%', '75%']}>
        <BottomSheetView className="flex-1">
          {isLoadingActiveSesh ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : activeSesh ? (
            <DuringSeshView
              handleEndSesh={handleEndSesh}
              poopForm={poopForm}
              activeSesh={activeSesh}
              updateActiveSesh={updateActiveSesh}
            />
          ) : (
            <View className="relative flex-1 px-8">
              <View>
                <Button onPress={handleStartSesh}>
                  <Text>Start a Log</Text>
                </Button>
              </View>
            </View>
          )}
        </BottomSheetView>
      </Sheet>
    </>
  );
}

const TAB_BAR = Platform.select({
  ios: undefined,
  android: (props: BottomTabBarProps) => <MaterialTabBar {...props} />,
});

const TAB_ICON = {
  index: 'home',
  log: 'plus',
} as const;

function MaterialTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useColorScheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingBottom: insets.bottom + 12,
      }}
      className="border-t-border/25 flex-row border-t bg-card pb-4 pt-3 dark:border-t-0">
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <MaterialTabItem
            key={route.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            name={TAB_ICON[route.name as keyof typeof TAB_ICON]}
            isFocused={isFocused}
            badge={options.tabBarBadge}
            label={
              typeof label === 'function'
                ? label({
                    focused: isFocused,
                    color: isFocused ? colors.foreground : colors.grey2,
                    children: options.title ?? route.name ?? '',
                    position: options.tabBarLabelPosition ?? 'below-icon',
                  })
                : label
            }
          />
        );
      })}
    </View>
  );
}

function MaterialTabItem({
  isFocused,
  name = 'star',
  badge,
  className,
  label,
  ...pressableProps
}: {
  isFocused: boolean;
  name: IconProps<'material'>['name'];
  label: string | React.ReactNode;
  badge?: number | string;
} & Omit<PressableProps, 'children'>) {
  const { colors } = useColorScheme();
  const isFocusedDerived = useDerivedValue(() => isFocused);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      transform: [{ scaleX: withTiming(isFocusedDerived.value ? 1 : 0, { duration: 200 }) }],
      opacity: withTiming(isFocusedDerived.value ? 1 : 0, { duration: 200 }),
      bottom: 0,
      top: 0,
      left: 0,
      right: 0,
      borderRadius: 100,
    };
  });
  return (
    <Pressable className={cn('flex-1 items-center', className)} {...pressableProps}>
      <View className="h-8 w-16 items-center justify-center overflow-hidden rounded-full ">
        <Animated.View style={animatedStyle} className="bg-secondary/70 dark:bg-secondary" />
        <View>
          <Icon
            ios={{ useMaterialIcon: true }}
            size={24}
            name={name}
            color={isFocused ? colors.foreground : colors.grey2}
          />
          {!!badge && <Badge>{badge}</Badge>}
        </View>
      </View>
      <Text variant="caption2" className={cn('pt-1', !isFocused && 'text-muted-foreground')}>
        {label}
      </Text>
    </Pressable>
  );
}

function PublicToggle({
  activeSesh,
  updateActiveSesh,
}: {
  activeSesh: PoopSesh;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
}) {
  const { pb } = usePocketBase();

  const [isPublic, setIsPublic] = useState(activeSesh.is_public);

  useEffect(() => {
    const updateActiveSesh = async () => {
      await pb?.collection('poop_seshes').update(activeSesh.id!, { is_public: isPublic });
    };

    updateActiveSesh();
  }, [isPublic]);

  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm">Public log?</Text>
      <Toggle value={isPublic} onValueChange={() => setIsPublic(!isPublic)} />
    </View>
  );
}

function DuringSeshView({
  handleEndSesh,
  poopForm,
  activeSesh,
  updateActiveSesh,
}: {
  handleEndSesh: () => Promise<void>;
  poopForm: any;
  activeSesh: PoopSesh;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
}) {
  return (
    <View className="relative flex-1 px-8">
      <View className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold">Log Details</Text>
          <PublicToggle activeSesh={activeSesh} updateActiveSesh={updateActiveSesh} />
        </View>
        <Timer startTime={new Date(activeSesh.started)} />
        <Controller
          control={poopForm.control}
          name="revelations"
          render={({ field }) => (
            <TextField
              className="h-20 rounded-md border border-gray-300"
              onChangeText={field.onChange}
              value={field.value}
              label="Revelations"
              placeholder="How will we change the world?"
              multiline
              maxLength={160}
              numberOfLines={4}
            />
          )}
        />
        <Button onPress={handleEndSesh}>
          <Text>Pinch it Off</Text>
        </Button>
      </View>
    </View>
  );
}
