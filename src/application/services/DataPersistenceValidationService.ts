/**
 * Data Persistence Validation Service
 * Validates complex data persistence across hexagonal architecture
 */

import { ProjectService } from './ProjectService';
import { PhaseService } from './PhaseService';
import { MaterialService } from './MaterialService';
import { RiskService } from './RiskService';
import { EmployeeService } from './EmployeeService';
import { SupplierService } from './SupplierService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface ValidationResult {
  isValid: boolean;
  entity: string;
  entityId: string;
  issues: ValidationIssue[];
  metrics: PersistenceMetrics;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  expectedType?: string;
  actualType?: string;
}

export interface PersistenceMetrics {
  totalEntities: number;
  validEntities: number;
  invalidEntities: number;
  dataIntegrityScore: number;
  lastValidated: Date;
}

export class DataPersistenceValidationService {
  private projectService: ProjectService;
  private phaseService: PhaseService;
  private materialService: MaterialService;
  private riskService: RiskService;
  private employeeService: EmployeeService;
  private supplierService: SupplierService;

  constructor() {
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
    this.phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
    this.materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
    this.riskService = new RiskService(RepositoryFactory.getRiskRepository());
    this.employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
    this.supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
  }

  /**
   * Validate all complex data persistence
   */
  static async validateAllComplexData(): Promise<ValidationResult[]> {
    const service = new DataPersistenceValidationService();
    const results: ValidationResult[] = [];

    try {
      // Validate Projects with complex relationships
      const projectResults = await service.validateProjects();
      results.push(...projectResults);

      // Validate Phases with nested data
      const phaseResults = await service.validatePhases();
      results.push(...phaseResults);

      // Validate Materials with complex properties
      const materialResults = await service.validateMaterials();
      results.push(...materialResults);

      // Validate Risks with complex assessments
      const riskResults = await service.validateRisks();
      results.push(...riskResults);

      // Validate Employees with organizational data
      const employeeResults = await service.validateEmployees();
      results.push(...employeeResults);

      // Validate Suppliers with complex business data
      const supplierResults = await service.validateSuppliers();
      results.push(...supplierResults);

      return results;
    } catch (error) {
      console.error('Error validating complex data:', error);
      throw new Error('Failed to validate complex data persistence');
    }
  }

