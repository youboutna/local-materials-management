/**
 * @lovable/boq — public barrel of the composable Bill Of Quantities kernel.
 * Consumers (project quantity takeoffs, tender DQE estimator, DQE import,
 * supplier bid, awarded-tender→project) MUST import from this barrel — never
 * from `@/integrations/supabase/client` directly.
 */

// Domain
export { BoqDocument } from '@/domain/entities/boq/BoqDocument';
export { BoqLine, type BoqLineProps, type BoqResourceType, type BoqSource } from '@/domain/entities/boq/BoqLine';
export type { WbsRef } from '@/domain/entities/boq/WbsRef';

// DTOs / Mapper
export type { BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';
export { BoqLineMapper } from '@/dtos/boq/BoqLineMapper';

// Services
export { AlignmentService, getAlignmentService, InMemoryAlignmentRepository, setAlignmentRepository } from '@/application/services/boq/AlignmentService';
export { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
export { boqImportOrchestrator, BoqImportOrchestrator, type ImportMapping } from '@/application/services/boq/BoqImportOrchestrator';
export { BoqValidatorService } from '@/application/services/boq/BoqValidatorService';
export { DevisGenerator } from '@/application/services/boq/DevisGenerator';
export { MaterialPriceResolver } from '@/application/services/boq/MaterialPriceResolver';
export { MeterService } from '@/application/services/boq/MeterService';
export { ResourceService } from '@/application/services/boq/ResourceService';

export { tenderToPlanningService, TenderToPlanningService } from '@/application/services/TenderToPlanningService';

// Infra port
export type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
export { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';

// Hooks
export { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
export { useBoqImport } from '@/hooks/hexagonal/useBoqImport';
export { useTenderToPlanning } from '@/hooks/hexagonal/useTenderToPlanning';

// UI
export { BoqContextService, type BoqAction, type BoqContext, type BoqRouteContext } from '@/application/services/boq/BoqContextService';
export { BoqWorkflowService, type BoqStatus, type BoqTransitionAction } from '@/application/services/boq/BoqWorkflowService';
export { DocumentService } from '@/application/services/boq/DocumentService';
export { BoqActionsBar } from '@/components/boq/BoqActionsBar';
export { BoqBudgetDashboard } from '@/components/boq/BoqBudgetDashboard';
export { BoqComparisonTable } from '@/components/boq/BoqComparisonTable';
export { BoqImportDialog } from '@/components/boq/BoqImportDialog';
export { BoqKpiHeader } from '@/components/boq/BoqKpiHeader';
export { BoqLineTable } from '@/components/boq/BoqLineTable';
export { BoqWorkspace, type BoqWorkspaceMode } from '@/components/boq/BoqWorkspace';
export { DqeWorkspace } from '@/components/boq/DqeWorkspace';
export { ImportDropzone } from '@/components/boq/ImportDropzone';
export { ImportMappingWizard } from '@/components/boq/ImportMappingWizard';
export { MAPPING_FIELDS, MappingModal } from '@/components/boq/MappingModal';
export { PriceSummary } from '@/components/boq/PriceSummary';
export { ResourceSelector, type ResourceOption } from '@/components/boq/ResourceSelector';
export { WbsSelector } from '@/components/boq/WbsSelector';


// Referentials
export { BOQ_UNIT_BY_CODE, BOQ_UNITS, isBoqUnit, type BoqUnit } from '@/config/referentials/boq/units.referential';
export { getMilestone, getPhase, getTask, WBS_REFERENTIAL } from '@/config/referentials/wbs/wbs.referential';

