/**
 * Data Consistency Monitoring Service
 * Monitors data consistency across hexagonal architecture
 * Simplified version aligned with existing DTOs and services
 */

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { EmployeeService } from './EmployeeService';
import { MaterialService } from './MaterialService';
import { PhaseService } from './PhaseService';
import { ProjectService } from './ProjectService';
import { SupplierService } from './SupplierService';
import { getProjectService } from '@/application/services/ProjectService';
import { getSupplierService } from '@/application/services/SupplierService';
import { getMaterialService } from '@/application/services/MaterialService';

// Local type definitions that match what this service needs
export interface ConsistencyIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  recordId: string;
  field: string;
  message: string;
  expectedValue: string | number | boolean | Date;
  actualValue: string | number | boolean | Date;
  suggestedFix: string;
}

export interface ConsistencyReport {
  timestamp: Date;
  entity: string;
  totalRecords: number;
  consistentRecords: number;
  inconsistentRecords: number;
  consistencyScore: number;
  issues: ConsistencyIssue[];
  recommendations: string[];
}

export interface MonitoringReport {
  timestamp: string;
  checksPerformed: number;
  issuesFound: number;
  criticalIssues: number;
  warnings: string[];
}

export class DataConsistencyMonitoringService {
  private projectService: ProjectService;
  private phaseService: PhaseService;
  private materialService: MaterialService;
  private employeeService: EmployeeService;
  private supplierService: SupplierService;

  constructor() {
    this.projectService = getProjectService();
    this.phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
    this.materialService = getMaterialService();
    this.employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
    this.supplierService = getSupplierService();
  }

  /**
   * Monitor all data consistency
   */
  static async monitorAllDataConsistency(): Promise<ConsistencyReport[]> {
    const service = new DataConsistencyMonitoringService();
    const reports: ConsistencyReport[] = [];

    try {
      // Monitor Projects consistency
      const projectReport = await service.monitorProjectConsistency();
      reports.push(projectReport);

      // Monitor Phases consistency
      const phaseReport = await service.monitorPhaseConsistency();
      reports.push(phaseReport);

      // Monitor Materials consistency
      const materialReport = await service.monitorMaterialConsistency();
      reports.push(materialReport);

      // Monitor Employees consistency
      const employeeReport = await service.monitorEmployeeConsistency();
      reports.push(employeeReport);

      // Monitor Suppliers consistency
      const supplierReport = await service.monitorSupplierConsistency();
      reports.push(supplierReport);

      return reports;
    } catch (error) {
      console.error('Error monitoring data consistency:', error);
      throw new Error('Failed to monitor data consistency');
    }
  }

  /**
   * Generate complete monitoring report
   */
  static async generateMonitoringReport(): Promise<MonitoringReport> {
    const reports = await DataConsistencyMonitoringService.monitorAllDataConsistency();
    
    // Calculate overall metrics
    let totalIssues = 0;
    let criticalIssues = 0;
    const warnings: string[] = [];

    for (const report of reports) {
      totalIssues += report.issues.length;
      criticalIssues += report.issues.filter(i => i.severity === 'critical').length;
      
      // Add high priority issues as warnings
      const highIssues = report.issues.filter(i => i.severity === 'high');
      for (const issue of highIssues) {
        warnings.push(`${report.entity}: ${issue.message}`);
      }
    }

    // Calculate total checks performed
    const checksPerformed = reports.reduce((sum, r) => sum + r.totalRecords, 0);

    // Generate recommendations
    if (criticalIssues > 0) {
      warnings.push('Address critical data consistency issues immediately');
    }
    if (totalIssues > 10) {
      warnings.push('Improve overall data quality - high number of issues found');
    }

    return {
      timestamp: new Date().toISOString(),
      checksPerformed,
      issuesFound: totalIssues,
      criticalIssues,
      warnings
    };
  }

