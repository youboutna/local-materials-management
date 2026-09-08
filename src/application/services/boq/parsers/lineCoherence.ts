/**
 * lineCoherence — rapport de validation d'une ligne DQE importée.
 *
 * Contrôles non bloquants (l'import n'est jamais interrompu) :
 *  1. décomposition technique du libellé (norme, type, section, conducteurs…) ;
 *  2. unité technique du libellé vs unité de quantité de la colonne
 *     (ex. « 4x150 mm² » = caractéristique, « m » = unité de quantité correcte) ;
 *  3. prix unitaire vs fourchette de marché du référentiel ;
 *  4. vérification arithmétique HT / TVA / TTC.
 *
 * Pure TS — seuils et fourchettes viennent de `technical-specs.referential`.
 */
import {
  detectProductFamily,
  extractConductors,
  isExpectedQuantityUnit,
  SPEC_PATTERNS,
  TECHNICAL_UNITS,
  type TechnicalUnitKind,
} from '@/config/referentials/boq/technical-specs.referential';

export type CoherenceSeverity = 'ok' | 'info' | 'warning';
export type CoherenceStatus = 'ok' | 'warning';
export type CoherenceDecision = 'accept' | 'accept_with_comment';

export interface CoherenceFinding {
  code: string;
  severity: CoherenceSeverity;
  /** Intitulé court affiché dans le rapport. */
  label: string;
  message: string;
  suggestion?: string;
}

export interface LineCoherence {
  familyCode: string | null;
  familyLabel: string | null;
  /** Caractéristiques techniques extraites du libellé (Section, Norme, Type…). */
  specs: Array<{ key: string; label: string; value: string }>;
  conductors: number | null;
  technicalUnits: Array<{ kind: TechnicalUnitKind; label: string }>;
  findings: CoherenceFinding[];
  status: CoherenceStatus;
  decision: CoherenceDecision;
  /** Contrôles arithmétiques (informatifs). */
  computed: { totalHt: number | null; vatAmount: number | null; totalTtc: number | null };
}

export interface LineCoherenceInput {
  designation?: string | null;
  unit?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalHt?: number | null;
  vatRate?: number | null;
  /** Tolérance absolue sur le contrôle quantité × P.U. = montant. */
  tolerance?: number;
}

const fr = (n: number): string => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

