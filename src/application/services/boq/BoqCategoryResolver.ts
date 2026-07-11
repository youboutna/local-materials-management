/**
 * BoqCategoryResolver — infers WBS (phase/milestone/task) + resource type +
 * DQE category from a line designation using keyword heuristics.
 *
 * Two resolution modes:
 *  1. Static WBS_REFERENTIAL (default fallback, FR construction vocabulary).
 *  2. Dynamic project referential (SOMELEC / PNDS / SDAU / MR_PUBLIC / …) —
 *     labels of phases → steps → tasks fetched via `getPhasesForReferential`.
 *
 * Pure TS — no React, no Supabase.
 */
import { WBS_REFERENTIAL } from '@/config/referentials/wbs/wbs.referential';
import { DQE_CATEGORIES } from '@/config/referentials/dqe/dqe-categories.referential';
import { getPhasesForReferential, type ReferentialType } from '@/config/referentials';

export type BoqResourceKind = 'material' | 'labour' | 'equipment' | 'service';

export interface ResolvedCategory {
  phaseId?: string;
  milestoneId?: string;
  taskId?: string;
  dqeCategoryCode?: string;
  resourceType?: BoqResourceKind;
}

/** FR construction vocabulary — static fallback when no referential is provided. */
const TASK_KEYWORDS: Array<{ rx: RegExp; phaseId: string; milestoneId: string; taskId: string }> = [
  { rx: /installation\s*de\s*chantier|repli|amen[eé]e|d[eé]broussaillage|implantation|piquetage/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'terrassement' },
  { rx: /fouille|terrassement|d[eé]blai|remblai|h[eé]risson|forme\s*en\s*[eé]?paisseur|film\s*polyane/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'terrassement' },
  { rx: /b[eé]ton\s*(de\s*)?propret[eé]|gros\s*b[eé]ton/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'beton-proprete' },
  { rx: /semelle|radier/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'semelles' },
  { rx: /longrine|chainage\s*bas|amorce\s*de\s*poteau/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'longrines' },
  { rx: /poteau|raidisseur/i, phaseId: 'gros-oeuvre', milestoneId: 'elevation', taskId: 'poteaux' },
  { rx: /poutre|linteau|chainage\s*haut/i, phaseId: 'gros-oeuvre', milestoneId: 'elevation', taskId: 'poutres' },
  { rx: /dalle|plancher|paillasse/i, phaseId: 'gros-oeuvre', milestoneId: 'elevation', taskId: 'dalles' },
  { rx: /ma[cç]onnerie|mur|cloison\s*brique|agglo(m[eé]r[eé]s?)?\s*(creux|pleins?)?|parpaing|brique/i, phaseId: 'gros-oeuvre', milestoneId: 'elevation', taskId: 'murs-porteurs' },
  { rx: /charpente/i, phaseId: 'gros-oeuvre', milestoneId: 'hors-eau', taskId: 'charpente' },
  { rx: /couverture|toiture|tuile/i, phaseId: 'gros-oeuvre', milestoneId: 'hors-eau', taskId: 'couverture' },
  { rx: /[eé]tanch[eé]it[eé]/i, phaseId: 'gros-oeuvre', milestoneId: 'hors-eau', taskId: 'etancheite' },
  { rx: /menuiserie|porte|fen[eê]tre/i, phaseId: 'second-oeuvre', milestoneId: 'hors-air', taskId: 'menuiseries-ext' },
  { rx: /cloison|placo/i, phaseId: 'second-oeuvre', milestoneId: 'hors-air', taskId: 'cloisons' },
  { rx: /isolation|isolant/i, phaseId: 'second-oeuvre', milestoneId: 'hors-air', taskId: 'isolation' },
  { rx: /plomberie|sanitaire|regard|fosse\s*septique/i, phaseId: 'second-oeuvre', milestoneId: 'reseaux', taskId: 'plomberie' },
  { rx: /[eé]lectric|c[aâ]bl|prise|luminaire/i, phaseId: 'second-oeuvre', milestoneId: 'reseaux', taskId: 'electricite' },
  { rx: /cvc|ventilation|clim|chauffage/i, phaseId: 'second-oeuvre', milestoneId: 'reseaux', taskId: 'cvc' },
  { rx: /rev[eê]tement|enrob[eé]|bicouche/i, phaseId: 'vrd', milestoneId: 'voirie', taskId: 'chaussee' },
  { rx: /signalisation/i, phaseId: 'vrd', milestoneId: 'voirie', taskId: 'signalisation' },
  { rx: /assainissement/i, phaseId: 'vrd', milestoneId: 'reseaux-ext', taskId: 'assainissement' },
  { rx: /enduit|chape|carrelage|peinture/i, phaseId: 'gros-oeuvre', milestoneId: 'elevation', taskId: 'murs-porteurs' },
];

