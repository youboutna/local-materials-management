/**
 * Provider d'autocomplétion pour stratégies, objectifs et budget
 */
import {
  scappNationalStrategy,
  searchObjectives,
  type MultiLangLabel,
  type StrategicLever,
  type StrategicChantier,
  type StrategicIntervention,
  type MeasurableObjective,
  findChantier,
  findIntervention,
} from '../strategies/scapp-national-strategy.referential';
import {
  budget2026Referential,
  findMinistry,
  findProgram,
  findAction,
  findBudgetLine,
  getProgramsByMinistry,
  getActionsByProgram,
  getLinesByAction,
} from '../budget-2026.referential';

export type SuggestionKind =
  | 'lever' | 'chantier' | 'intervention' | 'objective'
  | 'budget_ministry' | 'budget_program' | 'budget_action' | 'budget_line';

export interface AutocompleteSuggestion {
  id: string;            // canonical code
  kind: SuggestionKind;
  label: MultiLangLabel;
  secondaryLabel?: string;
  parentCode?: string;
  metadata?: Record<string, any>;
}

const tokenize = (text: string): string[] =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/[\s,.;:!?()/]+/).filter(t => t.length > 1);

function matchScore(haystackTokens: string[], queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  let score = 0;
  for (const q of queryTokens) {
    for (const h of haystackTokens) {
      if (h === q) score += 10;
      else if (h.startsWith(q)) score += 5;
      else if (h.includes(q)) score += 1;
    }
  }
  return score;
}

