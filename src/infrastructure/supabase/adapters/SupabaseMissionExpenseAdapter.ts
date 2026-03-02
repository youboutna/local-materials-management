/**
 * Mission Expense Supabase Adapter
 * Implements IMissionExpenseRepository for Supabase database operations
 */

import { supabase } from '@/integrations/supabase/client';
import { IMissionExpenseRepository } from '@/domain/repositories/IMissionExpenseRepository';
import { MissionExpense, MissionExpenseStatus, MissionExpenseCategory } from '@/domain/entities/MissionExpense';

export class SupabaseMissionExpenseAdapter implements IMissionExpenseRepository {
  private readonly tableName = 'mission_expenses';

  /**
   * Create mission expense
   */
  async create(expense: Omit<MissionExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<MissionExpense> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          id: crypto.randomUUID(),
          mission_id: expense.missionId,
          recorded_by: expense.recordedBy,
          recorded_at: expense.recordedAt || now,
          updated_at: now,
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          receipt_url: expense.receiptUrl,
          receipt_number: expense.receiptNumber,
          status: expense.status,
          approved_at: expense.approvedAt,
          approved_by: expense.approvedBy,
          currency: expense.currency,
          exchange_rate: expense.exchangeRate,
          original_amount: expense.originalAmount,
          original_currency: expense.originalCurrency,
          notes: expense.notes,
          tags: expense.tags,
          location: expense.location,
          project_phase: expense.projectPhase
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create mission expense: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from mission expense creation');
      }

