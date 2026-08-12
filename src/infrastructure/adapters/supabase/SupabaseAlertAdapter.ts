// ============================================================
// src/infrastructure/adapters/supabase/SupabaseAlertAdapter.ts
// ============================================================
/**
 * Supabase Alert Adapter (Infrastructure)
 * Implémentation utilisant Supabase comme base de données
 * Implémente le port IAlertRepository
 */

import { 
  Alert, 
  AlertStatistics, 
  AlertStatus, 
  AlertType, 
  AlertSeverity, 
  AlertSource,
  AlertEntity
} from '@/domain/entities/Alert';
import { IAlertRepository, AlertFilter } from '@/domain/repositories/IAlertRepository';
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
// ===== Table name =====
const TABLE_NAME = 'project_alerts';

// ============================================================
// src/infrastructure/adapters/supabase/SupabaseAlertAdapter.ts
// ============================================================

/**
 * Mapping entre les champs DB et l'entité Alert
 */
interface DBAlert {
  // === Identifiants ===
  id: string;
  project_id: string;
  related_entity_id?: string | null;

  // === Core ===
  type: string;
  severity: string;
  title: string;
  message: string;
  source: string;
  status: string;
  
  // === Project Context ===
  project_title: string;

  // === Dates ===
  timestamp: string;
  trigger_date: string;
  deadline?: string | null;
  recurrence?: number | null;
  created_at: string;
  updated_at: string;
  
  // === Resolution Dates ===
  resolved_at?: string | null;
  acknowledged_at?: string | null;
  action_taken_at?: string | null;

  // === Status Flags ===
  acknowledged: boolean;
  action_required: boolean;

  // === User IDs ===
  acknowledged_by?: string | null;
  action_taken_by?: string | null;

  // === Actions ===
  action_taken?: string | null;
  available_actions: string[];
  action_proof: any[]; // JSONB array

  // === Escalation ===
  escalation_level: number;

  // === Additional Data ===
  delay_days?: number | null;
  metadata?: Record<string, any> | null; // 🔥 Ajouté pour `metadata` JSONB
}

/**
 * Mapping DB → Alert Entity
 */
const mapDBToAlert = (dbAlert: DBAlert): Alert => {
  return {
    id: dbAlert.id,
    projectId: dbAlert.project_id,
    projectTitle: dbAlert.project_title,
    relatedEntityId: dbAlert.related_entity_id || undefined,
    
    type: dbAlert.type as AlertType,
    severity: dbAlert.severity as AlertSeverity,
    source: dbAlert.source as AlertSource,
    status: dbAlert.status as AlertStatus,
    
    title: dbAlert.title,
    message: dbAlert.message,
    
    timestamp: dbAlert.timestamp,
    triggerDate: dbAlert.trigger_date,
    deadline: dbAlert.deadline || undefined,
    recurrence: dbAlert.recurrence || undefined,
    
    acknowledged: dbAlert.acknowledged,
    acknowledgedBy: dbAlert.acknowledged_by || undefined,
    acknowledgedAt: dbAlert.acknowledged_at || undefined,
    
    actionRequired: dbAlert.action_required,
    actionTaken: dbAlert.action_taken || undefined,
    actionTakenBy: dbAlert.action_taken_by || undefined,
    actionTakenAt: dbAlert.action_taken_at || undefined,
    
    resolvedAt: dbAlert.resolved_at || undefined,
    
    escalationLevel: dbAlert.escalation_level,
    availableActions: dbAlert.available_actions || [],
    actionProof: dbAlert.action_proof || [],
    delayDays: dbAlert.delay_days || undefined,
    
    createdAt: dbAlert.created_at,
    updatedAt: dbAlert.updated_at,
    
    // ✅ Ajout des métadonnées si présentes
    metadata: dbAlert.metadata || {},
  };
};

/**
 * Mapping Alert Entity → DB
 */
