/**
 * entityLabels — résolution canonique des libellés affichés dans l'UI.
 *
 * Règle métier : un identifiant technique (UUID) ne doit JAMAIS être affiché
 * comme libellé. On résout dans l'ordre : libellé métier → code/référence →
 * position ordinale (Phase 1, Lot 2…).
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): boolean =>
  typeof value === 'string' && UUID_RE.test(value.trim());

/** Valeur affichable ? (non vide et non UUID) */
export const isDisplayable = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && !isUuid(value);

type AnyRecord = Record<string, unknown>;

const pick = (source: AnyRecord | null | undefined, keys: string[]): string | undefined => {
  if (!source) return undefined;
  for (const key of keys) {
    const raw = source[key];
    if (isDisplayable(raw)) return raw.trim();
  }
  return undefined;
};

const LABEL_KEYS = ['name', 'label', 'title', 'phaseName', 'phase_name', 'designation'];
const CODE_KEYS = ['code', 'phaseCode', 'phase_code', 'reference', 'projectReference', 'project_reference'];

/**
 * Libellé d'une phase. `index` (base 0) sert de repli ordinal.
 */
export function resolvePhaseLabel(
  phase: AnyRecord | null | undefined,
  index?: number,
  prefix = 'Phase',
): string {
  const label = pick(phase, LABEL_KEYS);
  if (label) return label;

  const custom = (phase?.customPhaseData ?? phase?.custom_phase_data) as AnyRecord | undefined;
  const code = pick(phase, CODE_KEYS) ?? pick(custom, CODE_KEYS);
  if (code) return `${prefix} ${code}`;

  const order = phase?.orderIndex ?? phase?.order_index;
  if (typeof order === 'number' && Number.isFinite(order) && order > 0) {
    return `${prefix} ${order}`;
  }

  if (typeof index === 'number' && index >= 0) return `${prefix} ${index + 1}`;
  return `${prefix} sans libellé`;
}

/** Libellé d'un projet (titre → référence → repli). */
export function resolveProjectLabel(project: AnyRecord | null | undefined): string {
  return (
    pick(project, ['title', ...LABEL_KEYS]) ??
    pick(project, CODE_KEYS) ??
    'Projet sans intitulé'
  );
}

/** Libellé générique (tâche, jalon, lot…). */
export function resolveEntityLabel(
  entity: AnyRecord | null | undefined,
  fallback = 'Sans libellé',
  index?: number,
): string {
  const label = pick(entity, ['title', ...LABEL_KEYS]) ?? pick(entity, CODE_KEYS);
  if (label) return label;
  if (typeof index === 'number' && index >= 0) return `${fallback} ${index + 1}`;
  return fallback;
}

/** Libellé d'une personne (nom complet → email → repli). */
export function resolvePersonLabel(
  person: AnyRecord | null | undefined,
  fallback = 'Non assigné',
): string {
  return (
    pick(person, ['fullName', 'full_name', 'name', 'displayName', 'display_name']) ??
    pick(person, ['email']) ??
    fallback
  );
}
