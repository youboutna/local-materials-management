
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from './contexts/AuthContext';
import { KeycloakAuthProvider } from './contexts/KeycloakAuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ErrorFallback from './components/ErrorFallback';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectCreate from './pages/ProjectCreate';
import ProjectEdit from './pages/ProjectEdit';
import Materials from './pages/Materials';
import MaterialDetail from './pages/MaterialDetail';
import MaterialCreate from './pages/MaterialCreate';
import MaterialEdit from './pages/MaterialEdit';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import InspectionCreate from './pages/InspectionCreate';
import InspectionEdit from './pages/InspectionEdit';
import PasswordResetHandler from './components/auth/PasswordResetHandler';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <KeycloakAuthProvider>
            <Router>
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <div className="min-h-screen bg-gradient-to-br from-adrar-50 to-terracotta-50">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/projects/create" element={<ProjectCreate />} />
                    <Route path="/projects/:id/edit" element={<ProjectEdit />} />
                    <Route path="/materials" element={<Materials />} />
                    <Route path="/materials/:id" element={<MaterialDetail />} />
                    <Route path="/materials/create" element={<MaterialCreate />} />
                    <Route path="/materials/:id/edit" element={<MaterialEdit />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/inspections/create/:projectId" element={<InspectionCreate />} />
                    <Route path="/inspections/:id/edit" element={<InspectionEdit />} />
                    <Route path="/reset-password" element={<PasswordResetHandler />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </ErrorBoundary>
            </Router>
          </KeycloakAuthProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
