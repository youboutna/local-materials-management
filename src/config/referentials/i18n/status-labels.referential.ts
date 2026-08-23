/**
 * status-labels.referential — labels multilingues (fr / ar / en)
 *
 * Source unique des libellés affichables pour les codes techniques métier :
 * statuts génériques, workflow DQE → Facture, cycle appels d'offres,
 * types de projets, unités de mesure et étapes de workflow.
 *
 * Règles :
 * - Le Domain ne stocke que des codes techniques (`draft`, `en_cours_v2`, ...).
 * - Aucun libellé n'est codé en dur dans l'UI : tout passe par ce référentiel
 *   via `I18nService` / `useI18n`.
 * - Le français est la langue par défaut (fallback systématique).
 */

import { resolveAnyEnumLabel } from '@/config/referentials/i18n/enum-labels.referential';

export type ReferentialLanguage = 'fr' | 'ar' | 'en';

export interface ReferentialLabel {
  code: string;
  fr: string;
  ar: string;
  en: string;
}

const label = (code: string, fr: string, ar: string, en: string): ReferentialLabel => ({
  code,
  fr,
  ar,
  en,
});

/** Normalise un code métier (accents, espaces, tirets, casse). */
export function normalizeReferentialCode(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
}

export const STATUS_LABELS: Record<string, ReferentialLabel> = {
  // ── Statuts génériques ────────────────────────────────────────────────
  active: label('active', 'Actif', 'نشط', 'Active'),
  inactive: label('inactive', 'Inactif', 'غير نشط', 'Inactive'),
  draft: label('draft', 'Brouillon', 'مسودة', 'Draft'),
  pending: label('pending', 'En attente', 'قيد الانتظار', 'Pending'),
  validated: label('validated', 'Validé', 'تم التحقق', 'Validated'),
  valide: label('valide', 'Validé', 'تم التحقق', 'Validated'),
  rejected: label('rejected', 'Rejeté', 'مرفوض', 'Rejected'),
  rejete: label('rejete', 'Rejeté', 'مرفوض', 'Rejected'),
  archived: label('archived', 'Archivé', 'مؤرشف', 'Archived'),
  completed: label('completed', 'Complété', 'مكتمل', 'Completed'),
  cancelled: label('cancelled', 'Annulé', 'ملغي', 'Canceled'),
  canceled: label('canceled', 'Annulé', 'ملغي', 'Canceled'),
  suspended: label('suspended', 'Suspendu', 'موقوف', 'Suspended'),

  not_started: label('not_started', 'Non commencé', 'لم يبدأ', 'Not started'),
  non_commence: label('non_commence', 'Non commencé', 'لم يبدأ', 'Not started'),
  delayed: label('delayed', 'En retard', 'متأخر', 'Delayed'),
  todo: label('todo', 'À faire', 'للتنفيذ', 'To do'),
  blocked: label('blocked', 'Bloqué', 'محجوب', 'Blocked'),
  on_hold: label('on_hold', 'En pause', 'متوقف مؤقتا', 'On hold'),
  scheduled: label('scheduled', 'Planifié', 'مبرمج', 'Scheduled'),
  overdue: label('overdue', 'En retard', 'متأخر', 'Overdue'),
  in_review: label('in_review', 'En révision', 'قيد المراجعة', 'In review'),

  // ── Statuts projet (codes DTO ProjectStatus, y compris legacy) ────────
  planned: label('planned', 'Planifié', 'مخطط', 'Planned'),
  planifie: label('planifie', 'Planifié', 'مخطط', 'Planned'),
  planifie_v2: label('planifie_v2', 'Planifié', 'مخطط', 'Planned'),
  pre_qualification: label('pre_qualification', 'Pré-qualification', 'التأهيل المسبق', 'Pre-qualification'),
  prequalification: label('prequalification', 'Pré-qualification', 'التأهيل المسبق', 'Pre-qualification'),
  en_attente: label('en_attente', 'En attente', 'قيد الانتظار', 'Pending'),
  enattente: label('enattente', 'En attente', 'قيد الانتظار', 'Pending'),
  en_conception: label('en_conception', 'En conception', 'قيد التصميم', 'In design'),
  enconception: label('enconception', 'En conception', 'قيد التصميم', 'In design'),
  attribue: label('attribue', 'Attribué', 'مخصص', 'Awarded'),
  attribue_v2: label('attribue_v2', 'Attribué', 'مخصص', 'Awarded'),
  en_cours: label('en_cours', 'En cours', 'جاري العمل', 'In progress'),
  encours: label('encours', 'En cours', 'جاري العمل', 'In progress'),
  en_cours_v2: label('en_cours_v2', 'En cours', 'جاري العمل', 'In progress'),
  in_progress: label('in_progress', 'En cours', 'جاري العمل', 'In progress'),
  en_construction: label('en_construction', 'En construction', 'قيد الإنشاء', 'Under construction'),
  enconstruction: label('enconstruction', 'En construction', 'قيد الإنشاء', 'Under construction'),
  en_construction_v2: label('en_construction_v2', 'En construction', 'قيد الإنشاء', 'Under construction'),
  en_inspection: label('en_inspection', 'En inspection', 'قيد التفتيش', 'Under inspection'),
  eninspection: label('eninspection', 'En inspection', 'قيد التفتيش', 'Under inspection'),
  en_inspection_v2: label('en_inspection_v2', 'En inspection', 'قيد التفتيش', 'Under inspection'),
  en_review: label('en_review', 'En révision', 'قيد المراجعة', 'Under review'),
  termine: label('termine', 'Terminé', 'منتهي', 'Completed'),
  termine_v2: label('termine_v2', 'Terminé', 'منتهي', 'Completed'),
  en_cloture: label('en_cloture', 'En clôture', 'قيد الإغلاق', 'Closing'),
  encloture: label('encloture', 'En clôture', 'قيد الإغلاق', 'Closing'),
  en_cloture_v2: label('en_cloture_v2', 'En clôture', 'قيد الإغلاق', 'Closing'),
  suspendu: label('suspendu', 'Suspendu', 'موقوف', 'Suspended'),
  suspendu_v2: label('suspendu_v2', 'Suspendu', 'موقوف', 'Suspended'),
  en_retard: label('en_retard', 'En retard', 'متأخر', 'Delayed'),
  enretard: label('enretard', 'En retard', 'متأخر', 'Delayed'),
  en_retard_v2: label('en_retard_v2', 'En retard', 'متأخر', 'Delayed'),
  annule: label('annule', 'Annulé', 'ملغي', 'Canceled'),
  annule_v2: label('annule_v2', 'Annulé', 'ملغي', 'Canceled'),

  // ── Workflow DQE → Devis → Contrat → Décompte → Facture ──────────────
  pour_validation: label('pour_validation', 'Pour validation', 'للتحقق', 'For validation'),
  submitted: label('submitted', 'Soumis', 'تم الإرسال', 'Submitted'),
  soumis: label('soumis', 'Soumis', 'تم الإرسال', 'Submitted'),
  en_negociation: label('en_negociation', 'En négociation', 'قيد التفاوض', 'Under negotiation'),
  accepted: label('accepted', 'Accepté', 'مقبول', 'Accepted'),
  accepte: label('accepte', 'Accepté', 'مقبول', 'Accepted'),
  recu: label('recu', 'Reçu', 'مستلم', 'Received'),
  signed: label('signed', 'Signé', 'موقع', 'Signed'),
  signe: label('signe', 'Signé', 'موقع', 'Signed'),
  requested: label('requested', 'Demandé', 'مطلوب', 'Requested'),
  demande: label('demande', 'Demandé', 'مطلوب', 'Requested'),
  programmed: label('programmed', 'Programmé', 'مبرمج', 'Programmed'),
  programme: label('programme', 'Programmé', 'مبرمج', 'Programmed'),
  approved: label('approved', 'Approuvé', 'موافق عليه', 'Approved'),
  approuvee: label('approuvee', 'Approuvée', 'موافق عليه', 'Approved'),
  emitted: label('emitted', 'Émise', 'صادر', 'Emitted'),
  emise: label('emise', 'Émise', 'صادر', 'Emitted'),
  invoiced: label('invoiced', 'Facturé', 'مفوتر', 'Invoiced'),
  facture: label('facture', 'Facturé', 'مفوتر', 'Invoiced'),
  paid: label('paid', 'Payée', 'مدفوع', 'Paid'),
  paye: label('paye', 'Payée', 'مدفوع', 'Paid'),
  payee: label('payee', 'Payée', 'مدفوع', 'Paid'),

  // ── Appels d'offres ──────────────────────────────────────────────────
  published: label('published', 'Publié', 'منشور', 'Published'),
  open: label('open', 'Ouvert aux offres', 'مفتوح للعروض', 'Open for bids'),
  under_evaluation: label('under_evaluation', 'En évaluation', 'قيد التقييم', 'Under evaluation'),
  awarded: label('awarded', 'Attribué', 'مخصص', 'Awarded'),
  contracted: label('contracted', 'Contractualisé', 'تم التعاقد', 'Contracted'),
  closed: label('closed', 'Clôturé', 'مغلق', 'Closed'),

  // ── Inspections ──────────────────────────────────────────────────────
  modifications_requises: label('modifications_requises', 'Modifications requises', 'تعديلات مطلوبة', 'Changes requested'),
  rejetee: label('rejetee', 'Rejetée', 'مرفوض', 'Rejected'),

  // ── Codes ENUM PostgreSQL (T38) : document_status, supply_request_status,
  //    authorization_status, mission_status, vessel_status, movement_validation_status
  pending_review: label('pending_review', 'En attente de revue', 'قيد المراجعة', 'Pending review'),
  returned: label('returned', 'Retourné', 'أُعيد', 'Returned'),
  under_review: label('under_review', 'En cours d’examen', 'قيد الفحص', 'Under review'),
  in_transit: label('in_transit', 'En transit', 'قيد النقل', 'In transit'),
};


