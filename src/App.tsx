
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { KeycloakAuthProvider } from './contexts/KeycloakAuthContext';
import MainNavbar from './components/MainNavbar';
import Footer from './components/Footer';
import { Toaster } from "./components/ui/sonner";
import { Toaster as UIToaster } from "./components/ui/toaster";
import ErrorBoundary from './components/ErrorBoundary';
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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <KeycloakAuthProvider>
              <div className="min-h-screen bg-background">
                <MainNavbar />
                <main className="pt-20">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/create" element={<ProjectCreate />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/projects/:id/edit" element={<ProjectEdit />} />
                    <Route path="/projects/import" element={<ProjectImport />} />
                    <Route path="/materials" element={<Materials />} />
                    <Route path="/materials/create" element={<MaterialCreate />} />
                    <Route path="/materials/:id" element={<MaterialDetail />} />
                    <Route path="/materials/:id/edit" element={<MaterialEdit />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/user-profile" element={<UserProfile />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/policy" element={<Policy />} />
                    <Route path="/inspections/create" element={<InspectionCreate />} />
                    <Route path="/inspections/:id/edit" element={<InspectionEdit />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/supplier-portal" element={<SupplierPortal />} />
                    <Route path="/supplier-dashboard" element={<SupplierDashboard />} />
                    <Route path="/supplier-password-reset" element={<SupplierPasswordReset />} />
                    <Route path="/tender-management" element={<TenderManagement />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
                <Toaster />
                <UIToaster />
              </div>
            </KeycloakAuthProvider>
          </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
