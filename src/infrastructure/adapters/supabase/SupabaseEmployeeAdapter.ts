/**
 * Supabase Adapter for Employee Repository
 * Implements IEmployeeRepository using Supabase
 *
 * Rule #9: DB → Transformer → Entity → Repository → Service
 * Adapter NEVER calls `new Entity()` — always uses Transformer
 *
 * ⚠️ employee_id : alphanumérique (ex. EMP-DOUDOU-001), identique à external_ref
 * ⚠️ id (DB)     : UUID v4 généré automatiquement
 * ⚠️ upsert      : utilisé pour éviter les conflits 409
 */

import { Department, Employee, EmployeeRole } from '@/domain/entities';
import { IEmployeeRepository } from '@/domain/repositories/IEmployeeRepository';
import { EmployeeTransformer } from '@/dtos/transforms/EmployeeTransformer';
import type { BtpTables, BtpTablesInsert, BtpTablesUpdate } from '@/integrations/supabase/btp-types';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { v4 as uuidv4 } from 'uuid';

type EmployeeRow = BtpTables<'employees'>;

export class SupabaseEmployeeAdapter implements IEmployeeRepository {

  // =================== HELPERS ===================

  /**
   * Vérifie si une valeur est un UUID v4 valide
   */
  private isUuid(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  /**
   * Génère un employee_id alphanumérique unique
   */
  private generateEmployeeId(): string {
    return `EMP-${uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  }

  /**
   * Mapper Supabase Row → Domain Entity
   */
  private mapToEntity(data: EmployeeRow): Employee {
    return EmployeeTransformer.fromDatabaseRow(data as Record<string, unknown>);
  }

  // =================== READ ===================

  async findById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  // =================== WRITE ===================

  /**
   * ✅ CORRECTION : UPSERT au lieu de INSERT
   * - Garantit un id UUID v4
   * - Garantit un employee_id alphanumérique unique
   * - Utilise onConflict pour éviter le 409
   */
  async save(employee: Employee): Promise<void> {
    const dbData = EmployeeTransformer.toSupabase(employee) as Record<string, unknown>;

    // ✅ Fallback id : UUID v4
    if (!dbData.id || !this.isUuid(dbData.id)) {
      dbData.id = uuidv4();
    }

    // ✅ Fallback employee_id : alphanumérique
    if (!dbData.employee_id || String(dbData.employee_id).trim() === '') {
      dbData.employee_id = this.generateEmployeeId();
    }

    // ✅ Fallback external_ref : identique à employee_id
    if (!dbData.external_ref || String(dbData.external_ref).trim() === '') {
      dbData.external_ref = dbData.employee_id;
    }

    // ✅ UPSERT sur employee_id (ou id)
    const { error } = await supabase
      .from('employees')
      .upsert([dbData as BtpTablesInsert<'employees'>], {
        onConflict: 'employee_id',
        ignoreDuplicates: false, // false = UPDATE si existe déjà
      });

    if (error) {
      // ✅ Log détaillé pour debug
      console.error('Employee save failed:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        payload: dbData,
      });
      throw new Error(`Failed to save employee: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<Employee> & { extras?: Record<string, unknown> }): Promise<void> {
    const updateData: Record<string, unknown> = {};

    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if ((data as any).employeeId !== undefined) updateData.employee_id = (data as any).employeeId;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.certifications !== undefined) updateData.certifications = data.certifications;
    if (data.managerId !== undefined) updateData.manager_id = data.managerId;
    if (data.superiorId !== undefined) updateData.superior_id = data.superiorId;
    if (data.userId !== undefined) updateData.user_id = data.userId;
    if (data.hireDate !== undefined) updateData.hire_date = data.hireDate;
    if (data.salary !== undefined) updateData.salary = data.salary;

    // Extended RH / organigramme attributes (camelCase extras → snake_case columns)
    const extrasMap: Record<string, string> = {
      externalRef: 'external_ref',
      organizationId: 'organization_id',
      employeeType: 'employee_type',
      roleName: 'role',
      status: 'status',
      level: 'level',
      endDate: 'end_date',
      probationEndDate: 'probation_end_date',
      hourlyRate: 'hourly_rate',
      currency: 'currency',
      availability: 'availability',
      address: 'address',
      city: 'city',
      country: 'country',
      performanceRating: 'performance_rating',
      avatarUrl: 'avatar_url',
      tags: 'tags',
      notes: 'notes',
      nationalId: 'national_id',
      nif: 'nif',
    };

    const extras = (data.extras || {}) as Record<string, unknown>;
    Object.entries(extrasMap).forEach(([key, column]) => {
      if (extras[key] !== undefined) updateData[column] = extras[key];
    });

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('employees')
      .update(updateData as BtpTablesUpdate<'employees'>)
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

  // =================== QUERIES ===================

  async findByRole(_role: EmployeeRole): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByDepartment(department: Department): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('department', department as string)
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findActive(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findByManager(managerId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('manager_id', managerId)
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findBySuperior(superiorId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('superior_id', superiorId)
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async search(query: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,employee_id.ilike.%${query}%`)
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findInspectors(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .ilike('position', '%inspector%')
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findProjectManagers(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .or('position.ilike.%manager%,position.ilike.%chef%,position.ilike.%responsable%')
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async findApprovers(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .or('position.ilike.%director%,position.ilike.%manager%,position.ilike.%chef%')
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
  }

  async getDirectReports(employeeId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .or(`manager_id.eq.${employeeId},superior_id.eq.${employeeId}`)
      .eq('is_active', true)
      .order('full_name');
    if (error || !data) return [];
    return data.map(d => this.mapToEntity(d));
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
    return this.mapToEntity(data);
  }
}