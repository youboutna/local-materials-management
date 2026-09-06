/**
 * Error Codes Referential
 *
 * Codes techniques uniques + libellés fonctionnels fr/ar/en.
 * Aucun libellé d'erreur ne doit être codé en dur dans l'UI ou les services :
 * tout passe par `resolveErrorCode()` / `LoggerService`.
 */

export type ErrorDomain =
  | 'auth'
  | 'data'
  | 'storage'
  | 'boq'
  | 'project'
  | 'tender'
  | 'finance'
  | 'geo'
  | 'ui'
  | 'system';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorCodeDefinition {
  /** Code technique unique et stable (jamais traduit). */
  code: string;
  domain: ErrorDomain;
  severity: ErrorSeverity;
  /** Libellé fonctionnel multilingue (UI seulement). */
  label: { fr: string; ar?: string; en?: string };
  /** Action recommandée pour l'utilisateur / le support. */
  hint?: { fr: string; ar?: string; en?: string };
}

export const ERROR_CODES: ErrorCodeDefinition[] = [
  {
    code: 'AUTH_LOGIN_FAILED',
    domain: 'auth',
    severity: 'error',
    label: { fr: 'Échec de connexion', ar: 'فشل تسجيل الدخول', en: 'Login failed' },
    hint: { fr: 'Vérifier les identifiants et le fournisseur configuré.', en: 'Check credentials and configured provider.' },
  },
  {
    code: 'AUTH_SESSION_EXPIRED',
    domain: 'auth',
    severity: 'warning',
    label: { fr: 'Session expirée', ar: 'انتهت الجلسة', en: 'Session expired' },
  },
  {
    code: 'AUTH_FORBIDDEN',
    domain: 'auth',
    severity: 'error',
    label: { fr: 'Accès refusé (rôle insuffisant)', ar: 'الوصول مرفوض', en: 'Access denied' },
  },
  {
    code: 'DATA_FETCH_FAILED',
    domain: 'data',
    severity: 'error',
    label: { fr: 'Échec de récupération des données', ar: 'فشل جلب البيانات', en: 'Data fetch failed' },
  },
  {
    code: 'DATA_WRITE_FAILED',
    domain: 'data',
    severity: 'error',
    label: { fr: 'Échec d’enregistrement des données', ar: 'فشل حفظ البيانات', en: 'Data write failed' },
  },
  {
    code: 'DATA_RLS_DENIED',
    domain: 'data',
    severity: 'error',
    label: { fr: 'Lecture/écriture refusée par la sécurité (RLS)', en: 'Blocked by row level security' },
  },
  {
    code: 'STORAGE_UPLOAD_FAILED',
    domain: 'storage',
    severity: 'error',
    label: { fr: 'Échec du téléversement du document', ar: 'فشل تحميل الملف', en: 'Document upload failed' },
  },
  {
    code: 'BOQ_IMPORT_FAILED',
    domain: 'boq',
    severity: 'error',
    label: { fr: 'Échec de l’import DQE', ar: 'فشل استيراد جدول الكميات', en: 'BOQ import failed' },
  },
  {
    code: 'BOQ_VALIDATION_FAILED',
    domain: 'boq',
    severity: 'warning',
    label: { fr: 'Lignes DQE non conformes', en: 'Invalid BOQ lines' },
  },
  {
    code: 'PROJECT_WORKFLOW_FAILED',
    domain: 'project',
    severity: 'error',
    label: { fr: 'Échec du workflow projet', en: 'Project workflow failure' },
  },
  {
    code: 'TENDER_ACCESS_DENIED',
    domain: 'tender',
    severity: 'warning',
    label: { fr: 'Accès à l’appel d’offres refusé', en: 'Tender access denied' },
  },
  {
    code: 'FINANCE_CALC_FAILED',
    domain: 'finance',
    severity: 'error',
    label: { fr: 'Échec du calcul financier / fiscal', en: 'Financial computation failure' },
  },
  {
    code: 'GEO_LOOKUP_FAILED',
    domain: 'geo',
    severity: 'warning',
    label: { fr: 'Échec de la recherche de localisation', en: 'Geolocation lookup failed' },
  },
  {
    code: 'UI_RENDER_CRASH',
    domain: 'ui',
    severity: 'critical',
    label: { fr: 'Erreur d’affichage de l’application', ar: 'خطأ في عرض التطبيق', en: 'Application render error' },
  },
  {
    code: 'UI_UNHANDLED_REJECTION',
    domain: 'ui',
    severity: 'error',
    label: { fr: 'Erreur non gérée dans l’interface', en: 'Unhandled UI error' },
  },
  {
    code: 'SYSTEM_CONFIG_INVALID',
    domain: 'system',
    severity: 'critical',
    label: { fr: 'Configuration applicative invalide', en: 'Invalid application configuration' },
  },
  {
    code: 'SYSTEM_UNKNOWN',
    domain: 'system',
    severity: 'error',
    label: { fr: 'Erreur inattendue', ar: 'خطأ غير متوقع', en: 'Unexpected error' },
  },
];

const INDEX: Record<string, ErrorCodeDefinition> = ERROR_CODES.reduce(
  (acc, def) => ({ ...acc, [def.code]: def }),
  {} as Record<string, ErrorCodeDefinition>,
);

export const FALLBACK_ERROR_CODE = 'SYSTEM_UNKNOWN';

export const resolveErrorCode = (code?: string | null): ErrorCodeDefinition =>
  (code && INDEX[code]) || INDEX[FALLBACK_ERROR_CODE];

export const getErrorLabel = (code?: string | null, language: 'fr' | 'ar' | 'en' = 'fr'): string => {
  const def = resolveErrorCode(code);
  return def.label[language] ?? def.label.fr;
};

export const getErrorHint = (code?: string | null, language: 'fr' | 'ar' | 'en' = 'fr'): string | undefined => {
  const def = resolveErrorCode(code);
  return def.hint?.[language] ?? def.hint?.fr;
};
