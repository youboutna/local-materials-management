/**
 * BoqCategoryResolver — infers WBS (phase/milestone/task) and DQE category from
 * a line designation using keyword heuristics. Pure TS, hexagonal-safe.
 *
 * Used by BoqImportOrchestrator to auto-classify imported lines when the source
 * file does not carry an explicit phase/lot column.
 */
import { WBS_REFERENTIAL } from '@/config/referentials/wbs/wbs.referential';
import { DQE_CATEGORIES } from '@/config/referentials/dqe/dqe-categories.referential';

export interface ResolvedCategory {
  phaseId?: string;
  milestoneId?: string;
  taskId?: string;
  dqeCategoryCode?: string;
}

/** Keyword → WBS task mapping (FR construction vocabulary). */
const TASK_KEYWORDS: Array<{ rx: RegExp; phaseId: string; milestoneId: string; taskId: string }> = [
  // Installation / Préparation
  { rx: /installation\s*de\s*chantier|repli|amen[eé]e|d[eé]broussaillage|implantation|piquetage/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'terrassement' },
  // Fondations
  { rx: /fouille|terrassement|d[eé]blai|remblai|h[eé]risson|forme\s*en\s*[eé]?paisseur|film\s*polyane/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'terrassement' },
  { rx: /b[eé]ton\s*(de\s*)?propret[eé]|gros\s*b[eé]ton/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'beton-proprete' },
  { rx: /semelle|radier/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'semelles' },
  { rx: /longrine|chainage\s*bas|amorce\s*de\s*poteau/i, phaseId: 'gros-oeuvre', milestoneId: 'fondations', taskId: 'longrines' },
  // Élévation
  { rx: /poteau|raidisseur/i, phaseId: 'gros-oeuvre', milestoneId: 'elevation', taskId: 'poteaux' },
  { rx: /poutre|linteau|chainage\s*haut/i, phaseId: 'gros-oeuvre', milestoneId: 'elevation', taskId: 'poutres' },
  { rx: /dalle|plancher|paillasse/i, phaseId: 'gros-oeuvre', milestoneId: 'elevation', taskId: 'dalles' },
  { rx: /ma[cç]onnerie|mur|cloison\s*brique|agglo(m[eé]r[eé]s?)?\s*(creux|pleins?)?|parpaing|brique/i, phaseId: 'gros-oeuvre', milestoneId: 'elevation', taskId: 'murs-porteurs' },
  // Hors d'eau
  { rx: /charpente/i, phaseId: 'gros-oeuvre', milestoneId: 'hors-eau', taskId: 'charpente' },
  { rx: /couverture|toiture|tuile/i, phaseId: 'gros-oeuvre', milestoneId: 'hors-eau', taskId: 'couverture' },
  { rx: /[eé]tanch[eé]it[eé]/i, phaseId: 'gros-oeuvre', milestoneId: 'hors-eau', taskId: 'etancheite' },
  // Second œuvre
  { rx: /menuiserie|porte|fen[eê]tre/i, phaseId: 'second-oeuvre', milestoneId: 'hors-air', taskId: 'menuiseries-ext' },
  { rx: /cloison|placo/i, phaseId: 'second-oeuvre', milestoneId: 'hors-air', taskId: 'cloisons' },
  { rx: /isolation|isolant/i, phaseId: 'second-oeuvre', milestoneId: 'hors-air', taskId: 'isolation' },
  { rx: /plomberie|sanitaire|regard|fosse\s*septique/i, phaseId: 'second-oeuvre', milestoneId: 'reseaux', taskId: 'plomberie' },
  { rx: /[eé]lectric|c[aâ]bl|prise|luminaire/i, phaseId: 'second-oeuvre', milestoneId: 'reseaux', taskId: 'electricite' },
  { rx: /cvc|ventilation|clim|chauffage/i, phaseId: 'second-oeuvre', milestoneId: 'reseaux', taskId: 'cvc' },
  // VRD
  { rx: /rev[eê]tement|enrob[eé]|bicouche/i, phaseId: 'vrd', milestoneId: 'voirie', taskId: 'chaussee' },
  { rx: /signalisation/i, phaseId: 'vrd', milestoneId: 'voirie', taskId: 'signalisation' },
  { rx: /assainissement/i, phaseId: 'vrd', milestoneId: 'reseaux-ext', taskId: 'assainissement' },
  // Enduits/Finitions
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

export class BoqCategoryResolver {
  /** Infer WBS + DQE category from a free-form designation. */
  static resolve(designation: string | null | undefined): ResolvedCategory {
    if (!designation) return {};
    const text = String(designation);
    const wbs = TASK_KEYWORDS.find((k) => k.rx.test(text));
    const dqe = DQE_KEYWORDS.find((k) => k.rx.test(text));
    const out: ResolvedCategory = {};
    if (wbs) {
      out.phaseId = wbs.phaseId;
      out.milestoneId = wbs.milestoneId;
      out.taskId = wbs.taskId;
    }
    if (dqe) out.dqeCategoryCode = dqe.code;
    return out;
  }

  /** Validate a resolved phaseId still exists in the referential. */
  static isKnownPhase(phaseId: string | null | undefined): boolean {
    if (!phaseId) return false;
    return WBS_REFERENTIAL.some((p) => p.id === phaseId);
  }
}
