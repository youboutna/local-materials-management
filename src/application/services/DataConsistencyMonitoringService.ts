/**
 * Data Consistency Monitoring Service
 * Monitors data consistency across hexagonal architecture
 */

import { ProjectService } from './ProjectService';
import { PhaseService } from './PhaseService';
import { MaterialService } from './MaterialService';
import { RiskService } from './RiskService';
import { EmployeeService } from './EmployeeService';
import { SupplierService } from './SupplierService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

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

export interface ConsistencyIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  recordId: string;
  field: string;
  issue: string;
  expectedValue: any;
  actualValue: any;
  suggestedFix: string;
}

export interface MonitoringMetrics {
  overallConsistencyScore: number;
  entityScores: Record<string, number>;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  lastMonitored: Date;
}

export class DataConsistencyMonitoringService {
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

      // Monitor Risks consistency
      const riskReport = await service.monitorRiskConsistency();
      reports.push(riskReport);

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
   * Monitor Project consistency
   */
  private async monitorProjectConsistency(): Promise<ConsistencyReport> {
    const startTime = Date.now();
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const projects = await this.projectService.getAllProjects();
      
      for (const project of projects) {
        // Check project-phases consistency
        if (project.phases && project.phases.length > 0) {
          const phaseIds = project.phases.map(p => p.id);
          const existingPhases = await this.phaseService.getPhasesByIds(phaseIds);
          
          if (existingPhases.length !== phaseIds.length) {
            issues.push({
              severity: 'high',
              recordId: project.id,
              field: 'phases',
              issue: 'Project references non-existent phases',
              expectedValue: phaseIds.length,
              actualValue: existingPhases.length,
              suggestedFix: 'Remove invalid phase references or create missing phases'
            });
          }
        }

        // Check project-materials consistency
        if (project.materials && project.materials.length > 0) {
          const materialIds = project.materials.map(m => m.id);
          const existingMaterials = await this.materialService.getMaterialsByIds(materialIds);
          
          if (existingMaterials.length !== materialIds.length) {
            issues.push({
              severity: 'medium',
              recordId: project.id,
              field: 'materials',
              issue: 'Project references non-existent materials',
              expectedValue: materialIds.length,
              actualValue: existingMaterials.length,
              suggestedFix: 'Remove invalid material references or create missing materials'
            });
          }
        }

        // Check project-risks consistency
        if (project.risks && project.risks.length > 0) {
          const riskIds = project.risks.map(r => r.id);
          const existingRisks = await this.riskService.getRisksByIds(riskIds);
          
          if (existingRisks.length !== riskIds.length) {
            issues.push({
              severity: 'medium',
              recordId: project.id,
              field: 'risks',
              issue: 'Project references non-existent risks',
              expectedValue: riskIds.length,
              actualValue: existingRisks.length,
              suggestedFix: 'Remove invalid risk references or create missing risks'
            });
          }
        }

        // Check project status consistency
        if (project.status && !['planning', 'in_progress', 'completed', 'cancelled'].includes(project.status)) {
          issues.push({
            severity: 'low',
            recordId: project.id,
            field: 'status',
            issue: 'Invalid project status',
            expectedValue: 'planning | in_progress | completed | cancelled',
            actualValue: project.status,
            suggestedFix: 'Update project status to valid value'
          });
        }

        // Check budget consistency
        if (project.budget && typeof project.budget === 'object') {
          if (!project.budget.amount || !project.budget.currency) {
            issues.push({
              severity: 'medium',
              recordId: project.id,
              field: 'budget',
              issue: 'Budget object missing required fields',
              expectedValue: '{ amount: number, currency: string }',
              actualValue: project.budget,
              suggestedFix: 'Ensure budget has amount and currency fields'
            });
          }
        }
      }

      const totalRecords = projects.length;
      const consistentRecords = projects.filter(p => 
        issues.filter(i => i.recordId === p.id).length === 0
      ).length;
      const inconsistentRecords = totalRecords - consistentRecords;
      const consistencyScore = totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100;

      // Generate recommendations
      if (issues.filter(i => i.severity === 'critical').length > 0) {
        recommendations.push('Address critical data consistency issues immediately');
      }
      if (issues.filter(i => i.severity === 'high').length > 0) {
        recommendations.push('Review and fix high priority consistency issues');
      }
      if (issues.filter(i => i.severity === 'medium').length > 5) {
        recommendations.push('Address medium priority consistency issues');
      }

      return {
        timestamp: new Date(),
        entity: 'Project',
        totalRecords,
        consistentRecords,
        inconsistentRecords,
        consistencyScore,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring project consistency:', error);
      return {
        timestamp: new Date(),
        entity: 'Project',
        totalRecords: 0,
        consistentRecords: 0,
        inconsistentRecords: 0,
        consistencyScore: 0,
        issues: [{
          severity: 'critical',
          recordId: 'unknown',
          field: 'monitoring',
          issue: 'Failed to monitor project consistency',
          expectedValue: 'Successful monitoring',
          actualValue: 'Error occurred',
          suggestedFix: 'Check monitoring service configuration'
        }],
        recommendations: ['Fix project monitoring errors']
      };
    }
  }

