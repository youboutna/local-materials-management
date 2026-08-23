/**
 * RÉFÉRENTIEL MANUEL — Libellés multilingues d'ENUM non détectés par le générateur.
 *
 * Doctrine i18n : le code technique reste la source de vérité (jamais traduit),
 * seuls les libellés fr/ar/en sont portés ici. Ce fichier est édité à la main
 * (contrairement à `enum-labels.referential.ts` qui est généré) et fusionné
 * dans le registre global `ENUM_LABELS`.
 */

import type { EnumLabelMap } from './enum-labels.referential';

/** RiskScale — échelle 1-5 de probabilité / impact (src/dtos/entities/RiskDTO.ts) */
export const RISK_SCALE_LABELS: EnumLabelMap = {
    '1': { fr: '1 - Très faible', ar: '1 - ضعيف جدا', en: '1 - Very low' },
    '2': { fr: '2 - Faible', ar: '2 - ضعيف', en: '2 - Low' },
    '3': { fr: '3 - Moyen', ar: '3 - متوسط', en: '3 - Medium' },
    '4': { fr: '4 - Élevé', ar: '4 - مرتفع', en: '4 - High' },
    '5': { fr: '5 - Très élevé', ar: '5 - مرتفع جدا', en: '5 - Very high' },
};

/** ResourceType — nature d'une ressource / ligne BOQ */
export const RESOURCE_TYPE_LABELS: EnumLabelMap = {
    'material': { fr: 'Matériau', ar: 'مادة', en: 'Material' },
    'labour': { fr: "Main-d'œuvre", ar: 'يد عاملة', en: 'Labour' },
    'equipment': { fr: 'Équipement', ar: 'تجهيز', en: 'Equipment' },
    'overhead': { fr: 'Frais généraux', ar: 'مصاريف عامة', en: 'Overheads' },
};

/** Registre des ENUM déclarés manuellement. */
export const MANUAL_ENUM_LABELS: Readonly<Record<string, EnumLabelMap>> = {
    RiskScale: RISK_SCALE_LABELS,
    ResourceType: RESOURCE_TYPE_LABELS,
};
