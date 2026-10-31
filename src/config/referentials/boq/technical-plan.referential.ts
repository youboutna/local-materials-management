/** Parsing hints, not quantity or regulatory rules. No unit inference from a scale. */
export const TECHNICAL_PLAN_PATTERNS = {
  scale: /(?:[ÉE]chelle|Ech\.?|ECH)\s*[:.]?\s*1\s*[/:]\s*(\d+)/i,
  planche: /(?:Planche|PLANCHE|Pl)\s*[:.]?\s*([\w-]+)/i,
  phase: /Phase\s*[:.]?\s*([\w-]+)/i,
  date: /Date\s*[:.]?\s*([^\n]+)/i,
  section: /\b([PS]|Lg)\s*(\d+)\b[^\n]*?(\d+(?:[,.]\d+)?)\s*[xX×]\s*(\d+(?:[,.]\d+)?)\s*(cm|mm|m)?\b/gi,
};

export const TECHNICAL_PLAN_POLICY = {
  minimumOcrConfidence: 80,
  renderScale: 1.5,
  maximumPages: 50,
  units: { m: 1, cm: 0.01, mm: 0.001 },
  elementPrefixes: { P: 'concrete_beam', S: 'concrete_footing', Lg: 'concrete_beam' },
} as const;