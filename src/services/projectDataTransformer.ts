import { supabase } from '@/integrations/supabase/client';
import { GanttChartData, GanttDependency, GanttTask, Inspection, ProjectData, ProjectResource, ProjectRisk, ProjectStatus, Task } from '@/types/project';
import { ReportCalculations } from '@/utils/reportCalculations';

export class ProjectDataTransformer {
  static async transformProjectData(rawData: any): Promise<ProjectData> {
    const transformedProject = await this.transformProject(rawData);
    if (!transformedProject) {
      throw new Error('Failed to transform project data');
    }
    return transformedProject;
  }

  static async getProjectById(projectId: string): Promise<ProjectData | null> {
    try {
      console.log('🔍 ProjectDataTransformer.getProjectById starting for:', projectId);
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          inspections(*),
          payments(*)
        `)
        .eq('id', projectId)
        .maybeSingle();

      console.log('🔍 Supabase query completed. Error:', error, 'Data:', data ? 'EXISTS' : 'NULL');

      if (error) {
        console.error('❌ Error fetching project:', error);
        throw error;
      }

      if (!data) {
        console.log('❌ No project found with ID:', projectId);
        return null;
      }

      console.log('🔍 Starting project transformation...');
      const result = await this.transformProject(data);
      console.log('🔍 Project transformation completed:', result ? 'SUCCESS' : 'FAILED');
      return result;
    } catch (error) {
      console.error('Error in getProjectById:', error);
      throw error;
    }
  }

  static async getAllProjects(): Promise<ProjectData[]> {
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select(`
          *,
          inspections(*),
          payments(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        return [];
      }

      const transformedProjects = await Promise.all(
        (projects || []).map(project => this.transformProject(project))
      );

      return transformedProjects.filter((project): project is ProjectData => project !== null);
    } catch (error) {
      console.error('Error in getAllProjects:', error);
      return [];
    }
  }

