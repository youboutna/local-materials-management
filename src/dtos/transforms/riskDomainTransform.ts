/**
 * Risk Domain Transformer - Enhanced with Calculations and Business Logic
 * Integrates risk calculations, validation, and UI-specific features
 * Following hexagonal architecture principles
 */

import { Risk, RiskStatus, RiskLevel } from '@/domain/entities/Risk';
import { RiskAnalytics } from '@/types/calculations';
import { BaseEntityDTO, EntityToDTOMapper, ValidationResult } from '@/dtos/shared';

// Enhanced types for UI components
export interface RiskDTO extends BaseEntityDTO {
  projectId: string;
  title: string;
  description: string | null;
  probability: number; // 0-1
  impact: number; // 0-1
  status: RiskStatus;
  mitigationStrategy: string | null;
  identifiedBy: string | null;
  identifiedDate: string | null;
  relatedTasks: string[];
  riskScore?: number;
  riskLevel?: RiskLevel;
}

export interface RiskResponseDto extends RiskDTO {
  // Enhanced fields for UI
  riskAnalytics?: {
    overallRiskScore: number;
    trendAnalysis: 'increasing' | 'stable' | 'decreasing';
    mitigationProgress: number;
    timeToResolution?: number;
  };
  impactAssessment?: {
    financialImpact: 'low' | 'medium' | 'high' | 'critical';
    scheduleImpact: 'low' | 'medium' | 'high' | 'critical';
    qualityImpact: 'low' | 'medium' | 'high' | 'critical';
    safetyImpact: 'low' | 'medium' | 'high' | 'critical';
  };
  recommendations?: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    assignedTo?: string;
  }>;
  history?: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    notes?: string;
  }>;
}

export interface CreateRiskRequestDto extends Omit<RiskDTO, 'id' | 'createdAt' | 'updatedAt'> {
  // Additional validation fields
  category?: 'technical' | 'financial' | 'schedule' | 'safety' | 'environmental' | 'legal';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  affectedAreas?: string[];
  stakeholders?: string[];
  requiredResources?: Array<{
    type: 'human' | 'material' | 'equipment' | 'financial';
    resourceId: string;
    quantity: number;
    estimatedCost: number;
  }>;
}

export interface UpdateRiskRequestDto extends Partial<CreateRiskRequestDto> {
  // Update-specific fields
  statusChangeReason?: string;
  mitigationUpdate?: {
    strategy: string;
    effectiveness: 'low' | 'medium' | 'high';
    notes?: string;
  };
  resolutionInfo?: {
    resolvedBy: string;
    resolvedAt: string;
    resolutionMethod: string;
    lessonsLearned?: string;
  };
}

export class RiskDomainTransformer implements EntityToDTOMapper<Risk, RiskDTO> {
  
