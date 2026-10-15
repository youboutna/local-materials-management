import { useQuery } from '@tanstack/react-query';
import { getPhaseService } from '@/application/services/PhaseService';
import { getEmployeeService } from '@/application/services/EmployeeService';
import { getSupplierService } from '@/application/services/SupplierService';

export function useProjectPhasesAsStepsHex(projectId?: string) {
  return useQuery({
    queryKey: ['project-phases-as-steps', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const phases = await getPhaseService().getPhasesByProject(projectId);
      return phases.map(phase => ({
        id: phase.id,
        name: phase.phaseName,
        order_index: phase.orderIndex || 0,
        status: phase.status || 'pending',
        progress: phase.progress || 0
      }));
    },
    enabled: !!projectId
  });
}

export function useInspectorsHex() {
  return useQuery({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const [allEmployees, allSuppliers] = await Promise.all([
        getEmployeeService().getActiveEmployees(),
        getSupplierService().getActiveSuppliers(),
      ]);

      const supplierInspectors = allSuppliers.map(supplier => ({
        id: supplier.id,
        full_name: supplier.contactPerson || supplier.name,
        phone: supplier.phone,
        position: `Responsable - ${supplier.name}`,
        department: supplier.category,
        nif: supplier.nif,
        type: 'supplier' as const
      }));

      const employeeInspectors = allEmployees.map(emp => ({
        id: emp.id,
        full_name: emp.fullName,
        phone: emp.phone,
        position: emp.position,
        department: emp.department,
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
