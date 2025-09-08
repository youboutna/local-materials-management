// services/projectDataTransformer.ts
import { ProjectData, ConstructionPhase, ConstructionStage, Task, ProjectRisk, ProjectResource, PERTAnalysis, GanttChartData } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';

export class ProjectDataTransformer {
  /**
   * Transform raw database data into enriched ProjectData object with enhanced planning data
   */
  static async transformProjectData(projectId: string): Promise<ProjectData | null> {
    try {
      console.log(`Transforming project data for project ID: ${projectId}`);
      
      // Fetch project base data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        return null;
      }

      if (!project) {
        console.error('Project not found');
        return null;
      }

      // Fetch all related data in parallel
      const [
        phasesData,
        tasksData,
        risksData,
        resourcesData,
        inspectionsData,
        insuranceData,
        taskAssignmentsData,
        contactsData,
        dependenciesData
      ] = await Promise.all([
        this.fetchProjectPhases(projectId),
        this.fetchProjectTasks(projectId),
        this.fetchProjectRisks(projectId),
        this.fetchProjectResources(projectId),
        this.fetchProjectInspections(projectId),
        this.fetchInsurancePolicies(projectId),
        this.fetchTaskAssignments(projectId),
        this.fetchProjectContacts(projectId),
        this.fetchTaskDependencies(projectId)
      ]);

      // Calculate current phase and stage based on progress
      const currentPhaseInfo = this.determineCurrentPhase(phasesData);
      
      // Generate milestones from phases and stages
      const milestones = this.generateMilestonesFromPhases(phasesData);
      
      // Combine tasks from different sources with enhanced dependencies
      const combinedTasks = this.combineTasksWithDependencies(
        tasksData, 
        taskAssignmentsData, 
        phasesData,
        dependenciesData
      );
      
       const paymentsData = this.fetchPayments(projectId);
      // Calculate project progress based on phases
      const overallProgress = this.calculateOverallProgress(phasesData);
      
      // Calculate PERT and critical path analysis
      const pertAnalysis = this.calculatePERTAnalysis(combinedTasks);
      
      // Generate Gantt chart data
      const ganttChart = this.generateGanttChart(phasesData, combinedTasks);
      
      // Calculate resource allocation and leveling
      const resourceAllocation = this.calculateResourceAllocation(combinedTasks, resourcesData);
      
      // Calculate cost tracking and forecasting
      const costAnalysis = this.calculateCostAnalysis(combinedTasks, phasesData, project.budget);

      // Transform to ProjectData format
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        location: project.location,
        status: project.status,
        progress: overallProgress,
        budget: project.budget,
        startDate: project.start_date,
        endDate: project.end_date,
        thumbnail: project.thumbnail,
        teamSize: project.team_size,
        coordinates: project.coordinates,
        financingSource: project.financing_source,
        marketType: project.market_type,
        selectionMode: project.selection_mode,
        launchDate: project.launch_date,
        attributionDate: project.attribution_date,
        allowsInitialPayment: project.allows_initial_payment,
        initialPaymentPercentage: project.initial_payment_percentage,
        currentPhase: currentPhaseInfo.phase,
        currentStage: currentPhaseInfo.stage,
        plannedPhases: this.transformPhases(phasesData),
        constructionMilestones: milestones,
        tasks: combinedTasks,
        risks: risksData,
        resources: resourcesData,
        insurancePolicies: insuranceData,
        inspections: inspectionsData,
        expenses:paymentsData,
        methodology: project.methodology || 'waterfall',
        contacts: contactsData,
        escalationThresholds: project.escalation_thresholds,
        checkScheduleLastRun: project.check_schedule_last_run || {},
        // Enhanced planning data
        pertAnalysis,
        ganttChart,
        resourceAllocation,
        costAnalysis,
        criticalPath: pertAnalysis.criticalPath,
        // Add baseline tracking
        baseline: {
          startDate: project.start_date,
          endDate: project.end_date,
          budget: project.budget,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error transforming project data:', error);
      return null;
    }
  }

