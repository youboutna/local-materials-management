/**
 * LocalStorage Repository Factory
 * Architecture Hexagonale : [UI] → [Hook] → [Factory] → [Adapter] → [Service] → [Transformers] → [Entities] → [Persistence]
 * DEV_MODE : Persistence dans localStorage
 * Production : Persistence via Supabase + PostgreSQL
 */

import { LocalStorageDocumentAdapter } from './adapters/LocalStorageDocumentAdapter';
import { LocalStorageSupplierAdapter } from './adapters/LocalStorageSupplierAdapter';
import { LocalStorageInspectionPaymentValidationAdapter } from './adapters/LocalStorageInspectionPaymentValidationAdapter';
import { LocalStorageEmployeeAdapter } from './adapters/LocalStorageEmployeeAdapter';
import { LocalStorageProjectAdapter } from './adapters/LocalStorageProjectAdapter';
import { LocalStorageMaterialAdapter } from './adapters/LocalStorageMaterialAdapter';
import { LocalStorageInspectionAdapter } from './adapters/LocalStorageInspectionAdapter';
import { LocalStoragePhaseAdapter } from './adapters/LocalStoragePhaseAdapter';
import { LocalStoragePaymentAdapter } from './adapters/LocalStoragePaymentAdapter';
import { LocalStorageTaskAdapter } from './adapters/LocalStorageTaskAdapter';
import { LocalStorageRiskAdapter } from './adapters/LocalStorageRiskAdapter';
import { LocalStorageTenderAdapter } from './adapters/LocalStorageTenderAdapter';
import { LocalStorageQuantityTakeoffAdapter } from './adapters/LocalStorageQuantityTakeoffAdapter';
import { LocalStorageInspectionExecutionAdapter } from './adapters/LocalStorageInspectionExecutionAdapter';
import { LocalStorageLoadDataAdapter } from './adapters/LocalStorageLoadDataAdapter';
import { LocalStorageReportingAdapter } from './adapters/LocalStorageReportingAdapter';
import { LocalStorageReportDataTransformerAdapter } from './adapters/LocalStorageReportDataTransformerAdapter';
import { LocalStorageProjectFormAdapter } from './adapters/LocalStorageProjectFormAdapter';
import { LocalStorageHierarchyAdapter } from './adapters/LocalStorageHierarchyAdapter';

/**
 * Factory pour les repositories DEV_MODE
 * Respecte l'architecture hexagonale complète
 */
export class LocalStorageRepositoryFactory {
  // ============= Instances des Adapters =============
  private static documentRepository: LocalStorageDocumentAdapter | null = null;
  private static supplierRepository: LocalStorageSupplierAdapter | null = null;
  private static inspectionPaymentValidationRepository: LocalStorageInspectionPaymentValidationAdapter | null = null;
  private static employeeRepository: LocalStorageEmployeeAdapter | null = null;
  private static projectRepository: LocalStorageProjectAdapter | null = null;
  private static materialRepository: LocalStorageMaterialAdapter | null = null;
  private static inspectionRepository: LocalStorageInspectionAdapter | null = null;
  private static phaseRepository: LocalStoragePhaseAdapter | null = null;
  private static paymentRepository: LocalStoragePaymentAdapter | null = null;
  private static taskRepository: LocalStorageTaskAdapter | null = null;
  private static riskRepository: LocalStorageRiskAdapter | null = null;
  private static tenderRepository: LocalStorageTenderAdapter | null = null;
  private static quantityTakeoffRepository: LocalStorageQuantityTakeoffAdapter | null = null;
  private static inspectionExecutionRepository: LocalStorageInspectionExecutionAdapter | null = null;
  private static loadDataAdapter: LocalStorageLoadDataAdapter | null = null;
  private static reportingRepository: LocalStorageReportingAdapter | null = null;
  private static reportDataTransformerRepository: LocalStorageReportDataTransformerAdapter | null = null;
  private static projectFormRepository: LocalStorageProjectFormAdapter | null = null;
  private static hierarchyRepository: LocalStorageHierarchyAdapter | null = null;

