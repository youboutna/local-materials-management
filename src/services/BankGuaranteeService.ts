// @ts-nocheck
import { BankGuaranteeService as HexBankGuaranteeService } from '@/application/services/BankGuaranteeService';
import { NotificationService } from '@/application/services/NotificationService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectDelay, BankGuaranteeData, NOTIFICATION_ROLES, DELAY_THRESHOLDS } from '@/dtos/entities/ProjectLegacyDTO';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

export class BankGuaranteeService {
  /**
   * Detect projects with delays using hexagonal service
   */
  static async detectProjectDelays(): Promise<ProjectDelay[]> {
    try {
      // For now, return empty array as the hexagonal service doesn't have this method yet
      // TODO: Implement delay detection in hexagonal service
      return [];
    } catch (error) {
      ErrorLogger.log(error as Error, 'BankGuaranteeService.detectProjectDelays');
      return [];
    }
  }

  /**
   * Trigger bank guarantee notification for delayed project
   */
  static async triggerBankGuaranteeNotification(
    projectDelay: ProjectDelay,
    bankGuaranteeData: BankGuaranteeData
  ) {
    try {
      // Get stakeholders for notifications
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: stakeholders } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role_name,
          profiles!inner(full_name, email)
        `)
        .in('role_name', [
          NOTIFICATION_ROLES.PROJECT_MANAGER,
          NOTIFICATION_ROLES.DIRECTOR_PROGRAMMING,
          NOTIFICATION_ROLES.BANK_LIAISON,
          NOTIFICATION_ROLES.DIRECTOR
        ]);

      const notifications: Array<{
        recipient_id: string;
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
        read: boolean;
      }> = [];

      // Bank notification email content
      const bankEmailContent = `
        NOTIFICATION AUTOMATIQUE - DÉCLENCHEMENT GARANTIE BANCAIRE
        
        Projet: ${projectDelay.projectName}
        Entrepreneur: ${projectDelay.contractorName}
        Retard: ${projectDelay.delayDays} jours (${projectDelay.delayPercentage}%)
        Montant garantie: ${bankGuaranteeData.guaranteeAmount.toLocaleString()} MRU
        
        Clause contractuelle: ${bankGuaranteeData.contractClause}
        
        Documents joints: Rapport de retard, clauses contractuelles
        
        Action requise: Activation de la garantie bancaire selon les termes du contrat.
      `;

      // Create notifications for different stakeholders
      for (const stakeholder of stakeholders || []) {
        let title = '';
        let message = '';
        let notificationType: 'info' | 'success' | 'warning' | 'error' = 'warning';

        switch (stakeholder.role_name) {
          case 'project_manager':
            title = 'URGENT: Retard projet - Garantie bancaire déclenchée';
            message = `Le projet "${projectDelay.projectName}" accuse un retard de ${projectDelay.delayPercentage}%. La banque a été notifiée pour activation de la garantie.`;
            notificationType = 'error';
            break;

          case 'director_programming':
            title = 'Escalade: Retard significatif détecté';
            message = `Retard de ${projectDelay.delayDays} jours sur "${projectDelay.projectName}". Procédure de garantie bancaire enclenchée.`;
            notificationType = 'warning';
            break;

          case 'director':
            title = 'CRITIQUE: Activation garantie bancaire';
            message = `Retard critique sur "${projectDelay.projectName}" (${projectDelay.delayPercentage}%). Intervention directeur requise.`;
            notificationType = 'error';
            break;
        }

        notifications.push({
          recipient_id: stakeholder.user_id,
          title,
          message,
          type: notificationType as 'info' | 'success' | 'warning' | 'error',
          read: false
        });
      }

      // Send all notifications
      const results = await Promise.allSettled(
        notifications.map(async (notification) => {
          const service = new NotificationService(RepositoryFactory.getNotificationRepository());
          return await service.createNotification(notification);
        })
      );

      console.log(`Bank guarantee notifications sent: ${results.filter(r => r.status === 'fulfilled').length} successful`);

      return {
        success: true,
        notificationsSent: results.filter(r => r.status === 'fulfilled').length,
        bankEmailContent
      };

    } catch (error) {
      ErrorLogger.log(error as Error, 'BankGuaranteeService.triggerBankGuaranteeNotification');
      throw error;
    }
  }

  /**
   * Calculate penalties for project delays
   */
  static calculatePenalties(projectDelay: ProjectDelay, dailyPenaltyRate: number) {
    const totalPenalty = projectDelay.delayDays * dailyPenaltyRate;
    return {
      delayDays: projectDelay.delayDays,
      dailyRate: dailyPenaltyRate,
      totalPenalty,
      percentageOfContract: Math.round((totalPenalty / 1000000) * 100)
    };
  }

  /**
   * Send penalty notification to contractor
   */
  static async sendContractorPenaltyNotification(
    projectDelay: ProjectDelay,
    penaltyData: {
      delayDays: number;
      dailyRate: number;
      totalPenalty: number;
      percentageOfContract: number;
    }
  ) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Get contractor contact if available
      const { data: contractor } = await supabase
        .from('employees')
        .select('user_id, full_name, email')
        .ilike('full_name', `%${projectDelay.contractorName}%`)
        .single();

      if (contractor?.user_id) {
        const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());
        await notificationService.createNotification({
          recipient_id: contractor.user_id,
          title: 'PÉNALITÉ CONTRACTUELLE - Action requise',
          message: `Votre projet "${projectDelay.projectName}" accuse un retard de ${projectDelay.delayDays} jours. Pénalité appliquée: ${penaltyData.totalPenalty.toLocaleString()} MRU.`,
          type: 'error',
          read: false
        });
      }

      return { success: true };
    } catch (error) {
      ErrorLogger.log(error as Error, 'BankGuaranteeService.sendContractorPenaltyNotification');
      throw error;
    }
  }

  /**
   * Get bank guarantees for a project
   */
  static async getByProjectId(projectId: string) {
    try {
      return await HexBankGuaranteeService.getByProjectId(projectId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'BankGuaranteeService.getByProjectId');
      throw error;
    }
  }

  /**
   * Create a new bank guarantee
   */
  static async create(guaranteeData: Omit<import('@/application/services/BankGuaranteeService').BankGuarantee, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const service = new HexBankGuaranteeService();
      return await service.createBankGuarantee(guaranteeData);
    } catch (error) {
      ErrorLogger.log(error as Error, 'BankGuaranteeService.create');
      throw error;
    }
  }

  /**
   * Update a bank guarantee
   */
  static async update(id: string, updates: Partial<import('@/application/services/BankGuaranteeService').BankGuarantee>) {
    try {
      const service = new HexBankGuaranteeService();
      return await service.updateBankGuarantee(id, updates);
    } catch (error) {
      ErrorLogger.log(error as Error, 'BankGuaranteeService.update');
      throw error;
    }
  }


  /**
   * Get active bank guarantee for a project
   */
  static async getActiveGuaranteeForProject(projectId: string) {
    try {
      // Validate projectId to prevent UUID errors
      if (!projectId || projectId.trim() === '') {
        console.warn('BankGuaranteeService.getActiveGuaranteeForProject: Invalid projectId provided');
        return null;
      }

      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('bank_guarantees')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      ErrorLogger.log(error as Error, 'BankGuaranteeService.getActiveGuaranteeForProject');
      return null;
    }
  }
}

// Legacy exports for backward compatibility
export const detectProjectDelays = () => BankGuaranteeService.detectProjectDelays();
export const triggerBankGuaranteeNotification = (delay: ProjectDelay, data: BankGuaranteeData) =>
  BankGuaranteeService.triggerBankGuaranteeNotification(delay, data);
export const calculatePenalties = (delay: ProjectDelay, rate: number) =>
  BankGuaranteeService.calculatePenalties(delay, rate);
export const sendContractorPenaltyNotification = (delay: ProjectDelay, data: {
  delayDays: number;
  dailyRate: number;
  totalPenalty: number;
  percentageOfContract: number;
}) =>
  BankGuaranteeService.sendContractorPenaltyNotification(delay, data);
