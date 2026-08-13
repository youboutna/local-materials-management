/**
 * Référentiel des missions principales de la Direction Générale de l'Électricité
 * et des Énergies Renouvelables (DGEER).
 *
 * Sert de "lego métier" au rapport projet : chaque mission est reliée à des
 * mots-clés de rattachement (type de projet, secteur, description) afin de
 * produire une lecture directionnelle sans valeur codée en dur dans l'UI.
 */

export type DgeerMissionCode =
  | 'politique_energetique'
  | 'infrastructures'
  | 'energies_propres'
  | 'electrification'
  | 'supervision';

export interface DgeerMission {
  code: DgeerMissionCode;
  order: number;
  label: string;
  description: string;
  /** Mots-clés (normalisés, sans accents) de rattachement d'un projet. */
  keywords: string[];
}

export const DGEER_MISSIONS: Record<DgeerMissionCode, DgeerMission> = {
  politique_energetique: {
    code: 'politique_energetique',
    order: 1,
    label: 'Politique énergétique',
    description: "Lois, stratégies et plans directeurs électricité / énergies renouvelables",
    keywords: ['politique', 'strategie', 'plan directeur', 'loi', 'reglement', 'etude', 'schema'],
  },
  infrastructures: {
    code: 'infrastructures',
    order: 2,
    label: 'Infrastructures',
    description: 'Réseaux de transport haute tension et interconnexions électriques',
    keywords: ['reseau', 'transport', 'haute tension', 'ht', 'interconnexion', 'poste', 'ligne', 'mt', 'bt'],
  },
  energies_propres: {
    code: 'energies_propres',
    order: 3,
    label: 'Énergies propres',
    description: 'Solaire, éolien et hydrogène vert',
    keywords: ['solaire', 'photovoltaique', 'pv', 'eolien', 'hydrogene', 'renouvelable', 'hybride', 'stockage'],
  },
  electrification: {
    code: 'electrification',
    order: 4,
    label: 'Électrification',
    description: "Accès à l'électricité en milieu rural et périurbain",
    keywords: ['electrification', 'rural', 'periurbain', 'village', 'acces', 'raccordement', 'mini-reseau'],
  },
  supervision: {
    code: 'supervision',
    order: 5,
    label: 'Supervision des opérateurs',
    description: 'Suivi des activités des opérateurs du secteur (SOMELEC, concessionnaires)',
    keywords: ['somelec', 'operateur', 'concession', 'delegation', 'controle', 'audit', 'supervision', 'inspection'],
  },
};

export const DGEER_MISSION_LIST: DgeerMission[] = Object.values(DGEER_MISSIONS).sort(
  (a, b) => a.order - b.order,
);

/**
 * Mots-clés identifiant l'organisation DGEER (ou son ministère de rattachement).
 * Le référentiel n'est consulté dans les rapports que si l'organisation
 * propriétaire du projet correspond.
 */
export const DGEER_ORGANIZATION_KEYWORDS = [
  'dgeer',
  'direction generale de l electricite',
  'direction generale de lelectricite',
  'electricite et des energies renouvelables',
  'energies renouvelables',
];

/** True si l'organisation (nom et/ou code) relève de la DGEER. */
export function isDgeerOrganization(...identifiers: Array<string | null | undefined>): boolean {
  const haystack = identifiers
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’-]/g, ' ')
    .toLowerCase();
  if (!haystack.trim()) return false;
  return DGEER_ORGANIZATION_KEYWORDS.some((kw) => haystack.includes(kw));
}

