// ============================================================
// src/domain/entities/Alert.ts
// ============================================================
/**
 * Alert Domain Entity
 * Pure business logic - NO external dependencies
 */

// ===== Types =====
export type AlertType = 
  | 'insurance_expiry' 
  | 'project_delay' 
  | 'inspection_issue' 
  | 'financial_risk' 
  | 'bank_guarantee' 
  | 'inspection_overdue' 
  | 'payment_blocked' 
  | 'compliance_violation' 
  | 'delivery' 
  | 'deadline' 
  | 'quality'
  // Types transverses (monitoring, pilotage projet)
  | 'budget'
  | 'timeline'
  | 'resource'
  | 'risk'
  | 'compliance'
  | 'system'
  | 'security'
  | 'document'
  | 'insurance'
  | 'phase'
  | 'milestone'
  | 'inspection'
  | 'payment';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'closed' | 'escalated' | 'pending' | 'active';
export type AlertSource =
  | 'insurance'
  | 'bank_guarantee'
  | 'inspection'
  | 'payment'
  | 'notification'
  | 'project'
  | 'deadline'
  | 'budget'
  | 'resource'
  | 'risk'
  | 'compliance'
  | 'system'
  | 'user'
  | 'phase'
  | 'milestone'
  | 'monitoring'
  | 'financial'
  | 'guarantee';

// ===== Action Proof =====
export type ActionProofType = 'email' | 'sms' | 'document' | 'call' | 'meeting';

export interface ActionProof {
  type: ActionProofType;
  timestamp: string;
  performedBy: string;
  details: string;
  documentUrl?: string;
}

// ===== Interfaces =====
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  projectId: string;
  projectTitle?: string;
  relatedEntityId?: string;
  source?: AlertSource;
  delayDays?: number;
  timestamp: string;
  triggerDate: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  actionRequired: boolean;
  actionTaken?: string;
  actionTakenBy?: string;
  actionTakenAt?: string;
  escalationLevel: number;
  availableActions: string[];
  actionProof: ActionProof[];
  deadline?: string;
  recurrence?: number;
  status: AlertStatus;
  createdAt: string;
  updatedAt: string;
  /** Résolution (optionnel : renseigné quand status === 'resolved') */
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  /** Actions métier attachées à l'alerte (labels ou descripteurs) */
  actions?: Array<Record<string, unknown> | string>;
  /** Données brutes additionnelles persistées côté base */
  metadata?: Record<string, unknown>;
}

// ===== UNIQUE Statistics Interface =====
export interface AlertStatistics {
  // Totaux
  total?: number;

  // Par sévérité
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;

  // Par statut
  open?: number;
  acknowledged?: number;
  resolved?: number;
  closed?: number;
  escalated?: number;

  // Métriques avancées
  unacknowledged?: number;
  overdue?: number;
  avgResolutionTime?: number; // hours

  // Répartition
  byType?: Record<string, number>;
  bySource?: Record<string, number>;
  bySeverity?: Record<string, number>;
  byStatus?: Record<string, number>;

  // Tendance
  trend?: Array<{
    date: string;
    count: number;
    severity: AlertSeverity;
  }>;

  // ===== Alias UI (tableaux de bord / pilotage) =====
  totalAlerts?: number;
  criticalAlerts?: number;
  highAlerts?: number;
  mediumAlerts?: number;
  lowAlerts?: number;
  openAlerts?: number;
  acknowledgedAlerts?: number;
  resolvedAlerts?: number;
  closedAlerts?: number;
  escalatedAlerts?: number;
  pendingActions?: number | string[];
  activeRisks?: number;
  overdueTasks?: number;
  resolutionRate?: number;
}

/**
 * État agrégé exposé par le pilotage projet (ProjectManager / AlertService).
 */
export interface ProjectManagerState {
  alerts: Alert[];
  stats: AlertStatistics;
  lastUpdated?: string;
  lastCheck?: string;
  progress?: number;
  totalAlerts?: number;
  criticalAlerts?: number;
  resolvedAlerts?: number;
  pendingActions?: string[] | number;
  evmData?: unknown;
  ganttData?: unknown;
  pertData?: unknown;
}