/** Étapes du cycle de passation (appels d'offres). */
export const TENDER_STEP_LABELS: Record<string, ReferentialLabel> = {
  identification: label('identification', 'Identification', 'تحديد', 'Identification'),
  framework_lots: label('framework_lots', 'Cadre & Lots', 'الإطار والدفعات', 'Framework & Lots'),
  lots: label('lots', 'Cadre & Lots', 'الإطار والدفعات', 'Framework & Lots'),
  dpao_docs: label('dpao_docs', 'DPAO & Pièces', 'وثائق العطاء', 'RFP & Documents'),
  dpao: label('dpao', 'DPAO & Pièces', 'وثائق العطاء', 'RFP & Documents'),
  planning: label('planning', 'Planning', 'التخطيط', 'Planning'),
  publication: label('publication', 'Publication', 'النشر', 'Publication'),
  evaluation: label('evaluation', 'Évaluation', 'التقييم', 'Evaluation'),
  attribution: label('attribution', 'Attribution', 'الإسناد', 'Award'),
};

/** Types de projets. */
export const PROJECT_TYPE_LABELS: Record<string, ReferentialLabel> = {
  construction: label('construction', 'Construction', 'بناء', 'Construction'),
  electrical: label('electrical', 'Électrique', 'كهربائي', 'Electrical'),
  electrification: label('electrification', 'Électrification', 'كهربة', 'Electrification'),
  infrastructure: label('infrastructure', 'Infrastructure', 'بنية تحتية', 'Infrastructure'),
  rehabilitation: label('rehabilitation', 'Réhabilitation', 'إعادة تأهيل', 'Rehabilitation'),
  maintenance: label('maintenance', 'Maintenance', 'صيانة', 'Maintenance'),
  study: label('study', 'Étude', 'دراسة', 'Study'),
  supply: label('supply', 'Fourniture', 'توريد', 'Supply'),
  services: label('services', 'Services', 'خدمات', 'Services'),
  other: label('other', 'Autre', 'أخرى', 'Other'),
};

