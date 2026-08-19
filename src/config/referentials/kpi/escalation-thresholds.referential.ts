/**
 * Référentiel des seuils d'escalade — source unique des catégories, unités,
 * sévérités et valeurs par défaut utilisées par le moteur d'alertes.
 *
 * Les valeurs persistées dans `btp.escalation_thresholds` surchargent ces
 * défauts (fusion réalisée dans `EscalationThresholdService`). Aucun seuil ne
 * doit être codé en dur dans l'UI ou dans les services métier.
 */

export type EscalationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EscalationUnit = 'days' | 'percentage' | 'amount';

export interface EscalationThresholdCategoryDefinition {
  /** Clé technique (colonne `threshold_type`). */
  key: string;
  label: string;
  /** Icône lucide résolue côté UI. */
  icon: 'clock' | 'shield' | 'money' | 'alert' | 'settings';
  description: string;
  /** Catégories mises en avant dans le résumé. */
  highlighted: boolean;
}

export interface EscalationThresholdDefault {
  thresholdType: string;
  thresholdName: string;
  thresholdValue: number;
  thresholdUnit: EscalationUnit;
  severityLevel: EscalationSeverity;
  escalationLevel: number;
  description: string;
}

export const ESCALATION_SEVERITIES: Array<{ value: EscalationSeverity; label: string }> = [
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyen' },
  { value: 'high', label: 'Élevé' },
  { value: 'critical', label: 'Critique' },
];

export const ESCALATION_UNIT_LABELS: Record<EscalationUnit, string> = {
  days: 'jours',
  percentage: '%',
  amount: 'MRU',
};

export const ESCALATION_THRESHOLD_CATEGORIES: EscalationThresholdCategoryDefinition[] = [
  {
    key: 'project_delay',
    label: 'Retards de Projet',
    icon: 'clock',
    description: 'Écarts de planning et dérives d’avancement des projets et phases.',
    highlighted: true,
  },
  {
    key: 'insurance_expiry',
    label: "Expiration d'Assurance",
    icon: 'shield',
    description: 'Préavis avant échéance des polices d’assurance et garanties.',
    highlighted: true,
  },
  {
    key: 'payment_validation',
    label: 'Validation Paiement',
    icon: 'money',
    description: 'Délais de validation et écarts de montants sur les demandes de paiement.',
    highlighted: true,
  },
  {
    key: 'inspection_overdue',
    label: 'Inspections en Retard',
    icon: 'alert',
    description: 'Inspections non réalisées et non-conformités non levées.',
    highlighted: true,
  },
  {
    key: 'material_wastage',
    label: 'Gaspillage Matériau',
    icon: 'settings',
    description: 'Écarts entre métré planifié (DQE) et consommation réelle.',
    highlighted: false,
  },
  {
    key: 'budget_allocation',
    label: 'Allocation Budget',
    icon: 'settings',
    description: 'Consommation budgétaire des phases et dépassements projet.',
    highlighted: false,
  },
];