  // ============= Getters des Repositories =============
  
  /**
   * Get document repository instance
   */
  static getDocumentRepository(): LocalStorageDocumentAdapter {
    if (!this.documentRepository) {
      this.documentRepository = new LocalStorageDocumentAdapter();
      this.documentRepository.initializeMockData();
    }
    return this.documentRepository;
  }

  /**
   * Get supplier repository instance
   */
  static getSupplierRepository(): LocalStorageSupplierAdapter {
    if (!this.supplierRepository) {
      this.supplierRepository = new LocalStorageSupplierAdapter();
      this.supplierRepository.initializeMockData();
    }
    return this.supplierRepository;
  }

  /**
   * Get inspection payment validation repository instance
   */
  static getInspectionPaymentValidationRepository(): LocalStorageInspectionPaymentValidationAdapter {
    if (!this.inspectionPaymentValidationRepository) {
      this.inspectionPaymentValidationRepository = new LocalStorageInspectionPaymentValidationAdapter();
      this.inspectionPaymentValidationRepository.initializeMockData();
    }
    return this.inspectionPaymentValidationRepository;
  }

  /**
   * Get employee repository instance
   */
  static getEmployeeRepository(): LocalStorageEmployeeAdapter {
    if (!this.employeeRepository) {
      this.employeeRepository = new LocalStorageEmployeeAdapter();
      this.employeeRepository.initializeMockData();
    }
    return this.employeeRepository;
  }

  /**
   * Get project repository instance
   */
  static getProjectRepository(): LocalStorageProjectAdapter {
    if (!this.projectRepository) {
      this.projectRepository = new LocalStorageProjectAdapter();
      this.projectRepository.initializeMockData();
    }
    return this.projectRepository;
  }

  /**
   * Get material repository instance
   */
  static getMaterialRepository(): LocalStorageMaterialAdapter {
    if (!this.materialRepository) {
      this.materialRepository = new LocalStorageMaterialAdapter();
      this.materialRepository.initializeMockData();
    }
    return this.materialRepository;
  }

  /**
   * Get inspection repository instance
   */
  static getInspectionRepository(): LocalStorageInspectionAdapter {
    if (!this.inspectionRepository) {
      this.inspectionRepository = new LocalStorageInspectionAdapter();
      this.inspectionRepository.initializeMockData();
    }
    return this.inspectionRepository;
  }

  /**
   * Get phase repository instance
   */
  static getPhaseRepository(): LocalStoragePhaseAdapter {
    if (!this.phaseRepository) {
      this.phaseRepository = new LocalStoragePhaseAdapter();
      this.phaseRepository.initializeMockData();
    }
    return this.phaseRepository;
  }

  /**
   * Get payment repository instance
   */
  static getPaymentRepository(): LocalStoragePaymentAdapter {
    if (!this.paymentRepository) {
      this.paymentRepository = new LocalStoragePaymentAdapter();
      this.paymentRepository.initializeMockData();
    }
    return this.paymentRepository;
  }

  /**
   * Get task repository instance
   */
  static getTaskRepository(): LocalStorageTaskAdapter {
    if (!this.taskRepository) {
      this.taskRepository = new LocalStorageTaskAdapter();
      this.taskRepository.initializeMockData();
    }
    return this.taskRepository;
  }

  /**
   * Get risk repository instance
   */
  static getRiskRepository(): LocalStorageRiskAdapter {
    if (!this.riskRepository) {
      this.riskRepository = new LocalStorageRiskAdapter();
      this.riskRepository.initializeMockData();
    }
    return this.riskRepository;
  }

