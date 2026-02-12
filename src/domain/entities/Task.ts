// Domain Entity: Task
// Pure business logic without infrastructure concerns

import { Employee } from './Employee';
import { Project } from './Project';
import { Phase } from './Phase';
import { Document } from './Document';
import { TimeLine } from './Project';

export enum TaskStatus {
  Todo = "todo",
  Blocked = "blocked",
  InProgress = "inProgress",
  Done = "done",
}

export enum TaskPriority {
  Low = "low",
  Medium = "medium",
  High = "high",
  Urgent = "urgent",
}

export class Task {
  // Private fields for encapsulation
  private _id: string;
  private _projectId: string;
  private _phaseId: string | null;
  private _stepId: string | null;
  private _title: string;
  private _description: string | null;
  private _status: TaskStatus;
  private _priority: TaskPriority;
  private _progress: number;
  private _startDate: string | null;
  private _endDate: string | null;
  private _dueDate: string | null;
  private _completionDate: string | null;
  private _estimatedDuration: number | null;
  private _actualDuration: number | null;
  private _notes: string | null;
  private _assignedTo: string[];
  private _assignedById: string | null;
  private _createdAt: string;
  private _updatedAt: string;
  
  // ✅ Objets complexes
  private _project: Project | null;
  private _phase: Phase | null;
  private _assignedEmployees: Employee[];
  private _assignedByEmployee: Employee | null;
  
  // ✅ Collections d'entités
  private _dependencies: Task[];
  private _subtasks: Task[];
  private _documents: Document[];

  constructor(
    id: string,
    projectId: string,
    phaseId: string | null,
    stepId: string | null,
    title: string,
    description: string | null,
    status: TaskStatus,
    priority: TaskPriority,
    progress: number,
    startDate: string | null,
    endDate: string | null,
    dueDate: string | null,
    completionDate: string | null,
    estimatedDuration: number | null,
    actualDuration: number | null,
    notes: string | null,
    assignedTo: string[],
    assignedById: string | null,
    createdAt: string,
    updatedAt: string,
    
    // ✅ Objets complexes
    project: Project | null,
    phase: Phase | null,
    assignedEmployees: Employee[],
    assignedByEmployee: Employee | null,
    
    // ✅ Collections d'entités
    dependencies: Task[],
    subtasks: Task[],
    documents: Document[]
  ) {
    // Validate and assign private fields
    this._id = this.validateId(id);
    this._projectId = this.validateProjectId(projectId);
    this._phaseId = phaseId;
    this._stepId = stepId;
    this._title = this.validateTitle(title);
    this._description = description;
    this._status = this.validateStatus(status);
    this._priority = priority;
    this._progress = this.validateProgress(progress);
    this._startDate = startDate;
    this._endDate = endDate;
    this._dueDate = dueDate;
    this._completionDate = completionDate;
    this._estimatedDuration = this.validateDuration(estimatedDuration);
    this._actualDuration = this.validateDuration(actualDuration);
    this._notes = notes;
    this._assignedTo = assignedTo || [];
    this._assignedById = assignedById;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    
    // ✅ Objets complexes
    this._project = project;
    this._phase = phase;
    this._assignedEmployees = assignedEmployees || [];
    this._assignedByEmployee = assignedByEmployee;
    
    // ✅ Collections d'entités
    this._dependencies = dependencies || [];
    this._subtasks = subtasks || [];
    this._documents = documents || [];
  }

  // ============= Getters =============
  get id(): string { return this._id; }
  get projectId(): string { return this._projectId; }
  get phaseId(): string | null { return this._phaseId; }
  get stepId(): string | null { return this._stepId; }
  get title(): string { return this._title; }
  get description(): string | null { return this._description; }
  get status(): TaskStatus { return this._status; }
  get priority(): TaskPriority { return this._priority; }
  get progress(): number { return this._progress; }
  get startDate(): string | null { return this._startDate; }
  get endDate(): string | null { return this._endDate; }
  get dueDate(): string | null { return this._dueDate; }
  get completionDate(): string | null { return this._completionDate; }
  get estimatedDuration(): number | null { return this._estimatedDuration; }
  get actualDuration(): number | null { return this._actualDuration; }
  get notes(): string | null { return this._notes; }
  get assignedTo(): string[] { return this._assignedTo; }
  get assignedById(): string | null { return this._assignedById; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }
  