export const ESCALATION_THRESHOLD_DEFAULTS: EscalationThresholdDefault[] = [
  { thresholdType: 'project_delay', thresholdName: 'Retard modéré', thresholdValue: 7, thresholdUnit: 'days', severityLevel: 'low', escalationLevel: 1, description: 'Retard de planning supérieur à 7 jours : alerte chef de projet' },
  { thresholdType: 'project_delay', thresholdName: 'Retard significatif', thresholdValue: 15, thresholdUnit: 'days', severityLevel: 'medium', escalationLevel: 2, description: 'Retard supérieur à 15 jours : escalade au directeur de projet' },
  { thresholdType: 'project_delay', thresholdName: 'Retard critique', thresholdValue: 30, thresholdUnit: 'days', severityLevel: 'critical', escalationLevel: 3, description: 'Retard supérieur à 30 jours : escalade direction générale' },
  { thresholdType: 'project_delay', thresholdName: 'Dérive avancement', thresholdValue: 10, thresholdUnit: 'percentage', severityLevel: 'high', escalationLevel: 2, description: 'Écart avancement planifié/réalisé supérieur à 10 %' },
  { thresholdType: 'insurance_expiry', thresholdName: 'Préavis standard', thresholdValue: 60, thresholdUnit: 'days', severityLevel: 'low', escalationLevel: 1, description: 'Assurance expirant dans 60 jours : notification gestionnaire' },
  { thresholdType: 'insurance_expiry', thresholdName: 'Préavis rapproché', thresholdValue: 30, thresholdUnit: 'days', severityLevel: 'medium', escalationLevel: 2, description: 'Assurance expirant dans 30 jours : relance formelle' },
  { thresholdType: 'insurance_expiry', thresholdName: 'Préavis critique', thresholdValue: 7, thresholdUnit: 'days', severityLevel: 'critical', escalationLevel: 3, description: 'Assurance expirant dans 7 jours : blocage des paiements' },
  { thresholdType: 'payment_validation', thresholdName: 'Validation en attente', thresholdValue: 10, thresholdUnit: 'days', severityLevel: 'medium', escalationLevel: 1, description: 'Demande de paiement non validée après 10 jours' },
  { thresholdType: 'payment_validation', thresholdName: 'Validation bloquée', thresholdValue: 20, thresholdUnit: 'days', severityLevel: 'high', escalationLevel: 2, description: 'Demande de paiement bloquée depuis 20 jours' },
  { thresholdType: 'payment_validation', thresholdName: 'Écart montant', thresholdValue: 5, thresholdUnit: 'percentage', severityLevel: 'critical', escalationLevel: 3, description: 'Écart supérieur à 5 % entre montant demandé et montant certifié' },
  { thresholdType: 'inspection_overdue', thresholdName: 'Inspection en retard', thresholdValue: 5, thresholdUnit: 'days', severityLevel: 'medium', escalationLevel: 1, description: 'Inspection planifiée non réalisée après 5 jours' },
  { thresholdType: 'inspection_overdue', thresholdName: 'Inspection très en retard', thresholdValue: 15, thresholdUnit: 'days', severityLevel: 'high', escalationLevel: 2, description: 'Inspection non réalisée après 15 jours' },
  { thresholdType: 'inspection_overdue', thresholdName: 'Non-conformité non levée', thresholdValue: 30, thresholdUnit: 'days', severityLevel: 'critical', escalationLevel: 3, description: 'Non-conformité ouverte depuis plus de 30 jours' },
  { thresholdType: 'material_wastage', thresholdName: 'Gaspillage toléré', thresholdValue: 5, thresholdUnit: 'percentage', severityLevel: 'low', escalationLevel: 1, description: 'Écart métré/consommé supérieur à 5 %' },
  { thresholdType: 'material_wastage', thresholdName: 'Gaspillage anormal', thresholdValue: 10, thresholdUnit: 'percentage', severityLevel: 'high', escalationLevel: 2, description: 'Écart métré/consommé supérieur à 10 %' },
  { thresholdType: 'budget_allocation', thresholdName: 'Consommation élevée', thresholdValue: 80, thresholdUnit: 'percentage', severityLevel: 'medium', escalationLevel: 1, description: 'Budget de phase consommé à plus de 80 %' },
  { thresholdType: 'budget_allocation', thresholdName: 'Dépassement budget', thresholdValue: 100, thresholdUnit: 'percentage', severityLevel: 'critical', escalationLevel: 3, description: 'Budget de projet dépassé (engagement > crédit)' },
];

/** Identifiant synthétique d'un défaut non encore persisté. */
export const referentialThresholdId = (type: string, name: string): string =>
  `ref:${type}:${name}`;

export const isReferentialThresholdId = (id: string): boolean => id.startsWith('ref:');

export const getEscalationCategory = (
  key: string,
): EscalationThresholdCategoryDefinition | undefined =>
  ESCALATION_THRESHOLD_CATEGORIES.find((c) => c.key === key);
