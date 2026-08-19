/**
 * Recommandations par type d'élément.
 * Le catalogue vit désormais dans le référentiel BOQ
 * (`src/config/referentials/boq/recommendations.referential.ts`).
 * Ce module reste un alias de compatibilité pour les imports existants.
 */
export type { RecommendationItem } from '@/config/referentials/boq/recommendations.referential';
export { getRecommendationItems } from '@/config/referentials/boq/recommendations.referential';