  /**
   * Validate Projects with complex relationships
   */
  private async validateProjects(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    try {
      const projects = await this.projectService.getAllProjects();
      
      for (const project of projects) {
        const issues: ValidationIssue[] = [];
        
        // Validate required complex fields
        if (!project.phases || project.phases.length === 0) {
          issues.push({
            severity: 'error',
            field: 'phases',
            message: 'Project must have at least one phase',
            expectedType: 'Phase[]',
            actualType: typeof project.phases
          });
        }

        if (!project.materials || project.materials.length === 0) {
          issues.push({
            severity: 'warning',
            field: 'materials',
            message: 'Project should have materials defined',
            expectedType: 'Material[]',
            actualType: typeof project.materials
          });
        }

        if (!project.risks || project.risks.length === 0) {
          issues.push({
            severity: 'info',
            field: 'risks',
            message: 'Project should have risk assessments',
            expectedType: 'Risk[]',
            actualType: typeof project.risks
          });
        }

        // Validate complex object structure
        if (project.budget && typeof project.budget !== 'object') {
          issues.push({
            severity: 'error',
            field: 'budget',
            message: 'Budget must be a complex object with amount, currency, etc.',
            expectedType: 'BudgetObject',
            actualType: typeof project.budget
          });
        }

        // Validate nested relationships
        if (project.phases) {
          project.phases.forEach((phase, index) => {
            if (!phase.id || typeof phase.id !== 'string') {
              issues.push({
                severity: 'error',
                field: `phases[${index}].id`,
                message: 'Phase must have a valid ID',
                expectedType: 'string',
                actualType: typeof phase.id
              });
            }
          });
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Project',
          entityId: project.id,
          issues,
          metrics: {
            totalEntities: 1,
            validEntities: issues.filter(i => i.severity === 'error').length === 0 ? 1 : 0,
            invalidEntities: issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0,
            dataIntegrityScore: this.calculateIntegrityScore(issues),
            lastValidated: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error validating projects:', error);
    }

    return results;
  }

  /**
   * Validate Phases with nested data
   */
  private async validatePhases(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    try {
      const phases = await this.phaseService.getAllPhases();
      
      for (const phase of phases) {
        const issues: ValidationIssue[] = [];
        
        // Validate complex phase data
        if (!phase.tasks || phase.tasks.length === 0) {
          issues.push({
            severity: 'warning',
            field: 'tasks',
            message: 'Phase should have tasks defined',
            expectedType: 'Task[]',
            actualType: typeof phase.tasks
          });
        }

        // Validate nested task structure
        if (phase.tasks) {
          phase.tasks.forEach((task, index) => {
            if (!task.name || typeof task.name !== 'string') {
              issues.push({
                severity: 'error',
                field: `tasks[${index}].name`,
                message: 'Task must have a valid name',
                expectedType: 'string',
                actualType: typeof task.name
              });
            }

            if (!task.estimatedDuration || typeof task.estimatedDuration !== 'number') {
              issues.push({
                severity: 'warning',
                field: `tasks[${index}].estimatedDuration`,
                message: 'Task should have estimated duration',
                expectedType: 'number',
                actualType: typeof task.estimatedDuration
              });
            }
          });
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Phase',
          entityId: phase.id,
          issues,
          metrics: {
            totalEntities: 1,
            validEntities: issues.filter(i => i.severity === 'error').length === 0 ? 1 : 0,
            invalidEntities: issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0,
            dataIntegrityScore: this.calculateIntegrityScore(issues),
            lastValidated: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error validating phases:', error);
    }

    return results;
  }

  /**
   * Validate Materials with complex properties
   */
  private async validateMaterials(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    try {
      const materials = await this.materialService.getAllMaterials();
      
      for (const material of materials) {
        const issues: ValidationIssue[] = [];
        
        // Validate complex material properties
        if (!material.specifications || typeof material.specifications !== 'object') {
          issues.push({
            severity: 'warning',
            field: 'specifications',
            message: 'Material should have specifications',
            expectedType: 'SpecificationObject',
            actualType: typeof material.specifications
          });
        }

        if (!material.suppliers || material.suppliers.length === 0) {
          issues.push({
            severity: 'info',
            field: 'suppliers',
            message: 'Material should have associated suppliers',
            expectedType: 'Supplier[]',
            actualType: typeof material.suppliers
          });
        }

        // Validate nested supplier relationships
        if (material.suppliers) {
          material.suppliers.forEach((supplier, index) => {
            if (!supplier.id || typeof supplier.id !== 'string') {
              issues.push({
                severity: 'error',
                field: `suppliers[${index}].id`,
                message: 'Supplier must have a valid ID',
                expectedType: 'string',
                actualType: typeof supplier.id
              });
            }
          });
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Material',
          entityId: material.id,
          issues,
          metrics: {
            totalEntities: 1,
            validEntities: issues.filter(i => i.severity === 'error').length === 0 ? 1 : 0,
            invalidEntities: issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0,
            dataIntegrityScore: this.calculateIntegrityScore(issues),
            lastValidated: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error validating materials:', error);
    }

    return results;
  }

  /**
   * Validate Risks with complex assessments
   */
  private async validateRisks(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    try {
      const risks = await this.riskService.getAllRisks();
      
      for (const risk of risks) {
        const issues: ValidationIssue[] = [];
        
        // Validate complex risk assessment
        if (!risk.assessment || typeof risk.assessment !== 'object') {
          issues.push({
            severity: 'error',
            field: 'assessment',
            message: 'Risk must have assessment details',
            expectedType: 'RiskAssessment',
            actualType: typeof risk.assessment
          });
        }

        if (!risk.mitigation || typeof risk.mitigation !== 'string') {
          issues.push({
            severity: 'warning',
            field: 'mitigation',
            message: 'Risk should have mitigation strategy',
            expectedType: 'string',
            actualType: typeof risk.mitigation
          });
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Risk',
          entityId: risk.id,
          issues,
          metrics: {
            totalEntities: 1,
            validEntities: issues.filter(i => i.severity === 'error').length === 0 ? 1 : 0,
            invalidEntities: issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0,
            dataIntegrityScore: this.calculateIntegrityScore(issues),
            lastValidated: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error validating risks:', error);
    }

    return results;
  }

  /**
   * Validate Employees with organizational data
   */
  private async validateEmployees(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    try {
      const employees = await this.employeeService.getAllEmployees();
      
      for (const employee of employees) {
        const issues: ValidationIssue[] = [];
        
        // Validate complex organizational data
        if (!employee.hierarchy || typeof employee.hierarchy !== 'object') {
          issues.push({
            severity: 'warning',
            field: 'hierarchy',
            message: 'Employee should have hierarchy information',
            expectedType: 'HierarchyObject',
            actualType: typeof employee.hierarchy
          });
        }

        if (!employee.permissions || !Array.isArray(employee.permissions)) {
          issues.push({
            severity: 'error',
            field: 'permissions',
            message: 'Employee must have permissions array',
            expectedType: 'string[]',
            actualType: typeof employee.permissions
          });
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Employee',
          entityId: employee.id,
          issues,
          metrics: {
            totalEntities: 1,
            validEntities: issues.filter(i => i.severity === 'error').length === 0 ? 1 : 0,
            invalidEntities: issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0,
            dataIntegrityScore: this.calculateIntegrityScore(issues),
            lastValidated: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error validating employees:', error);
    }

    return results;
  }

  /**
   * Validate Suppliers with complex business data
   */
  private async validateSuppliers(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    try {
      const suppliers = await this.supplierService.getAllSuppliers();
      
      for (const supplier of suppliers) {
        const issues: ValidationIssue[] = [];
        
        // Validate complex business data
        if (!supplier.certifications || !Array.isArray(supplier.certifications)) {
          issues.push({
            severity: 'warning',
            field: 'certifications',
            message: 'Supplier should have certifications array',
            expectedType: 'Certification[]',
            actualType: typeof supplier.certifications
          });
        }

        if (!supplier.rating || typeof supplier.rating !== 'object') {
          issues.push({
            severity: 'info',
            field: 'rating',
            message: 'Supplier should have rating object',
            expectedType: 'RatingObject',
            actualType: typeof supplier.rating
          });
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Supplier',
          entityId: supplier.id,
          issues,
          metrics: {
            totalEntities: 1,
            validEntities: issues.filter(i => i.severity === 'error').length === 0 ? 1 : 0,
            invalidEntities: issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0,
            dataIntegrityScore: this.calculateIntegrityScore(issues),
            lastValidated: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error validating suppliers:', error);
    }

    return results;
  }

  /**
   * Calculate data integrity score
   */
  private calculateIntegrityScore(issues: ValidationIssue[]): number {
    if (issues.length === 0) return 100;
    
    const errorWeight = 10;
    const warningWeight = 5;
    const infoWeight = 1;
    
    const totalWeight = issues.reduce((sum, issue) => {
      switch (issue.severity) {
        case 'error': return sum + errorWeight;
        case 'warning': return sum + warningWeight;
        case 'info': return sum + infoWeight;
        default: return sum;
      }
    }, 0);
    
    const maxPossibleWeight = issues.length * errorWeight;
    return Math.max(0, 100 - (totalWeight / maxPossibleWeight) * 100);
  }

  /**
   * Generate validation report
   */
  static async generateValidationReport(): Promise<{
    summary: {
      totalValidations: number;
      passedValidations: number;
      failedValidations: number;
      overallScore: number;
    };
    details: ValidationResult[];
    recommendations: string[];
  }> {
    const results = await DataPersistenceValidationService.validateAllComplexData();
    
    const totalValidations = results.length;
    const passedValidations = results.filter(r => r.isValid).length;
    const failedValidations = totalValidations - passedValidations;
    const overallScore = results.reduce((sum, r) => sum + r.metrics.dataIntegrityScore, 0) / totalValidations;
    
    const recommendations = DataPersistenceValidationService.generateRecommendations(results);
    
    return {
      summary: {
        totalValidations,
        passedValidations,
        failedValidations,
        overallScore
      },
      details: results,
      recommendations
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private static generateRecommendations(results: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    const errorCount = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'error').length, 0);
    const warningCount = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'warning').length, 0);
    
    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} critical data integrity issues`);
    }
    
    if (warningCount > 0) {
      recommendations.push(`Address ${warningCount} data quality warnings`);
    }
    
    if (results.filter(r => r.entity === 'Project').some(r => !r.isValid)) {
      recommendations.push('Review project data structure and relationships');
    }
    
    if (results.filter(r => r.entity === 'Phase').some(r => !r.isValid)) {
      recommendations.push('Validate phase task definitions and dependencies');
    }
    
    if (results.filter(r => r.entity === 'Material').some(r => !r.isValid)) {
      recommendations.push('Complete material specifications and supplier relationships');
    }
    
    return recommendations;
  }
}
