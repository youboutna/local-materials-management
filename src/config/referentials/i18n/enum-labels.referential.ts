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
    'supabase': { fr: 'Supabase', ar: 'سوبابيس', en: 'Supabase' },
    'keycloak': { fr: 'Keycloak', ar: 'كي كلوك', en: 'Keycloak' },
    'auth0': { fr: 'Auth0', ar: 'أوث 0', en: 'Auth0' },
    'database': { fr: 'Database', ar: 'قاعدة بيانات', en: 'Database' },
};

/** AuthUserStatus — src/domain/entities/AuthUser.ts */
export const AUTH_USER_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Active', ar: 'نشط', en: 'Active' },
    'inactive': { fr: 'Inactive', ar: 'غير نشط', en: 'Inactive' },
    'suspended': { fr: 'Suspended', ar: 'معلق', en: 'Suspended' },
    'pending': { fr: 'Pending', ar: 'قيد الانتظار', en: 'Pending' },
};

/** CommonStatus — src/dtos/shared.ts */
export const COMMON_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Active', ar: 'نشط', en: 'Active' },
    'inactive': { fr: 'Inactive', ar: 'غير نشط', en: 'Inactive' },
    'pending': { fr: 'Pending', ar: 'معلق', en: 'Pending' },
    'completed': { fr: 'Completed', ar: 'مكتمل', en: 'Completed' },
    'cancelled': { fr: 'Cancelled', ar: 'ملغى', en: 'Cancelled' },
    'draft': { fr: 'Draft', ar: 'مسودة', en: 'Draft' },
};

/** DocumentPriority — src/domain/entities/Document.ts */
export const DOCUMENT_PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Low', ar: 'منخفض', en: 'Low' },
    'medium': { fr: 'Medium', ar: 'متوسط', en: 'Medium' },
    'high': { fr: 'High', ar: 'عالي', en: 'High' },
    'urgent': { fr: 'Urgent', ar: 'عاجل', en: 'Urgent' },
};

/** DocumentStatus — src/domain/entities/Document.ts */
export const DOCUMENT_STATUS_LABELS: EnumLabelMap = {
    'draft': { fr: 'Draft', ar: 'مسودة', en: 'Draft' },
    'pending_approval': { fr: 'Pending approval', ar: 'بانتظار الموافقة', en: 'Pending approval' },
    'pending_review': { fr: 'Pending review', ar: 'قيد المراجعة', en: 'Pending review' },
    'approved': { fr: 'Approved', ar: 'معتمد', en: 'Approved' },
    'rejected': { fr: 'Rejected', ar: 'مرفوض', en: 'Rejected' },
    'archived': { fr: 'Archived', ar: 'مؤرشف', en: 'Archived' },
    'expired': { fr: 'Expired', ar: 'منتهي الصلاحية', en: 'Expired' },
    'deprecated': { fr: 'Deprecated', ar: 'مهمل', en: 'Deprecated' },
};

