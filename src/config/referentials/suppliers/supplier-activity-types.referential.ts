/**
 * Référentiel : types d'activité des fournisseurs / prestataires.
 * Codes techniques stables + libellés fr/ar/en (aucun libellé codé en dur dans l'UI).
 */

export interface SupplierActivityType {
  code: string;
  label_fr: string;
  label_ar: string;
  label_en: string;
}

export const SUPPLIER_ACTIVITY_TYPES: SupplierActivityType[] = [
  { code: 'TRAVAUX_BTP', label_fr: 'Travaux de bâtiment et génie civil', label_ar: 'أعمال البناء والهندسة المدنية', label_en: 'Building and civil works' },
  { code: 'ELECTRICITE', label_fr: 'Électricité et réseaux', label_ar: 'الكهرباء والشبكات', label_en: 'Electricity and networks' },
  { code: 'HYDRAULIQUE', label_fr: 'Hydraulique et assainissement', label_ar: 'الهيدروليك والصرف الصحي', label_en: 'Water and sanitation' },
  { code: 'FOURNITURES', label_fr: 'Fournitures et équipements', label_ar: 'التوريدات والتجهيزات', label_en: 'Supplies and equipment' },
  { code: 'ETUDES', label_fr: "Études et maîtrise d'œuvre", label_ar: 'الدراسات والإشراف', label_en: 'Studies and supervision' },
  { code: 'TRANSPORT', label_fr: 'Transport et logistique', label_ar: 'النقل واللوجستيك', label_en: 'Transport and logistics' },
  { code: 'SERVICES', label_fr: 'Services et prestations diverses', label_ar: 'الخدمات والأعمال المختلفة', label_en: 'Services and miscellaneous works' },
];

export type ReferentialLang = 'fr' | 'ar' | 'en';

export function getSupplierActivityLabel(code: string, lang: ReferentialLang = 'fr'): string {
  const item = SUPPLIER_ACTIVITY_TYPES.find((a) => a.code === code);
  if (!item) return code;
  return lang === 'ar' ? item.label_ar : lang === 'en' ? item.label_en : item.label_fr;
}

export function getSupplierActivityOptions(lang: ReferentialLang = 'fr') {
  return SUPPLIER_ACTIVITY_TYPES.map((a) => ({ value: a.code, label: getSupplierActivityLabel(a.code, lang) }));
}
