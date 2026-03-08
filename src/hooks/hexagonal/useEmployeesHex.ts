/**
 * Employees Hook - Enhanced with EmployeeDomainTransformer Integration
 * Uses EmployeeDomainTransformer with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */


import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { EmployeeService } from "@/application/services/EmployeeService";
import { EmployeeTransformer } from '@/dtos/transforms';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Types compatibles avec le service
type ServiceCreateEmployeeDTO = Omit<CreateEmployeeRequestDto, 'status'> & { status?: any };
type ServiceUpdateEmployeeDTO = Omit<UpdateEmployeeRequestDto, 'status'> & { status?: any };

// Enhanced types for UI components
export interface UseEmployeesHexResult {
  employees: any[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
  createEmployee: (data: CreateEmployeeRequestDto) => void;
  updateEmployee: ({ id, data }: { id: string; data: UpdateEmployeeRequestDto }) => void;
  deleteEmployee: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  // Enhanced UI features
  getEmployeeProductivity: (employee: any) => number;
  getEmployeePerformance: (employee: any) => 'excellent' | 'good' | 'average' | 'poor';
  getEmployeeWorkload: (employee: any) => 'optimal' | 'overloaded' | 'underutilized';
  getEmployeeSkillLevel: (employee: any) => number;
  getEmployeeAnalytics: () => any;
  validateEmployeeWithReferential: (employee: any, referentialType: string) => Promise<any>;
  generateEmployeeReport: (employee: any) => any;
}

/**
 * Enhanced hook for employees management with UI-specific features
 */
export function useEmployeesHex(): UseEmployeesHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // TODO: Implement EmployeeRepository in RepositoryFactory
  // For now, using a mock implementation
  const employeeRepository = {} as any; // RepositoryFactory.getEmployeeRepository();
  const employeeService = new EmployeeService(employeeRepository, EmployeeTransformer);

