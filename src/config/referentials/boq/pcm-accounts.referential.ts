/**
 * Référentiel — Plan Comptable Mauritanien (PCM), volet fiscal.
 *
 * Généré depuis `plan_comptable_mauritanie.csv` (colonnes `tax_ids` /
 * `tax_group_id`) : chaque compte imputable porte son régime de TVA
 * (taux + catégorie EN 16931) et son groupe (ACHAT / VENTE).
 *
 * Utilisé par `TaxService` pour déterminer la TVA d'une ligne DQE / contrat
 * à partir du compte comptable, avant les heuristiques de désignation.
 * Pure TS — aucun accès React / Supabase.
 */

import type { VatCategoryCode } from './tax-regimes.referential';

export type PcmTaxGroup = 'ACHAT' | 'VENTE';

export interface PcmAccountTax {
  code: string;
  labelFr: string;
  labelAr: string;
  accountType: string;
  taxLabel: string;
  taxGroup: PcmTaxGroup;
  /** Taux de TVA (0.16 = 16 %). */
  vatRate: number;
  vatCategoryCode: VatCategoryCode;
}

export const PCM_ACCOUNT_TAXES: PcmAccountTax[] = [
  { code: "600", labelFr: "Marchandises", labelAr: "بضائع", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "601", labelFr: "Matières premières et autres approvisionnements", labelAr: "المواد الخام واللوازم الأخرى", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6010", labelFr: "Matières premières", labelAr: "مواد خام", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6012", labelFr: "Matières et fournitures consommables", labelAr: "المواد والمستلزمات الاستهلاكية", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "60120", labelFr: "Matières consommables", labelAr: "المواد الاستهلاكية", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "60121", labelFr: "Combustibles, carburants et lubrifiants", labelAr: "الوقود والوقود ومواد التشحيم", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "60122", labelFr: "Fournitures et matériaux d'entretien", labelAr: "لوازم ومواد الصيانة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "60123", labelFr: "Fournitures d'atelier, d'usine et de magasin", labelAr: "لوازم الورش والمصانع والمخازن", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "60124", labelFr: "Petit outillage", labelAr: "أدوات صغيرة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "60125", labelFr: "Produits d'entretien", labelAr: "منتجات الصيانة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "60126", labelFr: "Fournitures de bureau et administratives", labelAr: "اللوازم المكتبية والإدارية", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "60128", labelFr: "Autres matières et fournitures", labelAr: "مواد ولوازم أخرى", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "602", labelFr: "Emballages", labelAr: "التعبئة والتغليف", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6020", labelFr: "Emballages perdus", labelAr: "التعبئة والتغليف المفقودة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6025", labelFr: "Emballages récupérables non identifiables", labelAr: "عبوات قابلة للاسترداد غير معروفة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6027", labelFr: "Emballages à usage mixte", labelAr: "عبوة متعددة الاستخدامات", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "606", labelFr: "Achats d'approvisionnements non stockés", labelAr: "شراء الإمدادات غير المخزنة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6060", labelFr: "Fournitures non stockables (eau, énergie)", labelAr: "الإمدادات غير القابلة للتخزين (المياه والطاقة)", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6061", labelFr: "Combustibles, carburants et lubrifiants", labelAr: "الوقود والوقود ومواد التشحيم", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6062", labelFr: "Fournitures et matériaux d'entretien", labelAr: "لوازم ومواد الصيانة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6063", labelFr: "Fournitures d'atelier, d'usine et de magasin", labelAr: "لوازم الورش والمصانع والمخازن", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6064", labelFr: "Petits outillages", labelAr: "أدوات صغيرة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6065", labelFr: "Produits d'entretien", labelAr: "منتجات الصيانة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6066", labelFr: "Fournitures de bureau et administratives", labelAr: "اللوازم المكتبية والإدارية", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6067", labelFr: "Vêtements de travail", labelAr: "ملابس العمل", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6068", labelFr: "Autres matières et fournitures", labelAr: "مواد ولوازم أخرى", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "610", labelFr: "Sous-traitance générale", labelAr: "المقاولات العامة من الباطن", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "620", labelFr: "Locations et charges locatives", labelAr: "الإيجارات ورسوم الإيجار", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6200", labelFr: "Locations mobilières et immobilières", labelAr: "تأجير المنقولات والعقارات", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6202", labelFr: "Redevances de crédit-bail", labelAr: "رسوم التأجير", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6203", labelFr: "Malis sur emballages restitués", labelAr: "Malis على العبوة المرتجعة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "621", labelFr: "Travaux d'entretien et de réparation", labelAr: "أعمال الصيانة والإصلاح", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "623", labelFr: "Primes d'assurance", labelAr: "أقساط التأمين", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6230", labelFr: "Multirisque", labelAr: "متعدد المخاطر", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6234", labelFr: "Assurances transport", labelAr: "تأمين النقل", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6238", labelFr: "Autres risques", labelAr: "مخاطر أخرى", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "624", labelFr: "Études et recherches", labelAr: "الدراسات والأبحاث", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "625", labelFr: "Documentation générale et technique", labelAr: "الوثائق العامة والفنية", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "626", labelFr: "Frais de colloques, séminaires, conférences", labelAr: "رسوم المؤتمرات والندوات والمؤتمرات", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "630", labelFr: "Transports", labelAr: "مواصلات", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6300", labelFr: "Transports sur achats", labelAr: "النقل على المشتريات", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6301", labelFr: "Transports sur ventes", labelAr: "النقل على المبيعات", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6302", labelFr: "Transports entre établissements", labelAr: "النقل بين المنشآت", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6305", labelFr: "Transports collectifs du personnel", labelAr: "النقل الجماعي للموظفين", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6308", labelFr: "Autres frais de transport", labelAr: "تكاليف النقل الأخرى", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "631", labelFr: "Déplacements, missions, réceptions", labelAr: "السفر والبعثات وحفلات الاستقبال", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6310", labelFr: "Voyages et déplacements", labelAr: "السفر والسفر", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6315", labelFr: "Missions", labelAr: "البعثات", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6317", labelFr: "Réceptions", labelAr: "حفلات الاستقبال", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "632", labelFr: "Frais postaux et télécommunications", labelAr: "تكاليف البريد والاتصالات السلكية واللاسلكية", accountType: "expense", taxLabel: "TVA 18% à téléphonie (vente)", taxGroup: 'ACHAT', vatRate: 0.18, vatCategoryCode: 'S' },
  { code: "633", labelFr: "Rémunérations d'intermédiaires et honoraires", labelAr: "أجور ورسوم الوساطة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6330", labelFr: "Personnel intérimaire", labelAr: "موظفين مؤقتين", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6331", labelFr: "Honoraires", labelAr: "مصاريف", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6332", labelFr: "Frais d'actes et de contentieux", labelAr: "تكاليف الأفعال والتقاضي", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6333", labelFr: "Traitement automatique des informations", labelAr: "المعالجة التلقائية للمعلومات", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6334", labelFr: "Commissions et courtages", labelAr: "العمولات والوساطة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "6338", labelFr: "Divers", labelAr: "متنوع", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "634", labelFr: "Publicité et propagande", labelAr: "الإعلان والدعاية", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "638", labelFr: "Charges diverses", labelAr: "رسوم متنوعة", accountType: "expense", taxLabel: "TVA 16% (achat)", taxGroup: 'ACHAT', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "700", labelFr: "Ventes de marchandises", labelAr: "مبيعات البضائع", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7001", labelFr: "Ventes de marchandises exonérées de TVA", labelAr: "مبيعات السلع المعفاة من ضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 0% collectée (vente)", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "70011", labelFr: "Ventes exonérées à l'intérieur", labelAr: "إعفاء المبيعات الداخلية", accountType: "revenue", taxLabel: "TVA 0% autres opérations non imposables", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "70012", labelFr: "Exportations de produits exonérés", labelAr: "صادرات المنتجات المعفاة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "70013", labelFr: "Exportations de produits imposables", labelAr: "صادرات المنتجات الخاضعة للضريبة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "7002", labelFr: "Ventes soumises à la TVA", labelAr: "المبيعات تخضع لضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "70021", labelFr: "Ventes à taux réduit", labelAr: "انخفاض معدل المبيعات", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "70022", labelFr: "Ventes à taux normal", labelAr: "مبيعات المعدل الطبيعي", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7010", labelFr: "Production de biens", labelAr: "إنتاج البضائع", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "70101", labelFr: "Production de biens exonérés de TVA", labelAr: "إنتاج السلع المعفاة من ضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 0% collectée (vente)", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "701011", labelFr: "Production de biens exonérés à l'intérieur", labelAr: "الإنتاج المحلي من السلع المعفاة", accountType: "revenue", taxLabel: "TVA 0% autres opérations non imposables", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "701012", labelFr: "Exportations de produits exonérés", labelAr: "صادرات المنتجات المعفاة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "701013", labelFr: "Exportations de produits imposables", labelAr: "صادرات المنتجات الخاضعة للضريبة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "70102", labelFr: "Production de biens soumis à TVA", labelAr: "إنتاج السلع الخاضعة لضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "701021", labelFr: "Production de biens à taux réduit", labelAr: "إنتاج السلع بأسعار مخفضة", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "701022", labelFr: "Production de biens à taux normal", labelAr: "إنتاج السلع بالمعدل الطبيعي", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7012", labelFr: "Travaux", labelAr: "يعمل", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "70121", labelFr: "Travaux exonérés de TVA", labelAr: "الأعمال المعفاة من ضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 0% collectée (vente)", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "701211", labelFr: "Travaux exonérés à l'intérieur", labelAr: "إعفاء العمل الداخلي", accountType: "revenue", taxLabel: "TVA 0% autres opérations non imposables", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "701212", labelFr: "Exportations de travaux exonérés", labelAr: "صادرات الأعمال المعفاة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "701213", labelFr: "Exportations de travaux imposables", labelAr: "صادرات العمل الخاضع للضريبة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "70122", labelFr: "Travaux soumis à TVA", labelAr: "العمل خاضع لضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "701221", labelFr: "Travaux à taux réduit", labelAr: "انخفاض معدل العمل", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "701222", labelFr: "Travaux à taux normal", labelAr: "العمل بمعدل عادي", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7015", labelFr: "Études", labelAr: "دراسات", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "70151", labelFr: "Études exonérées de TVA", labelAr: "الدراسات المعفاة من ضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 0% collectée (vente)", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "701511", labelFr: "Études exonérées à l'intérieur", labelAr: "إعفاء الدراسات داخل", accountType: "revenue", taxLabel: "TVA 0% autres opérations non imposables", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "701512", labelFr: "Exportations d'études exonérées", labelAr: "صادرات الدراسات المعفاة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "701513", labelFr: "Exportations d'études imposables", labelAr: "صادرات الدراسات الخاضعة للضريبة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "70152", labelFr: "Études soumises à TVA", labelAr: "الدراسات الخاضعة لضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "701521", labelFr: "Études à taux réduit", labelAr: "دراسات بمعدلات مخفضة", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "701522", labelFr: "Études à taux normal", labelAr: "دراسات المعدل الطبيعي", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7017", labelFr: "Prestations de services", labelAr: "خدمات", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "70171", labelFr: "Prestations exonérées de TVA", labelAr: "الخدمات المعفاة من ضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 0% collectée (vente)", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "701711", labelFr: "Prestations exonérées à l'intérieur", labelAr: "الخدمات المعفاة داخل", accountType: "revenue", taxLabel: "TVA 0% autres opérations non imposables", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'E' },
  { code: "701712", labelFr: "Exportations de prestations exonérées", labelAr: "صادرات الخدمات المعفاة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "701713", labelFr: "Exportations de prestations imposables", labelAr: "صادرات الخدمات الخاضعة للضريبة", accountType: "revenue", taxLabel: "TVA 0% Export", taxGroup: 'VENTE', vatRate: 0.0, vatCategoryCode: 'Z' },
  { code: "70172", labelFr: "Prestations soumises à TVA", labelAr: "الخدمات الخاضعة لضريبة القيمة المضافة", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "701721", labelFr: "Prestations à taux réduit", labelAr: "فوائد معدل مخفض", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "701722", labelFr: "Prestations à taux normal", labelAr: "فوائد المعدل الطبيعي", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "706", labelFr: "Produits des activités annexes", labelAr: "الدخل من الأنشطة المساعدة", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7060", labelFr: "Services exploités dans l'intérêt du personnel", labelAr: "الخدمات تعمل لصالح الموظفين", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7061", labelFr: "Commissions et courtages", labelAr: "العمولات والوساطة", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7062", labelFr: "Locations diverses", labelAr: "الإيجارات المختلفة", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7063", labelFr: "Bonis sur reprises d'emballages", labelAr: "مكافأة على عوائد التعبئة والتغليف", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7064", labelFr: "Ports facturés aux clients", labelAr: "الشحن مكلف للعملاء", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7065", labelFr: "Ventes d'emballages récupérables", labelAr: "مبيعات العبوات القابلة للاسترداد", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "70650", labelFr: "Ventes d'emballages achetés", labelAr: "مبيعات العبوات المشتراة", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "70651", labelFr: "Ventes d'emballages produits", labelAr: "مبيعات تغليف المنتجات", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "7068", labelFr: "Autres produits des activités annexes", labelAr: "إيرادات أخرى من الأنشطة ذات الصلة", accountType: "revenue", taxLabel: "TVA 16% service (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
  { code: "722", labelFr: "Production immobilisée", labelAr: "الإنتاج المعطل", accountType: "revenue", taxLabel: "TVA 16% (vente)", taxGroup: 'VENTE', vatRate: 0.16, vatCategoryCode: 'S' },
];

export const PCM_ACCOUNT_TAX_BY_CODE: Record<string, PcmAccountTax> = Object.fromEntries(
  PCM_ACCOUNT_TAXES.map((a) => [a.code, a]),
);

/** Comptes de charges (imputation d'un achat / décompte fournisseur). */
export const PCM_PURCHASE_ACCOUNTS = PCM_ACCOUNT_TAXES.filter((a) => a.taxGroup === 'ACHAT');
/** Comptes de produits (facturation client / recette de projet). */
export const PCM_SALE_ACCOUNTS = PCM_ACCOUNT_TAXES.filter((a) => a.taxGroup === 'VENTE');

/**
 * Résout le compte PCM le plus précis pour un code donné : correspondance
 * exacte, puis repli sur le préfixe le plus long (ex. `70121` → `7012` → `701`).
 */
export function resolvePcmAccount(code?: string | null): PcmAccountTax | null {
  const raw = String(code ?? '').replace(/[^0-9]/g, '');
  if (!raw) return null;
  if (PCM_ACCOUNT_TAX_BY_CODE[raw]) return PCM_ACCOUNT_TAX_BY_CODE[raw];
  for (let len = raw.length - 1; len >= 3; len -= 1) {
    const candidate = PCM_ACCOUNT_TAX_BY_CODE[raw.slice(0, len)];
    if (candidate) return candidate;
  }
  return null;
}

export function getPcmAccountLabel(code?: string | null, lang: 'fr' | 'ar' | 'en' = 'fr'): string {
  const account = resolvePcmAccount(code);
  if (!account) return String(code ?? '');
  const label = lang === 'ar' ? account.labelAr || account.labelFr : account.labelFr;
  return `${account.code} — ${label}`;
}
