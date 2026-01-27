/**
 * Milestone Generator Service
 * Generates milestones from referentials when creating/updating phases
 * 
 * Architecture: UI → Service → Repository (interface) → Adapter
 * Low coupling with Supabase, supports Java/Prisma/PostGIS adapters
 */

import { getMilestoneTemplates } from '@/config/referentials/milestones.referential';
import { getSomelceMilestoneTemplates, SOMELEC_PHASE_MAPPING } from '@/config/referentials/milestones-elec.referential';
import { ReferentialType } from '@/config/referentials';
import { MilestoneFormDTO, MilestoneTemplateDTO } from '@/types/milestone-dto';
import { addDays, format, parseISO } from 'date-fns';

/**
 * Milestone generation configuration
 */
export interface MilestoneGenerationConfig {
  referentialType: ReferentialType;
  phaseCode: string;
  phaseStartDate: string;
  projectId: string;
  phaseId: string;
  phaseBudget?: number;
}

/**
 * Generated milestone with inspection link
 */
export interface GeneratedMilestoneDTO extends MilestoneFormDTO {
  requiresInspection: boolean;
  inspectionType?: 'quality' | 'safety' | 'technical' | 'regulatory';
  templateId: string;
  phaseCode: string;
}

/**
 * Service for generating milestones from referentials
 */
export class MilestoneGeneratorService {
  /**
   * Generate milestones for a phase based on referential
   */
  generateMilestonesForPhase(config: MilestoneGenerationConfig): GeneratedMilestoneDTO[] {
    const templates = this.getTemplatesForPhase(config.referentialType, config.phaseCode);
    
    if (templates.length === 0) {
      console.log(`No milestone templates for phase: ${config.phaseCode} in referential: ${config.referentialType}`);
      return [];
    }

    const startDate = parseISO(config.phaseStartDate);
    
    return templates.map(template => this.templateToMilestone(template, {
      startDate,
      projectId: config.projectId,
      phaseId: config.phaseId,
      phaseCode: config.phaseCode
    }));
  }

  /**
   * Generate milestones for multiple phases (batch generation)
   */
  generateMilestonesForProject(
    referentialType: ReferentialType,
    phases: Array<{
      phaseCode: string;
      phaseId: string;
      startDate: string;
    }>,
    projectId: string
  ): Map<string, GeneratedMilestoneDTO[]> {
    const milestonesByPhase = new Map<string, GeneratedMilestoneDTO[]>();

    for (const phase of phases) {
      const milestones = this.generateMilestonesForPhase({
        referentialType,
        phaseCode: phase.phaseCode,
        phaseStartDate: phase.startDate,
        projectId,
        phaseId: phase.phaseId
      });
      
      if (milestones.length > 0) {
        milestonesByPhase.set(phase.phaseId, milestones);
      }
    }

    return milestonesByPhase;
  }

  /**
   * Get milestone templates for a phase from the appropriate referential
   */
  private getTemplatesForPhase(referentialType: ReferentialType, phaseCode: string): MilestoneTemplateDTO[] {
    const normalizedPhase = phaseCode.toLowerCase().replace(/[- ]/g, '_');
    
    // Check referential type
    if (referentialType === 'SOMELEC_INFRA') {
      // Try SOMELEC electrical milestones first
      const somelecTemplates = getSomelceMilestoneTemplates(normalizedPhase);
      if (somelecTemplates.length > 0) {
        return somelecTemplates;
      }
      
      // Try mapping from SOMELEC phase codes
      const mappedPhase = SOMELEC_PHASE_MAPPING[phaseCode as keyof typeof SOMELEC_PHASE_MAPPING];
      if (mappedPhase) {
        return getSomelceMilestoneTemplates(mappedPhase);
      }
    }
    
    // Fall back to standard construction milestones
    return getMilestoneTemplates(normalizedPhase);
  }

  /**
   * Convert template to milestone form data
   */
  private templateToMilestone(
    template: MilestoneTemplateDTO,
    context: {
      startDate: Date;
      projectId: string;
      phaseId: string;
      phaseCode: string;
    }
  ): GeneratedMilestoneDTO {
    const targetDate = addDays(context.startDate, template.relative_offset_days);

    return {
      title: template.name,
      description: template.description,
      target_date: format(targetDate, 'yyyy-MM-dd'),
      type: template.type,
      priority: template.priority,
      weight: template.weight,
      deliverables: template.deliverables,
      dependencies: template.predecessor_ids,
      phase_id: context.phaseId,
      requiresInspection: template.requiresInspection || template.type === 'gate',
      inspectionType: this.determineInspectionType(template),
      templateId: template.id,
      phaseCode: context.phaseCode
    };
  }

  /**
   * Determine inspection type based on milestone template
   */
  private determineInspectionType(template: MilestoneTemplateDTO): 'quality' | 'safety' | 'technical' | 'regulatory' | undefined {
    if (!template.requiresInspection && template.type !== 'gate') {
      return undefined;
    }

    const tags = template.tags || [];
    
    if (tags.includes('sécurité') || tags.includes('HSE') || tags.includes('safety')) {
      return 'safety';
    }
    if (tags.includes('qualité') || tags.includes('contrôle') || tags.includes('quality')) {
      return 'quality';
    }
    if (tags.includes('réglementaire') || tags.includes('conformité') || tags.includes('regulatory')) {
      return 'regulatory';
    }
    if (tags.includes('technique') || tags.includes('tests') || tags.includes('technical')) {
      return 'technical';
    }

    return template.type === 'gate' ? 'technical' : undefined;
  }

  /**
   * Get available phases with milestones for a referential
   */
  getAvailablePhasesForReferential(referentialType: ReferentialType): string[] {
    if (referentialType === 'SOMELEC_INFRA') {
      return Object.keys(SOMELEC_PHASE_MAPPING);
    }
    
    // For other referentials, use standard phases
    return [
      'etudes_preliminaires',
      'conception',
      'pre_construction',
      'site_preparation',
      'foundation',
      'structural_work',
      'finishing',
      'post_construction',
      'handover'
    ];
  }

  /**
   * Count milestones that would be generated for a phase
   */
  countMilestonesForPhase(referentialType: ReferentialType, phaseCode: string): number {
    return this.getTemplatesForPhase(referentialType, phaseCode).length;
  }

  /**
   * Get milestone templates that require inspection
   */
  getInspectionMilestones(referentialType: ReferentialType, phaseCode: string): MilestoneTemplateDTO[] {
    return this.getTemplatesForPhase(referentialType, phaseCode)
      .filter(t => t.requiresInspection || t.type === 'gate');
  }
}

// Singleton instance
let generatorInstance: MilestoneGeneratorService | null = null;

export function getMilestoneGeneratorService(): MilestoneGeneratorService {
  if (!generatorInstance) {
    generatorInstance = new MilestoneGeneratorService();
  }
  return generatorInstance;
}
