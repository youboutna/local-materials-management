/**
 * EdbValidationService — contrôle de cohérence d'une Expression de Besoin (EDB)
 * et application de la décision du validateur.
 *
 * Règles (pures, sans React ni Supabase) :
 *  - Erreur BLOQUANTE : quantité × PU ≠ montant déclaré (tolérance ±1 MRU).
 *  - Alerte NON bloquante : écart entre le budget restant du projet et le total DQE.
 *  - Aucune écriture n'est effectuée ici : le service produit un rapport et des
 *    transformations de lignes que l'UI applique après décision.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type {
  EdbBudgetDecision,
  EdbBudgetDiscrepancy,
  EdbLineError,
  EdbValidationReport,
  EdbWarning,
} from '@/dtos/boq/EdbValidationDTO';
import { checkEdbCoherence, type EdbPayload } from './parsers/JsonBoqParser';

const TOLERANCE = 1;

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/\s+/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export class EdbValidationService {
  /** Erreurs de calcul ligne à ligne (bloquantes). */
  static collectLineErrors(edb: EdbPayload): EdbLineError[] {
    const errors: EdbLineError[] = [];
    for (const lot of edb.lots ?? []) {
      for (const item of lot.items ?? []) {
        const q = num(item.quantity);
        const pu = num(item.unitPriceMRU ?? item.unitPrice);
        const declared = num(item.totalMRU);
        if (q == null || pu == null || declared == null) continue;
        const computed = q * pu;
        if (Math.abs(computed - declared) <= TOLERANCE) continue;
        const designation = item.description ?? item.designation ?? '(sans désignation)';
        errors.push({
          lotId: lot.id ?? lot.designation ?? null,
          designation,
          unit: item.unit ?? null,
          quantity: q,
          unitPrice: pu,
          declaredTotal: declared,
          computedTotal: computed,
          message:
            `${q.toLocaleString('fr-FR')} × ${pu.toLocaleString('fr-FR')} = ` +
            `${computed.toLocaleString('fr-FR')} MRU ≠ montant déclaré ${declared.toLocaleString('fr-FR')} MRU` +
            (item.unit ? ` (unité « ${item.unit} » : PU probablement forfaitaire)` : ''),
          suggestedFix: { unit: 'forfait', quantity: 1, unitPrice: declared },
        });
      }
    }
    return errors;
  }

  /** Écart budget projet (reste à réaliser) ↔ total DQE. */
  static computeBudgetDiscrepancy(projectBudget: number, dqeTotal: number): EdbBudgetDiscrepancy | null {
    if (!Number.isFinite(projectBudget) || projectBudget <= 0) return null;
    const difference = round2(dqeTotal - projectBudget);
    if (Math.abs(difference) <= TOLERANCE) return null;
    return {
      projectBudget: round2(projectBudget),
      dqeTotal: round2(dqeTotal),
      difference,
      percentage: round2((Math.abs(difference) / projectBudget) * 100),
    };
  }

  /**
   * Rapport complet.
   * @param projectBudget reste à réaliser du projet (si connu). À défaut, on
   *        utilise `metadata.remainingBudgetMRU` de l'EDB.
   */
  static buildReport(
    edb: EdbPayload,
    lines: BoqLineDTO[],
    projectBudget?: number | null,
  ): EdbValidationReport {
    const meta = (edb.metadata ?? {}) as Record<string, unknown>;
    const errors = EdbValidationService.collectLineErrors(edb);
    const dqeTotal = round2(lines.reduce((s, l) => s + (l.totalHt ?? 0), 0));
    const lotsRemaining = round2(
      (edb.lots ?? []).reduce((s, l) => s + (num(l.remainingAmountMRU) ?? 0), 0),
    );

    const reference = projectBudget ?? num(meta.remainingBudgetMRU) ?? 0;
    const budgetDiscrepancy = EdbValidationService.computeBudgetDiscrepancy(reference, lotsRemaining || dqeTotal);

    const warnings: EdbWarning[] = [];
    if (budgetDiscrepancy) {
      warnings.push({
        code: 'BUDGET_DISCREPANCY',
        message:
          `Écart budgétaire global : ${budgetDiscrepancy.difference > 0 ? '+' : ''}` +
          `${budgetDiscrepancy.difference.toLocaleString('fr-FR')} MRU ` +
          `(${budgetDiscrepancy.percentage.toFixed(2)} % du budget). ` +
          `Budget projet restant : ${budgetDiscrepancy.projectBudget.toLocaleString('fr-FR')} MRU — ` +
          `Total DQE : ${budgetDiscrepancy.dqeTotal.toLocaleString('fr-FR')} MRU.`,
      });
    }
    // Reprend les contrôles de planning / budgets de phases déjà existants.
    for (const w of checkEdbCoherence(edb)) {
      if (w.includes('au-delà de la fin projet')) warnings.push({ code: 'PHASE_OUT_OF_WINDOW', message: w });
      else if (w.startsWith('Budgets de phases')) warnings.push({ code: 'PHASE_BUDGET_MISMATCH', message: w });
      else if (w.startsWith('Reste à réaliser déclaré')) warnings.push({ code: 'INFO', message: w });
    }

    const status = errors.length
      ? 'BLOCKED_BY_ERRORS'
      : budgetDiscrepancy
        ? 'AWAITING_VALIDATOR_DECISION'
        : 'READY';

    return {
      status,
      errors,
      warnings,
      budgetDiscrepancy,
      totals: { lines: lines.length, dqeTotal, lotsRemaining },
    };
  }

  /**
   * Applique les corrections proposées (unité forfaitaire, quantité 1) aux
   * lignes importées correspondantes (appariement par désignation).
   */
  static applyLineFixes(lines: BoqLineDTO[], errors: EdbLineError[]): BoqLineDTO[] {
    if (!errors.length) return lines;
    const byDesignation = new Map(errors.map((e) => [e.designation.trim().toLowerCase(), e]));
    return lines.map((line) => {
      const err = byDesignation.get((line.designation ?? '').trim().toLowerCase());
      if (!err) return line;
      const { unit, quantity, unitPrice } = err.suggestedFix;
      return { ...line, unit, quantity, unitPrice, totalHt: round2(quantity * unitPrice) };
    });
  }

  /**
   * Réduction proportionnelle du DQE pour atteindre `targetTotal` (option B).
   * Les PU sont ajustés, les quantités restent inchangées (traçabilité métré).
   */
  static scaleLinesToTotal(lines: BoqLineDTO[], targetTotal: number): BoqLineDTO[] {
    const current = lines.reduce((s, l) => s + (l.totalHt ?? 0), 0);
    if (!current || !Number.isFinite(targetTotal) || targetTotal <= 0) return lines;
    const ratio = targetTotal / current;
    return lines.map((l) => {
      const totalHt = round2((l.totalHt ?? 0) * ratio);
      const unitPrice = l.quantity ? round2(totalHt / l.quantity) : (l.unitPrice != null ? round2(l.unitPrice * ratio) : null);
      return { ...l, unitPrice, totalHt };
    });
  }

  /**
   * Traduit la décision du validateur en effets à appliquer.
   * Aucune écriture : l'appelant persiste les lignes et/ou le budget projet.
   */
  static applyDecision(
    lines: BoqLineDTO[],
    report: EdbValidationReport,
    decision: EdbBudgetDecision,
  ): { lines: BoqLineDTO[]; newProjectBudget: number | null; keepDiscrepancyAlert: boolean; note: string } {
    const d = report.budgetDiscrepancy;
    if (!d) return { lines, newProjectBudget: null, keepDiscrepancyAlert: false, note: 'Aucun écart budgétaire.' };

    switch (decision) {
      case 'ADJUST_PROJECT_BUDGET':
        return {
          lines,
          newProjectBudget: round2(d.dqeTotal),
          keepDiscrepancyAlert: false,
          note:
            `Budget restant du projet réévalué de ${d.projectBudget.toLocaleString('fr-FR')} à ` +
            `${d.dqeTotal.toLocaleString('fr-FR')} MRU (écart ${d.difference.toLocaleString('fr-FR')} MRU absorbé).`,
        };
      case 'ADJUST_DQE':
        return {
          lines: EdbValidationService.scaleLinesToTotal(lines, d.projectBudget),
          newProjectBudget: null,
          keepDiscrepancyAlert: false,
          note:
            `DQE réduit proportionnellement à ${d.projectBudget.toLocaleString('fr-FR')} MRU ` +
            `(−${Math.abs(d.difference).toLocaleString('fr-FR')} MRU).`,
        };
      case 'KEEP_DISCREPANCY':
      default:
        return {
          lines,
          newProjectBudget: null,
          keepDiscrepancyAlert: true,
          note:
            `Écart DQE/Budget conservé (${d.difference.toLocaleString('fr-FR')} MRU, ` +
            `${d.percentage.toFixed(2)} %) — alerte permanente tableau de bord et rapports.`,
        };
    }
  }
}