  /**
   * Monitor Phase consistency
   */
  private async monitorPhaseConsistency(): Promise<ConsistencyReport> {
    const startTime = Date.now();
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const phases = await this.phaseService.getAllPhases();
      
      for (const phase of phases) {
        // Check phase-tasks consistency
        if (phase.tasks && phase.tasks.length > 0) {
          const taskIds = phase.tasks.map(t => t.id);
          const existingTasks = await this.phaseService.getTasksByIds(taskIds);
          
          if (existingTasks.length !== taskIds.length) {
            issues.push({
              severity: 'medium',
              recordId: phase.id,
              field: 'tasks',
              issue: 'Phase references non-existent tasks',
              expectedValue: taskIds.length,
              actualValue: existingTasks.length,
              suggestedFix: 'Remove invalid task references or create missing tasks'
            });
          }
        }

        // Check phase order consistency
        if (phase.order && typeof phase.order !== 'number') {
          issues.push({
            severity: 'low',
            recordId: phase.id,
            field: 'order',
            issue: 'Phase order should be a number',
            expectedValue: 'number',
            actualValue: typeof phase.order,
            suggestedFix: 'Update phase order to numeric value'
          });
        }

        // Check phase status consistency
        if (phase.status && !['pending', 'in_progress', 'completed', 'cancelled'].includes(phase.status)) {
          issues.push({
            severity: 'low',
            recordId: phase.id,
            field: 'status',
            issue: 'Invalid phase status',
            expectedValue: 'pending | in_progress | completed | cancelled',
            actualValue: phase.status,
            suggestedFix: 'Update phase status to valid value'
          });
        }

        // Check project relationship
        if (phase.projectId) {
          const project = await this.projectService.getProject(phase.projectId);
          if (!project) {
            issues.push({
              severity: 'high',
              recordId: phase.id,
              field: 'projectId',
              issue: 'Phase references non-existent project',
              expectedValue: 'Valid project ID',
              actualValue: phase.projectId,
              suggestedFix: 'Update phase.projectId to valid project or remove orphaned phase'
            });
          }
        }
      }

      const totalRecords = phases.length;
      const consistentRecords = phases.filter(p => 
        issues.filter(i => i.recordId === p.id).length === 0
      ).length;
      const inconsistentRecords = totalRecords - consistentRecords;
      const consistencyScore = totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100;

      // Generate recommendations
      if (issues.filter(i => i.severity === 'high').length > 0) {
        recommendations.push('Review and fix phase relationship issues');
      }
      if (issues.filter(i => i.severity === 'medium').length > 3) {
        recommendations.push('Address phase task consistency issues');
      }

      return {
        timestamp: new Date(),
        entity: 'Phase',
        totalRecords,
        consistentRecords,
        inconsistentRecords,
        consistencyScore,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring phase consistency:', error);
      return {
        timestamp: new Date(),
        entity: 'Phase',
        totalRecords: 0,
        consistentRecords: 0,
        inconsistentRecords: 0,
        consistencyScore: 0,
        issues: [{
          severity: 'critical',
          recordId: 'unknown',
          field: 'monitoring',
          issue: 'Failed to monitor phase consistency',
          expectedValue: 'Successful monitoring',
          actualValue: 'Error occurred',
          suggestedFix: 'Check phase monitoring service configuration'
        }],
        recommendations: ['Fix phase monitoring errors']
      };
    }
  }

