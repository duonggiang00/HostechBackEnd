/**
 * Theme System Types
 * Defines the shape of the entire theming state.
 */

/** Light or dark color mode */
export type ColorMode = 'light' | 'dark';

/** Three-step font size scale */
export type FontSize = 'sm' | 'md' | 'lg';

/** The raw state persisted to localStorage */
export interface ThemeState {
  colorMode: ColorMode;
  fontSize: FontSize;
}

/** All values and actions exposed by ThemeContext */
export interface ThemeContextValue extends ThemeState {
  /** Toggle between light and dark */
  toggleColorMode: () => void;
  /** Set a specific color mode */
  setColorMode: (mode: ColorMode) => void;
  /** Set the global font-size scale */
  setFontSize: (size: FontSize) => void;
}

/** Storage keys – centralised to avoid typos */
export const STORAGE_KEYS = {
  colorMode: 'hostech-color-mode',
  fontSize: 'hostech-font-size',
} as const;

/** Font-size base values mapped to each scale step (in px) */
export const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '14px',
  md: '16px',
  lg: '18px',
} as const;
