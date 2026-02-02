import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Check intervals from ProjectManager (in days)
const CHECK_SCHEDULE_INTERVALS = {
  insuranceCheck: 1,
  delayCheck: 7,
  inspectionCheck: 1
} as const;

interface ProcessorConfig {
  enabled: boolean;
  batchSize: number;
  intervalMinutes: number;
  maxRetries: number;
}

interface TaskRecord {
  id: string;
  project_id: string;
  status: string;
  start_date: string;
  end_date: string;
  actual_cost?: number;
  weight?: number;
}

interface InsuranceRecord {
  id: string;
  policy_number: string;
  insurance_company: string;
  valid_until: string;
  status: string;
}

interface Task {
  id: string;
  project_id: string;
  status: string;
  start_date: string;
  end_date: string;
  actual_cost?: number;
  weight?: number;
}

interface InsurancePolicy {
  id: string;
  policy_number: string;
  insurance_company: string;
  valid_until: string;
  status: string;
  alertSent?: boolean;
}

interface InspectionRecord {
  id: string;
  status: string;
  progress_at_inspection: number;
}

interface Inspection {
  id: string;
  status: string;
  progress_at_inspection: number;
  issues: Array<{
    id: string;
    description: string;
    severity: string;
    status: string;
  }>;
}

interface EscalationThresholdRecord {
  threshold_name: string;
  threshold_value: number;
}

interface ProjectCheckTimestamps {
  projectId: string;
  lastChecks: {
    insurance: string;
    delay: string;
    inspection: string;
  };
  updatedAt: string;
}

interface Project {
  id: string;
  title: string;
  budget?: number;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

interface ProjectManagerContext {
  id: string;
  title: string;
  budget: number;
  tasks?: Task[];
  insurancePolicies?: InsurancePolicy[];
  inspections?: Inspection[];
  escalationThresholds?: {
    alert: number;
    notification: number;
    guarantee: number;
    legal: number;
  };
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

