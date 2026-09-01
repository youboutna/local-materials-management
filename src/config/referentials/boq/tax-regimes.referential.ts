/**
 * Référentiel des régimes de taxation par nature de prestation (DQE / Facture).
 *
 * Doctrine : la TVA et les retenues ne sont PAS uniformes sur un DQE — elles
 * dépendent de la nature du poste (travaux BTP, fourniture de matériel,
 * prestation intellectuelle / consulting, études, transport, exonération
 * bailleur). Le profil fiscal (pays / marché) reste la base ; le régime
 * de prestation surcharge le taux applicable à la ligne.
 *
 * Codes techniques jamais affichés : libellés trilingues fr / ar / en.
 * Pure TS — aucune dépendance React / Supabase.
 */

/** Catégorie de TVA EN 16931 (UNTDID 5305) : S = standard, Z = taux zéro, E = exonéré. */
export type VatCategoryCode = 'S' | 'Z' | 'E';

export interface TaxRegimeDefinition {
  code: string;
  labels: { fr: string; ar: string; en: string };
  /** Taux de TVA applicable (0.16 = 16 %). */
  vatRate: number;
  /** Retenue à la source sur le HT (RAS BIC / RAS prestation). */
  withholdingRate: number;
  /** Catégorie TVA EN 16931. */
  vatCategoryCode: VatCategoryCode;
  /** Motif d'exonération (obligatoire EN 16931 quand category ≠ S). */
  exemptionReason?: { fr: string; ar: string; en: string };
  /** Mots-clés de rattachement (type de ressource, catégorie DQE, désignation). */
  matchers: string[];
}

export const TAX_REGIMES: TaxRegimeDefinition[] = [
  {
    code: 'TRAVAUX_BTP',
    labels: { fr: 'Travaux BTP', ar: 'أشغال البناء', en: 'Construction works' },
    vatRate: 0.16,
    withholdingRate: 0.03,
    vatCategoryCode: 'S',
    matchers: ['travaux', 'work', 'works', 'genie_civil', 'genie civil', 'batiment', 'terrassement', 'beton', 'reseau', 'ouvrage', 'labor', 'main_doeuvre', 'human'],
  },
  {
    code: 'FOURNITURE',
    labels: { fr: 'Fourniture de matériel', ar: 'توريد المواد', en: 'Supply of goods' },
    vatRate: 0.16,
    withholdingRate: 0.02,
    vatCategoryCode: 'S',
    matchers: ['fourniture', 'materiau', 'materiaux', 'material', 'materials', 'supply', 'equipement', 'equipment', 'materiel'],
  },
  {
    code: 'CONSULTING',
    labels: { fr: 'Prestation intellectuelle / consulting', ar: 'خدمات استشارية', en: 'Consulting services' },
    vatRate: 0.16,
    withholdingRate: 0.05,
    vatCategoryCode: 'S',
    matchers: ['consulting', 'consultant', 'assistance', 'at', 'maitrise_oeuvre', 'moe', 'expertise', 'audit', 'formation', 'service', 'services', 'prestation'],
  },
  {
    code: 'ETUDES',
    labels: { fr: 'Études techniques', ar: 'دراسات تقنية', en: 'Technical studies' },
    vatRate: 0.16,
    withholdingRate: 0.05,
    vatCategoryCode: 'S',
    matchers: ['etude', 'etudes', 'study', 'studies', 'conception', 'design', 'apd', 'aps', 'topographie'],
  },
  {
    code: 'TRANSPORT',
    labels: { fr: 'Transport et logistique', ar: 'النقل واللوجستيك', en: 'Transport and logistics' },
    vatRate: 0.05,
    withholdingRate: 0.02,
    vatCategoryCode: 'S',
    matchers: ['transport', 'logistique', 'logistics', 'fret', 'acheminement', 'carburant', 'fuel'],
  },
  {
    code: 'SERVICES_NUMERIQUES',
    labels: { fr: 'Services numériques', ar: 'الخدمات الرقمية', en: 'Digital services' },
    vatRate: 0.16,
    withholdingRate: 0.05,
    vatCategoryCode: 'S',
    // LFR 2026 : TVA due en Mauritanie dès qu'un critère de localisation du
    // consommateur est rempli (IP, indicatif, adresse de facturation, paiement).
    matchals: undefined as never,
    matchers: ['numerique', 'digital', 'logiciel', 'software', 'saas', 'licence', 'license', 'abonnement', 'subscription', 'hebergement', 'hosting', 'cloud', 'infogerance', 'streaming', 'en ligne', 'online'],
  },
  {
    code: 'PLATEFORME_NUMERIQUE',
    labels: { fr: 'Plateforme numérique / intermédiation', ar: 'منصة رقمية / وساطة', en: 'Digital platform / intermediation' },
    vatRate: 0.16,
    withholdingRate: 0.10,
    vatCategoryCode: 'S',
    // LFR 2026 : retenue de 10 % sur les commissions d'agents / distributeurs.
    matchers: ['plateforme', 'platform', 'marketplace', 'commission', 'intermediation', 'agent', 'distributeur', 'mobile money', 'paiement mobile'],
  },
  {
    code: 'EXONERE_BAILLEUR',
    labels: { fr: 'Exonéré (financement bailleur)', ar: 'معفى (تمويل خارجي)', en: 'Exempt (donor funded)' },
    vatRate: 0,
    withholdingRate: 0,
    vatCategoryCode: 'E',
    exemptionReason: {
      fr: 'Exonération de TVA au titre du financement extérieur (convention bailleur)',
      ar: 'إعفاء من الضريبة بموجب التمويل الخارجي',
      en: 'VAT exemption under external financing agreement',
    },
    matchers: ['exonere', 'exonération', 'exoneration', 'exempt', 'bailleur', 'donor', 'bad', 'bid', 'ue', 'banque_mondiale'],
  },
];

