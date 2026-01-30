/**
 * Risk Types - Exports des types Risk pour éviter les problèmes de module
 * Solution de contournement pour l'export RiskStatus
 * Cache invalidation fix - v2
 */

export type RiskStatus = 'identified' | 'monitored' | 'mitigated' | 'resolved';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskCategory = 'technical' | 'financial' | 'operational' | 'strategic' | 'compliance' | 'safety';
