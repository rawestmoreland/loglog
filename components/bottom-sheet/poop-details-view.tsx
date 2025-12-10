import { BRISTOL_SCORE_OPTIONS } from '@/constants';
import { SheetContentProps, SheetType } from '@/constants/sheet';
import {
  useDeletePoop,
  useUpdatePoopSesh,
} from '@/hooks/api/usePoopSeshMutations';
import { usePoopSesh } from '@/hooks/api/usePoopSeshQueries';
import { PoopSesh } from '@/lib/types';
import { CircleHelp, X } from '@tamagui/lucide-icons';
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
  Label,
  Spinner,
  Switch,
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
  }, [poopDetails?.revelations]);

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
          <Switch
            id='is-public-switch'
            size='$3'
            defaultChecked={poopDetails?.is_public}
            onCheckedChange={(checked) => {
              handleUpdateSesh({ is_public: checked });
            }}
          >
            <Switch.Thumb animation='quicker' />
          </Switch>
        </XStack>
        <XStack items='center' justify='space-between'>
          <Label htmlFor='is-company-time-switch'>Is company time?</Label>
          <Switch
            id='is-company-time-switch'
            size='$3'
            defaultChecked={poopDetails?.company_time}
            onCheckedChange={(checked) => {
              handleUpdateSesh({ company_time: checked });
            }}
          >
            <Switch.Thumb animation='quicker' />
          </Switch>
        </XStack>
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
