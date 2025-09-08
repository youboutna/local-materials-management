import { supabase } from '@/integrations/supabase/client';
import { ProjectData, ProjectStatus, ProjectRisk, ProjectResource, Inspection, InsurancePolicy } from '@/types/project';

export class ProjectDataTransformer {
  /**
   * Transform project data from Supabase to ProjectData format
   */
  static async transformProjectData(projectId: string): Promise<ProjectData | null> {
    try {
      // Fetch main project data
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        console.error('Error fetching project:', projectError);
        return null;
      }

      // Fetch phases data
      const phasesData = await this.fetchProjectPhases(projectId);
      
      // Fetch additional data from existing tables
      const inspectionsData = await this.fetchInspections(projectId);
      const paymentsData = await this.fetchPayments(projectId);
      
      // Calculate milestones from phases
      const milestones = this.generateMilestonesFromPhases(phasesData);
      
      // Get current phase info
      const currentPhaseInfo = this.getCurrentPhaseInfo(phasesData);
      
      // Calculate overall progress
      const overallProgress = this.calculateOverallProgress(phasesData);
      
      // Transform to ProjectData format
      return {
        id: project.id,
        title: project.title,
        description: project.description || '',
        location: project.location || '',
        status: project.status as any,
        progress: overallProgress,
        budget: project.budget || 0,
        startDate: project.start_date || '',
        endDate: project.end_date || '',
        thumbnail: project.thumbnail || '',
        teamSize: project.team_size || 1,
        coordinates: (project as any).coordinates || undefined,
        financingSource: project.financing_source || undefined,
        marketType: project.market_type || undefined,
        selectionMode: project.selection_mode || undefined,
        launchDate: project.launch_date || undefined,
        attributionDate: project.attribution_date || undefined,
        allowsInitialPayment: project.allows_initial_payment || undefined,
        initialPaymentPercentage: project.initial_payment_percentage || undefined,
        currentPhase: currentPhaseInfo.phase,
        currentStage: currentPhaseInfo.stage,
        plannedPhases: this.transformPhases(phasesData),
        constructionMilestones: milestones,
        tasks: [], // Will be extracted from phases
        risks: [], // Placeholder for future implementation
        resources: [], // Placeholder for future implementation
        insurancePolicies: [], // Placeholder for future implementation
        inspections: inspectionsData,
        methodology: (project as any).methodology || 'waterfall',
        contacts: [], // Placeholder for future implementation
        escalationThresholds: (project as any).escalation_thresholds || undefined,
        checkScheduleLastRun: (project as any).check_schedule_last_run || undefined,
        // Calculate PERT and Gantt data
        pertAnalysis: this.calculatePERTAnalysis([]),
        ganttChart: this.generateGanttChart(phasesData, [])
      };
    } catch (error) {
      console.error('Error transforming project data:', error);
      return null;
    }
  }

  /**
   * Fetch project phases with their stages
   */
  private static async fetchProjectPhases(projectId: string) {
    try {
      const { data: phases, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_order');

      if (error) {
        console.error('Error fetching phases:', error);
        return [];
      }

      return phases || [];
    } catch (error) {
      console.error('Error in fetchProjectPhases:', error);
      return [];
    }
  }

  /**
   * Fetch inspections for the project
   */
  private static async fetchInspections(projectId: string): Promise<Inspection[]> {
    try {
      const { data: inspections, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching inspections:', error);
        return [];
      }

      return inspections?.map(inspection => ({
        id: inspection.id,
        project_id: inspection.project_id,
        inspector: inspection.inspector,
        date: inspection.date,
        status: inspection.status as Inspection['status'],
        progress_at_inspection: inspection.progress_at_inspection,
        progressAtInspection: inspection.progress_at_inspection,
        comments: inspection.comments || '',
        documents: (inspection.documents as any) || {},
        created_at: inspection.created_at,
        updated_at: inspection.updated_at
      })) || [];
    } catch (error) {
      console.error('Error in fetchInspections:', error);
      return [];
    }
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
   * Transform phases data into structured format
   */
  private static transformPhases(phases: any[]) {
    return phases.map(phase => ({
      id: phase.id,
      phase: phase.construction_phase || 'Unnamed Phase',
      status: phase.status || 'not_started',
      progress: phase.progress_percentage || 0,
      startDate: phase.start_date || '',
      endDate: phase.end_date || '',
      estimatedDuration: phase.estimated_duration || 0,
      weight: phase.weight || 1,
      budget: phase.budget || 0,
      actualCost: phase.actual_cost || 0,
      description: phase.description || '',
      customPhaseData: phase.custom_phase_data || {},
      // Extract stages from custom data
      stages: this.extractStagesFromPhase(phase),
      // Extract materials and resources from custom data
      materials: this.extractMaterialsFromPhase(phase),
      humanResources: this.extractResourcesFromPhase(phase)
    }));
  }

  /**
   * Extract stages from phase custom data
   */
  private static extractStagesFromPhase(phase: any) {
    const customData = phase.custom_phase_data || {};
    return customData.stages || [];
  }

  /**
   * Extract materials from phase custom data
   */
  private static extractMaterialsFromPhase(phase: any) {
    const customData = phase.custom_phase_data || {};
    return customData.materials || [];
  }

  /**
   * Extract resources from phase custom data
   */
  private static extractResourcesFromPhase(phase: any) {
    const customData = phase.custom_phase_data || {};
    return customData.humanResources || [];
  }

  /**
   * Generate milestones from phases
   */
  private static generateMilestonesFromPhases(phases: any[]) {
    return phases.map(phase => ({
      id: `milestone-${phase.id}`,
      title: `Completion of ${phase.construction_phase}`,
      phase: phase.construction_phase as any || 'pre_construction',
      stage: phase.construction_stage as any || 'planning_design',
      targetDate: phase.end_date || new Date().toISOString(),
      status: phase.status === 'completed' ? 'completed' : 'pending' as any,
      weight: phase.weight || 1,
      completedDate: phase.status === 'completed' ? phase.end_date : undefined,
      notes: `Milestone for completing ${phase.construction_phase} phase`
    }));
  }

  /**
   * Get current phase information
   */
  private static getCurrentPhaseInfo(phases: any[]) {
    const currentPhase = phases.find(p => p.status === 'in_progress') || phases[0];
    return {
      phase: currentPhase?.construction_phase || 'pre_construction',
      stage: currentPhase?.construction_stage || 'planning_design'
    };
  }

  /**
   * Calculate overall project progress
   */
  private static calculateOverallProgress(phases: any[]) {
    if (!phases.length) return 0;
    
    const totalWeight = phases.reduce((sum, phase) => sum + (phase.weight || 1), 0);
    const weightedProgress = phases.reduce((sum, phase) => {
      const weight = phase.weight || 1;
      const progress = phase.progress_percentage || 0;
      return sum + (weight * progress);
    }, 0);
    
    return Math.round(weightedProgress / totalWeight);
  }

  /**
   * Calculate PERT analysis (placeholder)
   */
  private static calculatePERTAnalysis(tasks: any[]) {
    return {
      expectedDurations: {},
      criticalPath: [],
      totalExpectedDuration: 0,
      variances: {},
      optimisticDuration: 0,
      pessimisticDuration: 0,
      mostLikelyDuration: 0,
      expectedDuration: 0,
      standardDeviation: 0,
      variance: 0
    };
  }

  /**
   * Generate Gantt chart data
   */
  private static generateGanttChart(phases: any[], tasks: any[]) {
    return {
      phases: phases.map(phase => ({
        id: phase.id,
        name: phase.construction_phase,
        startDate: phase.start_date,
        endDate: phase.end_date,
        progress: phase.progress_percentage || 0,
        status: phase.status,
        dependencies: []
      })),
      tasks: [],
      milestones: this.generateMilestonesFromPhases(phases),
      dependencies: []
    };
  }
}