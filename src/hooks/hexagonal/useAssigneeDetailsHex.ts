/**
 * Hexagonal Hook: useAssigneeDetailsHex
 * Fetches assignee details (employees, suppliers, profiles) via services
 */
import { useQuery } from '@tanstack/react-query';
import { EmployeeService } from '@/application/services/EmployeeService';
import { SupplierService } from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { supabase } from '@/integrations/supabase/client';

export interface AssigneeDetails {
  type: 'employee' | 'supplier' | 'user' | '';
  name: string;
  email: string;
}

async function fetchAssigneeDetails(assigneeId: string): Promise<AssigneeDetails> {
  if (!assigneeId) {
    return { type: '', name: '', email: '' };
  }

  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
  const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());

  // Try employees first
  const employeesResult = await employeeService.searchEmployees({});
  const employee = employeesResult.employees.find((e) => e.id === assigneeId);
  if (employee) {
    return {
      type: 'employee',
      name: employee.fullName,
      email: employee.email || '',
    };
  }

  // Try suppliers
  const suppliersResult = await supplierService.searchSuppliers({});
  const supplier = suppliersResult.suppliers.find((s) => s.id === assigneeId);
  if (supplier) {
    const primaryContact = supplier.getPrimaryContact();
    return {
      type: 'supplier',
      name: primaryContact?.name || supplier.name,
      email: primaryContact?.email || supplier.email || '',
    };
  }

  // Try profiles (authenticated users)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', assigneeId)
    .maybeSingle();

  if (profileData) {
    return {
      type: 'user',
      name: profileData.full_name || 'Utilisateur',
      email: '',
    };
  }

  return { type: '', name: '', email: '' };
}

export function useAssigneeDetailsHex(assigneeId: string) {
  const {
    data: details,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assignee-details-hex', assigneeId],
    queryFn: () => fetchAssigneeDetails(assigneeId),
    enabled: !!assigneeId,
    staleTime: 60_000,
  });

  return {
    details: details ?? { type: '', name: '', email: '' },
    isLoading,
    error,
    refetch,
  };
}

export default useAssigneeDetailsHex;

// Export alias for useAssigneeDetails
export const useAssigneeDetails = useAssigneeDetailsHex;
