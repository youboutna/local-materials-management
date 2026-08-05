// @ts-nocheck
/**
 * Task Assignment Supabase Adapter
 * Implements ITaskAssignmentRepository using Supabase
 */

import { TaskAssignment } from '@/domain/entities/Workspace';
import { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import { TaskAssignmentTransformer } from '@/dtos/transforms/TaskAssignmentTransformer';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

export class TaskAssignmentAdapter implements ITaskAssignmentRepository {
  /**
   * Create a new task assignment
   */
  async create(taskAssignment: Omit<TaskAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskAssignment> {
    try {
      // ✅ Formater assigned_to pour PostgreSQL (tableau)
      let assignedToDb = null;
      if (taskAssignment.assignedTo && Array.isArray(taskAssignment.assignedTo) && taskAssignment.assignedTo.length > 0) {
        // Format PostgreSQL: {uuid1,uuid2}
        assignedToDb = `{${taskAssignment.assignedTo.join(',')}}`;
      }

      const { data, error } = await supabase
        .from('task_assignments')
        .insert({
          title: taskAssignment.title,
          description: taskAssignment.description,
          project_id: taskAssignment.projectId,
          phase_id: (taskAssignment as any).phaseId || null,
          assigned_to: assignedToDb,
          assigned_by: taskAssignment.assignedBy,
          assignee_type: taskAssignment.assigneeType,
          assignee_name: (taskAssignment as any).assigneeName || null,
          assignee_email: (taskAssignment as any).assigneeEmail || null,
          status: taskAssignment.status || 'pending',
          priority: taskAssignment.priority || 'medium',
          progress: (taskAssignment as any).progress ?? 0,
          start_date: (taskAssignment as any).startDate ? new Date((taskAssignment as any).startDate).toISOString() : null,
          end_date: (taskAssignment as any).endDate ? new Date((taskAssignment as any).endDate).toISOString() : null,
          due_date: taskAssignment.dueDate?.toISOString(),
          completed_at: taskAssignment.completedAt?.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[TaskAssignmentAdapter.create] Supabase error:', error);
        throw new Error(`Failed to save task: ${error.message}`);
      }

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
      // Formater assigned_to pour PostgreSQL si présent
      let assignedToDb = undefined;
      if (updates.assignedTo !== undefined) {
        if (updates.assignedTo && Array.isArray(updates.assignedTo) && updates.assignedTo.length > 0) {
          assignedToDb = `{${updates.assignedTo.join(',')}}`;
        } else {
          assignedToDb = null;
        }
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Mapper les champs
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.projectId !== undefined) updateData.project_id = updates.projectId;
      if ((updates as any).phaseId !== undefined) updateData.phase_id = (updates as any).phaseId;
      if (updates.assignedBy !== undefined) updateData.assigned_by = updates.assignedBy;
      if (updates.assigneeType !== undefined) updateData.assignee_type = updates.assigneeType;
      if ((updates as any).assigneeName !== undefined) updateData.assignee_name = (updates as any).assigneeName;
      if ((updates as any).assigneeEmail !== undefined) updateData.assignee_email = (updates as any).assigneeEmail;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if ((updates as any).progress !== undefined) updateData.progress = (updates as any).progress;
      if ((updates as any).startDate !== undefined) {
        updateData.start_date = (updates as any).startDate ? new Date((updates as any).startDate).toISOString() : null;
      }
      if ((updates as any).endDate !== undefined) {
        updateData.end_date = (updates as any).endDate ? new Date((updates as any).endDate).toISOString() : null;
      }
      if (updates.dueDate !== undefined) {
        updateData.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
      }
      if (updates.completedAt !== undefined) {
        updateData.completed_at = updates.completedAt ? new Date(updates.completedAt).toISOString() : null;
      }
      if (updates.assignedTo !== undefined) {
        updateData.assigned_to = assignedToDb;
      }

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
        .contains('assigned_to', [assignedTo])
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
   * Get task assignments by phase ID
   */
  async findByPhaseId(phaseId: string): Promise<TaskAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToEntity(row));
    } catch (error) {
      console.error('TaskAssignmentAdapter.findByPhaseId failed:', error);
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
    phase_id?: string;
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
        query = query.contains('assigned_to', [filters.assignee]);
      }
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id);
      }
      if (filters.phase_id) {
        query = query.eq('phase_id', filters.phase_id);
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
      phaseId: dto.phaseId,
      assignedTo: dto.assignedTo,
      assignedBy: dto.assignedBy,
      assigneeType: dto.assigneeType as 'supplier' | 'employee' | 'user' | undefined,
      assigneeName: dto.assigneeName,
      assigneeEmail: dto.assigneeEmail,
      status: dto.status as any,
      priority: dto.priority as any,
      progress: dto.progress || 0,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt)
    });
  }
}