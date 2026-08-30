/**
 * ContractService — chaînon « devis accepté → contrat / bon de commande ».
 *
 * Orchestration pure : la numérotation est déterministe, la persistance est
 * déléguée à `IContractRepository` (btp.contracts).
 */

import type {
  IContractRepository,
  ContractQueryFilters,
} from '@/domain/repositories/IContractRepository';
import type {
  ContractRecordDTO,
  CreateContractRecordDTO,
} from '@/dtos/entities/ContractRecordDTO';
import { SupabaseContractAdapter } from '@/infrastructure/adapters/supabase/SupabaseContractAdapter';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// ✅ IMPORT formatReference et validateEntityLabel
import { formatReference, validateEntityLabel } from '@/utils/entityLabels';

/** Statuts autorisés — référentiel unique côté application. */
export const CONTRACT_STATUSES = [
  'draft',
  'signed',
  'active',
  'suspended',
  'closed',
  'cancelled',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  signed: 'Signé',
  active: 'En cours',
  suspended: 'Suspendu',
  closed: 'Clôturé',
  cancelled: 'Annulé',
};

export interface AwardContractInput {
  projectId: string;
  tenderId: string;
  supplierId?: string | null;
  supplierName?: string | null;
  sourceEstimateId?: string | null;
  totalAmount: number;
  currency?: string;
  projectName?: string | null;
}

/** Numéro de contrat lisible et stable : CTR-<AAAA>-<8 premiers du tender>. */
export function buildContractNumber(tenderId: string, at: Date = new Date()): string {
  // ✅ formatReference au lieu de tenderId.replace(/-/g, '').slice(0, 8)
  const suffix = formatReference(tenderId, '');
  return `CTR-${at.getFullYear()}-${suffix || 'MANUEL'}`;
}

export class ContractService {
  constructor(private repository: IContractRepository = new SupabaseContractAdapter()) {}

  /** Tous les contrats (vue administration / suivi). */
  async listAll(filters: ContractQueryFilters = {}): Promise<ContractRecordDTO[]> {
    return this.repository.findAll(filters);
  }

  async getById(id: string): Promise<ContractRecordDTO | null> {
    if (!id) return null;
    return this.repository.findById(id);
  }

  /** Transition de statut contrôlée (draft → signed → active → closed / cancelled). */
  async changeStatus(id: string, status: string): Promise<ContractRecordDTO> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Contrat requis');
    if (!(CONTRACT_STATUSES as readonly string[]).includes(status)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, `Statut de contrat invalide : ${status}`);
    }
    return this.repository.updateStatus(id, status);
  }

  async listByProject(projectId: string): Promise<ContractRecordDTO[]> {
    if (!projectId) return [];
    return this.repository.findByProjectId(projectId);
  }

  async listByTender(tenderId: string): Promise<ContractRecordDTO[]> {
    if (!tenderId) return [];
    return this.repository.findByTenderId(tenderId);
  }

  /** Contrats signés visibles par un prestataire (portail fournisseur). */
  async listBySupplier(supplierId: string): Promise<ContractRecordDTO[]> {
    if (!supplierId) return [];
    return this.repository.findBySupplierId(supplierId);
  }

  /**
   * Crée la trace contractuelle d'une attribution. Idempotent par appel d'offres :
   * si un contrat existe déjà pour ce tender, il est renvoyé tel quel.
   */
  async awardFromAcceptedQuote(input: AwardContractInput): Promise<ContractRecordDTO> {
    if (!input.projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID requis');
    if (!input.tenderId) throw new AppError(ErrorCode.VALIDATION_ERROR, "Appel d'offres requis");

    const existing = await this.repository.findByTenderId(input.tenderId).catch(() => []);
    if (existing.length > 0) return existing[0];

    // ✅ formatReference au lieu de input.tenderId.slice(0, 8)
    const tenderRef = formatReference(input.tenderId, '');

    const dto: CreateContractRecordDTO = {
      contractNumber: buildContractNumber(input.tenderId),
      title: input.projectName
        ? `Contrat — ${input.projectName}`
        : `Contrat d'attribution ${tenderRef}`,
      projectId: input.projectId,
      tenderId: input.tenderId,
      supplierId: input.supplierId ?? null,
      sourceEstimateId: input.sourceEstimateId ?? null,
      status: 'signed',
      startDate: new Date().toISOString().slice(0, 10),
      totalAmount: Number(input.totalAmount || 0),
      currency: input.currency ?? 'MRU',
      metadata: input.supplierName ? { supplierName: input.supplierName } : null,
    };

    // ✅ Validation du contrat
    const validationResult = validateEntityLabel(dto, 'contract');
    if (!validationResult.valid) {
      console.warn('⚠️ Contract validation warning:', validationResult.error);
    }

    return this.repository.create(dto);
  }
}

let instance: ContractService | null = null;

export function getContractService(): ContractService {
  if (!instance) instance = new ContractService();
  return instance;
}