export const TAX_REGIME_BY_CODE: Record<string, TaxRegimeDefinition> = Object.fromEntries(
  TAX_REGIMES.map((r) => [r.code, r]),
);

export const DEFAULT_TAX_REGIME_CODE = 'TRAVAUX_BTP';

const norm = (raw: unknown): string =>
  String(raw ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 _]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function getTaxRegime(code?: string | null): TaxRegimeDefinition {
  if (!code) return TAX_REGIME_BY_CODE[DEFAULT_TAX_REGIME_CODE];
  return TAX_REGIME_BY_CODE[code] ?? TAX_REGIME_BY_CODE[DEFAULT_TAX_REGIME_CODE];
}

export function getTaxRegimeLabel(code: string | null | undefined, lang: 'fr' | 'ar' | 'en' = 'fr'): string {
  return getTaxRegime(code).labels[lang];
}

/** Entrée minimale d'une ligne pour la résolution du régime. */
export interface TaxRegimeHints {
  taxRegimeCode?: string | null;
  resourceType?: string | null;
  category?: string | null;
  elementType?: string | null;
  designation?: string | null;
}

/**
 * Résout le régime de taxation d'une ligne : code explicite prioritaire, puis
 * rattachement par mots-clés (type de ressource → catégorie → désignation).
 */
export function resolveTaxRegime(hints: TaxRegimeHints): TaxRegimeDefinition {
  if (hints.taxRegimeCode && TAX_REGIME_BY_CODE[hints.taxRegimeCode]) {
    return TAX_REGIME_BY_CODE[hints.taxRegimeCode];
  }
  const haystacks = [hints.resourceType, hints.category, hints.elementType, hints.designation]
    .map(norm)
    .filter(Boolean);
  for (const hay of haystacks) {
    // Le mot-clé apparaissant le plus tôt (puis le plus long) l'emporte :
    // « Transport de matériel » → transport, et non fourniture.
    let best: { regime: TaxRegimeDefinition; pos: number; len: number } | null = null;
    for (const regime of TAX_REGIMES) {
      for (const matcher of regime.matchers) {
        const needle = norm(matcher);
        const pos = hay.indexOf(needle);
        if (pos < 0) continue;
        if (!best || pos < best.pos || (pos === best.pos && needle.length > best.len)) {
          best = { regime, pos, len: needle.length };
        }
      }
    }
    if (best) return best.regime;
  }
  return TAX_REGIME_BY_CODE[DEFAULT_TAX_REGIME_CODE];
}

export interface ResolvedLineTax {
  regimeCode: string;
  regimeLabel: string;
  vatRate: number;
  rasRate: number;
  vatCategoryCode: VatCategoryCode;
  exemptionReason?: string;
}

/**
 * Taux effectifs d'une ligne : valeur saisie > régime de prestation > profil fiscal.
 * `profile` porte les taux « pays / marché » utilisés en dernier recours.
 */
export function resolveLineTax(
  line: TaxRegimeHints & { vatRate?: number | null; rasRate?: number | null },
  profile?: { vatRate?: number; withholdingRate?: number } | null,
  lang: 'fr' | 'ar' | 'en' = 'fr',
): ResolvedLineTax {
  const regime = resolveTaxRegime(line);
  const explicitVat = line.vatRate ?? null;
  const explicitRas = line.rasRate ?? null;
  const vatRate = explicitVat ?? regime.vatRate ?? profile?.vatRate ?? 0;
  const rasRate = explicitRas ?? regime.withholdingRate ?? profile?.withholdingRate ?? 0;
  const vatCategoryCode: VatCategoryCode = vatRate > 0 ? 'S' : regime.vatCategoryCode === 'S' ? 'Z' : regime.vatCategoryCode;
  return {
    regimeCode: regime.code,
    regimeLabel: regime.labels[lang],
    vatRate,
    rasRate,
    vatCategoryCode,
    exemptionReason: vatCategoryCode === 'S' ? undefined : regime.exemptionReason?.[lang],
  };
}

/** Groupe de TVA (récapitulatif multi-taux PDF / Factur-X). */
export interface VatBucket {
  vatRate: number;
  vatCategoryCode: VatCategoryCode;
  basisAmount: number;
  taxAmount: number;
  exemptionReason?: string;
}

/** Ventile des lignes déjà valorisées par taux de TVA (base + montant). */
export function buildVatBuckets(
  entries: Array<{ totalHt: number; vatRate: number; vatCategoryCode: VatCategoryCode; exemptionReason?: string }>,
): VatBucket[] {
  const map = new Map<string, VatBucket>();
  for (const e of entries) {
    const key = `${e.vatCategoryCode}:${e.vatRate.toFixed(4)}`;
    const cur = map.get(key) ?? {
      vatRate: e.vatRate,
      vatCategoryCode: e.vatCategoryCode,
      basisAmount: 0,
      taxAmount: 0,
      exemptionReason: e.exemptionReason,
    };
    cur.basisAmount += e.totalHt;
    cur.taxAmount += e.totalHt * e.vatRate;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => b.vatRate - a.vatRate);
}
