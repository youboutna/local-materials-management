
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { KeycloakAuthProvider } from './contexts/KeycloakAuthContext';
import MainNavbar from './components/MainNavbar';
import Footer from './components/Footer';
import { Toaster } from "./components/ui/sonner";
import { Toaster as UIToaster } from "./components/ui/toaster";
import ErrorBoundary from './components/ErrorBoundary';
import RoleBasedRoute from './components/auth/RoleBasedRoute';
import './App.css';

// Import pages
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectCreate from './pages/ProjectCreate';
import ProjectDetail from './pages/ProjectDetail';
import ProjectEdit from './pages/ProjectEdit';
import ProjectImport from './pages/ProjectImport';
import Materials from './pages/Materials';
import MaterialCreate from './pages/MaterialCreate';
import MaterialDetail from './pages/MaterialDetail';
import MaterialEdit from './pages/MaterialEdit';
import Documents from './pages/Documents';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Policy from './pages/Policy';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import InspectionCreate from './pages/InspectionCreate';
import InspectionEdit from './pages/InspectionEdit';
import ResetPassword from './pages/ResetPassword';
import SupplierPortal from './pages/SupplierPortal';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierPasswordReset from './pages/SupplierPasswordReset';
import TenderManagement from './pages/TenderManagement';
import TenderImport from './pages/TenderImport';
import PhaseDetail from './pages/PhaseDetail';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <KeycloakAuthProvider>
              <BrowserRouter>
                <div className="min-h-screen bg-background">
                  <MainNavbar />
                  <main className="pt-20">
                    <Routes>
                      {/* Public routes - always accessible */}
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/policy" element={<Policy />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/supplier-portal" element={<SupplierPortal />} />
                      <Route path="/supplier-password-reset" element={<SupplierPasswordReset />} />
                      
                      {/* Protected routes - require authentication unless in dev mode */}
                      <Route path="/home" element={
                        <RoleBasedRoute>
                          <Home />
                        </RoleBasedRoute>
                      } />
                      <Route path="/dashboard" element={
                        <RoleBasedRoute>
                          <Dashboard />
                        </RoleBasedRoute>
                      } />
                      <Route path="/projects" element={
                        <RoleBasedRoute>
                          <Projects />
                        </RoleBasedRoute>
                      } />
                      <Route path="/projects/create" element={
                        <RoleBasedRoute>
                          <ProjectCreate />
                        </RoleBasedRoute>
                      } />
                      <Route path="/projects/:id" element={
                        <RoleBasedRoute>
                          <ProjectDetail />
                        </RoleBasedRoute>
                      } />
                      <Route path="/projects/:id/edit" element={
                        <RoleBasedRoute>
                          <ProjectEdit />
                        </RoleBasedRoute>
                      } />
                      <Route path="/projects/:projectId/phases/:phaseId" element={
                        <RoleBasedRoute>
                          <PhaseDetail />
                        </RoleBasedRoute>
                      } />
                      <Route path="/projects/import" element={
                        <RoleBasedRoute>
                          <ProjectImport />
                        </RoleBasedRoute>
                      } />
                      <Route path="/materials" element={
                        <RoleBasedRoute>
                          <Materials />
                        </RoleBasedRoute>
                      } />
                      <Route path="/materials/create" element={
                        <RoleBasedRoute>
                          <MaterialCreate />
                        </RoleBasedRoute>
                      } />
                      <Route path="/materials/:id" element={
                        <RoleBasedRoute>
                          <MaterialDetail />
                        </RoleBasedRoute>
                      } />
                      <Route path="/materials/:id/edit" element={
                        <RoleBasedRoute>
                          <MaterialEdit />
                        </RoleBasedRoute>
                      } />
                      <Route path="/documents" element={
                        <RoleBasedRoute>
                          <Documents />
                        </RoleBasedRoute>
                      } />
                      <Route path="/tasks" element={
                        <RoleBasedRoute>
                          <Tasks />
                        </RoleBasedRoute>
                      } />
                      <Route path="/users" element={
                        <RoleBasedRoute allowedRoles={['admin', 'director']}>
                          <Users />
                        </RoleBasedRoute>
                      } />
                      <Route path="/settings" element={
                        <RoleBasedRoute>
                          <Settings />
                        </RoleBasedRoute>
                      } />
                      <Route path="/profile" element={
                        <RoleBasedRoute>
                          <Profile />
                        </RoleBasedRoute>
                      } />
                      <Route path="/user-profile" element={
                        <RoleBasedRoute>
                          <UserProfile />
                        </RoleBasedRoute>
                      } />
                      <Route path="/inspections/create" element={
                        <RoleBasedRoute>
                          <InspectionCreate />
                        </RoleBasedRoute>
                      } />
                      <Route path="/inspections/:id/edit" element={
                        <RoleBasedRoute>
                          <InspectionEdit />
                        </RoleBasedRoute>
                      } />
                      <Route path="/supplier-dashboard" element={
                        <RoleBasedRoute>
                          <SupplierDashboard />
                        </RoleBasedRoute>
                      } />
                      <Route path="/tender-management" element={
                        <RoleBasedRoute>
                          <TenderManagement />
                        </RoleBasedRoute>
                      } />
                      <Route path="/tender-import" element={
                        <RoleBasedRoute>
                          <TenderImport />
                        </RoleBasedRoute>
                      } />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                  <Toaster />
                  <UIToaster />
                </div>
              </BrowserRouter>
            </KeycloakAuthProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
