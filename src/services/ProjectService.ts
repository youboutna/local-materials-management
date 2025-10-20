// Unified service that orchestrates repository, mapping, and calculations
import { ProjectRepository } from './ProjectRepository';
import { EntityToDTOMapper } from './EntityToDTOMapper';
import { ProjectCalculationService } from './ProjectCalculationService';
import { ProjectDTO, ProjectDetailDTO, ProjectSummaryDTO, ProjectListItemDTO, ProjectFormDTO } from '@/types/dto';
import { ProjectEntity } from '@/types/entities';
import { EVMCalculations, ProgressAnalytics, BudgetAnalytics, TimelineAnalytics, QualityMetrics, RiskAnalytics, ProjectHealthScore } from '@/types/calculations';

export class ProjectService {
  private repository: ProjectRepository;

  constructor() {
    this.repository = new ProjectRepository();
  }

  // ============= CRUD Operations =============

  async getProjectById(id: string): Promise<ProjectDTO | null> {
    const entity = await this.repository.findById(id);
    if (!entity) return null;
    return EntityToDTOMapper.projectEntityToDTO(entity);
  }

  async getProjectSummary(id: string): Promise<ProjectSummaryDTO | null> {
    const relatedData = await this.repository.findProjectWithRelatedData(id);
    if (!relatedData.project) return null;

    const counts = {
      tasksCount: relatedData.tasks.length,
      risksCount: relatedData.risks.length,
      inspectionsCount: relatedData.inspections.length,
      paymentsCount: relatedData.payments.length,
      phasesCount: relatedData.phases.length
    };

    // Find last activity date
    const lastActivity = this.findLatestActivity(relatedData);

    return EntityToDTOMapper.projectEntityToSummaryDTO(
      relatedData.project,
      counts,
      lastActivity
    );
  }

  async getProjectDetail(id: string): Promise<ProjectDetailDTO | null> {
    const relatedData = await this.repository.findProjectWithRelatedData(id);
    if (!relatedData.project) return null;

    const mappedRelatedData = {
      risks: relatedData.risks.map(risk => EntityToDTOMapper.riskEntityToDTO(risk)),
      tasks: relatedData.tasks.map(task => EntityToDTOMapper.taskEntityToDTO(task)),
      inspections: relatedData.inspections.map(inspection => EntityToDTOMapper.inspectionEntityToDTO(inspection)),
      payments: relatedData.payments.map(payment => EntityToDTOMapper.paymentEntityToDTO(payment)),
      phases: relatedData.phases
    };

    return EntityToDTOMapper.projectEntityToDetailDTO(relatedData.project, mappedRelatedData);
  }

  async getAllProjects(): Promise<ProjectListItemDTO[]> {
    const entities = await this.repository.findAll();
    
    // Calculate realistic progress for each project
    const projectsWithProgress = await Promise.all(
      entities.map(async (entity) => {
        const relatedData = await this.repository.findProjectWithRelatedData(entity.id);
        
        // Calculate realistic progress
        const { ProgressCalculationService } = await import('./ProgressCalculationService');
        const calculatedProgress = ProgressCalculationService.calculateProjectProgress(
          relatedData.phases || [],
          relatedData.tasks || [],
          relatedData.inspections || []
        );
        
        // Create DTO with calculated progress
        const dto = EntityToDTOMapper.projectEntityToListItemDTO(entity);
        return {
          ...dto,
          progress: Math.round(calculatedProgress)
        };
      })
    );
    
    return projectsWithProgress;
  }

  async createProject(formData: ProjectFormDTO): Promise<ProjectDTO> {
    const entityData = EntityToDTOMapper.projectDTOToEntity({
      id: '', // Will be generated
      status: 'en cours',
      progress: 0,
      thumbnail: '/img/project-placeholder.jpg',
      ...formData
    });

    const createdEntity = await this.repository.create(entityData);
    return EntityToDTOMapper.projectEntityToDTO(createdEntity);
  }