  /**
   * Fetch project phases with their stages
   */
  private static async fetchProjectPhases(projectId: string): Promise<any[]> {
    const { data: phases, error } = await supabase
      .from('project_phases')
      .select(`
        *,
        phase_stages(*),
        project_materials(
          material_id, 
          quantity, 
          materials(name, price_per_unit)
        ),
        phase_employees(*, employees(full_name, position))
      `)
      .eq('project_id', projectId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching project phases:', error);
      return [];
    }
    return phases;
  }

  /**
   * Fetch project tasks
   */
  private static async fetchProjectTasks(projectId: string): Promise<any[]> {
    const { data: tasks, error } = await supabase
      .from('project_tasks')
      .select(`
        *,
        task_dependencies(dependency_id),
        assigned_resources(resource_id)
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching project tasks:', error);
      return [];
    }
    return tasks;
  }

  /**
   * Fetch task dependencies
   */
  private static async fetchTaskDependencies(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('task_dependencies')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching task dependencies:', error);
      return [];
    }
    return data;
  }

  /**
   * Fetch task assignments
   */
  private static async fetchTaskAssignments(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('task_assignments')
      .select(`
        *,
        assigned_to:profiles(full_name),
        assigned_by:profiles(full_name)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task assignments:', error);
      return [];
    }
    return data;
  }

