/**
 * Risk Type Definitions - Separate file to avoid cache issues
 * Final solution for RiskStatus, RiskLevel, RiskCategory exports
 */

export type RiskStatus = 'identified' | 'monitored' | 'mitigated' | 'resolved';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskCategory = 'technical' | 'financial' | 'operational' | 'strategic' | 'compliance' | 'safety';
