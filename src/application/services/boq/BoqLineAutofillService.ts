/**
 * BoqLineAutofillService — détection automatique et suggestions pour la saisie
 * d'une ligne DQE (ajout manuel ou enrichissement d'un import).
 *
 * 100 % TypeScript pur, aucune dépendance React : toute la connaissance métier
 * provient des référentiels (`src/config/referentials/*`) — types d'éléments,
 * formules de métré, unités, catégories DQE, profils RH, comptes PCM, fiscalité.
 */
import { ELEMENT_TYPES, type ElementTypeCode } from '@/config/referentials/boq/element-types.referential';
import { computeQuantityByElementType } from '@/config/referentials/boq/formulas.referential';
import { LABOUR_PROFILES, EQUIPMENT_RENTAL_MATCHERS } from '@/config/referentials/boq/labour-profiles.referential';
import { PCM_PURCHASE_ACCOUNTS } from '@/config/referentials/boq/pcm-accounts.referential';
import { getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import { DQE_CATEGORIES } from '@/config/referentials/dqe/dqe-categories.referential';
import { TaxService } from '@/application/services/TaxService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqResourceType } from '@/domain/entities/boq/BoqLine';

export interface AutofillMaterial {
  id: string;
  name: string;
  unit?: string | null;
  unitPrice?: number | null;
  category?: string | null;
}

/** Arborescence WBS simplifiée (phases → jalons → tâches) avec libellés. */
export interface AutofillWbsPhase {
  id: string;
  label: string;
  milestones: { id: string; label: string; tasks: { id: string; label: string }[] }[];
}

export interface AutofillSuggestion {
  /** Libellé proposé à l'utilisateur (désignation). */
  label: string;
  /** Origine de la proposition, affichée comme repère. */
  origin: 'material' | 'element' | 'category' | 'labour';
  unit?: string | null;
  unitPrice?: number | null;
  materialId?: string | null;
  elementType?: ElementTypeCode | null;
  category?: string | null;
  resourceType?: BoqResourceType;
}

export interface AutofillInput {
  designation: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  quantity?: number | null;
  unit?: string | null;
  unitPrice?: number | null;
  materialId?: string | null;
  fiscalProfileCode?: string | null;
  entityCode?: string | null;
  phases?: AutofillWbsPhase[];
  materials?: AutofillMaterial[];
}

export interface AutofillResult {
  patch: Partial<BoqLineDTO>;
  /** Détections effectuées, présentées à l'utilisateur pour validation. */
  detections: { field: string; label: string; value: string }[];
}

const norm = (v: string) =>
  v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const scoreMatch = (haystack: string, query: string): number => {
  const h = norm(haystack);
  const q = norm(query);
  if (!q) return 0;
  if (h === q) return 100;
  if (h.startsWith(q)) return 80;
  if (h.includes(q)) return 60;
  const words = q.split(/\s+/).filter(Boolean);
  const hits = words.filter((w) => w.length > 2 && h.includes(w)).length;
  return hits ? 20 + hits * 10 : 0;
};

export class BoqLineAutofillService {
  /** Propositions de désignation issues des matériaux et des référentiels. */
  static suggest(
    query: string,
    ctx: { materials?: AutofillMaterial[]; entityCode?: string | null } = {},
    limit = 12,
  ): AutofillSuggestion[] {
    const pool: AutofillSuggestion[] = [];

    for (const m of ctx.materials ?? []) {
      if (!m?.name) continue;
      pool.push({
        label: m.name,
        origin: 'material',
        unit: m.unit ?? null,
        unitPrice: m.unitPrice ?? null,
        materialId: m.id,
        category: m.category ?? null,
        resourceType: 'material',
      });
    }
    for (const el of ELEMENT_TYPES) {
      if (el.code === 'generic') continue;
      pool.push({ label: el.label, origin: 'element', unit: el.defaultUnit, elementType: el.code, resourceType: 'material' });
    }
    for (const cat of DQE_CATEGORIES) {
      if (ctx.entityCode && cat.applicableEntities && !cat.applicableEntities.includes(ctx.entityCode)) continue;
      pool.push({ label: cat.label.fr, origin: 'category', unit: cat.unit ?? null, category: cat.code, resourceType: 'material' });
    }
    for (const profile of LABOUR_PROFILES) {
      pool.push({ label: profile.labels.fr, origin: 'labour', unit: 'j', resourceType: 'labor' });
    }

    const q = query.trim();
    const seen = new Set<string>();
    return pool
      .map((s) => ({ s, score: q ? scoreMatch(s.label, q) : 10 }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.s.label.localeCompare(b.s.label, 'fr'))
      .flatMap(({ s }) => {
        const key = `${s.origin}:${norm(s.label)}`;
        if (seen.has(key)) return [];
        seen.add(key);
        return [s];
      })
      .slice(0, limit);
  }

  /** Type d'élément détecté à partir de la désignation (référentiel ELEMENT_TYPES). */
  static detectElementType(designation: string) {
    return ELEMENT_TYPES.find((el) => el.code !== 'generic' && el.keywords.test(designation)) ?? null;
  }

  /** Nature de ressource : RH, équipement ou matériau. */
  static detectResourceType(designation: string): BoqResourceType {
    if (EQUIPMENT_RENTAL_MATCHERS.some((re) => re.test(designation))) return 'equipment';
    const isLabour = LABOUR_PROFILES.some(
      (p) => p.matchers.some((re) => re.test(designation)) || norm(designation).includes(norm(p.labels.fr)),
    );
    return isLabour ? 'labor' : 'material';
  }

  /** Catégorie DQE déduite des mots du libellé, sinon de l'unité. */
  static detectCategory(designation: string, unit?: string | null, entityCode?: string | null): string | null {
    const pool = DQE_CATEGORIES.filter(
      (c) => !entityCode || !c.applicableEntities || c.applicableEntities.includes(entityCode),
    );
    const byLabel = pool.find((c) => scoreMatch(c.label.fr, designation) >= 60 || norm(designation).includes(norm(c.label.fr)));
    if (byLabel) return byLabel.code;
    if (unit) {
      const byUnit = pool.find((c) => c.unit === unit);
      if (byUnit) return byUnit.code;
    }
    return null;
  }

  /** Compte PCM d'achat le plus proche du libellé / de la nature de ressource. */
  static detectAccountCode(designation: string, resourceType: BoqResourceType): string | null {
    const ranked = PCM_PURCHASE_ACCOUNTS
      .map((a) => ({ a, score: scoreMatch(a.labelFr, designation) }))
      .filter((x) => x.score >= 60)
      .sort((x, y) => y.score - x.score);
    if (ranked.length) return ranked[0].a.code;
    const fallbackRe = resourceType === 'labor'
      ? /personnel|main\s*d/i
      : resourceType === 'equipment'
        ? /location|mat[eé]riel/i
        : /achat|mati[eè]re|fourniture|consommable/i;
    const fallback = PCM_PURCHASE_ACCOUNTS.find((a) => fallbackRe.test(a.labelFr));
    return fallback?.code ?? null;
  }

  /** Rattachement WBS (phase / jalon / tâche) par correspondance de libellés. */
  static detectWbs(designation: string, phases: AutofillWbsPhase[] = []) {
    let best: { phaseId: string | null; milestoneId: string | null; taskId: string | null; score: number; label: string } = {
      phaseId: null, milestoneId: null, taskId: null, score: 0, label: '',
    };
    for (const phase of phases) {
      const pScore = scoreMatch(phase.label, designation);
      if (pScore > best.score) best = { phaseId: phase.id, milestoneId: null, taskId: null, score: pScore, label: phase.label };
      for (const milestone of phase.milestones ?? []) {
        const mScore = scoreMatch(milestone.label, designation);
        if (mScore > best.score) best = { phaseId: phase.id, milestoneId: milestone.id, taskId: null, score: mScore, label: `${phase.label} › ${milestone.label}` };
        for (const task of milestone.tasks ?? []) {
          const tScore = scoreMatch(task.label, designation);
          if (tScore > best.score) best = { phaseId: phase.id, milestoneId: milestone.id, taskId: task.id, score: tScore, label: `${phase.label} › ${milestone.label} › ${task.label}` };
        }
      }
    }
    return best.score >= 60 ? best : null;
  }

  /**
   * Autofill complet d'une ligne : métré (L×l×h selon le type d'élément),
   * unité, prix unitaire matériau, catégorie, compte PCM, fiscalité et WBS.
   */
  static autofill(input: AutofillInput): AutofillResult {
    const designation = String(input.designation ?? '').trim();
    const detections: AutofillResult['detections'] = [];
    const patch: Partial<BoqLineDTO> = {};
    if (!designation) return { patch, detections };

    // 1. Matériau du catalogue → PU + unité + identifiant.
    const material = input.materialId
      ? (input.materials ?? []).find((m) => m.id === input.materialId) ?? null
      : (input.materials ?? []).find((m) => scoreMatch(m.name, designation) >= 80) ?? null;
    if (material) {
      patch.materialId = material.id;
      if (material.unit) patch.unit = material.unit;
      if (material.unitPrice != null && !input.unitPrice) patch.unitPrice = material.unitPrice;
      detections.push({ field: 'material', label: 'Matériau', value: material.name });
    }

    // 2. Type d'élément + métré dimensionnel.
    const element = this.detectElementType(designation);
    if (element) {
      patch.elementType = element.code;
      if (!patch.unit && !input.unit) patch.unit = element.defaultUnit;
      detections.push({ field: 'elementType', label: "Type d'élément", value: element.label });
      const hasDims = [input.length, input.width, input.height].some((v) => Number(v) > 0);
      if (hasDims) {
        const qty = computeQuantityByElementType(element.code, {
          length: input.length, width: input.width, height: input.height,
        });
        if (qty > 0) {
          patch.quantity = Number(qty.toFixed(3));
          detections.push({ field: 'quantity', label: 'Métré calculé', value: `${patch.quantity} ${patch.unit ?? input.unit ?? ''}`.trim() });
        }
      }
    }

    // 3. Nature de ressource.
    const resourceType = this.detectResourceType(designation);
    patch.resourceType = resourceType;
    detections.push({ field: 'resourceType', label: 'Nature', value: resourceType });

    // 4. Catégorie DQE.
    const unit = patch.unit ?? input.unit ?? null;
    const category = this.detectCategory(designation, unit, input.entityCode);
    if (category) {
      patch.category = category;
      detections.push({ field: 'category', label: 'Catégorie DQE', value: category });
    }

    // 5. Imputation comptable PCM.
    const accountCode = this.detectAccountCode(designation, resourceType);
    if (accountCode) {
      patch.accountCode = accountCode;
      detections.push({ field: 'accountCode', label: 'Compte PCM', value: accountCode });
    }

    // 6. Rattachement WBS.
    const wbs = this.detectWbs(designation, input.phases);
    if (wbs) {
      patch.phaseId = wbs.phaseId;
      patch.milestoneId = wbs.milestoneId;
      patch.taskId = wbs.taskId;
      detections.push({ field: 'wbs', label: 'Rattachement WBS', value: wbs.label });
    }

    // 7. Fiscalité (TVA / RAS / régime) résolue par TaxService.
    const quantity = patch.quantity ?? input.quantity ?? 0;
    const unitPrice = patch.unitPrice ?? input.unitPrice ?? 0;
    const tax = TaxService.resolve(
      {
        designation,
        resourceType,
        category: patch.category ?? null,
        elementType: patch.elementType ?? null,
        accountCode: patch.accountCode ?? null,
        totalHt: quantity * unitPrice,
      },
      getFiscalProfile(input.fiscalProfileCode),
    );
    patch.vatRate = tax.vatRate;
    patch.rasRate = tax.rasRate;
    patch.taxRegimeCode = tax.regimeCode;
    detections.push({ field: 'tax', label: 'Fiscalité', value: `TVA ${(tax.vatRate * 100).toFixed(0)}%${tax.rasRate ? ` · RAS ${(tax.rasRate * 100).toFixed(0)}%` : ''}` });

    return { patch, detections };
  }

  /** Enrichit des lignes importées en ne comblant que les champs manquants. */
  static enrichImported(lines: BoqLineDTO[], ctx: Omit<AutofillInput, 'designation'> = {}): BoqLineDTO[] {
    return lines.map((line) => {
      const { patch } = this.autofill({
        ...ctx,
        designation: String(line.designation ?? ''),
        length: line.length, width: line.width, height: line.height,
        quantity: line.quantity, unit: line.unit, unitPrice: line.unitPrice,
        materialId: line.materialId,
      });
      const next: BoqLineDTO = { ...line };
      const keep = <K extends keyof BoqLineDTO>(key: K) => {
        const current = next[key];
        const isEmpty = current == null || current === '' || current === 0;
        if (isEmpty && patch[key] != null) next[key] = patch[key] as BoqLineDTO[K];
      };
      (['elementType', 'unit', 'quantity', 'unitPrice', 'materialId', 'category', 'accountCode', 'phaseId', 'milestoneId', 'taskId', 'vatRate', 'rasRate', 'taxRegimeCode', 'resourceType'] as (keyof BoqLineDTO)[])
        .forEach((key) => keep(key));
      if (!next.totalHt) next.totalHt = (next.quantity ?? 0) * (next.unitPrice ?? 0);
      return next;
    });
  }
}
