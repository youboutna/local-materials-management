import type { WorkbenchView, GeometryKind, InfraRealization } from '@/dtos/entities/ProjectWorkbenchDTO';
export const WORKBENCH_VIEWS: readonly WorkbenchView[] = ['calendar', 'consumption', 'expense', 'revenue', 'plans', 'infrastructure'];
/** Statuts suggérés ; le statut reste libre côté base (référentiel ouvert). */
export const INFRA_ASSET_STATUSES = ['planned', 'in_progress', 'existing', 'completed'] as const;
/** Sémantique projet fermée (contrainte base). */
export const INFRA_REALIZATIONS: readonly InfraRealization[] = ['planned', 'partial', 'completed'];
export const INFRA_GEOMETRY_KINDS: readonly GeometryKind[] = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'Geometry'];
export const WORKBENCH_ROUTE = '/projects/calendar';