/** DocumentType — src/domain/entities/Document.ts */
export const DOCUMENT_TYPE_LABELS: EnumLabelMap = {
    'contract': { fr: 'Contract', ar: 'عقد', en: 'Contract' },
    'plan': { fr: 'Plan', ar: 'خطة', en: 'Plan' },
    'specification': { fr: 'Specification', ar: 'مواصفات', en: 'Specification' },
    'report': { fr: 'Report', ar: 'تقرير', en: 'Report' },
    'certificate': { fr: 'Certificate', ar: 'شهادة', en: 'Certificate' },
    'permit': { fr: 'Permit', ar: 'تصريح', en: 'Permit' },
    'invoice': { fr: 'Invoice', ar: 'فاتورة', en: 'Invoice' },
    'receipt': { fr: 'Receipt', ar: 'إيصال', en: 'Receipt' },
    'manual': { fr: 'Manual', ar: 'دليل', en: 'Manual' },
    'policy': { fr: 'Policy', ar: 'سياسة', en: 'Policy' },
    'procedure': { fr: 'Procedure', ar: 'إجراء', en: 'Procedure' },
    'drawing': { fr: 'Drawing', ar: 'رسم', en: 'Drawing' },
    'photo': { fr: 'Photo', ar: 'صورة', en: 'Photo' },
    'video': { fr: 'Video', ar: 'فيديو', en: 'Video' },
    'blueprint': { fr: 'Blueprint', ar: 'تصميم', en: 'Blueprint' },
    'schema': { fr: 'Schema', ar: 'مخطط', en: 'Schema' },
    'checklist': { fr: 'Checklist', ar: 'قائمة تحقق', en: 'Checklist' },
    'form': { fr: 'Form', ar: 'نموذج', en: 'Form' },
    'template': { fr: 'Template', ar: 'قالب', en: 'Template' },
    'pv': { fr: 'PV', ar: 'محضر', en: 'Meeting Minutes' },
    'service_report': { fr: 'Service report', ar: 'تقرير خدمة', en: 'Service report' },
    'tender_document': { fr: 'Tender document', ar: 'وثيقة مناقصة', en: 'Tender document' },
    'supporting_document': { fr: 'Supporting document', ar: 'مستند داعم', en: 'Supporting document' },
    'correspondence': { fr: 'Correspondence', ar: 'مراسلة', en: 'Correspondence' },
    'insurance': { fr: 'Insurance', ar: 'تأمين', en: 'Insurance' },
    'warranty': { fr: 'Warranty', ar: 'ضمان', en: 'Warranty' },
    'bank_guarantee': { fr: 'Bank guarantee', ar: 'ضمان بنكي', en: 'Bank guarantee' },
    'other': { fr: 'Other', ar: 'أخرى', en: 'Other' },
};

/** EmployeeDepartment — src/dtos/entities/EmployeeDTO.ts */
export const EMPLOYEE_DEPARTMENT_LABELS: EnumLabelMap = {
    'engineering': { fr: 'Engineering', ar: 'هندسة', en: 'Engineering' },
    'design': { fr: 'Design', ar: 'تصميم', en: 'Design' },
    'project_management': { fr: 'Project management', ar: 'إدارة مشاريع', en: 'Project management' },
    'quality_assurance': { fr: 'Quality assurance', ar: 'ضمان الجودة', en: 'Quality assurance' },
    'operations': { fr: 'Operations', ar: 'عمليات', en: 'Operations' },
    'finance': { fr: 'Finance', ar: 'مالية', en: 'Finance' },
    'human_resources': { fr: 'Human resources', ar: 'موارد بشرية', en: 'Human resources' },
    'marketing': { fr: 'Marketing', ar: 'تسويق', en: 'Marketing' },
    'sales': { fr: 'Sales', ar: 'مبيعات', en: 'Sales' },
    'administration': { fr: 'Administration', ar: 'إدارة', en: 'Administration' },
    'legal': { fr: 'Legal', ar: 'قانونية', en: 'Legal' },
    'procurement': { fr: 'Procurement', ar: 'مشتريات', en: 'Procurement' },
    'maintenance': { fr: 'Maintenance', ar: 'صيانة', en: 'Maintenance' },
    'security': { fr: 'Security', ar: 'أمن', en: 'Security' },
};

/** EmployeeRole — src/dtos/entities/EmployeeDTO.ts */
export const EMPLOYEE_ROLE_LABELS: EnumLabelMap = {
    'project_manager': { fr: 'Project manager', ar: 'مدير مشروع', en: 'Project manager' },
    'team_lead': { fr: 'Team lead', ar: 'قائد فريق', en: 'Team lead' },
    'developer': { fr: 'Developer', ar: 'مطور', en: 'Developer' },
    'designer': { fr: 'Designer', ar: 'مصمم', en: 'Designer' },
    'analyst': { fr: 'Analyst', ar: 'محلل', en: 'Analyst' },
    'tester': { fr: 'Tester', ar: 'مختبر', en: 'Tester' },
    'architect': { fr: 'Architect', ar: 'مهندس معماري', en: 'Architect' },
    'consultant': { fr: 'Consultant', ar: 'استشاري', en: 'Consultant' },
    'specialist': { fr: 'Specialist', ar: 'أخصائي', en: 'Specialist' },
    'coordinator': { fr: 'Coordinator', ar: 'منسق', en: 'Coordinator' },
    'supervisor': { fr: 'Supervisor', ar: 'مشرف', en: 'Supervisor' },
    'manager': { fr: 'Manager', ar: 'مدير', en: 'Manager' },
};

