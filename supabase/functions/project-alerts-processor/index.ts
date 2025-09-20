import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessorConfig {
  enabled: boolean;
  batchSize: number;
  intervalMinutes: number;
  maxRetries: number;
}

interface ProjectManagerAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  projectId: string;
  escalationLevel?: number;
  acknowledged: boolean;
  actionRequired: boolean;
  triggerDate: string;
  timestamp: string;
  relatedEntityId?: string;
  deadline?: string;
  availableActions?: string[];
}

interface ProjectManagerContext {
  id: string;
  title: string;
  budget: number;
  tasks?: any[];
  insurancePolicies?: any[];
  inspections?: any[];
  escalationThresholds?: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get processor configuration
    const config = await getProcessorConfig(supabase);
    
    if (!config.enabled) {
      console.log('Project alerts processor is disabled');
      return new Response(
        JSON.stringify({ message: 'Processor disabled', processed: 0 }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Starting project alerts processing with config:`, config);

    // Get projects for batch processing
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        budget,
        status,
        start_date,
        end_date,
        created_at,
        updated_at
      `)
      .eq('status', 'in_progress')
      .limit(config.batchSize);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    if (!projects || projects.length === 0) {
      console.log('No active projects to process');
      return new Response(
        JSON.stringify({ message: 'No active projects', processed: 0 }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`Processing ${projects.length} projects`);

    let totalAlertsGenerated = 0;
    const processedProjects = [];

    // Process each project
    for (const project of projects) {
      try {
        const projectContext = await buildProjectContext(supabase, project);
        const alerts = await processProjectAlerts(projectContext);
        
        if (alerts.length > 0) {
          await saveAlerts(supabase, alerts);
          totalAlertsGenerated += alerts.length;
          console.log(`Generated ${alerts.length} alerts for project ${project.title}`);
        }

        processedProjects.push({
          projectId: project.id,
          title: project.title,
          alertsGenerated: alerts.length
        });

      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
        // Continue with other projects
      }
    }

    // Log processing summary
    await logProcessingSummary(supabase, {
      processedProjects: projects.length,
      totalAlerts: totalAlertsGenerated,
      processingTime: new Date().toISOString(),
      config
    });

    console.log(`Processing complete: ${totalAlertsGenerated} alerts generated for ${projects.length} projects`);

    return new Response(
      JSON.stringify({
        message: 'Processing complete',
        processed: projects.length,
        alertsGenerated: totalAlertsGenerated,
        projects: processedProjects
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in project alerts processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function getProcessorConfig(supabase: any): Promise<ProcessorConfig> {
  // Try to get config from database settings table
  const { data: settings } = await supabase
    .from('system_settings')
    .select('*')
    .eq('category', 'alerts_processor')
    .single();

  if (settings?.configuration) {
    return settings.configuration;
  }

  // Default configuration
  return {
    enabled: true,
    batchSize: 10,
    intervalMinutes: 60,
    maxRetries: 3
  };
}

async function buildProjectContext(supabase: any, project: any): Promise<ProjectManagerContext> {
  // Get related data for the project
  const [tasksResult, insuranceResult, inspectionsResult, escalationResult] = await Promise.all([
    supabase.from('tasks').select('*').eq('project_id', project.id),
    supabase.from('insurance_certificates').select('*').eq('project_id', project.id),
    supabase.from('inspections').select('*').eq('project_id', project.id),
    supabase.from('escalation_thresholds').select('*').eq('is_active', true)
  ]);

  return {
    id: project.id,
    title: project.title,
    budget: project.budget || 0,
    tasks: tasksResult.data || [],
    insurancePolicies: insuranceResult.data?.map(cert => ({
      id: cert.id,
      reference: cert.policy_number,
      type: 'assurance',
      issuer: cert.insurance_company,
      endDate: cert.valid_until,
      status: cert.status,
      alertSent: false
    })) || [],
    inspections: inspectionsResult.data?.map(inspection => ({
      id: inspection.id,
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection || 0,
      issues: [] // Would need to get issues from related table
    })) || [],
    escalationThresholds: escalationResult.data?.reduce((acc: any, threshold: any) => {
      acc[threshold.threshold_name] = threshold.threshold_value;
      return acc;
    }, {}) || { alert: 10, notification: 20, guarantee: 30, legal: 40 }
  };
}

async function processProjectAlerts(projectContext: ProjectManagerContext): Promise<ProjectManagerAlert[]> {
  // Import and use the ProjectManager logic
  const alerts: ProjectManagerAlert[] = [];
  
  // Check insurance policies
  const insuranceAlerts = checkInsurancePolicies(projectContext);
  alerts.push(...insuranceAlerts);
  
  // Check project delays
  const delayAlerts = checkProjectDelays(projectContext);
  alerts.push(...delayAlerts);
  
  // Check inspections
  const inspectionAlerts = checkInspections(projectContext);
  alerts.push(...inspectionAlerts);
  
  // Check financial risks
  const financialAlerts = checkFinancialRisks(projectContext);
  alerts.push(...financialAlerts);
  
  return alerts;
}

function checkInsurancePolicies(project: ProjectManagerContext): ProjectManagerAlert[] {
  const alerts: ProjectManagerAlert[] = [];
  const today = new Date();

  for (const policy of project.insurancePolicies || []) {
    if (policy.status === 'expired' && policy.alertSent) continue;

    const endDate = new Date(policy.endDate);
    const daysToExpire = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (daysToExpire <= 0) severity = 'critical';
    else if (daysToExpire <= 7) severity = 'high';
    else if (daysToExpire <= 15) severity = 'medium';
    else if (daysToExpire <= 30) severity = 'low';

    if (daysToExpire <= 30) {
      alerts.push({
        id: `insurance-${policy.id}-${Date.now()}`,
        type: 'insurance_expiry',
        severity,
        title: `Expiration d'assurance`,
        message: `La police d'assurance ${policy.reference} (${policy.issuer}) ${daysToExpire <= 0 ? 'a expiré' : `expire dans ${daysToExpire} jours`}`,
        projectId: project.id,
        relatedEntityId: policy.id,
        triggerDate: today.toISOString(),
        timestamp: today.toISOString(),
        acknowledged: false,
        actionRequired: true,
        escalationLevel: daysToExpire <= 0 ? 2 : 1,
        deadline: daysToExpire > 0 ? new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        availableActions: ['email', 'sms', 'hierarchy_notification']
      });
    }
  }

  return alerts;
}

function checkProjectDelays(project: ProjectManagerContext): ProjectManagerAlert[] {
  const alerts: ProjectManagerAlert[] = [];
  const tasks = project.tasks || [];
  const today = new Date();

  if (tasks.length === 0) return alerts;

  const activeTasks = tasks.filter(task => 
    task.status === 'in_progress' || task.status === 'delayed'
  );

  if (activeTasks.length === 0) return alerts;

  let totalWeightedDelay = 0;
  let totalWeight = 0;

  for (const task of activeTasks) {
    const plannedEnd = new Date(task.end_date);
    const plannedDuration = Math.floor((plannedEnd.getTime() - new Date(task.start_date).getTime()) / (1000 * 60 * 60 * 24));
    
    if (today > plannedEnd) {
      const actualDuration = Math.floor((today.getTime() - new Date(task.start_date).getTime()) / (1000 * 60 * 60 * 24));
      const delayPercentage = ((actualDuration - plannedDuration) / plannedDuration) * 100;
      
      totalWeightedDelay += delayPercentage * (task.weight || 1);
      totalWeight += (task.weight || 1);
    }
  }

  if (totalWeight === 0) return alerts;

  const averageDelay = totalWeightedDelay / totalWeight;
  const thresholds = project.escalationThresholds;

  let level: number | null = null;
  if (averageDelay >= thresholds.legal) level = 4;
  else if (averageDelay >= thresholds.guarantee) level = 3;
  else if (averageDelay >= thresholds.notification) level = 2;
  else if (averageDelay >= thresholds.alert) level = 1;

  if (level !== null) {
    alerts.push({
      id: `delay-${project.id}-${Date.now()}`,
      type: 'project_delay',
      severity: level >= 4 ? 'critical' : level >= 3 ? 'high' : level >= 2 ? 'medium' : 'low',
      title: `Retard de projet - Niveau ${level}`,
      message: `Retard pondéré détecté : ${averageDelay.toFixed(1)}%. Le projet accuse un retard significatif.`,
      projectId: project.id,
      triggerDate: today.toISOString(),
      timestamp: today.toISOString(),
      acknowledged: false,
      actionRequired: true,
      escalationLevel: level,
      availableActions: ['task_assignment', 'hierarchy_notification', 'call']
    });
  }

  return alerts;
}

function checkInspections(project: ProjectManagerContext): ProjectManagerAlert[] {
  const alerts: ProjectManagerAlert[] = [];
  const inspections = project.inspections || [];
  const today = new Date();

  for (const inspection of inspections) {
    if (inspection.progress_at_inspection < 50 && inspection.status !== 'completed') {
      alerts.push({
        id: `inspection-${inspection.id}-${Date.now()}`,
        type: 'inspection_issue',
        severity: 'medium',
        title: 'Progression insuffisante lors de l\'inspection',
        message: `Inspection ${inspection.id} : progression à ${inspection.progress_at_inspection}% seulement`,
        projectId: project.id,
        relatedEntityId: inspection.id,
        triggerDate: today.toISOString(),
        timestamp: today.toISOString(),
        acknowledged: false,
        actionRequired: true,
        escalationLevel: 1,
        availableActions: ['call', 'email', 'hierarchy_notification']
      });
    }
  }

  return alerts;
}

function checkFinancialRisks(project: ProjectManagerContext): ProjectManagerAlert[] {
  const alerts: ProjectManagerAlert[] = [];
  const tasks = project.tasks || [];
  const today = new Date();

  const totalActualCost = tasks.reduce((sum, task) => sum + (task.actual_cost || 0), 0);
  const budgetUtilization = (totalActualCost / project.budget) * 100;

  if (budgetUtilization > 80) {
    const remainingBudget = project.budget - totalActualCost;
    const severity = budgetUtilization > 90 ? 'critical' : budgetUtilization > 80 ? 'high' : 'medium';
    
    alerts.push({
      id: `financial-${project.id}-${Date.now()}`,
      type: 'financial_risk',
      severity,
      title: 'Utilisation élevée du budget',
      message: `Le projet a utilisé ${budgetUtilization.toFixed(1)}% de son budget total. Budget restant: ${remainingBudget.toLocaleString()} €`,
      projectId: project.id,
      triggerDate: today.toISOString(),
      timestamp: today.toISOString(),
      acknowledged: false,
      actionRequired: true,
      escalationLevel: budgetUtilization > 90 ? 3 : budgetUtilization > 80 ? 2 : 1,
      relatedEntityId: JSON.stringify({ budgetUtilization, remainingBudget }),
      availableActions: ['financial_review', 'legal_consultation', 'hierarchy_notification']
    });
  }

  return alerts;
}

async function saveAlerts(supabase: any, alerts: ProjectManagerAlert[]): Promise<void> {
  if (alerts.length === 0) return;

  // Save alerts to notifications table
  const notifications = alerts.map(alert => ({
    type: alert.type,
    title: alert.title,
    message: alert.message,
    recipient_id: '00000000-0000-0000-0000-000000000000', // System notifications
    metadata: {
      projectId: alert.projectId,
      severity: alert.severity,
      escalationLevel: alert.escalationLevel,
      relatedEntityId: alert.relatedEntityId,
      availableActions: alert.availableActions,
      actionRequired: alert.actionRequired,
      deadline: alert.deadline
    },
    related_id: alert.projectId
  }));

  const { error } = await supabase
    .from('notifications')
    .insert(notifications);

  if (error) {
    console.error('Error saving alerts:', error);
    throw error;
  }
}

async function logProcessingSummary(supabase: any, summary: any): Promise<void> {
  const { error } = await supabase
    .from('processing_logs')
    .insert({
      process_type: 'project_alerts',
      summary,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.log('Warning: Could not log processing summary:', error);
  }
}