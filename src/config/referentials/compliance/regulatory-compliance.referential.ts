/**
 * Regulatory Compliance Referential (Marchés publics — Mauritanie / standards bailleurs)
 * Source unique des exigences réglementaires vérifiées sous forme de questionnaire.
 *
 * ⚠️ Aucune règle métier codée en dur dans l'UI : tout item de contrôle vient d'ici.
 */

import type { ComplianceType } from '@/dtos/entities/ComplianceDTO';
import type { DocumentTypeCode } from '@/config/referentials/documents/document-types.referential';

export type RegulatoryAnswer = 'compliant' | 'in_progress' | 'non_compliant' | 'not_applicable';

export interface RegulatoryCheckItem {
  /** Code stable (utilisé comme externalReference / subcategory) */
  code: string;
  /** Question posée au chargé de projet */
  question: string;
  /** Précision / aide au contrôle */
  hint?: string;
  /** Référence légale ou procédurale */
  legalRef?: string;
  /** Pièce justificative attendue */
  expectedDocumentType: DocumentTypeCode;
  mandatory: boolean;
}

export interface RegulatoryDomain {
  key: string;
  label: string;
  description: string;
  /** Type de conformité porté par les items du domaine */
  complianceType: ComplianceType;
  items: RegulatoryCheckItem[];
}

export const REGULATORY_ANSWER_LABELS: Record<RegulatoryAnswer, string> = {
  compliant: 'Conforme',
  in_progress: 'En cours',
  non_compliant: 'Non conforme',
  not_applicable: 'Non applicable',
};

