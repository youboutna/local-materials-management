/**
 * Contrôles métier du DQE : résultats déterministes, consommables par toute UI.
 * Aucun accès React ou fournisseur de données.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { TaxService } from '@/application/services/TaxService';

export interface ControlResult {
  code: string;
  label: string;
  passed: boolean;
  message: string;
  count?: number;
}

export class BoqControlsService {
  static evaluate(lines: BoqLineDTO[]): ControlResult[] {
    const priced = lines.filter((line) => (line.quantity ?? 0) > 0 && (line.unitPrice ?? 0) >= 0);
    const missingDesignation = lines.filter((line) => !line.designation?.trim());
    const missingUnit = lines.filter((line) => !line.unit?.trim());
    const missingPrice = lines.filter((line) => (line.unitPrice ?? 0) < 0);
    const fiscal = TaxService.summarize(lines, null);
    const fiscalIssues = fiscal.deductibilityIssues.length;

    return [
      {
        code: 'line_completeness',
        label: 'Lignes complètes',
        passed: missingDesignation.length === 0 && missingUnit.length === 0,
        message: missingDesignation.length || missingUnit.length
          ? `${missingDesignation.length + missingUnit.length} ligne(s) sans désignation ou unité.`
          : 'Désignation et unité renseignées.',
        count: missingDesignation.length + missingUnit.length,
      },
      {
        code: 'quantities_prices',
        label: 'Quantités et prix',
        passed: priced.length === lines.length,
        message: priced.length === lines.length
          ? 'Quantités et prix exploitables.'
          : `${lines.length - priced.length} ligne(s) à vérifier.`,
        count: lines.length - priced.length,
      },
      {
        code: 'wbs_mapping',
        label: 'Rattachement WBS',
        passed: lines.every((line) => Boolean(line.phaseId)),
        message: lines.every((line) => Boolean(line.phaseId))
          ? 'Toutes les lignes sont rattachées à une phase.'
          : `${lines.filter((line) => !line.phaseId).length} ligne(s) sans phase.`,
        count: lines.filter((line) => !line.phaseId).length,
      },
      {
        code: 'fiscal_lfr_2026',
        label: 'Contrôles fiscaux LFR 2026',
        passed: fiscalIssues === 0,
        message: fiscalIssues === 0
          ? 'Aucune anomalie fiscale détectée.'
          : `${fiscalIssues} anomalie(s) de déductibilité.`,
        count: fiscalIssues,
      },
      {
        code: 'document_ready',
        label: 'Document prêt à soumettre',
        passed: lines.length > 0 && missingPrice.length === 0,
        message: lines.length > 0 && missingPrice.length === 0
          ? 'Le document peut entrer dans le workflow.'
          : 'Ajoutez au moins une ligne et corrigez les prix.',
      },
    ];
  }
}