/** Unités de mesure BOQ / métré. */
export const UNIT_LABELS: Record<string, ReferentialLabel> = {
  'm³': label('m³', 'm³ (volume)', 'م³ (حجم)', 'm³ (volume)'),
  'm²': label('m²', 'm² (surface)', 'م² (مساحة)', 'm² (area)'),
  m: label('m', 'm (linéaire)', 'م (طولي)', 'm (linear)'),
  unite: label('unite', 'unité', 'وحدة', 'unit'),
  jour: label('jour', 'jour (homme·jour)', 'يوم (رجل·يوم)', 'day (man-day)'),
  forfait: label('forfait', 'forfait', 'مقطوعية', 'lump sum'),
  kg: label('kg', 'kg', 'كغ', 'kg'),
  t: label('t', 'tonne', 'طن', 'ton'),
};

/** Étapes documentaires DQE → Facture (types de document). */
export const INVOICE_DOCUMENT_LABELS: Record<string, ReferentialLabel> = {
  dqe: label('dqe', 'DQE / Expression de besoin', 'كشف الكميات التقديري', 'BoQ / Requirement'),
  devis: label('devis', 'Devis', 'عرض سعر', 'Quotation'),
  contrat: label('contrat', 'Contrat', 'عقد', 'Contract'),
  decompte: label('decompte', 'Décompte', 'كشف حسابي', 'Statement'),
  facture_doc: label('facture_doc', 'Facture finale', 'الفاتورة النهائية', 'Final invoice'),
};

