/**
 * rowMapping — utilitaires de frontière (Adapter) entre les lignes SQL
 * (snake_case, imposé par PostgreSQL / PostgREST) et les DTOs du domaine
 * (camelCase, imposé par l'architecture hexagonale).
 *
 * Règle : la conversion de casse ne doit JAMAIS remonter au-delà des adapters.
 */

const toCamel = (key: string): string => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const toSnake = (key: string): string => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

type AnyRecord = Record<string, unknown>;

const isPlainObject = (value: unknown): value is AnyRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);

const convert = (value: unknown, mapKey: (k: string) => string): unknown => {
  if (Array.isArray(value)) return value.map((item) => convert(item, mapKey));
  if (!isPlainObject(value)) return value;
  const out: AnyRecord = {};
  Object.entries(value).forEach(([key, val]) => {
    out[mapKey(key)] = convert(val, mapKey);
  });
  return out;
};

/** Ligne SQL -> DTO camelCase (profondeur illimitée). */
export function camelizeRow<T>(row: unknown): T {
  return convert(row, toCamel) as T;
}

/** Liste de lignes SQL -> DTOs camelCase. */
export function camelizeRows<T>(rows: unknown): T[] {
  if (!rows) return [];
  return (Array.isArray(rows) ? rows : [rows]).map((row) => camelizeRow<T>(row));
}

/** DTO camelCase -> payload SQL snake_case (insert / update). */
export function snakeizeRow<T extends AnyRecord = AnyRecord>(dto: unknown): T {
  return convert(dto, toSnake) as T;
}