/** EmployeeStatus — src/dtos/entities/EmployeeDTO.ts */
export const EMPLOYEE_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Active', ar: 'نشط', en: 'Active' },
    'inactive': { fr: 'Inactive', ar: 'غير نشط', en: 'Inactive' },
    'on_leave': { fr: 'On leave', ar: 'في إجازة', en: 'On leave' },
    'terminated': { fr: 'Terminated', ar: 'منهي الخدمة', en: 'Terminated' },
    'suspended': { fr: 'Suspended', ar: 'معلق', en: 'Suspended' },
};

/** EmployeeType — src/dtos/entities/EmployeeDTO.ts */
export const EMPLOYEE_TYPE_LABELS: EnumLabelMap = {
    'full_time': { fr: 'Full time', ar: 'دوام كامل', en: 'Full time' },
    'part_time': { fr: 'Part time', ar: 'دوام جزئي', en: 'Part time' },
    'contract': { fr: 'Contract', ar: 'عقد', en: 'Contract' },
    'intern': { fr: 'Intern', ar: 'متدرب', en: 'Intern' },
    'consultant': { fr: 'Consultant', ar: 'استشاري', en: 'Consultant' },
};

/** InspectionPriority — src/dtos/entities/InspectionDTO.ts */
export const INSPECTION_PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Low', ar: 'منخفض', en: 'Low' },
    'medium': { fr: 'Medium', ar: 'متوسط', en: 'Medium' },
    'high': { fr: 'High', ar: 'عال', en: 'High' },
    'urgent': { fr: 'Urgent', ar: 'عاجل', en: 'Urgent' },
};

/** InspectionStatus — src/dtos/entities/InspectionDTO.ts */
export const INSPECTION_STATUS_LABELS: EnumLabelMap = {
    'scheduled': { fr: 'Scheduled', ar: 'مجدولة', en: 'Scheduled' },
    'pending': { fr: 'Pending', ar: 'معلقة', en: 'Pending' },
    'planned': { fr: 'Planned', ar: 'مخطط لها', en: 'Planned' },
    'in_progress': { fr: 'In progress', ar: 'قيد التقدم', en: 'In progress' },
    'completed': { fr: 'Completed', ar: 'مكتملة', en: 'Completed' },
    'requires_review': { fr: 'Requires review', ar: 'تتطلب مراجعة', en: 'Requires review' },
    'requires_changes': { fr: 'Requires changes', ar: 'يتطلب تعديلات', en: 'Requires changes' },
    'approved': { fr: 'Approved', ar: 'معتمد', en: 'Approved' },
    'rejected': { fr: 'Rejected', ar: 'مرفوض', en: 'Rejected' },
    'cancelled': { fr: 'Cancelled', ar: 'ملغى', en: 'Cancelled' },
};

/** InspectionType — src/dtos/entities/InspectionDTO.ts */
export const INSPECTION_TYPE_LABELS: EnumLabelMap = {
    'routine': { fr: 'Routine', ar: 'روتيني', en: 'Routine' },
    'special': { fr: 'Special', ar: 'خاص', en: 'Special' },
    'safety': { fr: 'Safety', ar: 'سلامة', en: 'Safety' },
    'quality': { fr: 'Quality', ar: 'جودة', en: 'Quality' },
    'compliance': { fr: 'Compliance', ar: 'امتثال', en: 'Compliance' },
};

/** MaterialStatus — src/dtos/entities/MaterialDTO.ts */
export const MATERIAL_STATUS_LABELS: EnumLabelMap = {
    'available': { fr: 'Available', ar: 'متوفر', en: 'Available' },
    'out_of_stock': { fr: 'Out of stock', ar: 'نفد المخزون', en: 'Out of stock' },
    'discontinued': { fr: 'Discontinued', ar: 'متوقف عن الإنتاج', en: 'Discontinued' },
    'on_order': { fr: 'On order', ar: 'قيد الطلب', en: 'On order' },
    'reserved': { fr: 'Reserved', ar: 'محجوز', en: 'Reserved' },
    'damaged': { fr: 'Damaged', ar: 'تالف', en: 'Damaged' },
};