  /**
   * Monitor Material consistency
   */
  private async monitorMaterialConsistency(): Promise<ConsistencyReport> {
    const startTime = Date.now();
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const materials = await this.materialService.getAllMaterials();
      
      for (const material of materials) {
        // Check material-specifications consistency
        if (material.specifications && typeof material.specifications !== 'object') {
          issues.push({
            severity: 'medium',
            recordId: material.id,
            field: 'specifications',
            issue: 'Material specifications should be an object',
            expectedValue: 'object',
            actualValue: typeof material.specifications,
            suggestedFix: 'Update specifications to object format'
          });
        }

        // Check material-suppliers consistency
        if (material.suppliers && material.suppliers.length > 0) {
          const supplierIds = material.suppliers.map(s => s.id);
          const existingSuppliers = await this.supplierService.getSuppliersByIds(supplierIds);
          
          if (existingSuppliers.length !== supplierIds.length) {
            issues.push({
              severity: 'medium',
              recordId: material.id,
              field: 'suppliers',
              issue: 'Material references non-existent suppliers',
              expectedValue: supplierIds.length,
              actualValue: existingSuppliers.length,
              suggestedFix: 'Remove invalid supplier references or create missing suppliers'
            });
          }
        }

        // Check material type consistency
        if (material.type && !['raw', 'equipment', 'consumable', 'service'].includes(material.type)) {
          issues.push({
            severity: 'low',
            recordId: material.id,
            field: 'type',
            issue: 'Invalid material type',
            expectedValue: 'raw | equipment | consumable | service',
            actualValue: material.type,
            suggestedFix: 'Update material type to valid value'
          });
        }

        // Check unit consistency
        if (material.unit && !['kg', 'm', 'l', 'pcs'].includes(material.unit)) {
          issues.push({
            severity: 'low',
            recordId: material.id,
            field: 'unit',
            issue: 'Invalid material unit',
            expectedValue: 'kg | m | l | pcs',
            actualValue: material.unit,
            suggestedFix: 'Update material unit to standard unit'
          });
        }
      }

      const totalRecords = materials.length;
      const consistentRecords = materials.filter(m => 
        issues.filter(i => i.recordId === m.id).length === 0
      ).length;
      const inconsistentRecords = totalRecords - consistentRecords;
      const consistencyScore = totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100;

      // Generate recommendations
      if (issues.filter(i => i.severity === 'high').length > 0) {
        recommendations.push('Review material supplier relationships');
      }
      if (issues.filter(i => i.severity === 'medium').length > 5) {
        recommendations.push('Complete material specifications');
      }

      return {
        timestamp: new Date(),
        entity: 'Material',
        totalRecords,
        consistentRecords,
        inconsistentRecords,
        consistencyScore,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring material consistency:', error);
      return {
        timestamp: new Date(),
        entity: 'Material',
        totalRecords: 0,
        consistentRecords: 0,
        inconsistentRecords: 0,
        consistencyScore: 0,
        issues: [{
          severity: 'critical',
          recordId: 'unknown',
          field: 'monitoring',
          issue: 'Failed to monitor material consistency',
          expectedValue: 'Successful monitoring',
          actualValue: 'Error occurred',
          suggestedFix: 'Check material monitoring service configuration'
        }],
        recommendations: ['Fix material monitoring errors']
      };
    }
  }

