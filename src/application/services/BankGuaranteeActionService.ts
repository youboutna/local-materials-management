import { supabase } from '@/integrations/supabase/client';

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

export class BankGuaranteeActionService {
  
  /**
   * Create a new bank guarantee action
   * @param actionData The action data
   * @returns The created action
   */
  static async createBankGuaranteeAction(actionData: Omit<BankGuaranteeAction, 'id' | 'created_at' | 'updated_at'>): Promise<BankGuaranteeAction> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantee_actions')
        .insert({
          ...actionData,
          status: actionData.status || 'pending',
          documents: actionData.documents || []
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating bank guarantee action:', error);
      throw new Error(`Failed to create bank guarantee action: ${error.message}`);
    }
  }

  /**
   * Get all actions for a bank guarantee
   * @param guaranteeId The guarantee ID
   * @returns Array of actions
   */
  static async getBankGuaranteeActions(guaranteeId: string): Promise<BankGuaranteeAction[]> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantee_actions')
        .select('*')
        .eq('guarantee_id', guaranteeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching bank guarantee actions:', error);
      throw new Error(`Failed to fetch bank guarantee actions: ${error.message}`);
    }
  }

  /**
   * Update a bank guarantee action
   * @param actionId The action ID
   * @param updates The updates to apply
   * @returns The updated action
   */
  static async updateBankGuaranteeAction(actionId: string, updates: Partial<BankGuaranteeAction>): Promise<BankGuaranteeAction> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantee_actions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating bank guarantee action:', error);
      throw new Error(`Failed to update bank guarantee action: ${error.message}`);
    }
  }

  /**
   * Delete a bank guarantee action
   * @param actionId The action ID
   */
  static async deleteBankGuaranteeAction(actionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bank_guarantee_actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting bank guarantee action:', error);
      throw new Error(`Failed to delete bank guarantee action: ${error.message}`);
    }
  }

  /**
   * Get action by ID
   * @param actionId The action ID
   * @returns The action or null
   */
  static async getActionById(actionId: string): Promise<BankGuaranteeAction | null> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantee_actions')
        .select('*')
        .eq('id', actionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching action:', error);
      throw new Error(`Failed to fetch action: ${error.message}`);
    }
  }

  /**
   * Get pending actions for a user
   * @param userId The user ID
   * @returns Array of pending actions
   */
  static async getPendingActionsForUser(userId: string): Promise<BankGuaranteeAction[]> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantee_actions')
        .select('*')
        .eq('assigned_to', userId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching pending actions for user:', error);
      throw new Error(`Failed to fetch pending actions for user: ${error.message}`);
    }
  }

  /**
   * Get overdue actions
   * @returns Array of overdue actions
   */
  static async getOverdueActions(): Promise<BankGuaranteeAction[]> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantee_actions')
        .select('*')
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching overdue actions:', error);
      throw new Error(`Failed to fetch overdue actions: ${error.message}`);
    }
  }

  /**
   * Complete a bank guarantee action
   * @param actionId The action ID
   * @param notes Completion notes
   * @returns The updated action
   */
  static async completeAction(actionId: string, notes?: string): Promise<BankGuaranteeAction> {
    try {
      return await this.updateBankGuaranteeAction(actionId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes
      });
    } catch (error) {
      console.error('Error completing action:', error);
      throw new Error(`Failed to complete action: ${error.message}`);
    }
  }

  /**
   * Cancel a bank guarantee action
   * @param actionId The action ID
   * @param reason Cancellation reason
   * @returns The updated action
   */
  static async cancelAction(actionId: string, reason?: string): Promise<BankGuaranteeAction> {
    try {
      return await this.updateBankGuaranteeAction(actionId, {
        status: 'cancelled',
        notes: reason
      });
    } catch (error) {
      console.error('Error cancelling action:', error);
      throw new Error(`Failed to cancel action: ${error.message}`);
    }
  }

  /**
   * Create action from template
   * @param guaranteeId The guarantee ID
   * @param templateId The template ID
   * @param variables Variables to substitute in templates
   * @param createdBy User creating the action
   * @param assignedTo User assigned to the action
   * @returns The created action
   */
  static async createFromTemplate(
    guaranteeId: string,
    templateId: string,
    variables: Record<string, any>,
    createdBy: string,
    assignedTo?: string
  ): Promise<BankGuaranteeAction> {
    try {
      // Get the template
      const { data: template, error: templateError } = await supabase
        .from('bank_guarantee_action_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        throw new Error('Template not found or inactive');
      }

      // Substitute variables in templates
      const title = this.substituteVariables(template.title_template, variables);
      const description = this.substituteVariables(template.description_template, variables);

      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + template.default_due_days);

      // Create action
      return await this.createBankGuaranteeAction({
        guarantee_id: guaranteeId,
        action_type: template.action_type,
        title,
        description,
        priority: template.priority,
        assigned_to: assignedTo,
        created_by: createdBy,
        due_date: dueDate.toISOString(),
        documents: template.required_documents || []
      });
    } catch (error) {
      console.error('Error creating action from template:', error);
      throw new Error(`Failed to create action from template: ${error.message}`);
    }
  }

  /**
   * Get action statistics
   * @returns Statistics object
   */
  static async getActionStats(): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    failed: number;
    overdue: number;
    by_type: Record<BankGuaranteeAction['action_type'], number>;
    by_priority: Record<BankGuaranteeAction['priority'], number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantee_actions')
        .select('action_type, priority, status, due_date');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        overdue: 0,
        by_type: {
          notification: 0,
          claim: 0,
          renewal: 0,
          cancellation: 0,
          extension: 0,
          modification: 0
        },
        by_priority: {
          low: 0,
          medium: 0,
          high: 0,
          urgent: 0
        }
      };

      if (data) {
        const now = new Date();
        
        for (const action of data) {
          // Count by status
          switch (action.status) {
            case 'pending':
              stats.pending++;
              break;
            case 'in_progress':
              stats.in_progress++;
              break;
            case 'completed':
              stats.completed++;
              break;
            case 'cancelled':
              stats.cancelled++;
              break;
            case 'failed':
              stats.failed++;
              break;
          }

          // Count overdue pending actions
          if (action.status === 'pending' && action.due_date && new Date(action.due_date) < now) {
            stats.overdue++;
          }

          // Count by type
          stats.by_type[action.action_type]++;

          // Count by priority
          stats.by_priority[action.priority]++;
        }
      }

      return stats;
    } catch (error) {
      console.error('Error fetching action stats:', error);
      throw new Error(`Failed to fetch action stats: ${error.message}`);
    }
  }

  /**
   * Get action templates
   * @returns Array of action templates
   */
  static async getActionTemplates(): Promise<BankGuaranteeActionTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('bank_guarantee_action_templates')
        .select('*')
        .eq('is_active', true)
        .order('action_type', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching action templates:', error);
      throw new Error(`Failed to fetch action templates: ${error.message}`);
    }
  }

  /**
   * Substitute variables in a template string
   * @param template The template string
   * @param variables The variables object
   * @returns The substituted string
   */
  private static substituteVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Assign action to user
   * @param actionId The action ID
   * @param userId The user ID
   * @returns The updated action
   */
  static async assignAction(actionId: string, userId: string): Promise<BankGuaranteeAction> {
    try {
      return await this.updateBankGuaranteeAction(actionId, {
        assigned_to: userId
      });
    } catch (error) {
      console.error('Error assigning action:', error);
      throw new Error(`Failed to assign action: ${error.message}`);
    }
  }

  /**
   * Add document to action
   * @param actionId The action ID
   * @param documentId The document ID
   * @returns The updated action
   */
  static async addDocument(actionId: string, documentId: string): Promise<BankGuaranteeAction> {
    try {
      const action = await this.getActionById(actionId);
      if (!action) {
        throw new Error('Action not found');
      }

      const updatedDocuments = [...(action.documents || []), documentId];
      
      return await this.updateBankGuaranteeAction(actionId, {
        documents: updatedDocuments
      });
    } catch (error) {
      console.error('Error adding document to action:', error);
      throw new Error(`Failed to add document to action: ${error.message}`);
    }
  }
}