/** MaterialUnit — src/dtos/entities/MaterialDTO.ts */
export const MATERIAL_UNIT_LABELS: EnumLabelMap = {
    'pieces': { fr: 'Pieces', ar: 'قطعة', en: 'Pieces' },
    'kilograms': { fr: 'Kilograms', ar: 'كيلوغرام', en: 'Kilograms' },
    'meters': { fr: 'Meters', ar: 'متر', en: 'Meters' },
    'liters': { fr: 'Liters', ar: 'لتر', en: 'Liters' },
    'square_meters': { fr: 'Square meters', ar: 'متر مربع', en: 'Square meters' },
    'cubic_meters': { fr: 'Cubic meters', ar: 'متر مكعب', en: 'Cubic meters' },
    'tons': { fr: 'Tons', ar: 'طن', en: 'Tons' },
    'bags': { fr: 'Bags', ar: 'كيس', en: 'Bags' },
    'boxes': { fr: 'Boxes', ar: 'صندوق', en: 'Boxes' },
    'rolls': { fr: 'Rolls', ar: 'لفة', en: 'Rolls' },
    'sets': { fr: 'Sets', ar: 'مجموعة', en: 'Sets' },
};

/** PaymentStatusEnum — src/application/services/PaymentService.ts */
export const PAYMENT_STATUS_ENUM_LABELS: EnumLabelMap = {
    'pending': { fr: 'Pending', ar: 'قيد الانتظار', en: 'Pending' },
    'approved': { fr: 'Approved', ar: 'معتمد', en: 'Approved' },
    'processed': { fr: 'Processed', ar: 'معالج', en: 'Processed' },
    'completed': { fr: 'Completed', ar: 'مكتمل', en: 'Completed' },
    'failed': { fr: 'Failed', ar: 'فشل', en: 'Failed' },
    'blocked': { fr: 'Blocked', ar: 'محظور', en: 'Blocked' },
    'rejected': { fr: 'Rejected', ar: 'مرفوض', en: 'Rejected' },
    'cancelled': { fr: 'Cancelled', ar: 'ملغى', en: 'Cancelled' },
};

/** PhasePriority — src/dtos/entities/PhaseDTO.ts */
export const PHASE_PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Low', ar: 'منخفضة', en: 'Low' },
    'medium': { fr: 'Medium', ar: 'متوسطة', en: 'Medium' },
    'high': { fr: 'High', ar: 'عالية', en: 'High' },
    'urgent': { fr: 'Urgent', ar: 'عاجلة', en: 'Urgent' },
};

/** PhaseStatus — src/dtos/entities/PhaseDTO.ts */
export const PHASE_STATUS_LABELS: EnumLabelMap = {
    'pending': { fr: 'Pending', ar: 'معلق', en: 'Pending' },
    'in_progress': { fr: 'In progress', ar: 'قيد التنفيذ', en: 'In progress' },
    'completed': { fr: 'Completed', ar: 'مكتمل', en: 'Completed' },
    'delayed': { fr: 'Delayed', ar: 'متأخر', en: 'Delayed' },
    'cancelled': { fr: 'Cancelled', ar: 'ملغاة', en: 'Cancelled' },
};

