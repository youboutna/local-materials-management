/**
 * labour-profiles.referential — détection des lignes « Ressources Humaines »
 * dans un DQE / devis (prestations intellectuelles et main d'œuvre).
 *
 * Deux dimensions :
 *   • MODE DE FACTURATION : DAY (homme·jour), MONTH (homme·mois), LUMP_SUM (forfait)
 *   • PROFIL / POSTE : chef de mission, ingénieur, consultant, technicien, ouvrier…
 *
 * Codes techniques anglais MAJUSCULES ; libellés fr/ar/en pour l'UI (i18n).
 * Pure TS — aucune dépendance React / Supabase.
 */
import type { BoqUnit } from './units.referential';

export type LabourBillingMode = 'DAY' | 'MONTH' | 'LUMP_SUM';

export interface LabourBillingModeDef {
  code: LabourBillingMode;
  units: BoqUnit[];
  labels: { fr: string; ar: string; en: string };
}

export const LABOUR_BILLING_MODES: LabourBillingModeDef[] = [
  { code: 'DAY', units: ['jour'], labels: { fr: 'Homme·jour', ar: 'رجل/يوم', en: 'Man·day' } },
  { code: 'MONTH', units: ['mois'], labels: { fr: 'Homme·mois', ar: 'رجل/شهر', en: 'Man·month' } },
  { code: 'LUMP_SUM', units: ['forfait'], labels: { fr: 'Forfait', ar: 'جزافي', en: 'Lump sum' } },
];

export interface LabourProfileDef {
  code: string;
  matchers: RegExp[];
  labels: { fr: string; ar: string; en: string };
}

export const LABOUR_PROFILES: LabourProfileDef[] = [
  { code: 'MISSION_LEAD', matchers: [/chef\s*de\s*mission/i, /team\s*leader/i], labels: { fr: 'Chef de mission', ar: 'رئيس المهمة', en: 'Mission leader' } },
  { code: 'PROJECT_MANAGER', matchers: [/chef\s*de\s*projet/i, /project\s*manager/i, /ma[iî]tre\s*d.?œuvre/i], labels: { fr: 'Chef de projet', ar: 'مدير المشروع', en: 'Project manager' } },
  { code: 'ENGINEER', matchers: [/ing[eé]nieur/i, /engineer/i], labels: { fr: 'Ingénieur', ar: 'مهندس', en: 'Engineer' } },
  { code: 'ARCHITECT', matchers: [/architecte/i, /architect/i], labels: { fr: 'Architecte', ar: 'مهندس معماري', en: 'Architect' } },
  { code: 'CONSULTANT', matchers: [/consultant/i, /expert/i, /assistance\s*technique/i], labels: { fr: 'Consultant / Expert', ar: 'خبير', en: 'Consultant / Expert' } },
  { code: 'SURVEYOR', matchers: [/topographe/i, /g[eé]om[eè]tre/i, /surveyor/i], labels: { fr: 'Topographe', ar: 'مساح', en: 'Surveyor' } },
  { code: 'TECHNICIAN', matchers: [/technicien/i, /technician/i, /contr[oô]leur/i], labels: { fr: 'Technicien', ar: 'تقني', en: 'Technician' } },
  { code: 'FOREMAN', matchers: [/chef\s*d.?[eé]quipe/i, /conducteur\s*de\s*travaux/i, /foreman/i], labels: { fr: "Chef d'équipe", ar: 'رئيس فريق', en: 'Foreman' } },
  { code: 'WORKER', matchers: [/ouvrier/i, /man(oe|œ)uvre/i, /ma[cç]on/i, /worker/i, /main\s*d.?œuvre/i], labels: { fr: 'Ouvrier / Main d\u2019œuvre', ar: 'عامل', en: 'Worker / Labour' } },
  { code: 'SUPPORT', matchers: [/secr[eé]taire/i, /assistant/i, /chauffeur/i, /driver/i], labels: { fr: 'Appui / Support', ar: 'دعم', en: 'Support staff' } },
];

/** Locations facturées à la journée : matériel, jamais des RH. */
export const EQUIPMENT_RENTAL_MATCHERS: RegExp[] = [
  /\b(location|louage|engin|v[eé]hicule|camion|pelle|grue|4x4|mat[eé]riel|compacteur|niveleuse)\b/i,
];

export interface DetectedLabour {
  isLabour: boolean;
  billingMode: LabourBillingMode | null;
  profileCode: string | null;
  profileLabels: { fr: string; ar: string; en: string } | null;
}

/**
 * Détection RH : l'unité (jour / mois / forfait) donne le mode de facturation,
 * le libellé donne le profil. Une location d'engin à la journée reste du matériel.
 */
export function detectLabour(input: {
  designation?: string | null;
  unit?: BoqUnit | string | null;
  sectionKind?: string | null;
}): DetectedLabour {
  const designation = String(input.designation ?? '');
  const unit = String(input.unit ?? '');
  const rental = EQUIPMENT_RENTAL_MATCHERS.some((rx) => rx.test(designation));
  const profile = LABOUR_PROFILES.find((p) => p.matchers.some((rx) => rx.test(designation))) ?? null;
  const mode = LABOUR_BILLING_MODES.find((m) => m.units.includes(unit as BoqUnit)) ?? null;

  const sectionLabour = String(input.sectionKind ?? '').toLowerCase() === 'labour';
  const unitLabour = (unit === 'jour' || unit === 'mois') && !rental;
  const isLabour = sectionLabour || unitLabour || (!!profile && !rental);

  if (!isLabour) return { isLabour: false, billingMode: null, profileCode: null, profileLabels: null };
  return {
    isLabour: true,
    // Un forfait n'est un mode RH que si un profil ou une section RH le confirme.
    billingMode: mode?.code === 'LUMP_SUM' && !profile && !sectionLabour ? null : mode?.code ?? null,
    profileCode: profile?.code ?? null,
    profileLabels: profile?.labels ?? null,
  };
}

export function labourBillingModeLabel(
  code: LabourBillingMode | null | undefined,
  lang: 'fr' | 'ar' | 'en' = 'fr',
): string {
  const def = LABOUR_BILLING_MODES.find((m) => m.code === code);
  return def ? def.labels[lang] : '';
}
