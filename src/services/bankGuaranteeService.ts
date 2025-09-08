import { supabase } from '@/integrations/supabase/client';
import { sendNotification } from './notificationService';
import{ProjectDelay,BankGuaranteeData, DELAY_THRESHOLDS, NOTIFICATION_ROLES} from '@/types/project';

export const detectProjectDelays = async (): Promise<ProjectDelay[]> => {
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

    if (error) throw error;

    const delays: ProjectDelay[] = [];
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
            milestonesMissed: Math.floor(delayPercentage / 10) // Estimate based on delay
          });
        }
      }
    }

    return delays;
  } catch (error) {
    console.error('Error detecting project delays:', error);
    return [];
  }
};

export const triggerBankGuaranteeNotification = async (
  projectDelay: ProjectDelay,
  bankGuaranteeData: BankGuaranteeData
) => {
  try {
    // Get stakeholders for notifications
    const { data: stakeholders } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role_name,
        profiles!inner(full_name, email)
      `)
      .in('role_name', [NOTIFICATION_ROLES.PROJECT_MANAGER, NOTIFICATION_ROLES.DIRECTOR_PROGRAMMING, NOTIFICATION_ROLES.BANK_LIAISON, NOTIFICATION_ROLES.DIRECTOR]);

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
      notifications.map(notification => sendNotification(notification))
    );

    console.log(`Bank guarantee notifications sent: ${results.filter(r => r.status === 'fulfilled').length} successful`);

    return {
      success: true,
      notificationsSent: results.filter(r => r.status === 'fulfilled').length,
      bankEmailContent
    };

  } catch (error) {
    console.error('Error triggering bank guarantee notification:', error);
    throw error;
  }
};

export const calculatePenalties = (projectDelay: ProjectDelay, dailyPenaltyRate: number) => {
  const totalPenalty = projectDelay.delayDays * dailyPenaltyRate;
  return {
    delayDays: projectDelay.delayDays,
    dailyRate: dailyPenaltyRate,
    totalPenalty,
    percentageOfContract: Math.round((totalPenalty / 1000000) * 100) // Assuming 1M contract
  };
};

export const sendContractorPenaltyNotification = async (
  projectDelay: ProjectDelay,
  penaltyData: any
) => {
  try {
    // Get contractor contact if available
    const { data: contractor } = await supabase
      .from('employees')
      .select('user_id, full_name, email')
      .ilike('full_name', `%${projectDelay.contractorName}%`)
      .single();

    if (contractor?.user_id) {
      await sendNotification({
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
    console.error('Error sending contractor penalty notification:', error);
    throw error;
  }
};