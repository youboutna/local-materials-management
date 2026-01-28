/**
 * Advanced Tender Estimate Transformer - Sophisticated Entity-DTO Conversion
 * Following hexagonal architecture with comprehensive business logic
 */

import { TenderEstimate } from '@/domain/entities/TenderEstimate';
import {
  TenderEstimateDTO,
  TenderEstimateItemDTO,
  TenderEstimateRiskDTO,
  TenderEstimateMetricsDTO,
  TenderEstimateStatsDTO,
  TenderEstimateComparisonDTO,
  TenderEstimateValidationDTO,
  TenderEstimateAnalyticsDTO,
  CategoryBreakdownDTO,
  PriceDistributionDTO,
  RiskFactorDTO,
  PaginationDTO,
  TenderEstimateListResponseDTO,
  TenderEstimateDetailResponseDTO,
  TenderEstimateOperationResponseDTO
} from '@/dtos/entities/AdvancedTenderEstimateDTO';

export class AdvancedTenderEstimateTransformer {
  // ============= Core Transformations =============

  /**
   * Transform Domain Entity to Comprehensive DTO
   */
  static toTenderEstimateDTO(entity: TenderEstimate): TenderEstimateDTO {
    const plainObject = entity.toPlainObject();
    
    return {
      // Core fields
      id: plainObject.id,
      tender_id: plainObject.tenderId,
      submitted_by: plainObject.submittedBy,
      submission_date: plainObject.submissionDate,
      status: plainObject.status,
      total_amount: plainObject.totalAmount,
      currency: plainObject.currency,
      validity_period: plainObject.validityPeriod,
      notes: plainObject.notes,
      created_at: plainObject.createdAt,
      updated_at: plainObject.updatedAt,

      // Computed fields
      display_name: plainObject.displayName,
      formatted_total_amount: plainObject.formattedTotalAmount,
      expiry_date: plainObject.expiryDate,
      is_expired: plainObject.isExpired,
      days_until_expiry: plainObject.daysUntilExpiry,
      can_be_edited: plainObject.canBeEdited,
      can_be_submitted: plainObject.canBeSubmitted,
      can_be_reviewed: plainObject.canBeReviewed,
      can_be_accepted: plainObject.canBeAccepted,
      can_be_rejected: plainObject.canBeRejected,
      is_finalized: plainObject.isFinalized,

      // Business metrics
      risk_assessment: this.transformRiskAssessment(plainObject.riskAssessment),
      metrics: this.transformMetrics(plainObject.metrics)
    };
  }

  /**
   * Transform TenderEstimateItem to DTO
   */
  static toTenderEstimateItemDTO(item: any, estimateId: string): TenderEstimateItemDTO {
    return {
      id: item.id,
      estimate_id: estimateId,
      item_code: item.itemCode,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      category: item.category,
      specifications: item.specifications,
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: item.updatedAt || new Date().toISOString(),

      // Computed fields
      formatted_unit_price: this.formatCurrency(item.unitPrice, 'MRU'),
      formatted_total_price: this.formatCurrency(item.totalPrice, 'MRU'),
      price_per_unit_ratio: item.unit > 0 ? item.unitPrice / item.quantity : 0
    };
  }

  /**
   * Transform array of entities to DTOs
   */
  static toTenderEstimateDTOs(entities: TenderEstimate[]): TenderEstimateDTO[] {
    return entities.map(entity => this.toTenderEstimateDTO(entity));
  }

  /**
   * Transform array of items to DTOs
   */
  static toTenderEstimateItemDTOs(items: any[], estimateId: string): TenderEstimateItemDTO[] {
    return items.map(item => this.toTenderEstimateItemDTO(item, estimateId));
  }

  // ============= Business Logic Transformations =============

  /**
   * Transform risk assessment to DTO
   */
  static transformRiskAssessment(risk: any): TenderEstimateRiskDTO {
    return {
      level: risk.level,
      score: risk.score,
      factors: risk.factors.map((factor: string) => ({
        type: this.inferRiskFactorType(factor),
        severity: this.inferRiskSeverity(factor, risk.score),
        description: factor,
        impact_score: this.calculateImpactScore(factor, risk.score),
        mitigation_suggestion: this.generateMitigationSuggestion(factor)
      })),
      assessment_date: new Date().toISOString(),
      recommended_actions: this.generateRecommendedActions(risk.level, risk.factors)
    };
  }

