/**
 * Hexagonal Architecture Selectors Hooks
 * Uses services instead of direct Supabase calls
 * Follows hexagonal architecture principles
 */

import { EmployeeService } from '@/application/services/EmployeeService';
import { InspectorService } from '@/application/services/InspectorServiceSimple';
import { MaterialService, getMaterialService} from '@/application/services/MaterialService';
import { SupplierService, getSupplierService} from '@/application/services/SupplierService';
import { TenderService } from '@/application/services/TenderService';
import { UserService, getUserService} from '@/application/services/UserService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';

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
  /** Enrichissement RH : poste / département de l'employé lié (si trouvé). */
  position?: string | null;
  department?: string | null;
  /** Identifiant employé lié (rapprochement par email ou nom complet). */
  employee_id?: string | null;
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
  projectId: string;
  status?: string;
}

// ============= Hooks =============

const normalizeName = (value?: string | null) =>
  (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export function useUsersSelector(options?: {
  searchTerm?: string;
  roleFilter?: string[];
  /** Rapproche chaque utilisateur d'un employé (poste / département). */
  withEmployeeDetails?: boolean;
  enabled?: boolean;
}) {
  const withEmployeeDetails = options?.withEmployeeDetails !== false;

  return useQuery({
    queryKey: ['users-selector', options?.searchTerm, options?.roleFilter, withEmployeeDetails],
    queryFn: async (): Promise<UserProfile[]> => {
      const userService = getUserService();

      const result = await userService.searchUsers({
        searchTerm: options?.searchTerm,
        roleFilter: options?.roleFilter,
        limit: 50,
      });

      // Les services renvoient des entités (camelCase + getters) : on projette
      // explicitement vers le DTO plat attendu par les sélecteurs UI.
      let users: UserProfile[] = (result.users || []).map((u: any) => ({
        id: u.id,
        full_name: u.fullName ?? u.full_name ?? null,
        phone: u.phone ?? null,
        national_id: u.nationalId ?? u.national_id ?? null,
        email: typeof u.email === 'string' && !u.email.endsWith('@users.local') ? u.email : null,
        role: (typeof u.primaryRole === 'string' ? u.primaryRole : u.role) ?? null,
        is_active: u.isActive ?? u.is_active ?? true,
        created_at: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.created_at ?? null,
        updated_at: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : u.updated_at ?? null,
      }));

      // Filtre local de repli (autocomplétion sur le nom complet) au cas où la
      // recherche serveur ne filtre pas (données legacy sans full_name indexé).
      const term = normalizeName(options?.searchTerm);
      if (term.length > 0) {
        const filtered = users.filter(
          (u) =>
            normalizeName(u.full_name).includes(term) ||
            normalizeName(u.email).includes(term) ||
            normalizeName(u.national_id).includes(term) ||
            normalizeName(u.phone).includes(term)
        );
        if (filtered.length > 0) users = filtered;
      }

      if (withEmployeeDetails && users.length > 0) {
        try {
          const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
          const employees = await employeeService.searchEmployees({ isActive: true, limit: 200 });
          const byEmail = new Map<string, any>();
          const byName = new Map<string, any>();
          employees.employees.forEach((e: any) => {
            if (e.email) byEmail.set(normalizeName(e.email), e);
            if (e.fullName) byName.set(normalizeName(e.fullName), e);
          });
          users = users.map((u) => {
            const match =
              (u.email ? byEmail.get(normalizeName(u.email)) : undefined) ??
              byName.get(normalizeName(u.full_name));
            if (!match) return u;
            return {
              ...u,
              position: match.position ?? null,
              department: match.department ?? null,
              employee_id: match.employeeId ?? match.id ?? null,
              email: u.email ?? match.email ?? null,
            };
          });
        } catch {
          // L'enrichissement RH est optionnel : on garde la liste utilisateurs.
        }
      }

      return users;
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
      const supplierService = getSupplierService();
      
      const result = await supplierService.searchSuppliers({
        searchTerm,
        isActive: true,
        limit: 50
      });
      
      return result.suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        contact_person: null,
        phone: supplier.phone ?? null,
        email: supplier.email ?? null,
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
      const materialService = getMaterialService();
      
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
      
      return await tenderService.getProjectTenders({ projectId });
    },
    enabled: !!projectId,
    ...COMMON_QUERY_OPTIONS,
  });
}