// ===== Escalation Rule =====
export interface EscalationRule {
  id: string;
  alertType: AlertType;
  severityLevel: AlertSeverity;
  timeThreshold: number; // minutes
  escalationLevel: number;
  targetRole: string;
  actionRequired: string[];
  autoAssign: boolean;
}

// ===== Class Entity =====
export class AlertEntity {
  private _id: string;
  private _type: AlertType;
  private _severity: AlertSeverity;
  private _title: string;
  private _message: string;
  private _projectId: string;
  private _projectTitle?: string;
  private _relatedEntityId?: string;
  private _source?: AlertSource;
  private _delayDays?: number;
  private _timestamp: string;
  private _triggerDate: string;
  private _acknowledged: boolean;
  private _acknowledgedBy?: string;
  private _acknowledgedAt?: string;
  private _actionRequired: boolean;
  private _actionTaken?: string;
  private _actionTakenBy?: string;
  private _actionTakenAt?: string;
  private _escalationLevel: number;
  private _availableActions: string[];
  private _actionProof: ActionProof[];
  private _deadline?: string;
  private _recurrence?: number;
  private _status: AlertStatus;
  private _createdAt: string;
  private _updatedAt: string;

  constructor(props: Alert) {
    this._id = props.id;
    this._type = props.type;
    this._severity = props.severity;
    this._title = props.title;
    this._message = props.message;
    this._projectId = props.projectId;
    this._projectTitle = props.projectTitle;
    this._relatedEntityId = props.relatedEntityId;
    this._source = props.source;
    this._delayDays = props.delayDays;
    this._timestamp = props.timestamp || new Date().toISOString();
    this._triggerDate = props.triggerDate || new Date().toISOString();
    this._acknowledged = props.acknowledged || false;
    this._acknowledgedBy = props.acknowledgedBy;
    this._acknowledgedAt = props.acknowledgedAt;
    this._actionRequired = props.actionRequired || false;
    this._actionTaken = props.actionTaken;
    this._actionTakenBy = props.actionTakenBy;
    this._actionTakenAt = props.actionTakenAt;
    this._escalationLevel = props.escalationLevel || 0;
    this._availableActions = props.availableActions || [];
    this._actionProof = props.actionProof || [];
    this._deadline = props.deadline;
    this._recurrence = props.recurrence;
    this._status = props.status || 'open';
    this._createdAt = props.createdAt || new Date().toISOString();
    this._updatedAt = props.updatedAt || new Date().toISOString();
    this.validate();
  }

  private validate(): void {
    if (!this._id) throw new Error('Alert ID is required');
    if (!this._type) throw new Error('Alert type is required');
    if (!this._title) throw new Error('Alert title is required');
    if (!this._message) throw new Error('Alert message is required');
    if (!this._projectId) throw new Error('Project ID is required');
    if (!this._severity) throw new Error('Alert severity is required');
  }

  // ===== Getters =====
  get id(): string { return this._id; }
  get type(): AlertType { return this._type; }
  get severity(): AlertSeverity { return this._severity; }
  get title(): string { return this._title; }
  get message(): string { return this._message; }
  get projectId(): string { return this._projectId; }
  get projectTitle(): string | undefined { return this._projectTitle; }
  get relatedEntityId(): string | undefined { return this._relatedEntityId; }
  get source(): AlertSource | undefined { return this._source; }
  get delayDays(): number | undefined { return this._delayDays; }
  get timestamp(): string { return this._timestamp; }
  get triggerDate(): string { return this._triggerDate; }
  get isAcknowledged(): boolean { return this._acknowledged; }
  get acknowledgedBy(): string | undefined { return this._acknowledgedBy; }
  get acknowledgedAt(): string | undefined { return this._acknowledgedAt; }
  get actionRequired(): boolean { return this._actionRequired; }
  get actionTaken(): string | undefined { return this._actionTaken; }
  get actionTakenBy(): string | undefined { return this._actionTakenBy; }
  get actionTakenAt(): string | undefined { return this._actionTakenAt; }
  get escalationLevel(): number { return this._escalationLevel; }
  get availableActions(): string[] { return [...this._availableActions]; }
  get actionProof(): ActionProof[] { return [...this._actionProof]; }
  get deadline(): string | undefined { return this._deadline; }
  get recurrence(): number | undefined { return this._recurrence; }
  get status(): AlertStatus { return this._status; }
  get createdAt(): string { return this._createdAt; }
  get updatedAt(): string { return this._updatedAt; }