/** PhaseType — src/dtos/entities/PhaseDTO.ts */
export const PHASE_TYPE_LABELS: EnumLabelMap = {
    'foundation': { fr: 'Foundation', ar: 'أساسات', en: 'Foundation' },
    'structural': { fr: 'Structural', ar: 'إنشائي', en: 'Structural' },
    'excavation': { fr: 'Excavation', ar: 'حفريات', en: 'Excavation' },
    'demolition': { fr: 'Demolition', ar: 'هدم', en: 'Demolition' },
    'finishing': { fr: 'Finishing', ar: 'تشطيبات', en: 'Finishing' },
    'electrical': { fr: 'Electrical', ar: 'كهرباء', en: 'Electrical' },
    'plumbing': { fr: 'Plumbing', ar: 'سباكة', en: 'Plumbing' },
    'hvac': { fr: 'Hvac', ar: 'تكييف وتدفئة وتهوية', en: 'Hvac' },
    'roofing': { fr: 'Roofing', ar: 'تسقيف', en: 'Roofing' },
    'exterior': { fr: 'Exterior', ar: 'خارجي', en: 'Exterior' },
    'interior': { fr: 'Interior', ar: 'داخلي', en: 'Interior' },
    'landscaping': { fr: 'Landscaping', ar: 'تنسيق حدائق', en: 'Landscaping' },
};

/** PhaseWorkflowStep — src/dtos/workflows/PhaseWorkflowDTO.ts */
export const PHASE_WORKFLOW_STEP_LABELS: EnumLabelMap = {
    'planning': { fr: 'Planning', ar: 'تخطيط', en: 'Planning' },
    'execution': { fr: 'Execution', ar: 'تنفيذ', en: 'Execution' },
    'review': { fr: 'Review', ar: 'مراجعة', en: 'Review' },
    'completion': { fr: 'Completion', ar: 'إنجاز', en: 'Completion' },
};

/** Priority — src/dtos/shared.ts */
export const PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Low', ar: 'منخفضة', en: 'Low' },
    'medium': { fr: 'Medium', ar: 'متوسطة', en: 'Medium' },
    'high': { fr: 'High', ar: 'عالية', en: 'High' },
    'urgent': { fr: 'Urgent', ar: 'عاجلة', en: 'Urgent' },
};

/** ProfileStatus — src/domain/entities/UserProfile.ts */
export const PROFILE_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Active', ar: 'نشط', en: 'Active' },
    'inactive': { fr: 'Inactive', ar: 'غير نشط', en: 'Inactive' },
    'suspended': { fr: 'Suspended', ar: 'معلق', en: 'Suspended' },
    'pending_verification': { fr: 'Pending verification', ar: 'بانتظار التحقق', en: 'Pending verification' },
};

/** ProjectStatus — src/dtos/entities/ProjectDTO.ts */
export const PROJECT_STATUS_LABELS: EnumLabelMap = {
    'draft': { fr: 'Draft', ar: 'مسودة', en: 'Draft' },
    'planned': { fr: 'Planned', ar: 'مخطط', en: 'Planned' },
    'pre_qualification': { fr: 'Pre qualification', ar: 'تأهيل مسبق', en: 'Pre qualification' },
    'en_attente': { fr: 'En attente', ar: 'في انتظار', en: 'On hold' },
    'en_conception': { fr: 'En conception', ar: 'قيد التصميم', en: 'In design' },
    'planifie_v2': { fr: 'Planifie', ar: 'مخطط', en: 'Planned' },
    'attribue_v2': { fr: 'Attribue', ar: 'مخصص', en: 'Assigned' },
    'en_cours_v2': { fr: 'En cours', ar: 'قيد التنفيذ', en: 'In progress' },
    'en_construction_v2': { fr: 'En construction', ar: 'قيد الإنشاء', en: 'Under construction' },
    'en_inspection_v2': { fr: 'En inspection', ar: 'قيد الفحص', en: 'In inspection' },
    'en_review': { fr: 'En review', ar: 'قيد المراجعة', en: 'In review' },
    'termine_v2': { fr: 'Termine', ar: 'مكتمل', en: 'Completed' },
    'en_cloture_v2': { fr: 'En cloture', ar: 'قيد الإغلاق', en: 'In closing' },
    'completed': { fr: 'Completed', ar: 'مكتمل', en: 'Completed' },
    'suspendu_v2': { fr: 'Suspendu', ar: 'معلق', en: 'Suspended' },
    'en_retard_v2': { fr: 'En retard', ar: 'متأخر', en: 'Delayed' },
    'annule_v2': { fr: 'Annule', ar: 'ملغى', en: 'Cancelled' },
    'cancelled': { fr: 'Cancelled', ar: 'ملغى', en: 'Cancelled' },
    'enCours': { fr: 'En cours legacy', ar: 'قيد التنفيذ (قديم)', en: 'In progress legacy' },
    'termine': { fr: 'Termine legacy', ar: 'مكتمل (قديم)', en: 'Completed legacy' },
    'enAttente': { fr: 'En attente legacy', ar: 'قيد الانتظار (قديم)', en: 'Pending legacy' },
    'enInspection': { fr: 'En inspection legacy', ar: 'قيد الفحص (قديم)', en: 'In inspection legacy' },
    'suspendu': { fr: 'Suspendu legacy', ar: 'معلق (قديم)', en: 'Suspended legacy' },
    'annule': { fr: 'Annule legacy', ar: 'ملغى (قديم)', en: 'Cancelled legacy' },
    'attribue': { fr: 'Attribue legacy', ar: 'مخصص (قديم)', en: 'Assigned legacy' },
    'planifie': { fr: 'Planifie legacy', ar: 'مخطط له (قديم)', en: 'Planned legacy' },
    'preQualification': { fr: 'Pre qualification legacy', ar: 'تأهيل مسبق (قديم)', en: 'Pre-qualification legacy' },
    'enConception': { fr: 'En conception legacy', ar: 'قيد التصميم (قديم)', en: 'In design legacy' },
    'enConstruction': { fr: 'En construction legacy', ar: 'قيد الإنشاء (قديم)', en: 'In construction legacy' },
    'enCloture': { fr: 'En cloture legacy', ar: 'قيد الإغلاق (قديم)', en: 'In closing legacy' },
    'enRetard': { fr: 'En retard legacy', ar: 'متأخر (قديم)', en: 'Delayed legacy' },
};

