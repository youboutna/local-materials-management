import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAppConfig, type AppConfig } from '@/config/app';
import { validateProviders } from '@/config/app-validate';
import {
  isDevMode,
  IS_LOCAL_BYPASS,
  ENABLE_LOGOUT,
  getDevModeOverride,
  APP_NAME,
  APP_VERSION,
} from '@/config/constants';

/**
 * useAppConfig — état de configuration applicative exposé à l'UI.
 * Le mode DEV est lu dynamiquement (surcharge administrateur incluse) et
 * réagit aux événements `dev-mode-changed` / `dev-role-changed`.
 */
export function useAppConfig() {
  const config = useMemo<AppConfig>(() => getAppConfig(), []);
  const errors = useMemo(
    () =>
      validateProviders({
        auth: config.auth.provider,
        data: config.database.provider,
        storage: config.storage.provider,
      }),
    [config]
  );

  const readFlags = useCallback(
    () => ({ devMode: isDevMode(), devModeOverride: getDevModeOverride() }),
    []
  );

  const [flags, setFlags] = useState(readFlags);

  useEffect(() => {
    const refresh = () => setFlags(readFlags());
    window.addEventListener('dev-mode-changed', refresh);
    window.addEventListener('dev-role-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('dev-mode-changed', refresh);
      window.removeEventListener('dev-role-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [readFlags]);

  return {
    config,
    isValid: errors.length === 0,
    errors,
    isDevMode: flags.devMode,
    devModeOverride: flags.devModeOverride,
    isLocalBypass: IS_LOCAL_BYPASS,
    enableLogout: ENABLE_LOGOUT,
    appName: APP_NAME,
    appVersion: APP_VERSION,
  };
}
