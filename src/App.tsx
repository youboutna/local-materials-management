import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { UnifiedAuthProvider } from "./contexts/UnifiedAuthContext";
import { KeycloakAuthProvider } from "./contexts/KeycloakAuthContext";
import MainNavbar from "./components/MainNavbar";
import Footer from "./components/Footer";
import { Toaster } from "./components/ui/sonner";
import { Toaster as UIToaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import RoleBasedRoute from "./components/auth/RoleBasedRoute";
import "./App.css";

// Import pages
import Home from "./pages/Home";
import Projects from "./pages/Projects";
import ProjectCreate from "./pages/ProjectCreate";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectEdit from "./pages/ProjectEdit";
import ProjectImport from "./pages/ProjectImport";
import Materials from "./pages/Materials";
import MaterialCreate from "./pages/MaterialCreate";
import MaterialDetail from "./pages/MaterialDetail";
import MaterialEdit from "./pages/MaterialEdit";
import Documents from "./pages/Documents";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import Employees from "./pages/Employees";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Policy from "./pages/Policy";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import InspectionCreate from "./pages/InspectionCreate";
import InspectionEdit from "./pages/InspectionEdit";
import InspectionDetail from "./pages/InspectionDetail";
import ResetPassword from "./pages/ResetPassword";
import UnifiedSupplierPortal from "./pages/UnifiedSupplierPortal";
import SupplierPasswordReset from "./pages/SupplierPasswordReset";
import TenderManagement from "./pages/TenderManagement";
import TenderImport from "./pages/TenderImport";
import PhaseDetail from "./pages/PhaseDetail";
import ProjectPhasesDetail from "./pages/ProjectPhasesDetail";
import Suppliers from "./pages/Suppliers";
import EnhancedDashboard from "./pages/EnhancedDashboard";
import BankGuaranteeMonitorPage from "./pages/BankGuaranteeMonitor";
import InspectionMonitoringPage from "./pages/InspectionMonitoring";
import NotificationsCenterPage from "./pages/NotificationsCenter";
import InsuranceManagementPage from "./pages/InsuranceManagement";
import PaymentControlPage from "./pages/PaymentControl";
import ComprehensiveMonitoringPage from "./pages/ComprehensiveMonitoring";
import EnhancedSupplierTenderPortal from "./components/suppliers/EnhancedSupplierTenderPortal";
import { SupplierSecureAccessPortal } from "./components/tenders/SupplierSecureAccessPortal";
import { EvaluationAccessPortal } from "./components/tenders/EvaluationAccessPortal";
import SupplierSubmissionDashboard from "./components/suppliers/SupplierSubmissionDashboard";
import WorkflowTest from "./pages/WorkflowTest";
import MergedNavbar from "./components/MergedNavbar";
import PhaseDetailsPage from "./components/project/PhaseDetailsPage";
import { DEV_MODE } from "./config/constants";
import EnhancedMaterialForm from "./components/materials/EnhancedMaterialForm";

// Force rebuild - updated 2026-01-07
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  // En mode développement, ajouter automatiquement les rôles requis
  if (DEV_MODE) {
    // Rôles requis: admin, director, project_manager
    console.log('🚀 Mode Développement - Rôles requis activés: admin, director, project_manager');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <LanguageProvider>
          <AuthProvider>
            <UnifiedAuthProvider>
              <KeycloakAuthProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <div className="min-h-screen bg-background">
                  <MergedNavbar />
                  <main className="pt-16">
                    <Routes>
                      {/* Public routes - always accessible */}
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/policy" element={<Policy />} />
                      <Route
                        path="/reset-password"
                        element={<ResetPassword />}
                      />
                      <Route
                        path="/supplier-portal"
                        element={<UnifiedSupplierPortal />}
                      />
                      <Route
                        path="/supplier-tender"
                        element={<EnhancedSupplierTenderPortal />}
                      />
                      <Route
                        path="/supplier-submissions"
                        element={<SupplierSubmissionDashboard />}
                      />
                      <Route
                        path="/supplier-access"
                        element={<SupplierSecureAccessPortal />}
                      />
                      <Route
                        path="/evaluation-access"
                        element={<EvaluationAccessPortal />}
                      />
                      <Route
                        path="/supplier-password-reset"
                        element={<SupplierPasswordReset />}
                      />
                      <Route path="/workflow-test" element={<WorkflowTest />} />

                      {/* Protected routes - require authentication unless in dev mode */}
                      <Route
                        path="/home"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <Home />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/dashboard"
                        element={
                          <RoleBasedRoute
                            allowedRoles={
                              DEV_MODE 
                                ? ["admin", "director", "project_manager"] // Rôles requis en mode dev
                                : ["admin", "director"]
                            }
                          >
                            <Dashboard />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/enhanced-dashboard"
                        element={
                          <RoleBasedRoute
                            allowedRoles={
                              DEV_MODE 
                                ? ["admin", "director", "project_manager"] // Rôles requis en mode dev
                                : ["admin", "director"]
                            }
                          >
                            <EnhancedDashboard />
                          </RoleBasedRoute>
                        }
                      />
                      {/* Projects - unified routing with allowedRoles */}
                      <Route
                        path="/projects"
                        element={
                          <RoleBasedRoute
                            allowedRoles={
                              DEV_MODE 
                                ? ["admin", "director", "project_manager"] // Rôles requis en mode dev
                                : ["admin", "director", "project_manager", "manager"]
                            }
                          >
                            <Projects />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/projects/create"
                        element={
                          <RoleBasedRoute
                            allowedRoles={
                              DEV_MODE 
                                ? ["admin", "director", "project_manager"] // Rôles requis en mode dev
                                : ["admin", "director", "project_manager", "manager"]
                            }
                          >
                            <ProjectCreate />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/projects/:id"
                        element={
                          <RoleBasedRoute
                            allowedRoles={
                              DEV_MODE 
                                ? ["admin", "director", "project_manager"] // Rôles requis en mode dev
                                : ["admin", "director", "project_manager", "manager"]
                            }
                          >
                            <ProjectDetail />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/projects/:id/edit"
                        element={
                          <RoleBasedRoute
                            allowedRoles={
                              DEV_MODE 
                                ? ["admin", "director", "project_manager"] // Rôles requis en mode dev
                                : ["admin", "director", "project_manager", "manager"]
                            }
                          >
                            <ProjectEdit />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/projects/:projectId/phases/:phaseId"
                        element={<PhaseDetailsPage />}
                      />
                      <Route
                        path="/projects/:id/edit/phases/detail"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <ProjectPhasesDetail />
                          </RoleBasedRoute>
                        }
                      />
                      {/* <Route
                        path="/projects/:projectId/phases/:phaseId"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <PhaseDetail />
                          </RoleBasedRoute>
                        }
                      /> */}
                      <Route
                        path="/projects/import"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <ProjectImport />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/materials"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <Materials />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/materials/create"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <MaterialCreate />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/materials/:id"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <MaterialDetail />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/materials/:id/edit"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <MaterialEdit />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/documents"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <Documents />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/tasks"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <Tasks />
                          </RoleBasedRoute>
                        }
                      />
                      <Route path="/tasks/:taskId" element={<TaskDetail />} />
                      <Route
                        path="/employees"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <Employees />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <RoleBasedRoute allowedRoles={["admin", "director"]}>
                            <Users />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <RoleBasedRoute allowedRoles={["admin", "director"]}>
                            <Settings />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <Profile />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/user-profile"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <UserProfile />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/inspections/create"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <InspectionCreate />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/inspections/:id"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <InspectionDetail />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/inspections/:id/edit"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <InspectionEdit />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/tender-management"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <TenderManagement />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/tender-import"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <TenderImport />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/suppliers"
                        element={
                          <RoleBasedRoute disallowedRoles={["supplier"]}>
                            <Suppliers />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/bank-guarantee-monitor"
                        element={
                          <RoleBasedRoute
                            allowedRoles={[
                              "admin",
                              "director",
                              "project_manager","manager",
                              "engineering_consultant",
                            ]}
                          >
                            <BankGuaranteeMonitorPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/inspection-monitoring"
                        element={
                          <RoleBasedRoute
                            allowedRoles={[
                              "admin",
                              "director",
                              "engineering_consultant",
                              "project_manager",
                            ]}
                          >
                            <InspectionMonitoringPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/notifications-center"
                        element={
                          <RoleBasedRoute
                            allowedRoles={[
                              "admin",
                              "director",
                              "project_manager",
                              "engineering_consultant",
                            ]}
                          >
                            <NotificationsCenterPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/insurance-management"
                        element={
                          <RoleBasedRoute
                            allowedRoles={[
                              "admin",
                              "director",
                              "project_manager",
                              "legal",
                            ]}
                          >
                            <InsuranceManagementPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/payment-control"
                        element={
                          <RoleBasedRoute
                            allowedRoles={[
                              "admin",
                              "director",
                              "finance_manager",
                              "project_manager","manager"
                            ]}
                          >
                            <PaymentControlPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route
                        path="/monitoring"
                        element={
                          <RoleBasedRoute
                            allowedRoles={[
                              "admin",
                              "director",
                              "project_manager",
                              "manager",
                              "engineering_consultant",
                            ]}
                          >
                            <ComprehensiveMonitoringPage />
                          </RoleBasedRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                  <Toaster />
                  <UIToaster />
                </div>
              </BrowserRouter>
            </KeycloakAuthProvider>
          </UnifiedAuthProvider>
        </AuthProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
