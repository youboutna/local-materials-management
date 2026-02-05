/**
 * Budget Calculation Service - Hexagonal Architecture
 * Business logic for budget calculations and cost warnings
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IPaymentRepository } from '@/domain/repositories/IPaymentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { BudgetCalculationDto, BudgetWarningDto } from '@/dtos/transforms/budgetTransform';

interface BudgetCalculationParams {
  baseAmount: number;
  adjustments: {
    labor: number;
    materials: number;
    overhead: number;
  };
}

interface CostProjectionDto {
  period: 'monthly' | 'quarterly' | 'yearly';
  projectedCosts: Array<{
    period: string;
    projectedCost: number;
    actualCost?: number;
    variance?: number;
  }>;
  totalProjectedCost: number;
  confidence: number;
}

interface CashFlowAnalysisDto {
  projectId: string;
  cashInflows: Array<{
    date: string;
    amount: number;
    source: string;
  }>;
  cashOutflows: Array<{
    date: string;
    amount: number;
    category: string;
  }>;
  netCashFlow: number;
  cashFlowStatus: 'positive' | 'negative' | 'breakEven';
  workingCapital: number;
}

export class BudgetCalculationService {
  private projectRepository: IProjectRepository;
  private paymentRepository: IPaymentRepository;

  constructor() {
    this.projectRepository = RepositoryFactory.getProjectRepository();
    this.paymentRepository = RepositoryFactory.getPaymentRepository();
  }

  /**
   * Calculate comprehensive budget analysis for a project
   */
  async calculateBudgetAnalysis(projectId: string): Promise<BudgetCalculationDto> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get project details
      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      // Get all payments for the project
      const payments = await this.paymentRepository.findByProjectId(projectId);
      
      // Calculate current spent amount
      const currentSpent = payments
        .filter(p => p.status === 'paid' || p.status === 'completed')
        .reduce((total, payment) => total + payment.amount, 0);

      const initialBudget = project.budget || 0;
      const remainingBudget = initialBudget - currentSpent;
      const budgetUtilizationPercentage = initialBudget > 0 ? (currentSpent / initialBudget) * 100 : 0;

      // Calculate projected total cost based on current progress
      const progress = project.progress || 0;
      const projectedTotalCost = progress > 0 ? (currentSpent / progress) * 100 : currentSpent;
      
      // Calculate cost variance
      const costVariance = projectedTotalCost - initialBudget;
      const costVariancePercentage = initialBudget > 0 ? (costVariance / initialBudget) * 100 : 0;

      // Determine budget status
      const budgetStatus = this.determineBudgetStatus(budgetUtilizationPercentage, costVariancePercentage);

      // Generate warnings
      const warnings = this.generateBudgetWarnings(
        budgetUtilizationPercentage,
        costVariancePercentage,
        remainingBudget,
        progress
      );

      // Generate recommendations
      const recommendations = this.generateBudgetRecommendations(budgetStatus, warnings, progress);

      return {
        projectId,
        initialBudget,
        currentSpent,
        remainingBudget,
        budgetUtilizationPercentage,
        projectedTotalCost,
        costVariance,
        costVariancePercentage,
        estimatedCompletionCost: projectedTotalCost,
        budgetStatus,
        warnings,
        recommendations
      };
    } catch (error) {
      console.error('BudgetCalculationService.calculateBudgetAnalysis failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate budget analysis');
    }
  }

  /**
   * Generate cost projections for future periods
   */
  async generateCostProjections(
    projectId: string,
    period: 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    periodsAhead: number = 12
  ): Promise<CostProjectionDto> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      const payments = await this.paymentRepository.findByProjectId(projectId);
      const paidPayments = payments.filter(p => p.status === 'paid' || p.status === 'completed');

      // Calculate average monthly spend - convert to PaymentDTO format
      const paymentDTOs = paidPayments.map(p => ({
        id: p.id,
        projectId: (p as any).project?.id || '',
        contractorId: '',
        amount: p.amount,
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod || 'bank_transfer',
        status: p.status,
        progressAtPayment: p.progressAtPayment,
        transactionId: p.transactionId || '',
        contractorName: p.contractorName,
        contractorContact: p.contractorContact,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }));
      const monthlySpend = this.calculateAverageSpend(paymentDTOs as any, period);
      
      // Generate projections
      const projectedCosts: Array<{ period: string; projectedCost: number; actualCost?: number; variance?: number }> = [];
      const now = new Date();
      let totalProjectedCost = 0;

      for (let i = 1; i <= periodsAhead; i++) {
        const projectionDate = this.addPeriods(now, period, i);
        const projectedCost = monthlySpend * this.getPeriodMultiplier(period);
        
        totalProjectedCost += projectedCost;
        
        projectedCosts.push({
          period: projectionDate.toISOString().split('T')[0],
          projectedCost,
          actualCost: undefined,
          variance: undefined
        });
      }

      // Calculate confidence based on data availability and variance
      const confidence = this.calculateProjectionConfidence(paidPayments.length, period);

      return {
        period,
        projectedCosts,
        totalProjectedCost,
        confidence
      };
    } catch (error) {
      console.error('BudgetCalculationService.generateCostProjections failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to generate cost projections');
    }
  }

  /**
   * Analyze cash flow for a project
   */
  async analyzeCashFlow(projectId: string): Promise<CashFlowAnalysisDto> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const project = await this.projectRepository.findById(projectId);
      if (!project) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
      }

      const payments = await this.paymentRepository.findByProjectId(projectId);

      // Categorize cash flows
      const cashInflows = payments
        .filter(p => p.status === 'paid' || p.status === 'completed')
        .map(p => ({
          date: p.paymentDate || p.createdAt || new Date().toISOString(),
          amount: p.amount,
          source: 'payment'
        }));

      const cashOutflows = payments
        .filter(p => p.status === 'requested' || p.status === 'pending')
        .map(p => ({
          date: p.paymentDate || p.createdAt || new Date().toISOString(),
          amount: p.amount,
          category: 'pending_payment'
        }));

      // Calculate net cash flow
      const totalInflows = cashInflows.reduce((sum, flow) => sum + flow.amount, 0);
      const totalOutflows = cashOutflows.reduce((sum, flow) => sum + flow.amount, 0);
      const netCashFlow = totalInflows - totalOutflows;

      // Determine cash flow status
      let cashFlowStatus: 'positive' | 'negative' | 'breakEven';
      if (netCashFlow > 0) cashFlowStatus = 'positive';
      else if (netCashFlow < 0) cashFlowStatus = 'negative';
      else cashFlowStatus = 'breakEven';

      // Calculate working capital (simplified)
      const workingCapital = project.budget - totalOutflows;

      return {
        projectId,
        cashInflows,
        cashOutflows,
        netCashFlow,
        cashFlowStatus,
        workingCapital
      };
    } catch (error) {
      console.error('BudgetCalculationService.analyzeCashFlow failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to analyze cash flow');
    }
  }

  /**
   * Check if cost warning should be triggered
   */
  async checkCostWarning(projectId: string): Promise<{
    shouldWarn: boolean;
    warnings: BudgetWarningDto[];
    criticalAlerts: BudgetWarningDto[];
  }> {
    try {
      const calculation: BudgetCalculationDto = await this.calculateBudgetAnalysis(projectId);
      
      const criticalAlerts = calculation.warnings.filter(w => w.severity === 'critical');
      const shouldWarn = calculation.warnings.length > 0;

      return {
        shouldWarn,
        warnings: calculation.warnings,
        criticalAlerts
      };
    } catch (error) {
      console.error('BudgetCalculationService.checkCostWarning failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to check cost warning');
    }
  }

  calculateFinalBudget(input: BudgetCalculationParams): number {
    const { baseAmount, adjustments } = input;
    const totalAdjustments = adjustments.labor + adjustments.materials + adjustments.overhead;
    return baseAmount + totalAdjustments;
  }

  // ============= Private Helper Methods =============

  private determineBudgetStatus(utilization: number, variance: number): 'healthy' | 'warning' | 'critical' | 'over_budget' {
    if (utilization > 100 || variance > 20) return 'over_budget';
    if (utilization > 85 || variance > 10) return 'critical';
    if (utilization > 70 || variance > 5) return 'warning';
    return 'healthy';
  }

  private generateBudgetWarnings(
    utilization: number,
    variance: number,
    remaining: number,
    progress: number
  ): BudgetWarningDto[] {
    const warnings: BudgetWarningDto[] = [];

    // Budget utilization warnings
    if (utilization > 90) {
      warnings.push({
        type: 'budget_exceeded',
        severity: 'critical',
        message: `Budget utilization at ${utilization.toFixed(1)}% - exceeding limits`,
        currentValue: utilization,
        thresholdValue: 90,
        recommendation: 'Immediate budget review required'
      });
    } else if (utilization > 75) {
      warnings.push({
        type: 'budget_warning',
        severity: 'high',
        message: `Budget utilization at ${utilization.toFixed(1)}% - approaching limit`,
        currentValue: utilization,
        thresholdValue: 75,
        recommendation: 'Monitor spending closely'
      });
    }

    // Cost variance warnings
    if (variance > 15) {
      warnings.push({
        type: 'cost_variance',
        severity: 'critical',
        message: `Cost variance at ${variance.toFixed(1)}% - significant deviation`,
        currentValue: variance,
        thresholdValue: 15,
        recommendation: 'Review cost estimates and project scope'
      });
    } else if (variance > 5) {
      warnings.push({
        type: 'cost_variance',
        severity: 'medium',
        message: `Cost variance at ${variance.toFixed(1)}% - moderate deviation`,
        currentValue: variance,
        thresholdValue: 5,
        recommendation: 'Investigate cost drivers'
      });
    }

    // Cash flow warnings
    if (remaining < 0) {
      warnings.push({
        type: 'cash_flow',
        severity: 'critical',
        message: 'Negative remaining budget - cash flow issue',
        currentValue: remaining,
        thresholdValue: 0,
        recommendation: 'Immediate funding required'
      });
    }

    // Progress vs spend warnings
    if (progress < 50 && utilization > 60) {
      warnings.push({
        type: 'timeline_delay',
        severity: 'high',
        message: 'High spend with low progress - potential timeline issues',
        currentValue: utilization,
        thresholdValue: 60,
        recommendation: 'Review project timeline and progress'
      });
    }

    return warnings;
  }

  private generateBudgetRecommendations(
    status: string,
    warnings: BudgetWarningDto[],
    progress: number
  ): string[] {
    const recommendations: string[] = [];

    if (status === 'over_budget' || status === 'critical') {
      recommendations.push('Conduct immediate budget review');
      recommendations.push('Consider scope reduction or additional funding');
    }

    if (warnings.some(w => w.type === 'cost_variance')) {
      recommendations.push('Review and update cost estimates');
      recommendations.push('Implement stricter cost controls');
    }

    if (warnings.some(w => w.type === 'cash_flow')) {
      recommendations.push('Improve cash flow management');
      recommendations.push('Review payment schedules');
    }

    if (progress < 50) {
      recommendations.push('Focus on project acceleration');
      recommendations.push('Review resource allocation');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring budget performance');
    }

    return recommendations;
  }

  private calculateAverageSpend(payments: PaymentDTO[], period: string): number {
    if (payments.length === 0) return 0;

    const now = new Date();
    const filteredPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      // Filter logic based on period - include all for now
      return paymentDate <= now;
    });

    if (filteredPayments.length === 0) return 0;
    
    const total = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    return total / filteredPayments.length;
  }

  private addPeriods(date: Date, period: string, count: number): Date {
    const result = new Date(date);
    
    switch (period) {
      case 'monthly':
        result.setMonth(result.getMonth() + count);
        break;
      case 'quarterly':
        result.setMonth(result.getMonth() + (count * 3));
        break;
      case 'yearly':
        result.setFullYear(result.getFullYear() + count);
        break;
    }
    
    return result;
  }

  private getPeriodMultiplier(period: string): number {
    switch (period) {
      case 'monthly': return 1;
      case 'quarterly': return 3;
      case 'yearly': return 12;
      default: return 1;
    }
  }

  private calculateProjectionConfidence(dataPoints: number, period: string): number {
    // Base confidence on data availability
    let confidence = Math.min(dataPoints * 10, 80); // Max 80% based on data
    
    // Adjust for period (longer periods have lower confidence)
    if (period === 'yearly') confidence -= 20;
    else if (period === 'quarterly') confidence -= 10;
    
    return Math.max(confidence, 20); // Minimum 20% confidence
  }
}