  /**
   * Get tender repository instance
   */
  static getTenderRepository(): LocalStorageTenderAdapter {
    if (!this.tenderRepository) {
      this.tenderRepository = new LocalStorageTenderAdapter();
      this.tenderRepository.initializeMockData();
    }
    return this.tenderRepository;
  }

  /**
   * Get quantity takeoff repository instance
   */
  static getQuantityTakeoffRepository(): LocalStorageQuantityTakeoffAdapter {
    if (!this.quantityTakeoffRepository) {
      this.quantityTakeoffRepository = new LocalStorageQuantityTakeoffAdapter();
      this.quantityTakeoffRepository.initializeMockData();
    }
    return this.quantityTakeoffRepository;
  }

  /**
   * Get inspection execution repository instance
   */
  static getInspectionExecutionRepository(): LocalStorageInspectionExecutionAdapter {
    if (!this.inspectionExecutionRepository) {
      this.inspectionExecutionRepository = new LocalStorageInspectionExecutionAdapter();
      this.inspectionExecutionRepository.initializeMockData();
    }
    return this.inspectionExecutionRepository;
  }

  /**
   * Get load data repository instance
   */
  static getLoadDataAdapter(): LocalStorageLoadDataAdapter {
    if (!this.loadDataAdapter) {
      this.loadDataAdapter = new LocalStorageLoadDataAdapter();
      this.loadDataAdapter.initializeMockData();
    }
    return this.loadDataAdapter;
  }

  architectural pattern
   */
  static getReportingRepository(): LocalStorageReportingAdapter {
    if (!this.reportingRepository) {
      this.reportingRepository = new LocalStorageReportingAdapter();
      this.reportingRepository.initializeMockData();
    }
    return this.reportingRepository;
  }

  /**
   * Get report data transformer repository instance
   */
  static getReportDataTransformerRepository(): LocalStorageReportDataTransformerAdapter {
    if (!this.reportDataTransformerRepository) {
      this.reportDataTransformerRepository = new LocalStorageReportDataTransformerAdapter();
      this.reportDataTransformerRepository.initializeMockData();
    }
    return this.reportDataTransformerRepository;
  }

  /**
   * Get project form repository instance
   */
  static getProjectFormRepository(): LocalStorageProjectFormAdapter {
    if (!this.projectFormRepository) {
      this.projectFormRepository = new LocalStorageProjectFormAdapter();
      this.projectFormRepository.initializeMockData();
    }
    return this.projectFormRepository;
  }

  /**
   * Get hierarchy repository instance
   */
  static getHierarchyRepository(): LocalStorageHierarchyAdapter {
    if (!this.hierarchyRepository) {
      this.hierarchyRepository = new LocalStorageHierarchyAdapter();
      this.hierarchyRepository.initializeMockData();
    }
    return this.hierarchyRepository;
  }

  // ============= Initialisation et Nettoyage =============
  
  /**
   * Initialize all mock data
   */
  static initializeAllMockData(): void {
    this.getDocumentRepository();
    this.getSupplierRepository();
    this.getInspectionPaymentValidationRepository();
    this.getEmployeeRepository();
    this.getProjectRepository();
    this.getMaterialRepository();
    this.getInspectionRepository();
    this.getPhaseRepository();
    this.getPaymentRepository();
    this.getTaskRepository();
    this.getRiskRepository();
    this.getTenderRepository();
    this.getQuantityTakeoffRepository();
    this.getInspectionExecutionRepository();
    this.getLoadDataAdapter();
    this.getReportingRepository();
    this.getReportDataTransformerRepository();
    this.getProjectFormRepository();
    this.getHierarchyRepository();
    
    console.log('[DEV_MODE] All LocalStorage repositories initialized with mock data');
  }

