/**
 * BoqImportAssistService — assistance à l'import DQE.
 *
 * Rôle : après le parsing (UnifiedBoqParser) et avant la persistance, confronter
 * chaque ligne aux référentiels configurables (unités, types d'éléments, profils
 * RH, validation) et aux entités du système (catalogue matériaux, ressources RH,
 * fournisseurs, organisations, projets, phases) pour :
 *   • proposer un rattachement (materialId, employeeId, phaseId, supplierId…)
 *   • produire des diagnostics lisibles (erreur / avertissement / information)
 *
 * Pur TypeScript — aucune dépendance React ni Supabase (catalogues injectés).
 */
import { BOQ_UNITS } from '@/config/referentials/boq/units.referential';
import { detectLabour, LABOUR_PROFILES } from '@/config/referentials/boq/labour-profiles.referential';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { DocumentMeta } from './parsers/documentMetaDetection';
import type { DocumentParties } from './parsers/headerDetection';

export type AssistSeverity = 'error' | 'warning' | 'info';

export interface AssistDiagnostic {
  /** Index de la ligne concernée (-1 = diagnostic document). */
  lineIndex: number;
  severity: AssistSeverity;
  /** Code technique anglais MAJUSCULES (i18n côté UI). */
  code: string;
  message: string;
  field?: keyof BoqLineDTO | 'header';
  suggestion?: string;
}

export interface AssistCatalogs {
  materials?: { id: string; name: string; unit?: string | null; pricePerUnit?: number | null; category?: string | null }[];
  employees?: { id: string; full_name: string; position?: string | null; department?: string | null }[];
  suppliers?: { id: string; name: string }[];
  organizations?: { id: string; name: string }[];
  projects?: { id: string; title?: string | null; projectReference?: string | null }[];
  phases?: { id: string; name?: string | null; code?: string | null }[];
}

export interface AssistResult {
  lines: BoqLineDTO[];
  diagnostics: AssistDiagnostic[];
  /** Rattachements déduits au niveau document. */
  resolved: {
    projectId?: string;
    supplierId?: string;
    organizationId?: string;
    currency?: string;
  };
  summary: { errors: number; warnings: number; infos: number; matchedMaterials: number; matchedEmployees: number };
}

const normalize = (v: string): string =>
  v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokens = (v: string): string[] => normalize(v).split(' ').filter((t) => t.length > 2);

/** Score de similarité 0→1 par recouvrement de tokens (Jaccard pondéré). */
export function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.length || !tb.length) return 0;
  const setB = new Set(tb);
  const hits = ta.filter((t) => setB.has(t)).length;
  return hits / Math.max(ta.length, tb.length);
}

function bestMatch<T>(label: string, items: T[], key: (i: T) => string, threshold = 0.45): { item: T; score: number } | null {
  let best: { item: T; score: number } | null = null;
  for (const item of items) {
    const score = similarity(label, key(item));
    if (score > (best?.score ?? 0)) best = { item, score };
  }
  return best && best.score >= threshold ? best : null;
}

