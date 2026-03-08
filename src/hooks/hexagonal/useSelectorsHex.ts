/**
 * Hexagonal Architecture Selectors Hooks
 * Uses services instead of direct Supabase calls
 * Follows hexagonal architecture principles
 */

import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { InspectorService } from '@/application/services/InspectorServiceSimple';
import { TenderService } from '@/application/services/TenderServiceSimple';
import { SupplierService } from '@/application/services/SupplierService';
import { UserService } from '@/application/services/UserService';
import { ProjectService } from '@/application/services/ProjectService';
import { MaterialService } from '@/application/services/MaterialService';
import { EmployeeService } from '@/application/services/EmployeeService';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';

// Configuration commune pour éviter les appels en continu
const COMMON_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};
// ============= Types =============
export interface UserProfile {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  national_id?: string | null;
  role?: string | null;
  email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean;
}

export interface ProjectOption {
  id: string;
  title: string;
  location?: string | null;
  status?: string | null;
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  project_reference?: string | null;
}

export interface SupplierOption {
  id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  category?: string | null;
  rating?: number | null;
  is_active: boolean | null;
}

export interface MaterialOption {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  origin_location?: string | null;
}

export interface EmployeeOption {
  id: string;
  full_name: string;
  position?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  employee_id: string;
  is_active?: boolean | null;
}

export interface Inspector {
  id: string;
  name: string;
  type: 'employee' | 'supplier';
  position?: string;
  role?: string;
}

export interface TenderOption {
  id: string;
  title: string;
  reference: string;
  project_id: string;
  status?: string;
}

// ============= Hooks =============

export function useUsersSelector(options?: {
  searchTerm?: string;
  roleFilter?: string[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['users-selector', options?.searchTerm, options?.roleFilter],
    queryFn: async (): Promise<UserProfile[]> => {
      const userService = new UserService(
        RepositoryFactory.getUserRepository()
      );
      
      const result = await userService.searchUsers({
        searchTerm: options?.searchTerm,
        roleFilter: options?.roleFilter,
        limit: 50
      });
      
      return result.users;
    },
    enabled: options?.enabled !== false,
    ...COMMON_QUERY_OPTIONS,
  });
}

export function useProjectsSelector(options?: {
  searchTerm?: string;
  secureMode?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['projects-selector', options?.searchTerm, options?.secureMode],
    queryFn: async (): Promise<ProjectOption[]> => {
      const projectRepo = RepositoryFactory.getProjectRepository();
      const projects = await projectRepo.findAll();
      
      return projects.map((p: any) => ({
        id: p.id,
        title: p.title,
        location: p.location,
        status: p.status,
        budget: p.budget,
        start_date: p.startDate || p.start_date,
        end_date: p.endDate || p.end_date,
        project_reference: p.projectReference || p.project_reference,
      }));
    },
    enabled: options?.enabled !== false,
    ...COMMON_QUERY_OPTIONS,
  });
}

export function useSuppliersSelector(searchTerm?: string, enabled?: boolean) {
  return useQuery({
    queryKey: ['suppliers-selector', searchTerm],
    queryFn: async (): Promise<SupplierOption[]> => {
      const supplierService = new SupplierService(
        RepositoryFactory.getSupplierRepository()
      );
      
      const result = await supplierService.searchSuppliers({
        searchTerm,
        isActive: true,
        limit: 50
      });
      
      return result.suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        contact_person: null,
        phone: null,
        email: null,
        category: supplier.category || null,
        rating: supplier.rating || null,
        is_active: supplier.isActive
      }));
    },
    enabled: enabled !== false,
    ...COMMON_QUERY_OPTIONS,
  });
}

export function useMaterialsSelector(options?: {
  searchTerm?: string;
  category?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['materials-selector', options?.searchTerm, options?.category],
    queryFn: async (): Promise<MaterialOption[]> => {
      const materialService = new MaterialService(
        RepositoryFactory.getMaterialRepository()
      );
      
      let materials: any[] = [];
      
      if (options?.searchTerm) {
        materials = await materialService.searchMaterials(options.searchTerm) as any[];
      } else {
        materials = await materialService.getAllMaterials() as any[];
      }
      
      if (options?.category && options.category !== 'all') {
        materials = materials.filter((m: any) => m.category === options.category);
      }
      
      return materials.map((material: any) => ({
        id: material.id,
        name: material.name,
        description: material.description || '',
        category: material.category,
        unit: material.unit,
        price_per_unit: material.pricePerUnit || material.price_per_unit || 0,
        available_quantity: material.availableQuantity || material.available_quantity || 0,
        origin_location: material.originLocation || null
      }));
    },
    enabled: options?.enabled !== false,
    ...COMMON_QUERY_OPTIONS,
  });
}

export function useEmployeesSelector(options?: {
  searchTerm?: string;
  departmentFilter?: string[];
  positionFilter?: string[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['employees-selector', options?.searchTerm, options?.departmentFilter, options?.positionFilter],
    queryFn: async (): Promise<EmployeeOption[]> => {
      const employeeService = new EmployeeService(
        RepositoryFactory.getEmployeeRepository()
      );
      
      const result = await employeeService.searchEmployees({
        searchTerm: options?.searchTerm,
        departmentFilter: options?.departmentFilter,
        positionFilter: options?.positionFilter,
        isActive: true,
        limit: 50
      });
      
      return result.employees.map(employee => ({
        id: employee.id,
        full_name: employee.fullName || '',
        position: employee.position,
        department: employee.department,
        email: employee.email,
        phone: employee.phone,
        employee_id: employee.employeeId || '',
        is_active: employee.isActive
      }));
    },
    enabled: options?.enabled !== false,
    ...COMMON_QUERY_OPTIONS,
  });
}

export function useInspectorsSelector(projectId?: string) {
  return useQuery({
    queryKey: ['inspectors-selector', projectId],
    queryFn: async (): Promise<Inspector[]> => {
      const inspectorService = new InspectorService(
        RepositoryFactory.getEmployeeRepository(),
        RepositoryFactory.getSupplierRepository()
      );
      
      return await inspectorService.getInspectors();
    },
    ...COMMON_QUERY_OPTIONS,
  });
}

export function useProjectTenders(projectId?: string) {
  return useQuery({
    queryKey: ['project-tenders-selector', projectId],
    queryFn: async (): Promise<TenderOption[]> => {
      if (!projectId) return [];
      
      const tenderService = new TenderService(
        RepositoryFactory.getTenderRepository()
      );
      
      return await tenderService.getProjectTenders(projectId);
    },
    enabled: !!projectId,
    ...COMMON_QUERY_OPTIONS,
  });
}
