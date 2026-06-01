/**
 * Project Workflow Steps Referential
 * Source unique des étapes du workflow projet (création ET édition).
 * Aligné sur ARCHITECTURE_REFERENTIELS.md — pas de hardcoding dans l'UI.
 *
 * Chaque étape expose :
 *  - métadonnées (code, label, description, icône-string)
 *  - validateur pur sur ProjectWorkflowData
 */

import type { ProjectWorkflowData } from '@/dtos/workflows/ProjectWorkflowDTOs';

export type WorkflowStepCode =
  | 'project_info'
  | 'stakeholders'
  | 'location'
  | 'wbs'
  | 'risks'
  | 'compliance'
  | 'strategic_linkage'
  | 'validation';

export type WorkflowStepIcon =
  | 'building'
  | 'users'
  | 'map-pin'
  | 'layers'
  | 'alert-triangle'
  | 'file-check'
  | 'target'
  | 'check-circle';

export interface WorkflowStepConfig {
  id: number;
  code: WorkflowStepCode;
  title: string;
  description: string;
  icon: WorkflowStepIcon;
  color: string;
  validate: (data: ProjectWorkflowData | null | undefined) => boolean;
  /** Validation message (pour debug / UI). */
  hint?: string;
}

const hasStakeholders = (d: ProjectWorkflowData | null | undefined): boolean => {
  if (!d) return false;
  const pm = d.projectData?.projectManagerId
    || (d.projectData as unknown as Record<string, unknown>)?.projectResponsableId as string | undefined;
  const stakeholders = d.relatedData?.stakeholders || [];
  return Boolean(pm) || stakeholders.length > 0;
};

export const PROJECT_WORKFLOW_STEPS: WorkflowStepConfig[] = [
  {
    id: 1,
    code: 'project_info',
    title: 'Informations du projet',
    description: 'Type, budget, dates, référence',
    icon: 'building',
    color: 'bg-blue-500',
    hint: 'Titre, description, budget>0, dates de début et fin requis',
    validate: (d) => {
      const p = d?.projectData;
      if (!p) return false;
      return Boolean(
        p.title &&
        p.description &&
        (p.budget || 0) > 0 &&
        p.startDate &&
        p.endDate
      );
    },
  },
  {
    id: 2,
    code: 'stakeholders',
    title: 'Parties prenantes',
    description: 'Bailleurs, Ministères, Entreprises, Banques, Bureau conseil',
    icon: 'users',
    color: 'bg-green-500',
    hint: 'Au moins un Chef de projet ou une partie prenante requise',
    validate: hasStakeholders,
  },
  {
    id: 3,
    code: 'location',
    title: 'Localisation',
    description: 'Géolocalisation interactive (Maps/Leaflet)',
    icon: 'map-pin',
    color: 'bg-cyan-500',
    validate: (d) => {
      const p = d?.projectData;
      if (!p) return false;
      return Boolean((p.latitude || p.longitude) || p.address || p.location);
    },
  },
  {
    id: 4,
    code: 'wbs',
    title: 'Planification WBS',
    description: 'Phase → Step → Task avec documents, ressources, inspections',
    icon: 'layers',
    color: 'bg-indigo-500',
    validate: (d) => Boolean((d?.relatedData?.phases || []).length > 0),
  },
  {
    id: 5,
    code: 'risks',
    title: 'Risques',
    description: 'Analyse et gestion des risques',
    icon: 'alert-triangle',
    color: 'bg-red-500',
    // Étape optionnelle — toujours franchissable
    validate: () => true,
  },
  {
    id: 6,
    code: 'compliance',
    title: 'Conformité',
    description: 'Standards Entreprise et bailleurs (BM, BAD, BID, AFD)',
    icon: 'file-check',
    color: 'bg-amber-500',
    validate: () => true,
  },
  {
    id: 7,
    code: 'strategic_linkage',
    title: 'Liaisons stratégiques',
    description: 'SCAPP et Loi de Finances 2026',
    icon: 'target',
    color: 'bg-purple-500',
    validate: () => true,
  },
  {
    id: 8,
    code: 'validation',
    title: 'Validation',
    description: 'Réception définitive et clôture',
    icon: 'check-circle',
    color: 'bg-teal-500',
    validate: () => true,
  },
];

export const getStepByCode = (code: WorkflowStepCode): WorkflowStepConfig | undefined =>
  PROJECT_WORKFLOW_STEPS.find((s) => s.code === code);

export const getStepByIndex = (index: number): WorkflowStepConfig | undefined =>
  PROJECT_WORKFLOW_STEPS[index];

/** Validation globale : retourne la liste des codes d'étapes non valides. */
export const validateWorkflow = (data: ProjectWorkflowData | null | undefined): WorkflowStepCode[] =>
  PROJECT_WORKFLOW_STEPS.filter((s) => !s.validate(data)).map((s) => s.code);