/** ProjectType — src/dtos/entities/ProjectDTO.ts */
export const PROJECT_TYPE_LABELS: EnumLabelMap = {
    'residential': { fr: 'Residential', ar: 'سكني', en: 'Residential' },
    'commercial': { fr: 'Commercial', ar: 'تجاري', en: 'Commercial' },
    'industrial': { fr: 'Industrial', ar: 'صناعي', en: 'Industrial' },
    'infrastructure': { fr: 'Infrastructure', ar: 'بنية تحتية', en: 'Infrastructure' },
    'renovation': { fr: 'Renovation', ar: 'تجديد', en: 'Renovation' },
    'maintenance': { fr: 'Maintenance', ar: 'صيانة', en: 'Maintenance' },
};

/** ReceptionStatus — src/dtos/entities/ReceptionDTO.ts */
export const RECEPTION_STATUS_LABELS: EnumLabelMap = {
    'pending': { fr: 'Pending', ar: 'معلق', en: 'Pending' },
    'in_progress': { fr: 'In progress', ar: 'قيد التقدم', en: 'In progress' },
    'approved': { fr: 'Approved', ar: 'موافق عليه', en: 'Approved' },
    'rejected': { fr: 'Rejected', ar: 'مرفوض', en: 'Rejected' },
    'require_resubmission': { fr: 'Require resubmission', ar: 'يتطلب إعادة تقديم', en: 'Require resubmission' },
};

/** ReceptionType — src/dtos/entities/ReceptionDTO.ts */
export const RECEPTION_TYPE_LABELS: EnumLabelMap = {
    'provisional': { fr: 'Provisional', ar: 'مؤقت', en: 'Provisional' },
    'definitive': { fr: 'Definitive', ar: 'نهائي', en: 'Definitive' },
};

/** RiskCategory — src/dtos/entities/RiskDTO.ts */
export const RISK_CATEGORY_LABELS: EnumLabelMap = {
    'technical': { fr: 'Technical', ar: 'تقني', en: 'Technical' },
    'financial': { fr: 'Financial', ar: 'مالي', en: 'Financial' },
    'operational': { fr: 'Operational', ar: 'تشغيلي', en: 'Operational' },
    'strategic': { fr: 'Strategic', ar: 'استراتيجي', en: 'Strategic' },
    'compliance': { fr: 'Compliance', ar: 'امتثال', en: 'Compliance' },
    'safety': { fr: 'Safety', ar: 'سلامة', en: 'Safety' },
};

