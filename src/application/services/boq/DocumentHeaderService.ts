/**
 * src/application/services/boq/DocumentHeaderService.ts
 * Service de gestion des en-têtes documentaires BOQ
 *
 * ✅ Export des méthodes statiques + classe d'instance
 * ✅ Méthodes build, merge, validate disponibles
 */
import { getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import { resolveLineTax } from '@/config/referentials/boq/tax-regimes.referential';
import type {
  DocumentHeaderDTO,
  DocumentHeaderValidationDTO,
  DocumentPartyDTO,
} from '@/dtos/boq/DocumentHeaderDTO';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { IBoqDocumentHeaderRepository } from '@/domain/repositories/IBoqDocumentHeaderRepository';
import { DocumentHeaderTransformer } from '@/dtos/transforms/DocumentHeaderTransformer';
import { BoqSource } from '@/domain/entities/boq/BoqLine';

export interface HeaderContextInput {
  reference?: string | null;
  issueDate?: string | null;
  fiscalProfileCode?: string | null;
  facturxTypeCode?: string | null;
  sender?: Partial<DocumentPartyDTO> | null;
  recipients?: Array<Partial<DocumentPartyDTO>> | null;
}

const DEFAULT_VALIDITY_DAYS = 30;

const cleanParty = (p?: Partial<DocumentPartyDTO> | null): DocumentPartyDTO | null => {
  const name = String(p?.name ?? '').trim();
  if (!name) return null;
  return {
    id: p?.id ?? null,
    name,
    kind: p?.kind ?? null,
    taxId: p?.taxId ?? null,
    address: p?.address ?? null,
    phone: p?.phone ?? null,
    email: p?.email ?? null,
  };
};

// ================================================================
// ✅ SERVICE STATIQUE — Méthodes pures (build, merge, validate)
// ================================================================

export const DocumentHeaderService = {
  /** En-tête par défaut : émetteur du contexte + valeurs du profil fiscal. */
  build(input: HeaderContextInput): DocumentHeaderDTO {
    const profile = getFiscalProfile(input.fiscalProfileCode);
    return {
      reference: input.reference ?? null,
      issueDate: input.issueDate ?? new Date().toISOString().slice(0, 10),
      currency: profile.currency ?? 'MRU',
      validityDays: DEFAULT_VALIDITY_DAYS,
      facturxTypeCode: input.facturxTypeCode ?? '310',
      sender: cleanParty(input.sender) ?? { name: '' },
      recipients: (input.recipients ?? [])
        .map(cleanParty)
        .filter((p): p is DocumentPartyDTO => p !== null),
      notes: null,
    };
  },

  /** Fusionne un en-tête existant avec les valeurs du contexte. */
  merge(base: DocumentHeaderDTO | null, input: HeaderContextInput): DocumentHeaderDTO {
    const defaults = this.build(input);
    if (!base) return defaults;
    const sender = cleanParty(base.sender) ?? defaults.sender;
    const defined = Object.fromEntries(
      Object.entries(base).filter(([, v]) => v !== null && v !== undefined && v !== ''),
    ) as Partial<DocumentHeaderDTO>;
    return {
      ...defaults,
      ...defined,
      sender,
      recipients: base.recipients?.length ? base.recipients : defaults.recipients,
    };
  },

  /**
   * Validation bloquante avant PDF / signature / soumission.
   */
  validate(header: DocumentHeaderDTO, lines: BoqLineDTO[] = [], fiscalProfileCode?: string | null): DocumentHeaderValidationDTO {
    const issues: DocumentHeaderValidationDTO['issues'] = [];

    if (!String(header.sender?.name ?? '').trim()) {
      issues.push({ field: 'sender', messageKey: 'dqe.header.error.sender', fallback: "Émetteur manquant" });
    }
    if (!header.recipients?.some((r) => String(r.name ?? '').trim())) {
      issues.push({ field: 'recipients', messageKey: 'dqe.header.error.recipient', fallback: 'Aucun destinataire sélectionné' });
    }
    if (!String(header.currency ?? '').trim()) {
      issues.push({ field: 'currency', messageKey: 'dqe.header.error.currency', fallback: 'Devise manquante' });
    }
    if (!String(header.facturxTypeCode ?? '').trim()) {
      issues.push({ field: 'facturxTypeCode', messageKey: 'dqe.header.error.type_code', fallback: 'TypeCode Factur-X manquant' });
    }
    if (!header.validityDays || header.validityDays <= 0) {
      issues.push({ field: 'validityDays', messageKey: 'dqe.header.error.validity', fallback: 'Validité invalide' });
    }
    if (!String(header.issueDate ?? '').trim()) {
      issues.push({ field: 'issueDate', messageKey: 'dqe.header.error.issue_date', fallback: "Date d'émission manquante" });
    }

    const profile = getFiscalProfile(fiscalProfileCode);
    const missingVat = lines.some((l) => {
      const tax = resolveLineTax(
        {
          vatRate: l.vatRate,
          rasRate: l.rasRate,
          resourceType: l.resourceType ?? null,
          category: l.category ?? null,
          elementType: l.elementType ?? null,
          designation: l.designation ?? null,
        },
        profile,
      );
      return tax.vatRate === 0 && !tax.exemptionReason;
    });
    if (missingVat) {
      issues.push({ field: 'vatRate', messageKey: 'dqe.header.error.vat', fallback: 'Taux de TVA manquant sur au moins une ligne' });
    }

    return { valid: issues.length === 0, issues };
  },

  /** Libellé synthétique des destinataires (PDF / badges). */
  recipientsLabel(header: DocumentHeaderDTO): string {
    return (header.recipients ?? [])
      .map((r) => r.name)
      .filter(Boolean)
      .join(' · ');
  },
};

// ================================================================
// ✅ CLASSE D'INSTANCE — Service avec persistance
// ================================================================

export class DocumentHeaderServiceInstance {
  constructor(private repository: IBoqDocumentHeaderRepository) {}

  async save(documentId: string, header: DocumentHeaderDTO, source: BoqSource, userId?: string): Promise<DocumentHeaderDTO> {
    // Enrichir les kinds basés sur la source
    header.sender.kind = header.sender.kind ?? this.inferSenderKind(source);
    if (header.recipients.length > 0) {
      header.recipients[0].kind = header.recipients[0].kind ?? this.inferRecipientKind(source);
    }

    // Valider via la méthode statique
    const validation = DocumentHeaderService.validate(header);
    if (!validation.valid) {
      const errors = validation.issues.map(i => i.fallback).join(' · ');
      throw new Error(`En-tête invalide: ${errors}`);
    }

    return this.repository.save(documentId, header, userId);
  }

  async findByDocumentId(documentId: string): Promise<DocumentHeaderDTO | null> {
    return this.repository.findByDocumentId(documentId);
  }

  async findById(id: string): Promise<DocumentHeaderDTO | null> {
    return this.repository.findById(id);
  }

  async updateWorkflowStage(documentId: string, stage: string): Promise<void> {
    await this.repository.updateWorkflowStage(documentId, stage);
  }

  async updateSignature(documentId: string, signedBy: string, role: string): Promise<void> {
    await this.repository.updateSignature(documentId, signedBy, new Date().toISOString(), role);
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    await this.repository.deleteByDocumentId(documentId);
  }

  async getForDocument(documentId: string, defaultValue?: DocumentHeaderDTO): Promise<DocumentHeaderDTO> {
    const header = await this.repository.findByDocumentId(documentId);
    if (header) return header;
    if (defaultValue) return defaultValue;
    return DocumentHeaderService.build({
      reference: null,
      issueDate: new Date().toISOString().slice(0, 10),
      facturxTypeCode: '310',
      sender: { name: '' },
      recipients: [],
    });
  }

  private inferSenderKind(source: BoqSource): string {
    const mapping: Record<BoqSource, string> = {
      'dqe': 'moe',
      'tender_estimate': 'moe',
      'supplier_bid': 'supplier',
      'invoice': 'supplier',
      'quantity_takeoff': 'employee',
    };
    return mapping[source] ?? 'unknown';
  }

  private inferRecipientKind(source: BoqSource): string {
    const mapping: Record<BoqSource, string> = {
      'dqe': 'hierarchy',
      'tender_estimate': 'supplier',
      'supplier_bid': 'moe',
      'invoice': 'moe',
      'quantity_takeoff': 'project_manager',
    };
    return mapping[source] ?? 'unknown';
  }
}

// ================================================================
// ✅ FACTORY — Créer une instance avec repository
// ================================================================

export function createDocumentHeaderService(repository: IBoqDocumentHeaderRepository): DocumentHeaderServiceInstance {
  return new DocumentHeaderServiceInstance(repository);
}