export const REGULATORY_COMPLIANCE_DOMAINS: RegulatoryDomain[] = [
  {
    key: 'administrative',
    label: 'Documents administratifs',
    description: 'Vérification des pièces administratives obligatoires du marché.',
    complianceType: 'procurement',
    items: [
      {
        code: 'ADM_REGISTRE_COMMERCE',
        question: 'Le registre de commerce (ou équivalent) du titulaire est-il fourni et valide ?',
        expectedDocumentType: 'administrative',
        legalRef: 'Code des marchés publics — pièces de candidature',
        mandatory: true,
      },
      {
        code: 'ADM_ATTESTATION_FISCALE',
        question: 'L\'attestation fiscale (quitus) est-elle fournie et en cours de validité ?',
        hint: 'Validité généralement 3 mois.',
        expectedDocumentType: 'certificate',
        mandatory: true,
      },
      {
        code: 'ADM_ATTESTATION_CNSS',
        question: 'L\'attestation CNSS / sécurité sociale est-elle fournie ?',
        expectedDocumentType: 'certificate',
        mandatory: true,
      },
      {
        code: 'ADM_NON_FAILLITE',
        question: 'L\'attestation de non-faillite / non-exclusion est-elle disponible ?',
        expectedDocumentType: 'certificate',
        mandatory: true,
      },
      {
        code: 'ADM_POUVOIR_SIGNATURE',
        question: 'Le pouvoir de signature du représentant légal est-il joint ?',
        expectedDocumentType: 'administrative',
        mandatory: true,
      },
      {
        code: 'ADM_CONTRAT_SIGNE',
        question: 'Le contrat / marché est-il signé par toutes les parties ?',
        expectedDocumentType: 'contract',
        mandatory: true,
      },
    ],
  },
  {
    key: 'procurement',
    label: 'Procédure de passation',
    description: 'Traçabilité de la procédure de mise en concurrence et de l\'attribution.',
    complianceType: 'procurement',
    items: [
      {
        code: 'PRC_PPM_PUBLIE',
        question: 'Le marché figure-t-il au plan de passation (PPM) publié ?',
        expectedDocumentType: 'administrative',
        mandatory: true,
      },
      {
        code: 'PRC_PUBLICATION_AVIS',
        question: 'L\'avis d\'appel à concurrence a-t-il été publié dans les délais réglementaires ?',
        expectedDocumentType: 'tender_document',
        mandatory: true,
      },
      {
        code: 'PRC_PV_OUVERTURE',
        question: 'Le PV d\'ouverture des plis est-il disponible ?',
        expectedDocumentType: 'pv',
        mandatory: true,
      },
      {
        code: 'PRC_PV_EVALUATION',
        question: 'Le PV d\'évaluation et d\'attribution est-il disponible ?',
        expectedDocumentType: 'pv',
        mandatory: true,
      },
      {
        code: 'PRC_NOTIFICATION',
        question: 'La lettre de notification à l\'attributaire est-elle archivée ?',
        expectedDocumentType: 'correspondence',
        mandatory: false,
      },
    ],
  },
  {
    key: 'studies',
    label: 'Études techniques & faisabilité',
    description: 'Études préalables justifiant la consistance technique du projet.',
    complianceType: 'technical',
    items: [
      {
        code: 'STD_FAISABILITE',
        question: 'L\'étude de faisabilité technico-économique est-elle réalisée et validée ?',
        expectedDocumentType: 'report',
        mandatory: true,
      },
      {
        code: 'STD_APS_APD',
        question: 'Les études APS / APD (avant-projet) sont-elles approuvées ?',
        expectedDocumentType: 'technical',
        mandatory: true,
      },
      {
        code: 'STD_GEOTECHNIQUE',
        question: 'L\'étude géotechnique / de sol a-t-elle été réalisée ?',
        hint: 'Obligatoire pour ouvrages de génie civil et bâtiments.',
        expectedDocumentType: 'report',
        mandatory: false,
      },
      {
        code: 'STD_DQE_VALIDE',
        question: 'Le DQE / devis quantitatif estimatif est-il validé par le maître d\'ouvrage ?',
        expectedDocumentType: 'specification',
        mandatory: true,
      },
      {
        code: 'STD_PERMIS_CONSTRUIRE',
        question: 'Le permis de construire / autorisation d\'occupation est-il obtenu ?',
        expectedDocumentType: 'permit',
        mandatory: true,
      },
    ],
  },
  {
    key: 'environmental',
    label: 'Impact environnemental & social',
    description: 'Conformité environnementale et sauvegardes sociales.',
    complianceType: 'environmental',
    items: [
      {
        code: 'ENV_CATEGORISATION',
        question: 'Le projet a-t-il été catégorisé au plan environnemental (A / B / C) ?',
        expectedDocumentType: 'report',
        mandatory: true,
      },
      {
        code: 'ENV_EIES',
        question: 'L\'étude d\'impact environnemental et social (EIES) est-elle réalisée ?',
        hint: 'Ou notice d\'impact simplifiée pour les projets de catégorie B/C.',
        expectedDocumentType: 'report',
        legalRef: 'Loi-cadre sur l\'environnement — EIES',
        mandatory: true,
      },
      {
        code: 'ENV_QUITUS',
        question: 'Le quitus / certificat de conformité environnementale est-il délivré ?',
        expectedDocumentType: 'certificate',
        mandatory: true,
      },
      {
        code: 'ENV_PGES',
        question: 'Le plan de gestion environnementale et sociale (PGES) de chantier est-il établi ?',
        expectedDocumentType: 'procedure',
        mandatory: true,
      },
      {
        code: 'ENV_REINSTALLATION',
        question: 'Un plan d\'action de réinstallation / indemnisation est-il requis et disponible ?',
        expectedDocumentType: 'report',
        mandatory: false,
      },
      {
        code: 'ENV_GESTION_DECHETS',
        question: 'Les modalités de gestion des déchets et des emprunts sont-elles définies ?',
        expectedDocumentType: 'procedure',
        mandatory: false,
      },
    ],
  },
  {
    key: 'hse',
    label: 'Hygiène, santé & sécurité',
    description: 'Sauvegardes santé-sécurité applicables au chantier.',
    complianceType: 'health_safety',
    items: [
      {
        code: 'HSE_PLAN_SECURITE',
        question: 'Le plan hygiène-sécurité du chantier est-il approuvé ?',
        expectedDocumentType: 'procedure',
        mandatory: true,
      },
      {
        code: 'HSE_EPI',
        question: 'La dotation en équipements de protection individuelle est-elle assurée ?',
        expectedDocumentType: 'checklist',
        mandatory: true,
      },
      {
        code: 'HSE_ASSURANCE_CHANTIER',
        question: 'Les assurances chantier (RC, tous risques) sont-elles souscrites ?',
        expectedDocumentType: 'insurance',
        mandatory: true,
      },
    ],
  },
  {
    key: 'financial',
    label: 'Garanties & financement',
    description: 'Sécurisation financière du marché.',
    complianceType: 'financial',
    items: [
      {
        code: 'FIN_SOURCE_FINANCEMENT',
        question: 'La source de financement et la ligne budgétaire sont-elles confirmées ?',
        expectedDocumentType: 'administrative',
        mandatory: true,
      },
      {
        code: 'FIN_GARANTIE_BONNE_EXEC',
        question: 'La garantie de bonne exécution est-elle constituée ?',
        expectedDocumentType: 'bank_guarantee',
        mandatory: true,
      },
      {
        code: 'FIN_RETENUE_GARANTIE',
        question: 'Les modalités de retenue de garantie sont-elles définies au contrat ?',
        expectedDocumentType: 'contract',
        mandatory: false,
      },
    ],
  },
];

export function getRegulatoryDomain(key: string): RegulatoryDomain | undefined {
  return REGULATORY_COMPLIANCE_DOMAINS.find((d) => d.key === key);
}

export function getRegulatoryItem(code: string): { domain: RegulatoryDomain; item: RegulatoryCheckItem } | undefined {
  for (const domain of REGULATORY_COMPLIANCE_DOMAINS) {
    const item = domain.items.find((i) => i.code === code);
    if (item) return { domain, item };
  }
  return undefined;
}

export const REGULATORY_TOTAL_ITEMS = REGULATORY_COMPLIANCE_DOMAINS.reduce(
  (sum, d) => sum + d.items.length,
  0
);

/** Mapping réponse questionnaire → statut de conformité persistable. */
export function answerToComplianceStatus(answer: RegulatoryAnswer): 'approved' | 'in_progress' | 'rejected' | 'pending' {
  switch (answer) {
    case 'compliant':
      return 'approved';
    case 'in_progress':
      return 'in_progress';
    case 'non_compliant':
      return 'rejected';
    default:
      return 'pending';
  }
}
