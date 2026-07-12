/**
 * @lovable/boq — public barrel of the composable Bill Of Quantities kernel.
 * Consumers (project quantity takeoffs, tender DQE estimator, DQE import,
 * supplier bid, awarded-tender→project) MUST import from this barrel — never
 * from `@/integrations/supabase/client` directly.
 */

// Domain
export { BoqLine, type BoqLineProps, type BoqSource, type BoqResourceType } from '@/domain/boq/BoqLine';
export { BoqDocument } from '@/domain/boq/BoqDocument';
export type { WbsRef } from '@/domain/boq/WbsRef';

// DTOs / Mapper
export type { BoqLineDTO, BoqLineFilter } from '@/dtos/boq/BoqLineDTO';
export { BoqLineMapper } from '@/dtos/boq/BoqLineMapper';

// Services
export { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
export { BoqValidatorService } from '@/application/services/boq/BoqValidatorService';
export { boqImportOrchestrator, BoqImportOrchestrator, type ImportMapping } from '@/application/services/boq/BoqImportOrchestrator';
export { MaterialPriceResolver } from '@/application/services/boq/MaterialPriceResolver';
export { MeterService } from '@/application/services/boq/MeterService';
export { ResourceService } from '@/application/services/boq/ResourceService';
export { AlignmentService, getAlignmentService, setAlignmentRepository, InMemoryAlignmentRepository } from '@/application/services/boq/AlignmentService';
export { DevisGenerator } from '@/application/services/boq/DevisGenerator';

export { tenderToPlanningService, TenderToPlanningService } from '@/application/services/tender/TenderToPlanningService';

// Infra port
export type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
export { boqRepository } from '@/infrastructure/supabase/adapters/SupabaseBoqRepository';

// Hooks
export { useBoqDocument } from '@/hooks/hexagonal/useBoqDocument';
export { useBoqImport } from '@/hooks/hexagonal/useBoqImport';
export { useTenderToPlanning } from '@/hooks/hexagonal/useTenderToPlanning';

// UI
export { WbsSelector } from '@/components/boq/WbsSelector';
export { PriceSummary } from '@/components/boq/PriceSummary';
export { ImportDropzone } from '@/components/boq/ImportDropzone';
export { ImportMappingWizard } from '@/components/boq/ImportMappingWizard';
export { BoqLineTable } from '@/components/boq/BoqLineTable';
export { BoqComparisonTable } from '@/components/boq/BoqComparisonTable';
export { BoqImportDialog } from '@/components/boq/BoqImportDialog';
export { BoqBudgetDashboard } from '@/components/boq/BoqBudgetDashboard';
export { ResourceSelector, type ResourceOption } from '@/components/boq/ResourceSelector';
export { MappingModal, MAPPING_FIELDS } from '@/components/boq/MappingModal';


// Referentials
export { WBS_REFERENTIAL, getPhase, getMilestone, getTask } from '@/config/referentials/wbs/wbs.referential';
export { BOQ_UNITS, BOQ_UNIT_BY_CODE, isBoqUnit, type BoqUnit } from '@/config/referentials/boq/units.referential';
