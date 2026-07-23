import { useMemo } from 'react';
import { getAppConfig, type AppConfig } from '@/config/app';
import { validateProviders } from '@/config/app-validate';

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

  return {
    config,
    isValid: errors.length === 0,
    errors,
  };
}
