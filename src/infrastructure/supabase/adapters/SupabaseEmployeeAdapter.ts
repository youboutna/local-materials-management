// @ts-nocheck
// Supabase Adapter for Employee Repository
import { supabase } from '@/integrations/supabase/client';
import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { Employee, EmployeeRole, Department, Certification, UserRole } from '@/domain/entities';

interface EmployeeOperationParams {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

interface EmployeeDB {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  department_id: string;
  hire_date: string;
  termination_date: string;
  role_level: number;
  manager_id: string;
  superior_id: string;
  is_active: boolean;
  salary: number;
  vacation_days: number;
  sick_days: number;
  certifications: Certification[];
  skills: string[];
}

function mapToEmployee(dbEmployee: EmployeeDB): Employee {
  return {
    ...dbEmployee,
    role: new UserRole(dbEmployee.role_level)
  };
}

export class SupabaseEmployeeAdapter implements IEmployeeRepository {
  async findById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapToEmployee(data);
  }

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('employee_id', employeeId)
      .single();

    if (error || !data) return null;
    return mapToEmployee(data);
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return mapToEmployee(data);
  }

  async findAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async save(employee: Employee): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .insert([{
        id: employee.id,
        employee_id: employee.employeeId,
        full_name: employee.fullName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        manager_id: employee.managerId,
        superior_id: employee.superiorId,
        is_active: employee.isActive,
        hire_date: employee.hireDate,
        salary: employee.salary,
        user_id: employee.userId,
        skills: employee.skills,
        certifications: employee.certifications as any,
        role_level: employee.role.level
      }]);

    if (error) throw new Error(`Failed to save employee: ${error.message}`);
  }

  async update(id: string, data: Partial<Employee>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.certifications !== undefined) updateData.certifications = data.certifications;
    if (data.managerId !== undefined) updateData.manager_id = data.managerId;
    if (data.superiorId !== undefined) updateData.superior_id = data.superiorId;
    if (data.role !== undefined) updateData.role_level = data.role.level;

    const { error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id);

    if (error) throw new Error(`Failed to update employee: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete employee: ${error.message}`);
  }

  async findByRole(_role: EmployeeRole): Promise<Employee[]> {
    // Role is not stored in DB - filter by position pattern
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('is_active', true)
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async findByDepartment(department: Department): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('department', department)
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async findActive(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('is_active', true)
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async findByManager(managerId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('manager_id', managerId)
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async findBySuperior(superiorId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('superior_id', superiorId)
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async search(query: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`)
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async findInspectors(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('is_active', true)
      .ilike('position', '%inspector%')
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async findProjectManagers(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('is_active', true)
      .or('position.ilike.%manager%,position.ilike.%chef%,position.ilike.%responsable%')
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async findApprovers(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .eq('is_active', true)
      .or('position.ilike.%director%,position.ilike.%manager%,position.ilike.%chef%')
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async getDirectReports(employeeId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from<EmployeeDB>('employees')
      .select()
      .or(`manager_id.eq.${employeeId},superior_id.eq.${employeeId}`)
      .eq('is_active', true)
      .order('full_name');

    if (error || !data) return [];
    return data.map(d => mapToEmployee(d));
  }

  async getTeamHierarchy(managerId: string): Promise<Employee[]> {
    // Recursive team fetch - simplified for now
    return this.getDirectReports(managerId);
  }

  async updateEmployee(params: EmployeeOperationParams): Promise<Employee> {
    const { id, name, role, email } = params;
    const updateData: Record<string, any> = {
      full_name: name,
      role_level: role.level,
      email
    };

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .single();

    if (error || !data) throw new Error(`Failed to update employee: ${error?.message}`);
    return mapToEmployee(data);
  }

  async updateEmployeeRole(id: string, role: UserRole): Promise<void> {
    await supabase
      .from('employees')
      .update({ role_level: role.level })
      .eq('id', id);
  }
}