const DQE_KEYWORDS: Array<{ rx: RegExp; code: string }> = [
  { rx: /terrassement|fouille|d[eé]blai/i, code: 'TERRASSEMENT' },
  { rx: /rev[eê]tement|enrob[eé]|bicouche/i, code: 'REVETEMENT' },
  { rx: /signalisation/i, code: 'SIGNALISATION' },
  { rx: /installation|mobilisation|nettoyage/i, code: 'MOBILISATION' },
  { rx: /r[eé]ception/i, code: 'RECEPTION' },
  { rx: /b[eé]ton|ma[cç]onnerie|poteau|poutre|dalle|semelle/i, code: 'GENIE_CIVIL' },
  { rx: /c[aâ]bl|r[eé]seau|pose/i, code: 'POSE_RESEAU' },
  { rx: /[eé]quipement|luminaire/i, code: 'EQUIPEMENT' },
  { rx: /test|mise\s*en\s*service/i, code: 'TESTS' },
];

/** Detect resource type from designation + unit. */
const LABOUR_RX = /main[-\s]?d.?œuvre|main[-\s]?d.?oeuvre|ouvrier|man[oœ]uvre|chef\s*d.?[eé]quipe|ing[eé]nieur|technicien|MO\b|H\/J|homme[-\s]?jour/i;
const EQUIPMENT_RX = /engin|camion|pelle|bulldozer|grue|niveleuse|compacteur|b[eé]tonni[eè]re|location\s*(mat[eé]riel|engin)/i;
const SERVICE_RX = /[eé]tude|honoraire|prestation|expertise|assistance|bureau\s*d.?[eé]tudes|BET\b/i;
const LABOUR_UNITS = /^(h|hj|h\/j|j|jour|homme[-\s]?jour|hh)$/i;

function detectResourceKind(designation: string, unit: string): BoqResourceKind {
  if (LABOUR_UNITS.test(unit) || LABOUR_RX.test(designation)) return 'labour';
  if (EQUIPMENT_RX.test(designation)) return 'equipment';
  if (SERVICE_RX.test(designation)) return 'service';
  return 'material';
}

/** Tokenize a referential label into significant words (>3 chars). */
function tokens(label: string): string[] {
  return String(label)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3);
}

function matchByTokens(text: string, label: string): boolean {
  const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const toks = tokens(label);
  if (!toks.length) return false;
  return toks.some((tok) => t.includes(tok));
}

export class BoqCategoryResolver {
  /**
   * Infer WBS + DQE category + resource kind from a designation.
   * When `referentialCode` is provided, WBS classification uses the project
   * referential (SOMELEC / PNDS / SDAU / MR_PUBLIC / …); otherwise falls back
   * to the static FR construction WBS.
   */
  static resolve(
    designation: string | null | undefined,
    opts?: { referentialCode?: ReferentialType; unit?: string },
  ): ResolvedCategory {
    if (!designation) return {};
    const text = String(designation);
    const out: ResolvedCategory = {};

    // 1) WBS via dynamic project referential (phase → step[jalon] → task).
    if (opts?.referentialCode) {
      const phases = getPhasesForReferential(opts.referentialCode);
      for (const phase of phases) {
        for (const step of phase.steps) {
          for (const task of step.tasks) {
            if (matchByTokens(text, task.label)) {
              out.phaseId = phase.code;
              out.milestoneId = step.code;
              out.taskId = task.code;
              break;
            }
          }
          if (out.taskId) break;
          if (matchByTokens(text, step.label)) {
            out.phaseId = phase.code;
            out.milestoneId = step.code;
          }
        }
        if (out.phaseId) break;
        if (matchByTokens(text, phase.label)) {
          out.phaseId = phase.code;
        }
      }
    }

    // 2) Static WBS fallback if nothing matched.
    if (!out.phaseId) {
      const wbs = TASK_KEYWORDS.find((k) => k.rx.test(text));
      if (wbs) {
        out.phaseId = wbs.phaseId;
        out.milestoneId = wbs.milestoneId;
        out.taskId = wbs.taskId;
      }
    }

    // 3) DQE category (transverse).
    const dqe = DQE_KEYWORDS.find((k) => k.rx.test(text));
    if (dqe) out.dqeCategoryCode = dqe.code;

    // 4) Resource kind (material / labour / equipment / service).
    out.resourceType = detectResourceKind(text, opts?.unit ?? '');

    return out;
  }

  /** Validate a resolved phaseId still exists in the static referential. */
  static isKnownPhase(phaseId: string | null | undefined): boolean {
    if (!phaseId) return false;
    return WBS_REFERENTIAL.some((p) => p.id === phaseId);
  }
}
