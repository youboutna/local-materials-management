/**
 * Inspection Domain Transformer with BTP Calculations and Business Logic
 * Implements hexagonal architecture principles with enriched calculations
 * Flow: UI => Supabase/API => Database | Database => Supabase/API => UI
 */

import { Inspection } from '@/domain/entities/Inspection';
import { InspectionDTO, InspectionDetailDTO, InspectionSummaryDTO, InspectionListItemDTO, CreateInspectionRequestDto, UpdateInspectionRequestDto } from '@/dtos/transforms/shared';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class InspectionDomainTransformer implements EntityToDTOMapper<Inspection, InspectionDTO> {
  /**
   * Calculate inspection compliance metrics
   */
  static calculateComplianceMetrics(inspection: Inspection): {
    complianceScore: number;
    criticalIssues: string[];
    recommendations: string[];
    nextInspectionDate: Date;
  } {
    const complianceScore = inspection.complianceScore || 100;
    const criticalIssues: string[] = (inspection as any).criticalIssues || [];
    const recommendations: string[] = [];
    
    // Calculate days since last inspection
    const lastInspectionDate = inspection.lastInspectionDate ? new Date(inspection.lastInspectionDate) : null;
    const now = new Date();
    const daysSinceLastInspection = lastInspectionDate ? Math.floor((now.getTime() - lastInspectionDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Determine next inspection date (30 days from now if not scheduled)
    let nextInspectionDate: Date = new Date(now.getTime() + (30 * 1000 * 60 * 60 * 24));
    if (inspection.nextScheduledDate) {
      nextInspectionDate = new Date(inspection.nextScheduledDate);
    }
    
    // Assess compliance score
    if (complianceScore < 70) {
      criticalIssues.push('Compliance score below threshold');
      recommendations.push('Immediate compliance review required');
    }
    
    if (daysSinceLastInspection > 90) {
      criticalIssues.push('Overdue inspection detected');
      recommendations.push('Schedule immediate inspection');
    }
    
    return {
      complianceScore,
      criticalIssues,
      recommendations,
      nextInspectionDate
    };
  }

  /**
   * Calculate inspection quality metrics
   */
  static calculateQualityMetrics(inspection: Inspection): {
    qualityScore: number;
    defectRate: number;
    inspectorPerformance: number;
    recommendations: string[];
  } {
    const qualityScore = inspection.qualityScore || 100;
    const defectRate = inspection.defectRate || 0;
    const inspectorPerformance = inspection.inspectorPerformance || 100;
    
    const recommendations: string[] = [];
    
    if (defectRate > 5) {
      recommendations.push('High defect rate detected - quality control needed');
    }
    
    if (inspectorPerformance < 80) {
      recommendations.push('Inspector performance below expectations');
    }
    
    if (qualityScore < 70) {
      recommendations.push('Quality score below acceptable - review inspection process');
    }
    
    return {
      qualityScore,
      defectRate,
      inspectorPerformance,
      recommendations
    };
  }

  /**
   * Calculate inspection risk assessment
   */
  static calculateRiskAssessment(inspection: Inspection): {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  } {
    const compliance = this.calculateComplianceMetrics(inspection);
    const quality = this.calculateQualityMetrics(inspection);
    
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    // Assess risk factors
    if (compliance.criticalIssues.length > 0) {
      riskFactors.push('Critical compliance issues');
      recommendations.push('Immediate corrective actions required');
    }
    
    if (quality.defectRate > 3) {
      riskFactors.push('High defect rate detected');
      recommendations.push('Implement quality control measures');
    }
    
    if (compliance.daysSinceLastInspection > 60) {
      riskFactors.push('Overdue inspection');
      recommendations.push('Schedule regular inspections');
    }
    
    // Determine overall risk level
    let riskLevel: 'low';
    if (riskFactors.length > 2) {
      riskLevel = 'high';
    } else if (riskFactors.length > 0) {
      riskLevel = 'medium';
    }
    
    return {
      riskLevel,
      riskFactors,
      recommendations
    };
  }

  /**
   * Transform Inspection entity to InspectionDTO
   */
  static toResponseDto(inspection: Inspection): InspectionDTO {
    const compliance = this.calculateComplianceMetrics(inspection);
    const quality = this.calculateQualityMetrics(inspection);
    const risk = this.calculateRiskAssessment(inspection);
    
    return {
      id: inspection.id,
      projectId: inspection.projectId || '',
      inspector: inspection.inspector || '',
      date: inspection.date,
      status: inspection.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending',
      progress: inspection.progress || 0,
      comments: inspection.comments || '',
      phaseId: inspection.phaseId || '',
      
      // Enriched fields
      complianceMetrics,
      qualityMetrics,
      riskAssessment,
      
      // BTP specific fields
      progressAtInspection: inspection.progressAtInspection || 0,
      documents: inspection.documents || [],
      issues: inspection.issues || [],
      
      // Location and site conditions
      siteConditions: inspection.siteConditions || '',
      weatherConditions: inspection.weatherConditions || '',
      temperature: inspection.temperature || null,
      humidity: inspection.humidity || null,
      
      // Metadata
      createdAt: inspection.createdAt,
      updatedAt: inspection.updatedAt
    };
  }

  /**
   * Transform CreateInspectionRequestDto to Inspection entity
   */
  static fromCreateDtoToEntity(dto: CreateInspectionRequestDto): Inspection {
    return Inspection.create({
      id: crypto.randomUUID(),
      projectId: dto.projectId || '',
      inspector: dto.inspector || '',
      date: dto.date ? new Date(dto.date) : new Date(),
      status: 'scheduled',
      progress: 0,
      comments: dto.comments || '',
      phaseId: dto.phaseId || '',
      
      // BTP specific fields
      documents: dto.documents || [],
      issues: dto.issues || [],
      
      // Location and site conditions
      siteConditions: dto.siteConditions || '',
      weatherConditions: dto.weatherConditions || '',
      temperature: dto.temperature || null,
      humidity: dto.humidity || null,
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Transform UpdateInspectionRequestDto to partial Inspection entity
   */
  static fromUpdateDtoToEntity(dto: UpdateInspectionRequestDto): Partial<Inspection> {
    return {
      inspector: dto.inspector,
      date: dto.date,
      status: dto.status,
      progress: dto.progress,
      comments: dto.comments,
      phaseId: dto.phaseId,
      
      // BTP specific fields
      documents: dto.documents,
      issues: dto.issues,
      
      // Location and site conditions
      siteConditions: dto.siteConditions,
      weatherConditions: dto.weatherConditions,
      temperature: dto.temperature,
      humidity: dto.humidity,
      
      // Metadata
      updatedAt: new Date()
    };
  }

  /**
   * Validate inspection data for business rules
   */
  static validateInspectionData(inspection: Partial<Inspection>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!inspection.inspector || inspection.inspector.trim() === '') {
      errors.push('Inspector name is required');
    }
    
    if (!inspection.date || !Date.parse(inspection.date)) {
      errors.push('Valid inspection date is required');
    }
    
    if (inspection.date && new Date(inspection.date) < new Date()) {
      errors.push('Inspection date cannot be in the past');
    }
    
    // Validate status
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'approved', 'rejected', 'requires_changes', 'pending'];
    if (inspection.status && !validStatuses.includes(inspection.status)) {
      errors.push(`Invalid inspection status: ${inspection.status}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