export function analyzeLineCoherence(input: LineCoherenceInput): LineCoherence {
  const designation = String(input.designation ?? '').trim();
  const unit = String(input.unit ?? '').trim();
  const quantity = Number.isFinite(input.quantity ?? NaN) ? Number(input.quantity) : 0;
  const unitPrice = input.unitPrice ?? null;
  const vatRate = input.vatRate == null ? null : input.vatRate > 1 ? input.vatRate / 100 : input.vatRate;
  const findings: CoherenceFinding[] = [];

  const family = detectProductFamily(designation);

  const specs = SPEC_PATTERNS.flatMap(({ key, labelFr, re, format }) => {
    const m = re.exec(designation);
    if (!m) return [];
    return [{ key, label: labelFr, value: format ? format(m) : m[1].replace(/\s+/g, ' ').trim() }];
  });

  const technicalUnits = TECHNICAL_UNITS.filter((t) => t.re.test(designation)).map((t) => ({
    kind: t.kind,
    label: t.labelFr,
  }));

  // 1. Unité technique du libellé vs unité de quantité.
  if (technicalUnits.length && unit) {
    const expected = family ? isExpectedQuantityUnit(family, unit) : true;
    const techLabels = technicalUnits.map((t) => t.label).join(', ');
    if (expected) {
      findings.push({
        code: 'UNIT_TECHNICAL_SPEC',
        severity: 'warning',
        label: 'Unité',
        message: `La désignation mentionne une ${techLabels} ; l'unité de quantité « ${unit} » reste correcte — la caractéristique technique n'est pas une unité de mesure.`,
        suggestion: `Clarifier le libellé : quantité en « ${unit} », ${techLabels} = spécification produit.`,
      });
    } else {
      findings.push({
        code: 'UNIT_UNEXPECTED',
        severity: 'warning',
        label: 'Unité',
        message: `Unité « ${unit} » inhabituelle pour ${family?.labelFr ?? 'cette famille'} (attendu : ${family?.quantityUnits.join(', ')}).`,
        suggestion: 'Vérifier l’unité de quantité auprès du fournisseur.',
      });
    }
  } else if (family && unit && !isExpectedQuantityUnit(family, unit)) {
    findings.push({
      code: 'UNIT_UNEXPECTED',
      severity: 'warning',
      label: 'Unité',
      message: `Unité « ${unit} » inhabituelle pour ${family.labelFr} (attendu : ${family.quantityUnits.join(', ')}).`,
      suggestion: 'Vérifier l’unité de quantité auprès du fournisseur.',
    });
  }

  // 2. Prix unitaire vs marché.
  const range = family?.marketPrice;
  if (range && unitPrice != null && unitPrice > 0 && isExpectedQuantityUnit(family, unit)) {
    const mid = (range.min + range.max) / 2;
    const deviation = (unitPrice - mid) / mid;
    if (Math.abs(deviation) > range.tolerance) {
      const pct = `${deviation > 0 ? '+' : ''}${(deviation * 100).toFixed(1)} %`;
      findings.push({
        code: 'PRICE_OUT_OF_RANGE',
        severity: 'warning',
        label: 'Prix unitaire',
        message: `${fr(unitPrice)} ${range.currency}/${range.unit} contre un marché de ${fr(range.min)} – ${fr(range.max)} (écart ${pct}).`,
        suggestion: 'Confirmer le prix auprès du fournisseur (remise volume possible).',
      });
    } else {
      findings.push({
        code: 'PRICE_IN_RANGE',
        severity: 'ok',
        label: 'Prix unitaire',
        message: `${fr(unitPrice)} ${range.currency}/${range.unit} conforme au marché (${fr(range.min)} – ${fr(range.max)}).`,
      });
    }
  }

  // 3. Contrôles arithmétiques.
  const tolerance = input.tolerance ?? 1;
  const expectedHt = unitPrice != null ? quantity * unitPrice : null;
  const totalHt = input.totalHt ?? expectedHt;
  const vatAmount = totalHt != null && vatRate != null ? totalHt * vatRate : null;
  const totalTtc = totalHt != null ? totalHt + (vatAmount ?? 0) : null;

  if (expectedHt != null && input.totalHt != null) {
    const gap = Math.abs(expectedHt - input.totalHt);
    findings.push(
      gap <= tolerance
        ? {
            code: 'MATH_OK',
            severity: 'ok',
            label: 'Calculs',
            message: `${fr(quantity)} × ${fr(unitPrice ?? 0)} = ${fr(input.totalHt)} ✓${vatAmount != null ? ` · TVA ${fr(vatAmount)} · TTC ${fr(totalTtc ?? 0)}` : ''}`,
          }
        : {
            code: 'MATH_MISMATCH',
            severity: 'warning',
            label: 'Calculs',
            message: `Montant déclaré ${fr(input.totalHt)} ≠ ${fr(quantity)} × ${fr(unitPrice ?? 0)} = ${fr(expectedHt)} (écart ${fr(gap)}).`,
            suggestion: 'Le montant du document prime : le P.U. a été recalculé.',
          },
    );
  }

  const hasWarning = findings.some((f) => f.severity === 'warning');
  return {
    familyCode: family?.code ?? null,
    familyLabel: family?.labelFr ?? null,
    specs,
    conductors: extractConductors(designation),
    technicalUnits,
    findings,
    status: hasWarning ? 'warning' : 'ok',
    decision: hasWarning ? 'accept_with_comment' : 'accept',
    computed: { totalHt, vatAmount, totalTtc },
  };
}
