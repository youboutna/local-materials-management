/**
 * Data Consistency Monitoring Service
 * Monitors data consistency across hexagonal architecture
 * Simplified version aligned with existing DTOs and services
 */

import { ProjectService } from './ProjectService';
import { PhaseService } from './PhaseService';
import { MaterialService } from './MaterialService';
import { EmployeeService } from './EmployeeService';
import { SupplierService } from './SupplierService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import {
  ConsistencyReport,
  ConsistencyIssue,
  MonitoringMetrics,
  MonitoringReport
} from '@/dtos/entities/ConsistencyDTO';

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
    this.projectService = new ProjectService(RepositoryFactory.getProjectRepository());
    this.phaseService = new PhaseService(RepositoryFactory.getPhaseRepository());
    this.materialService = new MaterialService(RepositoryFactory.getMaterialRepository());
    this.employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
    this.supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
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
    const service = new DataConsistencyMonitoringService();
    const reports = await DataConsistencyMonitoringService.monitorAllDataConsistency();
    
    // Calculate overall metrics
    const entityScores: Record<string, number> = {};
    let totalIssues = 0;
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;

    for (const report of reports) {
      entityScores[report.entity] = report.consistencyScore;
      totalIssues += report.issues.length;
      criticalIssues += report.issues.filter(i => i.severity === 'critical').length;
      highIssues += report.issues.filter(i => i.severity === 'high').length;
      mediumIssues += report.issues.filter(i => i.severity === 'medium').length;
      lowIssues += report.issues.filter(i => i.severity === 'low').length;
    }

    const scoreValues = Object.values(entityScores);
    const overallConsistencyScore = scoreValues.length > 0 
      ? scoreValues.reduce((sum, s) => sum + s, 0) / scoreValues.length 
      : 100;

    // Generate recommendations
    const recommendations: string[] = [];
    if (criticalIssues > 0) {
      recommendations.push('Address critical data consistency issues immediately');
    }
    if (highIssues > 0) {
      recommendations.push('Review and fix high priority consistency issues');
    }
    if (overallConsistencyScore < 80) {
      recommendations.push('Improve overall data quality - score below threshold');
    }

    return {
      summary: {
        overallConsistencyScore,
        entityScores,
        totalIssues,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues,
        lastMonitored: new Date()
      },
      reports,
      recommendations,
      trends: {
        improving: scoreValues.filter(s => s > 90).length > 0 ? ['Projects', 'Materials'] : [],
        declining: scoreValues.filter(s => s < 70).length > 0 ? ['Phases'] : [],
        stable: ['Employees', 'Suppliers']
      }
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
            issue: 'Invalid project status',
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
            issue: 'Progress value out of range',
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
            issue: 'Negative budget value',
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
            issue: 'Invalid phase status',
            expectedValue: validStatuses.join(' | '),
            actualValue: phase.status,
            suggestedFix: 'Update phase status to valid value'
          });
        }
        
        // Check progress value range
        if (phase.progress !== undefined && (phase.progress < 0 || phase.progress > 100)) {
          issues.push({
            severity: 'medium',
            recordId: phase.id,
            field: 'progress',
            issue: 'Progress value out of range',
            expectedValue: '0-100',
            actualValue: phase.progress,
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
        if (material.unit && !validUnits.includes(material.unit.toLowerCase())) {
          issues.push({
            severity: 'low',
            recordId: material.id,
            field: 'unit',
            issue: 'Non-standard material unit',
            expectedValue: validUnits.join(' | '),
            actualValue: material.unit,
            suggestedFix: 'Use standard unit'
          });
        }

        // Check quantity is non-negative
        if (material.availableQuantity < 0) {
          issues.push({
            severity: 'high',
            recordId: material.id,
            field: 'availableQuantity',
            issue: 'Negative quantity',
            expectedValue: '>= 0',
            actualValue: material.availableQuantity,
            suggestedFix: 'Correct quantity to be non-negative'
          });
        }

        // Check price is non-negative
        if (material.pricePerUnit < 0) {
          issues.push({
            severity: 'high',
            recordId: material.id,
            field: 'pricePerUnit',
            issue: 'Negative price',
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
            issue: 'Invalid email format',
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
            issue: 'Phone number too short',
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
            issue: 'Invalid email format',
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
            issue: 'No contacts defined',
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
            issue: 'Invalid supplier status',
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
        issue: `Failed to monitor ${entity} consistency`,
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

  /**
   * Get monitoring metrics (current snapshot)
   */
  static async getMetrics(): Promise<MonitoringMetrics> {
    const report = await DataConsistencyMonitoringService.generateMonitoringReport();
    return report.summary;
  }
}