/** Rôles applicatifs. */
export const ROLE_LABELS: Record<string, ReferentialLabel> = {
  // Codes ENUM public.user_role (T38)
  insurance_company: label('insurance_company', 'Compagnie d’assurance', 'شركة تأمين', 'Insurance company'),
  practitioner: label('practitioner', 'Praticien', 'ممارس', 'Practitioner'),
  patient: label('patient', 'Patient', 'مريض', 'Patient'),
  agent: label('agent', 'Agent', 'وكيل', 'Agent'),

  admin: label('admin', 'Administrateur', 'مدير النظام', 'Administrator'),
  director: label('director', 'Directeur', 'مدير', 'Director'),
  manager: label('manager', 'Chef de projet', 'مدير المشروع', 'Project manager'),
  consultant: label('consultant', 'Consultant', 'مستشار', 'Consultant'),
  supplier: label('supplier', 'Fournisseur', 'مورد', 'Supplier'),
  inspector: label('inspector', 'Inspecteur', 'مفتش', 'Inspector'),
  employee: label('employee', 'Employé', 'موظف', 'Employee'),
  user: label('user', 'Utilisateur', 'مستخدم', 'User'),
};

/** Dimensions/règles d'écart (DeviationEngine). */
export const DEVIATION_LABELS: Record<string, ReferentialLabel> = {
  duration_deviation: label('duration_deviation', 'Écart de durée', 'فارق المدة', 'Duration deviation'),
  cost_deviation_pct: label('cost_deviation_pct', 'Écart de coût (%)', 'فارق التكلفة (%)', 'Cost deviation (%)'),
  progress_deviation_pts: label('progress_deviation_pts', "Écart d'avancement (pts)", 'فارق التقدم (نقاط)', 'Progress gap (pts)'),
  profit_margin_eter: label('profit_margin_eter', 'Marge bénéficiaire hors cible', 'هامش الربح خارج الهدف', 'Profit margin off target'),
  info: label('info', 'Information', 'معلومة', 'Info'),
  low: label('low', 'Faible', 'منخفض', 'Low'),
  medium: label('medium', 'Moyen', 'متوسط', 'Medium'),
  high: label('high', 'Élevé', 'مرتفع', 'High'),
};

/** Catégories de documents / d'appels d'offres. */
export const CATEGORY_LABELS: Record<string, ReferentialLabel> = {
  administrative: label('administrative', 'Administratif', 'إداري', 'Administrative'),
  technical: label('technical', 'Technique', 'فني', 'Technical'),
  financial: label('financial', 'Financier', 'مالي', 'Financial'),
  compliance: label('compliance', 'Conformité', 'المطابقة', 'Compliance'),
  inspection: label('inspection', 'Inspections & Rapports', 'التفتيش والتقارير', 'Inspections & Reports'),
  tender: label('tender', "Appels d'offres", 'العطاءات', 'Tenders'),
  delivery: label('delivery', 'Livraisons', 'التسليمات', 'Deliveries'),
  media: label('media', 'Photos & Médias', 'الصور والوسائط', 'Photos & Media'),
  hr: label('hr', 'Ressources humaines', 'الموارد البشرية', 'Human resources'),
  // Codes ENUM public.applicant_type
  company: label('company', 'Personne morale (entreprise)', 'شخص اعتباري (شركة)', 'Company'),
  individual: label('individual', 'Personne physique', 'شخص طبيعي', 'Individual'),
  other: label('other', 'Autres', 'أخرى', 'Other'),
};