  /**
   * Monitor Risk consistency
   */
  private async monitorRiskConsistency(): Promise<ConsistencyReport> {
    const startTime = Date.now();
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const risks = await this.riskService.getAllRisks();
      
      for (const risk of risks) {
        // Check risk-assessment consistency
        if (risk.assessment && typeof risk.assessment !== 'object') {
          issues.push({
            severity: 'high',
            recordId: risk.id,
            field: 'assessment',
            issue: 'Risk assessment should be an object',
            expectedValue: 'object',
            actualValue: typeof risk.assessment,
            suggestedFix: 'Update risk assessment to object format'
          });
        }

        // Check risk-mitigation consistency
        if (!risk.mitigation || typeof risk.mitigation !== 'string') {
          issues.push({
            severity: 'medium',
            recordId: risk.id,
            field: 'mitigation',
            issue: 'Risk should have mitigation strategy',
            expectedValue: 'string',
            actualValue: typeof risk.mitigation,
            suggestedFix: 'Add risk mitigation strategy'
          });
        }

        // Check risk level consistency
        if (risk.level && !['low', 'medium', 'high', 'critical'].includes(risk.level)) {
          issues.push({
            severity: 'medium',
            recordId: risk.id,
            field: 'level',
            issue: 'Invalid risk level',
            expectedValue: 'low | medium | high | critical',
            actualValue: risk.level,
            suggestedFix: 'Update risk level to valid value'
          });
        }

        // Check risk project relationship
        if (risk.projectId) {
          const project = await this.projectService.getProject(risk.projectId);
          if (!project) {
            issues.push({
              severity: 'high',
              recordId: risk.id,
              field: 'projectId',
              issue: 'Risk references non-existent project',
              expectedValue: 'Valid project ID',
              actualValue: risk.projectId,
              suggestedFix: 'Update risk.projectId to valid project or remove orphaned risk'
            });
          }
        }
      }

      const totalRecords = risks.length;
      const consistentRecords = risks.filter(r => 
        issues.filter(i => i.recordId === r.id).length === 0
      ).length;
      const inconsistentRecords = totalRecords - consistentRecords;
      const consistencyScore = totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100;

      // Generate recommendations
      if (issues.filter(i => i.severity === 'critical').length > 0) {
        recommendations.push('Address critical risk assessment issues immediately');
      }
      if (issues.filter(i => i.severity === 'high').length > 0) {
        recommendations.push('Review and fix risk mitigation strategies');
      }

      return {
        timestamp: new Date(),
        entity: 'Risk',
        totalRecords,
        consistentRecords,
        inconsistentRecords,
        consistencyScore,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring risk consistency:', error);
      return {
        timestamp: new Date(),
        entity: 'Risk',
        totalRecords: 0,
        consistentRecords: 0,
        inconsistentRecords: 0,
        consistencyScore: 0,
        issues: [{
          severity: 'critical',
          recordId: 'unknown',
          field: 'monitoring',
          issue: 'Failed to monitor risk consistency',
          expectedValue: 'Successful monitoring',
          actualValue: 'Error occurred',
          suggestedFix: 'Check risk monitoring service configuration'
        }],
        recommendations: ['Fix risk monitoring errors']
      };
    }
  }

  /**
   * Monitor Employee consistency
   */
  private async monitorEmployeeConsistency(): Promise<ConsistencyReport> {
    const startTime = Date.now();
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const employees = await this.employeeService.getAllEmployees();
      
      for (const employee of employees) {
        // Check employee-hierarchy consistency
        if (employee.hierarchy && typeof employee.hierarchy !== 'object') {
          issues.push({
            severity: 'medium',
            recordId: employee.id,
            field: 'hierarchy',
            issue: 'Employee hierarchy should be an object',
            expectedValue: 'object',
            actualValue: typeof employee.hierarchy,
            suggestedFix: 'Update hierarchy to object format'
          });
        }

        // Check employee-permissions consistency
        if (!employee.permissions || !Array.isArray(employee.permissions)) {
          issues.push({
            severity: 'medium',
            recordId: employee.id,
            field: 'permissions',
            issue: 'Employee should have permissions array',
            expectedValue: 'string[]',
            actualValue: typeof employee.permissions,
            suggestedFix: 'Add permissions array to employee'
          });
        }

        // Check employee-role consistency
        if (employee.role && !['admin', 'manager', 'employee', 'contractor'].includes(employee.role)) {
          issues.push({
            severity: 'low',
            recordId: employee.id,
            field: 'role',
            issue: 'Invalid employee role',
            expectedValue: 'admin | manager | employee | contractor',
            actualValue: employee.role,
            suggestedFix: 'Update employee role to valid value'
          });
        }

        // Check employee-department consistency
        if (employee.department && !['IT', 'Finance', 'Operations', 'HR'].includes(employee.department)) {
          issues.push({
            severity: 'low',
            recordId: employee.id,
            field: 'department',
            issue: 'Invalid employee department',
            expectedValue: 'IT | Finance | Operations | HR',
            actualValue: employee.department,
            suggestedFix: 'Update employee department to valid value'
          });
        }
      }

      const totalRecords = employees.length;
      const consistentRecords = employees.filter(e => 
        issues.filter(i => i.recordId === e.id).length === 0
      ).length;
      const inconsistentRecords = totalRecords - consistentRecords;
      const consistencyScore = totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100;

      // Generate recommendations
      if (issues.filter(i => i.severity === 'high').length > 0) {
        recommendations.push('Review employee hierarchy structure');
      }
      if (issues.filter(i => i.severity === 'medium').length > 3) {
        recommendations.push('Complete employee permissions setup');
      }

      return {
        timestamp: new Date(),
        entity: 'Employee',
        totalRecords,
        consistentRecords,
        inconsistentRecords,
        consistencyScore,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring employee consistency:', error);
      return {
        timestamp: new Date(),
        entity: 'Employee',
        totalRecords: 0,
        consistentRecords: 0,
        inconsistentRecords: 0,
        consistencyScore: 0,
        issues: [{
          severity: 'critical',
          recordId: 'unknown',
          field: 'monitoring',
          issue: 'Failed to monitor employee consistency',
          expectedValue: 'Successful monitoring',
          actualValue: 'Error occurred',
          suggestedFix: 'Check employee monitoring service configuration'
        }],
        recommendations: ['Fix employee monitoring errors']
      };
    }
  }

