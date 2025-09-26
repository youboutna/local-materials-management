import { ProjectService } from './ProjectService';
import { ProjectStakeholderService } from './ProjectStakeholderService';
import { supabase } from '../integrations/supabase/client';

export interface ProjectFormData {
  title?: string;
  description?: string;
  location?: string;
  status?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  start_date?: string;
  end_date?: string;
  team_size?: number;
  financing_source?: string;
  market_type?: string;
  selection_mode?: string;
  project_responsable_id?: string;
  main_contractor?: string;
  engineering_consultant?: string;
  general_contractor?: string;
  project_reference?: string;
  allows_initial_payment?: boolean;
  initial_payment_percentage?: number;
  current_phase?: string;
  current_stage?: string;
  facilitiesLocation?: any;
  stakeholders?: any[];
  teamMembers?: any[];
  contractors?: any[];
  phases?: any[];
  materials?: any[];
  risks?: any[];
  compliance?: any[];
  // Financial instruments
  bank_guarantee_required?: boolean;
  bank_guarantee_amount?: number;
  bank_guarantee_percentage?: number;
  insurance_required?: boolean;
  // Materials and resources
  materials_budget?: number;
  procurement_lead_time?: number;
  resource_assignment?: string;
  // Additional data loaded from database
  bankGuarantees?: any[];
  insuranceCertificates?: any[];
  documents?: any[];
  employees?: any[];
  suppliers?: any[];
}

export interface SaveContext {
  currentStep: number;
  saveType: 'step_only' | 'save_and_next' | 'global_and_close';
  isDraft: boolean;
  isComplete?: boolean;
}

