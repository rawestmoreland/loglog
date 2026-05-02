import CountUpTimer from '@/components/count-up-timer';
import { FlightInfoForm } from '@/components/flight-info-form';
import { useSesh } from '@/context/seshContext';
import { toast } from 'burnt';
import { memo, useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  Button,
  Image,
  Input,
  Label,
  ListItem,
  Separator,
  Spinner,
  Square,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui';

import { LogSwitch } from '@/components/ui/log-switch';
import { BRISTOL_SCORE_OPTIONS } from '@/constants';
import { SheetType } from '@/constants/sheet';
import { Colors } from '@/constants/theme';
import { useLocation } from '@/context/locationContext';
import { useNetwork } from '@/context/networkContext';
import { useUpdatePlaceRating } from '@/hooks/api/useToiletRatingsMutations';
import { useToiletRatingForPlace } from '@/hooks/api/useToiletRatingsQueries';
import { formatFlightRoute } from '@/lib/flight-helpers';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { PoopSesh } from '@/lib/types';
import {
  Check,
  ChevronRight,
  Circle,
  CircleHelp,
  KeyboardOff,
  Plane,
  Toilet,
  X,
} from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

function ActiveSeshViewComponent({
  modal = false,
  isPercent = false,
  innerOpen = false,
  setInnerOpen = () => {},
  setOpen = () => {},
  setSheetType,
}: {
  modal?: boolean;
  isPercent?: boolean;
  innerOpen?: boolean;
  setInnerOpen?: (open: boolean) => void;
  setOpen?: (open: boolean) => void;
  setSheetType?: (type: SheetType) => void;
}) {
  const { isConnected } = useNetwork();
  const scheme = useColorScheme() ?? 'light';

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const { activeSesh, endSesh, updateActiveSesh, cancelActiveSesh, poopForm } =
    useSesh();

  const { mutateAsync: updateToiletRating } = useUpdatePlaceRating(
    activeSesh?.place?.id ?? '',
  );
  const { data: toiletRating } = useToiletRatingForPlace(
    activeSesh?.place_id || '',
  );

  const [placeViewOpen, setPlaceViewOpen] = useState(false);
  const [flightInfoOpen, setFlightInfoOpen] = useState(false);
  const [revelations, setRevelations] = useState('');
  const [bristolScore, setBristolScore] = useState({
    value: 0,
    label: 'No Score Yet',
    image: null,
  });

  useEffect(() => {
    if (revelations !== poopForm.getValues('revelations')) {
      poopForm.setValue('revelations', revelations);
    }
    if (bristolScore.value !== poopForm.getValues('bristol_score')) {
      poopForm.setValue('bristol_score', bristolScore.value);
    }
  }, [bristolScore, revelations, poopForm]);

  const handleEndSesh = async () => {
    await endSesh();
    setSheetType?.(SheetType.HOME);
    toast({
      title: 'Sesh ended',
      message: 'Your sesh has been ended',
      preset: 'done',
      haptic: 'success',
    });
  };

  const handleDeleteSesh = async () => {
    await cancelActiveSesh();
    setSheetType?.(SheetType.HOME);
  };

  const handleRating = async (rating: number) => {
    await updateToiletRating({ rating });
  };

  const handleSaveFlightInfo = async (flightData: {
    flight_number: string;
    airline: string;
    departure_airport: string;
    arrival_airport: string;
  }) => {
    await updateActiveSesh(flightData);
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      },
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return flightInfoOpen ? (
    <FlightInfoForm
      onSave={handleSaveFlightInfo}
      onClose={() => setFlightInfoOpen(false)}
      initialData={{
        flight_number: activeSesh?.flight_number,
        airline: activeSesh?.airline,
        departure_airport: activeSesh?.departure_airport,
        arrival_airport: activeSesh?.arrival_airport,
      }}
    />
  ) : placeViewOpen ? (
    <PlaceView
      activeSesh={activeSesh!}
      onClose={() => setPlaceViewOpen(false)}
    />
  ) : (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <YStack gap='$2'>
          <XStack justify='space-between'>
            <Text fontWeight={'bold'}>Log Details</Text>
            {activeSesh?.is_local && <Text theme='red'>Local log</Text>}
            <XStack items='center' gap='$2'>
              <Label size='$2' htmlFor='public-log'>
                Public log?
              </Label>
              <Separator minH={20} vertical />
              <LogSwitch
                id='public-log'
                key='public-log'
                size='$2'
                checked={activeSesh?.is_public}
                defaultChecked={activeSesh?.is_public}
                onCheckedChange={(value) =>
                  updateActiveSesh({ is_public: value })
                }
              />
            </XStack>
          </XStack>
          <CountUpTimer startTime={(activeSesh?.started as string) ?? ''} />
          <YStack>
            <XStack justify='space-between' items='center'>
              <Label>Revelations</Label>
              {isKeyboardVisible && (
                <Button
                  size='$2'
                  bg={Colors[scheme].primary as any}
                  onPress={() => Keyboard.dismiss()}
                >
                  <KeyboardOff size={18} pointerEvents='none' />
                </Button>
              )}
            </XStack>
            <TextArea
              value={revelations}
              onChangeText={setRevelations}
              placeholder='How will we change the world?'
              size='$4'
            />
          </YStack>
          <YStack gap='$2'>
            {activeSesh?.is_airplane ? (
              <ListItem
                title={
                  activeSesh?.flight_number
                    ? `Flight ${activeSesh.flight_number}`
                    : 'Add flight details'
                }
                subTitle={
                  activeSesh?.airline
                    ? `${activeSesh.airline} • ${formatFlightRoute(
                        activeSesh.departure_airport,
                        activeSesh.arrival_airport,
                      )}`
                    : undefined
                }
                icon={Plane}
                iconAfter={ChevronRight}
                onPress={() => setFlightInfoOpen(true)}
              />
            ) : (
              <>
                {isConnected === true && (
                  <ListItem
                    title={
                      activeSesh?.place?.name ||
                      activeSesh?.custom_place_name ||
                      'Name your toilet'
                    }
                    icon={Toilet}
                    iconAfter={ChevronRight}
                    onPress={() => setPlaceViewOpen(true)}
                  />
                )}
                {activeSesh?.place && (
                  <XStack items='center' justify='space-between'>
                    <Label htmlFor='rate-your-toilet'>Rate your toilet</Label>
                    <XStack id='rate-your-toilet' gap='$2'>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Pressable
                          key={index}
                          onPress={() => {
                            handleRating(index + 1);
                          }}
                        >
                          <Icon
                            name='star'
                            size={18}
                            color={
                              index < (toiletRating?.rating || 0)
                                ? (Colors[scheme].primary as string)
                                : (Colors[scheme].border as string)
                            }
                          />
                        </Pressable>
                      ))}
                    </XStack>
                  </XStack>
                )}
              </>
            )}
          </YStack>
          <XStack items='center' justify='space-between'>
            <Label htmlFor='is-airplane'>Airplane?</Label>
            <LogSwitch
              id='is-airplane'
              key='is-airplane'
              size='$3'
              checked={activeSesh?.is_airplane}
              defaultChecked={activeSesh?.is_airplane}
              onCheckedChange={(value) =>
                updateActiveSesh({ is_airplane: value })
              }
            />
          </XStack>
          <XStack items='center' justify='space-between'>
            <Label htmlFor='company-time'>On company time?</Label>
            <LogSwitch
              id='company-time'
              key='company-time'
              size='$3'
              checked={activeSesh?.company_time}
              defaultChecked={activeSesh?.company_time}
              onCheckedChange={(value) =>
                updateActiveSesh({ company_time: value })
              }
            />
          </XStack>
          <YStack gap='$2'>
            <XStack items='center' gap='$2'>
              <Text>Bristol Score:</Text>
              <Button
                chromeless
                size='$3'
                icon={CircleHelp}
                onPress={() => router.push('/bristol')}
              />
            </XStack>
            <XStack gap='$2' flexWrap='wrap'>
              {BRISTOL_SCORE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() =>
                    setBristolScore({
                      value: option.value,
                      label: option.label,
                      image: option.image,
                    })
                  }
                  style={{
                    borderWidth: 1,
                    padding: 5,
                    borderRadius: 10,
                    backgroundColor:
                      bristolScore.value === option.value
                        ? (Colors[scheme].primary as string)
                        : 'transparent',
                  }}
                >
                  <Image
                    source={option.image}
                    style={{
                      width: 50,
                      height: 35,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
      <YStack gap='$2' mt='$2' pb='$2'>
        <Button theme='accent' onPress={handleEndSesh}>
          Pinch it off
        </Button>
        <Button theme='red' onPress={handleDeleteSesh}>
          Cancel
        </Button>
      </YStack>
    </KeyboardAvoidingView>
  );
}

