/**
 * Référentiel : page d'accueil par rôle après authentification.
 * Les rôles de pilotage (admin, director, project_manager...) vont au tableau de bord,
 * les autres profils sont redirigés vers leur portail dédié.
 */

export interface RoleHomeRoute {
  code: string;
  route: string;
  label_fr: string;
  label_ar: string;
  label_en: string;
}

/** Rôles de pilotage : accès direct au tableau de bord interne. */
export const MANAGEMENT_ROLES = [
  'admin',
  'super_admin',
  'director',
  'project_manager',
  'manager',
] as const;

export const ROLE_HOME_ROUTES: RoleHomeRoute[] = [
  { code: 'supplier', route: '/supplier-portal', label_fr: 'Portail fournisseur', label_ar: 'بوابة الموردين', label_en: 'Supplier portal' },
  { code: 'contractor', route: '/supplier-portal', label_fr: 'Portail fournisseur', label_ar: 'بوابة الموردين', label_en: 'Supplier portal' },
  { code: 'consultant', route: '/consultant-portal', label_fr: 'Portail consultant', label_ar: 'بوابة الاستشاري', label_en: 'Consultant portal' },
  { code: 'engineering_consultant', route: '/consultant-portal', label_fr: 'Portail consultant', label_ar: 'بوابة الاستشاري', label_en: 'Consultant portal' },
  { code: 'inspector', route: '/inspection-monitoring', label_fr: 'Suivi des inspections', label_ar: 'متابعة التفتيش', label_en: 'Inspection monitoring' },
];

export const DEFAULT_MANAGEMENT_HOME = '/dashboard';
export const DEFAULT_FALLBACK_HOME = '/home';

/** Résout la page d'accueil appropriée pour un ensemble de rôles. */
export function resolveHomeRouteForRoles(roles: string[] | undefined | null): string {
  const list = (roles ?? []).filter(Boolean).map((r) => String(r).toLowerCase());
  if (list.some((r) => (MANAGEMENT_ROLES as readonly string[]).includes(r))) {
    return DEFAULT_MANAGEMENT_HOME;
  }
  const match = ROLE_HOME_ROUTES.find((entry) => list.includes(entry.code));
  return match ? match.route : DEFAULT_FALLBACK_HOME;
}