  async updateProject(id: string, formData: Partial<ProjectFormDTO>): Promise<ProjectDTO> {
    // Map only provided fields to entity shape to avoid overwriting status or other fields
    const partialEntity: any = {
      ...(formData.title !== undefined && { title: formData.title }),
      ...(formData.description !== undefined && { description: formData.description }),
      ...(formData.location !== undefined && { location: formData.location }),
      ...(formData.budget !== undefined && { budget: formData.budget }),
      ...(formData.startDate !== undefined && { start_date: formData.startDate }),
      ...(formData.endDate !== undefined && { end_date: formData.endDate }),
      ...(formData.teamSize !== undefined && { team_size: formData.teamSize }),
      ...(formData.coordinates?.latitude !== undefined && { coordinates_latitude: formData.coordinates.latitude }),
      ...(formData.coordinates?.longitude !== undefined && { coordinates_longitude: formData.coordinates.longitude }),
      // Add localization fields mapping
      ...((formData as any).localisation !== undefined && { localisation: (formData as any).localisation }),
      ...((formData as any).forme !== undefined && { forme: (formData as any).forme }),
      ...((formData as any).adresse !== undefined && { adresse: (formData as any).adresse }),
      ...(formData.financingSource !== undefined && { financing_source: formData.financingSource }),
      ...(formData.marketType !== undefined && { market_type: formData.marketType }),
      ...(formData.selectionMode !== undefined && { selection_mode: formData.selectionMode }),
      ...(formData.launchDate !== undefined && { launch_date: formData.launchDate }),
      ...(formData.attributionDate !== undefined && { attribution_date: formData.attributionDate }),
      ...(formData.projectResponsableId !== undefined && { project_responsable_id: formData.projectResponsableId }),
      ...(formData.mainContractor !== undefined && { main_contractor: formData.mainContractor }),
      ...(formData.projectReference !== undefined && { project_reference: formData.projectReference }),
      ...(formData.allowsInitialPayment !== undefined && { allows_initial_payment: formData.allowsInitialPayment }),
      ...(formData.initialPaymentPercentage !== undefined && { initial_payment_percentage: formData.initialPaymentPercentage }),
    };

    const updatedEntity = await this.repository.update(id, partialEntity);
    return EntityToDTOMapper.projectEntityToDTO(updatedEntity);
  }