/** RiskLevel — src/dtos/entities/RiskDTO.ts */
export const RISK_LEVEL_LABELS: EnumLabelMap = {
    'low': { fr: 'Low', ar: 'منخفض', en: 'Low' },
    'medium': { fr: 'Medium', ar: 'متوسط', en: 'Medium' },
    'high': { fr: 'High', ar: 'مرتفع', en: 'High' },
    'critical': { fr: 'Critical', ar: 'حرج', en: 'Critical' },
};

/** RiskStatus — src/dtos/entities/RiskDTO.ts */
export const RISK_STATUS_LABELS: EnumLabelMap = {
    'identified': { fr: 'Identified', ar: 'محدد', en: 'Identified' },
    'monitored': { fr: 'Monitored', ar: 'مراقب', en: 'Monitored' },
    'mitigated': { fr: 'Mitigated', ar: 'مخفف', en: 'Mitigated' },
    'resolved': { fr: 'Resolved', ar: 'تم حله', en: 'Resolved' },
    'accepted': { fr: 'Accepted', ar: 'مقبول', en: 'Accepted' },
};

/** StakeholderEntityType — src/dtos/entities/StakeholderDTO.ts */
export const STAKEHOLDER_ENTITY_TYPE_LABELS: EnumLabelMap = {
    'person': { fr: 'Person', ar: 'شخص', en: 'Person' },
    'organization': { fr: 'Organization', ar: 'مؤسسة', en: 'Organization' },
    'department': { fr: 'Department', ar: 'إدارة', en: 'Department' },
    'team': { fr: 'Team', ar: 'فريق', en: 'Team' },
};

/** StakeholderRole — src/dtos/entities/StakeholderDTO.ts */
export const STAKEHOLDER_ROLE_LABELS: EnumLabelMap = {
    'project_manager': { fr: 'Project manager', ar: 'مدير مشروع', en: 'Project manager' },
    'team_lead': { fr: 'Team lead', ar: 'قائد فريق', en: 'Team lead' },
    'developer': { fr: 'Developer', ar: 'مطور', en: 'Developer' },
    'designer': { fr: 'Designer', ar: 'مصمم', en: 'Designer' },
    'analyst': { fr: 'Analyst', ar: 'محلل', en: 'Analyst' },
    'tester': { fr: 'Tester', ar: 'مختبر', en: 'Tester' },
    'architect': { fr: 'Architect', ar: 'مهندس معماري', en: 'Architect' },
    'consultant': { fr: 'Consultant', ar: 'مستشار', en: 'Consultant' },
    'sponsor': { fr: 'Sponsor', ar: 'راعي', en: 'Sponsor' },
    'client': { fr: 'Client', ar: 'عميل', en: 'Client' },
    'vendor': { fr: 'Vendor', ar: 'مورد', en: 'Vendor' },
    'contractor': { fr: 'Contractor', ar: 'مقاول', en: 'Contractor' },
    'stakeholder': { fr: 'Stakeholder', ar: 'صاحب مصلحة', en: 'Stakeholder' },
};

/** StakeholderType — src/dtos/entities/StakeholderDTO.ts */
export const STAKEHOLDER_TYPE_LABELS: EnumLabelMap = {
    'employee': { fr: 'Employee', ar: 'موظف', en: 'Employee' },
    'external': { fr: 'External', ar: 'خارجي', en: 'External' },
    'principal_contractor': { fr: 'Principal contractor', ar: 'مقاول رئيسي', en: 'Principal contractor' },
    'client': { fr: 'Client', ar: 'عميل', en: 'Client' },
    'vendor': { fr: 'Vendor', ar: 'بائع', en: 'Vendor' },
    'partner': { fr: 'Partner', ar: 'شريك', en: 'Partner' },
    'regulator': { fr: 'Regulator', ar: 'منظم', en: 'Regulator' },
    'investor': { fr: 'Investor', ar: 'مستثمر', en: 'Investor' },
};

