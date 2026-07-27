/**
 * Enhanced Validation Service - Hexagonal Architecture
 * Comprehensive validation for all project aspects including risks, compliance, and reception
 */

import { IDocumentRepository } from '@/domain/repositories/IDocumentRepository';
import { IInspectionRepository } from '@/domain/repositories/IInspectionRepository';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IRiskRepository } from '@/domain/repositories/IRiskRepository';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

// Enhanced validation interfaces
export interface EnhancedValidationResult {
  isValid: boolean;
  overallScore: number;
  validationDate: string;
  validatedBy: string;
  categories: ValidationCategoryResult[];
  criticalIssues: ValidationIssue[];
  recommendations: string[];
  nextSteps: string[];
  expiryDate?: string;
}

export interface ValidationCategoryResult {
  category: ValidationCategory;
  score: number;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  issues: ValidationIssue[];
  recommendations: string[];
  requiredActions: string[];
  lastValidated: string;
  nextDue: string;
}

export interface ValidationIssue {
  id: string;
  category: ValidationCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedEntity?: string;
  impact: string;
  resolution: string;
  deadline?: string;
  assignedTo?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export enum ValidationCategory {
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  REGULATORY = 'regulatory',
  SAFETY = 'safety',
  QUALITY = 'quality',
  ENVIRONMENTAL = 'environmental',
  DOCUMENTATION = 'documentation',
  RECEPTION = 'reception',
  RISK = 'risk',
  COMPLIANCE = 'compliance'
}

export interface ValidationRule {
  id: string;
  category: ValidationCategory;
  name: string;
  description: string;
  required: boolean;
  validationType: 'automated' | 'manual' | 'hybrid';
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  criteria: ValidationCriteria[];
  weight: number;
  dependencies: string[];
}

export interface ValidationCriteria {
  id: string;
  name: string;
  type: 'boolean' | 'numeric' | 'text' | 'date' | 'file' | 'list';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists' | 'not_exists';
  value: any;
  weight: number;
}

export class EnhancedValidationService {
  private projectRepository: IProjectRepository;
  private riskRepository: IRiskRepository;
  private inspectionRepository: IInspectionRepository;
  private documentRepository: IDocumentRepository;

  constructor(
    projectRepository?: IProjectRepository,
    riskRepository?: IRiskRepository,
    inspectionRepository?: IInspectionRepository,
    documentRepository?: IDocumentRepository
  ) {
    this.projectRepository = projectRepository || RepositoryFactory.getProjectRepository();
    this.riskRepository = riskRepository || RepositoryFactory.getRiskRepository();
    this.inspectionRepository = inspectionRepository || RepositoryFactory.getInspectionRepository();
    this.documentRepository = documentRepository || RepositoryFactory.getDocumentRepository();
  }

  // =================== HELPER METHODS ===================
  
  /**
   * Get compliance items for project
   */
  private async getComplianceItems(projectId: string): Promise<any[]> {
    try {
      // This would typically use a compliance repository
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error getting compliance items:', error);
      return [];
    }
  }

  /**
   * Get receptions for project
   */
  private async getReceptions(projectId: string): Promise<any[]> {
    try {
      // This would typically use a reception repository
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      console.error('Error getting receptions:', error);
      return [];
    }
  }

  // =================== COMPREHENSIVE PROJECT VALIDATION ===================

