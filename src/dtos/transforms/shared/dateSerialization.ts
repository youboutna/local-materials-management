/** Normalize persisted timestamps before domain hydration or DTO serialization. */
export function parsePersistedDate(value: unknown): Date | undefined {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') return undefined;
  if (value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}