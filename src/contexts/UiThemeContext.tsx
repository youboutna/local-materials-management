/**
 * UiThemeContext — thème visuel + identité de marque paramétrables
 * (référentiels `UI_THEMES` et `BRANDING_PROFILES`).
 *
 * Responsabilité unique : appliquer / persister la classe de thème sur <html>
 * et exposer le branding résolu. Aucune logique métier, aucune couleur codée
 * en dur (tout vient des référentiels + tokens CSS).
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
import {
  BRANDING_OVERRIDES_STORAGE_KEY,
  BRANDING_PROFILES,
  BRANDING_STORAGE_KEY,
  DEFAULT_BRANDING_ID,
  resolveBranding,
  type BrandingDefinition,
  type BrandingOverrides,
} from '@/config/referentials/ui/branding.referential';

interface UiThemeContextValue {
  themeId: string;
  theme: UiThemeDefinition;
  themes: UiThemeDefinition[];
  setThemeId: (id: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  /** Identité de marque résolue (profil référentiel + surcharges client). */
  branding: BrandingDefinition;
  brandingId: string;
  brandingProfiles: BrandingDefinition[];
  setBrandingId: (id: string) => void;
  brandingOverrides: BrandingOverrides;
  setBrandingOverrides: (patch: BrandingOverrides) => void;
  resetBrandingOverrides: () => void;
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

const writeStored = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* stockage indisponible : la valeur reste active pour la session */
  }
};

const readOverrides = (): BrandingOverrides => {
  const raw = readStored(BRANDING_OVERRIDES_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as BrandingOverrides;
  } catch {
    return {};
  }
};

export const UiThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState<string>(
    () => readStored(UI_THEME_STORAGE_KEY) ?? DEFAULT_UI_THEME_ID,
  );
  const [darkMode, setDarkMode] = useState<boolean>(() => readStored(DARK_STORAGE_KEY) === 'true');
  const [brandingId, setBrandingIdState] = useState<string>(
    () => readStored(BRANDING_STORAGE_KEY) ?? DEFAULT_BRANDING_ID,
  );
  const [brandingOverrides, setBrandingOverridesState] = useState<BrandingOverrides>(readOverrides);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    UI_THEME_CLASSNAMES.forEach((cls) => root.classList.remove(cls));
    const applied = getUiTheme(themeId);
    if (applied.className) root.classList.add(applied.className);
    root.dataset.theme = applied.id;
    writeStored(UI_THEME_STORAGE_KEY, applied.id);
  }, [themeId]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', darkMode);
    writeStored(DARK_STORAGE_KEY, String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    writeStored(BRANDING_STORAGE_KEY, brandingId);
  }, [brandingId]);

  useEffect(() => {
    writeStored(BRANDING_OVERRIDES_STORAGE_KEY, JSON.stringify(brandingOverrides));
  }, [brandingOverrides]);

  const setThemeId = useCallback((id: string) => setThemeIdState(getUiTheme(id).id), []);
  const toggleDarkMode = useCallback(() => setDarkMode((v) => !v), []);
  const setBrandingId = useCallback((id: string) => setBrandingIdState(id), []);
  const setBrandingOverrides = useCallback(
    (patch: BrandingOverrides) => setBrandingOverridesState((prev) => ({ ...prev, ...patch })),
    [],
  );
  const resetBrandingOverrides = useCallback(() => setBrandingOverridesState({}), []);

  const value = useMemo<UiThemeContextValue>(
    () => ({
      themeId,
      theme: getUiTheme(themeId),
      themes: UI_THEMES,
      setThemeId,
      darkMode,
      toggleDarkMode,
      branding: resolveBranding(brandingId, brandingOverrides),
      brandingId,
      brandingProfiles: BRANDING_PROFILES,
      setBrandingId,
      brandingOverrides,
      setBrandingOverrides,
      resetBrandingOverrides,
    }),
    [
      themeId,
      darkMode,
      setThemeId,
      toggleDarkMode,
      brandingId,
      brandingOverrides,
      setBrandingId,
      setBrandingOverrides,
      resetBrandingOverrides,
    ],
  );

  return <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>;
};

export const useUiTheme = (): UiThemeContextValue => {
  const ctx = useContext(UiThemeContext);
  if (!ctx) throw new Error('useUiTheme must be used within a UiThemeProvider');
  return ctx;
};
