/**
 * Workflow Transformer
 * Handles conversion between workflow entities and DTOs
 */

export class WorkflowTransformer {
  static toProgressUpdateDTO(entity: WorkflowProgressUpdate): OnProgressUpdatedRequestDTO {
    return {
      phaseId: entity.phaseId,
      newProgress: entity.progress
    };
  }

  static toProgressUpdateEntity(dto: OnProgressUpdatedRequestDTO): WorkflowProgressUpdate {
    return {
      phaseId: dto.phaseId,
      progress: dto.newProgress
    };
  }

  static toPaymentRequestDTO(entity: WorkflowPaymentRequest): TriggerPaymentRequestDTO {
    return {
      phaseId: entity.phaseId,
      amount: entity.amount
    };
  }

  static toPaymentRequestEntity(dto: TriggerPaymentRequestDTO): WorkflowPaymentRequest {
    return {
      phaseId: dto.phaseId,
      amount: dto.amount
    };
  }
}