  /**
   * Monitor Supplier consistency
   */
  private async monitorSupplierConsistency(): Promise<ConsistencyReport> {
    const startTime = Date.now();
    const issues: ConsistencyIssue[] = [];
    const recommendations: string[] = [];

    try {
      const suppliers = await this.supplierService.getAllSuppliers();
      
      for (const supplier of suppliers) {
        // Check supplier-certifications consistency
        if (supplier.certifications && !Array.isArray(supplier.certifications)) {
          issues.push({
            severity: 'medium',
            recordId: supplier.id,
            field: 'certifications',
            issue: 'Supplier should have certifications array',
            expectedValue: 'Certification[]',
            actualValue: typeof supplier.certifications,
            suggestedFix: 'Add certifications array to supplier'
          });
        }

        // Check supplier-rating consistency
        if (supplier.rating && typeof supplier.rating !== 'object') {
          issues.push({
            severity: 'low',
            recordId: supplier.id,
            field: 'rating',
            issue: 'Supplier rating should be an object',
            expectedValue: 'object',
            actualValue: typeof supplier.rating,
            suggestedFix: 'Update rating to object format'
          });
        }

        // Check supplier-contact consistency
        if (supplier.contact && typeof supplier.contact !== 'object') {
          issues.push({
            severity: 'low',
            recordId: supplier.id,
            field: 'contact',
            issue: 'Supplier contact should be an object',
            expectedValue: 'object',
            actualValue: typeof supplier.contact,
            suggestedFix: 'Update contact to object format'
          });
        }

        // Check supplier-status consistency
        if (supplier.status && !['active', 'inactive', 'pending', 'blacklisted'].includes(supplier.status)) {
          issues.push({
            severity: 'low',
            recordId: supplier.id,
            field: 'status',
            issue: 'Invalid supplier status',
            expectedValue: 'active | inactive | pending | blacklisted',
            actualValue: supplier.status,
            suggestedFix: 'Update supplier status to valid value'
          });
        }
      }

      const totalRecords = suppliers.length;
      const consistentRecords = suppliers.filter(s => 
        issues.filter(i => i.recordId === s.id).length === 0
      ).length;
      const inconsistentRecords = totalRecords - consistentRecords;
      const consistencyScore = totalRecords > 0 ? (consistentRecords / totalRecords) * 100 : 100;

      // Generate recommendations
      if (issues.filter(i => i.severity === 'high').length > 0) {
        recommendations.push('Review supplier certification requirements');
      }
      if (issues.filter(i => i.severity === 'medium').length > 3) {
        recommendations.push('Complete supplier profile information');
      }

      return {
        timestamp: new Date(),
        entity: 'Supplier',
        totalRecords,
        consistentRecords,
        inconsistentRecords,
        consistencyScore,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error monitoring supplier consistency:', error);
      return {
        timestamp: new Date(),
        entity: 'Supplier',
        totalRecords: 0,
        consistentRecords: 0,
        inconsistentRecords: 0,
        consistencyScore: 0,
        issues: [{
          severity: 'critical',
          recordId: 'unknown',
          field: 'monitoring',
          issue: 'Failed to monitor supplier consistency',
          expectedValue: 'Successful monitoring',
          actualValue: 'Error occurred',
          suggestedFix: 'Check supplier monitoring service configuration'
        }],
        recommendations: ['Fix supplier monitoring errors']
      };
    }
  }

  /**
   * Generate monitoring report
   */
  static async generateMonitoringReport(): Promise<{
    summary: MonitoringMetrics;
    details: ConsistencyReport[];
    trends: {
      improving: string[];
      declining: string[];
      stable: string[];
    };
    alerts: {
      critical: string[];
      high: string[];
      medium: string[];
      low: string[];
    };
    recommendations: string[];
  }> {
    const reports = await DataConsistencyMonitoringService.monitorAllDataConsistency();
    
    const entityScores: Record<string, number> = {};
    let totalIssues = 0;
    let criticalIssues = 0;
    let highIssues = 0;
    let mediumIssues = 0;
    let lowIssues = 0;

    reports.forEach(report => {
      entityScores[report.entity] = report.consistencyScore;
      totalIssues += report.issues.length;
      criticalIssues += report.issues.filter(i => i.severity === 'critical').length;
      highIssues += report.issues.filter(i => i.severity === 'high').length;
      mediumIssues += report.issues.filter(i => i.severity === 'medium').length;
      lowIssues += report.issues.filter(i => i.severity === 'low').length;
    });

    const overallConsistencyScore = Object.values(entityScores).reduce((sum, score) => sum + score, 0) / Object.keys(entityScores).length;

    // Generate trends
    const improving = Object.entries(entityScores)
      .filter(([entity, score]) => score > 90)
      .map(([entity, score]) => `${entity} consistency improving`);

    const declining = Object.entries(entityScores)
      .filter(([entity, score]) => score < 70)
      .map(([entity, score]) => `${entity} consistency declining`);

    const stable = Object.entries(entityScores)
      .filter(([entity, score]) => score >= 70 && score <= 90)
      .map(([entity, score]) => `${entity} consistency stable`);

    // Generate alerts
    const critical = reports
      .flatMap(r => r.issues.filter(i => i.severity === 'critical'))
      .map(i => i.issue);

    const high = reports
      .flatMap(r => r.issues.filter(i => i.severity === 'high'))
      .map(i => i.issue);

    const medium = reports
      .flatMap(r => r.issues.filter(i => i.severity === 'medium'))
      .map(i => i.issue);

    const low = reports
      .flatMap(r => r.issues.filter(i => i.severity === 'low'))
      .map(i => i.issue);

    // Generate recommendations
    const recommendations = reports
      .flatMap(r => r.recommendations)
      .filter((rec, index, arr) => arr.indexOf(rec) === index); // Remove duplicates

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
      details: reports,
      trends: {
        improving,
        declining,
        stable
      },
      alerts: {
        critical,
        high,
        medium,
        low
      },
      recommendations
    };
  }

