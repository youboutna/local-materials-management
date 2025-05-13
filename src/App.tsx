
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { KeycloakAuthProvider } from '@/contexts/KeycloakAuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Pages
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import ProjectCreate from '@/pages/ProjectCreate';
import ProjectEdit from '@/pages/ProjectEdit';
import Materials from '@/pages/Materials';
import MaterialCreate from '@/pages/MaterialCreate';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import UserProfile from '@/pages/UserProfile';
import Settings from '@/pages/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';

// Create a client
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
      <KeycloakAuthProvider>
        <AuthProvider>
          <LanguageProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/projects" element={
                  <ProtectedRoute>
                    <Projects />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:id" element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                } />
                <Route path="/projects/create" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <ProjectCreate />
                  </ProtectedRoute>
                } />
                <Route path="/projects/edit/:id" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <ProjectEdit />
                  </ProtectedRoute>
                } />
                <Route path="/materials" element={
                  <ProtectedRoute>
                    <Materials />
                  </ProtectedRoute>
                } />
                <Route path="/materials/create" element={
                  <ProtectedRoute requiredRoles={['admin', 'material-manager']}>
                    <MaterialCreate />
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
            <Toaster />
          </LanguageProvider>
        </AuthProvider>
      </KeycloakAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