const mapAlertToDB = (alert: Alert): Omit<DBAlert, 'created_at' | 'updated_at'> => {
  return {
    id: alert.id,
    project_id: alert.projectId,
    project_title: alert.projectTitle || '',
    related_entity_id: alert.relatedEntityId || null,
    
    type: alert.type,
    severity: alert.severity,
    source: alert.source || 'system',
    status: alert.status || 'open',
    
    title: alert.title,
    message: alert.message,
    
    timestamp: alert.timestamp || new Date().toISOString(),
    trigger_date: alert.triggerDate || new Date().toISOString(),
    deadline: alert.deadline || null,
    recurrence: alert.recurrence || null,
    
    acknowledged: alert.acknowledged || false,
    acknowledged_by: alert.acknowledgedBy || null,
    acknowledged_at: alert.acknowledgedAt || null,
    
    action_required: alert.actionRequired || false,
    action_taken: alert.actionTaken || null,
    action_taken_by: alert.actionTakenBy || null,
    action_taken_at: alert.actionTakenAt || null,
    
    resolved_at: alert.resolvedAt || null,
    
    escalation_level: alert.escalationLevel || 0,
    available_actions: alert.availableActions || [],
    action_proof: alert.actionProof || [],
    delay_days: alert.delayDays || null,
    
    // ✅ Ajout des métadonnées
    metadata: alert.metadata || {},
  };
};

export class SupabaseAlertAdapter implements IAlertRepository {
  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * Convertit un objet DB en entité Alert
   */
  private fromDB(dbAlert: DBAlert): Alert {
    return {
      id: dbAlert.id,
      type: dbAlert.type as AlertType,
      severity: dbAlert.severity as AlertSeverity,
      title: dbAlert.title,
      message: dbAlert.message,
      projectId: dbAlert.project_id,
      projectTitle: dbAlert.project_title,
      relatedEntityId: dbAlert.related_entity_id ?? undefined,
      source: dbAlert.source as AlertSource,
      delayDays: dbAlert.delay_days ?? undefined,
      timestamp: dbAlert.timestamp,
      triggerDate: dbAlert.trigger_date,
      acknowledged: dbAlert.acknowledged,
      acknowledgedBy: dbAlert.acknowledged_by ?? undefined,
      acknowledgedAt: dbAlert.acknowledged_at ?? undefined,
      actionRequired: dbAlert.action_required,
      actionTaken: dbAlert.action_taken ?? undefined,
      actionTakenBy: dbAlert.action_taken_by ?? undefined,
      actionTakenAt: dbAlert.action_taken_at ?? undefined,
      escalationLevel: dbAlert.escalation_level,
      availableActions: dbAlert.available_actions,
      actionProof: dbAlert.action_proof,
      deadline: dbAlert.deadline ?? undefined,
      recurrence: dbAlert.recurrence ?? undefined,
      status: dbAlert.status as AlertStatus,
      createdAt: dbAlert.created_at,
      updatedAt: dbAlert.updated_at,
      resolvedAt: dbAlert.resolved_at ?? undefined,
    };
  }

  /**
   * Convertit une entité Alert en objet DB
   */
  private toDB(alert: Alert): Omit<DBAlert, 'created_at' | 'updated_at'> {
    return {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      project_id: alert.projectId,
      project_title: alert.projectTitle || '',
      related_entity_id: alert.relatedEntityId ?? null,
      source: alert.source || 'system',
      delay_days: alert.delayDays ?? null,
      timestamp: alert.timestamp || new Date().toISOString(),
      trigger_date: alert.triggerDate || new Date().toISOString(),
      acknowledged: alert.acknowledged || false,
      acknowledged_by: alert.acknowledgedBy ?? null,
      acknowledged_at: alert.acknowledgedAt ?? null,
      action_required: alert.actionRequired || false,
      action_taken: alert.actionTaken ?? null,
      action_taken_by: alert.actionTakenBy ?? null,
      action_taken_at: alert.actionTakenAt ?? null,
      escalation_level: alert.escalationLevel || 0,
      available_actions: alert.availableActions || [],
      action_proof: alert.actionProof || [],
      deadline: alert.deadline ?? null,
      recurrence: alert.recurrence ?? null,
      status: alert.status || 'open',
      resolved_at: alert.resolvedAt ?? null,
    };
  }

  /**
   * Construit la requête avec les filtres
   */
  private buildQuery(filters?: AlertFilter) {
    let query = supabase.from(TABLE_NAME).select('*');

    if (filters) {
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.acknowledged !== undefined) {
        query = query.eq('acknowledged', filters.acknowledged);
      }
      if (filters.dateRange) {
        if (filters.dateRange.start) {
          query = query.gte('created_at', filters.dateRange.start);
        }
        if (filters.dateRange.end) {
          query = query.lte('created_at', filters.dateRange.end);
        }
      }
    }

