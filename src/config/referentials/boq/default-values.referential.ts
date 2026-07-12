/**
 * Default numeric values applied when a dimension is missing from the source
 * document (PDF/Excel/CSV). Kept minimal & conservative so imports do not
 * silently invent quantities.
 */

export const BOQ_DEFAULT_VALUES = {
  height: 0,
  width: 0,
  length: 0,
  quantity: 0,
  unitPrice: 0,
} as const;
