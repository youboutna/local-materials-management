
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KeycloakAuthProvider } from './contexts/KeycloakAuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectCreate from './pages/ProjectCreate';
import ProjectEdit from './pages/ProjectEdit';
import Materials from './pages/Materials';
import MaterialCreate from './pages/MaterialCreate';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Auth from './pages/Auth';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Policy from './pages/Policy';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <KeycloakAuthProvider>
        <AuthProvider>
          <LanguageProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                {/* Public static pages */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/policy" element={<Policy />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
                <Route path="/projects/create" element={<ProtectedRoute><ProjectCreate /></ProtectedRoute>} />
                <Route path="/projects/edit/:id" element={<ProtectedRoute><ProjectEdit /></ProtectedRoute>} />
                <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
                <Route path="/materials/create" element={<ProtectedRoute><MaterialCreate /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                
                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </LanguageProvider>
        </AuthProvider>
      </KeycloakAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
