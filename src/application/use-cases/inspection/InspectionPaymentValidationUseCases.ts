/**
 * Inspection Payment Validation Use Cases
 */

import { 
  IInspectionPaymentValidationRepository, 
  InspectionDetails, 
  ProjectDetails 
} from '@/domain/repositories/IInspectionPaymentValidationRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Get Inspection with Payment Request
export interface GetInspectionWithPaymentRequestResult {
  success: boolean;
  inspection: InspectionDetails | null;
  error?: string;
}

export class GetInspectionWithPaymentRequestUseCase {
  private inspectionPaymentValidationRepository: IInspectionPaymentValidationRepository;

  constructor(inspectionPaymentValidationRepository?: IInspectionPaymentValidationRepository) {
    this.inspectionPaymentValidationRepository = inspectionPaymentValidationRepository || RepositoryFactory.getInspectionPaymentValidationRepository();
  }

  async execute(inspectionId: string): Promise<GetInspectionWithPaymentRequestResult> {
    try {
      const inspection = await this.inspectionPaymentValidationRepository.getInspectionWithPaymentRequest(inspectionId);
      return { success: true, inspection };
    } catch (error) {
      console.error('GetInspectionWithPaymentRequestUseCase error:', error);
      return {
        success: false,
        inspection: null,
        error: error instanceof Error ? error.message : 'Failed to get inspection with payment request'
      };
    }
  }
}

// Get Project with Stakeholders
export interface GetProjectWithStakeholdersResult {
  success: boolean;
  project: ProjectDetails | null;
  error?: string;
}

export class GetProjectWithStakeholdersUseCase {
  private inspectionPaymentValidationRepository: IInspectionPaymentValidationRepository;

  constructor(inspectionPaymentValidationRepository?: IInspectionPaymentValidationRepository) {
    this.inspectionPaymentValidationRepository = inspectionPaymentValidationRepository || RepositoryFactory.getInspectionPaymentValidationRepository();
  }

  async execute(projectId: string): Promise<GetProjectWithStakeholdersResult> {
    try {
      const project = await this.inspectionPaymentValidationRepository.getProjectWithStakeholders(projectId);
      return { success: true, project };
    } catch (error) {
      console.error('GetProjectWithStakeholdersUseCase error:', error);
      return {
        success: false,
        project: null,
        error: error instanceof Error ? error.message : 'Failed to get project with stakeholders'
      };
    }
  }
}

// Update Inspection Status
export interface UpdateInspectionStatusResult {
  success: boolean;
  error?: string;
}

export class UpdateInspectionStatusUseCase {
  private inspectionPaymentValidationRepository: IInspectionPaymentValidationRepository;

  constructor(inspectionPaymentValidationRepository?: IInspectionPaymentValidationRepository) {
    this.inspectionPaymentValidationRepository = inspectionPaymentValidationRepository || RepositoryFactory.getInspectionPaymentValidationRepository();
  }

  async execute(inspectionId: string, status: string, comments: string): Promise<UpdateInspectionStatusResult> {
    try {
      await this.inspectionPaymentValidationRepository.updateInspectionStatus(inspectionId, status, comments);
      return { success: true };
    } catch (error) {
      console.error('UpdateInspectionStatusUseCase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update inspection status'
      };
    }
  }
}

// Get Contractor Info
export interface GetContractorInfoResult {
  success: boolean;
  contractor: any;
  error?: string;
}

export class GetContractorInfoUseCase {
  private inspectionPaymentValidationRepository: IInspectionPaymentValidationRepository;

  constructor(inspectionPaymentValidationRepository?: IInspectionPaymentValidationRepository) {
    this.inspectionPaymentValidationRepository = inspectionPaymentValidationRepository || RepositoryFactory.getInspectionPaymentValidationRepository();
  }

  async execute(projectId: string): Promise<GetContractorInfoResult> {
    try {
      const contractor = await this.inspectionPaymentValidationRepository.getContractorInfo(projectId);
      return { success: true, contractor };
    } catch (error) {
      console.error('GetContractorInfoUseCase error:', error);
      return {
        success: false,
        contractor: null,
        error: error instanceof Error ? error.message : 'Failed to get contractor info'
      };
    }
  }
}

// Get Engineer Info
export interface GetEngineerInfoResult {
  success: boolean;
  engineer: any;
  error?: string;
}

export class GetEngineerInfoUseCase {
  private inspectionPaymentValidationRepository: IInspectionPaymentValidationRepository;

  constructor(inspectionPaymentValidationRepository?: IInspectionPaymentValidationRepository) {
    this.inspectionPaymentValidationRepository = inspectionPaymentValidationRepository || RepositoryFactory.getInspectionPaymentValidationRepository();
  }

  async execute(projectId: string): Promise<GetEngineerInfoResult> {
    try {
      const engineer = await this.inspectionPaymentValidationRepository.getEngineerInfo(projectId);
      return { success: true, engineer };
    } catch (error) {
      console.error('GetEngineerInfoUseCase error:', error);
      return {
        success: false,
        engineer: null,
        error: error instanceof Error ? error.message : 'Failed to get engineer info'
      };
    }
  }
}
