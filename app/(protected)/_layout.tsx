import { UnifiedSheet } from '@/components/unified-sheet';
import { SheetType } from '@/constants/sheet';
import { useAuth } from '@/context/authContext';
import { useNetwork } from '@/context/networkContext';
import { useSesh } from '@/context/seshContext';
import { useToilet } from '@/context/toiletContext';
import { syncOfflineSessions } from '@/lib/helpers';
import { usePocketBase } from '@/lib/pocketbaseConfig';
import { Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';

export default function ProtectedLayout() {
  const { pb } = usePocketBase();
  const { user, pooProfile } = useAuth();
  const { isConnected, showOfflineUI } = useNetwork();
  const pathname = usePathname();
  const { activeSesh, selectedSesh } = useSesh();
  const { selectedToilet } = useToilet();
  const [sheetType, setSheetType] = useState<SheetType>(SheetType.HOME);
  const [poopDetailsId, setPoopDetailsId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(true);

  useEffect(() => {
    if (showOfflineUI) {
      console.log('showOfflineUI');
    } else if (isConnected) {
      setSheetType(SheetType.HOME);
      if (pb && user?.id && pooProfile?.id) {
        syncOfflineSessions(pb, user?.id, pooProfile?.id);
      }
    }
  }, [showOfflineUI, isConnected, pb, user, pooProfile]);

  useEffect(() => {
    if (!!activeSesh) {
      setSheetType(SheetType.ACTIVE_SESH);
      return;
    }
    if (!!selectedSesh) {
      setSheetType(SheetType.SELECTED_SESH);
    }
    if (!!selectedToilet) {
      setSheetType(SheetType.TOILET_DETAILS);
    }
  }, [activeSesh, selectedSesh, selectedToilet]);

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