  /**
   * Monitor Project consistency
   */
  private async monitorProjectConsistency(): Promise<ConsistencyReport> {
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const projects = await this.projectService.getAllProjects();
      
      for (const project of projects) {
        // Check project status consistency
        const validStatuses = ['planning', 'in_progress', 'completed', 'cancelled', 'on_hold'];
        if (project.status && !validStatuses.includes(project.status)) {
          issues.push({
            severity: 'low',
            recordId: project.id,
            field: 'status',
            message: 'Invalid project status',
            expectedValue: validStatuses.join(' | '),
            actualValue: project.status,
            suggestedFix: 'Update project status to valid value'
          });
        }

        // Check progress value range
        if (project.progress < 0 || project.progress > 100) {
          issues.push({
            severity: 'medium',
            recordId: project.id,
            field: 'progress',
            message: 'Progress value out of range',
            expectedValue: '0-100',
            actualValue: project.progress,
            suggestedFix: 'Correct progress to be within 0-100'
          });
        }

        // Check budget is positive
        if (project.budget !== undefined && project.budget < 0) {
          issues.push({
            severity: 'high',
            recordId: project.id,
            field: 'budget',
            message: 'Negative budget value',
            expectedValue: '>= 0',
            actualValue: project.budget,
            suggestedFix: 'Correct budget to be positive'
          });
        }
      }

      const totalRecords = projects.length;
      const consistentRecords = projects.filter(p => 
        issues.filter(i => i.recordId === p.id).length === 0
      ).length;

      if (issues.filter(i => i.severity === 'critical' || i.severity === 'high').length > 0) {
        recommendations.push('Address critical project data issues');
      }

      return {
        timestamp: new Date(),
        entity: 'Project',
        totalRecords,
        consistentRecords,
        inconsistentRecords: totalRecords - consistentRecords,
        consistencyScore: totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring project consistency:', error);
      return this.createErrorReport('Project');
    }
  }

  /**
   * Monitor Phase consistency
   */
  private async monitorPhaseConsistency(): Promise<ConsistencyReport> {
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const phases = await this.phaseService.getPhasesByProject('');
      
      for (const phase of phases) {
        // Check phase status consistency
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (phase.status && !validStatuses.includes(phase.status)) {
          issues.push({
            severity: 'low',
            recordId: phase.id,
            field: 'status',
            message: 'Invalid phase status',
            expectedValue: validStatuses.join(' | '),
            actualValue: phase.status,
            suggestedFix: 'Update phase status to valid value'
          });
        }
        
        // Check progress value range
        if (phase.progress !== undefined && phase.progress !== null && (phase.progress < 0 || phase.progress > 100)) {
          issues.push({
            severity: 'medium',
            recordId: phase.id,
            field: 'progress',
            message: 'Progress value out of range',
            expectedValue: '0-100',
            actualValue: phase.progress ?? 0,
            suggestedFix: 'Correct progress to be within 0-100'
          });
        }
      }
      
      const consistentRecords = phases.filter(p => 
        issues.filter(i => i.recordId === p.id).length === 0
      ).length;
      const totalRecords = phases.length;

      return {
        timestamp: new Date(),
        entity: 'Phase',
        totalRecords,
        consistentRecords,
        inconsistentRecords: totalRecords - consistentRecords,
        consistencyScore: totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring phase consistency:', error);
      return this.createErrorReport('Phase');
    }
  }

  /**
   * Monitor Material consistency
   */
  private async monitorMaterialConsistency(): Promise<ConsistencyReport> {
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const materials = await this.materialService.getAllMaterials();
      
      for (const material of materials) {
        // Check unit consistency
        const validUnits = ['kg', 'm', 'l', 'pcs', 'm2', 'm3', 'unit'];
        if (material.unit && !validUnits.includes(String(material.unit).toLowerCase())) {
          issues.push({
            severity: 'low',
            recordId: material.id,
            field: 'unit',
            message: 'Non-standard material unit',
            expectedValue: validUnits.join(' | '),
            actualValue: String(material.unit),
            suggestedFix: 'Use standard unit'
          });
        }

        // Check quantity is non-negative (use quantity instead of availableQuantity)
        const quantity = material.quantity ?? 0;
        if (quantity < 0) {
          issues.push({
            severity: 'high',
            recordId: material.id,
            field: 'quantity',
            message: 'Negative quantity',
            expectedValue: '>= 0',
            actualValue: quantity,
            suggestedFix: 'Correct quantity to be non-negative'
          });
        }

        // Check price is non-negative
        if (material.pricePerUnit < 0) {
          issues.push({
            severity: 'high',
            recordId: material.id,
            field: 'pricePerUnit',
            message: 'Negative price',
            expectedValue: '>= 0',
            actualValue: material.pricePerUnit,
            suggestedFix: 'Correct price to be non-negative'
          });
        }
      }

      const totalRecords = materials.length;
      const consistentRecords = materials.filter(m => 
        issues.filter(i => i.recordId === m.id).length === 0
      ).length;

      return {
        timestamp: new Date(),
        entity: 'Material',
        totalRecords,
        consistentRecords,
        inconsistentRecords: totalRecords - consistentRecords,
        consistencyScore: totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring material consistency:', error);
      return this.createErrorReport('Material');
    }
  }

