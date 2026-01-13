/**
 * Hexagonal hooks for Payments module
 * Centralizes all payment-related Supabase operations
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isBefore, differenceInDays, parseISO } from 'date-fns';

// Types
export interface PaymentMilestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'approved' | 'paid' | 'overdue' | 'blocked';
  progressRequired: number;
  currentProgress: number;
  phaseId?: string;
  phaseName?: string;
  penaltyRate?: number;
  penaltyAccrued?: number;
}

export interface PaymentScheduleData {
  payments: PaymentMilestone[];
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  totalPenalties: number;
}

// Hook: Fetch payment schedule timeline
export function usePaymentSchedule(projectId: string, projectBudget: number = 0) {
  return useQuery({
    queryKey: ['payment-schedule', projectId],
    queryFn: async (): Promise<PaymentScheduleData> => {
      // Fetch payment milestones from enhanced_project_milestones
      const { data: milestonesData, error: mError } = await supabase
        .from('enhanced_project_milestones')
        .select(`
          *,
          project_phases (id, phase_name, progress)
        `)
        .eq('project_id', projectId)
        .order('target_date', { ascending: true });

      if (mError) throw mError;

      // Fetch existing payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId);

      const paymentMap = new Map((paymentsData || []).map((p: any) => [p.milestone_id, p]));

      // Filter milestones that are payment triggers
      const paymentMilestones: PaymentMilestone[] = (milestonesData || [])
        .filter((m: any) => {
          const deps = m.dependencies as any;
          return deps?.type === 'payment' || deps?.is_payment_trigger;
        })
        .map((m: any) => {
          const deps = m.dependencies as any;
          const existingPayment = paymentMap.get(m.id);
          const today = new Date();
          const dueDate = parseISO(m.target_date);
          const daysOverdue = Math.max(0, differenceInDays(today, dueDate));

          let status: PaymentMilestone['status'] = 'pending';
          if (existingPayment?.status === 'paid') status = 'paid';
          else if (existingPayment?.status === 'approved') status = 'approved';
          else if (isBefore(dueDate, today)) status = 'overdue';
          else if (existingPayment?.status === 'blocked') status = 'blocked';

          // Calculate penalty (0.1% per day of delay, typical construction)
          const penaltyRate = deps?.penalty_rate || 0.001;
          const penaltyAccrued =
            status === 'overdue'
              ? (deps?.payment_amount || 0) * penaltyRate * daysOverdue
              : 0;

          return {
            id: m.id,
            title: m.title,
            amount: deps?.payment_amount || projectBudget * (m.weight || 0.1),
            dueDate: m.target_date,
            status,
            progressRequired: deps?.progress_required || (m.weight || 0.1) * 100,
            currentProgress: m.project_phases?.progress || 0,
            phaseId: m.phase_id,
            phaseName: m.project_phases?.phase_name,
            penaltyRate,
            penaltyAccrued
          };
        });

      const totalAmount = paymentMilestones.reduce((sum, p) => sum + p.amount, 0);
      const paidAmount = paymentMilestones
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      const overdueAmount = paymentMilestones
        .filter((p) => p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0);
      const totalPenalties = paymentMilestones.reduce(
        (sum, p) => sum + (p.penaltyAccrued || 0),
        0
      );

      return {
        payments: paymentMilestones,
        totalAmount,
        paidAmount,
        overdueAmount,
        totalPenalties
      };
    },
    enabled: !!projectId
  });
}

// Hook: Fetch hierarchy for escalation
export function useEscalationTargets(projectId: string, escalationLevel?: string) {
  return useQuery({
    queryKey: ['escalation-targets', projectId, escalationLevel],
    queryFn: async () => {
      if (!escalationLevel) return [];
      const { data, error } = await supabase.rpc('get_escalation_targets', {
        project_id_param: projectId,
        escalation_level_param: escalationLevel
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !!escalationLevel
  });
}
