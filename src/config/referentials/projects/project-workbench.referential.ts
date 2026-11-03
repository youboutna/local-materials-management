import type { WorkbenchView, GeometryKind, InfraRealization } from '@/dtos/entities/ProjectWorkbenchDTO';
export const WORKBENCH_VIEWS: readonly WorkbenchView[] = ['calendar', 'consumption', 'expense', 'revenue', 'plans', 'infrastructure'];
/** Statuts suggérés ; le statut reste libre côté base (référentiel ouvert). */
export const INFRA_ASSET_STATUSES = ['planned', 'in_progress', 'existing', 'completed'] as const;
/** Sémantique projet fermée (contrainte base). */
export const INFRA_REALIZATIONS: readonly InfraRealization[] = ['planned', 'partial', 'completed'];
export const INFRA_GEOMETRY_KINDS: readonly GeometryKind[] = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'Geometry'];
export const WORKBENCH_ROUTE = '/projects/calendar';

// ============= NOUVEAUX CHAMPS GÉNÉRIQUES (Modèle Utility Network) =============

/** Domaines d'infrastructure (référentiel ouvert) */
export const INFRA_DOMAINS = [
  { code: 'electricity', labelFr: 'Électricité', labelAr: 'كهرباء', labelEn: 'Electricity' },
  { code: 'water', labelFr: 'Eau potable', labelAr: 'ماء الشرب', labelEn: 'Drinking Water' },
  { code: 'sanitation', labelFr: 'Assainissement', labelAr: 'صرف صحي', labelEn: 'Sanitation' },
  { code: 'road', labelFr: 'Route', labelAr: 'طريق', labelEn: 'Road' },
  { code: 'gas', labelFr: 'Gaz', labelAr: 'غاز', labelEn: 'Gas' },
  { code: 'telecom', labelFr: 'Télécom', labelAr: 'اتصالات', labelEn: 'Telecom' }
] as const;

/** Groupes d'actifs (référentiel ouvert) */
export const INFRA_ASSET_GROUPS = ['line', 'device', 'assembly', 'structure'] as const;

/** Statuts opérationnels (référentiel ouvert) */
export const INFRA_OPERATIONAL_STATUSES = ['planned', 'in_progress', 'operational', 'maintenance', 'decommissioned'] as const;

/** Cycles de vie (référentiel ouvert) */
export const INFRA_LIFECYCLES = ['active', 'planned', 'retired', 'archived'] as const;

/** Niveaux de tension (référentiel ouvert - électricité) */
export const INFRA_VOLTAGE_TIERS = [1, 2, 3, 4] as const; // 1=BT, 2=MT, 3=HT, 4=THT

/** Méthodes d'installation (référentiel ouvert) */
export const INFRA_INSTALLATION_METHODS = ['overhead', 'underground', 'submarine', 'aerial', 'buried'] as const;