/** Priorités (tâches, jalons, conformité, risques). */
export const PRIORITY_LABELS: Record<string, ReferentialLabel> = {
  low: label('low', 'Faible', 'منخفضة', 'Low'),
  basse: label('basse', 'Faible', 'منخفضة', 'Low'),
  faible: label('faible', 'Faible', 'منخفضة', 'Low'),
  medium: label('medium', 'Moyenne', 'متوسطة', 'Medium'),
  moyenne: label('moyenne', 'Moyenne', 'متوسطة', 'Medium'),
  normal: label('normal', 'Normale', 'عادية', 'Normal'),
  normale: label('normale', 'Normale', 'عادية', 'Normal'),
  high: label('high', 'Élevée', 'مرتفعة', 'High'),
  haute: label('haute', 'Élevée', 'مرتفعة', 'High'),
  elevee: label('elevee', 'Élevée', 'مرتفعة', 'High'),
  urgent: label('urgent', 'Urgente', 'عاجلة', 'Urgent'),
  critical: label('critical', 'Critique', 'حرجة', 'Critical'),
  critique: label('critique', 'Critique', 'حرجة', 'Critical'),
};

/** Sévérités (alertes, écarts, notifications). */
export const SEVERITY_LABELS: Record<string, ReferentialLabel> = {
  info: label('info', 'Information', 'معلومة', 'Info'),
  success: label('success', 'Succès', 'نجاح', 'Success'),
  low: label('low', 'Faible', 'منخفضة', 'Low'),
  warning: label('warning', 'Avertissement', 'تحذير', 'Warning'),
  medium: label('medium', 'Moyenne', 'متوسطة', 'Medium'),
  high: label('high', 'Élevée', 'مرتفعة', 'High'),
  error: label('error', 'Erreur', 'خطأ', 'Error'),
  critical: label('critical', 'Critique', 'حرجة', 'Critical'),
  blocker: label('blocker', 'Bloquant', 'حاجز', 'Blocker'),
};

/** Types de documents et d'alertes affichés dans les tableaux de bord. */
export const DOCUMENT_TYPE_LABELS: Record<string, ReferentialLabel> = {
  // Codes ENUM public.document_type (T38)
  inspection_report: label('inspection_report', 'Rapport d’inspection', 'تقرير التفتيش', 'Inspection report'),
  location_photo: label('location_photo', 'Photo de site', 'صورة الموقع', 'Site photo'),
  project_report: label('project_report', 'Rapport de projet', 'تقرير المشروع', 'Project report'),
  supplier_info: label('supplier_info', 'Information fournisseur', 'معلومات المورد', 'Supplier information'),
  task_assignment: label('task_assignment', 'Affectation de tâche', 'تعيين مهمة', 'Task assignment'),
  employee_record: label('employee_record', 'Dossier employé', 'ملف الموظف', 'Employee record'),
  supplier_catalog: label('supplier_catalog', 'Catalogue fournisseur', 'كتالوج المورد', 'Supplier catalog'),
  tender: label('tender', 'Appel d’offres', 'عطاء', 'Tender'),

  // Codes ENUM public.document_category
  construction_permit: label('construction_permit', 'Permis de construire', 'رخصة البناء', 'Construction permit'),
  property_cadastre: label('property_cadastre', 'Titre foncier / cadastre', 'الرسم العقاري / المسح', 'Property title / cadastre'),
  distribution_license: label('distribution_license', 'Licence de distribution', 'رخصة التوزيع', 'Distribution license'),
  environmental_study: label('environmental_study', 'Étude environnementale', 'الدراسة البيئية', 'Environmental study'),
  safety_assessment: label('safety_assessment', 'Évaluation de sécurité', 'تقييم السلامة', 'Safety assessment'),



  contract: label('contract', 'Contrat', 'عقد', 'Contract'),
  contrat: label('contrat', 'Contrat', 'عقد', 'Contract'),
  invoice: label('invoice', 'Facture', 'فاتورة', 'Invoice'),
  report: label('report', 'Rapport', 'تقرير', 'Report'),
  plan: label('plan', 'Plan', 'مخطط', 'Plan'),
  permit: label('permit', 'Autorisation', 'ترخيص', 'Permit'),
  guarantee: label('guarantee', 'Garantie bancaire', 'ضمان بنكي', 'Bank guarantee'),
  insurance: label('insurance', 'Assurance', 'تأمين', 'Insurance'),
  payment: label('payment', 'Paiement', 'دفعة', 'Payment'),
  milestone: label('milestone', 'Jalon', 'مرحلة رئيسية', 'Milestone'),
  task: label('task', 'Tâche', 'مهمة', 'Task'),
  phase: label('phase', 'Phase', 'مرحلة', 'Phase'),
  step: label('step', 'Étape', 'خطوة', 'Step'),
  inspection: label('inspection', 'Inspection', 'تفتيش', 'Inspection'),
  photo: label('photo', 'Photo', 'صورة', 'Photo'),
  budget: label('budget', 'Budget', 'ميزانية', 'Budget'),
  delay: label('delay', 'Retard', 'تأخير', 'Delay'),
  other: label('other', 'Autre', 'أخرى', 'Other'),
};

