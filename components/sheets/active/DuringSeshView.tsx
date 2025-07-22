import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Keyboard, View, Image, Pressable, FlatList } from 'react-native';
import { Icon } from 'react-native-paper';

import { CompanyTimeToggle } from './CompanyTimeToggle';
import { PublicToggle } from './PublicToggle';

import { Timer } from '~/components/Timer';
import { Button } from '~/components/nativewindui/Button';
import { Stepper } from '~/components/nativewindui/Stepper';
import { Text } from '~/components/nativewindui/Text';
import { TextField } from '~/components/nativewindui/TextField';
import { useUpdatePlaceRating } from '~/hooks/api/useToiletRatingsMutations';
import { useToiletRatingForPlace } from '~/hooks/api/useToiletRatingsQueries';
import { bristolScoreToImage } from '~/lib/helpers';
import { usePocketBase } from '~/lib/pocketbaseConfig';
import type { PoopSesh } from '~/lib/types';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

type DuringSeshViewProps = {
  isLoading: boolean;
  handleEndSesh: () => Promise<void>;
  poopForm: {
    control: any; // Consider using proper react-hook-form types
  };
  activeSesh: PoopSesh;
  updateActiveSesh: (payload: Partial<PoopSesh>) => Promise<void>;
  userLocation?: {
    lat: number;
    lon: number;
  };
};

