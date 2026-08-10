/**
 * @deprecated Ré-export de compatibilité.
 * Les DTO de vérification de checkpoint (action sur un jalon) sont définis de
 * façon canonique dans `./MilestoneDTO`.
 */

export type {
  CheckpointCategory,
  CheckpointVerificationResult,
  CheckpointVerificationResultDTO,
  CreateCheckpointVerificationDto,
  UpdateCheckpointVerificationDto,
  VerificationItemDTO,
  VerificationStatus,
  VerifyApprovalsRequestDto,
  VerifyCheckpointRequestDto,
  VerifyCheckpointResponseDto,
  VerifyDocumentsRequestDto,
  VerifyInspectionsRequestDto,
  VerifyResourcesRequestDto,
  VerifyServiceFaitRequestDto,
} from './MilestoneDTO';
