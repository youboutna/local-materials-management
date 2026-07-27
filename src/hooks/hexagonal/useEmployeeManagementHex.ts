/**
 * Hexagonal hooks for Employee Management CRUD
 * Uses hexagonal architecture with RepositoryFactory and EmployeeService
 */

import { EmployeeService } from '@/application/services/EmployeeService';
import {
    CreateEmployeeDTO,
    EmployeeDTO,
    UpdateEmployeeDTO
} from '@/dtos/entities/EmployeeDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());

  return useQuery({
    queryKey: ['employees-management', searchTerm],
    queryFn: async (): Promise<EmployeeDTO[]> => {
      const searchOptions = { searchTerm };
      const searchResult = await employeeService.searchEmployees(searchOptions);
      return searchResult.employees as unknown as EmployeeDTO[];
    }
  });
}

// Hook: Create employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());

  return useMutation({
    mutationFn: async (employeeData: CreateEmployeeDTO): Promise<EmployeeDTO> => {
      const createdEmployee = await employeeService.createEmployee(employeeData as any);
      return createdEmployee as unknown as EmployeeDTO;
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
      const updatedEmployee = await employeeService.updateEmployee(id, data as any);
      return updatedEmployee as unknown as EmployeeDTO;
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
    mutationFn: async (id: string) => {
      await employeeService.deleteEmployee(id);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-management'] });
    }
  });
}
