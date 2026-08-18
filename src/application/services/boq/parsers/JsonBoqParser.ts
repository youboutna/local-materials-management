/**
 * JsonBoqParser — .json / EDB (Expression de Besoin) → ParsedBoqRow[].
 *
 * Supporte trois formes :
 *   1. EDB structurée : { metadata, lots: [{ id, designation, items: [...] }], ... }
 *   2. Tableau plat d'objets : [{ designation, unit, quantity, unitPrice }, ...]
 *   3. Objet enveloppant un tableau : { lines | rows | items | data: [...] }
 *
 * Les métadonnées EDB (budget total, reste à réaliser, phases, jalons, AO)
 * sont exposées via `edb` afin que les services applicatifs (hydratation des
 * phases / appels d'offres) les consomment sans reparser le fichier.
 */
import type { IDocumentParser, ParseResult, ParsedBoqRow } from './IDocumentParser';

export interface EdbLotItem {
  description?: string;
  designation?: string;
  unit?: string;
  quantity?: number;
  unitPriceMRU?: number;
  unitPrice?: number;
  totalMRU?: number;
  remainingMRU?: number;
}

export interface EdbLot {
  id?: string;
  designation?: string;
  percentageComplete?: number;
  remainingAmountMRU?: number;
  awarded?: boolean;
  contractor?: string | null;
  items?: EdbLotItem[];
}

export interface EdbPayload {
  metadata?: Record<string, unknown>;
  lots?: EdbLot[];
  phases?: Record<string, unknown>[];
  milestones?: Record<string, unknown>[];
  tenders?: Record<string, unknown>[];
  indicators?: Record<string, unknown>;
  documents?: Record<string, unknown>[];
}

export interface JsonParseResult extends ParseResult {
  edb?: EdbPayload;
}

export const EDB_COLUMNS = ['Lot', 'Désignation', 'Unité', 'Quantité', 'PU', 'Montant', 'Reste'] as const;

const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(String(v).replace(/\s+/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

function isEdb(payload: unknown): payload is EdbPayload {
  return !!payload && typeof payload === 'object' && Array.isArray((payload as EdbPayload).lots);
}

/** Contrôles de cohérence pré-import (§3.1 des instructions EDB). */
export function checkEdbCoherence(edb: EdbPayload): string[] {
  const warnings: string[] = [];
  const meta = (edb.metadata ?? {}) as Record<string, number | string>;
  const total = num(meta.totalBudgetMRU);
  const declaredRemaining = num(meta.remainingBudgetMRU);
  const lotsRemaining = (edb.lots ?? []).reduce((s, l) => s + (num(l.remainingAmountMRU) ?? 0), 0);

  if (declaredRemaining != null && Math.abs(lotsRemaining - declaredRemaining) > 1) {
    warnings.push(
      `Incohérence budget : somme des restes par lot = ${lotsRemaining.toLocaleString('fr-FR')} MRU ` +
        `≠ remainingBudget déclaré = ${declaredRemaining.toLocaleString('fr-FR')} MRU ` +
        `(écart ${(lotsRemaining - declaredRemaining).toLocaleString('fr-FR')} MRU).`,
    );
  }
  if (total && declaredRemaining != null) {
    const pct = (declaredRemaining / total) * 100;
    warnings.push(`Reste à réaliser déclaré : ${pct.toFixed(1)} % du budget total.`);
  }

  // Fenêtre de planning : les phases doivent tenir avant plannedCompletion.
  const completion = meta.plannedCompletion ? new Date(String(meta.plannedCompletion)) : null;
  if (completion && !Number.isNaN(completion.getTime())) {
    for (const p of edb.phases ?? []) {
      const end = p.endDate ? new Date(String(p.endDate)) : null;
      if (end && !Number.isNaN(end.getTime()) && end.getTime() > completion.getTime()) {
        warnings.push(`Phase ${String(p.code ?? p.id)} : fin ${String(p.endDate)} au-delà de la fin projet ${String(meta.plannedCompletion)}.`);
      }
    }
  }

  // Sommes lots ↔ budgets de phases.
  const phaseBudget = (edb.phases ?? []).reduce((s, p) => s + (num(p.budgetMRU) ?? 0), 0);
  if (phaseBudget && Math.abs(phaseBudget - lotsRemaining) > 1) {
    warnings.push(
      `Budgets de phases (${phaseBudget.toLocaleString('fr-FR')} MRU) ≠ restes par lot (${lotsRemaining.toLocaleString('fr-FR')} MRU).`,
    );
  }
  return warnings;
}

export class JsonBoqParser implements IDocumentParser {
  supports(file: File): boolean {
    return file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
  }

  async parse(file: File): Promise<JsonParseResult> {
    const text = await file.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch (e) {
      return { rows: [], columns: [], warnings: [`JSON invalide : ${e instanceof Error ? e.message : String(e)}`] };
    }
    return JsonBoqParser.fromPayload(payload);
  }

  /** Parsing pur (testable sans File). */
  static fromPayload(payload: unknown): JsonParseResult {
    if (isEdb(payload)) {
      const rows: ParsedBoqRow[] = [];
      for (const lot of payload.lots ?? []) {
        for (const item of lot.items ?? []) {
          rows.push({
            raw: {
              Lot: lot.id ?? lot.designation ?? null,
              'Désignation': item.description ?? item.designation ?? null,
              'Unité': item.unit ?? null,
              'Quantité': num(item.quantity),
              PU: num(item.unitPriceMRU ?? item.unitPrice),
              Montant: num(item.totalMRU),
              Reste: num(item.remainingMRU),
            },
          });
        }
      }
      const warnings = checkEdbCoherence(payload);
      if (!rows.length) warnings.push('Aucune ligne DQE trouvée dans les lots.');
      return { rows, columns: [...EDB_COLUMNS], warnings, edb: payload };
    }

    // Formes génériques : tableau plat ou objet enveloppant.
    const arr = Array.isArray(payload)
      ? payload
      : (['lines', 'rows', 'items', 'data'] as const)
          .map((k) => (payload as Record<string, unknown>)?.[k])
          .find((v) => Array.isArray(v));

    if (!Array.isArray(arr) || !arr.length) {
      return { rows: [], columns: [], warnings: ['Structure JSON non reconnue (attendu : EDB avec `lots`, ou tableau de lignes).'] };
    }

    const columns = Array.from(
      arr.reduce<Set<string>>((set, r) => {
        if (r && typeof r === 'object') Object.keys(r as object).forEach((k) => set.add(k));
        return set;
      }, new Set()),
    );
    const rows: ParsedBoqRow[] = arr.map((r) => {
      const raw: Record<string, string | number | null> = {};
      for (const c of columns) {
        const v = (r as Record<string, unknown>)?.[c];
        raw[c] = v == null ? null : typeof v === 'number' ? v : String(v);
      }
      return { raw };
    });
    return { rows, columns, warnings: [] };
  }
}
