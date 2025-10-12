/**
 * Referential Registry
 * Central registry for all project referentials
 */

import { ProjectReferential, MultiLanguageLabel } from './somelec.referential';
import { somelecReferential } from './somelec.referential';
import { mauritanianPublicProcurementReferential } from './mauritanian-public-procurement.referential';
import { customStandardReferential } from './custom-standard.referential';
import { distributionRuraleReferential } from './distribution-rurale.referential';

export type ReferentialType = 
  | 'SOMELEC_INFRA' 
  | 'MR_PUBLIC_PROCUREMENT' 
  | 'CUSTOM_STANDARD' 
  | 'DISTRIBUTION_RURALE';

/**
 * Registry of all available project referentials
 */
export const REFERENTIAL_REGISTRY: Record<ReferentialType, ProjectReferential> = {
  SOMELEC_INFRA: somelecReferential,
  MR_PUBLIC_PROCUREMENT: mauritanianPublicProcurementReferential,
  CUSTOM_STANDARD: customStandardReferential,
  DISTRIBUTION_RURALE: distributionRuraleReferential
};

/**
 * Get a referential by its code
 */
export const getReferential = (code: ReferentialType): ProjectReferential | undefined => {
  return REFERENTIAL_REGISTRY[code];
};

/**
 * Get all available referentials
 */
export const getAllReferentials = (): ProjectReferential[] => {
  return Object.values(REFERENTIAL_REGISTRY);
};

/**
 * Get a label in a specific language
 */
export const getLabel = (label: MultiLanguageLabel, language: 'fr' | 'ar' | 'en' = 'fr'): string => {
  return label[language] || label.fr;
};

/**
 * Get referential names for dropdown selection
 */
export const getReferentialOptions = (language: 'fr' | 'ar' | 'en' = 'fr') => {
  return getAllReferentials().map(ref => ({
    value: ref.code,
    label: getLabel(ref.name, language),
    description: getLabel(ref.description, language)
  }));
};

/**
 * Get phases for a specific referential
 */
export const getPhasesForReferential = (referentialCode: ReferentialType, language: 'fr' | 'ar' | 'en' = 'fr') => {
  const referential = getReferential(referentialCode);
  if (!referential) return [];
  
  return referential.phases.map(phase => ({
    code: phase.code,
    label: getLabel(phase.label, language),
    description: phase.description ? getLabel(phase.description, language) : undefined,
    order: phase.order,
    steps: phase.steps.map(step => ({
      code: step.code,
      label: getLabel(step.label, language),
      order: step.order,
      tasks: step.tasks.map(task => ({
        code: task.code,
        label: getLabel(task.label, language),
        description: task.description ? getLabel(task.description, language) : undefined,
        requiresInspection: task.requiresInspection,
        requiresEngineerApproval: task.requiresEngineerApproval,
        estimatedDurationDays: task.estimatedDurationDays
      }))
    }))
  }));
};

/**
 * Export types and interfaces
 */
export type { ProjectReferential, MultiLanguageLabel };
export { somelecReferential, mauritanianPublicProcurementReferential, customStandardReferential, distributionRuraleReferential };
