import { LogSwitch } from '@/components/ui/log-switch';
import { BRISTOL_SCORE_OPTIONS } from '@/constants';
import { SheetContentProps, SheetType } from '@/constants/sheet';
import {
  useDeletePoop,
  useUpdatePoopSesh,
} from '@/hooks/api/usePoopSeshMutations';
import { usePoopSesh } from '@/hooks/api/usePoopSeshQueries';
import {
  validateAirportCode,
  validateFlightNumber,
} from '@/lib/flight-helpers';
import { PoopSesh } from '@/lib/types';
import { CircleHelp, Plane, X } from '@tamagui/lucide-icons';
import { toast } from 'burnt';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import DatePicker from 'react-native-date-picker';
import {
  AlertDialog,
  Button,
  Image,
  Input,
  Label,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
} from 'tamagui';

export function PoopDetailsView({
  modal = false,
  isPercent = false,
  innerOpen = false,
  setInnerOpen = () => {},
  setOpen = () => {},
  poopDetailsId,
  setPoopDetailsId,
  setSheetType,
}: SheetContentProps) {
  const router = useRouter();

  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);

  const [revelations, setRevelations] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [departureAirport, setDepartureAirport] = useState('');
  const [arrivalAirport, setArrivalAirport] = useState('');

  const { data: poopDetails, isLoading } = usePoopSesh(poopDetailsId ?? null, {
    enabled: !!poopDetailsId,
  });

  const updateSeshMutation = useUpdatePoopSesh();
  const deleteSeshMutation = useDeletePoop();

  const timeoutRef = useRef<number | null>(null);

  const handleUpdateSesh = useCallback(
    async (data: Partial<PoopSesh>) => {
      updateSeshMutation.mutate({
        poopSesh: {
          ...(poopDetails as PoopSesh),
          ...data,
        },
      });
    },
    [poopDetails, updateSeshMutation]
  );

  useEffect(() => {
    if (poopDetails?.revelations) {
      setRevelations(poopDetails.revelations);
    }
    if (poopDetails?.flight_number) {
      setFlightNumber(poopDetails.flight_number);
    }
    if (poopDetails?.airline) {
      setAirline(poopDetails.airline);
    }
    if (poopDetails?.departure_airport) {
      setDepartureAirport(poopDetails.departure_airport);
    }
    if (poopDetails?.arrival_airport) {
      setArrivalAirport(poopDetails.arrival_airport);
    }
  }, [
    poopDetails?.revelations,
    poopDetails?.flight_number,
    poopDetails?.airline,
    poopDetails?.departure_airport,
    poopDetails?.arrival_airport,
  ]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (poopDetails && revelations !== poopDetails.revelations) {
        handleUpdateSesh({ revelations });
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [revelations, poopDetails, handleUpdateSesh]);

  const handleDelete = async () => {
    await deleteSeshMutation.mutateAsync({ poopId: poopDetails?.id ?? '' });
    setSheetType?.(SheetType.POOP_HISTORY);
  };

  useEffect(() => {
    if (updateSeshMutation.isSuccess) {
      toast({
        title: 'Success',
        message: 'Sesh updated successfully',
        preset: 'done',
      });
    }
  }, [updateSeshMutation.isSuccess]);

  if (isLoading) return <Spinner size='large' />;

  return (
    <YStack flex={1} gap='$4' mb='$4'>
      <XStack justify='space-between' items='center'>
        <Text fontWeight={'bold'}>Poop Details</Text>
        <Button
          icon={X}
          circular
          theme='yellow'
          size='$2'
          onPress={() => setSheetType?.(SheetType.POOP_HISTORY)}
        />
      </XStack>
      <YStack flex={1}>
        <YStack>
          <Label htmlFor='poop-start-button'>Poop Start</Label>
          <Button
            id='poop-start-button'
            onPress={() => setStartDatePickerOpen(true)}
          >
            {format(
              new Date(poopDetails?.started ?? new Date()),
              'dd/MM/yyyy h:mm a'
            )}
          </Button>
          <DatePicker
            modal
            date={new Date(poopDetails?.started ?? new Date())}
            open={startDatePickerOpen}
            onConfirm={(value) => {
              if (
                value.getTime() >=
                new Date(poopDetails?.ended ?? new Date()).getTime()
              ) {
                Alert.alert(
                  'You cannot set the start date to a time after the end date'
                );
                setStartDatePickerOpen(false);
              } else {
                handleUpdateSesh({ started: value });
                setStartDatePickerOpen(false);
              }
            }}
            onCancel={() => setStartDatePickerOpen(false)}
          />
        </YStack>
        <YStack>
          <Label htmlFor='poop-end-button'>Poop End</Label>
          <Button
            id='poop-end-button'
            onPress={() => setEndDatePickerOpen(true)}
          >
            {format(
              new Date(poopDetails?.ended ?? new Date()),
              'dd/MM/yyyy h:mm a'
            )}
          </Button>
          <DatePicker
            modal
            date={new Date(poopDetails?.ended ?? new Date())}
            open={endDatePickerOpen}
            onConfirm={(value) => {
              if (
                value.getTime() <=
                new Date(poopDetails?.started ?? new Date()).getTime()
              ) {
                Alert.alert(
                  'You cannot set the end date to a time before the start date'
                );
                setEndDatePickerOpen(false);
              } else {
                handleUpdateSesh({ ended: value });
                setEndDatePickerOpen(false);
              }
            }}
            onCancel={() => setStartDatePickerOpen(false)}
          />
        </YStack>
        <YStack>
          <Label htmlFor='revelations-textarea'>Revelations</Label>
          <TextArea
            id='revelations-textarea'
            value={revelations}
            onChangeText={(text: string) => {
              setRevelations(text);
            }}
            placeholder='How will we change the world?'
            size='$4'
          />
        </YStack>
        <XStack items='center' justify='space-between'>
          <Label htmlFor='is-public-switch'>Is public?</Label>
          <LogSwitch
            id='is-public-switch'
            key='is-public-switch'
            size='$3'
            checked={poopDetails?.is_public}
            defaultChecked={poopDetails?.is_public}
            onCheckedChange={(checked) => {
              handleUpdateSesh({ is_public: checked });
            }}
          />
        </XStack>
        <XStack items='center' justify='space-between'>
          <Label htmlFor='is-company-time-switch'>Is company time?</Label>
          <LogSwitch
            id='is-company-time-switch'
            key='is-company-time-switch'
            size='$3'
            checked={poopDetails?.company_time}
            defaultChecked={poopDetails?.company_time}
            onCheckedChange={(checked) => {
              handleUpdateSesh({ company_time: checked });
            }}
          />
        </XStack>
        {poopDetails?.is_airplane && (
          <YStack
            gap='$3'
            p='$3'
            borderWidth={1}
            style={{ borderRadius: 16 }}
            borderColor='$borderColor'
          >
            <XStack items='center' gap='$2'>
              <Plane size={16} />
              <Text fontWeight='bold'>Flight Information</Text>
            </XStack>
            <YStack gap='$2'>
              <Label htmlFor='flight-number'>Flight Number</Label>
              <Input
                id='flight-number'
                value={flightNumber}
                onChangeText={(text) => setFlightNumber(text.toUpperCase())}
                onBlur={() => {
                  if (flightNumber && !validateFlightNumber(flightNumber)) {
                    Alert.alert('Invalid flight number format (e.g., AA123)');
                  } else {
                    handleUpdateSesh({ flight_number: flightNumber });
                  }
                }}
                placeholder='e.g., AA123'
                autoCapitalize='characters'
              />
            </YStack>
            <YStack gap='$2'>
              <Label htmlFor='airline'>Airline</Label>
              <Input
                id='airline'
                value={airline}
                onChangeText={setAirline}
                onBlur={() => handleUpdateSesh({ airline })}
                placeholder='e.g., American Airlines'
              />
            </YStack>
            <YStack gap='$2'>
              <Label htmlFor='departure-airport'>Departure Airport</Label>
              <Input
                id='departure-airport'
                value={departureAirport}
                onChangeText={(text) => setDepartureAirport(text.toUpperCase())}
                onBlur={() => {
                  if (
                    departureAirport &&
                    !validateAirportCode(departureAirport)
                  ) {
                    Alert.alert('Must be 3 uppercase letters (e.g., LAX)');
                  } else {
                    handleUpdateSesh({ departure_airport: departureAirport });
                  }
                }}
                placeholder='e.g., LAX'
                maxLength={3}
                autoCapitalize='characters'
              />
            </YStack>
            <YStack gap='$2'>
              <Label htmlFor='arrival-airport'>Arrival Airport</Label>
              <Input
                id='arrival-airport'
                value={arrivalAirport}
                onChangeText={(text) => setArrivalAirport(text.toUpperCase())}
                onBlur={() => {
                  if (arrivalAirport && !validateAirportCode(arrivalAirport)) {
                    Alert.alert('Must be 3 uppercase letters (e.g., JFK)');
                  } else {
                    handleUpdateSesh({ arrival_airport: arrivalAirport });
                  }
                }}
                placeholder='e.g., JFK'
                maxLength={3}
                autoCapitalize='characters'
              />
            </YStack>
          </YStack>
        )}
        <YStack gap='$2'>
          <XStack items='center' gap='$2'>
            <Text>Bristol Score:</Text>
            <TouchableOpacity onPress={() => router.push('/bristol')}>
              <CircleHelp size={14} />
            </TouchableOpacity>
          </XStack>
          <XStack gap='$2' flexWrap='wrap'>
            {BRISTOL_SCORE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() =>
                  handleUpdateSesh({
                    bristol_score: option.value,
                  })
                }
                style={{
                  borderWidth: 1,
                  padding: 5,
                  borderRadius: 10,
                  backgroundColor:
                    poopDetails?.bristol_score === option.value
                      ? 'yellow'
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
          {/* This contains the delete button */}
          <ConfirmDeleteAlert handleDelete={handleDelete} />
        </YStack>
      </YStack>
    </YStack>
  );
}

const ConfirmDeleteAlert = ({
  handleDelete,
}: {
  handleDelete: () => Promise<void>;
}) => {
  return (
    <AlertDialog>
      <AlertDialog.Trigger asChild>
        <Button theme='red'>Delete Sesh</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          key='overlay'
          animation='quick'
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          z={150_000}
        />
        <AlertDialog.Content
          bordered
          elevate
          key='content'
          style={{ marginHorizontal: 10 }}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          scale={1}
          opacity={1}
          y={0}
          z={200_000}
        >
          <YStack gap='$4'>
            <AlertDialog.Title>Delete Sesh</AlertDialog.Title>
            <AlertDialog.Description>
              Are you sure you want to delete this sesh? This action cannot be
              undone.
            </AlertDialog.Description>

            <XStack gap='$3' justify='flex-end'>
              <AlertDialog.Cancel asChild>
                <Button>Cancel</Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button theme='accent' onPress={handleDelete}>
                  Delete
                </Button>
              </AlertDialog.Action>
            </XStack>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
};