  // ===== Méthodes métier =====
  acknowledge(userId: string): void {
    if (this._status === 'resolved' || this._status === 'closed') {
      throw new Error('Cannot acknowledge a resolved or closed alert');
    }
    this._acknowledged = true;
    this._acknowledgedBy = userId;
    this._acknowledgedAt = new Date().toISOString();
    this._status = 'acknowledged';
    this._updatedAt = new Date().toISOString();
  }

  resolve(userId: string): void {
    if (this._status === 'resolved' || this._status === 'closed') {
      throw new Error('Alert is already resolved');
    }
    this._status = 'resolved';
    this._actionTaken = 'resolved';
    this._actionTakenBy = userId;
    this._actionTakenAt = new Date().toISOString();
    this._updatedAt = new Date().toISOString();
  }

  escalate(): void {
    this._escalationLevel = (this._escalationLevel || 0) + 1;
    this._status = 'escalated';
    this._updatedAt = new Date().toISOString();
  }

  addActionProof(proof: ActionProof): void {
    this._actionProof.push(proof);
    this._updatedAt = new Date().toISOString();
  }

  isCritical(): boolean {
    return this._severity === 'critical';
  }

  isHigh(): boolean {
    return this._severity === 'high' || this._severity === 'critical';
  }

  isOverdue(): boolean {
    if (!this._deadline) return false;
    return new Date(this._deadline) < new Date() && this._status !== 'resolved' && this._status !== 'closed';
  }

  // ===== Transformation =====
  toDTO(): Alert {
    return {
      id: this._id,
      type: this._type,
      severity: this._severity,
      title: this._title,
      message: this._message,
      projectId: this._projectId,
      projectTitle: this._projectTitle,
      relatedEntityId: this._relatedEntityId,
      source: this._source,
      delayDays: this._delayDays,
      timestamp: this._timestamp,
      triggerDate: this._triggerDate,
      acknowledged: this._acknowledged,
      acknowledgedBy: this._acknowledgedBy,
      acknowledgedAt: this._acknowledgedAt,
      actionRequired: this._actionRequired,
      actionTaken: this._actionTaken,
      actionTakenBy: this._actionTakenBy,
      actionTakenAt: this._actionTakenAt,
      escalationLevel: this._escalationLevel,
      availableActions: this._availableActions,
      actionProof: this._actionProof,
      deadline: this._deadline,
      recurrence: this._recurrence,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  static fromDTO(dto: Alert): AlertEntity {
    return new AlertEntity(dto);
  }

  static create(props: {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    projectId: string;
    projectTitle?: string;
    relatedEntityId?: string;
    source?: AlertSource;
    delayDays?: number;
    actionRequired?: boolean;
    availableActions?: string[];
    deadline?: string;
    recurrence?: number;
  }): AlertEntity {
    return new AlertEntity({
      id: crypto.randomUUID ? crypto.randomUUID() : `alert-${Date.now()}`,
      type: props.type,
      severity: props.severity,
      title: props.title,
      message: props.message,
      projectId: props.projectId,
      projectTitle: props.projectTitle,
      relatedEntityId: props.relatedEntityId,
      source: props.source,
      delayDays: props.delayDays,
      timestamp: new Date().toISOString(),
      triggerDate: new Date().toISOString(),
      acknowledged: false,
      actionRequired: props.actionRequired || false,
      escalationLevel: 0,
      availableActions: props.availableActions || [],
      actionProof: [],
      deadline: props.deadline,
      recurrence: props.recurrence,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}