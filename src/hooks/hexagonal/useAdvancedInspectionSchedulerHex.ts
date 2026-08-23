import { useQuery } from '@tanstack/react-query';

export function useProjectPhasesAsStepsHex(projectId?: string) {
  return useQuery({
    queryKey: ['project-phases-as-steps', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { btpClient } = await import('@/integrations/supabase/schema-clients');
      const { data: phases, error } = await btpClient.from('project_phases')
        .select('id, phase_name, order_index, status, progress')
        .eq('project_id', projectId)
        .order('order_index');

      if (error) throw error;

      return (phases || []).map(p => ({
        id: p.id,
        name: p.phase_name,
        order_index: p.order_index || 0,
        status: p.status || 'pending',
        progress: p.progress || 0
      }));
    },
    enabled: !!projectId
  });
}

export function useInspectorsHex() {
  return useQuery({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const { btpClient } = await import('@/integrations/supabase/schema-clients');

      const { data: employeesData, error: employeesError } = await btpClient.from('employees')
        .select('id, full_name, phone, position, department')
        .eq('is_active', true)
        .order('full_name');

      if (employeesError) throw employeesError;

      const { data: suppliersData, error: suppliersError } = await btpClient.from('suppliers')
        .select('id, name, contact_person, email, phone, category, nif')
        .eq('is_active', true)
        .order('name');

      if (suppliersError) throw suppliersError;

      const allEmployees = employeesData || [];
      const allSuppliers = suppliersData || [];

      const supplierInspectors = allSuppliers.map(supplier => ({
        id: supplier.id,
        full_name: supplier.contact_person || supplier.name,
        phone: supplier.phone,
        position: `Responsable - ${supplier.name}`,
        department: supplier.category,
        nif: supplier.nif,
        type: 'supplier' as const
      }));

      const employeeInspectors = allEmployees.map(emp => ({
        ...emp,
        nif: null as string | null,
        type: 'employee' as const
      }));

      const allInspectors = [...employeeInspectors, ...supplierInspectors];

      const inspectors = allInspectors.filter(inspector =>
        inspector.position?.toLowerCase().includes('inspector') ||
        inspector.position?.toLowerCase().includes('inspection') ||
        inspector.department?.toLowerCase().includes('inspection') ||
        inspector.position?.toLowerCase().includes('contrôle') ||
        inspector.position?.toLowerCase().includes('qualité')
      );

      const engineeringConsultants = allInspectors.filter(inspector =>
        inspector.position?.toLowerCase().includes('consultant') ||
        inspector.position?.toLowerCase().includes('ingénieur') ||
        inspector.position?.toLowerCase().includes('engineer') ||
        inspector.department?.toLowerCase().includes('ingénierie') ||
        inspector.department?.toLowerCase().includes('engineering') ||
        inspector.position?.toLowerCase().includes('bureau d\'études')
      );

      const responsables = allInspectors.filter(inspector =>
        inspector.position?.toLowerCase().includes('responsable') ||
        inspector.type === 'supplier'
      );

      const otherInspectors = allInspectors.filter(inspector =>
        !inspectors.includes(inspector) &&
        !engineeringConsultants.includes(inspector) &&
        !responsables.includes(inspector)
      );

      return [...engineeringConsultants, ...inspectors, ...responsables, ...otherInspectors];
    }
  });
}
