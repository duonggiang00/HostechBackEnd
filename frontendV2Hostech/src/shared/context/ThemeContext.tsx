/**
 * ThemeContext
 *
 * Manages global theming state:
 *   - Color mode (light / dark) via an `html.dark` class
 *   - Font-size scale (sm / md / lg) via a `--font-size-base` CSS variable on <html>
 *
 * Design choices:
 *   - All DOM mutations are performed directly on `document.documentElement` to
 *     avoid triggering React re-renders just to change the dark class or font variable.
 *   - State is persisted to `localStorage` with a single write per change.
 *   - The context value is memoised so consumers only re-render when state changes.
 *   - Initial state is derived from localStorage → system preference → sensible default.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  FONT_SIZE_MAP,
  STORAGE_KEYS,
  type ColorMode,
  type FontSize,
  type ThemeContextValue,
} from '@/shared/types/theme.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read a stored color mode, falling back to system preference then 'light'. */
function resolveInitialColorMode(): ColorMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.colorMode) as ColorMode | null;
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage may be blocked (private browsing in some browsers)
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Read a stored font size, falling back to 'md'. */
function resolveInitialFontSize(): FontSize {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.fontSize) as FontSize | null;
    if (stored === 'sm' || stored === 'md' || stored === 'lg') return stored;
  } catch {
    // ignore
  }
  return 'md';
}

/** Apply `dark` class to <html> directly – zero React overhead. */
function applyColorModeToDom(mode: ColorMode): void {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/** Apply `--font-size-base` custom property to <html> directly. */
function applyFontSizeToDom(size: FontSize): void {
  document.documentElement.style.setProperty('--font-size-base', FONT_SIZE_MAP[size]);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ThemeContext = createContext<ThemeContextValue | null>(null);
ThemeContext.displayName = 'ThemeContext';

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colorMode, setColorModeState] = useState<ColorMode>(resolveInitialColorMode);
  const [fontSize, setFontSizeState] = useState<FontSize>(resolveInitialFontSize);

  /**
   * Track whether this is the first render.
   * On first render the FOUC-prevention inline script has already applied DOM
   * changes, so we can skip the initial `useEffect` flush to avoid a double write.
   */
  const isFirstRender = useRef(true);

  // Sync DOM & localStorage on colorMode change
  useEffect(() => {
    if (isFirstRender.current) {
      // DOM was already set by the FOUC script – just ensure it matches state.
      applyColorModeToDom(colorMode);
      return;
    }
    applyColorModeToDom(colorMode);
    try {
      localStorage.setItem(STORAGE_KEYS.colorMode, colorMode);
    } catch {
      // ignore write errors
    }
  }, [colorMode]);

  // Sync DOM & localStorage on fontSize change
  useEffect(() => {
    if (isFirstRender.current) {
      applyFontSizeToDom(fontSize);
      isFirstRender.current = false;
      return;
    }
    applyFontSizeToDom(fontSize);
    try {
      localStorage.setItem(STORAGE_KEYS.fontSize, fontSize);
    } catch {
      // ignore write errors
    }
  }, [fontSize]);

  // Listen to OS-level theme changes (when no preference has been saved yet)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only follow system preference if the user has not set one explicitly
      const stored = localStorage.getItem(STORAGE_KEYS.colorMode);
      if (!stored) {
        setColorModeState(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const toggleColorMode = useCallback(() => {
    setColorModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
  }, []);

  // ---------------------------------------------------------------------------
  // Value – memoised to prevent unnecessary re-renders
  // ---------------------------------------------------------------------------

  const value = useMemo<ThemeContextValue>(
    () => ({ colorMode, fontSize, toggleColorMode, setColorMode, setFontSize }),
    [colorMode, fontSize, toggleColorMode, setColorMode, setFontSize],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ---------------------------------------------------------------------------
// Internal hook – consumed by the public useTheme hook
// ---------------------------------------------------------------------------

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within a <ThemeProvider>');
  }
  return ctx;
}
