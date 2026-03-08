// @ts-nocheck
/**
 * LocalStorage Employee Adapter
 * Implements IEmployeeRepository using LocalStorage for DEV_MODE
 */

import { 
  IEmployeeRepository, 
  Employee, 
  EmployeeRole, 
  Department 
} from '@/domain/entities';
import { allUsersData, MockUser } from '@/data/mockData';

// Convert MockUser to Employee format
const mockEmployees: Employee[] = allUsersData.map((user: MockUser) => ({
  id: user.id,
  full_name: user.fullName || '',
  position: user.primaryRole || '',
  department: 'General',
  email: user.email || '',
  phone: user.phone || '',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
} as Employee));

export class LocalStorageEmployeeAdapter implements IEmployeeRepository {
  
  async findById(id: string): Promise<Employee | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    const employee = employees.find(e => e.id === id);
    
    return employee || null;
  }

  async findAll(): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees;
  }

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    const employee = employees.find(e => e.nationalId === employeeId);
    
    return employee || null;
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    const employee = employees.find(e => e.id === userId);
    
    return employee || null;
  }

  async save(employee: Employee): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    const existingIndex = employees.findIndex(e => e.id === employee.id);
    
    if (existingIndex >= 0) {
      employees[existingIndex] = employee;
    } else {
      employees.push(employee);
    }
    
    this.saveEmployeesToStorage(employees);
    
    console.log(`[DEV_MODE] Saved employee ${employee.id}`);
  }

  async update(id: string, data: Partial<Employee>): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    const employeeIndex = employees.findIndex(e => e.id === id);
    
    if (employeeIndex === -1) {
      throw new Error(`Employee with id ${id} not found`);
    }
    
    employees[employeeIndex] = {
      ...employees[employeeIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.saveEmployeesToStorage(employees);
    
    console.log(`[DEV_MODE] Updated employee ${id}`);
  }

  async delete(id: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    const employeeIndex = employees.findIndex(e => e.id === id);
    
    if (employeeIndex === -1) {
      throw new Error(`Employee with id ${id} not found`);
    }
    
    employees.splice(employeeIndex, 1);
    this.saveEmployeesToStorage(employees);
    
    console.log(`[DEV_MODE] Deleted employee ${id}`);
  }

  async findByRole(role: EmployeeRole): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.role === role);
  }

  async findByDepartment(department: Department): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.department === department);
  }

  async findActive(): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.isActive);
  }

  async findInactive(): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => !employee.isActive);
  }

  async findByManager(managerId: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.id === managerId); // Simplified for DEV_MODE
  }

  async findBySupervisor(supervisorId: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.id === supervisorId); // Simplified for DEV_MODE
  }

  async search(query: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    const searchLower = query.toLowerCase();
    
    return employees.filter(employee => 
      employee.fullName?.toLowerCase().includes(searchLower) ||
      employee.email?.toLowerCase().includes(searchLower) ||
      employee.phone?.includes(searchLower)
    );
  }

  async findByEmail(email: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.email === email);
  }

  async findByNationalId(nationalId: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.nationalId === nationalId);
  }

  async findBySkill(skill: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => 
      employee.roles?.some(role => role.toLowerCase().includes(skill.toLowerCase()))
    );
  }

  async findByCertification(certification: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => 
      employee.roles?.some(role => role.toLowerCase().includes(certification.toLowerCase()))
    );
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => 
      employee.createdAt >= startDate && employee.createdAt <= endDate
    );
  }

  async findInspectors(): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.role === 'inspector');
  }

  async findProjectManagers(): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.role === 'project_manager');
  }

  async findApprovers(): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(employee => employee.role === 'approver');
  }

  async getDirectReports(employeeId: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(emp => emp.id === employeeId); // Simplified for DEV_MODE
  }

  async getTeamHierarchy(managerId: string): Promise<Employee[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const employees = this.getEmployeesFromStorage();
    return employees.filter(emp => emp.id === managerId); // Simplified for DEV_MODE
  }

  // ============= Utility Methods =============

  private getEmployeesFromStorage(): Employee[] {
    if (typeof window === 'undefined') return mockEmployees;
    
    const stored = localStorage.getItem('dev_employees');
    return stored ? JSON.parse(stored) : mockEmployees;
  }

  private saveEmployeesToStorage(employees: Employee[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('dev_employees', JSON.stringify(employees));
  }

  /**
   * Initialize localStorage with mock data
   */
  initializeMockData(): void {
    if (typeof window === 'undefined') return;
    
    if (!localStorage.getItem('dev_employees')) {
      localStorage.setItem('dev_employees', JSON.stringify(mockEmployees));
    }
    
    console.log('[DEV_MODE] LocalStorage employees initialized with mock data');
  }

  /**
   * Clear all mock data from localStorage
   */
  clearMockData(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('dev_employees');
    
    console.log('[DEV_MODE] LocalStorage employees cleared');
  }

  /**
   * Get current mock data from localStorage
   */
  getMockData(): Employee[] {
    return this.getEmployeesFromStorage();
  }
}
