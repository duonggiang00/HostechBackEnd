/**
 * ThemeToggle
 *
 * A self-contained UI control for:
 *   1. Toggling light / dark mode  (sun / moon icon)
 *   2. Choosing a font-size scale  (S / M / L buttons)
 *
 * Drop this anywhere in your layout header — no props needed.
 *
 * Usage:
 *   import { ThemeToggle } from '@/shared/components/ui/ThemeToggle';
 *   <ThemeToggle />
 */

import { useTheme } from '@/shared/hooks/useTheme';
import type { FontSize } from '@/shared/types/theme.types';

// ---------------------------------------------------------------------------
// Icons (inline SVG – no icon library required)
// ---------------------------------------------------------------------------

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Font size step definitions
// ---------------------------------------------------------------------------

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; title: string }[] = [
  { value: 'sm', label: 'S', title: 'Small text' },
  { value: 'md', label: 'M', title: 'Medium text' },
  { value: 'lg', label: 'L', title: 'Large text' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ThemeToggleProps {
  /** Show only the dark-mode button (hides the font-size selector) */
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { colorMode, fontSize, toggleColorMode, setFontSize } = useTheme();
  const isDark = colorMode === 'dark';

  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label="Theme settings"
    >
      {/* ── Color mode toggle ─────────────────────────────────── */}
      <button
        type="button"
        onClick={toggleColorMode}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-pressed={isDark}
        className={[
          'flex items-center justify-center rounded-lg p-2 transition-colors duration-200',
          'text-surface-700 hover:bg-surface-100 hover:text-brand-600',
          'dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-brand-400',
          'focus-visible:ring-2 focus-visible:ring-brand-500',
        ].join(' ')}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* ── Font size selector ────────────────────────────────── */}
      {!compact && (
        <div
          className={[
            'flex items-center rounded-lg overflow-hidden border',
            'border-surface-200 dark:border-surface-700',
          ].join(' ')}
          role="radiogroup"
          aria-label="Font size"
        >
          {FONT_SIZE_OPTIONS.map(({ value, label, title }) => {
            const isActive = fontSize === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={isActive}
                title={title}
                onClick={() => setFontSize(value)}
                className={[
                  'w-8 h-8 text-xs font-semibold transition-colors duration-150',
                  isActive
                    ? 'bg-brand-500 text-white dark:bg-brand-600'
                    : [
                        'text-surface-600 hover:bg-surface-100',
                        'dark:text-surface-400 dark:hover:bg-surface-800',
                      ].join(' '),
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