export class ProjectFormService {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  // Format date for input fields
  formatDateForInput = (dateString: any): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Date formatting error:', error);
      return '';
    }
  };

  // Map status from database
  mapStatusFromDB = (status: string): string => {
    const mapping = {
      'en attente': 'planning',
      'en cours': 'en cours', 
      'suspendu': 'suspendu',
      'terminé': 'terminé',
      'annulé': 'annulé'
    } as const;
    return mapping[status as keyof typeof mapping] || 'planning';
  };

  // Load project data
  async loadProjectData(projectId: string): Promise<ProjectFormData | null> {
    try {
      const projectData = await this.projectService.getProjectDetail(projectId);
      if (!projectData) return null;

      return {
        title: projectData.title,
        description: projectData.description,
        location: projectData.location,
        status: this.mapStatusFromDB(projectData.status || 'planning'),
        budget: projectData.budget,
        startDate: this.formatDateForInput(projectData.startDate),
        endDate: this.formatDateForInput(projectData.endDate),
        start_date: this.formatDateForInput(projectData.startDate),
        end_date: this.formatDateForInput(projectData.endDate),
        team_size: projectData.teamSize || 1,
        financing_source: projectData.financingSource || '',
        market_type: projectData.marketType || '',
        selection_mode: projectData.selectionMode || '',
        project_responsable_id: projectData.projectResponsableId || '',
        main_contractor: projectData.mainContractor || '',
        engineering_consultant: (projectData as any).engineeringConsultant || '',
        project_reference: projectData.projectReference || '',
        allows_initial_payment: projectData.allowsInitialPayment || false,
        initial_payment_percentage: projectData.initialPaymentPercentage || 0,
        current_phase: projectData.currentPhase || '',
        current_stage: projectData.currentStage || '',
        facilitiesLocation: projectData.coordinates ? {
          center: {
            lat: projectData.coordinates.latitude,
            lng: projectData.coordinates.longitude
          },
          polygon: (projectData as any).localisation || [],
          warehouseShape: (projectData as any).localisation || [],
          address: (projectData as any).adresse,
          shapeType: (projectData as any).forme
        } : undefined
      };
    } catch (error) {
      console.error('Error loading project data:', error);
      throw error;
    }
  }

  // Load related data (stakeholders, phases, materials)
  async loadRelatedData(projectId: string): Promise<Partial<ProjectFormData>> {
    try {
      // Load stakeholders
      const stakeholders = await ProjectStakeholderService.getProjectStakeholders(projectId);
      
      // Load phases
      const { data: phasesData } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('start_date');
      
      const phases = phasesData?.map(phase => ({
        id: phase.id,
        title: phase.phase_name,
        description: phase.description || '',
        startDate: this.formatDateForInput(phase.start_date),
        endDate: this.formatDateForInput(phase.end_date),
        status: phase.status,
        budget: phase.estimated_cost || 0,
        progress: phase.progress || 0
      })) || [];

      // Load materials
      const { data: materialsData } = await supabase
        .from('project_materials')
        .select('material_id, quantity')
        .eq('project_id', projectId);
      
      const materials = materialsData?.map(item => ({
        materialId: item.material_id,
        quantity: item.quantity
      })) || [];

      // Load risks
      const { data: risksData } = await supabase
        .from('project_risks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      const risks = risksData?.map(risk => ({
        id: risk.id,
        category: risk.risk_level || 'technical',
        description: risk.risk_description || '',
        probability: risk.probability || 'medium',
        impact: risk.impact || 'medium',
        riskScore: this.calculateRiskScore(risk.probability || 'medium', risk.impact || 'medium'),
        mitigationPlan: risk.mitigation_strategy || '',
        owner: risk.owner_id || '',
        status: risk.status || 'active'
      })) || [];

      // Load bank guarantees
      const { data: bankGuaranteesData } = await supabase
        .from('bank_guarantees')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      // Load insurance certificates
      const { data: insuranceData } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      // Load project documents
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      // Load employees for team/stakeholders
      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      // Load suppliers for contractors
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      return {
        stakeholders: stakeholders || [],
        phases,
        materials,
        risks,
        bankGuarantees: bankGuaranteesData || [],
        insuranceCertificates: insuranceData || [],
        documents: documentsData || [],
        employees: employeesData || [],
        suppliers: suppliersData || []
      };
    } catch (error) {
      console.error('Error loading related data:', error);
      throw error;
    }
  }

  // Helper to calculate risk score
  private calculateRiskScore(probability: string, impact: string): number {
    const probabilityValues = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    const impactValues = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 };
    
    const probValue = probabilityValues[probability as keyof typeof probabilityValues] || 3;
    const impactValue = impactValues[impact as keyof typeof impactValues] || 3;
    
    return probValue * impactValue;
  }

  // Load base data for dropdowns and selectors
  async loadBaseData(): Promise<any> {
    try {
      const [
        { data: employeesData },
        { data: suppliersData },
        { data: materialsData },
        { data: organizationsData }
      ] = await Promise.all([
        supabase.from('employees').select('*').eq('is_active', true).order('full_name'),
        supabase.from('suppliers').select('*').eq('is_active', true).order('name'),
        supabase.from('materials').select('*').order('name'),
        supabase.from('organizations').select('*').eq('is_active', true).order('name')
      ]);

      return {
        employees: employeesData || [],
        suppliers: suppliersData || [],
        materials: materialsData || [],
        organizations: organizationsData || []
      };
    } catch (error) {
      console.error('Error loading base data:', error);
      return {
        employees: [],
        suppliers: [],
        materials: [],
        organizations: []
      };
    }
  }

  // Validate step data
  validateStep(stepId: number, formData: ProjectFormData): boolean {
    switch (stepId) {
      case 1:
        return !!(formData.title && formData.description && formData.budget);
      case 2:
        return !!(formData.stakeholders?.length || formData.project_responsable_id || formData.main_contractor || formData.teamMembers?.length);
      case 3:
        return !!(formData.phases?.length);
      case 4:
        return !!(formData.facilitiesLocation?.center || formData.location);
      case 5:
        return !!(formData.risks?.length);
      case 6:
        return !!(formData.compliance?.length);
      default:
        return false;
    }
  }

  // Process form data before saving
  processFormDataForSave(formData: ProjectFormData, context: SaveContext): any {
    return {
      ...formData,
      currentStep: context.currentStep,
      isDraft: context.isDraft,
      isComplete: context.isComplete,
      saveType: context.saveType
    };
  }
}