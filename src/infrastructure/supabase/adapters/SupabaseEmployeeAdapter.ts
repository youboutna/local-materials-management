/**
 * Supabase Adapter for Employee Repository
 * Implements IEmployeeRepository using Supabase
 * Rule #9: DB → Entity → Repository → Service
 */
import { supabase } from '@/integrations/supabase/client';
import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { Employee, EmployeeRole, Department } from '@/domain/entities';
import { Database } from '@/integrations/supabase/types';

type EmployeeRow = Database['public']['Tables']['employees']['Row'];

function mapToEmployee(data: EmployeeRow): Employee {
  return {
    id: data.id,
    employeeId: data.employee_id,
    fullName: data.full_name,
    email: data.email || '',
    phone: data.phone || '',
    position: data.position || '',
    department: data.department || '',
    hireDate: data.hire_date || '',
    managerId: data.manager_id || null,
    superiorId: data.superior_id || null,
    isActive: data.is_active ?? true,
    salary: data.salary || 0,
    skills: data.skills || [],
    certifications: (data.certifications as unknown[]) || [],
    userId: data.user_id || null,
    createdAt: data.created_at || new Date().toISOString(),
    updatedAt: data.updated_at || new Date().toISOString(),
  } as Employee;
}

export class SupabaseEmployeeAdapter implements IEmployeeRepository {
  async findById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapToEmployee(data);
  }

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .single();

    if (error || !data) return null;
    return mapToEmployee(data);
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return mapToEmployee(data);
  }

  async findAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
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
        certifications: employee.certifications as unknown as Database['public']['Tables']['employees']['Insert']['certifications'],
      }]);

    if (error) throw new Error(`Failed to save employee: ${error.message}`);
  }

  async update(id: string, data: Partial<Employee>): Promise<void> {
    const updateData: Record<string, unknown> = {};
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
    if (data.salary !== undefined) updateData.salary = data.salary;

    const { error } = await supabase
      .from('employees')
      .update(updateData as Database['public']['Tables']['employees']['Update'])
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
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async findByDepartment(department: Department): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('department', department as string)
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async findActive(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async findByManager(managerId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('manager_id', managerId)
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async findBySuperior(superiorId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('superior_id', superiorId)
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async search(query: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`)
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async findInspectors(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .ilike('position', '%inspector%')
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async findProjectManagers(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .or('position.ilike.%manager%,position.ilike.%chef%,position.ilike.%responsable%')
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async findApprovers(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .or('position.ilike.%director%,position.ilike.%manager%,position.ilike.%chef%')
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async getDirectReports(employeeId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .or(`manager_id.eq.${employeeId},superior_id.eq.${employeeId}`)
      .eq('is_active', true)
      .order('full_name');

    if (error || !data) return [];
    return data.map(mapToEmployee);
  }

  async getTeamHierarchy(managerId: string): Promise<Employee[]> {
    return this.getDirectReports(managerId);
  }

  async updateEmployee(params: { id: string; name: string; email: string }): Promise<Employee> {
    const { id, name, email } = params;

    const { data, error } = await supabase
      .from('employees')
      .update({ full_name: name, email })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to update employee: ${error?.message}`);
    return mapToEmployee(data);
  }
}
