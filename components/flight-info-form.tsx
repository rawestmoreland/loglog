import { useState } from 'react';
import { Platform } from 'react-native';
import { Button, Input, Label, Text, YStack } from 'tamagui';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { validateAirportCode, validateFlightNumber } from '@/lib/flight-helpers';
import { SheetType } from '@/constants/sheet';
import { toast } from 'burnt';

interface FlightInfoFormProps {
  onSave: (flightData: {
    flight_number: string;
    airline: string;
    departure_airport: string;
    arrival_airport: string;
  }) => Promise<void>;
  onClose: () => void;
  initialData?: {
    flight_number?: string;
    airline?: string;
    departure_airport?: string;
    arrival_airport?: string;
  };
}

export function FlightInfoForm({
  onSave,
  onClose,
  initialData,
}: FlightInfoFormProps) {
  const [flightNumber, setFlightNumber] = useState(
    initialData?.flight_number || ''
  );
  const [airline, setAirline] = useState(initialData?.airline || '');
  const [departureAirport, setDepartureAirport] = useState(
    initialData?.departure_airport || ''
  );
  const [arrivalAirport, setArrivalAirport] = useState(
    initialData?.arrival_airport || ''
  );

  const [errors, setErrors] = useState<{
    flightNumber?: string;
    departureAirport?: string;
    arrivalAirport?: string;
  }>({});

  const handleSave = async () => {
    const newErrors: typeof errors = {};

    // Validate flight number if provided
    if (flightNumber && !validateFlightNumber(flightNumber)) {
      newErrors.flightNumber =
        'Invalid format (e.g., AA123, BA4567)';
    }

    // Validate departure airport if provided
    if (departureAirport && !validateAirportCode(departureAirport)) {
      newErrors.departureAirport =
        'Must be 3 uppercase letters (e.g., LAX)';
    }

    // Validate arrival airport if provided
    if (arrivalAirport && !validateAirportCode(arrivalAirport)) {
      newErrors.arrivalAirport =
        'Must be 3 uppercase letters (e.g., JFK)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSave({
      flight_number: flightNumber,
      airline,
      departure_airport: departureAirport,
      arrival_airport: arrivalAirport,
    });

    toast({
      title: 'Flight info saved',
      preset: 'done',
      haptic: 'success',
    });

    onClose();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <YStack gap='$4' p='$4'>
        <YStack gap='$2'>
          <Text fontWeight='bold' fontSize='$6'>
            Flight Information
          </Text>
          <Text fontSize='$3' opacity={0.7}>
            Add details about your flight (all fields optional)
          </Text>
        </YStack>

        <YStack gap='$2'>
          <Label htmlFor='flight-number'>Flight Number</Label>
          <Input
            id='flight-number'
            value={flightNumber}
            onChangeText={(text) => {
              setFlightNumber(text.toUpperCase());
              setErrors({ ...errors, flightNumber: undefined });
            }}
            placeholder='e.g., AA123'
            autoCapitalize='characters'
          />
          {errors.flightNumber && (
            <Text fontSize='$2' color='$red10'>
              {errors.flightNumber}
            </Text>
          )}
        </YStack>

        <YStack gap='$2'>
          <Label htmlFor='airline'>Airline</Label>
          <Input
            id='airline'
            value={airline}
            onChangeText={setAirline}
            placeholder='e.g., American Airlines'
          />
        </YStack>

        <YStack gap='$2'>
          <Label htmlFor='departure-airport'>Departure Airport</Label>
          <Input
            id='departure-airport'
            value={departureAirport}
            onChangeText={(text) => {
              setDepartureAirport(text.toUpperCase());
              setErrors({ ...errors, departureAirport: undefined });
            }}
            placeholder='e.g., LAX'
            maxLength={3}
            autoCapitalize='characters'
          />
          {errors.departureAirport && (
            <Text fontSize='$2' color='$red10'>
              {errors.departureAirport}
            </Text>
          )}
        </YStack>

        <YStack gap='$2'>
          <Label htmlFor='arrival-airport'>Arrival Airport</Label>
          <Input
            id='arrival-airport'
            value={arrivalAirport}
            onChangeText={(text) => {
              setArrivalAirport(text.toUpperCase());
              setErrors({ ...errors, arrivalAirport: undefined });
            }}
            placeholder='e.g., JFK'
            maxLength={3}
            autoCapitalize='characters'
          />
          {errors.arrivalAirport && (
            <Text fontSize='$2' color='$red10'>
              {errors.arrivalAirport}
            </Text>
          )}
        </YStack>

        <YStack gap='$2' mt='$4'>
          <Button theme='accent' onPress={handleSave}>
            Save Flight Info
          </Button>
          <Button chromeless onPress={onClose}>
            Cancel
          </Button>
        </YStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