  async deleteProject(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // ============= Analytics and Calculations =============

  async getProjectAnalytics(id: string) {
    const project = await this.getProjectDetail(id);
    if (!project) return null;

    const progressAnalytics = ProjectCalculationService.calculateProgressAnalytics(project);
    const budgetAnalytics = ProjectCalculationService.calculateBudgetAnalytics(project);
    const timelineAnalytics = ProjectCalculationService.calculateTimelineAnalytics(project);
    const qualityMetrics = ProjectCalculationService.calculateQualityMetrics(project);
    const riskAnalytics = ProjectCalculationService.calculateRiskAnalytics(project);
    const healthScore = ProjectCalculationService.calculateProjectHealthScore(project);
    const evmMetrics = ProjectCalculationService.calculateEVMMetrics(project);

    return {
      project,
      analytics: {
        progress: progressAnalytics,
        budget: budgetAnalytics,
        timeline: timelineAnalytics,
        quality: qualityMetrics,
        risk: riskAnalytics,
        health: healthScore,
        evm: evmMetrics
      }
    };
  }

  async getProjectCalculations(id: string) {
    const project = await this.getProjectDetail(id);
    if (!project) return null;

    const pertAnalysis = ProjectCalculationService.calculatePERTAnalysis(project);
    const ganttChart = ProjectCalculationService.generateGanttChart(project);
    const evmData = ProjectCalculationService.calculateEVMMetrics(project);

    return {
      pertAnalysis,
      ganttChart,
      evmData
    };
  }

  // ============= Task Management =============

  async createTask(projectId: string, taskData: any) {
    const taskEntity = {
      project_id: projectId,
      title: taskData.title,
      description: taskData.description,
      // Do not set assigned_to here to avoid FK violations; assignment handled elsewhere
      status: 'pending',
      priority: taskData.priority || 'medium',
      due_date: taskData.dueDate,
      notes: taskData.notes
    };

    const result = await this.repository.createTask(taskEntity);
    
    // Synchronize project progress
    await this.synchronizeProjectProgress(projectId);
    
    return result;
  }

  async updateTask(taskId: string, taskData: any) {
    const result = await this.repository.updateTask(taskId, taskData);
    
    // Get project_id from task and synchronize progress
    if (taskData.project_id) {
      await this.synchronizeProjectProgress(taskData.project_id);
    }
    
    return result;
  }

  async deleteTask(taskId: string) {
    // Get task to find project_id before deletion
    const task = await this.repository.findTaskById(taskId);
    await this.repository.deleteTask(taskId);
    
    // Synchronize project progress if task had project_id
    if (task?.project_id) {
      await this.synchronizeProjectProgress(task.project_id);
    }
  }

  // ============= Risk Management =============

  async createRisk(projectId: string, riskData: any) {
    const riskEntity = {
      project_id: projectId,
      risk_title: riskData.title,
      risk_description: riskData.description,
      probability: riskData.probability,
      impact: riskData.impact,
      mitigation_strategy: riskData.mitigationPlan,
      status: riskData.status || 'identified'
    };

    return await this.repository.createRisk(riskEntity);
  }

  async updateRisk(riskId: string, riskData: any) {
    return await this.repository.updateRisk(riskId, riskData);
  }

  async deleteRisk(riskId: string) {
    await this.repository.deleteRisk(riskId);
  }

  // ============= Inspection Management =============

  async createInspection(projectId: string, inspectionData: any) {
    const inspectionEntity = {
      project_id: projectId,
      inspector: inspectionData.inspector,
      date: inspectionData.date,
      status: inspectionData.status || 'scheduled',
      progress_at_inspection: inspectionData.progressAtInspection || 0,
      comments: inspectionData.comments,
      phase_id: inspectionData.phaseId,
      documents: inspectionData.documents
    };

    const result = await this.repository.createInspection(inspectionEntity);
    
    // Synchronize project progress
    await this.synchronizeProjectProgress(projectId);
    
    return result;
  }

  async updateInspection(inspectionId: string, inspectionData: any) {
    const result = await this.repository.updateInspection(inspectionId, inspectionData);
    
    // Get project_id from inspection and synchronize progress
    if (inspectionData.project_id) {
      await this.synchronizeProjectProgress(inspectionData.project_id);
    }
    
    return result;
  }

  async deleteInspection(inspectionId: string) {
    // Get inspection to find project_id before deletion
    const inspection = await this.repository.findInspectionById(inspectionId);
    await this.repository.deleteInspection(inspectionId);
    
    // Synchronize project progress if inspection had project_id
    if (inspection?.project_id) {
      await this.synchronizeProjectProgress(inspection.project_id);
    }
  }

  // ============= Payment Management =============

  async createPayment(projectId: string, paymentData: any) {
    const paymentEntity = {
      project_id: projectId,
      amount: paymentData.amount,
      payment_date: paymentData.paymentDate,
      payment_method: paymentData.paymentMethod,
      progress_at_payment: paymentData.progressAtPayment || 0,
      transaction_id: paymentData.transactionId,
      contractor_name: paymentData.contractorName,
      contractor_contact: paymentData.contractorContact,
      bank_name: paymentData.bankName,
      account_number: paymentData.accountNumber,
      check_number: paymentData.checkNumber,
      mobile_number: paymentData.mobileNumber,
      mobile_operator: paymentData.mobileOperator,
      receiver_name: paymentData.receiverName
    };

    return await this.repository.createPayment(paymentEntity);
  }

  async updatePayment(paymentId: string, paymentData: any) {
    return await this.repository.updatePayment(paymentId, paymentData);
  }

  async deletePayment(paymentId: string) {
    await this.repository.deletePayment(paymentId);
  }

  // ============= Progress Synchronization =============

  /**
   * Recalculate and update project progress in database
   * Based on phases, tasks, and inspections with realistic methodology
   */
  async synchronizeProjectProgress(projectId: string): Promise<number> {
    const relatedData = await this.repository.findProjectWithRelatedData(projectId);
    if (!relatedData.project) return 0;

    // Calculate realistic progress
    const { ProgressCalculationService } = await import('./ProgressCalculationService');
    const calculatedProgress = ProgressCalculationService.calculateProjectProgress(
      relatedData.phases || [],
      relatedData.tasks || [],
      relatedData.inspections || []
    );

    // Update progress in database
    const roundedProgress = Math.round(calculatedProgress);
    await this.repository.update(projectId, { progress: roundedProgress });

    return roundedProgress;
  }

  // ============= Private Helper Methods =============

  private findLatestActivity(relatedData: any): string | undefined {
    const activities: { date: string; type: string }[] = [];

    relatedData.tasks.forEach((task: any) => {
      activities.push({ date: task.updated_at || task.created_at, type: 'task' });
    });

    relatedData.inspections.forEach((inspection: any) => {
      activities.push({ date: inspection.updated_at || inspection.created_at, type: 'inspection' });
    });

    relatedData.payments.forEach((payment: any) => {
      activities.push({ date: payment.created_at, type: 'payment' });
    });

    if (activities.length === 0) return undefined;

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return activities[0].date;
  }
}