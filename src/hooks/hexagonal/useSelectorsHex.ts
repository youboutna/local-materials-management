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

      // Get suppliers
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

      // Add suppliers not in profiles
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
