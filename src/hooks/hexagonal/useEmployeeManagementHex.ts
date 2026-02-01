/**
 * Hexagonal hooks for Employee Management CRUD
 * Uses hexagonal architecture with RepositoryFactory and EmployeeService
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { EmployeeService } from '@/application/services/EmployeeService';
import { EmployeeTransformer } from '@/dtos/transforms/EmployeeTransformer';
import { 
  EmployeeDTO, 
  CreateEmployeeDTO, 
  UpdateEmployeeDTO 
} from '@/dtos/entities/EmployeeDTO';

export interface EmployeeFormData {
  employee_id: string;
  full_name: string;
  position?: string;
  department?: string;
  phone?: string;
  email?: string;
  hire_date?: string;
  salary?: number;
  skills?: string[];
  is_active?: boolean;
}

// Hook: Fetch employees with search
export function useEmployeesList(searchTerm: string = '') {
  const queryClient = useQueryClient();
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());

  return useQuery({
    queryKey: ['employees-management', searchTerm],
    queryFn: async (): Promise<EmployeeDTO[]> => {
      const searchOptions = { searchTerm };
      const searchResult = await employeeService.searchEmployees(searchOptions);
      return searchResult.employees.map(employee => EmployeeTransformer.toDTO(employee));
    }
  });
}

// Hook: Create employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());

  return useMutation({
    mutationFn: async (employeeData: CreateEmployeeDTO): Promise<EmployeeDTO> => {
      // Convert DTO to entity using the correct method
      const employee = EmployeeTransformer.fromCreateDTOToEntity(employeeData);
      const createdEmployee = await employeeService.createEmployee(employee);
      return EmployeeTransformer.toDTO(createdEmployee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
    }
  });
}

// Hook: Update employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateEmployeeDTO }): Promise<EmployeeDTO> => {
      // Convert DTO to entity partial using the correct method
      const employeeUpdates = EmployeeTransformer.fromUpdateDTOToEntity(data);
      const updatedEmployee = await employeeService.updateEmployee(id, employeeUpdates);
      return EmployeeTransformer.toDTO(updatedEmployee);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
    }
  });
}

// Hook: Delete employee
export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await employeeService.deleteEmployee(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
    }
  });
}
