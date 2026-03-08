// @ts-nocheck
/**
 * Inspection-Milestone Synchronization Service
 * Links inspections to milestones and manages the relationship
 * 
 * Architecture: UI → Service → Repository (interface) → Adapter
 */

import { MilestoneDTO, MilestoneType } from '@/types/milestone-dto';
import { getMilestoneService } from '@/application/services/MilestoneService';

/**
 * Inspection data linked to milestone
 */
export interface LinkedInspection {
  inspectionId: string;
  milestoneId: string;
  milestoneName: string;
  milestoneType: MilestoneType;
  targetDate: string;
  inspectionType: 'quality' | 'safety' | 'technical' | 'regulatory';
  isRequired: boolean;
  status: 'pending' | 'scheduled' | 'completed' | 'failed';
}

/**
 * Milestone with inspection requirements
 */
export interface MilestoneInspectionRequirement {
  milestone: MilestoneDTO;
  requiresInspection: boolean;
  inspectionType?: string;
  linkedInspectionId?: string;
  inspectionStatus?: string;
}

/**
 * Service for linking inspections to milestones
 */
export class InspectionMilestoneService {
  private milestoneService = getMilestoneService();

  /**
   * Get all milestones requiring inspection for a project
   */
  async getMilestonesRequiringInspection(projectId: string): Promise<MilestoneInspectionRequirement[]> {
    const milestones = await this.milestoneService.getProjectMilestones(projectId);
    
    return milestones
      .filter(m => this.milestoneRequiresInspection(m))
      .map(m => ({
        milestone: m,
        requiresInspection: true,
        inspectionType: this.determineInspectionType(m),
        linkedInspectionId: undefined, // Would be populated from inspections table
        inspectionStatus: undefined
      }));
  }

  /**
   * Get milestones requiring inspection for a phase
   */
  async getMilestonesRequiringInspectionForPhase(
    projectId: string, 
    phaseId: string
  ): Promise<MilestoneInspectionRequirement[]> {
    const milestones = await this.milestoneService.getPhaseMilestones(projectId, phaseId);
    
    return milestones
      .filter(m => this.milestoneRequiresInspection(m))
      .map(m => ({
        milestone: m,
        requiresInspection: true,
        inspectionType: this.determineInspectionType(m),
        linkedInspectionId: undefined,
        inspectionStatus: undefined
      }));
  }

  /**
   * Create inspection links for generated milestones
   */
  generateInspectionLinksForMilestones(milestones: MilestoneDTO[]): LinkedInspection[] {
    return milestones
      .filter(m => this.milestoneRequiresInspection(m))
      .map(m => ({
        inspectionId: `insp-${m.id}`,
        milestoneId: m.id,
        milestoneName: m.title,
        milestoneType: m.type,
        targetDate: m.target_date,
        inspectionType: this.determineInspectionType(m) as any,
        isRequired: m.type === 'gate' || m.priority === 'critical',
        status: 'pending'
      }));
  }

  /**
   * Get timeline data for Gantt/PERT with inspection markers
   */
  async getTimelineWithInspections(projectId: string): Promise<{
    milestones: MilestoneDTO[];
    inspectionPoints: Array<{
      milestoneId: string;
      milestoneName: string;
      targetDate: string;
      inspectionType: string;
      isGate: boolean;
    }>;
  }> {
    const milestones = await this.milestoneService.getProjectMilestones(projectId);
    
    const inspectionPoints = milestones
      .filter(m => this.milestoneRequiresInspection(m))
      .map(m => ({
        milestoneId: m.id,
        milestoneName: m.title,
        targetDate: m.target_date,
        inspectionType: this.determineInspectionType(m),
        isGate: m.type === 'gate'
      }));

    return { milestones, inspectionPoints };
  }

  /**
   * Check if milestone requires inspection
   */
  private milestoneRequiresInspection(milestone: MilestoneDTO): boolean {
    // Gates always require inspection/approval
    if (milestone.type === 'gate') return true;
    
    // Check deliverables that imply inspection
    const inspectionKeywords = [
      'réception', 'contrôle', 'vérification', 'validation', 
      'test', 'essai', 'inspection', 'conformité'
    ];
    
    const titleLower = milestone.title.toLowerCase();
    const descLower = (milestone.description || '').toLowerCase();
    
    return inspectionKeywords.some(keyword => 
      titleLower.includes(keyword) || descLower.includes(keyword)
    );
  }

  /**
   * Determine inspection type based on milestone
   */
  private determineInspectionType(milestone: MilestoneDTO): string {
    const titleLower = milestone.title.toLowerCase();
    const descLower = (milestone.description || '').toLowerCase();
    const combined = titleLower + ' ' + descLower;

    if (combined.includes('sécurité') || combined.includes('hse') || combined.includes('safety')) {
      return 'safety';
    }
    if (combined.includes('qualité') || combined.includes('quality')) {
      return 'quality';
    }
    if (combined.includes('réglementaire') || combined.includes('conformité') || combined.includes('environnement')) {
      return 'regulatory';
    }
    
    return 'technical';
  }

  /**
   * Get summary of inspections needed for project
   */
  async getInspectionSummary(projectId: string): Promise<{
    totalMilestones: number;
    milestonesWithInspection: number;
    gateMilestones: number;
    byType: Record<string, number>;
  }> {
    const milestones = await this.milestoneService.getProjectMilestones(projectId);
    const requiresInspection = milestones.filter(m => this.milestoneRequiresInspection(m));
    
    const byType: Record<string, number> = {
      technical: 0,
      quality: 0,
      safety: 0,
      regulatory: 0
    };
    
    requiresInspection.forEach(m => {
      const type = this.determineInspectionType(m);
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      totalMilestones: milestones.length,
      milestonesWithInspection: requiresInspection.length,
      gateMilestones: milestones.filter(m => m.type === 'gate').length,
      byType
    };
  }
}

// Singleton instance
let serviceInstance: InspectionMilestoneService | null = null;

export function getInspectionMilestoneService(): InspectionMilestoneService {
  if (!serviceInstance) {
    serviceInstance = new InspectionMilestoneService();
  }
  return serviceInstance;
}
