/**
 * Référentiel : rôles, responsabilités, permissions et routes accessibles.
 * Source unique de vérité pour les contrôles d'accès (niveaux 2 et 3).
 * Aucun rôle ne doit être codé en dur dans les composants UI.
 */

export interface RoleDefinition {
  code: string;
  label_fr: string;
  label_ar: string;
  label_en: string;
  /** Permissions fonctionnelles ; '*' = toutes. */
  permissions: string[];
  /** Préfixes de routes accessibles ; '*' = toutes. */
  routes: string[];
}

export const PENDING_SUPPLIER_ROLE = 'fournisseur_pending';
export const SUPPLIER_ROLE = 'fournisseur';

export const ROLES_RESPONSIBILITIES: RoleDefinition[] = [
  {
    code: 'admin',
    label_fr: 'Administrateur système',
    label_ar: 'مدير النظام',
    label_en: 'System administrator',
    permissions: ['*'],
    routes: ['*'],
  },
  {
    code: 'super_admin',
    label_fr: 'Super administrateur',
    label_ar: 'المدير العام للنظام',
    label_en: 'Super administrator',
    permissions: ['*'],
    routes: ['*'],
  },
  {
    code: 'director',
    label_fr: 'Directeur',
    label_ar: 'المدير',
    label_en: 'Director',
    permissions: ['*'],
    routes: ['*'],
  },
  {
    code: 'manager',
    label_fr: 'Gestionnaire',
    label_ar: 'مسؤول',
    label_en: 'Manager',
    permissions: ['projects.manage', 'phases.manage', 'payments.review', 'reports.read'],
    routes: ['/dashboard', '/projects', '/phases', '/dqe', '/tenders', '/reports', '/payment'],
  },
  {
    code: 'project_manager',
    label_fr: 'Chef de projet',
    label_ar: 'مدير المشروع',
    label_en: 'Project manager',
    permissions: ['projects.manage', 'phases.manage', 'reports.read'],
    routes: ['/dashboard', '/projects', '/phases', '/dqe', '/tasks', '/reports'],
  },
  {
    code: 'prmp',
    label_fr: 'Responsable des marchés publics',
    label_ar: 'مسؤول المشتريات العمومية',
    label_en: 'Public procurement officer',
    permissions: ['ptba.manage', 'ppm.manage', 'ped.manage', 'tbi.read', 'tenders.manage'],
    routes: ['/ptba', '/ppm', '/ped', '/tbi', '/tenders', '/dashboard', '/reports'],
  },
  {
    code: SUPPLIER_ROLE,
    label_fr: 'Fournisseur validé',
    label_ar: 'مورد معتمد',
    label_en: 'Approved supplier',
    permissions: ['submissions.create', 'submissions.read', 'invoices.create'],
    routes: ['/supplier-portal', '/tenders-public'],
  },
  {
    code: 'supplier',
    label_fr: 'Fournisseur',
    label_ar: 'مورد',
    label_en: 'Supplier',
    permissions: ['submissions.create', 'submissions.read', 'invoices.create'],
    routes: ['/supplier-portal', '/tenders-public'],
  },
  {
    code: PENDING_SUPPLIER_ROLE,
    label_fr: 'Fournisseur en attente de validation',
    label_ar: 'مورد في انتظار الموافقة',
    label_en: 'Supplier pending approval',
    permissions: ['profile.read'],
    routes: ['/fournisseur/validation-en-cours'],
  },
  {
    code: 'consultant',
    label_fr: 'Consultant',
    label_ar: 'استشاري',
    label_en: 'Consultant',
    permissions: ['inspections.read', 'reports.read'],
    routes: ['/consultant-portal'],
  },
  {
    code: 'inspector',
    label_fr: 'Inspecteur',
    label_ar: 'مفتش',
    label_en: 'Inspector',
    permissions: ['inspections.manage'],
    routes: ['/inspection-monitoring'],
  },
  {
    code: 'viewer',
    label_fr: 'Lecteur',
    label_ar: 'قارئ',
    label_en: 'Viewer',
    permissions: ['reports.read', 'tbi.read'],
    routes: ['/tbi', '/reports'],
  },
];

const normalize = (roles: readonly (string | null | undefined)[] | null | undefined): string[] =>
  (roles ?? []).filter(Boolean).map((r) => String(r).toLowerCase());

export function getRoleDefinition(code: string | null | undefined): RoleDefinition | undefined {
  if (!code) return undefined;
  const target = String(code).toLowerCase();
  return ROLES_RESPONSIBILITIES.find((r) => r.code.toLowerCase() === target);
}

export function getRoleLabel(code: string, lang: 'fr' | 'ar' | 'en' = 'fr'): string {
  const def = getRoleDefinition(code);
  if (!def) return code;
  return lang === 'ar' ? def.label_ar : lang === 'en' ? def.label_en : def.label_fr;
}

/** Permissions cumulées d'un ensemble de rôles. */
export function resolvePermissions(roles: readonly string[] | null | undefined): string[] {
  const set = new Set<string>();
  normalize(roles).forEach((code) => getRoleDefinition(code)?.permissions.forEach((p) => set.add(p)));
  return Array.from(set);
}

export function hasPermission(roles: readonly string[] | null | undefined, permission: string): boolean {
  const perms = resolvePermissions(roles);
  return perms.includes('*') || perms.includes(permission);
}

/** Vérifie qu'au moins un rôle donne accès à un chemin. */
export function roleHasRouteAccess(roles: readonly string[] | null | undefined, pathname: string): boolean {
  const list = normalize(roles);
  if (list.length === 0) return false;
  return list.some((code) => {
    const def = getRoleDefinition(code);
    if (!def) return false;
    return def.routes.includes('*') || def.routes.some((route) => pathname.startsWith(route));
  });
}

/** Intersection entre rôles de l'utilisateur et rôles requis (insensible à la casse). */
export function matchesRequiredRoles(
  userRoles: readonly (string | null | undefined)[] | null | undefined,
  requiredRoles: readonly string[] | null | undefined
): boolean {
  const required = normalize(requiredRoles);
  if (required.length === 0) return true;
  const owned = normalize(userRoles);
  return owned.some((r) => required.includes(r));
}
