/**
 * BankGuaranteeActionService - Placeholder service for bank guarantee actions
 * Uses in-memory storage since the tables don't exist yet
 */

export interface BankGuaranteeAction {
  id: string;
  guarantee_id: string;
  action_type: 'notification' | 'claim' | 'renewal' | 'cancellation' | 'extension' | 'modification';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  completed_at?: string;
  documents: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BankGuaranteeActionTemplate {
  id: string;
  action_type: BankGuaranteeAction['action_type'];
  title_template: string;
  description_template: string;
  priority: BankGuaranteeAction['priority'];
  default_due_days: number;
  required_documents: string[];
  is_active: boolean;
}

// In-memory storage
const actionsStore: Map<string, BankGuaranteeAction> = new Map();
const templatesStore: Map<string, BankGuaranteeActionTemplate> = new Map();

export class BankGuaranteeActionService {
  
  /**
   * Create a new bank guarantee action
   */
  static async createBankGuaranteeAction(actionData: Omit<BankGuaranteeAction, 'id' | 'created_at' | 'updated_at'>): Promise<BankGuaranteeAction> {
    try {
      const id = `action-${Date.now()}`;
      const now = new Date().toISOString();
      const action: BankGuaranteeAction = {
        ...actionData,
        id,
        status: actionData.status || 'pending',
        documents: actionData.documents || [],
        created_at: now,
        updated_at: now
      };
      actionsStore.set(id, action);
      return action;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create bank guarantee action: ${message}`);
    }
  }

  /**
   * Get all actions for a guarantee
   */
  static async getActionsByGuaranteeId(guaranteeId: string): Promise<BankGuaranteeAction[]> {
    try {
      return Array.from(actionsStore.values())
        .filter(a => a.guarantee_id === guaranteeId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch guarantee actions: ${message}`);
    }
  }

  /**
   * Update an action
   */
  static async updateAction(id: string, updates: Partial<BankGuaranteeAction>): Promise<BankGuaranteeAction> {
    try {
      const existing = actionsStore.get(id);
      if (!existing) throw new Error('Action not found');
      
      const updated: BankGuaranteeAction = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      };
      actionsStore.set(id, updated);
      return updated;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update action: ${message}`);
    }
  }

  /**
   * Delete an action
   */
  static async deleteAction(id: string): Promise<void> {
    try {
      actionsStore.delete(id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete action: ${message}`);
    }
  }

  /**
   * Get action by ID
   */
  static async getActionById(id: string): Promise<BankGuaranteeAction | null> {
    try {
      return actionsStore.get(id) || null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch action: ${message}`);
    }
  }

  /**
   * Get actions by status
   */
  static async getActionsByStatus(status: BankGuaranteeAction['status']): Promise<BankGuaranteeAction[]> {
    try {
      return Array.from(actionsStore.values())
        .filter(a => a.status === status);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch actions by status: ${message}`);
    }
  }

  /**
   * Get actions assigned to user
   */
  static async getActionsByAssignee(userId: string): Promise<BankGuaranteeAction[]> {
    try {
      return Array.from(actionsStore.values())
        .filter(a => a.assigned_to === userId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch assigned actions: ${message}`);
    }
  }

  /**
   * Complete an action
   */
  static async completeAction(id: string, notes?: string): Promise<BankGuaranteeAction> {
    try {
      const existing = actionsStore.get(id);
      if (!existing) throw new Error('Action not found');
      
      const updated: BankGuaranteeAction = {
        ...existing,
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes || existing.notes,
        updated_at: new Date().toISOString()
      };
      actionsStore.set(id, updated);
      return updated;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to complete action: ${message}`);
    }
  }

  /**
   * Cancel an action
   */
  static async cancelAction(id: string, reason?: string): Promise<BankGuaranteeAction> {
    try {
      const existing = actionsStore.get(id);
      if (!existing) throw new Error('Action not found');
      
      const updated: BankGuaranteeAction = {
        ...existing,
        status: 'cancelled',
        notes: reason || existing.notes,
        updated_at: new Date().toISOString()
      };
      actionsStore.set(id, updated);
      return updated;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to cancel action: ${message}`);
    }
  }

  /**
   * Create action from template
   */
  static async createFromTemplate(
    templateId: string, 
    guaranteeId: string, 
    createdBy: string,
    assignedTo?: string
  ): Promise<BankGuaranteeAction> {
    try {
      const template = templatesStore.get(templateId);
      if (!template) throw new Error('Template not found');
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + template.default_due_days);
      
      return this.createBankGuaranteeAction({
        guarantee_id: guaranteeId,
        action_type: template.action_type,
        title: template.title_template,
        description: template.description_template,
        status: 'pending',
        priority: template.priority,
        assigned_to: assignedTo,
        created_by: createdBy,
        due_date: dueDate.toISOString(),
        documents: []
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create action from template: ${message}`);
    }
  }

  /**
   * Get action statistics for a guarantee
   */
  static async getGuaranteeActionStats(guaranteeId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
    by_type: Record<string, number>;
    by_priority: Record<string, number>;
  }> {
    try {
      const actions = await this.getActionsByGuaranteeId(guaranteeId);
      const now = new Date();
      
      return {
        total: actions.length,
        pending: actions.filter(a => a.status === 'pending').length,
        in_progress: actions.filter(a => a.status === 'in_progress').length,
        completed: actions.filter(a => a.status === 'completed').length,
        overdue: actions.filter(a => 
          a.status !== 'completed' && 
          a.due_date && 
          new Date(a.due_date) < now
        ).length,
        by_type: actions.reduce((acc, a) => {
          acc[a.action_type] = (acc[a.action_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_priority: actions.reduce((acc, a) => {
          acc[a.priority] = (acc[a.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get action stats: ${message}`);
    }
  }

  /**
   * Get all templates
   */
  static async getTemplates(): Promise<BankGuaranteeActionTemplate[]> {
    try {
      return Array.from(templatesStore.values())
        .filter(t => t.is_active);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch templates: ${message}`);
    }
  }
}
