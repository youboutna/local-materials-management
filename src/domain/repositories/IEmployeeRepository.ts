// Repository interface for Employee entity
import { Employee, EmployeeRole, Department } from '../entities/Employee';

export interface IEmployeeRepository {
  // CRUD operations
  findById(id: string): Promise<Employee | null>;
  findByEmployeeId(employeeId: string): Promise<Employee | null>;
  findByUserId(userId: string): Promise<Employee | null>;
  findAll(): Promise<Employee[]>;
  save(employee: Employee): Promise<void>;
  update(id: string, data: Partial<Employee>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByRole(role: EmployeeRole): Promise<Employee[]>;
  findByDepartment(department: Department): Promise<Employee[]>;
  findActive(): Promise<Employee[]>;
  findByManager(managerId: string): Promise<Employee[]>;
  findBySuperior(superiorId: string): Promise<Employee[]>;
  
  // Search
  search(query: string): Promise<Employee[]>;
  
  // Permission-based queries
  findInspectors(): Promise<Employee[]>;
  findProjectManagers(): Promise<Employee[]>;
  findApprovers(): Promise<Employee[]>;
  
  // Team structure
  getDirectReports(employeeId: string): Promise<Employee[]>;
  getTeamHierarchy(managerId: string): Promise<Employee[]>;
}
