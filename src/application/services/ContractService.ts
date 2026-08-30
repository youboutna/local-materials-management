/**
 * ContractService — chaînon « devis accepté → contrat / bon de commande ».
 *
 * Orchestration pure : la numérotation est déterministe, la persistance est
 * déléguée à `IContractRepository` (btp.contracts + btp.contract_lines).
 */

import type {
  IContractRepository,
  ContractQueryFilters,
} from '@/domain/repositories/IContractRepository';
import type {
  ContractRecordDTO,
  CreateContractRecordDTO,
  UpdateContractRecordDTO,
} from '@/dtos/entities/ContractRecordDTO';
import type {
  ContractLineDTO,
  CreateContractLineDTO,
  UpdateContractLineDTO,
} from '@/dtos/entities/ContractLineDTO';
import { SupabaseContractAdapter } from '@/infrastructure/adapters/supabase/SupabaseContractAdapter';
import { TenderEstimateService } from './TenderEstimateService';
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

export const CONTRACT_TYPES = ['works', 'supply', 'services', 'consulting', 'framework'] as const;

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  works: 'Travaux',
  supply: 'Fournitures',
  services: 'Services',
  consulting: 'Prestations intellectuelles',
  framework: 'Convention-cadre',
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
  /** Taux de TVA appliqué aux lignes copiées depuis le devis lauréat. */
  vatRate?: number;
}

/** Numéro de contrat lisible et stable : CTR-<AAAA>-<8 premiers du tender>. */
export function buildContractNumber(tenderId: string, at: Date = new Date()): string {
  // ✅ formatReference au lieu de tenderId.replace(/-/g, '').slice(0, 8)
  const suffix = formatReference(tenderId, '');
  return `CTR-${at.getFullYear()}-${suffix || 'MANUEL'}`;
}

/** Numéro pour un contrat saisi manuellement (hors appel d'offres). */
export function buildManualContractNumber(at: Date = new Date()): string {
  const stamp = `${at.getMonth() + 1}`.padStart(2, '0') + `${at.getDate()}`.padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `CTR-${at.getFullYear()}-${stamp}${rand}`;
}

export class ContractService {
  private estimateService = new TenderEstimateService();

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

  // ---------------------------------------------------------------------------
  // CRUD manuel (saisie ou import d'un contrat existant)
  // ---------------------------------------------------------------------------

  async createManual(input: Omit<CreateContractRecordDTO, 'contractNumber'> & { contractNumber?: string }): Promise<ContractRecordDTO> {
    if (!input.title?.trim()) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Intitulé du contrat requis');
    }

    const dto: CreateContractRecordDTO = {
      ...input,
      contractNumber: input.contractNumber?.trim() || buildManualContractNumber(),
      status: input.status ?? 'draft',
      contractType: input.contractType ?? 'works',
      currency: input.currency ?? 'MRU',
      totalAmount: Number(input.totalAmount || 0),
    };

    const validationResult = validateEntityLabel(dto, 'contract');
    if (!validationResult.valid) {
      console.warn('⚠️ Contract validation warning:', validationResult.error);
    }

