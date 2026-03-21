/**
 * useTheme
 *
 * Public hook for consuming the global theme system.
 *
 * Usage:
 * ```tsx
 * const { colorMode, fontSize, toggleColorMode, setFontSize } = useTheme();
 * ```
 *
 * Must be rendered inside <ThemeProvider>.
 */

import { useThemeContext } from '@/shared/context/ThemeContext';
import type { ThemeContextValue } from '@/shared/types/theme.types';

export function useTheme(): ThemeContextValue {
  return useThemeContext();
}