  private static async transformProject(data: any): Promise<ProjectData | null> {
    try {
      console.log('🔍 Transforming project data:', data.id, data.title);

      console.log('🔍 Fetching related data...');
      const startTime = Date.now();

      console.log('🔍 Fetching tasks...');
      const tasks = await this.transformTasks(data.id);
      console.log('🔍 Tasks fetched:', tasks.length, 'items in', Date.now() - startTime, 'ms');

      console.log('🔍 Fetching risks...');
      const risks = await this.transformRisks(data.id);
      console.log('🔍 Risks fetched:', risks.length, 'items');

      console.log('🔍 Fetching resources...');
      const resources = await this.transformResources(data.id);
      console.log('🔍 Resources fetched:', resources.length, 'items');

      console.log('🔍 Fetching payments...');
      const payments = await this.fetchPayments(data.id);
      console.log('🔍 Payments fetched:', payments.length, 'items');

      console.log('🔍 Processing inspections...');
      const inspections = this.transformInspections(data.inspections || []);

      console.log('🔍 Calculating progress...');
      const overallProgress = data.progress || this.calculateOverallProgress(tasks);

      console.log('🔍 Processing phases...');
      const phases = data.phases || [];
      const currentPhaseInfo = this.determineCurrentPhase(phases);
      const milestones = this.generateMilestonesFromPhases(phases);

      console.log('🔍 Calculating PERT analysis...');
      const pertAnalysis = ReportCalculations.calculatePERTAnalysis(tasks);
      
      console.log('🔍 Generating charts...');
      const ganttChart = this.generateGanttChart(tasks);
      const resourceAllocation = this.calculateResourceAllocation(tasks, resources);
      const costAnalysis = this.calculateCostAnalysis(tasks, phases, data.budget);
  
      console.log('🔍 Calculating critical path...');
      const criticalPath = this.calculateCriticalPath(tasks, pertAnalysis.expectedDurations);

      console.log('🔍 Fetching project phases...');
      // Fetch project phases separately for better structure
      const plannedPhases = await this.fetchProjectPhases(data.id);
      console.log('🔍 Project phases fetched:', plannedPhases.length, 'items');

      console.log('Building project object with:', { 
        title: data.title, 
        progress: overallProgress, 
        phasesCount: plannedPhases.length 
      });

      const project: ProjectData = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        location: data.location || '',
        status: (data.status as ProjectStatus) || 'en cours',
        progress: overallProgress,
        budget: data.budget || 0,
        startDate: data.start_date || data.created_at,
        endDate: data.end_date || undefined,
        thumbnail: data.image || '/img/project-placeholder.jpg',
        teamSize: data.team_size || 0,
        coordinates: {
          latitude: data.coordinates_latitude || 0,
          longitude: data.coordinates_longitude || 0
        },
        financingSource: data.financing_source || undefined,
        marketType: data.market_type || undefined,
        selectionMode: data.selection_mode || undefined,
        launchDate: data.launch_date || undefined,
        attributionDate: data.attribution_date || undefined,
        allowsInitialPayment: data.allows_initial_payment || undefined,
        initialPaymentPercentage: data.initial_payment_percentage || undefined,

        // Related data
        inspections,
        tasks,
        risks,
        resources,
        expenses: payments,
        plannedPhases,

        // Analysis data
        methodology: data.methodology || 'waterfall',
        ganttChart,
        pertAnalysis,
        currentPhase: currentPhaseInfo.phase,
        currentStage: currentPhaseInfo.stage,
        constructionMilestones: milestones,
        escalationThresholds: {
          alert: data.alert_threshold || 10,
          notification: data.notification_threshold || 20,
          guarantee: data.guarantee_threshold || 30,
          legal: data.legal_threshold || 40
        },
        checkScheduleLastRun: {
          insurance: data.last_insurance_check || undefined,
          delay: data.last_delay_check || undefined,
          inspection: data.last_inspection_check || undefined
        },
      };

      console.log('Project transformation completed successfully');
      return project;
    } catch (error) {
      console.error('Error transforming project:', error);
      return null;
    }
  }

  /**
  * Calcule le chemin critique avec un algorithme de graphe complet
  */
  private static calculateCriticalPath(tasks: Task[], expectedDurations: { [taskId: string]: number }): string[] {
    if (!tasks || tasks.length === 0) return [];

    // Crée un map rapide id -> task
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Initialisation des dates
    const earlyStart: Record<string, number> = {};
    const earlyFinish: Record<string, number> = {};
    const lateStart: Record<string, number> = {};
    const lateFinish: Record<string, number> = {};

    // Tri topologique pour garantir que toutes les dépendances sont calculées avant
    const sortedTasks = this.topologicalSort(tasks);

    // --- Calcul ES / EF ---
    for (const task of sortedTasks) {
      if (!task.dependencies || task.dependencies.length === 0) {
        earlyStart[task.id] = 0;
      } else {
        earlyStart[task.id] = Math.max(...task.dependencies.map(dep => earlyFinish[dep] || 0));
      }
      earlyFinish[task.id] = earlyStart[task.id] + (expectedDurations[task.id] || 0);
    }

    // Durée totale du projet
    const projectDuration = Math.max(...Object.values(earlyFinish));

    // --- Calcul LF / LS ---
    for (const task of [...sortedTasks].reverse()) {
      const successors = tasks.filter(t => t.dependencies.includes(task.id));
      lateFinish[task.id] = successors.length === 0
        ? projectDuration
        : Math.min(...successors.map(s => lateStart[s.id] || projectDuration));
      lateStart[task.id] = lateFinish[task.id] - (expectedDurations[task.id] || 0);
    }

    // --- Identification du chemin critique ---
    const criticalPath: string[] = [];
    for (const task of tasks) {
      const slack = (lateStart[task.id] || 0) - (earlyStart[task.id] || 0);
      if (slack === 0) {
        criticalPath.push(task.id);
        task.criticalPath = true;
      } else {
        task.criticalPath = false;
      }
    }

    return criticalPath;
  }

  /**
   * Tri topologique des tâches pour parcourir le graphe correctement
   */
  private static topologicalSort(tasks: Task[]): Task[] {
    const visited = new Set<string>();
    const sorted: Task[] = [];

    const visit = (task: Task) => {
      if (visited.has(task.id)) return;
      visited.add(task.id);

      for (const depId of task.dependencies || []) {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) visit(depTask);
      }

      sorted.push(task);
    };

    for (const task of tasks) {
      if (!visited.has(task.id)) {
        visit(task);
      }
    }

    return sorted;
  }

  private static async transformTasks(projectId: string): Promise<Task[]> {
    try {
      console.log('🔍 transformTasks for:', projectId);
      const { data: taskAssignments } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('project_id', projectId);

      console.log('🔍 Found', taskAssignments?.length || 0, 'task assignments');

      return (taskAssignments || []).map(task => ({
        id: task.id,
        name: task.title,
        description: task.description || 'Task description',
        phaseId: '',
        dependencies: [],
        assignedTo: task.assigned_to ? [task.assigned_to] : [],
        estimatedDuration: 30,
        actualDuration: undefined,
        startDate: task.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        endDate: task.due_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'in_progress' : 'not_started',
        progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
        weight: 1,
        costEstimate: 0,
        actualCost: 0
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  private static async transformRisks(projectId: string): Promise<ProjectRisk[]> {
    try {
      const { data: risks } = await supabase
        .from('project_risks')
        .select('*')
        .eq('project_id', projectId);

      return (risks || []).map(risk => ({
        id: risk.id,
        title: risk.risk_title,
        description: risk.risk_description || '',
        probability: Number(risk.probability || 0),
        impact: Number(risk.impact || 0),
        mitigationPlan: risk.mitigation_strategy || '',
        status: risk.status as 'identified' | 'monitored' | 'mitigated' | 'resolved',
        relatedTasks: []
      }));
    } catch (error) {
      console.error('Error fetching risks:', error);
      return [];
    }
  }

  private static async transformResources(projectId: string): Promise<ProjectResource[]> {
    try {
      const [materialsResult, employeesResult] = await Promise.all([
        supabase.from('materials').select('*').eq('workspace_id', projectId),
        supabase.from('employees').select('*').eq('is_active', true)
      ]);

      const resources: ProjectResource[] = [];

      (materialsResult.data || []).forEach(material => {
        resources.push({
          id: material.id,
          name: material.name,
          type: 'material',
          availability: material.available_quantity || 1,
          assignedTasks: []
        });
      });

      (employeesResult.data || []).forEach(employee => {
        resources.push({
          id: employee.id,
          name: employee.full_name,
          type: 'human',
          skills: Array.isArray(employee.skills) ? employee.skills : [],
          costPerHour: employee.salary ? employee.salary / 160 : undefined,
          availability: 1,
          assignedTasks: []
        });
      });

      return resources;
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  private static async fetchPayments(projectId: string) {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching payments:', error);
        return [];
      }

      return payments || [];
    } catch (error) {
      console.error('Error in fetchPayments:', error);
      return [];
    }
  }

  private static transformInspections(inspections: any[]): Inspection[] {
    return inspections.map(inspection => ({
      id: inspection.id,
      project_id: inspection.project_id,
      inspector: inspection.inspector,
      date: inspection.date,
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection,
      comments: inspection.comments,
      created_at: inspection.created_at,
      updated_at: inspection.updated_at,
      phase_id: inspection.phase_id,
      documents: inspection.documents || [],
      issues: inspection.issues || []
    }));
  }

  // ---------------- Helper Methods ----------------

  private static calculateOverallProgress(tasks: Task[]): number {
    if (!tasks || tasks.length === 0) return 0;
    const total = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(total / tasks.length);
  }

  private static determineCurrentPhase(phases: any[]) {
    if (!phases || phases.length === 0) return { phase: null, stage: null };
    const ongoing = phases.find(p => !p.completed);
    if (!ongoing) return { phase: phases[phases.length - 1].name, stage: 'completed' };
    return { phase: ongoing.name, stage: ongoing.currentStage || null };
  }

  private static generateMilestonesFromPhases(phases: any[]) {
    return (phases || []).flatMap(phase => phase.milestones || []);
  }

  private static generateGanttChart(tasks: Task[]): GanttChartData {
    if (!tasks || tasks.length === 0) {
      return { tasks: [], dependencies: [] };
    }

    const ganttTasks: GanttTask[] = tasks.map(task => {
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);
      const duration = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        id: task.id,
        text: task.name,
        start_date: task.startDate,
        duration,
        progress: (task.progress || 0) / 100,
        color: this.getTaskColor(task)
      };
    });

    const ganttDependencies: GanttDependency[] = tasks.flatMap(task =>
      (task.dependencies || []).map(depId => ({
        id: `dep-${task.id}-${depId}`,
        source: depId,
        target: task.id,
        type: "0" // Fin à Début
      }))
    );

    return {
      tasks: ganttTasks,
      dependencies: ganttDependencies
    };
  }

  private static getTaskColor(task: Task): string {
    switch (task.status) {
      case "completed":
        return "#4CAF50"; // Vert
      case "in_progress":
        return "#2196F3"; // Bleu
      case "delayed":
        return "#F44336"; // Rouge
      default:
        return "#9E9E9E"; // Gris
    }
  }

  private static calculateResourceAllocation(tasks: Task[], resources: ProjectResource[]) {
    return resources.map(resource => ({
      resourceId: resource.id,
      assignedTasks: tasks.filter(t => t.assignedTo.includes(resource.id)).map(t => t.id)
    }));
  }

  private static async fetchProjectPhases(projectId: string): Promise<any[]> {
    try {
      console.log('🔍 fetchProjectPhases for:', projectId);
      const { data: phases, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });

      if (error) {
        console.error('❌ Error fetching project phases:', error);
        return [];
      }

      console.log('🔍 Project phases query result:', phases?.length || 0, 'phases');
      return phases || [];
    } catch (error) {
      console.error('Error in fetchProjectPhases:', error);
      return [];
    }
  }

  private static calculateCostAnalysis(tasks: Task[], phases: any[], budget: number) {
    const estimatedCost = tasks.reduce((sum, t) => sum + (t.costEstimate || 0), 0);
    const actualExpenses = phases.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    return {
      budget,
      estimatedCost,
      actualExpenses,
      variance: budget - actualExpenses
    };
  }
}