    return this.repository.create(dto);
  }

  async update(id: string, patch: UpdateContractRecordDTO): Promise<ContractRecordDTO> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Contrat requis');
    return this.repository.update(id, patch);
  }

  async remove(id: string): Promise<void> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Contrat requis');
    await this.repository.delete(id);
  }

  /** Rattache le contrat signé (document GED ou URL) et bascule en « signé ». */
  async attachSignedDocument(
    id: string,
    payload: { documentId?: string | null; url?: string | null; signedAt?: string | null },
  ): Promise<ContractRecordDTO> {
    if (!id) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Contrat requis');
    return this.repository.update(id, {
      signedDocumentId: payload.documentId ?? null,
      signedDocumentUrl: payload.url ?? null,
      signedAt: payload.signedAt ?? new Date().toISOString(),
      status: 'signed',
    });
  }

  // ---------------------------------------------------------------------------
  // Lignes contractuelles (prix figés → décomptes / factures)
  // ---------------------------------------------------------------------------

  async listLines(contractId: string): Promise<ContractLineDTO[]> {
    if (!contractId) return [];
    return this.repository.findLines(contractId);
  }

  async addLine(line: CreateContractLineDTO): Promise<ContractLineDTO> {
    if (!line.contractId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Contrat requis');
    if (!line.designation?.trim()) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Désignation de la ligne requise');
    }
    const [created] = await this.repository.createLines([line]);
    await this.syncTotalFromLines(line.contractId);
    return created;
  }

  async updateLine(contractId: string, lineId: string, patch: UpdateContractLineDTO): Promise<ContractLineDTO> {
    const updated = await this.repository.updateLine(lineId, patch);
    await this.syncTotalFromLines(contractId);
    return updated;
  }

  async deleteLine(contractId: string, lineId: string): Promise<void> {
    await this.repository.deleteLine(lineId);
    await this.syncTotalFromLines(contractId);
  }

  /** Recalcule le montant du contrat depuis ses lignes (HT). */
  async syncTotalFromLines(contractId: string): Promise<number> {
    const lines = await this.repository.findLines(contractId);
    const total = lines.reduce((sum, l) => sum + (Number(l.amountHt) || 0), 0);
    if (lines.length > 0) {
      await this.repository.update(contractId, { totalAmount: total });
    }
    return total;
  }

  /**
   * Copie les lignes du devis attribué dans le contrat (prix figés).
   * Remplace les lignes existantes issues du devis pour rester idempotent.
   */
  async importLinesFromEstimate(
    contractId: string,
    estimateId: string,
    options: { vatRate?: number; currency?: string; replace?: boolean } = {},
  ): Promise<ContractLineDTO[]> {
    if (!contractId || !estimateId) return [];

    const items = await this.estimateService
      .getEstimateItems({ estimateId })
      .catch((e) => {
        console.warn('[ContractService] lecture du devis impossible:', e);
        return [];
      });

    if (items.length === 0) return [];

    if (options.replace !== false) {
      await this.repository.deleteLinesByContract(contractId);
    }

    const vatRate = options.vatRate ?? 0;
    const currency = options.currency ?? 'MRU';

    const payload: CreateContractLineDTO[] = items.map((item, index) => ({
      contractId,
      sourceEstimateItemId: item.id,
      lineCode: item.itemCode ?? null,
      designation: item.description || item.itemCode || `Ligne ${index + 1}`,
      unit: item.unit ?? null,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      vatRate,
      currency,
      category: item.category ?? null,
      displayOrder: index,
      metadata: {
        sourceEstimateId: estimateId,
        resourceKind: item.resourceKind ?? null,
        supplierId: item.supplierId ?? null,
      },
    }));

    const created = await this.repository.createLines(payload);
    await this.syncTotalFromLines(contractId);
    return created;
  }

  /**
   * Crée la trace contractuelle d'une attribution. Idempotent par appel d'offres :
   * si un contrat existe déjà pour ce tender, il est renvoyé tel quel.
   */
  async awardFromAcceptedQuote(input: AwardContractInput): Promise<ContractRecordDTO> {
    if (!input.projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID requis');
    if (!input.tenderId) throw new AppError(ErrorCode.VALIDATION_ERROR, "Appel d'offres requis");

    const existing = await this.repository.findByTenderId(input.tenderId).catch(() => []);
    if (existing.length > 0) {
      const contract = existing[0];
      // Assure la présence des lignes figées même si le contrat préexiste.
      const lines = await this.repository.findLines(contract.id).catch(() => []);
      if (lines.length === 0 && input.sourceEstimateId) {
        await this.importLinesFromEstimate(contract.id, input.sourceEstimateId, {
          vatRate: input.vatRate,
          currency: input.currency,
        });
        return (await this.repository.findById(contract.id)) ?? contract;
      }
      return contract;
    }

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

    const contract = await this.repository.create(dto);

    if (input.sourceEstimateId) {
      await this.importLinesFromEstimate(contract.id, input.sourceEstimateId, {
        vatRate: input.vatRate,
        currency: dto.currency,
      }).catch((e) => {
        console.warn('[ContractService] copie des lignes DQE impossible:', e);
        return [];
      });
      return (await this.repository.findById(contract.id)) ?? contract;
    }

    return contract;
  }
}

let instance: ContractService | null = null;

export function getContractService(): ContractService {
  if (!instance) instance = new ContractService();
  return instance;
}