function rankAndSlice<T extends { tokens: string[]; suggestion: AutocompleteSuggestion }>(
  candidates: T[], query: string, limit: number,
): AutocompleteSuggestion[] {
  if (!query || query.length < 1) {
    return candidates.slice(0, limit).map(c => c.suggestion);
  }
  const q = tokenize(query);
  const scored = candidates
    .map(c => ({ s: c.suggestion, score: matchScore(c.tokens, q) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map(c => c.s);
}

// ============ STRATEGY ============
export function searchLevers(query: string, limit = 10): AutocompleteSuggestion[] {
  const candidates = scappNationalStrategy.map((l: StrategicLever) => ({
    tokens: tokenize(`${l.code} ${l.label.fr} ${l.label.en} ${l.label.ar}`),
    suggestion: { id: l.code, kind: 'lever' as const, label: l.label },
  }));
  return rankAndSlice(candidates, query, limit);
}

export function searchChantiers(query: string, leverCode?: string, limit = 10): AutocompleteSuggestion[] {
  const levers = leverCode ? scappNationalStrategy.filter(l => l.code === leverCode) : scappNationalStrategy;
  const candidates: Array<{ tokens: string[]; suggestion: AutocompleteSuggestion }> = [];
  for (const lever of levers) {
    for (const c of lever.chantiers) {
      candidates.push({
        tokens: tokenize(`${c.code} ${c.label.fr} ${c.label.en}`),
        suggestion: { id: c.code, kind: 'chantier', label: c.label, parentCode: lever.code },
      });
    }
  }
  return rankAndSlice(candidates, query, limit);
}

export function searchInterventions(query: string, chantierCode?: string, limit = 10): AutocompleteSuggestion[] {
  const candidates: Array<{ tokens: string[]; suggestion: AutocompleteSuggestion }> = [];
  for (const lever of scappNationalStrategy) {
    for (const chantier of lever.chantiers) {
      if (chantierCode && chantier.code !== chantierCode) continue;
      for (const i of chantier.interventions) {
        candidates.push({
          tokens: tokenize(`${i.code} ${i.label.fr} ${i.label.en}`),
          suggestion: { id: i.code, kind: 'intervention', label: i.label, parentCode: chantier.code },
        });
      }
    }
  }
  return rankAndSlice(candidates, query, limit);
}

export function searchObjectivesSuggestions(query: string, interventionCode?: string, limit = 20): AutocompleteSuggestion[] {
  let pool: MeasurableObjective[];
  if (interventionCode) {
    pool = findIntervention(interventionCode)?.objectives || [];
  } else {
    pool = searchObjectives('');
  }
  const candidates = pool.map(o => ({
    tokens: tokenize(`${o.code} ${o.label.fr} ${o.label.en} ${o.sdgReference || ''}`),
    suggestion: {
      id: o.code,
      kind: 'objective' as const,
      label: o.label,
      secondaryLabel: o.sdgReference ? `ODD ${o.sdgReference}` : undefined,
      metadata: { unit: o.unit, target2030: o.target2030 },
    },
  }));
  return rankAndSlice(candidates, query, limit);
}

// ============ BUDGET ============
export function searchBudgetMinistries(query: string, limit = 10): AutocompleteSuggestion[] {
  const candidates = budget2026Referential.map(m => ({
    tokens: tokenize(`${m.code} ${m.label.fr} ${m.label.en}`),
    suggestion: { id: m.code, kind: 'budget_ministry' as const, label: m.label },
  }));
  return rankAndSlice(candidates, query, limit);
}

export function searchBudgetPrograms(query: string, ministryCode?: string, limit = 15): AutocompleteSuggestion[] {
  const ministries = ministryCode ? [findMinistry(ministryCode)].filter(Boolean) as typeof budget2026Referential : budget2026Referential;
  const candidates: Array<{ tokens: string[]; suggestion: AutocompleteSuggestion }> = [];
  for (const m of ministries) {
    for (const p of m.programs) {
      candidates.push({
        tokens: tokenize(`${p.code} ${p.label.fr} ${p.label.en}`),
        suggestion: { id: p.code, kind: 'budget_program', label: p.label, parentCode: m.code },
      });
    }
  }
  return rankAndSlice(candidates, query, limit);
}

export function searchBudgetActions(query: string, programCode?: string, limit = 15): AutocompleteSuggestion[] {
  const candidates: Array<{ tokens: string[]; suggestion: AutocompleteSuggestion }> = [];
  if (programCode) {
    for (const a of getActionsByProgram(programCode)) {
      candidates.push({
        tokens: tokenize(`${a.code} ${a.label.fr} ${a.label.en}`),
        suggestion: { id: a.code, kind: 'budget_action', label: a.label, parentCode: programCode, metadata: { totalCE: a.totalCE, totalCP: a.totalCP } },
      });
    }
  } else {
    for (const m of budget2026Referential)
      for (const p of m.programs)
        for (const a of p.actions)
          candidates.push({
            tokens: tokenize(`${a.code} ${a.label.fr} ${a.label.en}`),
            suggestion: { id: a.code, kind: 'budget_action', label: a.label, parentCode: p.code, metadata: { totalCE: a.totalCE, totalCP: a.totalCP } },
          });
  }
  return rankAndSlice(candidates, query, limit);
}

export function searchBudgetLines(query: string, actionCode?: string, limit = 20): AutocompleteSuggestion[] {
  const candidates: Array<{ tokens: string[]; suggestion: AutocompleteSuggestion }> = [];
  if (actionCode) {
    for (const l of getLinesByAction(actionCode)) {
      candidates.push({
        tokens: tokenize(`${l.code} ${l.label.fr} ${l.label.en}`),
        suggestion: { id: l.code, kind: 'budget_line', label: l.label, parentCode: actionCode, metadata: { ce: l.ce, cp: l.cp, climate: l.climate, financeType: l.financeType } },
      });
    }
  } else {
    for (const m of budget2026Referential)
      for (const p of m.programs)
        for (const a of p.actions)
          for (const ch of a.chapters)
            for (const l of ch.lines)
              candidates.push({
                tokens: tokenize(`${l.code} ${l.label.fr} ${l.label.en}`),
                suggestion: { id: l.code, kind: 'budget_line', label: l.label, parentCode: a.code, metadata: { ce: l.ce, cp: l.cp } },
              });
  }
  return rankAndSlice(candidates, query, limit);
}

export const linkageHelpers = {
  findChantier, findIntervention,
  findMinistry, findProgram, findAction, findBudgetLine,
  getProgramsByMinistry, getActionsByProgram, getLinesByAction,
};
