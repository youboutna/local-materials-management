/**
 * RÉFÉRENTIEL — Libellés multilingues des ENUM (généré par scripts/enum-labels-gen.cjs).
 *
 * Doctrine i18n : l'ENUM porte le CODE TECHNIQUE unique (source de vérité, jamais traduit),
 * ce référentiel porte les LIBELLÉS fr/ar/en affichés dans l'UI.
 * Ne pas éditer à la main : relancer `node scripts/enum-labels-gen.cjs`.
 */

export type SupportedLang = 'fr' | 'ar' | 'en';

export interface EnumLabel {
    readonly fr: string;
    readonly ar: string;
    readonly en: string;
}

export type EnumLabelMap = Readonly<Record<string, EnumLabel>>;

/** AuthProvider — src/domain/entities/AuthUser.ts */
export const AUTH_PROVIDER_LABELS: EnumLabelMap = {
    'supabase': { fr: 'Supabase', ar: 'سوبابيز', en: 'Supabase' },
    'keycloak': { fr: 'Keycloak', ar: 'كيكلوك', en: 'Keycloak' },
    'auth0': { fr: 'Auth0', ar: 'أوث0', en: 'Auth0' },
    'database': { fr: 'Base de données', ar: 'قاعدة بيانات', en: 'Database' },
};

/** AuthUserStatus — src/domain/entities/AuthUser.ts */
export const AUTH_USER_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Actif', ar: 'نشط', en: 'Active' },
    'inactive': { fr: 'Inactif', ar: 'غير نشط', en: 'Inactive' },
    'suspended': { fr: 'Suspendu', ar: 'معلق', en: 'Suspended' },
    'pending': { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
};

/** CommonStatus — src/dtos/shared.ts */
export const COMMON_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Actif', ar: 'نشط', en: 'Active' },
    'inactive': { fr: 'Inactif', ar: 'غير نشط', en: 'Inactive' },
    'pending': { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
    'completed': { fr: 'Terminé', ar: 'مكتمل', en: 'Completed' },
    'cancelled': { fr: 'Annulé', ar: 'ملغى', en: 'Cancelled' },
    'draft': { fr: 'Brouillon', ar: 'مسودة', en: 'Draft' },
};

/** DocumentPriority — src/domain/entities/Document.ts */
export const DOCUMENT_PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Basse', ar: 'منخفضة', en: 'Low' },
    'medium': { fr: 'Moyenne', ar: 'متوسطة', en: 'Medium' },
    'high': { fr: 'Haute', ar: 'عالية', en: 'High' },
    'urgent': { fr: 'Urgent', ar: 'عاجلة', en: 'Urgent' },
};

/** DocumentStatus — src/domain/entities/Document.ts */
export const DOCUMENT_STATUS_LABELS: EnumLabelMap = {
    'draft': { fr: 'Brouillon', ar: 'مسودة', en: 'Draft' },
    'pending_approval': { fr: 'En attente d\'approbation', ar: 'بانتظار الموافقة', en: 'Pending Approval' },
    'pending_review': { fr: 'En attente de révision', ar: 'قيد المراجعة', en: 'Pending Review' },
    'approved': { fr: 'Approuvé', ar: 'معتمد', en: 'Approved' },
    'rejected': { fr: 'Rejeté', ar: 'مرفوض', en: 'Rejected' },
    'archived': { fr: 'Archivé', ar: 'مؤرشف', en: 'Archived' },
    'expired': { fr: 'Expiré', ar: 'منتهي الصلاحية', en: 'Expired' },
    'deprecated': { fr: 'Obsolète', ar: 'مُلغى', en: 'Deprecated' },
};