  async validateProjectComplete(projectId: string, validatedBy: string): Promise<EnhancedValidationResult> {
    try {
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      // Get all project data
      const [risks, complianceItems, receptions, inspections, documents] = await Promise.all([
        this.riskRepository.findByProjectId(projectId),
        this.getComplianceItems(projectId),
        this.getReceptions(projectId),
        this.inspectionRepository.findByProjectId(projectId),
        this.documentRepository.findByProjectId(projectId)
      ]);

      // Validate each category
      const categories: ValidationCategoryResult[] = [];
      
      // Technical validation
      categories.push(await this.validateTechnical(project as any, inspections as any, documents as any));
      categories.push(await this.validateFinancial(project as any, documents as any));
      categories.push(await this.validateRegulatory(project as any, complianceItems, documents as any));
      categories.push(await this.validateSafety(project as any, inspections as any, documents as any));
      categories.push(await this.validateQuality(project as any, inspections as any, documents as any));
      categories.push(await this.validateEnvironmental(project as any, complianceItems, documents as any));
      categories.push(await this.validateDocumentation(project as any, documents as any));
      categories.push(await this.validateReception(project as any, receptions, documents as any));
      categories.push(await this.validateRisk(project as any, risks as any));
      categories.push(await this.validateCompliance(project as any, complianceItems));

      // Calculate overall results
      const overallScore = this.calculateOverallScore(categories);
      const criticalIssues = this.extractCriticalIssues(categories);
      const recommendations = this.generateRecommendations(categories);
      const nextSteps = this.generateNextSteps(categories, criticalIssues);

      const result: EnhancedValidationResult = {
        isValid: criticalIssues.length === 0 && overallScore >= 80,
        overallScore,
        validationDate: new Date().toISOString(),
        validatedBy,
        categories,
        criticalIssues,
        recommendations,
        nextSteps,
        expiryDate: this.calculateExpiryDate(categories)
      };

      // Save validation result (skip if no validation repository)
      try {
        await (this as any).validationRepository?.create({
          projectId,
          validationResult: result,
          createdAt: new Date().toISOString(),
          createdBy: validatedBy
        });
      } catch { /* validation repository optional */ }

      return result;
    } catch (error) {
      console.error('Failed to validate project:', error);
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Failed to validate project');
    }
  }

  // =================== CATEGORY VALIDATIONS ===================

  private async validateTechnical(
    project: ProjectDTO, 
    inspections: InspectionDTO[], 
    documents: DocumentDTO[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check technical specifications
    if (!(project as any).technicalSpecifications || (project as any).technicalSpecifications.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.TECHNICAL,
        'high',
        'Missing Technical Specifications',
        'Project lacks technical specifications documentation',
        'project',
        'Technical requirements cannot be validated without specifications',
        'Create and upload technical specifications document'
      ));
    }

