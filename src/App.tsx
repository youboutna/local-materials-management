import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ErrorFallback } from './components/ErrorFallback';
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

const queryClient = new QueryClientProvider();

function App() {
  return (
    <QueryClient.Provider value={queryClient}>
      <LanguageProvider>
        <AuthProvider>
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
                  
                  {/* Password Reset Route */}
                  <Route path="/reset-password" element={<PasswordResetHandler />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </ErrorBoundary>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </QueryClient.Provider>
  );
}

export default App;
