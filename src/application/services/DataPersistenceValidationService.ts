/**
 * Data Persistence Validation Service
 * Validates complex data persistence across hexagonal architecture
 * Simplified version aligned with existing DTOs and services
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { EmployeeService } from './EmployeeService';
import { MaterialService } from './MaterialService';
import { PhaseService } from './PhaseService';
import { ProjectService } from './ProjectService';
import { SupplierService } from './SupplierService';

// Local type definitions
export interface DataValidationIssueDTO {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

export interface PersistenceMetricsDTO {
  totalEntities: number;
  validEntities: number;
  invalidEntities: number;
  dataIntegrityScore: number;
  lastValidated: Date;
}

export interface DataValidationResultDTO {
  isValid: boolean;
  entity: string;
  entityId: string;
  issues: DataValidationIssueDTO[];
  metrics: PersistenceMetricsDTO;
}

export class DataPersistenceValidationService {
  private projectService: ProjectService;
  private phaseService: PhaseService;
  private materialService: MaterialService;
  private employeeService: EmployeeService;
  private supplierService: SupplierService;

  constructor() {
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
    this.phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
    this.materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
    this.employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
    this.supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
  }

  /**
   * Validate all complex data persistence
   */
  static async validateAllComplexData(): Promise<DataValidationResultDTO[]> {
    const service = new DataPersistenceValidationService();
    const results: DataValidationResultDTO[] = [];

    try {
      // Validate Projects
      const projectResults = await service.validateProjects();
      results.push(...projectResults);

      // Validate Phases
      const phaseResults = await service.validatePhases();
      results.push(...phaseResults);

      // Validate Materials
      const materialResults = await service.validateMaterials();
      results.push(...materialResults);

      // Validate Employees
      const employeeResults = await service.validateEmployees();
      results.push(...employeeResults);

      // Validate Suppliers
      const supplierResults = await service.validateSuppliers();
      results.push(...supplierResults);

      return results;
    } catch (error) {
      console.error('Error validating complex data:', error);
      throw new Error('Failed to validate complex data persistence');
    }
  }

  /**
   * Generate complete validation report
   */
  static async generateValidationReport(): Promise<{
    summary: {
      totalValidations: number;
      passedValidations: number;
      failedValidations: number;
      overallScore: number;
    };
    details: DataValidationResultDTO[];
    recommendations: string[];
  }> {
    const results = await DataPersistenceValidationService.validateAllComplexData();
    
    const totalValidations = results.length;
    const passedValidations = results.filter(r => r.isValid).length;
    const failedValidations = totalValidations - passedValidations;
    const overallScore = totalValidations > 0 ? (passedValidations / totalValidations) * 100 : 100;

    const recommendations: string[] = [];
    if (overallScore < 80) {
      recommendations.push('Improve data quality - score below 80%');
    }
    if (failedValidations > 0) {
      recommendations.push(`Fix ${failedValidations} validation failures`);
    }

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
   * Validate Projects
   */
  private async validateProjects(): Promise<DataValidationResultDTO[]> {
    const results: DataValidationResultDTO[] = [];
    
    try {
      const projects = await this.projectService.getAllProjects();
      
      for (const project of projects) {
        const issues: DataValidationIssueDTO[] = [];

        // Validate required fields
        if (!project.title || project.title.trim() === '') {
          issues.push({
            severity: 'error',
            field: 'title',
            message: 'Project title is required'
          });
        }

        // Validate budget
        if (project.budget < 0) {
          issues.push({
            severity: 'error',
            field: 'budget',
            message: 'Budget cannot be negative'
          });
        }

        // Validate progress
        if (project.progress < 0 || project.progress > 100) {
          issues.push({
            severity: 'warning',
            field: 'progress',
            message: 'Progress should be between 0 and 100'
          });
        }

        // Validate dates
        if (project.startDate && project.endDate) {
          const start = new Date(project.startDate);
          const end = new Date(project.endDate);
          if (end < start) {
            issues.push({
              severity: 'warning',
              field: 'endDate',
              message: 'End date is before start date'
            });
          }
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Project',
          entityId: project.id,
          issues,
          metrics: {
            totalEntities: projects.length,
            validEntities: 0, // Will be calculated at end
            invalidEntities: 0,
            dataIntegrityScore: 0,
            lastValidated: new Date()
          }
        });
      }

      // Update metrics
      const validCount = results.filter(r => r.isValid).length;
      for (const result of results) {
        result.metrics.validEntities = validCount;
        result.metrics.invalidEntities = results.length - validCount;
        result.metrics.dataIntegrityScore = results.length > 0 ? (validCount / results.length) * 100 : 100;
      }

      return results;
    } catch (error) {
      console.error('Error validating projects:', error);
      return [];
    }
  }

  /**
   * Validate Phases
   */
  private async validatePhases(): Promise<DataValidationResultDTO[]> {
    const results: DataValidationResultDTO[] = [];
    
    try {
      // Get all phases from all projects
      const projects = await this.projectService.getAllProjects();
      
      for (const project of projects) {
        const phases = await this.phaseService.getPhasesByProject(project.id);
        
        for (const phase of phases) {
          const issues: DataValidationIssueDTO[] = [];

          function isLegacyPhase(phase: unknown): phase is { phase_name?: string } {
            return typeof phase === 'object' && phase !== null && 'phase_name' in phase;
          }

          const phaseName = isLegacyPhase(phase) ? phase.phase_name || '' : (phase as any).name || (phase as any).phaseName || '';

          if (!phaseName || phaseName.trim() === '') {
            issues.push({
              severity: 'error',
              field: 'name',
              message: 'Phase name is required'
            });
          }

          // Validate progress
          const progress = phase.progress || 0;
          if (progress < 0 || progress > 100) {
            issues.push({
              severity: 'warning',
              field: 'progress',
              message: 'Progress should be between 0 and 100'
            });
          }

          results.push({
            isValid: issues.filter(i => i.severity === 'error').length === 0,
            entity: 'Phase',
            entityId: phase.id,
            issues,
            metrics: {
              totalEntities: phases.length,
              validEntities: 0,
              invalidEntities: 0,
              dataIntegrityScore: 0,
              lastValidated: new Date()
            }
          });
        }
      }

      // Update metrics
      const validCount = results.filter(r => r.isValid).length;
      for (const result of results) {
        result.metrics.validEntities = validCount;
        result.metrics.invalidEntities = results.length - validCount;
        result.metrics.dataIntegrityScore = results.length > 0 ? (validCount / results.length) * 100 : 100;
      }

      return results;
    } catch (error) {
      console.error('Error validating phases:', error);
      return [];
    }
  }

  /**
   * Validate Materials
   */
  private async validateMaterials(): Promise<DataValidationResultDTO[]> {
    const results: DataValidationResultDTO[] = [];
    
    try {
      const materials = await this.materialService.getAllMaterials();
      
      for (const material of materials) {
        const issues: DataValidationIssueDTO[] = [];

        // Validate required fields
        if (!material.name || material.name.trim() === '') {
          issues.push({
            severity: 'error',
            field: 'name',
            message: 'Material name is required'
          });
        }

        // Validate quantity (use quantity field instead of availableQuantity)
        const quantity = material.quantity ?? 0;
        if (quantity < 0) {
          issues.push({
            severity: 'error',
            field: 'quantity',
            message: 'Quantity cannot be negative'
          });
        }

        // Validate price
        if (material.pricePerUnit < 0) {
          issues.push({
            severity: 'error',
            field: 'pricePerUnit',
            message: 'Price cannot be negative'
          });
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Material',
          entityId: material.id,
          issues,
          metrics: {
            totalEntities: materials.length,
            validEntities: 0,
            invalidEntities: 0,
            dataIntegrityScore: 0,
            lastValidated: new Date()
          }
        });
      }

      // Update metrics
      const validCount = results.filter(r => r.isValid).length;
      for (const result of results) {
        result.metrics.validEntities = validCount;
        result.metrics.invalidEntities = results.length - validCount;
        result.metrics.dataIntegrityScore = results.length > 0 ? (validCount / results.length) * 100 : 100;
      }

      return results;
    } catch (error) {
      console.error('Error validating materials:', error);
      return [];
    }
  }

  /**
   * Validate Employees
   */
  private async validateEmployees(): Promise<DataValidationResultDTO[]> {
    const results: DataValidationResultDTO[] = [];
    
    try {
      const employees = await this.employeeService.getAllEmployees();
      
      for (const employee of employees) {
        const issues: DataValidationIssueDTO[] = [];

        // Validate required fields
        if (!employee.fullName || employee.fullName.trim() === '') {
          issues.push({
            severity: 'error',
            field: 'fullName',
            message: 'Employee name is required'
          });
        }

        // Validate email format
        if (employee.email && !this.isValidEmail(employee.email)) {
          issues.push({
            severity: 'warning',
            field: 'email',
            message: 'Invalid email format'
          });
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Employee',
          entityId: employee.id,
          issues,
          metrics: {
            totalEntities: employees.length,
            validEntities: 0,
            invalidEntities: 0,
            dataIntegrityScore: 0,
            lastValidated: new Date()
          }
        });
      }

      // Update metrics
      const validCount = results.filter(r => r.isValid).length;
      for (const result of results) {
        result.metrics.validEntities = validCount;
        result.metrics.invalidEntities = results.length - validCount;
        result.metrics.dataIntegrityScore = results.length > 0 ? (validCount / results.length) * 100 : 100;
      }

      return results;
    } catch (error) {
      console.error('Error validating employees:', error);
      return [];
    }
  }

  /**
   * Validate Suppliers
   */
  private async validateSuppliers(): Promise<DataValidationResultDTO[]> {
    const results: DataValidationResultDTO[] = [];
    
    try {
      const suppliers = await this.supplierService.getAllSuppliers();
      
      for (const supplier of suppliers) {
        const issues: DataValidationIssueDTO[] = [];

        // Validate required fields
        if (!supplier.name || supplier.name.trim() === '') {
          issues.push({
            severity: 'error',
            field: 'name',
            message: 'Supplier name is required'
          });
        }

        // Validate email format
        if (supplier.email && !this.isValidEmail(supplier.email)) {
          issues.push({
            severity: 'warning',
            field: 'email',
            message: 'Invalid email format'
          });
        }

        results.push({
          isValid: issues.filter(i => i.severity === 'error').length === 0,
          entity: 'Supplier',
          entityId: supplier.id,
          issues,
          metrics: {
            totalEntities: suppliers.length,
            validEntities: 0,
            invalidEntities: 0,
            dataIntegrityScore: 0,
            lastValidated: new Date()
          }
        });
      }

      // Update metrics
      const validCount = results.filter(r => r.isValid).length;
      for (const result of results) {
        result.metrics.validEntities = validCount;
        result.metrics.invalidEntities = results.length - validCount;
        result.metrics.dataIntegrityScore = results.length > 0 ? (validCount / results.length) * 100 : 100;
      }

      return results;
    } catch (error) {
      console.error('Error validating suppliers:', error);
      return [];
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