/** DocumentType — src/domain/entities/Document.ts */
export const DOCUMENT_TYPE_LABELS: EnumLabelMap = {
    'contract': { fr: 'Contrat', ar: 'عقد', en: 'Contract' },
    'plan': { fr: 'Plan', ar: 'خطة', en: 'Plan' },
    'specification': { fr: 'Spécification', ar: 'مواصفات', en: 'Specification' },
    'report': { fr: 'Rapport', ar: 'تقرير', en: 'Report' },
    'certificate': { fr: 'Certificat', ar: 'شهادة', en: 'Certificate' },
    'permit': { fr: 'Permis', ar: 'تصريح', en: 'Permit' },
    'invoice': { fr: 'Facture', ar: 'فاتورة', en: 'Invoice' },
    'receipt': { fr: 'Reçu', ar: 'إيصال', en: 'Receipt' },
    'manual': { fr: 'Manuel', ar: 'دليل', en: 'Manual' },
    'policy': { fr: 'Politique', ar: 'سياسة', en: 'Policy' },
    'procedure': { fr: 'Procédure', ar: 'إجراء', en: 'Procedure' },
    'drawing': { fr: 'Dessin', ar: 'رسم', en: 'Drawing' },
    'photo': { fr: 'Photo', ar: 'صورة', en: 'Photo' },
    'video': { fr: 'Vidéo', ar: 'فيديو', en: 'Video' },
    'blueprint': { fr: 'Plan d\'exécution', ar: 'مخطط تنفيذي', en: 'Blueprint' },
    'schema': { fr: 'Schéma', ar: 'مخطط بياني', en: 'Diagram' },
    'checklist': { fr: 'Liste de contrôle', ar: 'قائمة تدقيق', en: 'Checklist' },
    'form': { fr: 'Formulaire', ar: 'نموذج', en: 'Form' },
    'template': { fr: 'Modèle', ar: 'قالب', en: 'Template' },
    'pv': { fr: 'PV', ar: 'محضر', en: 'Minutes' },
    'service_report': { fr: 'Rapport de service', ar: 'تقرير خدمة', en: 'Service Report' },
    'tender_document': { fr: 'Document d\'appel d\'offres', ar: 'وثيقة مناقصة', en: 'Tender Document' },
    'supporting_document': { fr: 'Pièce justificative', ar: 'وثيقة داعمة', en: 'Supporting Document' },
    'correspondence': { fr: 'Correspondance', ar: 'مراسلات', en: 'Correspondence' },
    'insurance': { fr: 'Assurance', ar: 'تأمين', en: 'Insurance' },
    'warranty': { fr: 'Garantie', ar: 'ضمان', en: 'Warranty' },
    'bank_guarantee': { fr: 'Garantie bancaire', ar: 'ضمان بنكي', en: 'Bank Guarantee' },
    'other': { fr: 'Autre', ar: 'أخرى', en: 'Other' },
};

/** EmployeeDepartment — src/dtos/entities/EmployeeDTO.ts */
export const EMPLOYEE_DEPARTMENT_LABELS: EnumLabelMap = {
    'engineering': { fr: 'Ingénierie', ar: 'هندسة', en: 'Engineering' },
    'design': { fr: 'Conception', ar: 'تصميم', en: 'Design' },
    'project_management': { fr: 'Gestion de projet', ar: 'إدارة المشاريع', en: 'Project Management' },
    'quality_assurance': { fr: 'Assurance qualité', ar: 'ضمان الجودة', en: 'Quality Assurance' },
    'operations': { fr: 'Opérations', ar: 'عمليات', en: 'Operations' },
    'finance': { fr: 'Finance', ar: 'مالية', en: 'Finance' },
    'human_resources': { fr: 'Ressources humaines', ar: 'موارد بشرية', en: 'Human Resources' },
    'marketing': { fr: 'Marketing', ar: 'تسويق', en: 'Marketing' },
    'sales': { fr: 'Ventes', ar: 'مبيعات', en: 'Sales' },
    'administration': { fr: 'Administration', ar: 'إدارة', en: 'Administration' },
    'legal': { fr: 'Juridique', ar: 'شؤون قانونية', en: 'Legal' },
    'procurement': { fr: 'Achats', ar: 'مشتريات', en: 'Procurement' },
    'maintenance': { fr: 'Maintenance', ar: 'صيانة', en: 'Maintenance' },
    'security': { fr: 'Sécurité', ar: 'أمن', en: 'Security' },
};

/** EmployeeRole — src/dtos/entities/EmployeeDTO.ts */
export const EMPLOYEE_ROLE_LABELS: EnumLabelMap = {
    'project_manager': { fr: 'Chef de projet', ar: 'مدير مشروع', en: 'Project Manager' },
    'team_lead': { fr: 'Chef d\'équipe', ar: 'رئيس فريق', en: 'Team Lead' },
    'developer': { fr: 'Développeur', ar: 'مطور', en: 'Developer' },
    'designer': { fr: 'Designer', ar: 'مصمم', en: 'Designer' },
    'analyst': { fr: 'Analyste', ar: 'محلل', en: 'Analyst' },
    'tester': { fr: 'Testeur', ar: 'فاحص', en: 'Tester' },
    'architect': { fr: 'Architecte', ar: 'مهندس معماري', en: 'Architect' },
    'consultant': { fr: 'Consultant', ar: 'مستشار', en: 'Consultant' },
    'specialist': { fr: 'Spécialiste', ar: 'أخصائي', en: 'Specialist' },
    'coordinator': { fr: 'Coordinateur', ar: 'منسق', en: 'Coordinator' },
    'supervisor': { fr: 'Superviseur', ar: 'مشرف', en: 'Supervisor' },
    'manager': { fr: 'Manager', ar: 'مدير', en: 'Manager' },
};

