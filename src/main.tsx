
// reflect-metadata import removed - no longer needed without TypeORM
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { DEV_MODE } from './config/constants';
import { setAlignmentRepository } from '@/application/services/boq/AlignmentService';
import { SupabaseAlignmentRepository } from '@/infrastructure/supabase/adapters/SupabaseAlignmentRepository';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { validateAppConfig } from '@/config/app-validate';

// Validate VITE_* provider env vars at startup and warm the unified factory.
try { validateAppConfig(); } catch (e) { console.warn('[validateAppConfig]', e); }
try { RepositoryFactory.init(); } catch (e) { console.warn('[RepositoryFactory.init]', e); }

// Wire the persistent alignment repository (falls back silently to in-memory if the API is unreachable).
try { setAlignmentRepository(new SupabaseAlignmentRepository()); } catch { /* noop */ }

// Development mode uses local adapters; authentication remains mandatory.
if (DEV_MODE) {
  console.log('🛠️ Development mode active: local authentication enabled');
}

// Wrap the app with an error boundary to catch and handle errors gracefully
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
