import { PoopSeshesRecord } from '@/lib/pocketbase-types';
import type { ComponentType } from 'react';

export enum SheetType {
  HOME = 'home',
  ACTIVE_SESH = 'active-sesh',
  SELECTED_SESH = 'selected-sesh',
  NO_CONNECTION = 'no-connection',
  POOP_DETAILS = 'poop-details',
  USER_SETTINGS = 'user-settings',
  POOP_PALS = 'poop-pals',
  POOP_HISTORY = 'poop-history',
  POOP_COMMENT = 'poop-comment',
  LOADING = 'loading',
}

export type SheetContentProps = {
  modal: boolean;
  isPercent: boolean;
  innerOpen: boolean;
  setInnerOpen: (open: boolean) => void;
  setOpen?: (open: boolean) => void;
  setSheetType?: (type: SheetType) => void;
  sheetType?: SheetType;
  poopDetailsId?: string | null;
  setPoopDetailsId?: (id: string | null) => void;
  selectedSesh?: PoopSeshesRecord;
};

export type SheetContentComponent = ComponentType<SheetContentProps>;

// Map sheet types to snap points
export const SHEET_SNAP_POINTS: Record<
  SheetType,
  (number | 'fit')[] | undefined
> = {
  [SheetType.HOME]: undefined,
  [SheetType.ACTIVE_SESH]: undefined,
  [SheetType.SELECTED_SESH]: undefined,
  [SheetType.NO_CONNECTION]: undefined,
  [SheetType.POOP_DETAILS]: undefined,
  [SheetType.POOP_COMMENT]: [90],
  [SheetType.USER_SETTINGS]: undefined,
  [SheetType.POOP_PALS]: [75],
  [SheetType.POOP_HISTORY]: [75],
  [SheetType.LOADING]: [0],
};

export const SHEET_SNAP_POINTS_MODE: Record<
  SheetType,
  'percent' | 'fit' | 'mixed'
> = {
  [SheetType.HOME]: 'fit',
  [SheetType.ACTIVE_SESH]: 'fit',
  [SheetType.SELECTED_SESH]: 'fit',
  [SheetType.NO_CONNECTION]: 'fit',
  [SheetType.POOP_DETAILS]: 'fit',
  [SheetType.POOP_COMMENT]: 'percent',
  [SheetType.USER_SETTINGS]: 'fit',
  [SheetType.POOP_PALS]: 'percent',
  [SheetType.POOP_HISTORY]: 'percent',
  [SheetType.LOADING]: 'fit',
};

export const SHEET_SHOW_HANDLE: Record<SheetType, boolean> = {
  [SheetType.HOME]: false,
  [SheetType.ACTIVE_SESH]: false,
  [SheetType.SELECTED_SESH]: false,
  [SheetType.NO_CONNECTION]: false,
  [SheetType.POOP_DETAILS]: false,
  [SheetType.POOP_COMMENT]: false,
  [SheetType.USER_SETTINGS]: true,
  [SheetType.POOP_PALS]: false,
  [SheetType.POOP_HISTORY]: true,
  [SheetType.LOADING]: false,
};