/** EmployeeStatus — src/dtos/entities/EmployeeDTO.ts */
export const EMPLOYEE_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Actif', ar: 'فعّال', en: 'Active' },
    'inactive': { fr: 'Inactif', ar: 'غير فعّال', en: 'Inactive' },
    'on_leave': { fr: 'En congé', ar: 'في إجازة', en: 'On Leave' },
    'terminated': { fr: 'Licencié', ar: 'مُنهى خدماته', en: 'Terminated' },
    'suspended': { fr: 'Suspendu', ar: 'موقوف', en: 'Suspended' },
};

/** EmployeeType — src/dtos/entities/EmployeeDTO.ts */
export const EMPLOYEE_TYPE_LABELS: EnumLabelMap = {
    'full_time': { fr: 'Temps plein', ar: 'دوام كامل', en: 'Full-Time' },
    'part_time': { fr: 'Temps partiel', ar: 'دوام جزئي', en: 'Part-Time' },
    'contract': { fr: 'Contractuel', ar: 'عقد', en: 'Contract' },
    'intern': { fr: 'Stagiaire', ar: 'متدرب', en: 'Intern' },
    'consultant': { fr: 'Consultant', ar: 'مستشار', en: 'Consultant' },
};

/** InspectionPriority — src/dtos/entities/InspectionDTO.ts */
export const INSPECTION_PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Faible', ar: 'منخفضة', en: 'Low' },
    'medium': { fr: 'Moyenne', ar: 'متوسطة', en: 'Medium' },
    'high': { fr: 'Élevée', ar: 'عالية', en: 'High' },
    'urgent': { fr: 'Urgente', ar: 'عاجلة', en: 'Urgent' },
};

/** InspectionStatus — src/dtos/entities/InspectionDTO.ts */
export const INSPECTION_STATUS_LABELS: EnumLabelMap = {
    'scheduled': { fr: 'Programmé', ar: 'مجدولة', en: 'Scheduled' },
    'pending': { fr: 'En attente', ar: 'معلقة', en: 'Pending' },
    'planned': { fr: 'Planifié', ar: 'مخطط لها', en: 'Planned' },
    'in_progress': { fr: 'En cours', ar: 'قيد التنفيذ', en: 'In Progress' },
    'completed': { fr: 'Terminé', ar: 'مكتملة', en: 'Completed' },
    'requires_review': { fr: 'Requiert révision', ar: 'تتطلب مراجعة', en: 'Requires Review' },
    'requires_changes': { fr: 'À modifier', ar: 'يتطلب تعديلات', en: 'Requires Changes' },
    'approved': { fr: 'Approuvée', ar: 'معتمدة', en: 'Approved' },
    'rejected': { fr: 'Rejetée', ar: 'مرفوضة', en: 'Rejected' },
    'cancelled': { fr: 'Annulée', ar: 'ملغاة', en: 'Cancelled' },
};

/** InspectionType — src/dtos/entities/InspectionDTO.ts */
export const INSPECTION_TYPE_LABELS: EnumLabelMap = {
    'routine': { fr: 'Régulière', ar: 'روتينية', en: 'Routine' },
    'special': { fr: 'Spéciale', ar: 'خاصة', en: 'Special' },
    'safety': { fr: 'Sécurité', ar: 'سلامة', en: 'Safety' },
    'quality': { fr: 'Qualité', ar: 'جودة', en: 'Quality' },
    'compliance': { fr: 'Conformité', ar: 'امتثال', en: 'Compliance' },
};

/** MaterialStatus — src/dtos/entities/MaterialDTO.ts */
export const MATERIAL_STATUS_LABELS: EnumLabelMap = {
    'available': { fr: 'Disponible', ar: 'متوفر', en: 'Available' },
    'out_of_stock': { fr: 'En rupture de stock', ar: 'نفد المخزون', en: 'Out of Stock' },
    'discontinued': { fr: 'Arrêté', ar: 'متوقف', en: 'Discontinued' },
    'on_order': { fr: 'En commande', ar: 'قيد الطلب', en: 'On Order' },
    'reserved': { fr: 'Réservé', ar: 'محجوز', en: 'Reserved' },
    'damaged': { fr: 'Endommagé', ar: 'تالف', en: 'Damaged' },
};