  /**
   * Transform metrics to DTO
   */
  static transformMetrics(metrics: any): TenderEstimateMetricsDTO {
    return {
      total_items: metrics.totalItems,
      total_amount: metrics.totalAmount,
      average_item_price: metrics.averageItemPrice,
      median_item_price: this.calculateMedianPrice(metrics),
      most_expensive_item: metrics.mostExpensiveItem ? 
        this.toTenderEstimateItemDTO(metrics.mostExpensiveItem, 'temp') : undefined,
      cheapest_item: metrics.cheapestItem ? 
        this.toTenderEstimateItemDTO(metrics.cheapestItem, 'temp') : undefined,
      category_breakdown: this.transformCategoryBreakdown(metrics.categoryBreakdown),
      price_distribution: this.calculatePriceDistribution(metrics),
      complexity_score: this.calculateComplexityScore(metrics)
    };
  }

  /**
   * Transform category breakdown to DTO
   */
  static transformCategoryBreakdown(breakdown: Record<string, number>): CategoryBreakdownDTO[] {
    const total = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      total_amount: amount,
      item_count: this.estimateItemCountInCategory(category),
      percentage_of_total: total > 0 ? (amount / total) * 100 : 0,
      average_item_price: this.calculateAveragePriceForCategory(category, amount)
    }));
  }

  /**
   * Calculate price distribution
   */
  static calculatePriceDistribution(metrics: any): PriceDistributionDTO {
    const items = metrics.items || [];
    const prices = items.map((item: any) => item.totalPrice).sort((a: number, b: number) => a - b);
    
    if (prices.length === 0) {
      return {
        ranges: [],
        standard_deviation: 0,
        variance: 0
      };
    }

    const ranges = this.createPriceRanges(prices);
    const mean = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum: number, price: number) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const standard_deviation = Math.sqrt(variance);

    return {
      ranges,
      standard_deviation,
      variance
    };
  }

  // ============= Response Transformations =============

  /**
   * Transform to list response with pagination
   */
  static toTenderEstimateListResponse(
    entities: TenderEstimate[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    filters: any,
    sort: any
  ): TenderEstimateListResponseDTO {
    return {
      estimates: this.toTenderEstimateDTOs(entities),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        total_pages: Math.ceil(pagination.total / pagination.limit),
        has_next: pagination.page * pagination.limit < pagination.total,
        has_previous: pagination.page > 1
      },
      filters_applied: filters,
      sort_options: {
        field: sort.field,
        direction: sort.direction
      }
    };
  }

  /**
   * Transform to detailed response
   */
  static toTenderEstimateDetailResponse(
    entity: TenderEstimate,
    items: any[],
    workflow: any,
    validation: any,
    analytics?: any
  ): TenderEstimateDetailResponseDTO {
    return {
      estimate: this.toTenderEstimateDTO(entity),
      items: this.toTenderEstimateItemDTOs(items, entity.id),
      workflow: workflow,
      validation: validation,
      analytics: analytics
    };
  }

  /**
   * Transform to operation response
   */
  static toOperationResponse(
    success: boolean,
    message: string,
    data?: any,
    errors?: string[],
    warnings?: string[],
    metadata?: any
  ): TenderEstimateOperationResponseDTO {
    return {
      success,
      message,
      data,
      errors,
      warnings,
      metadata: metadata ? {
        operation_id: metadata.operationId || this.generateOperationId(),
        processing_time: metadata.processingTime || 0,
        affected_records: metadata.affectedRecords || 0
      } : undefined
    };
  }

  /**
   * Transform statistics to DTO
   */
  static toTenderEstimateStatsDTO(stats: {
    estimates: TenderEstimate[];
    period: { start: string; end: string };
  }): TenderEstimateStatsDTO {
    const estimates = stats.estimates;
    const amounts = estimates.map(e => e.totalAmount).sort((a, b) => a - b);
    
    return {
      total_estimates: estimates.length,
      estimates_by_status: this.calculateStatusBreakdown(estimates),
      total_value: amounts.reduce((sum, amount) => sum + amount, 0),
      average_amount: amounts.length > 0 ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length : 0,
      median_amount: this.calculateMedian(amounts),
      highest_amount: amounts.length > 0 ? amounts[amounts.length - 1] : 0,
      lowest_amount: amounts.length > 0 ? amounts[0] : 0,
      estimates_by_currency: this.calculateCurrencyBreakdown(estimates),
      estimates_by_risk_level: this.calculateRiskLevelBreakdown(estimates),
      expired_estimates: estimates.filter(e => e.isExpired).length,
      expiring_soon_estimates: estimates.filter(e => e.daysUntilExpiry <= 7 && e.daysUntilExpiry >= 0).length,
      submission_trend: this.calculateSubmissionTrend(estimates, stats.period)
    };
  }

  /**
   * Transform comparison to DTO
   */
  static toTenderEstimateComparisonDTO(
    estimate1: TenderEstimate,
    estimate2: TenderEstimate,
    itemComparisons: any[]
  ): TenderEstimateComparisonDTO {
    const dto1 = this.toTenderEstimateDTO(estimate1);
    const dto2 = this.toTenderEstimateDTO(estimate2);

    return {
      estimate_1: dto1,
      estimate_2: dto2,
      comparison_metrics: {
        price_difference: dto2.total_amount - dto1.total_amount,
        price_difference_percentage: dto1.total_amount > 0 ? 
          ((dto2.total_amount - dto1.total_amount) / dto1.total_amount) * 100 : 0,
        item_count_difference: dto2.metrics.total_items - dto1.metrics.total_items,
        risk_level_difference: this.calculateRiskLevelDifference(dto1.risk_assessment.level, dto2.risk_assessment.level),
        validity_period_difference: dto2.validity_period - dto1.validity_period
      },
      item_comparisons: itemComparisons,
      recommendation: this.generateComparisonRecommendation(dto1, dto2)
    };
  }

  // ============= Utility Methods =============

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-MR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Generate operation ID
   */
  static generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============= Private Helper Methods =============

  private static inferRiskFactorType(factor: string): 'amount' | 'validity_period' | 'item_count' | 'expiry' | 'currency' | 'market' {
    if (factor.toLowerCase().includes('amount') || factor.toLowerCase().includes('value')) return 'amount';
    if (factor.toLowerCase().includes('validity') || factor.toLowerCase().includes('period')) return 'validity_period';
    if (factor.toLowerCase().includes('item') || factor.toLowerCase().includes('count')) return 'item_count';
    if (factor.toLowerCase().includes('expir')) return 'expiry';
    if (factor.toLowerCase().includes('currenc')) return 'currency';
    return 'market';
  }

  private static inferRiskSeverity(factor: string, score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private static calculateImpactScore(factor: string, totalScore: number): number {
    // Simple heuristic - distribute total score among factors
    return Math.round(totalScore / 5); // Assuming average 5 factors
  }

  private static generateMitigationSuggestion(factor: string): string {
    const suggestions: Record<string, string> = {
      'High value amount': 'Consider分期付款 or additional guarantees',
      'Extended validity period': 'Review market conditions and adjust pricing',
      'High number of items': 'Group similar items and review necessity',
      'Expired estimate': 'Update pricing and resubmit if still relevant',
      'Expiring soon': 'Expedite review process or extend validity'
    };

    return suggestions[factor] || 'Review and assess impact on project timeline';
  }

  private static generateRecommendedActions(level: string, factors: string[]): string[] {
    const actions: string[] = [];

    if (level === 'critical') {
      actions.push('Immediate management review required');
      actions.push('Consider alternative suppliers');
    }

    if (level === 'high') {
      actions.push('Detailed risk assessment needed');
      actions.push('Additional approval layers');
    }

    if (factors.some(f => f.includes('expir'))) {
      actions.push('Update validity period');
    }

    if (factors.some(f => f.includes('amount'))) {
      actions.push('Verify cost breakdown');
    }

    return actions;
  }

  private static calculateMedianPrice(metrics: any): number {
    const items = metrics.items || [];
    if (items.length === 0) return 0;
    
    const prices = items.map((item: any) => item.totalPrice).sort((a: number, b: number) => a - b);
    const mid = Math.floor(prices.length / 2);
    
    return prices.length % 2 === 0 ? 
      (prices[mid - 1] + prices[mid]) / 2 : 
      prices[mid];
  }

  private static estimateItemCountInCategory(category: string): number {
    // This would typically come from the actual data
    return Math.floor(Math.random() * 10) + 1;
  }

  private static calculateAveragePriceForCategory(category: string, totalAmount: number): number {
    const itemCount = this.estimateItemCountInCategory(category);
    return itemCount > 0 ? totalAmount / itemCount : 0;
  }

  private static createPriceRanges(prices: number[]): Array<{
    min_price: number;
    max_price: number;
    item_count: number;
    percentage: number;
  }> {
    if (prices.length === 0) return [];

    const min = prices[0];
    const max = prices[prices.length - 1];
    const range = max - min;
    const bucketCount = 5;
    const bucketSize = range / bucketCount;

    const ranges = [];
    for (let i = 0; i < bucketCount; i++) {
      const minPrice = min + (i * bucketSize);
      const maxPrice = min + ((i + 1) * bucketSize);
      const itemsInRange = prices.filter(p => p >= minPrice && (i === bucketCount - 1 ? p <= maxPrice : p < maxPrice));
      
      ranges.push({
        min_price: minPrice,
        max_price: maxPrice,
        item_count: itemsInRange.length,
        percentage: (itemsInRange.length / prices.length) * 100
      });
    }

    return ranges;
  }

  private static calculateComplexityScore(metrics: any): number {
    let score = 0;
    
    // Base score for item count
    score += Math.min(metrics.totalItems * 2, 20);
    
    // Category diversity
    const categoryCount = Object.keys(metrics.categoryBreakdown || {}).length;
    score += Math.min(categoryCount * 5, 15);
    
    // Price variance
    const priceVariance = this.calculatePriceVariance(metrics.items || []);
    score += Math.min(priceVariance * 10, 15);
    
    return Math.min(score, 100);
  }

  private static calculatePriceVariance(items: any[]): number {
    if (items.length === 0) return 0;
    
    const prices = items.map((item: any) => item.totalPrice);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    
    return variance / (mean * mean); // Normalized variance
  }

  private static calculateStatusBreakdown(estimates: TenderEstimate[]): Record<string, number> {
    const breakdown: Record<string, number> = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      accepted: 0,
      rejected: 0
    };

    estimates.forEach(estimate => {
      breakdown[estimate.status] = (breakdown[estimate.status] || 0) + 1;
    });

    return breakdown;
  }

  private static calculateCurrencyBreakdown(estimates: TenderEstimate[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    estimates.forEach(estimate => {
      breakdown[estimate.currency] = (breakdown[estimate.currency] || 0) + 1;
    });

    return breakdown;
  }

  private static calculateRiskLevelBreakdown(estimates: TenderEstimate[]): Record<string, number> {
    const breakdown: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    estimates.forEach(estimate => {
      const risk = estimate.riskAssessment;
      breakdown[risk.level] = (breakdown[risk.level] || 0) + 1;
    });

    return breakdown;
  }

  private static calculateSubmissionTrend(estimates: TenderEstimate[], period: { start: string; end: string }): Array<{
    date: string;
    count: number;
    total_value: number;
  }> {
    // Group by date
    const grouped: Record<string, { count: number; totalValue: number }> = {};
    
    estimates.forEach(estimate => {
      const date = estimate.submissionDate.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { count: 0, totalValue: 0 };
      }
      grouped[date].count += 1;
      grouped[date].totalValue += estimate.totalAmount;
    });

    // Convert to array and sort
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        count: data.count,
        total_value: data.totalValue
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private static calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 ? 
      (sorted[mid - 1] + sorted[mid]) / 2 : 
      sorted[mid];
  }

  private static calculateRiskLevelDifference(level1: string, level2: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return (levels[level2 as keyof typeof levels] || 0) - (levels[level1 as keyof typeof levels] || 0);
  }

  private static generateComparisonRecommendation(dto1: TenderEstimateDTO, dto2: TenderEstimateDTO): string {
    if (dto2.total_amount < dto1.total_amount && dto2.risk_assessment.score <= dto1.risk_assessment.score) {
      return 'Estimate 2 offers better value with lower risk';
    } else if (dto1.total_amount < dto2.total_amount && dto1.risk_assessment.score <= dto2.risk_assessment.score) {
      return 'Estimate 1 offers better value with lower risk';
    } else {
      return 'Consider negotiating terms or seeking additional estimates';
    }
  }
}
