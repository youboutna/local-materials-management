/**
 * Hexagonal Hook: useAssigneeDetailsHex
 * Fetches assignee details (employees, suppliers, profiles) via services
 */
import { useQuery } from '@tanstack/react-query';
import { EmployeeService } from '@/application/services/EmployeeService';
import { SupplierService } from '@/application/services/SupplierService';
import { UserService } from '@/application/services/UserService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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
      email: employee.email ?? '',
    };
  }

  // Try suppliers
  const suppliersResult = await supplierService.searchSuppliers({});
  const supplier = suppliersResult.suppliers.find((s) => s.id === assigneeId);
  if (supplier) {
    return {
      type: 'supplier',
      name: supplier.name,
      email: '',
    };
  }

  // Try profiles (authenticated users) via UserService
  try {
    const userService = new UserService(RepositoryFactory.getUserRepository());
    const profile = await userService.getUserById(assigneeId);
    if (profile) {
      return {
        type: 'user',
        name: (profile as any).full_name || (profile as any).fullName || 'Utilisateur',
        email: (profile as any).email || '',
      };
    }
  } catch {
    // Profile not found
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
