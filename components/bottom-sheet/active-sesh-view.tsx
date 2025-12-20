import CountUpTimer from '@/components/count-up-timer';
import { FlightInfoForm } from '@/components/flight-info-form';
import { useSesh } from '@/context/seshContext';
import { toast } from 'burnt';
import { memo, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
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
import { useThemeColor } from '@/hooks/use-theme-color';
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
    activeSesh?.place?.id ?? ''
  );
  const { data: toiletRating } = useToiletRatingForPlace(
    activeSesh?.place_id || ''
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
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
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
      <YStack gap='$2' mb='$4'>
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
                      activeSesh.arrival_airport
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
        <Button mt='$4' theme='accent' onPress={handleEndSesh}>
          Pinch it off
        </Button>
        <Button mt='$2' theme='red' onPress={handleDeleteSesh}>
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
  const foreground = useThemeColor({}, 'foreground');

  const [toiletName, setToiletName] = useState('');
  const [toiletResults, setToiletResults] = useState<any>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
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
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handlePlaceSelect = async (place: any) => {
    if (!selectedPlace) {
      if (toiletName) {
        // Update the active sesh with the toilet name if there's no place selected
        await updateActiveSesh({
          place_id: null,
          place_type: locationType,
          custom_place_name: toiletName,
        });
      }
    } else {
      // Update the active sesh with the place
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
          custom_place_name: null,
          place_id: existingPlace.id,
          place_type: locationType,
        });
      }
    }
    onClose();
  };

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

  const screenWidth = Dimensions.get('window').width;
  // Account for container padding (approximately 32px total) and margins between items
  const itemWidth = (screenWidth - 40) / 3 - 2;
  const fullWidth = screenWidth - 40 - 2; // Full width minus container padding and margins

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack gap='$2'>
        <XStack justify='space-between' items='center'>
          <Pressable
            aria-label='Close'
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              scale: pressed ? 0.95 : 1,
              backgroundColor: Colors[scheme].primary as any,
              color: Colors[scheme].primaryForeground as any,
              padding: 10,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            })}
            onPress={onClose}
          >
            <X
              size={14}
              pointerEvents='none'
              color={Colors[scheme].primaryForeground as any}
            />
          </Pressable>
          {(toiletName || selectedPlace) && (
            <Pressable onPress={() => handlePlaceSelect(selectedPlace)}>
              <Text style={{ color: foreground as string }}>Save</Text>
            </Pressable>
          )}
        </XStack>
        <FlatList
          data={locationTypes}
          renderItem={({ item, index }) => {
            // Check if this is the last item and it's alone in its row
            // If length % 3 === 1, the last row has exactly 1 item
            const isLastItem = index === locationTypes.length - 1;
            const isAloneInRow = isLastItem && locationTypes.length % 3 === 1;
            const width = isAloneInRow ? fullWidth : itemWidth;

            return (
              <Pressable
                style={{
                  width: width,
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
                  backgroundColor: Colors[scheme].card as string,
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
          contentContainerStyle={{ paddingBottom: 16 }}
        />
        <YStack gap='$2'>
          <XStack items='center' justify='space-between'>
            <Label htmlFor='toilet-name'>Toilet Name</Label>
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
            placeholder='Name your toilet'
            value={toiletName}
            onChangeText={setToiletName}
          />
        </YStack>
        <View style={{ height: 300 }}>
          <FlatList
            data={toiletResults}
            ListEmptyComponent={
              isSearching ? <Text>Searching...</Text> : <View />
            }
            ItemSeparatorComponent={() => <Square size={10} />}
            renderItem={({ item }) => (
              <ListItem
                icon={() => (
                  <View
                    style={{
                      backgroundColor: Colors[scheme].primary as string,
                      borderColor: Colors[scheme].primary as string,
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 5,
                    }}
                  >
                    <Toilet size={20} />
                  </View>
                )}
                title={item.properties?.name}
                subTitle={item.properties?.address}
                onPress={() => setSelectedPlace(item)}
                iconAfter={
                  item.properties?.mapbox_id ===
                  selectedPlace?.properties?.mapbox_id ? (
                    <View
                      style={{
                        borderColor: Colors[scheme].primary as string,
                        backgroundColor: Colors[scheme].primary as string,
                        borderRadius: '50%',
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
            )}
            keyExtractor={(item) => item.properties?.mapbox_id}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator
          />
        </View>
      </YStack>
    </KeyboardAvoidingView>
  );
};

// Memoize to prevent re-renders when parent re-renders but props haven't changed
// Note: Component will still re-render when useSesh() context changes
export const ActiveSeshView = memo(ActiveSeshViewComponent);
