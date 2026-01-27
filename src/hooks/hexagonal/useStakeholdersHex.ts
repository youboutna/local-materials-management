/**
 * Hexagonal Hook: useStakeholdersHex
 * Provides stakeholders and team members management via services
 */
import { useQuery } from '@tanstack/react-query';
import { EmployeeService } from '@/application/services/EmployeeService';
import { SupplierService } from '@/application/services/SupplierService';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';

export function useStakeholdersHex() {
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
  const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
  
  const { 
    data: employees = [], 
    isLoading: employeesLoading,
    error: employeesError 
  } = useQuery({
    queryKey: ['employees-active-hex'],
    queryFn: async () => {
      return await employeeService.getActiveEmployees();
    },
    staleTime: 60_000,
  });

  const { 
    data: suppliers = [], 
    isLoading: suppliersLoading,
    error: suppliersError 
  } = useQuery({
    queryKey: ['suppliers-active-hex'],
    queryFn: async () => {
      return await supplierService.getActiveSuppliers();
    },
    staleTime: 60_000,
  });

  return {
    employees,
    suppliers,
    isLoading: employeesLoading || suppliersLoading,
    error: employeesError || suppliersError,
  };
}

export default useStakeholdersHex;
