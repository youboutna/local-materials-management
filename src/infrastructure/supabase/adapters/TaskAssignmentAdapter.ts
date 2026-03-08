// @ts-nocheck
/**
 * Task Assignment Supabase Adapter
 * Implements ITaskAssignmentRepository using Supabase
 */

import { TaskAssignment } from '@/domain/entities/Workspace';
import { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import { supabase } from '@/integrations/supabase/client';
import { TaskAssignmentTransformer } from '@/dtos/transforms/TaskAssignmentTransformer';

export class TaskAssignmentAdapter implements ITaskAssignmentRepository {
  /**
   * Create a new task assignment
   */
  async create(taskAssignment: Omit<TaskAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskAssignment> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .insert({
          title: taskAssignment.title,
          description: taskAssignment.description,
          project_id: taskAssignment.projectId,
          assigned_to: taskAssignment.assignedTo,
          assigned_by: taskAssignment.assignedBy,
          assignee_type: taskAssignment.assigneeType,
          assignee_email: taskAssignment.assigneeEmail,
          status: taskAssignment.status,
          priority: taskAssignment.priority,
          due_date: taskAssignment.dueDate?.toISOString(),
          completed_at: taskAssignment.completedAt?.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToEntity(data);
    } catch (error) {
      console.error('TaskAssignmentAdapter.create failed:', error);
      throw error;
    }
  }

  /**
   * Get a task assignment by ID
   */
  async findById(id: string): Promise<TaskAssignment | null> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapRowToEntity(data);
    } catch (error) {
      console.error('TaskAssignmentAdapter.findById failed:', error);
      throw error;
    }
  }

  /**
   * Get all task assignments
   */
  async findAll(): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findAll failed:', error);
      throw error;
    }
  }

  /**
   * Update a task assignment
   */
  async update(id: string, updates: Partial<TaskAssignment>): Promise<TaskAssignment> {
    try {
      const updateData = TaskAssignmentTransformer.toRepository(updates);
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('task_assignments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToEntity(data);
    } catch (error) {
      console.error('TaskAssignmentAdapter.update failed:', error);
      throw error;
    }
  }

  /**
   * Delete a task assignment
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('TaskAssignmentAdapter.delete failed:', error);
      throw error;
    }
  }

  /**
   * Get task assignments by project ID
   */
  async findByProjectId(projectId: string): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findByProjectId failed:', error);
      throw error;
    }
  }

  /**
   * Get task assignments by assigned user
   */
  async findByAssignedTo(assignedTo: string): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('assigned_to', assignedTo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findByAssignedTo failed:', error);
      throw error;
    }
  }

  /**
   * Get task assignments by assigned by user
   */
  async findByAssignedBy(assignedBy: string): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('assigned_by', assignedBy)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findByAssignedBy failed:', error);
      throw error;
    }
  }

  /**
   * Get task assignments by status
   */
  async findByStatus(status: string): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findByStatus failed:', error);
      throw error;
    }
  }

  /**
   * Get task assignments by priority
   */
  async findByPriority(priority: string): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('priority', priority)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findByPriority failed:', error);
      throw error;
    }
  }

  /**
   * Get task assignments by assignee type
   */
  async findByAssigneeType(assigneeType: string): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('assignee_type', assigneeType)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findByAssigneeType failed:', error);
      throw error;
    }
  }

  /**
   * Search task assignments by term
   */
  async searchByTerm(searchTerm: string): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.searchByTerm failed:', error);
      throw error;
    }
  }

  /**
   * Get task assignments with filters
   */
  async findWithFilters(filters: {
    searchTerm?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    project_id?: string;
  }): Promise<TaskAssignment[]> {
    try {
      let query = supabase
        .from('task_assignments')
        .select('*');

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.assignee) {
        query = query.eq('assigned_to', filters.assignee);
      }
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findWithFilters failed:', error);
      throw error;
    }
  }

  /**
   * Get task assignments due soon
   */
  async findDueSoon(days: number): Promise<TaskAssignment[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString())
        .lte('due_date', futureDate.toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findDueSoon failed:', error);
      throw error;
    }
  }

  /**
   * Get overdue task assignments
   */
  async findOverdue(): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findOverdue failed:', error);
      throw error;
    }
  }

  /**
   * Get task assignment statistics
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byAssigneeType: Record<string, number>;
    overdue: number;
    dueSoon: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('status, priority, assignee_type, due_date');

      if (error) throw error;

      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const stats = {
        total: data.length,
        byStatus: data.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPriority: data.reduce((acc, item) => {
          acc[item.priority] = (acc[item.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byAssigneeType: data.reduce((acc, item) => {
          const type = item.assignee_type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        overdue: data.filter(item => 
          item.status === 'pending' && 
          item.due_date && 
          new Date(item.due_date) < now
        ).length,
        dueSoon: data.filter(item => 
          item.status === 'pending' && 
          item.due_date && 
          new Date(item.due_date) >= now && 
          new Date(item.due_date) <= futureDate
        ).length
      };

      return stats;
    } catch (error) {
      console.error('TaskAssignmentAdapter.getStats failed:', error);
      throw error;
    }
  }

  /**
   * Map database row to TaskAssignment entity
   */
  private mapRowToEntity(row: any): TaskAssignment {
    const dto = TaskAssignmentTransformer.fromRepository(row);
    return TaskAssignment.create({
      id: dto.id,
      title: dto.title,
      description: dto.description,
      projectId: dto.projectId,
      assignedTo: dto.assignedTo,
      assignedBy: dto.assignedBy,
      assigneeType: dto.assigneeType as 'supplier' | 'employee' | 'user' | undefined,
      assigneeEmail: dto.assigneeEmail,
      status: dto.status as any,
      priority: dto.priority as any,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    });
  }
}
