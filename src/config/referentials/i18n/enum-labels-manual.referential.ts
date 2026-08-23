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

/** MaterialCategory — catégories de matériaux (src/dtos/entities/MaterialCategoryDTO.ts) */
export const MATERIAL_CATEGORY_LABELS: EnumLabelMap = {
    'construction': { fr: 'Matériaux de construction', ar: 'مواد البناء', en: 'Construction materials' },
    'electrical': { fr: 'Matériaux électriques', ar: 'مواد كهربائية', en: 'Electrical materials' },
    'plumbing': { fr: 'Plomberie', ar: 'السباكة', en: 'Plumbing' },
    'finishing': { fr: 'Finition', ar: 'التشطيب', en: 'Finishing' },
};

/** MaterialCategoryDescription — descriptions des catégories de matériaux */
export const MATERIAL_CATEGORY_DESCRIPTION_LABELS: EnumLabelMap = {
    'construction': { fr: 'Matériaux de base pour la construction', ar: 'مواد أساسية للبناء', en: 'Basic construction materials' },
    'electrical': { fr: 'Câblage et composants électriques', ar: 'أسلاك ومكونات كهربائية', en: 'Cabling and electrical components' },
    'plumbing': { fr: 'Tuyauterie et accessoires', ar: 'أنابيب ولوازم', en: 'Piping and fittings' },
    'finishing': { fr: 'Matériaux de finition', ar: 'مواد التشطيب', en: 'Finishing materials' },
};

/** MaterialSubcategory — sous-catégories de matériaux */
export const MATERIAL_SUBCATEGORY_LABELS: EnumLabelMap = {
    'cement': { fr: 'Ciment', ar: 'أسمنت', en: 'Cement' },
    'concrete': { fr: 'Béton', ar: 'خرسانة', en: 'Concrete' },
    'steel': { fr: 'Acier', ar: 'حديد', en: 'Steel' },
    'brick': { fr: 'Briques', ar: 'طوب', en: 'Bricks' },
    'sand': { fr: 'Sable', ar: 'رمل', en: 'Sand' },
    'gravel': { fr: 'Gravier', ar: 'حصى', en: 'Gravel' },
    'cable': { fr: 'Câbles', ar: 'كابلات', en: 'Cables' },
    'conduit': { fr: 'Gaines', ar: 'مجاري كهربائية', en: 'Conduits' },
    'panel': { fr: 'Tableaux', ar: 'لوحات كهربائية', en: 'Panels' },
    'switch': { fr: 'Interrupteurs', ar: 'مفاتيح', en: 'Switches' },
    'pipe': { fr: 'Tuyaux', ar: 'أنابيب', en: 'Pipes' },
    'fitting': { fr: 'Raccords', ar: 'وصلات', en: 'Fittings' },
    'valve': { fr: 'Vannes', ar: 'صمامات', en: 'Valves' },
    'pump': { fr: 'Pompes', ar: 'مضخات', en: 'Pumps' },
    'paint': { fr: 'Peinture', ar: 'دهان', en: 'Paint' },
    'tile': { fr: 'Carrelage', ar: 'بلاط', en: 'Tiles' },
    'wood': { fr: 'Bois', ar: 'خشب', en: 'Wood' },
    'glass': { fr: 'Verre', ar: 'زجاج', en: 'Glass' },
};

/** Registre des ENUM déclarés manuellement. */
export const MANUAL_ENUM_LABELS: Readonly<Record<string, EnumLabelMap>> = {
    RiskScale: RISK_SCALE_LABELS,
    ResourceType: RESOURCE_TYPE_LABELS,
    MaterialCategory: MATERIAL_CATEGORY_LABELS,
    MaterialCategoryDescription: MATERIAL_CATEGORY_DESCRIPTION_LABELS,
    MaterialSubcategory: MATERIAL_SUBCATEGORY_LABELS,
};

