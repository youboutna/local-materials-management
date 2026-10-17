import type { InitiatorRole } from '@/dtos/entities/PaymentInitiationDTO';

export interface PaymentInitiationPolicy {
  limits: Record<InitiatorRole, number>;
  approvalChain: Record<InitiatorRole, InitiatorRole[]>;
  inspectorJustificationMinLength: number;
  supplierResponseDays: number;
  approvalStepDays: number;
}

/** Explicit legacy defaults; deployments can supply their validated policy to the service. */
export const PAYMENT_INITIATION_POLICY: PaymentInitiationPolicy = {
  limits: { inspector: 500000, project_manager: 2000000, manager: 2000000, supervisor: 5000000, director: 20000000 },
  approvalChain: { inspector: ['manager', 'supervisor', 'director'], project_manager: ['supervisor', 'director'], manager: ['supervisor', 'director'], supervisor: ['director'], director: [] },
  inspectorJustificationMinLength: 50,
  supplierResponseDays: 7,
  approvalStepDays: 3,
};