export function DuringSeshView({
  isLoading,
  handleEndSesh,
  poopForm,
  activeSesh,
  updateActiveSesh,
  userLocation,
}: DuringSeshViewProps) {
  const { pb } = usePocketBase();

  const { colors } = useColorScheme();

  const [locationType, setLocationType] = useState<
    | 'home'
    | 'office'
    | 'school'
    | 'gas_station'
    | 'gym'
    | 'hotel'
    | 'restaurant'
    | 'bar'
    | 'cafe'
    | 'other'
  >((activeSesh?.place?.place_type as any) || 'home');
  const [showPlacesView, setShowPlacesView] = useState(false);
  const [toiletName, setToiletName] = useState('');
  const [toiletResults, setToiletResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: toiletRating } = useToiletRatingForPlace(activeSesh?.place_id || '');
  const { mutateAsync: updateToiletRating } = useUpdatePlaceRating(activeSesh?.place_id || '');

  useEffect(() => {
    if (showPlacesView) {
      setToiletName(activeSesh?.place?.name || '');
    }
  }, [showPlacesView]);

  useEffect(() => {
    // Debounce the toilet name before we do any searching
    const debouncedSearch = setTimeout(async () => {
      if (!userLocation || !toiletName) return;
      setIsSearching(true);
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/forward?q=${toiletName}&access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}&proximity=${userLocation.lon},${userLocation.lat}`
      );
      if (response.ok) {
        const data = await response.json();
        setToiletResults(data.features);
        setIsSearching(false);
      } else {
        setIsSearching(false);
      }
    }, 1000);

    return () => clearTimeout(debouncedSearch);
  }, [toiletName]);

  const handlePlaceSelect = async (place: any) => {
    const existingPlace = await pb
      ?.collection('places')
      .getFirstListItem(`mapbox_place_id = "${place.properties?.mapbox_id}"`)
      .catch(() => null);
    if (!existingPlace) {
      const newPlace = await pb
        ?.collection('places')
        .create({
          mapbox_place_id: place.properties?.mapbox_id,
          name: place.properties?.name,
          address: place.properties?.address,
          place_formatted: place.properties?.place_formatted,
          location: {
            lat: place.geometry?.coordinates[1],
            lon: place.geometry?.coordinates[0],
          },
          place_type: locationType,
        })
        .catch(() => null);
      if (newPlace) {
        await updateActiveSesh({
          place_id: newPlace.id,
          place_type: locationType,
        });
      }
    } else {
      await updateActiveSesh({
        place_id: existingPlace.id,
        place_type: locationType,
      });
    }
    setShowPlacesView(false);
  };

  const handleRating = async (rating: number) => {
    await updateToiletRating({ rating });
  };

  return (
    <View className="relative flex-1 px-8">
      {showPlacesView ? (
        <View>
          <FlatList
            data={[
              { name: 'House' },
              { name: 'Office' },
              { name: 'School' },
              { name: 'Gas Station' },
              { name: 'Gym' },
              { name: 'Hotel' },
              { name: 'Restaurant' },
              { name: 'Bar' },
              { name: 'Cafe' },
              { name: 'Other+' },
            ]}
            renderItem={({ item }) => (
              <Pressable
                className={`m-1 flex-1 items-center rounded-md border border-gray-300 p-1 ${
                  locationType === item.name.toLowerCase() ? 'border-primary' : ''
                }`}
                style={{
                  borderColor:
                    locationType === item.name.toLowerCase() ? colors.primary : colors.grey3,
                  backgroundColor:
                    locationType === item.name.toLowerCase() ? colors.grey3 : colors.grey6,
                }}
                onPress={() => setLocationType(item.name.toLowerCase() as any)}>
                <Text className="text-center text-sm">{item.name}</Text>
              </Pressable>
            )}
            keyExtractor={(item) => item.name}
            ItemSeparatorComponent={() => <View className="h-2" />}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
          <View className="mb-4">
            <Text>Toilet Name</Text>
            <TextField
              placeholder="Toilet Name"
              value={toiletName}
              onChangeText={setToiletName}
              className="rounded-md border border-gray-300"
            />
          </View>
          <View style={{ height: 300 }}>
            <FlatList
              data={toiletResults}
              ListEmptyComponent={isSearching ? <Text>Searching...</Text> : <View />}
              ItemSeparatorComponent={() => <View className="h-2" />}
              renderItem={({ item }) => (
                <Pressable
                  className="flex-row items-center gap-2 rounded-md border border-gray-300 p-4"
                  onPress={() => handlePlaceSelect(item)}>
                  <View className="rounded-full p-2" style={{ backgroundColor: colors.primary }}>
                    <Icon source="toilet" size={24} color={COLORS.black} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold">{item.properties?.name}</Text>
                    <Text className="text-sm text-gray-600">{item.properties?.address}</Text>
                    <Text className="text-sm text-gray-500" numberOfLines={2}>
                      {item.properties?.place_formatted}
                    </Text>
                  </View>
                </Pressable>
              )}
              keyExtractor={(item) => item.properties?.mapbox_id}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator
            />
          </View>
        </View>
      ) : (
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold">Log Details</Text>
            <PublicToggle
              isLoading={isLoading}
              activeSesh={activeSesh}
              updateActiveSesh={updateActiveSesh}
            />
          </View>
          <Timer startTime={new Date(activeSesh.started)} />
          <Controller
            control={poopForm.control}
            name="revelations"
            render={({ field }) => (
              <TextField
                className="h-20 rounded-md border border-gray-300"
                onChangeText={field.onChange}
                returnKeyType="done"
                submitBehavior="blurAndSubmit"
                onSubmitEditing={() => Keyboard.dismiss()}
                value={field.value}
                label="Revelations"
                placeholder="How will we change the world?"
                multiline
                maxLength={160}
                numberOfLines={4}
              />
            )}
          />
          <CompanyTimeToggle
            isLoading={isLoading}
            activeSesh={activeSesh}
            updateActiveSesh={updateActiveSesh}
          />
          <Pressable
            className="flex-row items-center justify-between"
            onPress={() => setShowPlacesView(true)}>
            <Text>{activeSesh?.place?.name || 'Name your toilet'}</Text>
            <Icon source="chevron-right" size={24} color={colors.primary} />
          </Pressable>
          {activeSesh?.place?.name && (
            <Pressable className="flex-row items-center justify-between">
              <Text>Rate Toilet</Text>
              <View className="flex-row items-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      handleRating(index + 1);
                    }}>
                    <Icon
                      source="star"
                      size={24}
                      color={index < (toiletRating?.rating || 0) ? colors.primary : colors.grey3}
                    />
                  </Pressable>
                ))}
              </View>
            </Pressable>
          )}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="">Bristol Score</Text>
              <Link href="/bristol">
                <Icon source="information-outline" size={16} color={colors.primary} />
              </Link>
            </View>
            <View className="flex-row items-center gap-2">
              <Controller
                control={poopForm.control}
                name="bristol_score"
                defaultValue={0}
                render={({ field }) => (
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center gap-2">
                      <Text>{field.value || ''}</Text>
                      {field.value ? (
                        <Image
                          source={bristolScoreToImage(field.value || 0)}
                          className="h-10 w-10"
                          resizeMode="contain"
                        />
                      ) : (
                        <Text>No Score</Text>
                      )}
                    </View>
                    <Stepper
                      subtractButton={{
                        disabled: field.value === 0,
                        onPress: () => {
                          const newValue = (field.value || 0) - 1;
                          if (newValue >= 0) {
                            field.onChange(newValue);
                          }
                        },
                      }}
                      addButton={{
                        disabled: field.value === 7,
                        onPress: () => {
                          const newValue = (field.value || 0) + 1;
                          if (newValue <= 7) {
                            field.onChange(newValue);
                          }
                        },
                      }}
                    />
                  </View>
                )}
              />
            </View>
          </View>
          <Button
            style={{ backgroundColor: colors.primary }}
            onPress={handleEndSesh}
            disabled={isLoading}>
            <Text style={{ color: COLORS.light.foreground }}>
              {isLoading ? 'Hold on...' : 'Pinch it Off'}
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
}
