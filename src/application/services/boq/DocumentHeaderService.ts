/**
 * DocumentHeaderService — construction et validation de l'en-tête documentaire.
 *
 * Doctrine : la génération PDF, la signature et la soumission sont BLOQUÉES
 * tant que l'en-tête est incomplet (destinataire, devise, taux de TVA).
 * L'émetteur est déduit du contexte (organisation propriétaire / fournisseur).
 *
 * Pure TS — aucune dépendance React / Supabase.
 */
import { getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import { resolveLineTax } from '@/config/referentials/boq/tax-regimes.referential';
import type {
  DocumentHeaderDTO,
  DocumentHeaderValidationDTO,
  DocumentPartyDTO,
} from '@/dtos/boq/DocumentHeaderDTO';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

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

  /** Fusionne un en-tête existant avec les valeurs du contexte (émetteur auto). */
  merge(base: DocumentHeaderDTO | null, input: HeaderContextInput): DocumentHeaderDTO {
    const defaults = this.build(input);
    if (!base) return defaults;
    const sender = cleanParty(base.sender) ?? defaults.sender;
    return {
      ...defaults,
      ...base,
      sender,
      recipients: base.recipients?.length ? base.recipients : defaults.recipients,
    };
  },

  /**
   * Validation bloquante avant PDF / signature / soumission.
   * Un taux de TVA nul est accepté uniquement si le régime porte une exonération.
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
      return tax.vatRate === 0 && tax.vatCategoryCode === 'S';
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

export default DocumentHeaderService;
