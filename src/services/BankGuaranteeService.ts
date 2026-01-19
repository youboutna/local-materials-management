import { BankGuaranteeRepository } from './BankGuaranteeRepository';
import { NotificationService } from './NotificationService';
import { ProjectDelay, BankGuaranteeData, NOTIFICATION_ROLES, DELAY_THRESHOLDS } from '@/types/project';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

export class BankGuaranteeService {
  /**
   * Detect projects with delays using repository
   */
  static async detectProjectDelays(): Promise<ProjectDelay[]> {
    try {
      return await BankGuaranteeRepository.detectProjectDelays();
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

      const notifications: any[] = [];

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
        let notificationType: any = 'delay_warning';

        switch (stakeholder.role_name) {
          case 'project_manager':
            title = 'URGENT: Retard projet - Garantie bancaire déclenchée';
            message = `Le projet "${projectDelay.projectName}" accuse un retard de ${projectDelay.delayPercentage}%. La banque a été notifiée pour activation de la garantie.`;
            notificationType = 'bank_guarantee_trigger';
            break;

          case 'director_programming':
            title = 'Escalade: Retard significatif détecté';
            message = `Retard de ${projectDelay.delayDays} jours sur "${projectDelay.projectName}". Procédure de garantie bancaire enclenchée.`;
            notificationType = 'escalation_required';
            break;

          case 'director':
            title = 'CRITIQUE: Activation garantie bancaire';
            message = `Retard critique sur "${projectDelay.projectName}" (${projectDelay.delayPercentage}%). Intervention directeur requise.`;
            notificationType = 'bank_guarantee_trigger';
            break;
        }

        notifications.push({
          recipient_id: stakeholder.user_id,
          title,
          message,
          type: notificationType,
          related_id: projectDelay.projectId,
          metadata: {
            related_project_id: projectDelay.projectId,
            priority: 'urgent',
            delay_percentage: projectDelay.delayPercentage,
            bank_liaison_email: bankGuaranteeData.bankLiaisonEmail,
            contract_guarantee_amount: bankGuaranteeData.guaranteeAmount,
            contractor_name: projectDelay.contractorName,
            escalation_level: projectDelay.delayPercentage >= DELAY_THRESHOLDS.LEGAL_ESCALATION ? 3 : 2
          }
        });
      }

      // Send all notifications
      const results = await Promise.allSettled(
        notifications.map(notification => NotificationService.createNotification(notification))
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
    penaltyData: any
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
        await NotificationService.createNotification({
          recipient_id: contractor.user_id,
          title: 'PÉNALITÉ CONTRACTUELLE - Action requise',
          message: `Votre projet "${projectDelay.projectName}" accuse un retard de ${projectDelay.delayDays} jours. Pénalité appliquée: ${penaltyData.totalPenalty.toLocaleString()} MRU.`,
          type: 'contractor_penalty',
          related_id: projectDelay.projectId,
          metadata: {
            related_project_id: projectDelay.projectId,
            priority: 'urgent',
            penalty_amount: penaltyData.totalPenalty,
            delay_days: projectDelay.delayDays,
            contractor_name: projectDelay.contractorName
          }
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
      return await BankGuaranteeRepository.getByProjectId(projectId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'BankGuaranteeService.getByProjectId');
      throw error;
    }
  }

  /**
   * Create a new bank guarantee
   */
  static async create(guaranteeData: any) {
    try {
      return await BankGuaranteeRepository.create(guaranteeData);
    } catch (error) {
      ErrorLogger.log(error as Error, 'BankGuaranteeService.create');
      throw error;
    }
  }

  /**
   * Update a bank guarantee
   */
  static async update(id: string, updates: any) {
    try {
      return await BankGuaranteeRepository.update(id, updates);
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
export const sendContractorPenaltyNotification = (delay: ProjectDelay, data: any) =>
  BankGuaranteeService.sendContractorPenaltyNotification(delay, data);
