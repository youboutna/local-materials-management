import { supabase } from '@/integrations/supabase/client';
import { ProjectData, Task, ProjectRisk, ProjectResource, Payment, Inspection, ProjectStatus } from '@/types/project';

export class ProjectDataTransformer {
  // Enhanced method to transform project data with more detail
  static async transformProjectData(rawData: any): Promise<ProjectData> {
    const transformedProject = await this.transformProject(rawData);
    if (!transformedProject) {
      throw new Error('Failed to transform project data');
    }
    return transformedProject;
  }

  static async getProjectById(projectId: string): Promise<ProjectData | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          inspections(*),
          payments(*)
        `)
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error fetching project:', error);
        return null;
      }

      if (!data) return null;

      return this.transformProject(data);
    } catch (error) {
      console.error('Error in getProjectById:', error);
      return null;
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
      // Enhanced transformation with more detailed data processing
      const [tasks, risks, resources] = await Promise.all([
        this.transformTasks(data.id),
        this.transformRisks(data.id),
        this.transformResources(data.id)
      ]);

      // Transform the basic project data with enhanced details
      const project: ProjectData = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        location: data.location || '',
        status: (data.status as ProjectStatus) || 'en cours',
        progress: data.progress || 0,
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
        
        // Transform related data with enhanced details
        inspections: this.transformInspections(data.inspections || []),
        tasks,
        risks,
        resources,
        
        // Enhanced methodology and planning data
        methodology: data.methodology || 'waterfall',
        ganttChart: data.gantt_chart || undefined,
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
        }
      };

      return project;
    } catch (error) {
      console.error('Error transforming project:', error);
      return null;
    }
  }

  private static async transformTasks(projectId: string): Promise<Task[]> {
    try {
      // Fetch task assignments from the actual table
      const { data: taskAssignments } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('project_id', projectId);
      
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
      // Return empty array for now - risks table doesn't exist yet
      return [];
    } catch (error) {
      console.error('Error fetching risks:', error);
      return [];
    }
  }

  private static async transformResources(projectId: string): Promise<ProjectResource[]> {
    try {
      // Enhanced resource fetching with project-specific filtering
      const [materialsResult, employeesResult, projectMaterialsResult] = await Promise.all([
        supabase
          .from('materials')
          .select('*')
          .eq('workspace_id', projectId),
        supabase
          .from('employees')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('materials')
          .select('*')
          .or(`workspace_id.eq.${projectId},workspace_id.is.null`)
      ]);

      const resources: ProjectResource[] = [];

      // Add project-specific materials as resources
      if (materialsResult.data) {
        materialsResult.data.forEach(material => {
          resources.push({
            id: material.id,
            name: material.name,
            type: 'material',
            availability: material.available_quantity || 1,
            assignedTasks: []
          });
        });
      }

      // Add employees as human resources with enhanced details
      if (employeesResult.data) {
        employeesResult.data.forEach(employee => {
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
      }

      return resources;
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  }

  // Enhanced method to get project phases with milestones
  private static async getProjectPhases(projectId: string): Promise<any[]> {
    try {
      // For now, return empty array as phases table doesn't exist yet
      // This can be implemented when the phases table is created
      return [];
    } catch (error) {
      console.error('Error fetching project phases:', error);
      return [];
    }
  }

  // Method to transform Supabase payments to the expected format
  private static transformPayments(payments: any[]): Payment[] {
    return payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      progress_at_payment: payment.progress_at_payment,
      transaction_id: payment.transaction_id,
      contractor_id: payment.contractor_id,
      contractor_name: payment.contractor_name,
      contractor_contact: payment.contractor_contact,
      bank_name: payment.bank_name,
      account_number: payment.account_number,
      check_number: payment.check_number,
      mobile_number: payment.mobile_number,
      mobile_operator: payment.mobile_operator,
      receiver_name: payment.receiver_name
    }));
  }

  // Method to transform Supabase inspections to the expected format
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
      issues: []
    }));
  }
}