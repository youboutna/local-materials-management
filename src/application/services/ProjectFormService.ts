/**
 * Project Form Service - Hexagonal Architecture
 * Handles project form operations with repository pattern
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ProjectTransformer } from '@/dtos/transforms';
import { PhaseService } from './PhaseService';
import { MaterialService } from './MaterialService';
import { RiskService } from './RiskService';
import { BankGuaranteeService } from './BankGuaranteeService';
import { InsuranceService } from './InsuranceService';
import { DocumentService } from './DocumentService';
import { EmployeeService } from './EmployeeService';
import { SupplierService } from './SupplierService';

// Service DTOs for data exchange
export interface ProjectFormDataDTO {
  title: string;
  description: string;
  location: string;
  status: string;
  progress: number;
  budget: number;
  start_date: string;
  end_date: string;
  team_size: number;
  // Related data - Using specific types instead of unknown
  phases?: PhaseFormDataDTO[];
  materials?: MaterialFormDataDTO[];
  risks?: RiskFormDataDTO[];
  bankGuarantees?: BankGuaranteeFormDataDTO[];
  insurances?: InsuranceFormDataDTO[];
  documents?: DocumentFormDataDTO[];
  employees?: EmployeeFormDataDTO[];
  suppliers?: SupplierFormDataDTO[];
}

// Specific DTOs for related entities
export interface PhaseFormDataDTO {
  id?: string;
  name: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  progress?: number;
}

export interface MaterialFormDataDTO {
  id?: string;
  name: string;
  type: 'raw' | 'equipment' | 'consumable' | 'service';
  unit: string;
  quantity: number;
  unit_price: number;
  supplier_id?: string;
  specifications?: Record<string, string | number | boolean>;
}

export interface RiskFormDataDTO {
  id?: string;
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'identified' | 'mitigated' | 'accepted';
}

export interface BankGuaranteeFormDataDTO {
  id?: string;
  type: 'performance' | 'payment' | 'advance_payment' | 'retention';
  amount: number;
  currency: string;
  bank_name: string;
  guarantee_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface InsuranceFormDataDTO {
  id?: string;
  type: 'liability' | 'property' | 'professional_indemnity' | 'workers_compensation';
  provider: string;
  policy_number: string;
  coverage_amount: number;
  premium: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface DocumentFormDataDTO {
  id?: string;
  title: string;
  type: 'contract' | 'technical' | 'financial' | 'legal' | 'other';
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_date?: string;
  status: 'uploaded' | 'processing' | 'approved' | 'rejected';
}

export interface EmployeeFormDataDTO {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  role: 'admin' | 'manager' | 'employee' | 'contractor';
  status: 'active' | 'inactive' | 'on_leave';
  hire_date?: string;
}

export interface SupplierFormDataDTO {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  category: 'material' | 'service' | 'consultant' | 'contractor';
  status: 'active' | 'inactive' | 'blacklisted';
  rating?: {
    score: number;
    reviews_count: number;
    last_review_date: string;
  };
  certifications?: Array<{
    name: string;
    issuer: string;
    issue_date: string;
    expiry_date: string;
    status: 'valid' | 'expired';
  }>;
}

export interface SaveContextDTO {
  currentStep: number;
  totalSteps: number;
  isDraft?: boolean;
  isComplete?: boolean;
  saveType?: string;
  lastSavedAt?: string;
}

export interface StepRelatedDataDTO {
  phases?: PhaseFormDataDTO[];
  risks?: RiskFormDataDTO[];
  materials?: MaterialFormDataDTO[];
  stakeholders?: EmployeeFormDataDTO[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SaveResult {
  success: boolean;
  projectId: string | null;
  error?: string;
}

export interface OperationResult {
  success: boolean;
  error?: string;
}

export class ProjectFormService {
  constructor(
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository()
  ) {}
  /**
   * Format date for input field
   */
  formatDateForInput(dateString: string | Date | null | undefined): string {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  /**
   * Map status from database format
   */
  mapStatusFromDB(status: string): string {
    const mapping: Record<string, string> = {
      'en attente': 'planning',
      'en cours': 'en cours',
      'suspendu': 'suspendu',
      'terminé': 'terminé',
      'annulé': 'annulé'
    };
    return mapping[status] || status || 'planning';
  }

  /**
   * Map fields from database format
   */
  mapFieldsFromDB(dbData: Record<string, unknown>): ProjectFormDataDTO {
    return {
      title: (dbData.title as string) || '',
      description: (dbData.description as string) || '',
      location: (dbData.location as string) || '',
      status: this.mapStatusFromDB(dbData.status as string),
      progress: (dbData.progress as number) || 0,
      budget: (dbData.budget as number) || 0,
      start_date: this.formatDateForInput(dbData.start_date as string),
      end_date: this.formatDateForInput(dbData.end_date as string),
      team_size: (dbData.team_size as number) || 0,
    };
  }

  /**
   * Map fields to database format
   */
  mapFieldsToDB(formData: ProjectFormDataDTO, step?: number): Record<string, unknown> {
    const data = formData as unknown as Record<string, unknown>;
    return {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      status: formData.status,
      progress: formData.progress,
      budget: formData.budget,
      start_date: data.start_date || data.startDate,
      end_date: data.end_date || data.endDate,
      team_size: data.team_size || data.teamSize,
      current_step: step
    };
  }

  /**
   * Validate step data
   */
  validateStepData(formData: ProjectFormDataDTO, step: number): ValidationResult {
    const errors: string[] = [];

    if (step === 1) {
      if (!formData.title || formData.title.trim() === '') {
        errors.push('Le titre du projet est requis');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Save step data
   */
  async saveStepData(
    projectId: string | null,
    formData: ProjectFormDataDTO,
    step: number
  ): Promise<SaveResult> {
    try {
      // Validate form data
      const validation = this.validateStepData(formData, step);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(', ')}`);
      }

      const id = projectId || `project-${Date.now()}`;
      
      // For now, simulate saving as project repository is not available
      // TODO: Implement proper project saving when project repository is available
      console.warn('ProjectFormService.saveStepData: Project repository not available');
      console.log(`Saving project form data for project: ${id}, step: ${step}`);
      
      return { success: true, projectId: id };
    } catch (error) {
      console.error('ProjectFormService.saveStepData failed:', error);
      if (error instanceof AppError) {
        return { success: false, projectId: null, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, projectId: null, error: message };
    }
  }

  /**
   * Save step related data
   */
  async saveStepRelatedData(
    projectId: string,
    step: number,
    data: StepRelatedDataDTO
  ): Promise<OperationResult> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, simulate saving as related data repository is not available
      // TODO: Implement proper related data saving when repository is available
      console.warn('ProjectFormService.saveStepRelatedData: Related data repository not available');
      console.log(`Saving related data for project: ${projectId}, step: ${step}`);
      
      return { success: true };
    } catch (error) {
      console.error('ProjectFormService.saveStepRelatedData failed:', error);
      if (error instanceof AppError) {
        return { success: false, error: error.message };
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Load project data
   */
  async loadProjectData(projectId: string): Promise<ProjectFormDataDTO | null> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, return mock data as project repository is not available
      // TODO: Implement proper project data loading when project repository is available
      console.warn('ProjectFormService.loadProjectData: Project repository not available');
      
      return null;
    } catch (error) {
      console.error('ProjectFormService.loadProjectData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to load project data');
    }
  }

  /**
   * Load related data using hexagonal services
   */
  async loadRelatedData(projectId: string): Promise<Partial<ProjectFormDataDTO>> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Use hexagonal services to load related data
      const [
        phasesData,
        materialsData,
        risksData,
        bankGuaranteesData,
        insuranceData,
        documentsData
      ] = await Promise.all([
        new PhaseService().getPhasesByProject(projectId),
        new MaterialService().getProjectMaterials(projectId),
        new RiskService().getProjectRisks(projectId),
        new BankGuaranteeService().getProjectBankGuarantees(projectId),
        new InsuranceService().getInsuranceCertificates(projectId),
        new DocumentService().getProjectDocuments(projectId)
      ]);

      return {
        phases: phasesData || [],
        materials: materialsData || [],
        risks: risksData || [],
        bankGuarantees: bankGuaranteesData || [],
        insurances: insuranceData || [],
        documents: documentsData || []
      };
    } catch (error) {
      console.error('ProjectFormService.loadRelatedData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to load related data');
    }
  }

  /**
   * Load base data using hexagonal services
   */
  async loadBaseData(): Promise<Record<string, unknown>> {
    try {
      // Use hexagonal services to load base data
      const [
        employeesData,
        suppliersData,
        materialsData
      ] = await Promise.all([
        new EmployeeService(RepositoryFactory.getEmployeeRepository()).getActiveEmployees(),
        new SupplierService(RepositoryFactory.getSupplierRepository()).getActiveSuppliers(),
        new MaterialService().getAllMaterials()
      ]);

      return {
        employees: employeesData || [],
        suppliers: suppliersData || [],
        materials: materialsData || []
      };
    } catch (error) {
      console.error('ProjectFormService.loadBaseData failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to load base data');
    }
  }

  /**
   * Validate step
   */
  validateStep(stepId: number, formData: ProjectFormDataDTO): boolean {
    const result = this.validateStepData(formData, stepId);
    return result.isValid;
  }

  /**
   * Process form data for save
   */
  processFormDataForSave(formData: ProjectFormDataDTO, context: SaveContextDTO): Record<string, unknown> {
    return {
      ...formData,
      currentStep: context.currentStep,
      isDraft: context.isDraft ?? false,
      isComplete: context.isComplete ?? false,
      saveType: context.saveType ?? 'draft',
    };
  }
}