    // Check inspection reports
    const technicalInspections = inspections.filter((i: any) => i.type === 'technical');
    if (technicalInspections.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.TECHNICAL,
        'medium',
        'No Technical Inspections',
        'No technical inspections have been performed',
        'project',
        'Technical compliance cannot be verified without inspections',
        'Schedule technical inspections for the project'
      ));
    }

    // Check technical documents
    const technicalDocs = documents.filter((d: any) => d.type === 'technical');
    if (technicalDocs.length < 3) {
      issues.push(this.createIssue(
        ValidationCategory.TECHNICAL,
        'medium',
        'Insufficient Technical Documentation',
        'Project requires at least 3 technical documents',
        'project',
        'Technical requirements may not be fully documented',
        'Upload additional technical documentation'
      ));
    }

    // Calculate score
    const score = Math.max(0, 100 - (issues.length * 15));
    
    return {
      category: ValidationCategory.TECHNICAL,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Ensure all technical specifications are documented',
        'Schedule regular technical inspections',
        'Maintain up-to-date technical documentation'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.TECHNICAL)
    };
  }

  private async validateFinancial(
    project: ProjectDTO, 
    documents: DocumentDTO[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check budget information
    if (!project.budget || project.budget <= 0) {
      issues.push(this.createIssue(
        ValidationCategory.FINANCIAL,
        'critical',
        'Invalid Budget',
        'Project budget is not properly defined',
        'project',
        'Financial planning cannot proceed without valid budget',
        'Define and validate project budget'
      ));
    }

    // Check financial documents
    const financialDocs = documents.filter((d: any) => d.type === 'financial');
    if (financialDocs.length < 2) {
      issues.push(this.createIssue(
        ValidationCategory.FINANCIAL,
        'high',
        'Insufficient Financial Documentation',
        'Project requires at least 2 financial documents',
        'project',
        'Financial tracking may be incomplete',
        'Upload budget and financial planning documents'
      ));
    }

    // Check payment tracking
    if (!(project as any).payments || (project as any).payments.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.FINANCIAL,
        'medium',
        'No Payment Records',
        'No payment transactions have been recorded',
        'project',
        'Financial progress cannot be tracked',
        'Set up payment tracking system'
      ));
    }

    const score = Math.max(0, 100 - (issues.length * 20));
    
    return {
      category: ValidationCategory.FINANCIAL,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Maintain detailed financial records',
        'Regular budget reviews and adjustments',
        'Implement payment tracking system'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.FINANCIAL)
    };
  }

  private async validateRegulatory(
    project: ProjectDTO, 
    complianceItems: any[], 
    documents: DocumentDTO[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check regulatory compliance
    const regulatoryCompliance = complianceItems.filter(c => c.type === 'regulatory');
    if (regulatoryCompliance.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.REGULATORY,
        'critical',
        'No Regulatory Compliance',
        'Project lacks regulatory compliance tracking',
        'project',
        'Project may not meet legal requirements',
        'Establish regulatory compliance framework'
      ));
    }

    // Check permits and licenses
    const permitDocs = documents.filter(d => d.documentType === 'permit');
    if (permitDocs.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.REGULATORY,
        'critical',
        'Missing Permits/Licenses',
        'No permits or licenses have been uploaded',
        'project',
        'Project may not be legally compliant',
        'Obtain and upload all required permits and licenses'
      ));
    }

    const score = Math.max(0, 100 - (issues.length * 25));
    
    return {
      category: ValidationCategory.REGULATORY,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Ensure all regulatory requirements are identified',
        'Maintain up-to-date permits and licenses',
        'Regular compliance audits'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.REGULATORY)
    };
  }

  private async validateSafety(
    project: ProjectDTO, 
    inspections: InspectionDTO[], 
    documents: DocumentDTO[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check safety inspections
    const safetyInspections = inspections.filter(i => i.type === 'safety');
    if (safetyInspections.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.SAFETY,
        'critical',
        'No Safety Inspections',
        'No safety inspections have been performed',
        'project',
        'Safety compliance cannot be verified',
        'Schedule comprehensive safety inspections'
      ));
    }

    // Check safety documents
    const safetyDocs = documents.filter((d: any) => d.type === 'safety');
    if (safetyDocs.length < 2) {
      issues.push(this.createIssue(
        ValidationCategory.SAFETY,
        'high',
        'Insufficient Safety Documentation',
        'Project requires at least 2 safety documents',
        'project',
        'Safety procedures may not be properly documented',
        'Upload safety procedures and risk assessments'
      ));
    }

    const score = Math.max(0, 100 - (issues.length * 20));
    
    return {
      category: ValidationCategory.SAFETY,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Implement regular safety inspections',
        'Maintain comprehensive safety documentation',
        'Establish safety training programs'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.SAFETY)
    };
  }

  private async validateQuality(
    project: ProjectDTO, 
    inspections: InspectionDTO[], 
    documents: DocumentDTO[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check quality inspections
    const qualityInspections = inspections.filter((i: any) => i.type === 'quality');
    if (qualityInspections.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.QUALITY,
        'high',
        'No Quality Inspections',
        'No quality inspections have been performed',
        'project',
        'Quality standards cannot be verified',
        'Implement quality inspection program'
      ));
    }

    // Check quality documents
    const qualityDocs = documents.filter((d: any) => d.type === 'quality');
    if (qualityDocs.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.QUALITY,
        'medium',
        'Missing Quality Documentation',
        'No quality standards documentation found',
        'project',
        'Quality requirements may not be defined',
        'Upload quality standards and procedures'
      ));
    }

    const score = Math.max(0, 100 - (issues.length * 15));
    
    return {
      category: ValidationCategory.QUALITY,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Establish quality standards and procedures',
        'Implement regular quality inspections',
        'Maintain quality documentation'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.QUALITY)
    };
  }

  private async validateEnvironmental(
    project: ProjectDTO, 
    complianceItems: any[], 
    documents: DocumentDTO[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check environmental compliance
    const environmentalCompliance = complianceItems.filter(c => c.type === 'environmental');
    if (environmentalCompliance.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.ENVIRONMENTAL,
        'medium',
        'No Environmental Compliance',
        'Project lacks environmental compliance tracking',
        'project',
        'Environmental impact may not be properly managed',
        'Establish environmental compliance framework'
      ));
    }

    // Check environmental documents
    const environmentalDocs = documents.filter((d: any) => d.type === 'environmental');
    if (environmentalDocs.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.ENVIRONMENTAL,
        'medium',
        'Missing Environmental Documentation',
        'No environmental impact documentation found',
        'project',
        'Environmental requirements may not be addressed',
        'Conduct environmental impact assessment'
      ));
    }

    const score = Math.max(0, 100 - (issues.length * 15));
    
    return {
      category: ValidationCategory.ENVIRONMENTAL,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Conduct environmental impact assessment',
        'Implement environmental monitoring',
        'Maintain environmental documentation'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.ENVIRONMENTAL)
    };
  }

  private async validateDocumentation(
    project: ProjectDTO, 
    documents: DocumentDTO[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check minimum documentation requirements
    if (documents.length < 5) {
      issues.push(this.createIssue(
        ValidationCategory.DOCUMENTATION,
        'medium',
        'Insufficient Documentation',
        'Project requires at least 5 documents',
        'project',
        'Project documentation may be incomplete',
        'Upload additional project documentation'
      ));
    }

    // Check document expiry
    const expiredDocs = documents.filter((d: any) => d.expiryDate && new Date(d.expiryDate) < new Date());
    if (expiredDocs.length > 0) {
      issues.push(this.createIssue(
        ValidationCategory.DOCUMENTATION,
        'high',
        'Expired Documents',
        `${expiredDocs.length} documents have expired`,
        'project',
        'Expired documents may not be valid for compliance',
        'Update or renew expired documents'
      ));
    }

    const score = Math.max(0, 100 - (issues.length * 10));
    
    return {
      category: ValidationCategory.DOCUMENTATION,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Maintain comprehensive project documentation',
        'Regular document review and updates',
        'Implement document management system'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.DOCUMENTATION)
    };
  }

  private async validateReception(
    project: ProjectDTO, 
    receptions: any[], 
    documents: DocumentDTO[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check provisional reception
    const provisionalReception = receptions.find(r => r.type === 'provisional');
    if (!provisionalReception) {
      issues.push(this.createIssue(
        ValidationCategory.RECEPTION,
        'medium',
        'No Provisional Reception',
        'Project lacks provisional reception record',
        'project',
        'Project completion cannot be properly validated',
        'Schedule provisional reception'
      ));
    }

    // Check definitive reception
    const definitiveReception = receptions.find(r => r.type === 'definitive');
    if (!definitiveReception && project.status === 'completed') {
      issues.push(this.createIssue(
        ValidationCategory.RECEPTION,
        'high',
        'No Definitive Reception',
        'Completed project lacks definitive reception',
        'project',
        'Project completion is not formally validated',
        'Conduct definitive reception'
      ));
    }

    const score = Math.max(0, 100 - (issues.length * 20));
    
    return {
      category: ValidationCategory.RECEPTION,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Schedule provisional and definitive receptions',
        'Maintain reception documentation',
        'Follow up on reception conditions'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.RECEPTION)
    };
  }

  private async validateRisk(
    project: ProjectDTO, 
    risks: RiskDTO[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check risk assessment
    if (risks.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.RISK,
        'critical',
        'No Risk Assessment',
        'Project lacks risk assessment',
        'project',
        'Project risks cannot be managed without assessment',
        'Conduct comprehensive risk assessment'
      ));
    }

    // Check high-risk items
    const highRisks = risks.filter(r => (r.probability * r.impact) > 50);
    if (highRisks.length > 0) {
      issues.push(this.createIssue(
        ValidationCategory.RISK,
        'high',
        'High Risk Items Detected',
        `${highRisks.length} high-risk items require attention`,
        'project',
        'High risks may impact project success',
        'Implement risk mitigation strategies'
      ));
    }

    // Check risk mitigation
    const unmitigatedRisks = risks.filter((r: any) => !r.mitigation || r.mitigation.trim() === '');
    if (unmitigatedRisks.length > 0) {
      issues.push(this.createIssue(
        ValidationCategory.RISK,
        'medium',
        'Unmitigated Risks',
        `${unmitigatedRisks.length} risks lack mitigation plans`,
        'project',
        'Unmitigated risks may materialize without preparation',
        'Develop mitigation plans for all identified risks'
      ));
    }

    const score = Math.max(0, 100 - (issues.length * 15));
    
    return {
      category: ValidationCategory.RISK,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Conduct regular risk assessments',
        'Implement risk mitigation strategies',
        'Monitor and review risks regularly'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.RISK)
    };
  }

  private async validateCompliance(
    project: ProjectDTO, 
    complianceItems: any[]
  ): Promise<ValidationCategoryResult> {
    const issues: ValidationIssue[] = [];
    const recommendations: string[] = [];
    const requiredActions: string[] = [];

    // Check compliance items
    if (complianceItems.length === 0) {
      issues.push(this.createIssue(
        ValidationCategory.COMPLIANCE,
        'critical',
        'No Compliance Framework',
        'Project lacks compliance tracking',
        'project',
        'Compliance requirements cannot be managed',
        'Establish comprehensive compliance framework'
      ));
    }

    // Check overdue compliance items
    const overdueItems = complianceItems.filter(c => 
      c.deadline && new Date(c.deadline) < new Date() && c.status !== 'approved'
    );
    if (overdueItems.length > 0) {
      issues.push(this.createIssue(
        ValidationCategory.COMPLIANCE,
        'high',
        'Overdue Compliance Items',
        `${overdueItems.length} compliance items are overdue`,
        'project',
        'Overdue compliance items may result in penalties',
        'Address overdue compliance items immediately'
      ));
    }

    const score = Math.max(0, 100 - (issues.length * 20));
    
    return {
      category: ValidationCategory.COMPLIANCE,
      score,
      status: this.getValidationStatus(score),
      issues,
      recommendations: [
        'Maintain comprehensive compliance tracking',
        'Regular compliance audits and reviews',
        'Address compliance issues promptly'
      ],
      requiredActions: issues.map(i => i.resolution),
      lastValidated: new Date().toISOString(),
      nextDue: this.calculateNextDue(ValidationCategory.COMPLIANCE)
    };
  }

  // =================== HELPER METHODS ===================

  private createIssue(
    category: ValidationCategory,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description: string,
    affectedEntity: string = '',
    impact: string = '',
    resolution: string = ''
  ): ValidationIssue {
    return {
      id: `issue-${Date.now()}-${crypto.randomUUID().slice(0, 9)}`,
      category,
      severity,
      title,
      description,
      affectedEntity,
      impact,
      resolution,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private calculateOverallScore(categories: ValidationCategoryResult[]): number {
    if (categories.length === 0) return 0;
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    return Math.round(totalScore / categories.length);
  }

  private extractCriticalIssues(categories: ValidationCategoryResult[]): ValidationIssue[] {
    return categories
      .flatMap(cat => cat.issues)
      .filter(issue => issue.severity === 'critical');
  }

  private generateRecommendations(categories: ValidationCategoryResult[]): string[] {
    const recommendations = new Set<string>();
    
    categories.forEach(cat => {
      cat.recommendations.forEach(rec => recommendations.add(rec));
    });

    // Add general recommendations
    recommendations.add('Schedule regular validation reviews');
    recommendations.add('Maintain comprehensive documentation');
    recommendations.add('Implement continuous monitoring systems');

    return Array.from(recommendations);
  }

  private generateNextSteps(categories: ValidationCategoryResult[], criticalIssues: ValidationIssue[]): string[] {
    const nextSteps: string[] = [];

    // Address critical issues first
    if (criticalIssues.length > 0) {
      nextSteps.push(`Address ${criticalIssues.length} critical issues immediately`);
    }

    // Address failed categories
    const failedCategories = categories.filter(cat => cat.status === 'failed');
    if (failedCategories.length > 0) {
      nextSteps.push(`Resolve ${failedCategories.length} failed validation categories`);
    }

    // Address warning categories
    const warningCategories = categories.filter(cat => cat.status === 'warning');
    if (warningCategories.length > 0) {
      nextSteps.push(`Review ${warningCategories.length} categories with warnings`);
    }

    // Schedule next validation
    nextSteps.push('Schedule next comprehensive validation');

    return nextSteps;
  }

  private getValidationStatus(score: number): 'passed' | 'failed' | 'warning' | 'pending' {
    if (score >= 90) return 'passed';
    if (score >= 70) return 'warning';
    if (score >= 50) return 'failed';
    return 'pending';
  }

  private calculateNextDue(category: ValidationCategory): string {
    const frequencies: Record<ValidationCategory, number> = {
      [ValidationCategory.TECHNICAL]: 30, // 30 days
      [ValidationCategory.FINANCIAL]: 30,
      [ValidationCategory.REGULATORY]: 90, // 90 days
      [ValidationCategory.SAFETY]: 14, // 14 days
      [ValidationCategory.QUALITY]: 30,
      [ValidationCategory.ENVIRONMENTAL]: 60, // 60 days
      [ValidationCategory.DOCUMENTATION]: 30,
      [ValidationCategory.RECEPTION]: 1, // 1 day for receptions
      [ValidationCategory.RISK]: 30,
      [ValidationCategory.COMPLIANCE]: 30
    };

    const days = frequencies[category] || 30;
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + days);
    return nextDue.toISOString().split('T')[0];
  }

  private calculateExpiryDate(categories: ValidationCategoryResult[]): string {
    // Find the earliest next due date
    const nextDueDates = categories.map(cat => new Date(cat.nextDue));
    const earliestDate = new Date(Math.min(...nextDueDates.map(date => date.getTime())));
    return earliestDate.toISOString();
  }

  // =================== VALIDATION HISTORY ===================

  async getValidationHistory(projectId: string): Promise<EnhancedValidationResult[]> {
    try {
      return await (this as any).validationRepository?.findByProjectId(projectId) || [];
    } catch (error) {
      console.error('Failed to get validation history:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get validation history');
    }
  }

  async getValidationTrends(projectId: string, months: number = 12): Promise<{
    dates: string[];
    scores: number[];
    categories: Record<ValidationCategory, number[]>;
  }> {
    try {
      const history = await this.getValidationHistory(projectId);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);

      const recentValidations = history.filter(v => 
        new Date(v.validationDate) >= cutoffDate
      );

      const dates = recentValidations.map(v => v.validationDate.split('T')[0]);
      const scores = recentValidations.map(v => v.overallScore);

      const categories: Record<ValidationCategory, number[]> = {} as any;
      Object.values(ValidationCategory).forEach(category => {
        categories[category] = recentValidations.map(v => 
          v.categories.find(c => c.category === category)?.score || 0
        );
      });

      return { dates, scores, categories };
    } catch (error) {
      console.error('Failed to get validation trends:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to get validation trends');
    }
  }
}