/** MaterialUnit — src/dtos/entities/MaterialDTO.ts */
export const MATERIAL_UNIT_LABELS: EnumLabelMap = {
    'pieces': { fr: 'Pièces', ar: 'قطعة', en: 'Pieces' },
    'kilograms': { fr: 'Kilogrammes', ar: 'كيلوغرام', en: 'Kilograms' },
    'meters': { fr: 'Mètres', ar: 'متر', en: 'Meters' },
    'liters': { fr: 'Litres', ar: 'لتر', en: 'Liters' },
    'square_meters': { fr: 'Mètres carrés', ar: 'متر مربع', en: 'Square Meters' },
    'cubic_meters': { fr: 'Mètres cubes', ar: 'متر مكعب', en: 'Cubic Meters' },
    'tons': { fr: 'Tonnes', ar: 'طن', en: 'Tons' },
    'bags': { fr: 'Sacs', ar: 'كيس', en: 'Bags' },
    'boxes': { fr: 'Boîtes', ar: 'صندوق', en: 'Boxes' },
    'rolls': { fr: 'Rouleaux', ar: 'لفة', en: 'Rolls' },
    'sets': { fr: 'Lots', ar: 'طقم', en: 'Sets' },
};

/** PaymentStatusEnum — src/application/services/PaymentService.ts */
export const PAYMENT_STATUS_ENUM_LABELS: EnumLabelMap = {
    'pending': { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
    'approved': { fr: 'Approuvé', ar: 'معتمد', en: 'Approved' },
    'processed': { fr: 'Traité', ar: 'معالج', en: 'Processed' },
    'completed': { fr: 'Terminé', ar: 'مكتمل', en: 'Completed' },
    'failed': { fr: 'Échoué', ar: 'فاشل', en: 'Failed' },
    'blocked': { fr: 'Bloqué', ar: 'محظور', en: 'Blocked' },
    'rejected': { fr: 'Rejeté', ar: 'مرفوض', en: 'Rejected' },
    'cancelled': { fr: 'Annulé', ar: 'ملغى', en: 'Canceled' },
};

/** PhasePriority — src/dtos/entities/PhaseDTO.ts */
export const PHASE_PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Faible', ar: 'منخفضة', en: 'Low' },
    'medium': { fr: 'Moyenne', ar: 'متوسطة', en: 'Medium' },
    'high': { fr: 'Élevée', ar: 'عالية', en: 'High' },
    'urgent': { fr: 'Urgente', ar: 'عاجلة', en: 'Urgent' },
};

/** PhaseStatus — src/dtos/entities/PhaseDTO.ts */
export const PHASE_STATUS_LABELS: EnumLabelMap = {
    'pending': { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
    'in_progress': { fr: 'En cours', ar: 'قيد الإنجاز', en: 'In Progress' },
    'completed': { fr: 'Terminée', ar: 'مكتملة', en: 'Completed' },
    'delayed': { fr: 'Retardée', ar: 'متأخرة', en: 'Delayed' },
    'cancelled': { fr: 'Annulée', ar: 'ملغاة', en: 'Cancelled' },
};

/** PhaseType — src/dtos/entities/PhaseDTO.ts */
export const PHASE_TYPE_LABELS: EnumLabelMap = {
    'foundation': { fr: 'Fondations', ar: 'أساسات', en: 'Foundation' },
    'structural': { fr: 'Structurel', ar: 'إنشاء الهيكل', en: 'Structural' },
    'excavation': { fr: 'Excavation', ar: 'حفريات', en: 'Excavation' },
    'demolition': { fr: 'Démolition', ar: 'هدم', en: 'Demolition' },
    'finishing': { fr: 'Finition', ar: 'تشطيبات', en: 'Finishing' },
    'electrical': { fr: 'Électricité', ar: 'كهرباء', en: 'Electrical' },
    'plumbing': { fr: 'Plomberie', ar: 'سباكة', en: 'Plumbing' },
    'hvac': { fr: 'Climatisation', ar: 'تكييف وتهوية', en: 'HVAC' },
    'roofing': { fr: 'Toiture', ar: 'تسقيف', en: 'Roofing' },
    'exterior': { fr: 'Extérieur', ar: 'أعمال خارجية', en: 'Exterior' },
    'interior': { fr: 'Intérieur', ar: 'أعمال داخلية', en: 'Interior' },
    'landscaping': { fr: 'Aménagement paysager', ar: 'تنسيق مواقع', en: 'Landscaping' },
};

/** PhaseWorkflowStep — src/dtos/workflows/PhaseWorkflowDTO.ts */
export const PHASE_WORKFLOW_STEP_LABELS: EnumLabelMap = {
    'planning': { fr: 'Planification', ar: 'تخطيط', en: 'Planning' },
    'execution': { fr: 'Exécution', ar: 'تنفيذ', en: 'Execution' },
    'review': { fr: 'Revue', ar: 'مراجعة', en: 'Review' },
    'completion': { fr: 'Achèvement', ar: 'إتمام', en: 'Completion' },
};

/** Priority — src/dtos/shared.ts */
export const PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Basse', ar: 'منخفضة', en: 'Low' },
    'medium': { fr: 'Moyenne', ar: 'متوسطة', en: 'Medium' },
    'high': { fr: 'Haute', ar: 'عالية', en: 'High' },
    'urgent': { fr: 'Urgente', ar: 'مستعجلة', en: 'Urgent' },
};

