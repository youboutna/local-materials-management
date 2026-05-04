/**
 * Project Legacy DTO Barrel
 * -------------------------
 * Bridge module migrating consumers off `@/types/project` toward `@/dtos`.
 * Re-exports the full legacy domain shape (ProjectData, Alert, EVMData,
 * PERTAnalysis, GanttChartData, ConstructionPhase, ConstructionStage,
 * EscalationRoles, ActionLabels, BankGuaranteeData, ImportResult, etc.)
 * so the rest of the codebase imports exclusively through the DTO layer.
 *
 * Hexagonal note: these types remain structurally identical to the legacy
 * definitions; subsequent lots will gradually replace them with cleaner
 * camelCase DTOs sourced from domain entities.
 */
export * from '@/types/project';
