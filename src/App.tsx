import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from './contexts/AuthContext';
import { KeycloakAuthProvider } from './contexts/KeycloakAuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ErrorFallback from './components/ErrorFallback';
import RoleBasedRoute from './components/auth/RoleBasedRoute';
import { DEV_MODE } from './config/constants';

// Public pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import Contact from './pages/Contact';
import Policy from './pages/Policy';
import Terms from './pages/Terms';

// Protected pages
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectCreate from './pages/ProjectCreate';
import ProjectEdit from './pages/ProjectEdit';
import ProjectImport from './pages/ProjectImport';
import TenderManagement from './pages/TenderManagement';
import Materials from './pages/Materials';
import MaterialDetail from './pages/MaterialDetail';
import MaterialCreate from './pages/MaterialCreate';
import MaterialEdit from './pages/MaterialEdit';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Documents from './pages/Documents';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import InspectionCreate from './pages/InspectionCreate';
import InspectionEdit from './pages/InspectionEdit';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierPortal from './pages/SupplierPortal';
import SupplierPasswordReset from './pages/SupplierPasswordReset';
import NotFound from './pages/NotFound';
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
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/policy" element={<Policy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/reset-password" element={<PasswordResetHandler />} />
                    <Route path="/supplier/reset-password" element={<SupplierPasswordReset />} />
                    
                    {/* Supplier Portal Route */}
                    <Route 
                      path="/supplier-portal" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['supplier']}
                          publicInDev={DEV_MODE}
                        >
                          <SupplierPortal />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    {/* Protected routes with role-based access */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director', 'agent']}
                          publicInDev={DEV_MODE}
                        >
                          <Dashboard />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/projects" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director', 'agent']}
                          publicInDev={DEV_MODE}
                        >
                          <Projects />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/projects/import" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director', 'agent']}
                          publicInDev={DEV_MODE}
                        >
                          <ProjectImport />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/projects/:id" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director', 'agent']}
                          publicInDev={DEV_MODE}
                        >
                          <ProjectDetail />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/projects/create" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director']}
                          publicInDev={DEV_MODE}
                        >
                          <ProjectCreate />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/projects/:id/edit" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director']}
                          publicInDev={DEV_MODE}
                        >
                          <ProjectEdit />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    {/* Tender Management Route */}
                    <Route 
                      path="/tender-management" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director']}
                          publicInDev={DEV_MODE}
                        >
                          <TenderManagement />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/materials" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director', 'agent', 'supplier']}
                          publicInDev={DEV_MODE}
                        >
                          <Materials />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/materials/:id" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director', 'agent', 'supplier']}
                          publicInDev={DEV_MODE}
                        >
                          <MaterialDetail />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/materials/create" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director']}
                          publicInDev={DEV_MODE}
                        >
                          <MaterialCreate />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/materials/:id/edit" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director']}
                          publicInDev={DEV_MODE}
                        >
                          <MaterialEdit />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/documents" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director', 'agent']}
                          publicInDev={DEV_MODE}
                        >
                          <Documents />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/tasks" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director', 'agent']}
                          publicInDev={DEV_MODE}
                        >
                          <Tasks />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/users" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'director']}
                          publicInDev={DEV_MODE}
                        >
                          <Users />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/supplier-dashboard" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['supplier']}
                          publicInDev={DEV_MODE}
                        >
                          <SupplierDashboard />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/inspections/create/:projectId" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director']}
                          publicInDev={DEV_MODE}
                        >
                          <InspectionCreate />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/inspections/:id/edit" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'manager', 'director']}
                          publicInDev={DEV_MODE}
                        >
                          <InspectionEdit />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/profile" 
                      element={
                        <RoleBasedRoute>
                          <Profile />
                        </RoleBasedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/settings" 
                      element={
                        <RoleBasedRoute 
                          allowedRoles={['admin', 'director']}
                          publicInDev={DEV_MODE}
                        >
                          <Settings />
                        </RoleBasedRoute>
                      } 
                    />
                    
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
