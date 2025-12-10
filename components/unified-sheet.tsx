import {
  SHEET_SHOW_HANDLE,
  SHEET_SNAP_POINTS,
  SHEET_SNAP_POINTS_MODE,
  SheetType,
} from '@/constants/sheet';
import { SHEET_COMPONENTS } from '@/constants/sheetComponents';
import { useEffect, useState } from 'react';
import { Sheet } from 'tamagui';

type UnifiedSheetProps = {
  sheetType: SheetType;
  setSheetType: (type: SheetType) => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  poopDetailsId: string | null;
  setPoopDetailsId: (id: string | null) => void;
};

export function UnifiedSheet({
  sheetType,
  setSheetType,
  sheetOpen,
  setSheetOpen,
  poopDetailsId,
  setPoopDetailsId,
}: UnifiedSheetProps) {
  const [innerOpen, setInnerOpen] = useState(false);

  // Reset innerOpen when sheet type changes
  useEffect(() => {
    setInnerOpen(false);
  }, [sheetType]);

  const ContentComponent = SHEET_COMPONENTS[sheetType];
  const showHandle = SHEET_SHOW_HANDLE[sheetType] || false;
  const snapPoints = SHEET_SNAP_POINTS[sheetType];
  const snapPointsMode = SHEET_SNAP_POINTS_MODE[sheetType] || 'fit';

  return (
    <Sheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      modal
      forceRemoveScrollEnabled={sheetOpen}
      snapPoints={snapPoints}
      snapPointsMode={snapPointsMode}
      zIndex={100_000}
      animation='medium'
    >
      {showHandle && <Sheet.Handle />}
      <Sheet.Frame p='$4' gap='$6'>
        <ContentComponent
          modal={true}
          isPercent={true}
          innerOpen={innerOpen}
          setInnerOpen={setInnerOpen}
          setOpen={setSheetOpen}
          setSheetType={setSheetType}
          sheetType={sheetType}
          poopDetailsId={poopDetailsId}
          setPoopDetailsId={setPoopDetailsId}
        />
      </Sheet.Frame>
    </Sheet>
  );
}
