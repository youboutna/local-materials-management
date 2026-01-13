/**
 * Hexagonal Hook: useAssigneeDetailsHex
 * Fetches assignee details (employees, suppliers, profiles) via services
 */
import { useQuery } from '@tanstack/react-query';
import { EmployeeService } from '@/services/EmployeeService';
import { SupplierService } from '@/services/SupplierService';
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

  // Try employees first
  const employees = await EmployeeService.getAllEmployees();
  const employee = employees.find(e => e.id === assigneeId);
  if (employee) {
    return {
      type: 'employee',
      name: employee.full_name,
      email: employee.email || '',
    };
  }

  // Try suppliers
  const suppliers = await SupplierService.getAllSuppliers();
  const supplier = suppliers.find(s => s.id === assigneeId);
  if (supplier) {
    return {
      type: 'supplier',
      name: supplier.contact_person || supplier.name,
      email: supplier.email || '',
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
