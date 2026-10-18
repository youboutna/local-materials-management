import type { WorkbenchView } from '@/dtos/entities/ProjectWorkbenchDTO';
export const WORKBENCH_VIEWS: readonly WorkbenchView[] = ['calendar', 'consumption', 'expense', 'revenue', 'plans', 'infrastructure'];
export const INFRA_ASSET_TYPES = ['road', 'electricity', 'water', 'building', 'telecom', 'other'] as const;
export const INFRA_ASSET_STATUSES = ['planned', 'in_progress', 'existing', 'completed'] as const;
export const WORKBENCH_ROUTE = '/projects/calendar';