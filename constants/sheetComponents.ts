import {
  ActiveSeshView,
  HomeView,
  LoadingView,
  NoConnectionView,
  PoopCommentView,
  PoopDetailsView,
  PoopHistoryView,
  PoopPalsView,
  SelectedSeshView,
  ToiletDetailsView,
  UserSettingsView,
} from '@/components/bottom-sheet';
import { SheetContentComponent, SheetType } from '@/constants/sheet';

// Map sheet types to components
export const SHEET_COMPONENTS: Record<SheetType, SheetContentComponent> = {
  [SheetType.HOME]: HomeView,
  [SheetType.ACTIVE_SESH]: ActiveSeshView,
  [SheetType.TOILET_DETAILS]: ToiletDetailsView,
  [SheetType.SELECTED_SESH]: SelectedSeshView,
  [SheetType.NO_CONNECTION]: NoConnectionView,
  [SheetType.POOP_DETAILS]: PoopDetailsView,
  [SheetType.POOP_COMMENT]: PoopCommentView,
  [SheetType.USER_SETTINGS]: UserSettingsView,
  [SheetType.POOP_PALS]: PoopPalsView,
  [SheetType.POOP_HISTORY]: PoopHistoryView,
  [SheetType.LOADING]: LoadingView,
};