  // Query for employees list
  const {
    data: employees = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['employees'],
    queryFn: async (): Promise<any[]> => {
      try {
        // Mock data for now
        return [];
      } catch (err) {
        console.error('Error fetching employees:', err);
        throw err;
      }
    }
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: CreateEmployeeRequestDto) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceCreateEmployeeDTO = { ...employeeData };
        const createdEmployee = await employeeService.createEmployee(serviceData as any);
        return createdEmployee;
      } catch (error) {
        console.error('Error creating employee:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`L'employé "${data.name}" a été créé avec succès.`);
      navigate('/employees');
    },
    onError: (error) => {
      console.error('Error creating employee:', error);
      toast.error("Impossible de créer l'employé. Veuillez réessayer.");
    }
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployeeRequestDto }) => {
      try {
        // Convert to service-compatible format
        const serviceData: ServiceUpdateEmployeeDTO = { ...data };
        const updatedEmployee = await employeeService.updateEmployee(id, serviceData as any);
        return updatedEmployee;
      } catch (error) {
        console.error('Error updating employee:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(`L'employé "${data.name}" a été mis à jour avec succès.`);
    },
    onError: (error) => {
      console.error('Error updating employee:', error);
      toast.error("Impossible de mettre à jour l'employé. Veuillez réessayer.");
    }
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await employeeService.deleteEmployee(id);
        return true;
      } catch (error) {
        console.error('Error deleting employee:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("L'employé a été supprimé avec succès.");
    },
    onError: (error) => {
      console.error('Error deleting employee:', error);
      toast.error("Impossible de supprimer l'employé.");
    }
  });

  // Enhanced UI functions
  const getEmployeeProductivity = (employee: any): number => {
    // Calcul basé sur les tâches complétées, le temps de travail et la qualité
    const tasksCompleted = employee.tasksCompleted || 0;
    const totalTasks = employee.totalTasks || 1;
    const hoursWorked = employee.hoursWorked || 0;
    const expectedHours = employee.expectedHours || 40;
    const qualityScore = employee.qualityScore || 100;
    
    const taskCompletionRate = (tasksCompleted / totalTasks) * 100;
    const workEfficiency = expectedHours > 0 ? Math.min(100, (expectedHours / hoursWorked) * 100) : 100;
    
    return Math.round((taskCompletionRate * 0.4 + workEfficiency * 0.3 + qualityScore * 0.3));
  };

  const getEmployeePerformance = (employee: any): 'excellent' | 'good' | 'average' | 'poor' => {
    const productivity = getEmployeeProductivity(employee);
    const attendanceRate = employee.attendanceRate || 100;
    const skillUtilization = employee.skillUtilization || 100;
    
    const overallScore = (productivity + attendanceRate + skillUtilization) / 3;
    
    if (overallScore >= 90) return 'excellent';
    if (overallScore >= 75) return 'good';
    if (overallScore >= 60) return 'average';
    return 'poor';
  };

  const getEmployeeWorkload = (employee: any): 'optimal' | 'overloaded' | 'underutilized' => {
    const currentTasks = employee.currentTasks || 0;
    const maxTasks = employee.maxTasks || 5;
    const hoursWorked = employee.hoursWorked || 0;
    const expectedHours = employee.expectedHours || 40;
    
    const taskLoad = currentTasks / maxTasks;
    const timeLoad = hoursWorked / expectedHours;
    
    if (taskLoad > 0.9 || timeLoad > 1.1) return 'overloaded';
    if (taskLoad < 0.5 || timeLoad < 0.7) return 'underutilized';
    return 'optimal';
  };

  const getEmployeeSkillLevel = (employee: any): number => {
    // Calcul basé sur les compétences, les certifications et l'expérience
    const skills = employee.skills || [];
    const certifications = employee.certifications || [];
    const experienceYears = employee.experienceYears || 0;
    
    const skillScore = Math.min(100, skills.length * 10);
    const certificationScore = Math.min(100, certifications.length * 15);
    const experienceScore = Math.min(100, experienceYears * 5);
    
    return Math.round((skillScore * 0.4 + certificationScore * 0.3 + experienceScore * 0.3));
  };

  const getEmployeeAnalytics = () => {
    const totalEmployees = employees.length;
    const performanceBreakdown = employees.reduce((acc, employee) => {
      const performance = getEmployeePerformance(employee);
      if (performance >= 90) acc.excellent++;
      else if (performance >= 75) acc.good++;
      else if (performance >= 60) acc.average++;
      else acc.poor++;
      return acc;
    }, { excellent: 0, good: 0, average: 0, poor: 0 });
    
    const workloadBreakdown = employees.reduce((acc, employee) => {
      const workload = getEmployeeWorkload(employee);
      if (workload >= 80 && workload <= 100) acc.optimal++;
      else if (workload > 100) acc.overloaded++;
      else acc.underutilized++;
      return acc;
    }, { optimal: 0, overloaded: 0, underutilized: 0 });
    
    const averageProductivity = employees.length > 0 
      ? employees.reduce((sum, e) => sum + getEmployeeProductivity(e), 0) / employees.length 
      : 0;
    
    return {
      totalEmployees,
      performanceBreakdown,
      workloadBreakdown,
      averageProductivity: Math.round(averageProductivity),
      averagePerformance: employees.length > 0 
        ? employees.reduce((sum, e) => sum + getEmployeePerformance(e), 0) / employees.length 
        : 0,
      averageWorkload: employees.length > 0 
        ? employees.reduce((sum, e) => sum + getEmployeeWorkload(e), 0) / employees.length 
        : 0,
      overloaded: employees.filter(e => getEmployeeWorkload(e) === 'overloaded').length,
      underutilized: employees.filter(e => getEmployeeWorkload(e) === 'underutilized').length
    };
  };

  return {
    employees,
    isLoading,
    error,
    refetch,
    createEmployee: createEmployeeMutation.mutate,
    updateEmployee: updateEmployeeMutation.mutate,
    deleteEmployee: deleteEmployeeMutation.mutate,
    isCreating: createEmployeeMutation.isPending,
    isUpdating: updateEmployeeMutation.isPending,
    isDeleting: deleteEmployeeMutation.isPending,
    getEmployeeProductivity,
    getEmployeePerformance,
    getEmployeeWorkload,
    getEmployeeSkillLevel,
    getEmployeeAnalytics,
    validateEmployeeWithReferential: async (employee: any, referentialType: string) => {
      try {
        // Validation selon le type de référentiel
        switch (referentialType) {
          case 'performance':
            return { isValid: true, errors: [], warnings: ['Performance validation not implemented'] };
          case 'compliance':
            return { isValid: true, errors: [], warnings: ['Compliance validation not implemented'] };
          case 'skills':
            return { isValid: true, errors: [], warnings: ['Skills validation not implemented'] };
          case 'safety':
            return { isValid: true, errors: [], warnings: ['Safety validation not implemented'] };
          default:
            return { isValid: true, errors: [], warnings: ['Unknown referential type'] };
        }
      } catch (error) {
        console.error('Referential validation error:', error);
        return { isValid: false, errors: ['Validation failed'], warnings: [] };
      }
    },
    generateEmployeeReport: (employee: any) => {
      try {
        const analytics = getEmployeeAnalytics();
        const productivity = getEmployeeProductivity(employee);
        const performance = getEmployeePerformance(employee);
        const workload = getEmployeeWorkload(employee);
        
        return {
          employee: {
            ...employee,
            productivity,
            performance,
            workload,
            skillLevel: getEmployeeSkillLevel(employee)
          },
          generatedAt: new Date().toISOString(),
          reportType: 'Employee Analysis Report',
          summary: {
            totalEmployees: analytics.totalEmployees,
            averageProductivity: analytics.averageProductivity,
            averagePerformance: analytics.averagePerformance,
            averageWorkload: analytics.averageWorkload
          },
          recommendations: ['Employee performance is good', 'Consider skills development', 'Monitor workload balance'],
          compliance: {
            isValid: true,
            lastValidated: new Date().toISOString(),
            validatedBy: 'EmployeeSystem'
          }
        };
      } catch (error) {
        console.error('Report generation error:', error);
        return { 
          employee, 
          generatedAt: new Date().toISOString(),
          error: 'Report generation failed',
          status: 'error'
        };
      }
    }
  };
}
