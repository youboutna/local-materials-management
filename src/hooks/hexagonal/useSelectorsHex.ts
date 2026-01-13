import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ============= Types =============
export interface UserProfile {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  national_id?: string | null;
  role?: string | null;
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
}) {
  return useQuery({
    queryKey: ['users-selector', options?.searchTerm, options?.roleFilter],
    queryFn: async (): Promise<UserProfile[]> => {
      let profileQuery = supabase
        .from('profiles')
        .select('id, full_name, phone, national_id, role')
        .order('full_name', { ascending: true });

      if (options?.searchTerm) {
        profileQuery = profileQuery.or(
          `full_name.ilike.%${options.searchTerm}%,phone.ilike.%${options.searchTerm}%,national_id.ilike.%${options.searchTerm}%`
        );
      }

      if (options?.roleFilter?.length) {
        profileQuery = profileQuery.in('role', options.roleFilter as any);
      }

      const { data: profileData, error: profileError } = await profileQuery.limit(30);
      if (profileError) throw profileError;

      let supplierQuery = supabase
        .from('suppliers')
        .select('id, name, email, user_id')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (options?.searchTerm) {
        supplierQuery = supplierQuery.or(
          `name.ilike.%${options.searchTerm}%,email.ilike.%${options.searchTerm}%`
        );
      }

      const { data: supplierData } = await supplierQuery.limit(20);

      const users: UserProfile[] = profileData?.map(p => ({
        id: p.id,
        full_name: p.full_name,
        phone: p.phone,
        national_id: p.national_id,
        role: p.role
      })) || [];

      supplierData?.forEach(supplier => {
        if (!users.some(u => u.id === supplier.user_id)) {
          users.push({
            id: supplier.id,
            full_name: supplier.name || 'Fournisseur',
            phone: supplier.email || undefined,
            role: 'supplier'
          });
        }
      });

      return users;
    }
  });
}

