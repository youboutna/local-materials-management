/**
 * Resource Allocation Referential
 * Règles d'affectation par défaut : pour un type de tâche/lot, combien d'heures
 * par qualification interne, quels prestataires externes types, quels matériels.
 *
 * Consommé par le DQE Wizard (suggestions) et par AwardedTenderToProjectService
 * (génération du plan de charge post-attribution).
 *
 * @see docs/ARCHITECTURE_REFERENTIELS.md
 */

export type ResourceKind = 'internal_qualification' | 'external_provider' | 'material';

export interface ResourceAllocationRule {
  /** Clé métier (code DQE ou pattern de désignation). */
  matcher: {
    itemCodePrefix?: string;
    designationRegex?: string;
    lotCode?: string;
  };
  /** Ressources allouées par unité d'œuvre (quantité=1). */
  perUnit: Array<{
    kind: ResourceKind;
    /** Référence : id qualification, id catégorie prestataire, id article catalogue. */
    referenceKey: string;
    /** Libellé humain pour affichage. */
    label: string;
    /** Quantité par unité DQE (heures, jours, unités). */
    quantityPerUnit: number;
    /** Unité de la ressource (h, j, u). */
    unit: 'h' | 'j' | 'u';
  }>;
}

export const DEFAULT_RESOURCE_ALLOCATION_RULES: ResourceAllocationRule[] = [
  {
    matcher: { designationRegex: '(revêtement|enrobé|bitume)' },
    perUnit: [
      { kind: 'internal_qualification', referenceKey: 'QUAL_CHEF_CHANTIER', label: 'Chef de chantier', quantityPerUnit: 0.5, unit: 'h' },
      { kind: 'internal_qualification', referenceKey: 'QUAL_CONDUCTEUR_ENGINS', label: 'Conducteur d\'engins', quantityPerUnit: 1.0, unit: 'h' },
      { kind: 'external_provider', referenceKey: 'PROV_ETUDE_TECHNIQUE', label: 'Bureau d\'études', quantityPerUnit: 0.1, unit: 'j' },
    ],
  },
  {
    matcher: { designationRegex: '(terrassement|excavation|remblai)' },
    perUnit: [
      { kind: 'internal_qualification', referenceKey: 'QUAL_CONDUCTEUR_ENGINS', label: 'Conducteur d\'engins', quantityPerUnit: 0.8, unit: 'h' },
      { kind: 'material', referenceKey: 'MAT_PELLE_MECANIQUE', label: 'Pelle mécanique', quantityPerUnit: 0.5, unit: 'h' },
    ],
  },
];

export function findAllocationRule(
  itemCode: string,
  designation: string,
  lotCode?: string,
  rules: ResourceAllocationRule[] = DEFAULT_RESOURCE_ALLOCATION_RULES,
): ResourceAllocationRule | undefined {
  return rules.find((r) => {
    if (r.matcher.lotCode && r.matcher.lotCode !== lotCode) return false;
    if (r.matcher.itemCodePrefix && !itemCode.startsWith(r.matcher.itemCodePrefix)) return false;
    if (r.matcher.designationRegex) {
      const re = new RegExp(r.matcher.designationRegex, 'i');
      if (!re.test(designation)) return false;
    }
    return true;
  });
}
