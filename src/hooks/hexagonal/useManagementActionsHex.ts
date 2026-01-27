// Hook hexagonal pour les actions de gestion

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  type: 'task' | 'approval' | 'review' | 'decision' | 'alert';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: 'task' | 'approval' | 'review' | 'decision';
  createdAt: string;
  assignedTo?: string;
  dueDate?: Date;
  projectId?: string;
  projectName?: string;
  inspectionId?: string;
  paymentId?: string;
}

async function fetchManagementActions(): Promise<ActionItem[]> {
  const actions: ActionItem[] = [];

  // Parallel fetches for efficiency
  const [
    { data: pendingInspections },
    { data: paymentRequests },
    { data: overdueInspections },
    { data: projectsWithBudgetIssues },
    { data: newProjects }
  ] = await Promise.all([
    supabase
      .from('inspections')
      .select(`id, date, inspector, progress_at_inspection, project_id, status, projects (id, title)`)
      .in('status', ['in_progress', 'scheduled'])
      .order('date', { ascending: true })
      .limit(5),
    supabase
      .from('supplier_payment_requests')
      .select(`id, amount, requested_date, project_id, status, supplier_id, projects (id, title)`)
      .eq('status', 'pending')
      .order('requested_date', { ascending: true })
      .limit(5),
    supabase
      .from('inspections')
      .select(`id, date, inspector, project_id, projects (id, title)`)
      .lt('date', new Date().toISOString())
      .eq('status', 'pending')
      .order('date', { ascending: true })
      .limit(3),
    supabase
      .from('projects')
      .select('id, title, budget, progress')
      .gt('progress', 80)
      .limit(2),
    supabase
      .from('projects')
      .select('id, title, start_date')
      .eq('progress', 0)
      .gte('start_date', new Date().toISOString())
      .limit(2)
  ]);

  // Process pending inspections
  if (pendingInspections) {
    pendingInspections.forEach(inspection => {
      actions.push({
        id: `inspection-payment-${inspection.id}`,
        title: 'Validation paiement inspection',
        description: `Inspection à ${inspection.progress_at_inspection}% - ${inspection.inspector}`,
        type: 'approval',
        priority: inspection.status === 'in_progress' ? 'high' : 'medium',
        status: 'pending',
        urgency: inspection.status === 'in_progress' ? 'high' : 'medium',
        category: 'approval',
        createdAt: new Date().toISOString(),
        projectId: (inspection.projects as any)?.id,
        projectName: (inspection.projects as any)?.title,
        inspectionId: inspection.id,
        dueDate: new Date(inspection.date)
      });
    });
  }

  // Process payment requests
  if (paymentRequests) {
    paymentRequests.forEach(request => {
      actions.push({
        id: `payment-request-${request.id}`,
        title: 'Demande de paiement fournisseur',
        description: `Montant: ${request.amount.toLocaleString()} MRU - ${(request.suppliers as any)?.name}`,
        type: 'approval',
        priority: request.amount > 100000 ? 'high' : 'medium',
        status: 'pending',
        urgency: request.amount > 100000 ? 'critical' : 'high',
        category: 'approval',
        createdAt: new Date().toISOString(),
        projectId: (request.projects as any)?.id,
        projectName: (request.projects as any)?.title,
        paymentId: request.id,
        dueDate: new Date(request.requested_date)
      });
    });
  }

  // Process overdue inspections
  if (overdueInspections) {
    overdueInspections.forEach(inspection => {
      const daysPast = Math.floor((Date.now() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24));
      actions.push({
        id: `inspection-${inspection.id}`,
        title: 'Inspection en retard',
        description: `${daysPast} jours de retard - Inspecteur: ${inspection.inspector}`,
        type: 'task',
        priority: daysPast > 7 ? 'high' : 'medium',
        status: 'pending',
        urgency: daysPast > 7 ? 'high' : 'medium',
        category: 'task',
        createdAt: new Date().toISOString(),
        projectId: (inspection.projects as any)?.id,
        projectName: (inspection.projects as any)?.title,
        dueDate: new Date(inspection.date)
      });
    });
  }

  // Process budget issues
  if (projectsWithBudgetIssues) {
    projectsWithBudgetIssues.forEach(project => {
      actions.push({
        id: `budget-${project.id}`,
        title: 'Revue budgétaire',
        description: `Projet à ${project.progress}% - Vérification budget requise`,
        type: 'review',
        priority: 'medium',
        status: 'pending',
        urgency: 'medium',
        category: 'review',
        createdAt: new Date().toISOString(),
        projectId: project.id,
        projectName: project.title,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      });
    });
  }

  // Process new projects
  if (newProjects) {
    newProjects.forEach(project => {
      actions.push({
        id: `team-${project.id}`,
        title: 'Affectation équipe',
        description: 'Nouveau projet démarrant bientôt',
        type: 'decision',
        priority: 'medium',
        status: 'pending',
        urgency: 'medium',
        category: 'decision',
        createdAt: new Date().toISOString(),
        projectId: project.id,
        projectName: project.title,
        dueDate: new Date(project.start_date)
      });
    });
  }

  return actions;
}

export function useManagementActionsHex() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['management-actions'],
    queryFn: fetchManagementActions,
    staleTime: 30000
  });

  return {
    actions: data || [],
    loading: isLoading,
    error,
    refetch
  };
}
