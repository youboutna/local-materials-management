/**
 * Document Types Referential
 * Source unique des catégories / sous-catégories de documents projet.
 * Aligné sur l'enum DTO `DocumentType` (src/dtos/entities/DocumentDTO.ts).
 */

import { DocumentType } from '@/dtos/entities/DocumentDTO';

export type DocumentTypeCode = `${DocumentType}`;

export interface DocumentCategoryDefinition {
  key: string;
  label: string;
  types: DocumentTypeCode[];
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentTypeCode, string> = {
  contract: 'Contrat',
  plan: 'Plan',
  specification: 'Spécification',
  report: 'Rapport',
  certificate: 'Certificat',
  permit: 'Permis / Autorisation',
  invoice: 'Facture',
  receipt: 'Reçu',
  manual: 'Manuel',
  policy: 'Police / Politique',
  procedure: 'Procédure',
  drawing: 'Plan / Dessin',
  photo: 'Photo',
  video: 'Vidéo',
  blueprint: 'Plan d\'exécution',
  schema: 'Schéma',
  checklist: 'Checklist',
  form: 'Formulaire',
  template: 'Modèle',
  pv: 'Procès-verbal',
  service_report: 'Rapport de service',
  tender_document: 'Pièce d\'appel d\'offres',
  supporting_document: 'Pièce justificative',
  correspondence: 'Correspondance',
  insurance: 'Assurance',
  warranty: 'Garantie',
  bank_guarantee: 'Garantie bancaire',
  inspection_report: 'Rapport d\'inspection',
  location_photo: 'Photo de localisation',
  project_report: 'Rapport de projet',
  supplier_info: 'Information fournisseur',
  supplier_catalog: 'Catalogue fournisseur',
  task_assignment: 'Affectation de tâche',
  employee_record: 'Dossier employé',
  tender: 'Appel d\'offres',
  administrative: 'Document administratif',
  technical: 'Document technique',
  inspection: 'Inspection',
  payment: 'Document de paiement',
  payment_receipt: 'Reçu de paiement',
  supplier_upload: 'Upload fournisseur',
  delivery_note: 'Bon de livraison',
  other: 'Autre',
};

export const DOCUMENT_CATEGORIES: DocumentCategoryDefinition[] = [
  {
    key: 'administrative',
    label: 'Administratif',
    types: ['administrative', 'contract', 'correspondence', 'permit', 'form', 'template', 'policy', 'procedure'],
  },
  {
    key: 'technical',
    label: 'Technique',
    types: ['technical', 'specification', 'drawing', 'plan', 'blueprint', 'schema', 'manual', 'checklist'],
  },
  {
    key: 'inspection',
    label: 'Inspections & Rapports',
    types: ['inspection', 'inspection_report', 'report', 'project_report', 'service_report', 'pv'],
  },
  {
    key: 'financial',
    label: 'Financier',
    types: ['payment', 'invoice', 'payment_receipt', 'receipt', 'supporting_document'],
  },
  {
    key: 'compliance',
    label: 'Conformité (assurances & garanties)',
    types: ['insurance', 'warranty', 'bank_guarantee', 'certificate', 'permit'],
  },
  {
    key: 'tender',
    label: 'Appels d\'offres',
    types: ['tender', 'tender_document', 'supplier_catalog', 'supplier_info', 'supplier_upload'],
  },
  {
    key: 'delivery',
    label: 'Livraisons',
    types: ['delivery_note'],
  },
  {
    key: 'media',
    label: 'Photos & Médias',
    types: ['photo', 'location_photo', 'video'],
  },
  {
    key: 'hr',
    label: 'Ressources humaines',
    types: ['employee_record', 'task_assignment'],
  },
  {
    key: 'other',
    label: 'Autres',
    types: ['other'],
  },
];

/** Catégories mises en avant selon le contexte d'upload (l'ensemble reste accessible). */
const CONTEXT_PRIORITY: Record<string, string[]> = {
  project: ['administrative', 'technical', 'financial', 'compliance'],
  phase: ['technical', 'inspection', 'delivery', 'media'],
  step: ['technical', 'media', 'delivery'],
  task: ['technical', 'media', 'financial'],
  inspection: ['inspection', 'technical', 'media'],
  stakeholder: ['administrative', 'tender', 'hr'],
  compliance: ['compliance', 'administrative', 'technical'],
};

/**
 * Retourne toutes les catégories, celles pertinentes pour le contexte en premier.
 */
export function getDocumentCategoriesForContext(context: string): DocumentCategoryDefinition[] {
  const priority = CONTEXT_PRIORITY[context] ?? [];
  const head = priority
    .map((key) => DOCUMENT_CATEGORIES.find((c) => c.key === key))
    .filter((c): c is DocumentCategoryDefinition => Boolean(c));
  const tail = DOCUMENT_CATEGORIES.filter((c) => !priority.includes(c.key));
  return [...head, ...tail];
}

export function getDocumentTypeLabel(code: string | null | undefined): string {
  if (!code) return '';
  return DOCUMENT_TYPE_LABELS[code as DocumentTypeCode] ?? code;
}