  /**
   * Fetch project risks from the database
   */
  private static async fetchProjectRisks(projectId: string): Promise<ProjectRisk[]> {
    try {
      const { data: risks, error } = await supabase
        .from('project_risks')
        .select(`
          *,
          related_tasks:risk_tasks(task_id)
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching project risks:', error);
        return [];
      }

      return risks.map(risk => ({
        id: risk.id,
        title: risk.title,
        description: risk.description,
        probability: risk.probability,
        impact: risk.impact,
        mitigationPlan: risk.mitigation_plan,
        status: risk.status as 'identified' | 'monitored' | 'mitigated' | 'resolved',
        relatedTasks: risk.related_tasks?.map((rt: any) => rt.task_id) || []
      }));
    } catch (error) {
      console.error('Error in fetchProjectRisks:', error);
      return [];
    }
  }

  /**
   * Fetch project resources from the database
   */
  private static async fetchProjectResources(projectId: string): Promise<ProjectResource[]> {
    try {
      const { data: resources, error } = await supabase
        .from('project_resources')
        .select(`
          *,
          assigned_tasks:resource_tasks(task_id)
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching project resources:', error);
        return [];
      }

      return resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        type: resource.type as 'human' | 'equipment' | 'material',
        skills: resource.skills || [],
        costPerHour: resource.cost_per_hour,
        availability: resource.availability,
        assignedTasks: resource.assigned_tasks?.map((at: any) => at.task_id) || []
      }));
    } catch (error) {
      console.error('Error in fetchProjectResources:', error);
      return [];
    }
  }

  /**
   * Fetch project inspections from the database
   */
  private static async fetchProjectInspections(projectId: string): Promise<any[]> {
    try {
      const { data: inspections, error } = await supabase
        .from('project_inspections')
        .select(`
          *,
          inspection_issues(*)
        `)
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching project inspections:', error);
        return [];
      }

      return inspections.map(inspection => ({
        id: inspection.id,
        inspector: inspection.inspector,
        date: inspection.date,
        status: inspection.status,
        progressAtInspection: inspection.progress_at_inspection,
        issues: inspection.inspection_issues?.map((issue: any) => ({
          id: issue.id,
          description: issue.description,
          severity: issue.severity,
          status: issue.status
        })) || []
      }));
    } catch (error) {
      console.error('Error in fetchProjectInspections:', error);
      return [];
    }
  }

  /**
   * Fetch insurance policies from the database
   */
  private static async fetchInsurancePolicies(projectId: string): Promise<any[]> {
    try {
      const { data: policies, error } = await supabase
        .from('insurance_policies')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching insurance policies:', error);
        return [];
      }

      return policies.map(policy => ({
        id: policy.id,
        type: policy.type,
        reference: policy.reference,
        issuer: policy.issuer,
        startDate: policy.start_date,
        endDate: policy.end_date,
        amount: policy.amount,
        coverage: policy.coverage,
        status: policy.status
      }));
    } catch (error) {
      console.error('Error in fetchInsurancePolicies:', error);
      return [];
    }
  }

  /**
   * Fetch project contacts from the database
   */
  private static async fetchProjectContacts(projectId: string): Promise<any[]> {
    try {
      const { data: contacts, error } = await supabase
        .from('project_contacts')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching project contacts:', error);
        return [];
      }

      return contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        isPrimary: contact.is_primary
      }));
    } catch (error) {
      console.error('Error in fetchProjectContacts:', error);
      return [];
    }
  }

  /**
   * Determine current phase and stage based on progress
   */
  private static determineCurrentPhase(phases: any[]): { phase: ConstructionPhase; stage: ConstructionStage } {
    const currentDate = new Date();
    let currentPhase: ConstructionPhase = 'pre_construction';
    let currentStage: ConstructionStage = 'planning_design';

    for (const phase of phases) {
      const startDate = new Date(phase.start_date);
      const endDate = new Date(phase.end_date);
      
      if (currentDate >= startDate && currentDate <= endDate) {
        currentPhase = phase.phase_name as ConstructionPhase;
        
        // Find current stage within phase
        if (phase.phase_stages && phase.phase_stages.length > 0) {
          const currentStageObj = phase.phase_stages.find((stage: any) => 
            currentDate >= new Date(stage.start_date) && 
            currentDate <= new Date(stage.end_date)
          );
          
          if (currentStageObj) {
            currentStage = currentStageObj.stage_name as ConstructionStage;
          }
        }
        break;
      }
    }

    return { phase: currentPhase, stage: currentStage };
  }

  /**
   * Transform phases data to standardized format
   */
  private static transformPhases(phases: any[]): any[] {
    return phases.map(phase => ({
      id: phase.id,
      phase: phase.phase_name,
      startDate: phase.start_date,
      endDate: phase.end_date,
      estimatedDuration: phase.estimated_duration,
      status: phase.status,
      progress: phase.progress,
      budget: phase.budget,
      actualCost: phase.actual_cost,
      weight: phase.weight || this.calculatePhaseWeight(phase),
      stages: phase.phase_stages?.map((stage: any) => ({
        id: stage.id,
        name: stage.stage_name,
        startDate: stage.start_date,
        endDate: stage.end_date,
        status: stage.status,
        progress: stage.progress,
        weight: stage.weight || this.calculateStageWeight(stage, phase)
      })) || [],
      materials: phase.project_materials?.map((pm: any) => ({
        materialId: pm.material_id,
        name: pm.materials?.name,
        quantity: pm.quantity,
        pricePerUnit: pm.materials?.price_per_unit
      })) || [],
      humanResources: phase.phase_employees?.map((pe: any) => ({
        employeeId: pe.employee_id,
        name: pe.employees?.full_name,
        position: pe.employees?.position,
        role: pe.role,
        startDate: pe.start_date,
        endDate: pe.end_date,
        dailyRate: pe.daily_rate
      })) || []
    }));
  }

  /**
   * Generate milestones from phase stages
   */
  private static generateMilestonesFromPhases(phases: any[]): any[] {
    const milestones: any[] = [];
    
    phases.forEach(phase => {
      // Add phase completion as a milestone
      milestones.push({
        id: `phase-${phase.id}-completion`,
        title: `Completion of ${phase.phase_name}`,
        phase: phase.phase_name,
        stage: 'completion',
        targetDate: phase.end_date,
        status: phase.status === 'completed' ? 'completed' : 'pending',
        weight: phase.weight || 0.2
      });
      
      // Add stage completions as milestones
      phase.phase_stages?.forEach((stage: any) => {
        milestones.push({
          id: `stage-${stage.id}-completion`,
          title: `Completion of ${stage.stage_name}`,
          phase: phase.phase_name,
          stage: stage.stage_name,
          targetDate: stage.end_date,
          status: stage.status === 'completed' ? 'completed' : 'pending',
          weight: (phase.weight || 0.2) * 0.3
        });
      });
    });
    
    return milestones;
  }

  /**
   * Combine tasks with enhanced dependency handling
   */
  private static combineTasksWithDependencies(
    projectTasks: any[], 
    taskAssignments: any[], 
    phases: any[],
    dependenciesData: any[]
  ): Task[] {
    const tasksFromPhases = this.extractTasksFromPhases(phases);
    const tasksFromAssignments = this.transformTaskAssignments(taskAssignments, phases);
    const tasksFromProject = this.transformProjectTasks(projectTasks, phases);
    
    // Merge tasks, prioritizing project tasks over others
    const taskMap = new Map<string, Task>();
    
    // Add tasks from all sources
    [...tasksFromPhases, ...tasksFromAssignments, ...tasksFromProject].forEach(task => {
      taskMap.set(task.id, task);
    });
    
    // Enhance with dependency data
    dependenciesData.forEach(dep => {
      const task = taskMap.get(dep.task_id);
      if (task) {
        if (!task.dependencies.includes(dep.depends_on_id)) {
          task.dependencies.push(dep.depends_on_id);
        }
      }
    });
    
    // Calculate float and critical path for each task
    return this.calculateTaskFloatAndCriticalPath(Array.from(taskMap.values()));
  }

  /**
   * Extract tasks from phase stages
   */
  private static extractTasksFromPhases(phases: any[]): Task[] {
    const tasks: Task[] = [];
    
    phases.forEach(phase => {
      phase.phase_stages?.forEach((stage: any) => {
        // Create a task for each stage
        tasks.push({
          id: `stage-task-${stage.id}`,
          name: stage.stage_name,
          description: `Complete ${stage.stage_name} stage for ${phase.phase_name} phase`,
          phaseId: phase.id,
          dependencies: this.calculateStageDependencies(phase, stage, phases),
          assignedTo: [],
          estimatedDuration: this.calculateDaysDifference(stage.start_date, stage.end_date),
          actualDuration: 0,
          startDate: stage.start_date,
          endDate: stage.end_date,
          status: this.mapTaskStatus(stage.status),
          progress: stage.progress || 0,
          weight: stage.weight || 0.1,
          costEstimate: 0,
          actualCost: 0
        });
      });
    });
    
    return tasks;
  }

  /**
   * Calculate dependencies between stages
   */
  private static calculateStageDependencies(phase: any, stage: any, phases: any[]): string[] {
    const dependencies: string[] = [];
    const stageIndex = phase.phase_stages.findIndex((s: any) => s.id === stage.id);
    
    // Previous stage in the same phase is a dependency
    if (stageIndex > 0) {
      const prevStage = phase.phase_stages[stageIndex - 1];
      dependencies.push(`stage-task-${prevStage.id}`);
    }
    
    // Check for cross-phase dependencies
    if (stageIndex === 0) {
      // First stage of a phase might depend on last stage of previous phase
      const phaseIndex = phases.findIndex(p => p.id === phase.id);
      if (phaseIndex > 0) {
        const prevPhase = phases[phaseIndex - 1];
        if (prevPhase.phase_stages && prevPhase.phase_stages.length > 0) {
          const lastStage = prevPhase.phase_stages[prevPhase.phase_stages.length - 1];
          dependencies.push(`stage-task-${lastStage.id}`);
        }
      }
    }
    
    return dependencies;
  }

  /**
   * Transform task assignments to Task format
   */
  private static transformTaskAssignments(taskAssignments: any[], phases: any[]): Task[] {
    return taskAssignments.map(assignment => {
      // Try to find which phase this task belongs to
      let phaseId = '';
      if (assignment.phase_id) {
        phaseId = assignment.phase_id;
      } else {
        // Try to infer phase based on due date
        const dueDate = new Date(assignment.due_date);
        for (const phase of phases) {
          const phaseStart = new Date(phase.start_date);
          const phaseEnd = new Date(phase.end_date);
          if (dueDate >= phaseStart && dueDate <= phaseEnd) {
            phaseId = phase.id;
            break;
          }
        }
      }

      // Calculate progress based on status
      let progress = 0;
      switch (assignment.status) {
        case 'completed':
          progress = 100;
          break;
        case 'in_progress':
          progress = assignment.completion_percentage || 50;
          break;
        default:
          progress = 0;
      }

      return {
        id: assignment.id,
        name: assignment.title,
        description: assignment.description,
        phaseId: phaseId,
        dependencies: [], // Could be extracted from a relations table
        assignedTo: assignment.assigned_to ? [assignment.assigned_to.id || assignment.assigned_to] : [],
        estimatedDuration: this.calculateDaysDifference(assignment.created_at, assignment.due_date),
        actualDuration: 0, // Calculate based on status and dates
        startDate: assignment.created_at,
        endDate: assignment.due_date,
        status: this.mapTaskStatus(assignment.status),
        progress: progress,
        weight: this.calculateTaskWeight(assignment.priority),
        costEstimate: assignment.cost_estimate || 0,
        actualCost: assignment.actual_cost || 0,
        notes: assignment.notes,
        priority: assignment.priority
      };
    });
  }

  /**
   * Transform project tasks to Task format
   */
  private static transformProjectTasks(projectTasks: any[], phases: any[]): Task[] {
    return projectTasks.map(task => {
      // Try to find which phase this task belongs to
      let phaseId = task.phase_id || '';
      if (!phaseId) {
        // Try to infer phase based on start date
        const startDate = new Date(task.start_date);
        for (const phase of phases) {
          const phaseStart = new Date(phase.start_date);
          const phaseEnd = new Date(phase.end_date);
          if (startDate >= phaseStart && startDate <= phaseEnd) {
            phaseId = phase.id;
            break;
          }
        }
      }

      return {
        id: task.id,
        name: task.name,
        description: task.description,
        phaseId: phaseId,
        dependencies: task.task_dependencies?.map((td: any) => td.dependency_id) || [],
        assignedTo: task.assigned_resources?.map((ar: any) => ar.resource_id) || [],
        estimatedDuration: task.estimated_duration,
        actualDuration: task.actual_duration,
        startDate: task.start_date,
        endDate: task.end_date,
        status: this.mapTaskStatus(task.status),
        progress: task.progress,
        weight: task.weight,
        costEstimate: task.cost_estimate,
        actualCost: task.actual_cost,
        optimisticEstimate: task.optimistic_estimate,
        pessimisticEstimate: task.pessimistic_estimate
      };
    });
  }

  /**
   * Calculate task float and critical path
   */
  private static calculateTaskFloatAndCriticalPath(tasks: Task[]): Task[] {
    // First, calculate early start and early finish for each task
    const taskMap = new Map(tasks.map(task => [task.id, task]));
    
    // Forward pass: Calculate early start and early finish
    const calculateEarlyDates = (taskId: string, visited: Set<string> = new Set()) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      
      const task = taskMap.get(taskId);
      if (!task) return;
      
      let earlyStart = new Date(task.startDate).getTime();
      
      // If task has dependencies, calculate based on dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        let maxEarlyFinish = 0;
        
        for (const depId of task.dependencies) {
          const depTask = taskMap.get(depId);
          if (depTask) {
            calculateEarlyDates(depId, visited);
            const depEarlyFinish = new Date(depTask.endDate).getTime();
            if (depEarlyFinish > maxEarlyFinish) {
              maxEarlyFinish = depEarlyFinish;
            }
          }
        }
        
        earlyStart = maxEarlyFinish;
      }
      
      const earlyFinish = earlyStart + (task.estimatedDuration * 24 * 60 * 60 * 1000);
      
      // Update task with calculated dates
      task.startDate = new Date(earlyStart).toISOString();
      task.endDate = new Date(earlyFinish).toISOString();
    };
    
    // Start with tasks that have no dependencies
    tasks.filter(task => task.dependencies.length === 0).forEach(task => {
      calculateEarlyDates(task.id);
    });
    
    // Backward pass: Calculate late start and late finish
    const calculateLateDates = (taskId: string, visited: Set<string> = new Set()) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      
      const task = taskMap.get(taskId);
      if (!task) return;
      
      let lateFinish = new Date(task.endDate).getTime();
      
      // Find tasks that depend on this task
      const dependentTasks = tasks.filter(t => t.dependencies.includes(taskId));
      
      if (dependentTasks.length > 0) {
        let minLateStart = Infinity;
        
        for (const depTask of dependentTasks) {
          calculateLateDates(depTask.id, visited);
          const depLateStart = new Date(depTask.startDate).getTime();
          if (depLateStart < minLateStart) {
            minLateStart = depLateStart;
          }
        }
        
        lateFinish = minLateStart;
      }
      
      const lateStart = lateFinish - (task.estimatedDuration * 24 * 60 * 60 * 1000);
      
      // Calculate float (slack time)
      const earlyStart = new Date(task.startDate).getTime();
      const float = (lateStart - earlyStart) / (24 * 60 * 60 * 1000);
      
      // Update task with calculated float
      task.float = Math.max(0, float);
      task.criticalPath = task.float === 0;
    };
    
    // Start with tasks that have no dependents
    const taskDependents = new Map();
    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        if (!taskDependents.has(depId)) {
          taskDependents.set(depId, []);
        }
        taskDependents.get(depId).push(task.id);
      });
    });
    
    tasks.filter(task => !taskDependents.has(task.id)).forEach(task => {
      calculateLateDates(task.id);
    });
    
    return Array.from(taskMap.values());
  }

  /**
   * Calculate resource allocation and leveling
   */
  private static calculateResourceAllocation(tasks: Task[], resources: ProjectResource[]): any {
    const resourceMap = new Map<string, { allocated: number, capacity: number }>();
    
    // Initialize resource map
    resources.forEach(resource => {
      resourceMap.set(resource.id, {
        allocated: 0,
        capacity: resource.availability * resource.costPerHour
      });
    });
    
    // Calculate resource allocation
    tasks.forEach(task => {
      task.assignedTo.forEach(resourceId => {
        const resource = resourceMap.get(resourceId);
        if (resource) {
          // Simple allocation calculation based on task weight
          resource.allocated += (task.weight || 0.5) * resource.capacity;
        }
      });
    });
    
    // Calculate utilization percentages
    const resourceUtilization = Array.from(resourceMap.entries()).map(([id, data]) => ({
      resourceId: id,
      allocated: data.allocated,
      capacity: data.capacity,
      utilization: data.capacity > 0 ? (data.allocated / data.capacity) * 100 : 0
    }));
    
    // Identify overallocated resources
    const overallocatedResources = resourceUtilization.filter(r => r.utilization > 100);
    
    return {
      resourceUtilization,
      overallocatedResources,
      summary: {
        totalCapacity: resourceUtilization.reduce((sum, r) => sum + r.capacity, 0),
        totalAllocated: resourceUtilization.reduce((sum, r) => sum + r.allocated, 0),
        overallUtilization: resourceUtilization.reduce((sum, r) => sum + r.utilization, 0) / resourceUtilization.length
      }
    };
  }

  /**
   * Calculate cost tracking and forecasting
   */
  private static calculateCostAnalysis(tasks: Task[], phases: any[], budget: number): any {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
    
    const actualCost = completedTasks.reduce((sum, task) => sum + (task.actualCost || 0), 0);
    const estimatedCost = tasks.reduce((sum, task) => sum + (task.costEstimate || 0), 0);
    
    // Calculate cost variance
    const costVariance = actualCost - estimatedCost;
    const costVariancePercentage = estimatedCost > 0 ? (costVariance / estimatedCost) * 100 : 0;
    
    // Calculate earned value
    const earnedValue = completedTasks.reduce((sum, task) => sum + (task.costEstimate || 0), 0) +
      inProgressTasks.reduce((sum, task) => sum + (task.costEstimate || 0) * (task.progress / 100), 0);
    
    // Calculate cost performance index
    const costPerformanceIndex = actualCost > 0 ? earnedValue / actualCost : 0;
    
    // Forecast final cost
    const forecastFinalCost = costPerformanceIndex > 0 ? estimatedCost / costPerformanceIndex : estimatedCost;
    
    // Calculate estimate at completion
    const estimateAtCompletion = forecastFinalCost;
    
    return {
      actualCost,
      estimatedCost,
      costVariance,
      costVariancePercentage,
      earnedValue,
      costPerformanceIndex,
      estimateAtCompletion,
      forecastFinalCost,
      budgetRemaining: budget - actualCost,
      budgetVariance: budget - estimateAtCompletion
    };
  }

  /**
   * Enhanced PERT analysis with critical path calculation
   */
  private static calculatePERTAnalysis(tasks: Task[]): PERTAnalysis {
    const pertTasks = tasks.map(task => {
      const optimistic = task.optimisticEstimate || task.estimatedDuration * 0.8;
      const pessimistic = task.pessimisticEstimate || task.estimatedDuration * 1.2;
      const expected = (optimistic + 4 * task.estimatedDuration + pessimistic) / 6;
      const variance = Math.pow((pessimistic - optimistic) / 6, 2);
      const standardDeviation = Math.sqrt(variance);
      
      return {
        id: task.id,
        name: task.name,
        optimistic,
        pessimistic,
        expected,
        variance,
        standardDeviation,
        zScore: 0 // Will be calculated later if needed
      };
    });
    
    // Calculate critical path using the enhanced task data with float
    const criticalPath = tasks.filter(task => task.criticalPath).map(task => task.id);
    
    // Calculate project duration statistics
    const criticalPathTasks = tasks.filter(task => criticalPath.includes(task.id));
    const totalOptimistic = criticalPathTasks.reduce((sum, task) => {
      return sum + (task.optimisticEstimate || task.estimatedDuration * 0.8);
    }, 0);
    
    const totalPessimistic = criticalPathTasks.reduce((sum, task) => {
      return sum + (task.pessimisticEstimate || task.estimatedDuration * 1.2);
    }, 0);
    
    const totalExpected = criticalPathTasks.reduce((sum, task) => {
      const optimistic = task.optimisticEstimate || task.estimatedDuration * 0.8;
      const pessimistic = task.pessimisticEstimate || task.estimatedDuration * 1.2;
      return sum + (optimistic + 4 * task.estimatedDuration + pessimistic) / 6;
    }, 0);
    
    const totalVariance = criticalPathTasks.reduce((sum, task) => {
      const optimistic = task.optimisticEstimate || task.estimatedDuration * 0.8;
      const pessimistic = task.pessimisticEstimate || task.estimatedDuration * 1.2;
      return sum + Math.pow((pessimistic - optimistic) / 6, 2);
    }, 0);
    
    return {
      tasks: pertTasks,
      criticalPath,
      totalDuration: totalExpected,
      totalOptimistic,
      totalPessimistic,
      totalVariance,
      confidenceInterval: {
        lower: totalExpected - 2 * Math.sqrt(totalVariance),
        upper: totalExpected + 2 * Math.sqrt(totalVariance)
      }
    };
  }

  /**
   * Enhanced Gantt chart generation with dependencies
   */
  private static generateGanttChart(phases: any[], tasks: Task[]): GanttChartData {
    const ganttData: GanttChartData = {
      phases: [],
      tasks: [],
      dependencies: [],
      milestones: []
    };
    
    // Add phases to Gantt chart
    phases.forEach(phase => {
      ganttData.phases.push({
        id: phase.id,
        name: phase.phase_name,
        start: phase.start_date,
        end: phase.end_date,
        progress: phase.progress,
        color: this.getPhaseColor(phase.phase_name)
      });
    });
    
    // Add tasks to Gantt chart
    tasks.forEach(task => {
      ganttData.tasks.push({
        id: task.id,
        name: task.name,
        start: task.startDate,
        end: task.endDate,
        progress: task.progress,
        dependencies: task.dependencies,
        color: task.criticalPath ? '#ef4444' : '#3b82f6',
        float: task.float || 0
      });
      
      // Add task dependencies
      task.dependencies.forEach(depId => {
        ganttData.dependencies.push({
          id: `${task.id}-${depId}`,
          from: depId,
          to: task.id,
          type: 'finish_to_start'
        });
      });
    });
    
    // Add milestones
    phases.forEach(phase => {
      ganttData.milestones.push({
        id: `milestone-${phase.id}-start`,
        name: `Start of ${phase.phase_name}`,
        date: phase.start_date,
        color: '#10b981'
      });
      
      ganttData.milestones.push({
        id: `milestone-${phase.id}-end`,
        name: `End of ${phase.phase_name}`,
        date: phase.end_date,
        color: '#f59e0b'
      });
    });
    
    return ganttData;
  }

  /**
   * Helper to get color for phase
   */
  private static getPhaseColor(phase: string): string {
    const colorMap: Record<string, string> = {
      'pre_construction': '#3b82f6',
      'site_preparation': '#8b5cf6',
      'structural_work': '#ef4444',
      'finishing': '#f59e0b',
      'handover': '#10b981'
    };
    
    return colorMap[phase] || '#94a3b8';
  }

    /**
   * Fetch payments for the project
   */
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
  /**
   * Calculate overall project progress based on phases
   */
  private static calculateOverallProgress(phases: any[]): number {
    if (!phases || phases.length === 0) return 0;
    
    const totalWeight = phases.reduce((sum, phase) => sum + (phase.weight || 1), 0);
    const weightedProgress = phases.reduce((sum, phase) => 
      sum + (phase.progress || 0) * (phase.weight || 1), 0);
    
    return totalWeight > 0 ? weightedProgress / totalWeight : 0;
  }

  /**
   * Calculate phase weight based on estimated duration and budget
   */
  private static calculatePhaseWeight(phase: any): number {
    const durationWeight = phase.estimated_duration / 365; // Normalize by year
    const budgetWeight = phase.budget / 1000000; // Normalize by million
    return (durationWeight + budgetWeight) / 2;
  }

  /**
   * Calculate stage weight within a phase
   */
  private static calculateStageWeight(stage: any, phase: any): number {
    const phaseDuration = this.calculateDaysDifference(phase.start_date, phase.end_date);
    const stageDuration = this.calculateDaysDifference(stage.start_date, stage.end_date);
    return stageDuration / phaseDuration;
  }

  /**
   * Calculate task weight based on priority
   */
  private static calculateTaskWeight(priority: string): number {
    switch (priority) {
      case 'high': return 0.7;
      case 'medium': return 0.5;
      case 'low': return 0.3;
      default: return 0.5;
    }
  }

  /**
   * Calculate days difference between two dates
   */
  private static calculateDaysDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Map task status to standardized format
   */
  private static mapTaskStatus(status: string): 'completed' | 'in_progress' | 'not_started' | 'delayed' {
    switch (status) {
      case 'completed': return 'completed';
      case 'in_progress': return 'in_progress';
      case 'delayed': return 'delayed';
      default: return 'not_started';
    }
  }

  /**
   * Enhanced error handling for fetch methods
   */
  private static async fetchWithErrorHandling<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    errorMessage: string
  ): Promise<T | null> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        console.error(`${errorMessage}:`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      return null;
    }
  }
}