import { CheckpointDTO } from './CheckpointDTO';

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';
export type CheckpointCategory = 'quality' | 'safety' | 'documentation' | 'approval' | 'delivery';

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
entIds: string[];
  projectId: string;
}

export interface VerifyApprovalsRequestDto {
  requiredApprovalIds: string[];
ring;
}

export interface VerifyServiceFaitRequestDto {
  checkpointId: string;
  projectId: string;
}

erifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  documents?: string[];
  status: 'pending' | 'verified' | 'rejected';
}

exporverifiedBy: string;
  notes?: string;
  documents?: string[];
}

export interface UpdateCheckpointVeriding' | 'verified' | 'rejected';
}