/** TaskPriority — src/dtos/entities/TaskAssignmentDTO.ts */
export const TASK_PRIORITY_LABELS: EnumLabelMap = {
    'low': { fr: 'Low', ar: 'منخفضة', en: 'Low' },
    'medium': { fr: 'Medium', ar: 'متوسطة', en: 'Medium' },
    'high': { fr: 'High', ar: 'عالية', en: 'High' },
    'urgent': { fr: 'Urgent', ar: 'عاجلة', en: 'Urgent' },
    'urgent': { fr: 'Urgent', ar: 'عاجلة', en: 'Urgent' },
};

/** TaskStatus — src/dtos/entities/TaskAssignmentDTO.ts */
export const TASK_STATUS_LABELS: EnumLabelMap = {
    'pending': { fr: 'Pending', ar: 'قيد الانتظار', en: 'Pending' },
    'in_progress': { fr: 'In progress', ar: 'قيد التنفيذ', en: 'In progress' },
    'blocked': { fr: 'Blocked', ar: 'معلقة', en: 'Blocked' },
    'completed': { fr: 'Completed', ar: 'مكتملة', en: 'Completed' },
    'cancelled': { fr: 'Cancelled', ar: 'ملغاة', en: 'Cancelled' },
};

/** TaskType — src/dtos/entities/TaskAssignmentDTO.ts */
export const TASK_TYPE_LABELS: EnumLabelMap = {
    'general': { fr: 'General', ar: 'عامة', en: 'General' },
    'inspection': { fr: 'Inspection', ar: 'فحص', en: 'Inspection' },
    'document': { fr: 'Document', ar: 'وثيقة', en: 'Document' },
    'payment': { fr: 'Payment', ar: 'دفعة', en: 'Payment' },
    'material': { fr: 'Material', ar: 'مواد', en: 'Material' },
    'study': { fr: 'Study', ar: 'دراسة', en: 'Study' },
    'execution': { fr: 'Execution', ar: 'تنفيذ', en: 'Execution' },
};

/** UserRoleStatus — src/domain/entities/User.ts */
export const USER_ROLE_STATUS_LABELS: EnumLabelMap = {
    'active': { fr: 'Active', ar: 'نشط', en: 'Active' },
    'inactive': { fr: 'Inactive', ar: 'غير نشط', en: 'Inactive' },
    'revoked': { fr: 'Revoked', ar: 'ملغى', en: 'Revoked' },
    'pending': { fr: 'Pending', ar: 'معلق', en: 'Pending' },
};

/** ValidationCategory — src/application/services/EnhancedValidationService.ts */
export const VALIDATION_CATEGORY_LABELS: EnumLabelMap = {
    'technical': { fr: 'Technical', ar: 'فني', en: 'Technical' },
    'financial': { fr: 'Financial', ar: 'مالي', en: 'Financial' },
    'regulatory': { fr: 'Regulatory', ar: 'تنظيمي', en: 'Regulatory' },
    'safety': { fr: 'Safety', ar: 'سلامة', en: 'Safety' },
    'quality': { fr: 'Quality', ar: 'جودة', en: 'Quality' },
    'environmental': { fr: 'Environmental', ar: 'بيئي', en: 'Environmental' },
    'documentation': { fr: 'Documentation', ar: 'وثائقي', en: 'Documentation' },
    'reception': { fr: 'Reception', ar: 'استلام', en: 'Reception' },
    'risk': { fr: 'Risk', ar: 'مخاطر', en: 'Risk' },
    'compliance': { fr: 'Compliance', ar: 'امتثال', en: 'Compliance' },
};

/** WorkflowMode — src/application/services/ProjectWorkflowService.ts */
export const WORKFLOW_MODE_LABELS: EnumLabelMap = {
    'create': { fr: 'Create', ar: 'إنشاء', en: 'Create' },
    'edit': { fr: 'Edit', ar: 'تعديل', en: 'Edit' },
    'complete': { fr: 'Complete', ar: 'إتمام', en: 'Complete' },
    'cancel': { fr: 'Cancel', ar: 'إلغاء', en: 'Cancel' },
};

/** Registre global : nom d'ENUM -> libellés. */
export const ENUM_LABELS: Readonly<Record<string, EnumLabelMap>> = {
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
