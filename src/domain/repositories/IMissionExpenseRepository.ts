/**
 * Mission Expense Repository Interface
 * Defines contract for mission expense data operations
 */

import { MissionExpense } from '@/domain/entities/MissionExpense';

export interface IMissionExpenseRepository {
  /**
   * Create mission expense
   */
  create(expense: Omit<MissionExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<MissionExpense>;

  /**
   * Get mission expense by ID
   */
  findById(id: string): Promise<MissionExpense | null>;

  /**
   * Get all mission expenses
   */
  findAll(): Promise<MissionExpense[]>;

  /**
   * Get mission expenses by mission ID
   */
  findByMissionId(missionId: string): Promise<MissionExpense[]>;

  /**
   * Get mission expenses by recorded by user
   */
  findByRecordedBy(recordedBy: string): Promise<MissionExpense[]>;

  /**
   * Get mission expenses by category
   */
  findByCategory(category: string): Promise<MissionExpense[]>;

  /**
   * Get mission expenses by date range
   */
  findByDateRange(startDate: string, endDate: string): Promise<MissionExpense[]>;

  /**
   * Get mission expenses by status
   */
  findByStatus(status: string): Promise<MissionExpense[]>;

  /**
   * Update mission expense
   */
  update(id: string, data: Partial<MissionExpense>): Promise<void>;

  /**
   * Delete mission expense
   */
  delete(id: string): Promise<void>;

  /**
   * Get total mission expenses by mission ID
   */
  getTotalByMission(missionId: string): Promise<number>;

  /**
   * Get total mission expenses by category
   */
  getTotalByCategory(category: string): Promise<number>;

  /**
   * Get mission expenses summary by mission
   */
  getMissionExpenseSummary(missionId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    count: number;
  }>;
}