/** Départements / entités organisationnelles. */
export const DEPARTMENT_LABELS: Record<string, ReferentialLabel> = {
  technical: label('technical', 'Technique', 'فني', 'Technical'),
  finance: label('finance', 'Finances', 'المالية', 'Finance'),
  procurement: label('procurement', 'Achats & Marchés', 'المشتريات', 'Procurement'),
  hr: label('hr', 'Ressources humaines', 'الموارد البشرية', 'Human resources'),
  operations: label('operations', 'Opérations', 'العمليات', 'Operations'),
  quality: label('quality', 'Qualité', 'الجودة', 'Quality'),
  hse: label('hse', 'HSE', 'الصحة والسلامة', 'HSE'),
  management: label('management', 'Direction', 'الإدارة', 'Management'),
  other: label('other', 'Autre', 'أخرى', 'Other'),
};

/**
 * Glossaire métier (T36) — termes techniques ou anglicismes affichés dans l'UI.
 * « WBS » n'est pas explicite pour un francophone : le libellé long est utilisé
 * pour les titres/labels, le libellé court pour les onglets et colonnes denses.
 */
export const GLOSSARY_LABELS: Record<string, ReferentialLabel> = {
  wbs: label('wbs', 'Structure de découpage des travaux', 'هيكل تقسيم العمل', 'Work Breakdown Structure'),
  wbs_short: label('wbs_short', 'Découpage des travaux', 'تقسيم الأعمال', 'Work breakdown'),
  wbs_phase: label('wbs_phase', 'Phase de découpage', 'مرحلة التقسيم', 'Breakdown phase'),
  wbs_classification: label('wbs_classification', 'Classification du découpage des travaux', 'تصنيف تقسيم الأعمال', 'Work breakdown classification'),
  wbs_unassigned: label('wbs_unassigned', 'Hors découpage des travaux (à affecter)', 'خارج تقسيم الأعمال (للتعيين)', 'Outside work breakdown (to assign)'),
  phase: label('phase', 'Phase', 'مرحلة', 'Phase'),
  milestone: label('milestone', 'Jalon', 'مرحلة رئيسية', 'Milestone'),
  task: label('task', 'Tâche', 'مهمة', 'Task'),
  boq: label('boq', 'Devis quantitatif estimatif (DQE)', 'كشف الكميات التقديري', 'Bill of Quantities (BoQ)'),
  takeoff: label('takeoff', 'Métré', 'حصر الكميات', 'Quantity takeoff'),
};

/** Registre global des dictionnaires de labels métier. */
export const REFERENTIAL_LABEL_REGISTRY = {
  status: STATUS_LABELS,
  glossary: GLOSSARY_LABELS,
  tenderStep: TENDER_STEP_LABELS,

  projectType: PROJECT_TYPE_LABELS,
  unit: UNIT_LABELS,
  invoiceDocument: INVOICE_DOCUMENT_LABELS,
  role: ROLE_LABELS,
  deviation: DEVIATION_LABELS,
  category: CATEGORY_LABELS,
  priority: PRIORITY_LABELS,
  severity: SEVERITY_LABELS,
  documentType: DOCUMENT_TYPE_LABELS,
  department: DEPARTMENT_LABELS,
} as const;

export type ReferentialLabelDomain = keyof typeof REFERENTIAL_LABEL_REGISTRY;

/** Résout un libellé traduit avec fallback français puis code brut. */
export function resolveReferentialLabel(
  domain: ReferentialLabelDomain,
  code: string | null | undefined,
  language: ReferentialLanguage = 'fr'
): string {
  if (!code) return '';
  const dictionary = REFERENTIAL_LABEL_REGISTRY[domain] as Record<string, ReferentialLabel>;
  const entry = dictionary[code] ?? dictionary[normalizeReferentialCode(code)];
  if (!entry) {
    // Filet de sécurité : libellé issu du référentiel des ENUM (fr/ar/en) avant
    // tout affichage d'un code technique brut.
    return resolveAnyEnumLabel(code, language) ?? resolveAnyEnumLabel(normalizeReferentialCode(code), language) ?? code;
  }
  return entry[language] || entry.fr;
}
