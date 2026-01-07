/**
 * Referential Registry
 * Central registry for all project referentials
 */

import { customStandardReferential } from './custom-standard.referential';
import { distributionRuraleReferential } from './distribution-rurale.referential';
import { mauritanianPublicProcurementReferential } from './mauritanian-public-procurement.referential';
import { pndsReferential } from './pnds.referential';
import { sdauReferential } from './snat-nouakchot.referential';
import { MultiLanguageLabel, ProjectReferential, somelecReferential } from './somelec.referential';

export type ReferentialType = 
  | 'SOMELEC_INFRA' 
  | 'MR_PUBLIC_PROCUREMENT' 
  | 'CUSTOM_STANDARD' 
  | 'DISTRIBUTION_RURALE' 
  |'PNDS_MAURITANIA_2021_2030'
  | 'SDAU_NOUAKCHOTT_2018_2040';

/**
 * Registry of all available project referentials
 */
export const REFERENTIAL_REGISTRY: Record<ReferentialType, ProjectReferential> = {
  SOMELEC_INFRA: somelecReferential,
  MR_PUBLIC_PROCUREMENT: mauritanianPublicProcurementReferential,
  CUSTOM_STANDARD: customStandardReferential,
  DISTRIBUTION_RURALE: distributionRuraleReferential,
  PNDS_MAURITANIA_2021_2030 : pndsReferential,
  SDAU_NOUAKCHOTT_2018_2040  : sdauReferential,
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
export { customStandardReferential, distributionRuraleReferential, mauritanianPublicProcurementReferential, pndsReferential, sdauReferential, somelecReferential };
export type { MultiLanguageLabel, ProjectReferential };

// NOTE: Do not re-export `ReferentialService` here to avoid circular
// dependencies with `src/services/ReferentialService.ts` which imports
// items from this module. Consumers should import the service directly
// from '@/services/ReferentialService' when needed.

/**
 * Re-export milestone referential utilities
 */
export { 
  getMilestoneTemplates, 
  getAvailablePhases, 
  REFERENTIAL_MILESTONES,
  getDefaultProjectMilestones,
  getDefaultPhaseMilestones,
  getMilestoneTemplatesWithDefaults,
  DEFAULT_PROJECT_MILESTONES,
  DEFAULT_PHASE_MILESTONES
} from './milestones.referential';
export { 
  getSomelceMilestoneTemplates, 
  getSomelceAvailablePhases, 
  SOMELEC_PHASE_MAPPING, 
  SOMELEC_ELECTRICAL_MILESTONES,
  getCompleteReferential,
  getReferentialType
} from './milestones-elec.referential';

