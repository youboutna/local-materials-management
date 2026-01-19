import { supabase } from '@/integrations/supabase/client';
import { BankGuaranteeEntity, ProjectDelayEntity } from '@/types/bankGuarantee.entity';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class BankGuaranteeRepository {
  static async detectProjectDelays(): Promise<ProjectDelayEntity[]> {
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

      const delays: ProjectDelayEntity[] = [];
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

  static async getByProjectId(projectId: string): Promise<BankGuaranteeEntity[]> {
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

  static async create(guarantee: Omit<BankGuaranteeEntity, 'id' | 'created_at' | 'updated_at'>): Promise<BankGuaranteeEntity> {
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

  static async update(id: string, updates: Partial<BankGuaranteeEntity>): Promise<BankGuaranteeEntity> {
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