  /**
   * Monitor Employee consistency
   */
  private async monitorEmployeeConsistency(): Promise<ConsistencyReport> {
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const employees = await this.employeeService.getAllEmployees();
      
      for (const employee of employees) {
        // Check email format
        if (employee.email && !this.isValidEmail(employee.email)) {
          issues.push({
            severity: 'medium',
            recordId: employee.id,
            field: 'email',
            message: 'Invalid email format',
            expectedValue: 'Valid email',
            actualValue: employee.email,
            suggestedFix: 'Correct email format'
          });
        }

        // Check phone format (basic check)
        if (employee.phone && employee.phone.length < 8) {
          issues.push({
            severity: 'low',
            recordId: employee.id,
            field: 'phone',
            message: 'Phone number too short',
            expectedValue: '>= 8 digits',
            actualValue: employee.phone,
            suggestedFix: 'Verify phone number'
          });
        }
      }

      const totalRecords = employees.length;
      const consistentRecords = employees.filter(e => 
        issues.filter(i => i.recordId === e.id).length === 0
      ).length;

      return {
        timestamp: new Date(),
        entity: 'Employee',
        totalRecords,
        consistentRecords,
        inconsistentRecords: totalRecords - consistentRecords,
        consistencyScore: totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring employee consistency:', error);
      return this.createErrorReport('Employee');
    }
  }

  /**
   * Monitor Supplier consistency
   */
  private async monitorSupplierConsistency(): Promise<ConsistencyReport> {
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const suppliers = await this.supplierService.getAllSuppliers();
      
      for (const supplier of suppliers) {
        // Check email format
        if (supplier.email && !this.isValidEmail(supplier.email)) {
          issues.push({
            severity: 'medium',
            recordId: supplier.id,
            field: 'email',
            message: 'Invalid email format',
            expectedValue: 'Valid email',
            actualValue: supplier.email,
            suggestedFix: 'Correct email format'
          });
        }

        // Check supplier has contacts
        if (!supplier.contacts || supplier.contacts.length === 0) {
          issues.push({
            severity: 'low',
            recordId: supplier.id,
            field: 'contacts',
            message: 'No contacts defined',
            expectedValue: 'At least one contact',
            actualValue: 'No contacts',
            suggestedFix: 'Add supplier contacts'
          });
        }

        // Check supplier status
        const validStatuses = ['active', 'inactive', 'pending', 'suspended'];
        if (supplier.status && !validStatuses.includes(supplier.status)) {
          issues.push({
            severity: 'low',
            recordId: supplier.id,
            field: 'status',
            message: 'Invalid supplier status',
            expectedValue: validStatuses.join(' | '),
            actualValue: supplier.status,
            suggestedFix: 'Update supplier status to valid value'
          });
        }
      }

      const totalRecords = suppliers.length;
      const consistentRecords = suppliers.filter(s => 
        issues.filter(i => i.recordId === s.id).length === 0
      ).length;

      return {
        timestamp: new Date(),
        entity: 'Supplier',
        totalRecords,
        consistentRecords,
        inconsistentRecords: totalRecords - consistentRecords,
        consistencyScore: totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring supplier consistency:', error);
      return this.createErrorReport('Supplier');
    }
  }

  /**
   * Create error report for failed monitoring
   */
  private createErrorReport(entity: string): ConsistencyReport {
    return {
      timestamp: new Date(),
      entity,
      totalRecords: 0,
      consistentRecords: 0,
      inconsistentRecords: 0,
      consistencyScore: 0,
      issues: [{
        severity: 'critical',
        recordId: 'unknown',
        field: 'monitoring',
        message: `Failed to monitor ${entity} consistency`,
        expectedValue: 'Successful monitoring',
        actualValue: 'Error occurred',
        suggestedFix: 'Check monitoring service configuration'
      }],
      recommendations: [`Fix ${entity} monitoring errors`]
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
