
// reflect-metadata import removed - no longer needed without TypeORM
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { DEV_MODE } from './config/constants';

// In development mode, log that authentication is bypassed
if (DEV_MODE) {
  console.log('🛠️ Development mode active: Authentication is bypassed');
}

// Wrap the app with an error boundary to catch and handle errors gracefully
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