/** ProfileStatus — src/domain/entities/UserProfile.ts */
export const PROFILE_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Actif', ar: 'نشط', en: 'Active' },
    'inactive': { fr: 'Inactif', ar: 'غير نشط', en: 'Inactive' },
    'suspended': { fr: 'Suspendu', ar: 'معلق', en: 'Suspended' },
    'pending_verification': { fr: 'Vérification en attente', ar: 'بانتظار التحقق', en: 'Pending Verification' },
};

/** ProjectStatus — src/dtos/entities/ProjectDTO.ts */
export const PROJECT_STATUS_LABELS: EnumLabelMap = {
    'draft': { fr: 'Brouillon', ar: 'مسودة', en: 'Draft' },
    'planned': { fr: 'Planifié', ar: 'مخطط', en: 'Planned' },
    'pre_qualification': { fr: 'Pré-qualification', ar: 'تأهيل مبدئي', en: 'Pre-Qualification' },
    'en_attente': { fr: 'En attente', ar: 'قيد الانتظار', en: 'On Hold' },
    'en_conception': { fr: 'En conception', ar: 'قيد التصميم', en: 'In Design' },
    'planifie_v2': { fr: 'Planifié', ar: 'مخطط', en: 'Planned' },
    'attribue_v2': { fr: 'Attribué', ar: 'مُسند', en: 'Assigned' },
    'en_cours_v2': { fr: 'En cours', ar: 'قيد التنفيذ', en: 'In Progress' },
    'en_construction_v2': { fr: 'En construction', ar: 'قيد الإنشاء', en: 'Under Construction' },
    'en_inspection_v2': { fr: 'En inspection', ar: 'تحت الفحص', en: 'Under Inspection' },
    'en_review': { fr: 'En révision', ar: 'قيد المراجعة', en: 'Under Review' },
    'termine_v2': { fr: 'Terminé', ar: 'منتهٍ', en: 'Completed' },
    'en_cloture_v2': { fr: 'En clôture', ar: 'قيد الإغلاق', en: 'Closing' },
    'completed': { fr: 'Terminé', ar: 'مكتمل', en: 'Completed' },
    'suspendu_v2': { fr: 'Suspendu', ar: 'معلق', en: 'Suspended' },
    'en_retard_v2': { fr: 'En retard', ar: 'متأخر', en: 'Delayed' },
    'annule_v2': { fr: 'Annulé', ar: 'ملغى', en: 'Canceled' },
    'cancelled': { fr: 'Annulé', ar: 'ملغى', en: 'Canceled' },
    'enCours': { fr: 'En cours', ar: 'قيد التنفيذ', en: 'In Progress' },
    'termine': { fr: 'Terminé', ar: 'منتهٍ', en: 'Completed' },
    'enAttente': { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
    'enInspection': { fr: 'En inspection', ar: 'تحت الفحص', en: 'Under Inspection' },
    'suspendu': { fr: 'Suspendu', ar: 'معلق', en: 'Suspended' },
    'annule': { fr: 'Annulé', ar: 'ملغى', en: 'Canceled' },
    'attribue': { fr: 'Attribué', ar: 'مُسنَد', en: 'Awarded' },
    'planifie': { fr: 'Planifié', ar: 'مخطط له', en: 'Planned' },
    'preQualification': { fr: 'Pré-qualification', ar: 'تأهيل مبدئي', en: 'Prequalification' },
    'enConception': { fr: 'En conception', ar: 'قيد التصميم', en: 'In Design' },
    'enConstruction': { fr: 'En construction', ar: 'قيد الإنشاء', en: 'Under Construction' },
    'enCloture': { fr: 'En clôture', ar: 'قيد الإغلاق', en: 'Closing' },
    'enRetard': { fr: 'En retard', ar: 'متأخر', en: 'Delayed' },
};

/** ProjectType — src/dtos/entities/ProjectDTO.ts */
export const PROJECT_TYPE_LABELS: EnumLabelMap = {
    'residential': { fr: 'Résidentiel', ar: 'سكني', en: 'Residential' },
    'commercial': { fr: 'Commercial', ar: 'تجاري', en: 'Commercial' },
    'industrial': { fr: 'Industriel', ar: 'صناعي', en: 'Industrial' },
    'infrastructure': { fr: 'Infrastructure', ar: 'بنية تحتية', en: 'Infrastructure' },
    'renovation': { fr: 'Rénovation', ar: 'تجديد', en: 'Renovation' },
    'maintenance': { fr: 'Maintenance', ar: 'صيانة', en: 'Maintenance' },
};

/** ReceptionStatus — src/dtos/entities/ReceptionDTO.ts */
export const RECEPTION_STATUS_LABELS: EnumLabelMap = {
    'pending': { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
    'in_progress': { fr: 'En cours', ar: 'قيد التقدم', en: 'In Progress' },
    'approved': { fr: 'Approuvé', ar: 'معتمد', en: 'Approved' },
    'rejected': { fr: 'Rejeté', ar: 'مرفوض', en: 'Rejected' },
    'require_resubmission': { fr: 'À soumettre à nouveau', ar: 'يتطلب إعادة تقديم', en: 'Resubmission Required' },
};

/** ReceptionType — src/dtos/entities/ReceptionDTO.ts */
export const RECEPTION_TYPE_LABELS: EnumLabelMap = {
    'provisional': { fr: 'Provisoire', ar: 'مؤقت', en: 'Provisional' },
    'definitive': { fr: 'Définitive', ar: 'نهائي', en: 'Definitive' },
};

/** RiskCategory — src/dtos/entities/RiskDTO.ts */
export const RISK_CATEGORY_LABELS: EnumLabelMap = {
    'technical': { fr: 'Technique', ar: 'فني', en: 'Technical' },
    'financial': { fr: 'Financier', ar: 'مالي', en: 'Financial' },
    'operational': { fr: 'Opérationnel', ar: 'تشغيلي', en: 'Operational' },
    'strategic': { fr: 'Stratégique', ar: 'استراتيجي', en: 'Strategic' },
    'compliance': { fr: 'Conformité', ar: 'امتثال', en: 'Compliance' },
    'safety': { fr: 'Sécurité', ar: 'سلامة', en: 'Safety' },
};

/** RiskLevel — src/dtos/entities/RiskDTO.ts */
export const RISK_LEVEL_LABELS: EnumLabelMap = {
    'low': { fr: 'Faible', ar: 'منخفض', en: 'Low' },
    'medium': { fr: 'Moyen', ar: 'متوسط', en: 'Medium' },
    'high': { fr: 'Élevé', ar: 'مرتفع', en: 'High' },
    'critical': { fr: 'Critique', ar: 'حرج', en: 'Critical' },
};

/** RiskStatus — src/dtos/entities/RiskDTO.ts */
export const RISK_STATUS_LABELS: EnumLabelMap = {
    'identified': { fr: 'Identifié', ar: 'محدد', en: 'Identified' },
    'monitored': { fr: 'Suivi', ar: 'مراقب', en: 'Monitored' },
    'mitigated': { fr: 'Maîtrisé', ar: 'مسيطر عليه', en: 'Mitigated' },
    'resolved': { fr: 'Résolu', ar: 'تم حله', en: 'Resolved' },
    'accepted': { fr: 'Accepté', ar: 'مقبول', en: 'Accepted' },
};

/** StakeholderEntityType — src/dtos/entities/StakeholderDTO.ts */
export const STAKEHOLDER_ENTITY_TYPE_LABELS: EnumLabelMap = {
    'person': { fr: 'Personne', ar: 'شخص', en: 'Person' },
    'organization': { fr: 'Organisation', ar: 'مؤسسة', en: 'Organization' },
    'department': { fr: 'Département', ar: 'إدارة', en: 'Department' },
    'team': { fr: 'Équipe', ar: 'فريق', en: 'Team' },
};

/** StakeholderRole — src/dtos/entities/StakeholderDTO.ts */
export const STAKEHOLDER_ROLE_LABELS: EnumLabelMap = {
    'project_manager': { fr: 'Chef de projet', ar: 'مدير المشروع', en: 'Project Manager' },
    'team_lead': { fr: 'Chef d\'équipe', ar: 'قائد الفريق', en: 'Team Lead' },
    'developer': { fr: 'Développeur', ar: 'مطور', en: 'Developer' },
    'designer': { fr: 'Concepteur', ar: 'مصمم', en: 'Designer' },
    'analyst': { fr: 'Analyste', ar: 'محلل', en: 'Analyst' },
    'tester': { fr: 'Testeur', ar: 'مختبر', en: 'Tester' },
    'architect': { fr: 'Architecte', ar: 'مهندس معماري', en: 'Architect' },
    'consultant': { fr: 'Consultant', ar: 'استشاري', en: 'Consultant' },
    'sponsor': { fr: 'Sponsor', ar: 'راعي', en: 'Sponsor' },
    'client': { fr: 'Client', ar: 'عميل', en: 'Client' },
    'vendor': { fr: 'Fournisseur', ar: 'مورد', en: 'Vendor' },
    'contractor': { fr: 'Entrepreneur', ar: 'مقاول', en: 'Contractor' },
    'stakeholder': { fr: 'Partie prenante', ar: 'صاحب مصلحة', en: 'Stakeholder' },
};

/** StakeholderType — src/dtos/entities/StakeholderDTO.ts */
export const STAKEHOLDER_TYPE_LABELS: EnumLabelMap = {
    'employee': { fr: 'Employé', ar: 'موظف', en: 'Employee' },
    'external': { fr: 'Externe', ar: 'خارجي', en: 'External' },
    'principal_contractor': { fr: 'Entreprise principale', ar: 'مقاول رئيسي', en: 'Principal Contractor' },
    'client': { fr: 'Client', ar: 'عميل', en: 'Client' },
    'vendor': { fr: 'Fournisseur', ar: 'مورد', en: 'Vendor' },
    'partner': { fr: 'Partenaire', ar: 'شريك', en: 'Partner' },
    'regulator': { fr: 'Régulateur', ar: 'جهة تنظيمية', en: 'Regulator' },
    'investor': { fr: 'Investisseur', ar: 'مستثمر', en: 'Investor' },
};

/** TaskPriority — src/dtos/entities/TaskAssignmentDTO.ts */
export const TASK_PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Basse', ar: 'منخفضة', en: 'Low' },
    'medium': { fr: 'Moyenne', ar: 'متوسطة', en: 'Medium' },
    'high': { fr: 'Haute', ar: 'عالية', en: 'High' },
    'urgent': { fr: 'Urgente', ar: 'مستعجلة', en: 'Urgent' },
};

/** TaskStatus — src/dtos/entities/TaskAssignmentDTO.ts */
export const TASK_STATUS_LABELS: EnumLabelMap = {
    'pending': { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
    'in_progress': { fr: 'En cours', ar: 'قيد التقدم', en: 'In Progress' },
    'blocked': { fr: 'Bloquée', ar: 'متوقفة', en: 'Blocked' },
    'completed': { fr: 'Terminée', ar: 'مكتملة', en: 'Completed' },
    'cancelled': { fr: 'Annulée', ar: 'ملغاة', en: 'Cancelled' },
};

/** TaskType — src/dtos/entities/TaskAssignmentDTO.ts */
export const TASK_TYPE_LABELS: EnumLabelMap = {
    'general': { fr: 'Générale', ar: 'عامة', en: 'General' },
    'inspection': { fr: 'Inspection', ar: 'معاينة', en: 'Inspection' },
    'document': { fr: 'Document', ar: 'وثيقة', en: 'Document' },
    'payment': { fr: 'Paiement', ar: 'دفعة', en: 'Payment' },
    'material': { fr: 'Matériel', ar: 'مواد', en: 'Material' },
    'study': { fr: 'Étude', ar: 'دراسة', en: 'Study' },
    'execution': { fr: 'Exécution', ar: 'تنفيذ', en: 'Execution' },
};

/** UserRoleStatus — src/domain/entities/User.ts */
export const USER_ROLE_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Actif', ar: 'نشط', en: 'Active' },
    'inactive': { fr: 'Inactif', ar: 'غير نشط', en: 'Inactive' },
    'revoked': { fr: 'Révoqué', ar: 'ملغاة', en: 'Revoked' },
    'pending': { fr: 'En attente', ar: 'قيد الانتظار', en: 'Pending' },
};

/** ValidationCategory — src/application/services/EnhancedValidationService.ts */
export const VALIDATION_CATEGORY_LABELS: EnumLabelMap = {
    'technical': { fr: 'Technique', ar: 'فني', en: 'Technical' },
    'financial': { fr: 'Financière', ar: 'مالي', en: 'Financial' },
    'regulatory': { fr: 'Réglementaire', ar: 'تنظيمي', en: 'Regulatory' },
    'safety': { fr: 'Sécurité', ar: 'سلامة', en: 'Safety' },
    'quality': { fr: 'Qualité', ar: 'جودة', en: 'Quality' },
    'environmental': { fr: 'Environnementale', ar: 'بيئي', en: 'Environmental' },
    'documentation': { fr: 'Documentation', ar: 'وثائقي', en: 'Documentation' },
    'reception': { fr: 'Réception', ar: 'استلام', en: 'Acceptance' },
    'risk': { fr: 'Risque', ar: 'مخاطر', en: 'Risk' },
    'compliance': { fr: 'Conformité', ar: 'امتثال', en: 'Compliance' },
};

/** WorkflowMode — src/application/services/ProjectWorkflowService.ts */
export const WORKFLOW_MODE_LABELS: EnumLabelMap = {
    'create': { fr: 'Création', ar: 'إنشاء', en: 'Create' },
    'edit': { fr: 'Modification', ar: 'تعديل', en: 'Edit' },
    'complete': { fr: 'Finalisation', ar: 'إنجاز', en: 'Complete' },
    'cancel': { fr: 'Annulation', ar: 'إلغاء', en: 'Cancel' },
};

/** Registre global : nom d'ENUM -> libellés. */
export const ENUM_LABELS: Readonly<Record<string, EnumLabelMap>> = {
    ...MANUAL_ENUM_LABELS,
    AuthProvider: AUTH_PROVIDER_LABELS,

    AuthUserStatus: AUTH_USER_STATUS_LABELS,
    CommonStatus: COMMON_STATUS_LABELS,
    DocumentPriority: DOCUMENT_PRIORITY_LABELS,
    DocumentStatus: DOCUMENT_STATUS_LABELS,
    DocumentType: DOCUMENT_TYPE_LABELS,
    EmployeeDepartment: EMPLOYEE_DEPARTMENT_LABELS,
    EmployeeRole: EMPLOYEE_ROLE_LABELS,
    EmployeeStatus: EMPLOYEE_STATUS_LABELS,
    EmployeeType: EMPLOYEE_TYPE_LABELS,
    InspectionPriority: INSPECTION_PRIORITY_LABELS,
    InspectionStatus: INSPECTION_STATUS_LABELS,
    InspectionType: INSPECTION_TYPE_LABELS,
    MaterialStatus: MATERIAL_STATUS_LABELS,
    MaterialUnit: MATERIAL_UNIT_LABELS,
    PaymentStatusEnum: PAYMENT_STATUS_ENUM_LABELS,
    PhasePriority: PHASE_PRIORITY_LABELS,
    PhaseStatus: PHASE_STATUS_LABELS,
    PhaseType: PHASE_TYPE_LABELS,
    PhaseWorkflowStep: PHASE_WORKFLOW_STEP_LABELS,
    Priority: PRIORITY_LABELS,
    ProfileStatus: PROFILE_STATUS_LABELS,
    ProjectStatus: PROJECT_STATUS_LABELS,
    ProjectType: PROJECT_TYPE_LABELS,
    ReceptionStatus: RECEPTION_STATUS_LABELS,
    ReceptionType: RECEPTION_TYPE_LABELS,
    RiskCategory: RISK_CATEGORY_LABELS,
    RiskLevel: RISK_LEVEL_LABELS,
    RiskStatus: RISK_STATUS_LABELS,
    StakeholderEntityType: STAKEHOLDER_ENTITY_TYPE_LABELS,
    StakeholderRole: STAKEHOLDER_ROLE_LABELS,
    StakeholderType: STAKEHOLDER_TYPE_LABELS,
    TaskPriority: TASK_PRIORITY_LABELS,
    TaskStatus: TASK_STATUS_LABELS,
    TaskType: TASK_TYPE_LABELS,
    UserRoleStatus: USER_ROLE_STATUS_LABELS,
    ValidationCategory: VALIDATION_CATEGORY_LABELS,
    WorkflowMode: WORKFLOW_MODE_LABELS,
};

/** Libellé d'un code ENUM dans la langue demandée (fallback fr puis code). */
export function getEnumLabel(enumName: string, code: string | null | undefined, lang: SupportedLang = 'fr'): string {
    if (!code) return '';
    const entry = ENUM_LABELS[enumName]?.[code];
    return entry ? entry[lang] || entry.fr : code;
}

/** Options prêtes pour un Select : { value, label }. */
export function getEnumOptions(enumName: string, lang: SupportedLang = 'fr'): Array<{ value: string; label: string }> {
    const map = ENUM_LABELS[enumName] ?? {};
    return Object.keys(map).map((value) => ({ value, label: map[value][lang] || map[value].fr }));
}

/**
 * Index global code -> libellé, agrégé sur les 38 ENUM.
 * Sert de filet de sécurité : aucun code technique ne doit s'afficher brut dans l'UI,
 * même lorsque le composant n'indique pas explicitement le nom de l'ENUM.
 * Premier ENUM déclarant le code gagne (les codes sont homogènes entre ENUM).
 */
const ENUM_CODE_INDEX: Record<string, EnumLabel> = (() => {
    const index: Record<string, EnumLabel> = {};
    Object.values(ENUM_LABELS).forEach((map) => {
        Object.entries(map).forEach(([code, label]) => {
            if (!index[code]) index[code] = label;
        });
    });
    return index;
})();

/** Résout un code technique sans connaître son ENUM d'origine. Retourne `null` si inconnu. */
export function resolveAnyEnumLabel(code: string | null | undefined, lang: SupportedLang = 'fr'): string | null {
    if (!code) return null;
    const entry = ENUM_CODE_INDEX[code] ?? ENUM_CODE_INDEX[code.toLowerCase()];
    return entry ? entry[lang] || entry.fr : null;
}

