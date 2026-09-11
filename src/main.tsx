// reflect-metadata import removed - no longer needed without TypeORM
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import DebugPanel from '@/components/debug/DebugPanel';
import { isDevMode } from './config/constants';
import { setAlignmentRepository } from '@/application/services/boq/AlignmentService';
import { SupabaseAlignmentRepository } from '@/infrastructure/adapters/supabase/SupabaseAlignmentRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { validateAppConfig } from '@/config/app-validate';
import { isDebugMode, logger } from '@/application/services/LoggerService';
import { logExporter } from '@/application/services/LogExporterService';
import { LOGGING_CONFIG } from '@/config/logging.config';
import { initConsoleFilter } from '@/utils/console-filter';
import { initGlobalErrorCapture } from '@/utils/error-capture';
// ✅ AJOUT : amorçage du cache du profil de déploiement
import { initProfileCache } from './config/profile-manager';

// Journalisation : niveau selon le mode, capture globale, filtrage console en production.
logger.init(isDebugMode() ? undefined : { minLevel: LOGGING_CONFIG.minLevel });
initGlobalErrorCapture();
initConsoleFilter();
logExporter.start();
logger.info('app', 'Application démarrée', { debugMode: isDebugMode() });

// Polyfill Buffer / global attendus par certaines librairies de rendu (PDF, parseurs).
import { Buffer as BufferPolyfill } from 'buffer';
const globalScope = globalThis as typeof globalThis & { Buffer?: unknown; global?: unknown };
if (!globalScope.global) globalScope.global = globalThis;
if (!globalScope.Buffer) globalScope.Buffer = BufferPolyfill;

// Validate VITE_* provider env vars at startup and warm the unified factory.
try {
  validateAppConfig();
} catch (e) {
  console.warn('[validateAppConfig]', e);
}
try {
  RepositoryFactory.init();
} catch (e) {
  console.warn('[RepositoryFactory.init]', e);
}

// Wire the persistent alignment repository (falls back silently to in-memory if the API is unreachable).
try {
  setAlignmentRepository(new SupabaseAlignmentRepository());
} catch {
  /* noop */
}

// Development mode uses local adapters; authentication remains mandatory.
if (isDevMode()) {
  console.log('🛠️ Development mode active: local authentication enabled');
}

/**
 * ⚠️ AMORÇAGE DU CACHE DU PROFIL DE DÉPLOIEMENT
 *
 * `buildConfig()` dans app.ts utilise `getActiveProfileSync()` qui lit le
 * cache interne de profile-manager. Sans cet appel, le cache est vide au
 * premier rendu React et le profil par défaut est utilisé au lieu du profil
 * persisté dans btp.system_settings.
 *
 * Le `.finally()` garantit que l'app démarre même si la lecture échoue
 * (offline, RLS, réseau) — dans ce cas, le profil par défaut est utilisé.
 */
initProfileCache().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <App />
      <DebugPanel />
    </ErrorBoundary>
  );
});