export class BoqImportAssistService {
  /**
   * Enrichit les lignes et produit les diagnostics d'import.
   * Ne jette jamais : toute anomalie devient un diagnostic exploitable par l'UI.
   */
  static assist(
    lines: BoqLineDTO[],
    catalogs: AssistCatalogs = {},
    context: {
      documentMeta?: DocumentMeta | null;
      parties?: DocumentParties | null;
      /** Projet courant : prioritaire sur la détection par référence. */
      projectId?: string | null;
    } = {},
  ): AssistResult {
    const diagnostics: AssistDiagnostic[] = [];
    const meta = context.documentMeta ?? null;
    let matchedMaterials = 0;
    let matchedEmployees = 0;

    // ---------- Niveau document ----------
    const resolved: AssistResult['resolved'] = {};
    if (meta?.currency) resolved.currency = meta.currency;

    const project =
      (context.projectId && catalogs.projects?.find((p) => p.id === context.projectId)) ||
      (meta?.projectReference &&
        catalogs.projects?.find((p) => normalize(p.projectReference ?? '') === normalize(meta.projectReference ?? ''))) ||
      (meta?.projectTitle && bestMatch(meta.projectTitle, catalogs.projects ?? [], (p) => p.title ?? '', 0.6)?.item) ||
      null;
    if (project) {
      resolved.projectId = project.id;
      diagnostics.push({
        lineIndex: -1,
        severity: 'info',
        code: 'PROJECT_MATCHED',
        field: 'header',
        message: `Projet rattaché : ${project.title ?? project.projectReference ?? project.id}`,
      });
    } else if (meta?.projectReference || meta?.projectTitle) {
      diagnostics.push({
        lineIndex: -1,
        severity: 'warning',
        code: 'PROJECT_NOT_FOUND',
        field: 'header',
        message: `Aucun projet ne correspond à « ${meta.projectTitle ?? meta.projectReference} »`,
        suggestion: 'Sélectionner le projet manuellement avant import.',
      });
    }

    const supplierName = context.parties?.supplier?.name;
    if (supplierName) {
      const hit = bestMatch(supplierName, catalogs.suppliers ?? [], (s) => s.name, 0.5);
      if (hit) resolved.supplierId = hit.item.id;
      else
        diagnostics.push({
          lineIndex: -1,
          severity: 'info',
          code: 'SUPPLIER_NOT_FOUND',
          field: 'header',
          message: `Émetteur « ${supplierName} » absent du référentiel fournisseurs`,
          suggestion: 'Créer le fournisseur ou vérifier la raison sociale.',
        });
    }

    const organizationName = context.parties?.organization?.name;
    if (organizationName) {
      const hit = bestMatch(organizationName, catalogs.organizations ?? [], (o) => o.name, 0.5);
      if (hit) resolved.organizationId = hit.item.id;
      else
        diagnostics.push({
          lineIndex: -1,
          severity: 'info',
          code: 'ORGANIZATION_NOT_FOUND',
          field: 'header',
          message: `Destinataire « ${organizationName} » absent du référentiel organisations`,
        });
    }

    if (!meta?.currency) {
      diagnostics.push({
        lineIndex: -1,
        severity: 'warning',
        code: 'CURRENCY_MISSING',
        field: 'header',
        message: 'Devise non déclarée dans le document — devise projet appliquée.',
      });
    }

    // ---------- Niveau ligne ----------
    const enriched = lines.map((line, index) => {
      const next: BoqLineDTO = { ...line, metadata: { ...(line.metadata ?? {}) } };
      const metadata = next.metadata as Record<string, unknown>;
      const push = (severity: AssistSeverity, code: string, message: string, extra?: Partial<AssistDiagnostic>) =>
        diagnostics.push({ lineIndex: index, severity, code, message, ...extra });

      if (!next.designation?.trim()) {
        push('error', 'DESIGNATION_MISSING', 'Désignation vide', { field: 'designation' });
      }
      if (!BOQ_UNITS.some((u) => u.code === next.unit)) {
        push('warning', 'UNIT_UNKNOWN', `Unité « ${next.unit || '—'} » hors référentiel`, {
          field: 'unit',
          suggestion: 'Choisir une unité du référentiel (m, m², m³, kg, unité, jour, mois, forfait…).',
        });
      }
      if (!next.quantity || next.quantity <= 0) {
        push('error', 'QUANTITY_INVALID', 'Quantité nulle ou négative', { field: 'quantity' });
      }
      if (next.unitPrice == null || next.unitPrice <= 0) {
        push('warning', 'UNIT_PRICE_MISSING', 'Prix unitaire absent', { field: 'unitPrice' });
      }
      const expected = (next.quantity ?? 0) * (next.unitPrice ?? 0);
      if (next.totalHt != null && expected > 0 && Math.abs(next.totalHt - expected) / expected > 0.01) {
        push('warning', 'TOTAL_MISMATCH', `Montant incohérent (attendu ${Math.round(expected)})`, { field: 'totalHt' });
      }
      if (next.vatRate != null && (next.vatRate < 0 || next.vatRate > 0.5)) {
        push('error', 'VAT_RATE_INVALID', `Taux de TVA improbable (${next.vatRate})`, { field: 'vatRate' });
      }
      if (!next.phaseId) {
        push('info', 'PHASE_UNRESOLVED', 'Phase non déduite — rattachement WBS à confirmer', { field: 'phaseId' });
      } else if (catalogs.phases?.length) {
        const phase = catalogs.phases.find(
          (p) => p.id === next.phaseId || normalize(p.code ?? '') === normalize(next.phaseId ?? ''),
        ) ?? bestMatch(next.phaseId, catalogs.phases, (p) => p.name ?? '', 0.6)?.item;
        if (phase) next.phaseId = phase.id;
        else metadata.phaseHint = next.phaseId;
      }

      // Rattachement métier : matériau (catalogue) ou ressource RH (employés).
      if (next.resourceType === 'labor') {
        const profile = LABOUR_PROFILES.find((p) => p.matchers.some((rx) => rx.test(next.designation)));
        const detected = detectLabour({ designation: next.designation, unit: next.unit });
        if (profile) metadata.labourProfileCode = profile.code;
        if (detected.billingMode) metadata.labourBillingMode = detected.billingMode;
        const candidates = (catalogs.employees ?? []).filter((e) =>
          profile ? profile.matchers.some((rx) => rx.test(`${e.position ?? ''} ${e.full_name}`)) : true,
        );
        const hit = bestMatch(next.designation, candidates, (e) => `${e.position ?? ''} ${e.full_name}`, 0.4);
        if (hit) {
          metadata.employeeId = hit.item.id;
          metadata.employeeName = hit.item.full_name;
          matchedEmployees += 1;
        } else if (!profile) {
          push('info', 'LABOUR_PROFILE_UNKNOWN', 'Profil RH non identifié — préciser le poste', {
            field: 'designation',
            suggestion: 'Utiliser un libellé du référentiel (Ingénieur, Technicien, Chef d’équipe…).',
          });
        }
      } else if (!next.materialId) {
        const hit = bestMatch(next.designation, catalogs.materials ?? [], (m) => m.name, 0.45);
        if (hit) {
          next.materialId = hit.item.id;
          metadata.materialMatchScore = Number(hit.score.toFixed(2));
          matchedMaterials += 1;
          if (hit.item.unit && normalize(hit.item.unit) !== normalize(next.unit)) {
            push('warning', 'MATERIAL_UNIT_MISMATCH', `Unité catalogue « ${hit.item.unit} » ≠ « ${next.unit} »`, {
              field: 'unit',
            });
          }
          if ((next.unitPrice ?? 0) <= 0 && hit.item.pricePerUnit) {
            next.unitPrice = hit.item.pricePerUnit;
            next.totalHt = (next.quantity ?? 0) * hit.item.pricePerUnit;
            push('info', 'PRICE_FROM_CATALOG', `Prix repris du catalogue (${hit.item.pricePerUnit})`, {
              field: 'unitPrice',
            });
          }
        } else {
          push('info', 'MATERIAL_NOT_IN_CATALOG', 'Article absent du catalogue matériaux', {
            field: 'designation',
            suggestion: 'Créer l’article ou le rattacher manuellement.',
          });
        }
      }

      return next;
    });

    const summary = {
      errors: diagnostics.filter((d) => d.severity === 'error').length,
      warnings: diagnostics.filter((d) => d.severity === 'warning').length,
      infos: diagnostics.filter((d) => d.severity === 'info').length,
      matchedMaterials,
      matchedEmployees,
    };

    return { lines: enriched, diagnostics, resolved, summary };
  }
}
