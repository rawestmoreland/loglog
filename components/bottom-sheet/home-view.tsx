import { SheetType } from '@/constants/sheet';
import { Colors } from '@/constants/theme';
import { useMapViewContext } from '@/context/mapViewContext';
import { useSesh } from '@/context/seshContext';
import { BookOpen, ChevronDown, UserCog2 } from '@tamagui/lucide-icons';
import { Pressable, useColorScheme } from 'react-native';
import ContextMenu from 'react-native-context-menu-view';
import { Button, XStack, YStack } from 'tamagui';

export function HomeView({
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
  const { activeSesh, startSesh } = useSesh();
  const { poopsToView, setPoopsToView } = useMapViewContext();
  const scheme = useColorScheme() ?? 'light';

  const handleStartSesh = async () => {
    if (!!activeSesh) return;
    await startSesh();
  };

  return (
    <YStack gap='$4' mb='$4'>
      <XStack justify='space-between'>
        <ContextMenu
          dropdownMenuMode={true}
          actions={[
            { title: 'Friends', selected: poopsToView === 'friends' },
            { title: 'Yours', selected: poopsToView === 'yours' },
            { title: 'All', selected: poopsToView === 'all' },
          ]}
          onPress={(e) => {
            setPoopsToView(
              e.nativeEvent.name.toLocaleLowerCase() as
                | 'friends'
                | 'yours'
                | 'all'
            );
          }}
        >
          <Button chromeless iconAfter={ChevronDown}>
            {poopsToView === 'friends'
              ? 'Friends'
              : poopsToView === 'yours'
              ? 'Yours'
              : 'All'}
          </Button>
        </ContextMenu>
        <XStack items='center' gap='$2'>
          <Pressable
            aria-label='Poop History'
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
            onPress={() => {
              setSheetType?.(SheetType.POOP_HISTORY);
            }}
          >
            <BookOpen
              size={14}
              pointerEvents='none'
              color={Colors[scheme].primaryForeground as any}
            />
          </Pressable>
          <Pressable
            aria-label='Profile'
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
            onPress={() => {
              setSheetType?.(SheetType.USER_SETTINGS);
            }}
          >
            <UserCog2
              size={14}
              pointerEvents='none'
              color={Colors[scheme].primaryForeground as any}
            />
          </Pressable>
        </XStack>
      </XStack>
      <Button
        size='$5'
        bg={Colors[scheme].accent as any}
        color={Colors[scheme].accentForeground as any}
        fontWeight='700'
        pressStyle={{ opacity: 0.8, scale: 0.98 }}
        onPress={handleStartSesh}
      >
        Drop a log
      </Button>
    </YStack>
  );
}
