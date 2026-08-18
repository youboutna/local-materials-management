/**
 * Référentiel — Désignation du consultant projet
 *
 * Centralise (sans hardcode dans l'UI) :
 *  - les rôles applicatifs autorisés à désigner / révoquer un consultant,
 *  - les codes métier reconnus comme « consultant » sur `project_stakeholders.stakeholder_type`,
 *  - le code de repli appliqué lors d'une révocation.
 */

export const CONSULTANT_DESIGNATION_REFERENTIAL = {
  /** Rôles applicatifs habilités (chef de projet, directeur, admin). */
  authorizedRoles: [
    'admin',
    'super_admin',
    'director',
    'manager',
    'project_manager',
  ] as const,

  /** Codes métier considérés comme « consultant » en base. */
  consultantCodes: ['consultant', 'engineering_consultant'] as const,

  /** Code métier canonique écrit lors d'une désignation. */
  canonicalCode: 'consultant' as const,

  /** Code métier appliqué lors d'une révocation. */
  fallbackCode: 'other' as const,

  /** Un seul consultant principal par projet ? */
  singleConsultantPerProject: true,

  labels: {
    fr: {
      title: 'Consultant du projet',
      designate: 'Désigner comme consultant',
      revoke: 'Retirer le rôle consultant',
      none: 'Aucun consultant désigné',
      badge: 'Consultant',
      unauthorized:
        'Seuls le chef de projet, le directeur ou un administrateur peuvent désigner un consultant.',
    },
  },
} as const;

export type ConsultantDesignationReferential = typeof CONSULTANT_DESIGNATION_REFERENTIAL;

/** Vrai si le code métier correspond à un consultant. */
export const isConsultantBusinessCode = (code?: string | null): boolean => {
  if (!code) return false;
  const normalized = String(code).trim().toLowerCase();
  return (CONSULTANT_DESIGNATION_REFERENTIAL.consultantCodes as readonly string[]).includes(
    normalized,
  );
};

/** Vrai si l'un des rôles utilisateur autorise la désignation. */
export const canDesignateConsultant = (roles: string[] | undefined): boolean => {
  const normalized = (roles ?? []).map((r) => String(r).trim().toLowerCase());
  return (CONSULTANT_DESIGNATION_REFERENTIAL.authorizedRoles as readonly string[]).some((r) =>
    normalized.includes(r),
  );
};
