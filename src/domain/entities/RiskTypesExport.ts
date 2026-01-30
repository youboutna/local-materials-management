/**
 * Risk Types Export - Final solution for cache issues
 * Completely different filename to avoid browser cache
 */

export type RiskStatus = 'identified' | 'monitored' | 'mitigated' | 'resolved';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskCategory = 'technical' | 'financial' | 'operational' | 'strategic' | 'compliance' | 'safety';

// Runtime constants for validation
export const RISK_STATUS_VALUES: RiskStatus[] = ['identified', 'monitored', 'mitigated', 'resolved'];
export const RISK_LEVEL_VALUES: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
export const RISK_CATEGORY_VALUES: RiskCategory[] = ['technical', 'financial', 'operational', 'strategic', 'compliance', 'safety'];
