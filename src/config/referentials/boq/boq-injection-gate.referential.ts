/**
 * BOQ_INJECTION_GATE_REFERENTIAL — gouvernance de l'injection des devis et
 * décomptes dans la planification / l'exécution du projet.
 *
 * Règle métier :
 *  • Un DEVIS (issu d'une soumission d'appel d'offres, évaluation puis
 *    attribution) ne peut alimenter la planification / l'exécution qu'après
 *    validation par le GESTIONNAIRE DE PROJET.
 *  • Un DÉCOMPTE / FACTURE (rattaché à la réalisation de tâches / phases /
 *    jalons) ne peut être injecté qu'après validation par le CONSULTANT.
 *  • Le gestionnaire de projet et le directeur portent implicitement la
 *    casquette consultant (validation possible sans désignation explicite).
 *
 * Aucune de ces valeurs ne doit être codée en dur dans les services ou l'UI.
 */

export type BoqInjectionKind = 'devis' | 'decompte';

export interface BoqInjectionGateRule {
  /** Libellé métier du document. */
  label: string;
  /** Cible de l'injection (information UI). */
  target: 'planning' | 'execution';
  /** Rôles applicatifs habilités à valider l'injection. */
  validatorRoles: string[];
  /** Le validateur doit-il être consultant (désigné ou implicite) ? */
  requiresConsultant: boolean;
  /** Statuts de lignes acceptés une fois la validation apposée. */
  requiredStatuses: string[];
  /** Origine attendue du document (traçabilité). */
  expectedOrigin: string;
  /** Message de blocage affiché lorsque la validation manque. */
  blockedMessage: string;
  /** Message d'alerte lorsque l'origine attendue n'est pas tracée. */
  originWarning: string;
}

export interface BoqInjectionGateReferential {
  /** Clé de métadonnée portant la validation d'injection sur chaque ligne. */
  metadataKey: string;
  /** Rôles portant implicitement la casquette consultant. */
  implicitConsultantRoles: string[];
  /** `dqeType` considérés comme devis / décompte. */
  kindByDqeType: Record<string, BoqInjectionKind>;
  /** `source` de lignes considérées comme devis / décompte. */
  kindBySource: Record<string, BoqInjectionKind>;
  gates: Record<BoqInjectionKind, BoqInjectionGateRule>;
}

export const BOQ_INJECTION_GATE_REFERENTIAL: BoqInjectionGateReferential = {
  metadataKey: 'injectionValidation',
  implicitConsultantRoles: ['project_manager', 'manager', 'director', 'admin', 'super_admin'],
  kindByDqeType: {
    devis: 'devis',
    quote: 'devis',
    decompte: 'decompte',
    facture: 'decompte',
    invoice: 'decompte',
  },
  kindBySource: {
    supplier_bid: 'devis',
    invoice: 'decompte',
  },
  gates: {
    devis: {
      label: 'Devis fournisseur',
      target: 'planning',
      validatorRoles: ['project_manager', 'manager', 'director', 'admin', 'super_admin'],
      requiresConsultant: false,
      requiredStatuses: ['validated', 'signed', 'invoiced', 'paid'],
      expectedOrigin: 'tender_submission',
      blockedMessage:
        "Devis non injectable : la validation du gestionnaire de projet est requise avant alimentation de la planification.",
      originWarning:
        "Devis sans soumission d'appel d'offres tracée : l'origine (soumission, évaluation, attribution) devra être justifiée.",
    },
    decompte: {
      label: 'Décompte / facture',
      target: 'execution',
      validatorRoles: [
        'consultant',
        'engineering_consultant',
        'project_manager',
        'manager',
        'director',
        'admin',
        'super_admin',
      ],
      requiresConsultant: true,
      requiredStatuses: ['validated', 'signed', 'invoiced', 'paid'],
      expectedOrigin: 'project_execution',
      blockedMessage:
        "Décompte non injectable : la validation du consultant est requise (avancement des tâches / phases / jalons).",
      originWarning:
        'Décompte non rattaché à une phase ou un jalon : le lien avec la réalisation devra être précisé.',
    },
  },
};

export interface InjectionValidationStamp {
  kind: BoqInjectionKind;
  validatedBy: string;
  validatorRole: string;
  validatedAt: string;
  comment?: string | null;
}

const normalize = (value?: string | null): string =>
  String(value ?? '').trim().toLowerCase();

/** Détermine la nature d'injection d'une ligne (null = prévisionnel, non concerné). */
export function resolveInjectionKind(input: {
  dqeType?: string | null;
  source?: string | null;
}): BoqInjectionKind | null {
  const byType = BOQ_INJECTION_GATE_REFERENTIAL.kindByDqeType[normalize(input.dqeType)];
  if (byType) return byType;
  const bySource = BOQ_INJECTION_GATE_REFERENTIAL.kindBySource[normalize(input.source)];
  return bySource ?? null;
}

/** Vrai si l'acteur peut valider l'injection de ce type de document. */
export function canValidateInjection(
  kind: BoqInjectionKind,
  roles: string[] | undefined,
  options?: { isDesignatedConsultant?: boolean },
): boolean {
  const gate = BOQ_INJECTION_GATE_REFERENTIAL.gates[kind];
  const normalized = (roles ?? []).map(normalize);
  const hasRole = gate.validatorRoles.some((r) => normalized.includes(normalize(r)));
  if (!hasRole) return false;
  if (!gate.requiresConsultant) return true;
  const implicit = BOQ_INJECTION_GATE_REFERENTIAL.implicitConsultantRoles.some((r) =>
    normalized.includes(normalize(r)),
  );
  return implicit || !!options?.isDesignatedConsultant;
}

/** Lit le tampon de validation d'injection posé sur une ligne. */
export function readInjectionStamp(
  metadata?: Record<string, unknown> | null,
): InjectionValidationStamp | null {
  const raw = (metadata ?? {})[BOQ_INJECTION_GATE_REFERENTIAL.metadataKey];
  if (!raw || typeof raw !== 'object') return null;
  const stamp = raw as Partial<InjectionValidationStamp>;
  if (!stamp.kind || !stamp.validatedBy || !stamp.validatedAt) return null;
  return stamp as InjectionValidationStamp;
}
