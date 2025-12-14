import {
  ActiveSeshView,
  HomeView,
  LoadingView,
  PoopCommentView,
  PoopDetailsView,
  PoopHistoryView,
  PoopPalsView,
  SelectedSeshView,
  UserSettingsView,
} from '@/components/bottom-sheet';
import { SheetContentComponent, SheetType } from '@/constants/sheet';

// Map sheet types to components
export const SHEET_COMPONENTS: Record<SheetType, SheetContentComponent> = {
  [SheetType.HOME]: HomeView,
  [SheetType.ACTIVE_SESH]: ActiveSeshView,
  [SheetType.SELECTED_SESH]: SelectedSeshView,
  [SheetType.POOP_DETAILS]: PoopDetailsView,
  [SheetType.POOP_COMMENT]: PoopCommentView,
  [SheetType.USER_SETTINGS]: UserSettingsView,
  [SheetType.POOP_PALS]: PoopPalsView,
  [SheetType.POOP_HISTORY]: PoopHistoryView,
  [SheetType.LOADING]: LoadingView,
};
