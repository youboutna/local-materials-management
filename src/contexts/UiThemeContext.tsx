/**
 * UiThemeContext — thème visuel paramétrable (référentiel `UI_THEMES`).
 *
 * Responsabilité unique : appliquer / persister la classe de thème sur <html>.
 * Aucune logique métier, aucune couleur codée en dur (tout vient du référentiel
 * + des tokens CSS).
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_UI_THEME_ID,
  UI_THEMES,
  UI_THEME_CLASSNAMES,
  UI_THEME_STORAGE_KEY,
  getUiTheme,
  type UiThemeDefinition,
} from '@/config/referentials/ui/themes.referential';

interface UiThemeContextValue {
  themeId: string;
  theme: UiThemeDefinition;
  themes: UiThemeDefinition[];
  setThemeId: (id: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const UiThemeContext = createContext<UiThemeContextValue | undefined>(undefined);

const DARK_STORAGE_KEY = `${UI_THEME_STORAGE_KEY}.dark`;

const readStored = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

export const UiThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<string>(
    () => readStored(UI_THEME_STORAGE_KEY) ?? DEFAULT_UI_THEME_ID,
  );
  const [darkMode, setDarkMode] = useState<boolean>(() => readStored(DARK_STORAGE_KEY) === 'true');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    UI_THEME_CLASSNAMES.forEach((cls) => root.classList.remove(cls));
    const applied = getUiTheme(themeId);
    if (applied.className) root.classList.add(applied.className);
    root.dataset.theme = applied.id;
    try {
      window.localStorage.setItem(UI_THEME_STORAGE_KEY, applied.id);
    } catch {
      /* stockage indisponible : le thème reste actif pour la session */
    }
  }, [themeId]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      window.localStorage.setItem(DARK_STORAGE_KEY, String(darkMode));
    } catch {
      /* noop */
    }
  }, [darkMode]);

  const setThemeId = useCallback((id: string) => setThemeIdState(getUiTheme(id).id), []);
  const toggleDarkMode = useCallback(() => setDarkMode((v) => !v), []);

  const value = useMemo<UiThemeContextValue>(
    () => ({
      themeId,
      theme: getUiTheme(themeId),
      themes: UI_THEMES,
      setThemeId,
      darkMode,
      toggleDarkMode,
    }),
    [themeId, darkMode, setThemeId, toggleDarkMode],
  );

  return <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>;
};

export const useUiTheme = (): UiThemeContextValue => {
  const ctx = useContext(UiThemeContext);
  if (!ctx) throw new Error('useUiTheme must be used within a UiThemeProvider');
  return ctx;
};