    return query;
  }

  /**
   * Gère les erreurs Supabase
   */
  private handleError(error: any, operation: string): never {
    console.error(`[SupabaseAlertAdapter] Erreur ${operation}:`, error);
    throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
  }

  // ============================================================
  // IAlertRepository Implementation
  // ============================================================

  /**
   * Crée une nouvelle alerte
   */
  async create(alert: Alert): Promise<Alert> {
    const dbAlert = this.toDB(alert);
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([dbAlert])
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create alert');
    }

    return this.fromDB(data as DBAlert);
  }

  /**
   * Récupère une alerte par son ID
   */
  async findById(id: string): Promise<Alert | null> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      this.handleError(error, 'find alert by id');
    }

    return data ? this.fromDB(data as DBAlert) : null;
  }

  /**
   * Récupère toutes les alertes avec filtres optionnels
   */
  async find(filters?: AlertFilter): Promise<Alert[]> {
    const query = this.buildQuery(filters);
    const { data, error } = await query;

    if (error) {
      this.handleError(error, 'find alerts');
    }

    return (data || []).map((item: DBAlert) => this.fromDB(item));
  }

  /**
   * Récupère toutes les alertes d'un projet
   */
  async findByProjectId(projectId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'find alerts by project');
    }

    return (data || []).map((item: DBAlert) => this.fromDB(item));
  }

  /**
   * Récupère toutes les alertes actives (open + acknowledged)
   */
  async findActive(): Promise<Alert[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .in('status', ['open', 'acknowledged'])
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'find active alerts');
    }

    return (data || []).map((item: DBAlert) => this.fromDB(item));
  }

  /**
   * Récupère les alertes par type
   */
  async findByType(type: AlertType): Promise<Alert[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'find alerts by type');
    }

    return (data || []).map((item: DBAlert) => this.fromDB(item));
  }

  /**
   * Récupère les alertes par sévérité
   */
  async findBySeverity(severity: AlertSeverity): Promise<Alert[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('severity', severity)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'find alerts by severity');
    }

    return (data || []).map((item: DBAlert) => this.fromDB(item));
  }

  /**
   * Récupère les alertes par source
   */
  async findBySource(source: AlertSource): Promise<Alert[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('source', source)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'find alerts by source');
    }

    return (data || []).map((item: DBAlert) => this.fromDB(item));
  }

  /**
   * Récupère les alertes par statut
   */
  async findByStatus(status: AlertStatus): Promise<Alert[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'find alerts by status');
    }

    return (data || []).map((item: DBAlert) => this.fromDB(item));
  }

  /**
   * Met à jour une alerte
   */
  async update(id: string, alert: Partial<Alert>): Promise<Alert> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Map les champs de l'entité vers les champs DB
    if (alert.type !== undefined) updateData.type = alert.type;
    if (alert.severity !== undefined) updateData.severity = alert.severity;
    if (alert.title !== undefined) updateData.title = alert.title;
    if (alert.message !== undefined) updateData.message = alert.message;
    if (alert.status !== undefined) updateData.status = alert.status;
    if (alert.acknowledged !== undefined) updateData.acknowledged = alert.acknowledged;
    if (alert.acknowledgedBy !== undefined) updateData.acknowledged_by = alert.acknowledgedBy;
    if (alert.acknowledgedAt !== undefined) updateData.acknowledged_at = alert.acknowledgedAt;
    if (alert.actionTaken !== undefined) updateData.action_taken = alert.actionTaken;
    if (alert.actionTakenBy !== undefined) updateData.action_taken_by = alert.actionTakenBy;
    if (alert.actionTakenAt !== undefined) updateData.action_taken_at = alert.actionTakenAt;
    if (alert.escalationLevel !== undefined) updateData.escalation_level = alert.escalationLevel;
    if (alert.deadline !== undefined) updateData.deadline = alert.deadline;
    if (alert.resolvedAt !== undefined) updateData.resolved_at = alert.resolvedAt;
    if (alert.delayDays !== undefined) updateData.delay_days = alert.delayDays;
    if (alert.actionProof !== undefined) updateData.action_proof = alert.actionProof;

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'update alert');
    }

    return this.fromDB(data as DBAlert);
  }

  /**
   * Supprime une alerte
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      this.handleError(error, 'delete alert');
    }
  }

  /**
   * Accuse réception d'une alerte
   */
  async acknowledge(id: string, userId: string): Promise<Alert> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'acknowledged',
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'acknowledge alert');
    }

    return this.fromDB(data as DBAlert);
  }

  /**
   * Résout une alerte
   */
  async resolve(id: string, userId: string): Promise<Alert> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'resolved',
        acknowledged: true,
        action_taken_by: userId,
        action_taken_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'resolve alert');
    }

    return this.fromDB(data as DBAlert);
  }

  /**
   * Escalade une alerte
   */
  async escalate(id: string): Promise<Alert> {
    // Récupérer d'abord l'alerte pour connaître le niveau actuel
    const current = await this.findById(id);
    if (!current) {
      throw new Error(`Alert with id ${id} not found`);
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'escalated',
        escalation_level: (current.escalationLevel || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'escalate alert');
    }

    return this.fromDB(data as DBAlert);
  }

  /**
   * Accuse réception de plusieurs alertes
   */
  async acknowledgeBatch(ids: string[], userId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'acknowledged',
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select();

    if (error) {
      this.handleError(error, 'acknowledge batch alerts');
    }

    return (data || []).map((item: DBAlert) => this.fromDB(item));
  }

  /**
   * Résout plusieurs alertes
   */
  async resolveBatch(ids: string[], userId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        status: 'resolved',
        acknowledged: true,
        action_taken_by: userId,
        action_taken_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .select();

    if (error) {
      this.handleError(error, 'resolve batch alerts');
    }

    return (data || []).map((item: DBAlert) => this.fromDB(item));
  }

  /**
   * Récupère les statistiques des alertes
   */
  async getStatistics(projectId?: string): Promise<AlertStatistics> {
    let query = supabase.from(TABLE_NAME).select('*');

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      this.handleError(error, 'get statistics');
    }

    const alerts = (data || []) as DBAlert[];
    const total = alerts.length;
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const high = alerts.filter(a => a.severity === 'high').length;
    const medium = alerts.filter(a => a.severity === 'medium').length;
    const low = alerts.filter(a => a.severity === 'low').length;
    const open = alerts.filter(a => a.status === 'open').length;
    const acknowledged = alerts.filter(a => a.status === 'acknowledged').length;
    const resolved = alerts.filter(a => a.status === 'resolved' || a.status === 'closed').length;

    // Calcul du temps moyen de résolution
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved' || a.status === 'closed');
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    for (const alert of resolvedAlerts) {
      if (alert.resolved_at) {
        const created = new Date(alert.created_at).getTime();
        const resolved = new Date(alert.resolved_at).getTime();
        totalResolutionTime += (resolved - created) / (1000 * 60 * 60);
        resolvedCount++;
      }
    }
    const avgResolutionTime = resolvedCount > 0 
      ? Math.round(totalResolutionTime / resolvedCount) 
      : 0;

    return {
      total,
      critical,
      high,
      medium,
      low,
      open,
      acknowledged,
      resolved,
      pendingActions: open + acknowledged,
      activeRisks: alerts.filter(a => a.type === 'risk' && a.status === 'open').length,
      overdueTasks: alerts.filter(a => 
        a.deadline && 
        new Date(a.deadline) < new Date() && 
        a.status !== 'resolved' && 
        a.status !== 'closed'
      ).length,
      avgResolutionTime,
      resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
    };
  }

  /**
   * Compte le nombre d'alertes
   */
  async count(filters?: AlertFilter): Promise<number> {
    const query = this.buildQuery(filters);
    const { count, error } = await query.select('*', { count: 'exact', head: true });

    if (error) {
      this.handleError(error, 'count alerts');
    }

    return count || 0;
  }

  /**
   * Vérifie si une alerte existe
   */
  async exists(id: string): Promise<boolean> {
    const { count, error } = await supabase
      .from(TABLE_NAME)
      .select('*', { count: 'exact', head: true })
      .eq('id', id);

    if (error) {
      this.handleError(error, 'check alert exists');
    }

    return (count || 0) > 0;
  }

  /**
   * Supprime toutes les alertes d'un projet
   */
  async deleteByProjectId(projectId: string): Promise<number> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('project_id', projectId)
      .select();

    if (error) {
      this.handleError(error, 'delete alerts by project');
    }

    return (data || []).length;
  }
}

// ===== Factory =====
export function createSupabaseAlertAdapter(): SupabaseAlertAdapter {
  return new SupabaseAlertAdapter();
}