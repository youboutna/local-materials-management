import { CheckpointDTO } from './CheckpointDTO';

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';
export type CheckpointCategory = 'quality' | 'safety' | 'documentation' | 'approval' | 'delivery';

export interface VerificationItemDTO {
  id: string;
  name: string;
  title: string;
  category: CheckpointCategory;
  status: VerificationStatus;
  required: boolean;
  weight: number;
  completedAt?: string;
  notes?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
}

export interface VerifyCheckpointRequestDto {
  checkpoint: CheckpointDTO;
  projectId?: string;
  phaseId?: string;
}

export interface VerifyCheckpointResponseDto {
  result: CheckpointVerificationResult;
  errors?: string[];
}

export interface VerifyInspectionsRequestDto {
  requiredInspectionIds: string[];
  triggerProgress: number;
  projectId: string;
}

export interface VerifyDocumentsRequestDto {
  requiredDocumentIds: string[];
  projectId: string;
}

export interface VerifyApprovalsRequestDto {
  requiredApprovalIds: string[];
  projectId: string;
}

export interface VerifyResourcesRequestDto {
  stepId: string;
  projectId: string;
}

export interface VerifyServiceFaitRequestDto {
  checkpointId: string;
  projectId: string;
}

export interface CheckpointVerificationResult {
  id: string;
  checkpointId: string;
  projectId: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  documents?: string[];
  status: 'pending' | 'verified' | 'rejected';
}

export interface CreateCheckpointVerificationDto {
  checkpointId: string;
  projectId: string;
  verifiedBy: string;
  notes?: string;
  documents?: string[];
}

export interface UpdateCheckpointVerificationDto {
  verified?: boolean;
  notes?: string;
  documents?: string[];
  status?: 'pending' | 'verified' | 'rejected';
}
