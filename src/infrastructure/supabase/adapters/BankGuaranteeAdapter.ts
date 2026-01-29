/**
 * Bank Guarantee Adapter - Supabase Implementation
 * Implements IBankGuaranteeRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { IBankGuaranteeRepository } from '@/domain/repositories/IBankGuaranteeRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class BankGuaranteeAdapter implements IBankGuaranteeRepository {
  
  async create(guarantee: {
    project_id: string;
    guarantee_type: string;
    guarantee_amount: number;
    issuing_bank: string;
    guarantee_number: string;
    issue_date: string;
    expiry_date: string;
    status: string;
    conditions: string[];
    documents: string[];
  }): Promise<any> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .insert(guarantee)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getByProject(projectId: string): Promise<any[]> {
    // Validate projectId to prevent UUID errors
    if (!projectId || projectId.trim() === '') {
      console.warn('BankGuaranteeAdapter.getByProject: Invalid projectId provided, fetching all guarantees');
      // When projectId is invalid, fetch all guarantees by using empty string for no filter
      projectId = '';
    }

    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateStatus(guaranteeId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', guaranteeId);

    if (error) throw error;
  }

  async releasePhaseGuarantees(phaseId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('phase_id', phaseId);

    if (error) throw error;
  }

  async releaseProjectGuarantees(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('project_id', projectId);

    if (error) throw error;
  }

  async getById(guaranteeId: string): Promise<any> {
    const { data, error } = await supabase
      .from('bank_guarantees')
      .select('*')
      .eq('id', guaranteeId)
      .single();

    if (error) throw error;
    return data;
  }

  async update(guaranteeId: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantees')
        .update(updates)
        .eq('id', guaranteeId)
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update bank guarantee', error);
      if (!data) throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
      
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update bank guarantee', error);
    }
  }

  async delete(guaranteeId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_guarantees')
      .delete()
      .eq('id', guaranteeId);

    if (error) throw error;
  }

  async detectProjectDelays(): Promise<any[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          end_date,
          status,
          progress,
          created_at
        `)
        .eq('status', 'en cours');

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch projects', error);

      const delays: any[] = [];
      const currentDate = new Date();

      for (const project of projects || []) {
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          const timeDiff = currentDate.getTime() - endDate.getTime();
          const delayDays = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
          
          if (delayDays > 0) {
            const projectDuration = endDate.getTime() - new Date(project.created_at || endDate).getTime();
            const delayPercentage = (delayDays * 24 * 60 * 60 * 1000 / projectDuration) * 100;
            
            delays.push({
              projectId: project.id,
              projectName: project.title,
              contractorName: 'Entrepreneur principal',
              plannedEndDate: project.end_date,
              currentDate: currentDate.toISOString(),
              delayDays,
              delayPercentage: Math.round(delayPercentage),
              milestonesMissed: Math.floor(delayPercentage / 10)
            });
          }
        }
      }

      return delays;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to detect project delays', error);
    }
  }

  async getByProjectId(projectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantees')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch bank guarantees', error);
      return data || [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch bank guarantees', error);
    }
  }

  async createWithEntity(guarantee: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantees')
        .insert(guarantee)
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create bank guarantee', error);
      if (!data) throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not created');
      
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create bank guarantee', error);
    }
  }

  async updateWithEntity(id: string, updates: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update bank guarantee', error);
      if (!data) throw new AppError(ErrorCode.NOT_FOUND, 'Bank guarantee not found');
      
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update bank guarantee', error);
    }
  }
}