const PlaceView = ({
  activeSesh,
  onClose,
}: {
  activeSesh: PoopSesh;
  onClose: () => void;
}) => {
  const [toiletName, setToiletName] = useState('');
  const [toiletResults, setToiletResults] = useState<any>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [locationType, setLocationType] = useState<
    | 'house'
    | 'office'
    | 'school'
    | 'gas_station'
    | 'gym'
    | 'hotel'
    | 'restaurant'
    | 'bar'
    | 'cafe'
    | 'other'
  >((activeSesh?.place?.place_type as any) || 'house');
  const scheme = useColorScheme() ?? 'light';
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const { userLocation } = useLocation();
  const { updateActiveSesh } = useSesh();
  const { pb } = usePocketBase();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSaveCustomName = async () => {
    if (!toiletName.trim()) return;
    setIsSaving(true);
    await updateActiveSesh({
      place_id: null,
      place_type: locationType,
      custom_place_name: toiletName.trim(),
    });
    setIsSaving(false);
    onClose();
  };

  const handleSavePlace = async () => {
    if (!selectedPlace) return;
    setIsSaving(true);
    const existingPlace = await pb
      ?.collection('places')
      .getFirstListItem(
        `mapbox_place_id = "${selectedPlace.properties?.mapbox_id}"`,
      )
      .catch(() => null);
    if (!existingPlace) {
      const newPlace = await pb
        ?.collection('places')
        .create({
          mapbox_place_id: selectedPlace.properties?.mapbox_id,
          name: selectedPlace.properties?.name,
          address: selectedPlace.properties?.address,
          place_formatted: selectedPlace.properties?.place_formatted,
          location: {
            lat: selectedPlace.geometry?.coordinates[1],
            lon: selectedPlace.geometry?.coordinates[0],
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
        custom_place_name: null,
        place_id: existingPlace.id,
        place_type: locationType,
      });
    }
    setIsSaving(false);
    onClose();
  };

  useEffect(() => {
    const debouncedSearch = setTimeout(async () => {
      if (!userLocation || !toiletName) {
        setToiletResults([]);
        return;
      }
      setIsSearching(true);
      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/forward?q=${toiletName}&access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}&proximity=${userLocation.lon},${userLocation.lat}`,
      );
      if (response.ok) {
        const data = await response.json();
        setToiletResults(data.features);
      }
      setIsSearching(false);
    }, 1000);

    return () => clearTimeout(debouncedSearch);
  }, [toiletName, userLocation]);

  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 40) / 3 - 2;
  const fullWidth = screenWidth - 40 - 2;

  const locationTypes = [
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
  ];

  const hasCustomName = toiletName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack gap='$3'>
        {/* Header */}
        <XStack items='center' gap='$3'>
          <Pressable
            aria-label='Close'
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              backgroundColor: Colors[scheme].primary as any,
              padding: 10,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
            })}
            onPress={onClose}
          >
            <X
              size={14}
              pointerEvents='none'
              color={Colors[scheme].primaryForeground as any}
            />
          </Pressable>
          <Text fontWeight='bold' fontSize='$5'>
            Name Your Toilet
          </Text>
        </XStack>

        {/* Location type grid */}
        <FlatList
          data={locationTypes}
          renderItem={({ item, index }) => {
            const isLastItem = index === locationTypes.length - 1;
            const isAloneInRow = isLastItem && locationTypes.length % 3 === 1;
            const width = isAloneInRow ? fullWidth : itemWidth;
            return (
              <Pressable
                style={{
                  width,
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: 1,
                  borderWidth: 1,
                  padding: 5,
                  borderRadius: 10,
                  borderColor:
                    locationType === item.name.toLowerCase()
                      ? (Colors[scheme].primary as string)
                      : (Colors[scheme].border as string),
                  backgroundColor:
                    locationType === item.name.toLowerCase()
                      ? (Colors[scheme].secondary as string)
                      : (Colors[scheme].card as string),
                }}
                onPress={() => setLocationType(item.name.toLowerCase() as any)}
              >
                <Text numberOfLines={2} adjustsFontSizeToFit>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
          keyExtractor={(item) => item.name}
          ItemSeparatorComponent={() => (
            <View style={{ height: 2, width: 2 }} />
          )}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        />

        {/* Custom name input */}
        <YStack gap='$2'>
          <XStack justify='space-between' items='center'>
            <Label htmlFor='toilet-name'>Give it a name</Label>
            {isKeyboardVisible && (
              <Button
                size='$2'
                bg={Colors[scheme].primary as any}
                onPress={() => Keyboard.dismiss()}
              >
                <KeyboardOff size={18} pointerEvents='none' />
              </Button>
            )}
          </XStack>
          <Input
            id='toilet-name'
            placeholder="e.g. Home, McDonald's on Main..."
            value={toiletName}
            onChangeText={(text) => {
              setToiletName(text);
              if (selectedPlace) setSelectedPlace(null);
            }}
          />
          {/* Save custom name — always visible once user has typed */}
          {hasCustomName && !selectedPlace && (
            <Button
              bg={Colors[scheme].primary as any}
              color={Colors[scheme].primaryForeground as any}
              onPress={handleSaveCustomName}
              disabled={isSaving}
              icon={isSaving ? <Spinner size='small' /> : undefined}
            >
              Save as &quot;{toiletName.trim()}&quot;
            </Button>
          )}
        </YStack>

        {/* Optional place search */}
        <YStack gap='$2'>
          <XStack items='center' gap='$2'>
            <Text
              fontSize='$3'
              fontWeight='600'
              color={Colors[scheme].textSecondary as any}
              textTransform='uppercase'
            >
              Or pick a nearby place
            </Text>
            <Text fontSize='$2' color={Colors[scheme].textTertiary as any}>
              (optional)
            </Text>
          </XStack>

          {/* Selected place banner */}
          {selectedPlace && (
            <XStack
              bg={Colors[scheme].secondary as any}
              borderColor={Colors[scheme].primary as any}
              borderWidth={1}
              p='$3'
              items='center'
              justify='space-between'
              gap='$2'
              style={{ borderRadius: 8 }}
            >
              <YStack flex={1}>
                <Text fontWeight='600' numberOfLines={1}>
                  {selectedPlace.properties?.name}
                </Text>
                {selectedPlace.properties?.address && (
                  <Text
                    fontSize='$2'
                    color={Colors[scheme].textSecondary as any}
                    numberOfLines={1}
                  >
                    {selectedPlace.properties.address}
                  </Text>
                )}
              </YStack>
              <Pressable onPress={() => setSelectedPlace(null)}>
                <X size={16} color={Colors[scheme].textSecondary as any} />
              </Pressable>
            </XStack>
          )}

          {/* Save selected place */}
          {selectedPlace && (
            <Button
              bg={Colors[scheme].primary as any}
              color={Colors[scheme].primaryForeground as any}
              onPress={handleSavePlace}
              disabled={isSaving}
              icon={isSaving ? <Spinner size='small' /> : undefined}
            >
              Save &quot;{selectedPlace.properties?.name}&quot;
            </Button>
          )}

          <View style={{ height: 220 }}>
            <FlatList
              data={toiletResults}
              ListEmptyComponent={
                <YStack items='center' p='$4'>
                  {isSearching ? (
                    <XStack items='center' gap='$2'>
                      <Spinner size='small' />
                      <Text color={Colors[scheme].textSecondary as any}>
                        Searching nearby...
                      </Text>
                    </XStack>
                  ) : hasCustomName ? (
                    <Text
                      color={Colors[scheme].textSecondary as any}
                      fontSize='$3'
                      style={{ textAlign: 'center' }}
                    >
                      No nearby places found. Use the button above to save your
                      custom name.
                    </Text>
                  ) : (
                    <Text
                      color={Colors[scheme].textSecondary as any}
                      fontSize='$3'
                      style={{ textAlign: 'center' }}
                    >
                      Type a name above to search for nearby places.
                    </Text>
                  )}
                </YStack>
              }
              ItemSeparatorComponent={() => <Square size={6} />}
              renderItem={({ item }) => {
                const isSelected =
                  selectedPlace?.properties?.mapbox_id ===
                  item.properties?.mapbox_id;
                return (
                  <View
                    style={
                      isSelected
                        ? {
                            backgroundColor: Colors[scheme].secondary as string,
                            borderRadius: 8,
                          }
                        : undefined
                    }
                  >
                    <ListItem
                      icon={() => (
                        <View
                          style={{
                            backgroundColor: Colors[scheme].primary as string,
                            borderRadius: 10,
                            padding: 5,
                          }}
                        >
                          <Toilet size={20} />
                        </View>
                      )}
                      title={item.properties?.name}
                      subTitle={item.properties?.address}
                      onPress={() => setSelectedPlace(isSelected ? null : item)}
                      iconAfter={
                        isSelected ? (
                          <View
                            style={{
                              borderColor: Colors[scheme].primary as string,
                              backgroundColor: Colors[scheme].primary as string,
                              borderRadius: 999,
                              padding: 5,
                            }}
                          >
                            <Check size={14} color='black' />
                          </View>
                        ) : (
                          <Circle size={20} />
                        )
                      }
                    />
                  </View>
                );
              }}
              keyExtractor={(item) => item.properties?.mapbox_id}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator
            />
          </View>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
};

// Memoize to prevent re-renders when parent re-renders but props haven't changed
// Note: Component will still re-render when useSesh() context changes
export const ActiveSeshView = memo(ActiveSeshViewComponent);
