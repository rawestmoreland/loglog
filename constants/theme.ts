/**
 * Modern minimal design system theme
 * Includes semantic colors, neutral scales, and dark mode support
 */

import { Platform } from 'react-native';
import { SizableTextProps } from 'tamagui';

// Neutral scale for light mode
const neutral = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#A3A3A3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0A0A0A',
};

// Accent colors
const accent = {
  primary: '#FFCC00',
  primaryForeground: '#0A0A0A',
  secondary: '#FFF8E1',
  secondaryForeground: '#1F2937',
  muted: '#FFFBF0',
  mutedForeground: '#6B7280',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  success: '#10B981',
  successForeground: '#FFFFFF',
};

export const Colors: Record<
  string,
  Record<string, string | SizableTextProps['color']>
> = {
  light: {
    // Base colors
    background: '#FFFFFF',
    foreground: '#0A0A0A',

    // Surface colors
    card: '#FAFAFA',
    cardForeground: '#0A0A0A',
    popover: '#FAFAFA',
    popoverForeground: '#0A0A0A',

    // Component colors
    primary: accent.primary,
    primaryForeground: accent.primaryForeground,
    secondary: accent.secondary,
    secondaryForeground: accent.secondaryForeground,
    muted: accent.muted,
    mutedForeground: accent.mutedForeground,

    // States
    destructive: accent.destructive,
    destructiveForeground: accent.destructiveForeground,
    success: accent.success,
    successForeground: accent.successForeground,

    // Borders & inputs
    border: neutral[200],
    input: neutral[200],
    ring: neutral[950],

    // Text
    text: neutral[950],
    textSecondary: neutral[600],
    textTertiary: neutral[400],

    // Legacy (for backwards compatibility)
    tint: accent.primary,
    icon: neutral[600],
    tabIconDefault: neutral[400],
    tabIconSelected: accent.primary,
  },
  dark: {
    // Base colors
    background: '#0A0A0A',
    foreground: '#FAFAFA',

    // Surface colors
    card: '#171717',
    cardForeground: '#FAFAFA',
    popover: '#171717',
    popoverForeground: '#FAFAFA',

    // Component colors
    primary: '#FFCC00',
    primaryForeground: '#0A0A0A',
    secondary: '#332A00',
    secondaryForeground: '#FAFAFA',
    muted: '#1A1600',
    mutedForeground: '#A3A3A3',

    // States
    destructive: '#DC2626',
    destructiveForeground: '#FAFAFA',
    success: '#059669',
    successForeground: '#FAFAFA',

    // Borders & inputs
    border: '#262626',
    input: '#262626',
    ring: '#FFCC00',

    // Text
    text: '#FAFAFA',
    textSecondary: neutral[400],
    textTertiary: neutral[600],

    // Legacy (for backwards compatibility)
    tint: '#FFCC00',
    icon: neutral[400],
    tabIconDefault: neutral[600],
    tabIconSelected: '#FFCC00',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
