
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Index from './pages/Index';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectCreate from './pages/ProjectCreate';
import ProjectEdit from './pages/ProjectEdit';
import Materials from './pages/Materials';
import MaterialCreate from './pages/MaterialCreate';
import Users from './pages/Users';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/projects/new" element={<ProjectCreate />} />
          <Route path="/projects/:id/edit" element={<ProjectEdit />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/materials/new" element={<MaterialCreate />} />
          <Route path="/users" element={<Users />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </LanguageProvider>
  );
}

export default App;
