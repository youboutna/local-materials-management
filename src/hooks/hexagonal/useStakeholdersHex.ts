/**
 * Hexagonal Hook: useStakeholdersHex
 * Provides stakeholders and team members management via services
 */
import { useQuery } from '@tanstack/react-query';
import { EmployeeService } from '@/application/services/EmployeeService';
import { SupplierService } from '@/application/services/SupplierService';

export function useStakeholdersHex() {
  const { 
    data: employees = [], 
    isLoading: employeesLoading,
    error: employeesError 
  } = useQuery({
    queryKey: ['employees-active-hex'],
    queryFn: async () => {
      return await EmployeeService.getAllEmployees();
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
      return await SupplierService.getAllSuppliers();
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
