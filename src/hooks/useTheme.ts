import { useState, useEffect, useCallback } from 'react';

export interface ThemeConfig {
  isDark: boolean;
  themePreset: string;
  accentColor: string;
  getCssVar: (varName: string, fallback?: string) => string;
  classes: {
    appBg: string;
    surfaceBg: string;
    surfaceHover: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    inputBg: string;
    cardBg: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
  };
}

/**
 * Unified custom React hook for all Harmony OS mini-apps to expose the current theme state,
 * CSS variable getters, and standardized Tailwind utility classes for zero style leakage.
 */
export function useTheme(): ThemeConfig {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const [themePreset, setThemePreset] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'habeshawi-gold';
    }
    return 'habeshawi-gold';
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      const computed = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
      return computed ? computed.trim() : '#f59e0b';
    }
    return '#f59e0b';
  });

  const getCssVar = useCallback((varName: string, fallback: string = ''): string => {
    if (typeof document === 'undefined') return fallback;
    const cleanName = varName.startsWith('--') ? varName : `--${varName}`;
    const value = getComputedStyle(document.documentElement).getPropertyValue(cleanName);
    return value ? value.trim() : fallback;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const updateState = () => {
      const root = document.documentElement;
      setIsDark(root.classList.contains('dark'));
      setThemePreset(root.getAttribute('data-theme') || 'slate');
      const accent = getComputedStyle(root).getPropertyValue('--accent-color');
      if (accent) {
        setAccentColor(accent.trim());
      }
    };

    updateState();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'class' ||
            mutation.attributeName === 'data-theme' ||
            mutation.attributeName === 'style')
        ) {
          updateState();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });

    return () => observer.disconnect();
  }, []);

  return {
    isDark,
    themePreset,
    accentColor,
    getCssVar,
    classes: {
      appBg: 'bg-neutral-50 dark:bg-[#0d1117] text-neutral-900 dark:text-[#c9d1d9]',
      surfaceBg: 'bg-white dark:bg-[#161b22]',
      surfaceHover: 'hover:bg-neutral-100 dark:hover:bg-[#21262d]',
      border: 'border-neutral-200 dark:border-[#30363d]',
      textPrimary: 'text-neutral-900 dark:text-white',
      textSecondary: 'text-neutral-600 dark:text-[#8b949e]',
      textMuted: 'text-neutral-400 dark:text-[#6e7681]',
      inputBg: 'bg-neutral-100 dark:bg-[#0d1117] text-neutral-900 dark:text-white border-neutral-200 dark:border-[#30363d]',
      cardBg: 'bg-white dark:bg-[#161b22] border-neutral-200 dark:border-[#30363d]',
      accentBg: 'theme-accent-bg text-white',
      accentText: 'theme-accent-text',
      accentBorder: 'theme-accent-border',
    },
  };
}

// Alias for backwards compatibility
export const useAppTheme = useTheme;