  /**
   * Clear all mock data
   */
  static clearAllMockData(): void {
    const documentRepo = this.getDocumentRepository();
    const supplierRepo = this.getSupplierRepository();
    const inspectionRepo = this.getInspectionPaymentValidationRepository();
    const employeeRepo = this.getEmployeeRepository();
    const projectRepo = this.getProjectRepository();
    const materialRepo = this.getMaterialRepository();
    const inspectionRepo2 = this.getInspectionRepository();
    const phaseRepo = this.getPhaseRepository();
    const paymentRepo = this.getPaymentRepository();
    const taskRepo = this.getTaskRepository();
    const riskRepo = this.getRiskRepository();
    const tenderRepo = this.getTenderRepository();
    const quantityTakeoffRepo = this.getQuantityTakeoffRepository();
    const inspectionExecutionRepo = this.getInspectionExecutionRepository();
    const loadDataRepo = this.getLoadDataAdapter();
    const reportingRepo = this.getReportingRepository();
    const reportDataTransformerRepo = this.getReportDataTransformerRepository();
    const projectFormRepo = this.getProjectFormRepository();
    const hierarchyRepo = this.getHierarchyRepository();

    documentRepo.clearMockData();
    supplierRepo.clearMockData();
    inspectionRepo.clearMockData();
    employeeRepo.clearMockData();
    projectRepo.clearMockData();
    materialRepo.clearMockData();
    inspectionRepo2.clearMockData();
    phaseRepo.clearMockData();
    paymentRepo.clearMockData();
    taskRepo.clearMockData();
    riskRepo.clearMockData();
    tenderRepo.clearMockData();
    quantityTakeoffRepo.clearMockData();
    inspectionExecutionRepo.clearMockData();
    loadDataRepo.clearMockData();
    reportingRepo.clearMockData();
    reportDataTransformerRepo.clearMockData();
    projectFormRepo.clearMockData();
    hierarchyRepo.clearMockData();
    
    console.log('[DEV_MODE] All LocalStorage mock data cleared');
  }

  /**
   * Get current mock data status
   */
  static getMockDataStatus() {
    const documentRepo = this.getDocumentRepository();
    const supplierRepo = this.getSupplierRepository();
    const inspectionRepo = this.getInspectionPaymentValidationRepository();
    const employeeRepo = this.getEmployeeRepository();
    const projectRepo = this.getProjectRepository();
    const materialRepo = this.getMaterialRepository();
    const inspectionRepo2 = this.getInspectionRepository();
    const phaseRepo = this.getPhaseRepository();
    const paymentRepo = this.getPaymentRepository();
    const taskRepo = this.getTaskRepository();
    const riskRepo = this.getRiskRepository();
    const tenderRepo = this.getTenderRepository();
    const quantityTakeoffRepo = this.getQuantityTakeoffRepository();
    const inspectionExecutionRepo = this.getInspectionExecutionRepository();
    const loadDataRepo = this.getLoadDataAdapter();
    const reportingRepo = this.getReportingRepository();
    const reportDataTransformerRepo = this.getReportDataTransformerRepository();
    const projectFormRepo = this.getProjectFormRepository();
    const hierarchyRepo = this.getHierarchyRepository();

    return {
      documents: documentRepo.getMockData(),
      suppliers: supplierRepo.getMockData(),
      inspections: inspectionRepo.getMockData(),
      employees: employeeRepo.getMockData(),
      projects: projectRepo.getMockData(),
      materials: materialRepo.getMockData(),
      phases: phaseRepo.getMockData(),
      payments: paymentRepo.getMockData(),
      tasks: taskRepo.getMockData(),
      risks: riskRepo.getMockData(),
      tenders: tenderRepo.getMockData(),
      quantityTakeoffs: quantityTakeoffRepo.getMockData(),
      inspectionExecutions: inspectionExecutionRepo.getMockData(),
      loadData: loadDataRepo.getMockData(),
      reports: reportingRepo.getMockData(),
      reportDataTransformers: reportDataTransformerRepo.getMockData(),
      projectForms: projectFormRepo.getMockData(),
      hierarchyNodes: hierarchyRepo.getMockData()
    };
  }
}