    // Process each project with respect to check intervals
    for (const project of projects) {
      try {
        // Get or create check timestamps for this project
        const checkTimestamps = await getProjectCheckTimestamps(supabase, project.id);
        
        // Determine which checks need to run based on intervals
        const checksToRun = determineChecksToRun(checkTimestamps);
        
        if (checksToRun.length === 0) {
          console.log(`Skipping project ${project.title} - no checks due`);
          continue;
        }

        console.log(`Running checks for project ${project.title}: ${checksToRun.join(', ')}`);

        const projectContext = await buildProjectContext(supabase, project);
        const alerts = await processProjectAlertsWithScheduling(projectContext, checksToRun);
        
        if (alerts.length > 0) {
          await saveAlerts(supabase, alerts);
          totalAlertsGenerated += alerts.length;
          console.log(`Generated ${alerts.length} alerts for project ${project.title}`);
        }

        // Update check timestamps for the checks that were run
        await updateProjectCheckTimestamps(supabase, project.id, checksToRun);

        processedProjects.push({
          projectId: project.id,
          title: project.title,
          alertsGenerated: alerts.length,
          checksRun: checksToRun
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

async function getProcessorConfig(supabase: SupabaseClient): Promise<ProcessorConfig> {
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

async function buildProjectContext(supabase: SupabaseClient, project: Project): Promise<ProjectManagerContext> {
  const [
    { data: tasks },
    { data: insurance },
    { data: inspections },
    { data: escalation }
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('project_id', project.id) as { data: TaskRecord[] | null },
    supabase.from('insurance_certificates').select('*').eq('project_id', project.id) as { data: InsuranceRecord[] | null },
    supabase.from('inspections').select('*').eq('project_id', project.id) as { data: InspectionRecord[] | null },
    supabase.from('escalation_thresholds').select('*').eq('is_active', true) as { data: EscalationThresholdRecord[] | null }
  ]);

  return {
    id: project.id,
    title: project.title,
    budget: project.budget || 0,
    tasks: tasks || [],
    insurancePolicies: insurance?.map(cert => ({
      id: cert.id,
      policy_number: cert.policy_number,
      insurance_company: cert.insurance_company,
      valid_until: cert.valid_until,
      status: cert.status,
      alertSent: false
    })) || [],
    inspections: inspections?.map(inspection => ({
      id: inspection.id,
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection || 0,
      issues: []
    })) || [],
    escalationThresholds: escalation?.reduce((acc, threshold) => ({
      ...acc,
      [threshold.threshold_name]: threshold.threshold_value
    }), { alert: 10, notification: 20, guarantee: 30, legal: 40 })
  };
}

async function processProjectAlertsWithScheduling(projectContext: ProjectManagerContext, checksToRun: string[]): Promise<ProjectManagerAlert[]> {
  const alerts: ProjectManagerAlert[] = [];
  
  // Only run the checks that are due based on intervals
  if (checksToRun.includes('insurance')) {
    const insuranceAlerts = checkInsurancePolicies(projectContext);
    alerts.push(...insuranceAlerts);
  }
  
  if (checksToRun.includes('delay')) {
    const delayAlerts = checkProjectDelays(projectContext);
    alerts.push(...delayAlerts);
  }
  
  if (checksToRun.includes('inspection')) {
    const inspectionAlerts = checkInspections(projectContext);
    alerts.push(...inspectionAlerts);
  }
  
  // Financial checks can run always as they're not in the scheduled intervals
  const financialAlerts = checkFinancialRisks(projectContext);
  alerts.push(...financialAlerts);
  
  return alerts;
}

async function getProjectCheckTimestamps(supabase: SupabaseClient, projectId: string): Promise<ProjectCheckTimestamps> {
  const { data } = await supabase
    .from('system_settings')
    .select('*')
    .eq('category', 'project_check_timestamps')
    .eq('key', projectId)
    .maybeSingle();

  if (data?.configuration) {
    return data.configuration;
  }

  // Return default timestamps (epoch) for new projects
  return {
    projectId,
    lastChecks: {
      insurance: new Date(0).toISOString(),
      delay: new Date(0).toISOString(),
      inspection: new Date(0).toISOString()
    },
    updatedAt: new Date().toISOString()
  };
}

function determineChecksToRun(checkTimestamps: ProjectCheckTimestamps): string[] {
  const now = new Date();
  const checksToRun: string[] = [];

  // Check insurance (daily)
  const daysSinceInsurance = Math.floor((now.getTime() - new Date(checkTimestamps.lastChecks.insurance).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceInsurance >= CHECK_SCHEDULE_INTERVALS.insuranceCheck) {
    checksToRun.push('insurance');
  }

  // Check delays (weekly)  
  const daysSinceDelay = Math.floor((now.getTime() - new Date(checkTimestamps.lastChecks.delay).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceDelay >= CHECK_SCHEDULE_INTERVALS.delayCheck) {
    checksToRun.push('delay');
  }

  // Check inspections (daily)
  const daysSinceInspection = Math.floor((now.getTime() - new Date(checkTimestamps.lastChecks.inspection).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceInspection >= CHECK_SCHEDULE_INTERVALS.inspectionCheck) {
    checksToRun.push('inspection');
  }

  return checksToRun;
}

async function updateProjectCheckTimestamps(supabase: SupabaseClient, projectId: string, checksRun: string[]): Promise<void> {
  const now = new Date().toISOString();
  
  // Get current timestamps
  const currentTimestamps = await getProjectCheckTimestamps(supabase, projectId);
  
  // Update only the checks that were run
  const updatedChecks = { ...currentTimestamps.lastChecks };
  checksRun.forEach(check => {
    if (check in updatedChecks) {
      updatedChecks[check as keyof typeof updatedChecks] = now;
    }
  });

  const updatedTimestamps: ProjectCheckTimestamps = {
    projectId,
    lastChecks: updatedChecks,
    updatedAt: now
  };

  await supabase
    .from('system_settings')
    .upsert({
      category: 'project_check_timestamps',
      key: projectId,
      configuration: updatedTimestamps,
      updated_at: now
    });
}

function checkInsurancePolicies(project: ProjectManagerContext): ProjectManagerAlert[] {
  const alerts: ProjectManagerAlert[] = [];
  const today = new Date();

  for (const policy of project.insurancePolicies || []) {
    if (policy.status === 'expired' && policy.alertSent) continue;

    const endDate = new Date(policy.valid_until);
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
        message: `La police d'assurance ${policy.policy_number} (${policy.insurance_company}) ${daysToExpire <= 0 ? 'a expiré' : `expire dans ${daysToExpire} jours`}`,
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

async function saveAlerts(supabase: SupabaseClient, alerts: ProjectManagerAlert[]): Promise<void> {
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

async function logProcessingSummary(
  supabase: SupabaseClient, 
  summary: {
    processedProjects: number;
    totalAlerts: number;
    processingTime: string;
    config: ProcessorConfig;
  }
): Promise<void> {
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