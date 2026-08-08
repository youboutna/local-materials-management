/**
 * Supabase Adapter for Project Form Repository
 * Implements the IProjectFormRepository using Supabase
 * Following hexagonal architecture principles
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { IProjectFormRepository } from '@/domain/repositories/IProjectFormRepository';

// Import workflow DTOs (following "similitude des voisins le plus proche")
import { 
  ProjectWorkflowData,
  StepRelatedDataDTO,
  WorkflowMetadataDTO,
  ValidationResult,
  SaveResult,
  SaveContextDTO,
  WorkflowStep,
  WorkflowTransition,
  WorkflowState,
  ProjectCreationWorkflowDTO,
  ProjectValidationDTO,
  StepProgressDTO
} from '@/dtos/workflows/ProjectWorkflowDTOs';

// Import entity DTOs (following "similitude des voisins le plus proche")
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { PhaseDTO } from '@/dtos/entities/PhaseDTO';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';

import { Project } from '@/domain/entities';
import { SupabaseProjectAdapter } from './SupabaseProjectAdapter';
import { ProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { ProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

// Interface pour les données de formulaire
interface ProjectFormData {
  title?: string;
  description?: string;
  location?: string;
  status?: string;
  budget?: string | number;
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
  project_reference?: string;
  allows_initial_payment?: boolean;
  initial_payment_percentage?: number;
  current_phase?: string;
  current_stage?: string;
  facilitiesLocation?: {
    center?: { lat: number; lng: number };
    polygon?: any[];
    warehouseShape?: any[];
    address?: string;
    shapeType?: string;
  };
  geographic_zone?: string;
  terrain_type?: string;
  environmental_constraints?: string;
  has_utilities?: boolean;
  requires_permits?: boolean;
  stakeholders?: any[];
  phases?: any[];
  materials?: any[];
  risks?: any[];
  bankGuarantees?: any[];
  insuranceCertificates?: any[];
  documents?: any[];
  employees?: any[];
  suppliers?: any[];
  teamMembers?: any[];
  compliance?: any[];
}

export class SupabaseProjectFormAdapter implements IProjectFormRepository {
  private projectAdapter: SupabaseProjectAdapter;
  private projectService: ProjectService;

  constructor() {
    this.projectAdapter = new SupabaseProjectAdapter();
    this.projectService = getProjectService();
  }

  /**
   * Convert workflow data to project entity format
   */
  private workflowDataToProjectEntity(workflowData: ProjectWorkflowData, step: number): unknown {
    const entity: Record<string, unknown> = {};
    
    // Map based on step
    switch (step) {
      case 1:
        entity.title = workflowData.projectData.title;
        entity.description = workflowData.projectData.description;
        entity.location = workflowData.projectData.location;
        entity.status = 'draft';
        break;
      case 2:
        entity.budget = workflowData.projectData.budget;
        entity.start_date = workflowData.projectData.startDate;
        entity.end_date = workflowData.projectData.endDate;
        break;
      case 3:
        entity.team_size = workflowData.projectData.teamSize;
        entity.main_contractor = workflowData.projectData.mainContractor;
        break;
      default:
        // Map all available fields
        Object.assign(entity, workflowData.projectData);
    }
    
    return entity;
  }

  /**
   * Validate step data
   */
  private validateStepData(formData: ProjectFormData, step: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!formData.title || formData.title.trim() === '') {
          errors.push('Title is required');
        }
        if (!formData.location || formData.location.trim() === '') {
          errors.push('Location is required');
        }
        break;
      case 2:
        const budget = typeof formData.budget === 'string' ? parseFloat(formData.budget) : formData.budget;
        if (!budget || budget <= 0) {
          errors.push('Budget must be greater than 0');
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert form data to project entity
   */
  private formDataToProjectEntity(formData: ProjectFormData, step: number): Record<string, unknown> {
    const entity: Record<string, unknown> = {};
    
    // Common fields
    if (formData.title) entity.title = formData.title;
    if (formData.description) entity.description = formData.description;
    if (formData.location) entity.location = formData.location;
    if (formData.status) entity.status = formData.status;
    
    const budget = typeof formData.budget === 'string' ? parseFloat(formData.budget) : formData.budget;
    if (budget && budget > 0) entity.budget = budget;
    
    if (formData.startDate || formData.start_date) {
      entity.start_date = formData.startDate || formData.start_date;
    }
    if (formData.endDate || formData.end_date) {
      entity.end_date = formData.endDate || formData.end_date;
    }
    if (formData.team_size) entity.team_size = formData.team_size;
    if (formData.financing_source) entity.financing_source = formData.financing_source;
    if (formData.market_type) entity.market_type = formData.market_type;
    if (formData.selection_mode) entity.selection_mode = formData.selection_mode;
    if (formData.project_responsable_id) entity.project_responsable_id = formData.project_responsable_id;
    if (formData.main_contractor) entity.main_contractor = formData.main_contractor;
    if (formData.engineering_consultant) entity.engineering_consultant = formData.engineering_consultant;
    if (formData.project_reference) entity.project_reference = formData.project_reference;
    
    // Localisation
    if (formData.facilitiesLocation) {
      entity.location_data = formData.facilitiesLocation;
      entity.latitude = formData.facilitiesLocation.center?.lat;
      entity.longitude = formData.facilitiesLocation.center?.lng;
      entity.address = formData.facilitiesLocation.address;
      entity.shape_type = formData.facilitiesLocation.shapeType;
      entity.polygon_data = formData.facilitiesLocation.polygon;
      entity.warehouse_shape = formData.facilitiesLocation.warehouseShape;
    }
    
    // Geographic fields
    if (formData.geographic_zone) entity.geographic_zone = formData.geographic_zone;
    if (formData.terrain_type) entity.terrain_type = formData.terrain_type;
    if (formData.environmental_constraints) entity.environmental_constraints = formData.environmental_constraints;
    if (formData.has_utilities !== undefined) entity.has_utilities = formData.has_utilities;
    if (formData.requires_permits !== undefined) entity.requires_permits = formData.requires_permits;
    
    // Payment fields
    if (formData.allows_initial_payment !== undefined) entity.allows_initial_payment = formData.allows_initial_payment;
    if (formData.initial_payment_percentage !== undefined) entity.initial_payment_percentage = formData.initial_payment_percentage;
    
    // Current phase/stage
    if (formData.current_phase) entity.current_phase = formData.current_phase;
    if (formData.current_stage) entity.current_stage = formData.current_stage;
    
    return entity;
  }

  async saveStepData(
    projectId: string | null,
    formData: ProjectFormData,
    step: number
  ): Promise<{ success: boolean; projectId: string | null; error?: string }> {
    try {
      // Convert form data to project entity
      const projectData = this.formDataToProjectEntity(formData, step);
      
      if (projectId) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', projectId);

        if (error) throw error;
        return { success: true, projectId };
      } else {
        // Create new project (only on step 1 with required fields)
        const validation = this.validateStepData(formData, 1);
        if (!validation.isValid) {
          return { success: false, projectId: null, error: validation.errors.join(', ') };
        }

        const { data, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select('id')
          .single();

        if (error) throw error;
        return { success: true, projectId: data.id };
      }
    } catch (error: unknown) {
      console.error('Error saving step data:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, projectId, error: message };
    }
  }

  /**
   * Save related data for specific steps
   */
  async saveStepRelatedData(
    projectId: string,
    step: number,
    data: {
      phases?: any[];
      risks?: any[];
      materials?: any[];
      stakeholders?: any[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (step) {
        case 2: // Stakeholders
          if (data.stakeholders?.length) {
            await getProjectStakeholderService().createProjectStakeholders(projectId, data.stakeholders as any, {} as any);
          }
          break;

        case 4: // Phases with steps and tasks
          if (data.phases?.length) {
            // Delete existing phases and insert new ones
            await supabase.from('project_phases').delete().eq('project_id', projectId);
            const phasesToInsert = data.phases.map((phase, index) => ({
              project_id: projectId,
              phase_name: phase.title || phase.name,
              description: phase.description,
              start_date: phase.startDate || phase.start_date,
              end_date: phase.endDate || phase.end_date,
              status: phase.status || 'pending',
              estimated_cost: phase.budget || phase.estimated_cost || 0,
              progress: phase.progress || 0,
              estimated_duration: phase.estimatedDuration || null,
              notes: phase.notes || null,
              construction_phase: phase.phase || null,
              construction_stage: phase.stage || null,
              location: phase.location || null,
              materials: phase.materials || null,
              human_resources: phase.humanResources || null,
              suppliers: phase.suppliers || null,
              // Store custom phase data with steps and tasks
              custom_phase_data: phase.customPhase ? {
                id: phase.customPhase.id,
                name: phase.customPhase.name,
                number: phase.customPhase.number,
                description: phase.customPhase.description,
                customStages: phase.customPhase.customStages || []
              } : null
            }));
            await supabase.from('project_phases').insert(phasesToInsert);
          }
          break;

        case 5: // Risks
          if (data.risks?.length) {
            await supabase.from('project_risks').delete().eq('project_id', projectId);
            const risksToInsert = data.risks.map(risk => ({
              project_id: projectId,
              risk_title: risk.title || risk.category,
              risk_description: risk.description,
              risk_level: risk.category || 'medium',
              probability: risk.probability,
              impact: risk.impact,
              mitigation_strategy: risk.mitigationPlan,
              status: risk.status || 'active'
            }));
            await supabase.from('project_risks').insert(risksToInsert);
          }
          break;

        case 3: // Materials (part of planning)
          if (data.materials?.length) {
            await supabase.from('project_materials').delete().eq('project_id', projectId);
            const materialsToInsert = data.materials.map(m => ({
              project_id: projectId,
              material_id: m.materialId,
              quantity: m.quantity
            }));
            await supabase.from('project_materials').insert(materialsToInsert);
          }
          break;
      }

      return { success: true };
    } catch (error: unknown) {
      console.error('Error saving related data:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Load project data
   */
  async loadProjectData(projectId: string): Promise<any | null> {
    try {
      const projectData = await this.projectService.getProjectById(projectId);
      if (!projectData) return null;

      return {
        title: projectData.title,
        description: projectData.description,
        location: projectData.location,
        status: projectData.status || "en cours",
        budget: projectData.budget?.toString() || "",
        startDate: this.formatDateForInput(projectData.startDate),
        endDate: this.formatDateForInput(projectData.endDate),
        start_date: this.formatDateForInput(projectData.startDate),
        end_date: this.formatDateForInput(projectData.endDate),
        team_size: projectData.teamSize || 1,
        financing_source: projectData.financingSource || "",
        market_type: projectData.marketType || "",
        selection_mode: projectData.selectionMode || "",
        project_responsable_id: projectData.projectManagerId || undefined,
        main_contractor: projectData.mainContractor || undefined,
        engineering_consultant: (projectData as any).engineeringConsultant || undefined,
        project_reference: projectData.projectReference || "",
        allows_initial_payment: projectData.allowsInitialPayment || false,
        initial_payment_percentage: projectData.initialPaymentPercentage || 0,
        current_phase: projectData.currentPhase || "",
        current_stage: projectData.currentStage || "",
        facilitiesLocation: projectData.coordinates
          ? {
              center: {
                lat: projectData.latitude || 0,
                lng: projectData.longitude || 0,
              },
              polygon: (projectData as any).localisation || [],
              warehouseShape: (projectData as any).localisation || [],
              address: projectData.location || '',
              shapeType: (projectData as any).forme || '',
            }
          : undefined,
        geographic_zone: projectData.geographicZone || "",
        terrain_type: projectData.terrainType || "",
        environmental_constraints: (projectData as any).environmentalConstraints || "",
        has_utilities: projectData.hasUtilities || false,
        requires_permits: projectData.requiresPermits || false,
      };
    } catch (error) {
      console.error("Error loading project data:", error);
      throw error;
    }
  }

  /**
   * Load related data (stakeholders, phases, materials)
   */
  async loadRelatedData(projectId: string): Promise<any> {
    try {
      // Load stakeholders
      const stakeholders = await getProjectStakeholderService().getProjectStakeholders(projectId);

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
        progress: phase.progress || 0,
        estimatedDuration: phase.estimated_duration || 30,
        notes: phase.notes || '',
        phase: phase.construction_phase || undefined,
        stage: phase.construction_stage || undefined,
        location: phase.location || '',
        materials: phase.materials || [],
        humanResources: phase.human_resources || [],
        suppliers: phase.suppliers || [],
        actualCost: phase.actual_cost || 0,
        customPhase: phase.custom_phase_data ? (() => {
          const customData = phase.custom_phase_data as Record<string, unknown>;
          return {
            id: customData.id as string,
            name: customData.name as string,
            number: customData.number as number,
            description: (customData.description as string) || '',
            customStages: (customData.customStages as any[]) || []
          };
        })() : undefined
      })) || [];

      // Load materials
      const { data: materialsData } = await supabase
        .from("project_materials")
        .select("material_id, quantity")
        .eq("project_id", projectId);

      const materials = materialsData?.map((item) => ({
        materialId: item.material_id,
        quantity: item.quantity,
      })) || [];

      // Load risks
      const { data: risksData } = await supabase
        .from("project_risks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");

      const risks = risksData?.map((risk) => ({
        id: risk.id,
        category: risk.risk_level || "technical",
        description: risk.risk_description || "",
        probability: risk.probability || "medium",
        impact: risk.impact || "medium",
        riskScore: this.calculateRiskScore(
          risk.probability || "medium",
          risk.impact || "medium"
        ),
        mitigationPlan: risk.mitigation_strategy || "",
        owner: risk.owner_id || "",
        status: risk.status || "active",
      })) || [];

      // Load bank guarantees
      const { data: bankGuaranteesData } = await supabase
        .from("bank_guarantees")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");

      // Load insurance certificates
      const { data: insuranceData } = await supabase
        .from("insurance_certificates")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");

      // Load project documents
      const { data: documentsData } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at");

      // Load employees for team/stakeholders
      const { data: employeesData } = await supabase
        .from("employees")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      // Load suppliers for contractors
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      return {
        stakeholders: stakeholders || [],
        phases,
        materials,
        risks,
        bankGuarantees: bankGuaranteesData || [],
        insuranceCertificates: insuranceData || [],
        documents: documentsData || [],
        employees: employeesData || [],
        suppliers: suppliersData || [],
      };
    } catch (error) {
      console.error("Error loading related data:", error);
      throw error;
    }
  }

  /**
   * Load base data for dropdowns and selectors
   */
  async loadBaseData(): Promise<unknown> {
    try {
      const [
        { data: employeesData },
        { data: suppliersData },
        { data: materialsData },
        { data: organizationsData },
      ] = await Promise.all([
        supabase
          .from("employees")
          .select("*")
          .eq("is_active", true)
          .order("full_name"),
        supabase
          .from("suppliers")
          .select("*")
          .eq("is_active", true)
          .order("name"),
        supabase.from("materials").select("*").order("name"),
        supabase
          .from("organizations")
          .select("*")
          .eq("is_active", true)
          .order("name"),
      ]);

      return {
        employees: employeesData || [],
        suppliers: suppliersData || [],
        materials: materialsData || [],
        organizations: organizationsData || [],
      };
    } catch (error) {
      console.error("Error loading base data:", error);
      return {
        employees: [],
        suppliers: [],
        materials: [],
        organizations: [],
      };
    }
  }

  /**
   * Validate step data
   */
  validateStep(stepId: number, formData: ProjectFormData): boolean {
    switch (stepId) {
      case 1:
        return !!(formData.title && formData.description && formData.budget);
      case 2:
        return !!(
          formData.stakeholders?.length ||
          formData.project_responsable_id ||
          formData.main_contractor ||
          formData.teamMembers?.length
        );
      case 3:
        return !!formData.phases?.length;
      case 4:
        return !!(formData.facilitiesLocation?.center || formData.location);
      case 5:
        return !!formData.risks?.length;
      case 6:
        return !!formData.compliance?.length;
      default:
        return false;
    }
  }

  // =================== HELPER METHODS ===================

  private formatDateForInput = (dateString: unknown): string => {
    if (!dateString) return "";
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (date instanceof Date && !isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return '';
    } catch {
      return '';
    }
  };

  private calculateRiskScore(probability: string, impact: string): number {
    const probabilityValues: Record<string, number> = {
      very_low: 1,
      low: 2,
      medium: 3,
      high: 4,
      very_high: 5,
    };
    const impactValues: Record<string, number> = {
      very_low: 1,
      low: 2,
      medium: 3,
      high: 4,
      very_high: 5,
    };

    const probValue = probabilityValues[probability] || 3;
    const impactValue = impactValues[impact] || 3;

    return probValue * impactValue;
  }
}