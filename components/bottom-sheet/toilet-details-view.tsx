import { RoundButton } from '@/components/ui/round-button';
import { SheetContentProps, SheetType } from '@/constants/sheet';
import { Colors } from '@/constants/theme';
import { useToilet } from '@/context/toiletContext';
import { MapPin, X } from '@tamagui/lucide-icons';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Label, Separator, Spinner, Text, XStack, YStack } from 'tamagui';

export function ToiletDetailsView({ setSheetType }: SheetContentProps) {
  const scheme = useColorScheme() ?? 'light';
  const { selectedToilet, setSelectedToilet } = useToilet();

  const toiletName = useMemo(() => {
    return selectedToilet?.expand?.place_id?.name;
  }, [selectedToilet]);

  const toiletAddress = useMemo(() => {
    return selectedToilet?.expand?.place_id?.address;
  }, [selectedToilet]);

  const toiletCityState = useMemo(() => {
    return selectedToilet?.expand?.place_id?.place_formatted;
  }, [selectedToilet]);

  if (!selectedToilet) {
    return (
      <YStack gap='$4'>
        <Text>No toilet selected</Text>
      </YStack>
    );
  }

  return (
    <YStack gap='$4' mb='$4'>
      <XStack justify='space-between' items='center'>
        <Text fontWeight='bold' fontSize='$6'>
          Toilet Details
        </Text>
        <RoundButton
          icon={X}
          onPress={() => {
            setSheetType?.(SheetType.HOME);
            setSelectedToilet(null);
          }}
        />
      </XStack>

      <YStack gap='$3'>
        {/* Toilet Name */}
        <YStack gap='$2'>
          <Text fontSize='$5' fontWeight='600'>
            {toiletName}
          </Text>
          {/* {selectedToilet.place_type && (
            <Text color={Colors[scheme].textSecondary as any} fontSize='$3'>
              {placeTypeLabels[selectedToilet.place_type] ||
                selectedToilet.place_type}
            </Text>
          )} */}
        </YStack>

        {/* Location Information */}
        {(toiletAddress || toiletCityState) && (
          <YStack gap='$2'>
            <XStack items='center' gap='$2'>
              <MapPin size={16} color={Colors[scheme].textSecondary as any} />
              <YStack gap='$1'>
                <Text color={Colors[scheme].textSecondary as any} fontSize='$3'>
                  {toiletAddress}
                </Text>
                <Text color={Colors[scheme].textSecondary as any} fontSize='$3'>
                  {toiletCityState}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        )}

        <Separator />

        {/* Average Rating */}
        <YStack gap='$2'>
          <Label fontSize='$4' fontWeight='600'>
            Average Rating
          </Label>
          {!selectedToilet ? (
            <Spinner size='small' />
          ) : selectedToilet.rating ? (
            <XStack items='center' gap='$2'>
              <XStack gap='$1'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Icon
                    key={index}
                    name='star'
                    size={20}
                    color={
                      index < Math.round(selectedToilet.rating)
                        ? (Colors[scheme].primary as string)
                        : (Colors[scheme].border as string)
                    }
                  />
                ))}
              </XStack>
              <Text fontSize='$4' fontWeight='500'>
                {selectedToilet.rating.toFixed(1)}
              </Text>
              <Text color={Colors[scheme].textSecondary as any} fontSize='$3'>
                ({selectedToilet.total_ratings || 0}{' '}
                {selectedToilet.total_ratings === 1 ? 'rating' : 'ratings'})
              </Text>
            </XStack>
          ) : (
            <Text color={Colors[scheme].textSecondary as any} fontSize='$3'>
              No ratings yet
            </Text>
          )}
        </YStack>

        <Separator />
      </YStack>
    </YStack>
  );
}
