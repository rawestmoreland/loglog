import { ActiveSeshView } from '@/components/bottom-sheet/active-sesh-view';
import { HomeView } from '@/components/bottom-sheet/home-view';
import { LoadingView } from '@/components/bottom-sheet/loading-view';
import { PoopDetailsView } from '@/components/bottom-sheet/poop-details-view';
import { PoopHistoryView } from '@/components/bottom-sheet/poop-history-view';
import { PoopPalsView } from '@/components/bottom-sheet/poop-pals-view';
import { UserSettingsView } from '@/components/bottom-sheet/user-settings-view';
import { SheetContentComponent, SheetType } from '@/constants/sheet';

// Map sheet types to components
export const SHEET_COMPONENTS: Record<SheetType, SheetContentComponent> = {
  [SheetType.HOME]: HomeView,
  [SheetType.ACTIVE_SESH]: ActiveSeshView,
  [SheetType.POOP_DETAILS]: PoopDetailsView,
  [SheetType.USER_SETTINGS]: UserSettingsView,
  [SheetType.POOP_PALS]: PoopPalsView,
  [SheetType.POOP_HISTORY]: PoopHistoryView,
  [SheetType.LOADING]: LoadingView,
};
