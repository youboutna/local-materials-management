/**
 * procurement-chain.referential — paramètres de la chaîne
 * « Expression de besoin (DQE) validée → Planification → Appel d'offres →
 *   Portails prestataire / consultant ».
 *
 * Aucune logique ici : uniquement les paramètres (délais, statuts, libellés
 * fr/ar/en). Le moteur est `ProcurementChainService`.
 */

export interface ProcurementChainStepDef {
  code: 'planning' | 'forecast' | 'tender' | 'portal';
  labelFr: string;
  labelAr: string;
  labelEn: string;
}

export const PROCUREMENT_CHAIN_REFERENTIAL = {
  /** Statut du DQE requis pour déclencher la chaîne. */
  requiredDqeStatus: 'valide',
  /** Statut d'appel d'offres publié (visible portails prestataire/consultant). */
  publishedTenderStatus: 'published',
  /** Statut d'appel d'offres créé mais non publié. */
  draftTenderStatus: 'draft',
  /** Délai de consultation par défaut (jours) entre publication et date limite. */
  consultationDays: 21,
  /** Écart toléré entre total DQE et budget projet avant resynchronisation (%). */
  budgetTolerancePercent: 1,
  steps: [
    { code: 'planning', labelFr: 'Planification alimentée', labelAr: 'تمت تغذية التخطيط', labelEn: 'Planning fed' },
    { code: 'forecast', labelFr: 'Prévisions budgétaires synchronisées', labelAr: 'مزامنة التوقعات المالية', labelEn: 'Budget forecast synced' },
    { code: 'tender', labelFr: "Appel d'offres créé", labelAr: 'تم إنشاء طلب العروض', labelEn: 'Tender created' },
    { code: 'portal', labelFr: 'Publié sur les portails', labelAr: 'تم النشر على البوابات', labelEn: 'Published on portals' },
  ] as ProcurementChainStepDef[],
} as const;

export function procurementStepLabel(
  code: ProcurementChainStepDef['code'],
  lang: 'fr' | 'ar' | 'en' = 'fr',
): string {
  const step = PROCUREMENT_CHAIN_REFERENTIAL.steps.find((s) => s.code === code);
  if (!step) return code;
  return lang === 'ar' ? step.labelAr : lang === 'en' ? step.labelEn : step.labelFr;
}