  /**
   * Schedule periodic monitoring
   */
  static async schedulePeriodicMonitoring(intervalMinutes: number = 60): Promise<void> {
    try {
      console.log(`🔍 Starting periodic data consistency monitoring every ${intervalMinutes} minutes...`);
      
      const monitoringInterval = setInterval(async () => {
        try {
          const report = await DataConsistencyMonitoringService.generateMonitoringReport();
          
          // Log summary
          console.log(`📊 Monitoring Report - ${report.summary.overallConsistencyScore.toFixed(2)}% consistency score`);
          console.log(`📊 Total Issues: ${report.summary.totalIssues} (Critical: ${report.summary.alerts.critical.length}, High: ${report.summary.alerts.high.length})`);
          
          // Send alerts for critical issues
          if (report.summary.alerts.critical.length > 0) {
            console.error('🚨 CRITICAL DATA CONSISTENCY ISSUES DETECTED:');
            report.summary.alerts.critical.forEach(alert => {
              console.error(`  - ${alert}`);
            });
          }
          
          // Send alerts for high priority issues
          if (report.summary.alerts.high.length > 0) {
            console.warn('⚠️ HIGH PRIORITY DATA CONSISTENCY ISSUES:');
            report.summary.alerts.high.forEach(alert => {
              console.warn(`  - ${alert}`);
            });
          }
        } catch (error) {
          console.error('Error in periodic monitoring:', error);
        }
      }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

      console.log(`✅ Periodic monitoring scheduled successfully`);
    } catch (error) {
      console.error('Failed to schedule periodic monitoring:', error);
      throw new Error('Failed to schedule periodic monitoring');
    }
  }
}