export function useProjectsSelector(options?: {
  searchTerm?: string;
  secureMode?: boolean;
}) {
  return useQuery({
    queryKey: ['projects-selector', options?.searchTerm, options?.secureMode],
    queryFn: async (): Promise<ProjectOption[]> => {
      if (options?.secureMode) {
        const { data, error } = await supabase
          .rpc('search_projects_autocomplete', { search_term: options?.searchTerm || '' });
        if (error) throw error;
        return data || [];
      }

      let query = supabase
        .from('projects')
        .select('id, title, location, status, budget, start_date, end_date, project_reference')
        .order('title');

      if (options?.searchTerm) {
        query = query.or(
          `title.ilike.%${options.searchTerm}%,location.ilike.%${options.searchTerm}%,project_reference.ilike.%${options.searchTerm}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
}

export function useSuppliersSelector(searchTerm?: string) {
  return useQuery({
    queryKey: ['suppliers-selector', searchTerm],
    queryFn: async (): Promise<SupplierOption[]> => {
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });
}

export function useMaterialsSelector(options?: {
  searchTerm?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['materials-selector', options?.searchTerm, options?.category],
    queryFn: async (): Promise<MaterialOption[]> => {
      let query = supabase
        .from('materials')
        .select('id, name, description, category, unit, price_per_unit, available_quantity, origin_location')
        .order('name');

      const { data, error } = await query;
      if (error) throw error;
      
      let filtered = data || [];
      
      if (options?.searchTerm) {
        const term = options.searchTerm.toLowerCase();
        filtered = filtered.filter(m => 
          m.name?.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term) ||
          m.category?.toLowerCase().includes(term)
        );
      }
      
      if (options?.category && options.category !== 'all') {
        filtered = filtered.filter(m => m.category === options.category);
      }
      
      return filtered;
    }
  });
}

export function useEmployeesSelector(options?: {
  searchTerm?: string;
  departmentFilter?: string[];
  positionFilter?: string[];
}) {
  return useQuery({
    queryKey: ['employees-selector', options?.searchTerm, options?.departmentFilter, options?.positionFilter],
    queryFn: async (): Promise<EmployeeOption[]> => {
      let query = supabase
        .from('employees')
        .select('id, full_name, position, department, email, phone, employee_id, is_active')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (options?.searchTerm) {
        query = query.or(
          `full_name.ilike.%${options.searchTerm}%,position.ilike.%${options.searchTerm}%,department.ilike.%${options.searchTerm}%,employee_id.ilike.%${options.searchTerm}%`
        );
      }

      if (options?.departmentFilter?.length) {
        query = query.in('department', options.departmentFilter);
      }

      if (options?.positionFilter?.length) {
        query = query.in('position', options.positionFilter);
      }

      const { data, error } = await query.limit(50);
      if (error) {
        console.error('Error fetching employees:', error);
        return [];
      }

      return data || [];
    }
  });
}

export function useInspectorsSelector(projectId?: string) {
  return useQuery({
    queryKey: ['inspectors-selector', projectId],
    queryFn: async (): Promise<Inspector[]> => {
      const inspectorsList: Inspector[] = [];

      if (projectId) {
        const { data: stakeholders, error } = await supabase
          .from('project_stakeholders')
          .select(`
            id,
            stakeholder_type,
            stakeholder_entity_type,
            role_description,
            employee_id,
            supplier_id,
            employees:employee_id (
              id,
              full_name,
              position,
              department
            ),
            suppliers:supplier_id (
              id,
              name,
              contact_person,
              category
            )
          `)
          .eq('project_id', projectId);

        if (error) throw error;

        stakeholders?.forEach((stakeholder: any) => {
          if (stakeholder.employee_id && stakeholder.employees) {
            inspectorsList.push({
              id: stakeholder.employees.id,
              name: stakeholder.employees.full_name,
              type: 'employee',
              position: stakeholder.employees.position,
              role: stakeholder.role_description || stakeholder.stakeholder_type
            });
          } else if (stakeholder.supplier_id && stakeholder.suppliers) {
            inspectorsList.push({
              id: stakeholder.suppliers.id,
              name: stakeholder.suppliers.contact_person || stakeholder.suppliers.name,
              type: 'supplier',
              position: `Bureau d'études - ${stakeholder.suppliers.name}`,
              role: stakeholder.role_description || stakeholder.stakeholder_type
            });
          }
        });
      } else {
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('id, full_name, position, department')
          .eq('is_active', true)
          .order('full_name');

        if (empError) throw empError;

        const { data: suppliers, error: suppError } = await supabase
          .from('suppliers')
          .select('id, name, contact_person, category')
          .eq('is_active', true)
          .order('name');

        if (suppError) throw suppError;

        employees?.forEach(emp => {
          inspectorsList.push({
            id: emp.id,
            name: emp.full_name,
            type: 'employee',
            position: emp.position || undefined
          });
        });

        suppliers?.forEach(sup => {
          inspectorsList.push({
            id: sup.id,
            name: sup.contact_person || sup.name,
            type: 'supplier',
            position: `Bureau d'études - ${sup.name}`
          });
        });
      }

      return inspectorsList;
    }
  });
}

export function useProjectTenders(projectId?: string) {
  return useQuery({
    queryKey: ['project-tenders-selector', projectId],
    queryFn: async (): Promise<TenderOption[]> => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('id, file_name, tender_id')
        .eq('tender_id', projectId)
        .limit(10);
      
      if (error) {
        console.warn('No tender documents found:', error);
        return [];
      }
      
      return (data || []).map((item, index) => ({
        id: item.id,
        title: item.file_name || `Appel d'offres ${index + 1}`,
        reference: `AO-${item.tender_id}-${index + 1}`,
        project_id: projectId,
        status: 'active'
      }));
    },
    enabled: !!projectId
  });
}