      return {
        id: data.id,
        missionId: data.mission_id,
        recordedBy: data.recorded_by,
        recordedAt: data.recorded_at,
        updatedAt: data.updated_at,
        amount: data.amount,
        category: data.category,
        description: data.description,
        receiptUrl: data.receipt_url,
        receiptNumber: data.receipt_number,
        status: data.status,
        approvedAt: data.approved_at,
        approvedBy: data.approved_by,
        currency: data.currency,
        exchangeRate: data.exchange_rate,
        originalAmount: data.original_amount,
        originalCurrency: data.original_currency,
        notes: data.notes,
        tags: data.tags,
        location: data.location,
        projectPhase: data.project_phase
      };
    } catch (error) {
      console.error('Error creating mission expense:', error);
      throw error;
    }
  }

  /**
   * Get mission expense by ID
   */
  async findById(id: string): Promise<MissionExpense | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to find mission expense: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        missionId: data.mission_id,
        recordedBy: data.recorded_by,
        recordedAt: data.recorded_at,
        updatedAt: data.updated_at,
        amount: data.amount,
        category: data.category,
        description: data.description,
        receiptUrl: data.receipt_url,
        receiptNumber: data.receipt_number,
        status: data.status,
        approvedAt: data.approved_at,
        approvedBy: data.approved_by,
        currency: data.currency,
        exchangeRate: data.exchange_rate,
        originalAmount: data.original_amount,
        originalCurrency: data.original_currency,
        notes: data.notes,
        tags: data.tags,
        location: data.location,
        projectPhase: data.project_phase
      };
    } catch (error) {
      console.error('Error finding mission expense:', error);
      throw error;
    }
  }

  /**
   * Get all mission expenses
   */
  async findAll(): Promise<MissionExpense[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('recorded_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch mission expenses: ${error.message}`);
      }

      return data?.map(expense => ({
        id: expense.id,
        missionId: expense.mission_id,
        recordedBy: expense.recorded_by,
        recordedAt: expense.recorded_at,
        updatedAt: expense.updated_at,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        receiptUrl: expense.receipt_url,
        receiptNumber: expense.receipt_number,
        status: expense.status,
        approvedAt: expense.approved_at,
        approvedBy: expense.approved_by,
        currency: expense.currency,
        exchangeRate: expense.exchange_rate,
        originalAmount: expense.original_amount,
        originalCurrency: expense.original_currency,
        notes: expense.notes,
        tags: expense.tags,
        location: expense.location,
        projectPhase: expense.project_phase
      })) || [];
    } catch (error) {
      console.error('Error fetching mission expenses:', error);
      throw error;
    }
  }

  /**
   * Get mission expenses by mission ID
   */
  async findByMissionId(missionId: string): Promise<MissionExpense[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('mission_id', missionId)
        .order('recorded_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch mission expenses by mission ID: ${error.message}`);
      }

      return data?.map(expense => ({
        id: expense.id,
        missionId: expense.mission_id,
        recordedBy: expense.recorded_by,
        recordedAt: expense.recorded_at,
        updatedAt: expense.updated_at,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        receiptUrl: expense.receipt_url,
        receiptNumber: expense.receipt_number,
        status: expense.status,
        approvedAt: expense.approved_at,
        approvedBy: expense.approved_by,
        currency: expense.currency,
        exchangeRate: expense.exchange_rate,
        originalAmount: expense.original_amount,
        originalCurrency: expense.original_currency,
        notes: expense.notes,
        tags: expense.tags,
        location: expense.location,
        projectPhase: expense.project_phase
      })) || [];
    } catch (error) {
      console.error('Error fetching mission expenses by mission ID:', error);
      throw error;
    }
  }

  /**
   * Get mission expenses by recorded by user
   */
  async findByRecordedBy(recordedBy: string): Promise<MissionExpense[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('recorded_by', recordedBy)
        .order('recorded_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch mission expenses by recorded by: ${error.message}`);
      }

      return data?.map(expense => ({
        id: expense.id,
        missionId: expense.mission_id,
        recordedBy: expense.recorded_by,
        recordedAt: expense.recorded_at,
        updatedAt: expense.updated_at,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        receiptUrl: expense.receipt_url,
        receiptNumber: expense.receipt_number,
        status: expense.status,
        approvedAt: expense.approved_at,
        approvedBy: expense.approved_by,
        currency: expense.currency,
        exchangeRate: expense.exchange_rate,
        originalAmount: expense.original_amount,
        originalCurrency: expense.original_currency,
        notes: expense.notes,
        tags: expense.tags,
        location: expense.location,
        projectPhase: expense.project_phase
      })) || [];
    } catch (error) {
      console.error('Error fetching mission expenses by recorded by:', error);
      throw error;
    }
  }

  /**
   * Get mission expenses by category
   */
  async findByCategory(category: string): Promise<MissionExpense[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('category', category)
        .order('recorded_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch mission expenses by category: ${error.message}`);
      }

      return data?.map(expense => ({
        id: expense.id,
        missionId: expense.mission_id,
        recordedBy: expense.recorded_by,
        recordedAt: expense.recorded_at,
        updatedAt: expense.updated_at,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        receiptUrl: expense.receipt_url,
        receiptNumber: expense.receipt_number,
        status: expense.status,
        approvedAt: expense.approved_at,
        approvedBy: expense.approved_by,
        currency: expense.currency,
        exchangeRate: expense.exchange_rate,
        originalAmount: expense.original_amount,
        originalCurrency: expense.original_currency,
        notes: expense.notes,
        tags: expense.tags,
        location: expense.location,
        projectPhase: expense.project_phase
      })) || [];
    } catch (error) {
      console.error('Error fetching mission expenses by category:', error);
      throw error;
    }
  }

  /**
   * Get mission expenses by date range
   */
  async findByDateRange(startDate: string, endDate: string): Promise<MissionExpense[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .gte('recorded_at', startDate)
        .lte('recorded_at', endDate)
        .order('recorded_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch mission expenses by date range: ${error.message}`);
      }

      return data?.map(expense => ({
        id: expense.id,
        missionId: expense.mission_id,
        recordedBy: expense.recorded_by,
        recordedAt: expense.recorded_at,
        updatedAt: expense.updated_at,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        receiptUrl: expense.receipt_url,
        receiptNumber: expense.receipt_number,
        status: expense.status,
        approvedAt: expense.approved_at,
        approvedBy: expense.approved_by,
        currency: expense.currency,
        exchangeRate: expense.exchange_rate,
        originalAmount: expense.original_amount,
        originalCurrency: expense.original_currency,
        notes: expense.notes,
        tags: expense.tags,
        location: expense.location,
        projectPhase: expense.project_phase
      })) || [];
    } catch (error) {
      console.error('Error fetching mission expenses by date range:', error);
      throw error;
    }
  }

  /**
   * Get mission expenses by status
   */
  async findByStatus(status: string): Promise<MissionExpense[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('status', status)
        .order('recorded_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch mission expenses by status: ${error.message}`);
      }

      return data?.map(expense => ({
        id: expense.id,
        missionId: expense.mission_id,
        recordedBy: expense.recorded_by,
        recordedAt: expense.recorded_at,
        updatedAt: expense.updated_at,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        receiptUrl: expense.receipt_url,
        receiptNumber: expense.receipt_number,
        status: expense.status,
        approvedAt: expense.approved_at,
        approvedBy: expense.approved_by,
        currency: expense.currency,
        exchangeRate: expense.exchange_rate,
        originalAmount: expense.original_amount,
        originalCurrency: expense.original_currency,
        notes: expense.notes,
        tags: expense.tags,
        location: expense.location,
        projectPhase: expense.project_phase
      })) || [];
    } catch (error) {
      console.error('Error fetching mission expenses by status:', error);
      throw error;
    }
  }

  /**
   * Update mission expense
   */
  async update(id: string, data: Partial<MissionExpense>): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          updated_at: new Date().toISOString(),
          ...data
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to update mission expense: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating mission expense:', error);
      throw error;
    }
  }

  /**
   * Delete mission expense
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete mission expense: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting mission expense:', error);
      throw error;
    }
  }

  /**
   * Get total mission expenses by mission ID
   */
  async getTotalByMission(missionId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('amount')
        .eq('mission_id', missionId);

      if (error) {
        throw new Error(`Failed to get total mission expenses: ${error.message}`);
      }

      return data?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
    } catch (error) {
      console.error('Error getting total mission expenses:', error);
      throw error;
    }
  }

  /**
   * Get total mission expenses by category
   */
  async getTotalByCategory(category: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('amount')
        .eq('category', category);

      if (error) {
        throw new Error(`Failed to get total mission expenses by category: ${error.message}`);
      }

      return data?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
    } catch (error) {
      console.error('Error getting total mission expenses by category:', error);
      throw error;
    }
  }

  /**
   * Get mission expenses summary by mission
   */
  async getMissionExpenseSummary(missionId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    count: number;
  }> {
    try {
      const expenses = await this.findByMissionId(missionId);
      
      const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const count = expenses.length;
      
      const byCategory = expenses.reduce((acc, expense) => {
        const category = expense.category || 'other';
        acc[category] = (acc[category] || 0) + (expense.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      return { total, byCategory, count };
    } catch (error) {
      console.error('Error getting mission expense summary:', error);
      throw error;
    }
  }
}