  toDTO(entity: Risk): RiskDTO {
    return {
      id: entity.id,
      projectId: entity.projectId,
      title: entity.title,
      description: entity.description,
      probability: entity.probability,
      impact: entity.impact,
      status: entity.status,
      mitigationStrategy: entity.mitigationStrategy,
      identifiedBy: entity.identifiedBy,
      identifiedDate: entity.identifiedDate,
      relatedTasks: entity.relatedTasks,
      riskScore: entity.getRiskScore(),
      riskLevel: entity.getRiskLevel(),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  fromDTO(dto: RiskDTO): Risk {
    return new Risk(
      dto.id,
      dto.projectId,
      dto.title,
      dto.description,
      dto.probability,
      dto.impact,
      dto.status,
      dto.mitigationStrategy,
      dto.identifiedBy,
      dto.identifiedDate,
      dto.relatedTasks,
      dto.createdAt,
      dto.updatedAt
    );
  }

  fromEntityToDTO(entity: Risk): RiskResponseDto {
    const baseDTO = this.toDTO(entity);
    
    // Add enhanced UI features
    return {
      ...baseDTO,
      riskAnalytics: this.calculateRiskAnalytics(entity),
      impactAssessment: this.assessRiskImpact(entity),
      recommendations: this.generateRiskRecommendations(entity),
      history: [] // Would fetch from risk service
    };
  }

  fromDtosToAdapter(dtos: RiskDTO[]): RiskResponseDto[] {
    return dtos.map(dto => this.fromEntityToDTO(this.fromDTO(dto)));
  }

  toResponseDto(entity: Risk): RiskResponseDto {
    return this.fromEntityToDTO(entity);
  }

  toRequestDto(dto: CreateRiskRequestDto): RiskDTO {
    return {
      ...dto,
      id: '', // Will be generated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'identified' as RiskStatus
    };
  }

  toUpdateDto(dto: UpdateRiskRequestDto): Partial<RiskDTO> {
    return {
      ...dto,
      updatedAt: new Date().toISOString()
    };
  }

  validate(dto: RiskDTO): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Required fields validation
    if (!dto.title || dto.title.trim() === '') {
      errors.push('Risk title is required');
      fieldErrors.title = ['Risk title is required'];
    }

    if (!dto.projectId || dto.projectId.trim() === '') {
      errors.push('Project ID is required');
      fieldErrors.projectId = ['Project ID is required'];
    }

    // Probability validation
    if (dto.probability < 0 || dto.probability > 1) {
      errors.push('Probability must be between 0 and 1');
      fieldErrors.probability = ['Probability must be between 0 and 1'];
    }

    // Impact validation
    if (dto.impact < 0 || dto.impact > 1) {
      errors.push('Impact must be between 0 and 1');
      fieldErrors.impact = ['Impact must be between 0 and 1'];
    }

    // Risk score validation
    const calculatedScore = dto.probability * dto.impact;
    if (calculatedScore > 1) {
      errors.push('Risk score cannot exceed 1');
      fieldErrors.probability = ['Combined probability and impact cannot exceed 1'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Enhanced utility methods with calculations
  static calculateRiskAnalytics(risk: Risk): any {
    const overallRiskScore = risk.getRiskScore();
    const trendAnalysis = 'stable'; // Would calculate from historical data
    const mitigationProgress = risk.hasMitigation() ? 50 : 0; // Simplified

    return {
      overallRiskScore,
      trendAnalysis,
      mitigationProgress,
      timeToResolution: undefined // Would calculate from resolution data
    };
  }

  static assessRiskImpact(risk: Risk): any {
    const riskScore = risk.getRiskScore();
    const riskLevel = risk.getRiskLevel();

    const getImpactLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
      if (score >= 0.7) return 'critical';
      if (score >= 0.5) return 'high';
      if (score >= 0.3) return 'medium';
      return 'low';
    };

    return {
      financialImpact: getImpactLevel(riskScore * 0.8), // Weighted for financial
      scheduleImpact: getImpactLevel(riskScore * 0.9), // Weighted for schedule
      qualityImpact: getImpactLevel(riskScore * 0.7), // Weighted for quality
      safetyImpact: riskLevel === 'critical' ? 'critical' : getImpactLevel(riskScore * 0.6)
    };
  }

  static generateRiskRecommendations(risk: Risk): any[] {
    const recommendations: any[] = [];
    const riskLevel = risk.getRiskLevel();

    // Risk-based recommendations
    if (riskLevel === 'critical') {
      recommendations.push({
        action: 'Immediate mitigation required',
        priority: 'urgent' as const,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        assignedTo: risk.identifiedBy
      });
    }

    if (riskLevel === 'high') {
      recommendations.push({
        action: 'Develop mitigation plan',
        priority: 'high' as const,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    if (riskLevel === 'medium') {
      recommendations.push({
        action: 'Monitor and plan mitigation',
        priority: 'medium' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Mitigation-based recommendations
    if (!risk.hasMitigation()) {
      recommendations.push({
        action: 'Develop mitigation strategy',
        priority: 'high' as const,
        assignedTo: risk.identifiedBy
      });
    }

    return recommendations;
  }

  static calculateRiskMatrix(probability: number, impact: number): { level: RiskLevel; score: number } {
    const score = probability * impact;
    let level: RiskLevel;

    if (score >= 0.7) {
      level = 'critical';
    } else if (score >= 0.5) {
      level = 'high';
    } else if (score >= 0.3) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return { level, score };
  }

  static generateRiskReport(risk: Risk): any {
    const analytics = RiskDomainTransformer.calculateRiskAnalytics(risk);
    const impact = RiskDomainTransformer.assessRiskImpact(risk);
    const recommendations = RiskDomainTransformer.generateRiskRecommendations(risk);

    return {
      riskInfo: {
        id: risk.id,
        title: risk.title,
        status: risk.status,
        riskScore: risk.getRiskScore(),
        riskLevel: risk.getRiskLevel(),
        probability: risk.probability,
        impact: risk.impact
      },
      analytics,
      impact,
      recommendations,
      generatedAt: new Date().toISOString()
    };
  }

  static formatRiskScore(score: number): string {
    if (score >= 0.7) return `${(score * 100).toFixed(1)} (Critique)`;
    if (score >= 0.5) return `${(score * 100).toFixed(1)} (Élevé)`;
    if (score >= 0.3) return `${(score * 100).toFixed(1)} (Moyen)`;
    return `${(score * 100).toFixed(1)} (Faible)`;
  }

  static getRiskLevelColor(level: RiskLevel): string {
    switch (level) {
      case 'low': return '#10B981'; // Green
      case 'medium': return '#F59E0B'; // Amber
      case 'high': return '#EF4444'; // Red
      case 'critical': return '#991B1B'; // Dark Red
      default: return '#6B7280'; // Gray
    }
  }

  static validateRiskWorkflow(risk: Risk, workflow: any): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    if (workflow.requiresImmediateAction && !risk.requiresImmediateAction()) {
      errors.push('Risk requires immediate action');
      fieldErrors.status = ['Immediate action required'];
    }

    if (workflow.requiresMitigation && !risk.hasMitigation()) {
      errors.push('Risk requires mitigation strategy');
      fieldErrors.mitigationStrategy = ['Mitigation strategy required'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  static calculateRiskMetrics(risks: Risk[]): RiskAnalytics {
    const totalRisks = risks.length;
    const highRisks = risks.filter(r => r.getRiskLevel() === 'high').length;
    const criticalRisks = risks.filter(r => r.getRiskLevel() === 'critical').length;
    const mitigatedRisks = risks.filter(r => r.status === 'mitigated').length;

    const totalRiskScore = risks.reduce((sum, r) => sum + r.getRiskScore(), 0);
    const averageRiskScore = totalRisks > 0 ? totalRiskScore / totalRisks : 0;

    // Simplified trend analysis
    const riskTrend: 'increasing' | 'stable' | 'decreasing' = 'stable'; // Would calculate from historical data

    const topRisks = risks
      .map(r => ({
        id: r.id,
        title: r.title,
        riskScore: r.getRiskScore()
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    return {
      totalRisks,
      highRisks: highRisks + criticalRisks,
      mitigatedRisks,
      riskScore: averageRiskScore,
      riskTrend,
      topRisks
    };
  }

  static generateRiskHeatmap(risks: Risk[]): Array<{
    probability: string;
    impact: string;
    count: number;
    risks: Risk[];
  }> {
    const heatmap = [
      { probability: 'Faible', impact: 'Faible', count: 0, risks: [] },
      { probability: 'Faible', impact: 'Moyen', count: 0, risks: [] },
      { probability: 'Faible', impact: 'Élevé', count: 0, risks: [] },
      { probability: 'Moyen', impact: 'Faible', count: 0, risks: [] },
      { probability: 'Moyen', impact: 'Moyen', count: 0, risks: [] },
      { probability: 'Moyen', impact: 'Élevé', count: 0, risks: [] },
      { probability: 'Élevé', impact: 'Faible', count: 0, risks: [] },
      { probability: 'Élevé', impact: 'Moyen', count: 0, risks: [] },
      { probability: 'Élevé', impact: 'Élevé', count: 0, risks: [] }
    ];

    risks.forEach(risk => {
      const probLabel = risk.probability >= 0.7 ? 'Élevé' : risk.probability >= 0.3 ? 'Moyen' : 'Faible';
      const impactLabel = risk.impact >= 0.7 ? 'Élevé' : risk.impact >= 0.3 ? 'Moyen' : 'Faible';
      
      const cell = heatmap.find(h => h.probability === probLabel && h.impact === impactLabel);
      if (cell) {
        cell.count++;
        cell.risks.push(risk);
      }
    });

    return heatmap;
  }
}
