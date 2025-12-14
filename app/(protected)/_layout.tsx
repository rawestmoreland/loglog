import { UnifiedSheet } from '@/components/unified-sheet';
import { SheetType } from '@/constants/sheet';
import { useSesh } from '@/context/seshContext';
import { useNetworkState } from 'expo-network';
import { Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';

export default function ProtectedLayout() {
  const { isConnected } = useNetworkState();
  const pathname = usePathname();
  const { activeSesh, selectedSesh } = useSesh();
  const [sheetType, setSheetType] = useState<SheetType>(SheetType.HOME);
  const [poopDetailsId, setPoopDetailsId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      setSheetType(SheetType.NO_CONNECTION);
      return;
    }
  }, [isConnected]);

  useEffect(() => {
    if (!!activeSesh) {
      setSheetType(SheetType.ACTIVE_SESH);
      return;
    }
    if (!!selectedSesh) {
      setSheetType(SheetType.SELECTED_SESH);
    }
  }, [activeSesh, selectedSesh]);

  useEffect(() => {
    setSheetOpen(pathname !== '/bristol' && pathname !== '/settings');
  }, [pathname]);

  return (
    <>
      <Stack screenOptions={SCREEN_OPTIONS}>
        <Stack.Screen name='index' />
      </Stack>

      <UnifiedSheet
        sheetType={sheetType}
        setSheetType={setSheetType}
        sheetOpen={sheetOpen}
        setSheetOpen={setSheetOpen}
        poopDetailsId={poopDetailsId}
        setPoopDetailsId={setPoopDetailsId}
      />
    </>
  );
}

const SCREEN_OPTIONS = {
  headerShown: false,
} as const;