  // ✅ Getters pour objets complexes
  get project(): Project | null { return this._project; }
  get phase(): Phase | null { return this._phase; }
  get assignedEmployees(): Employee[] { return this._assignedEmployees; }
  get assignedByEmployee(): Employee | null { return this._assignedByEmployee; }
  
  // ✅ Getters pour collections
  get dependencies(): Task[] { return this._dependencies; }
  get subtasks(): Task[] { return this._subtasks; }
  get documents(): Document[] { return this._documents; }

  // ============= Getters with Business Logic =============
  get displayName(): string {
    return this._title || `Task-${this._id}`;
  }

  getProjectName(): string | null {
    return this._project?.title || null;
  }

  getPhaseName(): string | null {
    return this._phase?.phaseName || null;
  }

  getAssignedEmployeesCount(): number {
    return this._assignedEmployees.length;
  }

  getDependenciesCount(): number {
    return this._dependencies.length;
  }

  getSubtasksCount(): number {
    return this._subtasks.length;
  }

  getDocumentsCount(): number {
    return this._documents.length;
  }

  getDaysRemaining(): number {
    if (!this._dueDate) return 0;
    const now = new Date();
    const due = new Date(this._dueDate);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isOverdue(): boolean {
    if (!this._dueDate) return false;
    return new Date() > new Date(this._dueDate) && this._status !== 'completed';
  }

  getProgressPercentage(): number {
    return this._progress;
  }

  // ============= Setters with Validation =============
  set title(value: string) { 
    this._title = this.validateTitle(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set description(value: string | null) { 
    this._description = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set status(value: TaskStatus) { 
    this._status = this.validateStatus(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set priority(value: TaskPriority) { 
    this._priority = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set progress(value: number) { 
    this._progress = this.validateProgress(value); 
    this._updatedAt = new Date().toISOString();
  }
  
  set dueDate(value: string | null) { 
    this._dueDate = value; 
    this._updatedAt = new Date().toISOString();
  }
  
  set notes(value: string | null) { 
    this._notes = value; 
    this._updatedAt = new Date().toISOString();
  }

  // ============= Business Logic Methods =============
  canStart(): boolean {
    return this._status === 'not_started' && this.areDependenciesMet();
  }

  canComplete(): boolean {
    return this._status === 'in_progress';
  }

  isCompleted(): boolean {
    return this._status === 'completed';
  }

  isBlocked(): boolean {
    return this._status === 'blocked';
  }

  areDependenciesMet(): boolean {
    return this._dependencies.every(dep => dep.isCompleted());
  }

  calculateActualDuration(): number | null {
    if (!this._startDate || !this._completionDate) return null;
    const start = new Date(this._startDate);
    const end = new Date(this._completionDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ============= Immutability Methods =============
  withStatus(newStatus: TaskStatus): Task {
    return new Task(
      this._id,
      this._projectId,
      this._phaseId,
      this._stepId,
      this._title,
      this._description,
      newStatus,
      this._priority,
      this._progress,
      this._startDate,
      this._endDate,
      this._dueDate,
      this._completionDate,
      this._estimatedDuration,
      this._actualDuration,
      this._notes,
      this._assignedTo,
      this._assignedById,
      this._createdAt,
      new Date().toISOString(),
      this._project,
      this._phase,
      this._assignedEmployees,
      this._assignedByEmployee,
      this._dependencies,
      this._subtasks,
      this._documents
    );
  }

  withProgress(newProgress: number): Task {
    return new Task(
      this._id,
      this._projectId,
      this._phaseId,
      this._stepId,
      this._title,
      this._description,
      this._status,
      this._priority,
      this.validateProgress(newProgress),
      this._startDate,
      this._endDate,
      this._dueDate,
      this._completionDate,
      this._estimatedDuration,
      this._actualDuration,
      this._notes,
      this._assignedTo,
      this._assignedById,
      this._createdAt,
      new Date().toISOString(),
      this._project,
      this._phase,
      this._assignedEmployees,
      this._assignedByEmployee,
      this._dependencies,
      this._subtasks,
      this._documents
    );
  }

  // ============= Factory Methods =============
  static create(params: {
    id: string;
    projectId: string;
    phaseId?: string;
    stepId?: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    progress?: number;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    estimatedDuration?: number;
    notes?: string;
    assignedTo?: string[];
    assignedById?: string;
  }): Task {
    return new Task(
      params.id,
      params.projectId,
      params.phaseId || null,
      params.stepId || null,
      params.title,
      params.description || null,
      params.status || 'not_started',
      params.priority || 'medium',
      params.progress || 0,
      params.startDate || null,
      params.endDate || null,
      params.dueDate || null,
      null, // completionDate
      params.estimatedDuration || null,
      null, // actualDuration
      params.notes || null,
      params.assignedTo || [],
      params.assignedById || null,
      new Date().toISOString(),
      new Date().toISOString(),
      null, // project
      null, // phase
      [], // assignedEmployees
      null, // assignedByEmployee
      [], // dependencies
      [], // subtasks
      []  // documents
    );
  }

  // ============= Data Transformation Methods =============
  toPlainObject(): Record<string, unknown> {
    return {
      id: this._id,
      project_id: this._projectId,
      phase_id: this._phaseId,
      step_id: this._stepId,
      title: this._title,
      description: this._description,
      status: this._status,
      priority: this._priority,
      progress: this._progress,
      start_date: this._startDate,
      end_date: this._endDate,
      due_date: this._dueDate,
      completion_date: this._completionDate,
      estimated_duration: this._estimatedDuration,
      actual_duration: this._actualDuration,
      notes: this._notes,
      assigned_to: this._assignedTo,
      assigned_by: this._assignedById,
      created_at: this._createdAt,
      updated_at: this._updatedAt,
      dependencies: this._dependencies.map(d => d.id),
      subtasks: this._subtasks.map(d => d.id),
      documents: this._documents.map(d => d.id)
    };
  }

  // ============= Validation methods
  private validateId(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new Error('Task ID is required');
    }
    return id;
  }

  private validateProjectId(projectId: string): string {
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Project ID is required');
    }
    return projectId;
  }

  private validateTitle(title: string): string {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title is required');
    }
    return title;
  }

  private validateStatus(status: TaskStatus): TaskStatus {
    const validStatuses = Object.values(TaskStatus);
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid task status: ${status}`);
    }
    return status;
  }

  // Public getters
  get id(): string {
    return this._id;
  }

  get deadline(): Date {
    return this._deadline;
  }

  get assignedTo(): string {
    return this._assignedTo;
  }

  get projectId(): string {
    return this._projectId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get status(): TaskStatus {
    return this._status;
  }

  get timeline(): TimeLine {
    return this._timeline;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business logic methods
  updateStatus(newStatus: TaskStatus): void {
    this._status = this.validateStatus(newStatus);
    this._updatedAt = new Date();
  }

  isOverdue(): boolean {
    return new Date() > this._deadline && this._status !== TaskStatus.Done && this._status !== TaskStatus.Blocked;
  }

  getDaysUntilDue(): number | null {
    const diffTime = this._deadline.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 24));
  }

  getFormattedStatus(): string {
    const statusMap = {
      [TaskStatus.Todo]: '⏳ À faire',
      [TaskStatus.Blocked]: '🚫 Bloqué',
      [TaskStatus.InProgress]: '🔄 En cours',
      [TaskStatus.Done]: '✅ Terminé'
    };
    return statusMap[this._status];
  }
}
