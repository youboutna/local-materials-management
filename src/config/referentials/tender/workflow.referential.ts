/**
 * Référentiel niveau 3 — Workflow officiel de passation des marchés publics (Mauritanie).
 *
 * Doctrine : le `code` est l'unique valeur technique persistée ; les libellés
 * `fr / ar / en` ne servent qu'à l'affichage (i18n UI-only).
 */

export type TenderWorkflowCategory =
    | 'planning'
    | 'publicity'
    | 'analysis'
    | 'attribution'
    | 'control';

export type ReferentialLabels = { fr: string; ar: string; en: string };

export interface TenderWorkflowDocument {
    code: string;
    labels: ReferentialLabels;
}

export interface TenderWorkflowStepReferential {
    code: string;
    order: number;
    category: TenderWorkflowCategory;
    /** Durée indicative en jours. */
    estimatedDuration: number;
    title: ReferentialLabels;
    description: ReferentialLabels;
    requiredDocuments: TenderWorkflowDocument[];
}

export const TENDER_WORKFLOW_REFERENTIAL: TenderWorkflowStepReferential[] = [
    {
        code: 'PROCUREMENT_PLANNING',
        order: 1,
        category: 'planning',
        estimatedDuration: 30,
        title: {
            fr: 'Planification des achats',
            ar: 'تخطيط المشتريات',
            en: 'Procurement planning',
        },
        description: {
            fr: "Élaboration du Plan Annuel d'Achats (PAA) et du Plan de Passation des Marchés (PPM)",
            ar: 'إعداد الخطة السنوية للمشتريات وخطة إبرام العقود',
            en: 'Preparation of the Annual Procurement Plan (APP) and the Procurement Plan (PP)',
        },
        requiredDocuments: [
            {
                code: 'PAA',
                labels: {
                    fr: "Plan Annuel d'Achats (PAA)",
                    ar: 'الخطة السنوية للمشتريات',
                    en: 'Annual Procurement Plan (APP)',
                },
            },
            {
                code: 'PPM',
                labels: {
                    fr: 'Plan de Passation des Marchés (PPM)',
                    ar: 'خطة إبرام العقود',
                    en: 'Procurement Plan (PP)',
                },
            },
            {
                code: 'FINANCIAL_ESTIMATE',
                labels: {
                    fr: 'Estimation des ressources financières',
                    ar: 'تقدير الموارد المالية',
                    en: 'Financial resources estimate',
                },
            },
            {
                code: 'PLANNING_TERMS',
                labels: {
                    fr: 'Définition des modalités de planification',
                    ar: 'تحديد طرائق التخطيط',
                    en: 'Definition of planning terms',
                },
            },
        ],
    },
    {
        code: 'PUBLICITY',
        order: 2,
        category: 'publicity',
        estimatedDuration: 45,
        title: {
            fr: "Publicité et appel d'offres",
            ar: 'الإعلان وطلب العروض',
            en: 'Publicity and call for tenders',
        },
        description: {
            fr: 'Publication des avis selon les procédures formalisées',
            ar: 'نشر الإعلانات وفق الإجراءات الرسمية',
            en: 'Publication of notices according to formal procedures',
        },
        requiredDocuments: [
            {
                code: 'TENDER_NOTICE',
                labels: {
                    fr: "Avis d'appel d'offres",
                    ar: 'إعلان طلب العروض',
                    en: 'Tender notice',
                },
            },
            {
                code: 'TENDER_DOSSIER',
                labels: {
                    fr: "Dossier d'appel d'offres",
                    ar: 'ملف طلب العروض',
                    en: 'Tender dossier',
                },
            },
            {
                code: 'SPECIFICATIONS',
                labels: {
                    fr: 'Cahier des charges',
                    ar: 'دفتر الشروط',
                    en: 'Specifications',
                },
            },
            {
                code: 'NATIONAL_PORTAL_PUBLICATION',
                labels: {
                    fr: 'Publication au portail national des marchés publics',
                    ar: 'النشر في البوابة الوطنية للمشتريات العمومية',
                    en: 'Publication on the national public procurement portal',
                },
            },
            {
                code: 'LEGAL_JOURNAL_PUBLICATION',
                labels: {
                    fr: "Publication dans les journaux d'annonces légales",
                    ar: 'النشر في صحف الإعلانات القانونية',
                    en: 'Publication in legal announcement journals',
                },
            },
        ],
    },
    {
        code: 'BID_ANALYSIS',
        order: 3,
        category: 'analysis',
        estimatedDuration: 30,
        title: {
            fr: 'Réception et analyse des offres',
            ar: 'استلام وتحليل العروض',
            en: 'Bid reception and analysis',
        },
        description: {
            fr: 'Analyse des offres par la commission de passation des marchés',
            ar: 'تحليل العروض من قبل لجنة إبرام العقود',
            en: 'Bid analysis by the procurement commission',
        },
        requiredDocuments: [
            {
                code: 'TECHNICAL_FILES',
                labels: {
                    fr: 'Dossiers techniques des candidats',
                    ar: 'الملفات الفنية للمتقدمين',
                    en: 'Bidders technical files',
                },
            },
            {
                code: 'CPMP_ANALYSIS_REPORT',
                labels: {
                    fr: "Rapport d'analyse de la CPMP",
                    ar: 'تقرير تحليل لجنة إبرام العقود',
                    en: 'CPMP analysis report',
                },
            },
            {
                code: 'BID_OPENING_MINUTES',
                labels: {
                    fr: "Procès-verbal d'ouverture des plis",
                    ar: 'محضر فتح المظاريف',
                    en: 'Bid opening minutes',
                },
            },
            {
                code: 'COMPLIANCE_EVALUATION',
                labels: {
                    fr: 'Évaluation de conformité des offres',
                    ar: 'تقييم مطابقة العروض',
                    en: 'Bid compliance evaluation',
                },
            },
            {
                code: 'SUBCOMMISSION_REPORT',
                labels: {
                    fr: "Rapport de la sous-commission d'analyse",
                    ar: 'تقرير اللجنة الفرعية للتحليل',
                    en: 'Analysis subcommission report',
                },
            },
        ],
    },
    {
        code: 'AWARD',
        order: 4,
        category: 'attribution',
        estimatedDuration: 15,
        title: {
            fr: 'Attribution du marché',
            ar: 'إرساء العقد',
            en: 'Contract award',
        },
        description: {
            fr: "Attribution au soumissionnaire présentant l'offre économiquement la plus avantageuse",
            ar: 'الإرساء على المتعهد صاحب العرض الأكثر جدوى اقتصاديا',
            en: 'Award to the bidder with the most economically advantageous offer',
        },
        requiredDocuments: [
            {
                code: 'AWARD_REPORT',
                labels: {
                    fr: "Rapport d'attribution",
                    ar: 'تقرير الإرساء',
                    en: 'Award report',
                },
            },
            {
                code: 'AWARD_DECISION',
                labels: {
                    fr: "Décision d'attribution",
                    ar: 'قرار الإرساء',
                    en: 'Award decision',
                },
            },
            {
                code: 'AWARD_NOTICE',
                labels: {
                    fr: "Avis d'attribution",
                    ar: 'إعلان الإرساء',
                    en: 'Award notice',
                },
            },
            {
                code: 'CONTRACT',
                labels: {
                    fr: 'Contrat de marché',
                    ar: 'عقد الصفقة',
                    en: 'Procurement contract',
                },
            },
            {
                code: 'BANK_GUARANTEES',
                labels: {
                    fr: 'Garanties bancaires',
                    ar: 'الضمانات البنكية',
                    en: 'Bank guarantees',
                },
            },
        ],
    },
    {
        code: 'CONTROL',
        order: 5,
        category: 'control',
        estimatedDuration: 20,
        title: {
            fr: 'Contrôle et régulation',
            ar: 'الرقابة والتنظيم',
            en: 'Control and regulation',
        },
        description: {
            fr: "Contrôle par la CNCMP et régulation par l'ARMP",
            ar: 'الرقابة من طرف اللجنة الوطنية والتنظيم من طرف السلطة المنظمة',
            en: 'Control by the CNCMP and regulation by the ARMP',
        },
        requiredDocuments: [
            {
                code: 'CNCMP_CONTROL_REPORT',
                labels: {
                    fr: 'Rapport de contrôle CNCMP',
                    ar: 'تقرير رقابة اللجنة الوطنية',
                    en: 'CNCMP control report',
                },
            },
            {
                code: 'COMPLIANCE_CERTIFICATE',
                labels: {
                    fr: 'Certificat de régularité',
                    ar: 'شهادة المطابقة',
                    en: 'Compliance certificate',
                },
            },
            {
                code: 'AUDIT_REPORT',
                labels: {
                    fr: "Rapport d'audit",
                    ar: 'تقرير التدقيق',
                    en: 'Audit report',
                },
            },
            {
                code: 'ACCEPTANCE_MINUTES',
                labels: {
                    fr: 'Procès-verbal de réception',
                    ar: 'محضر الاستلام',
                    en: 'Acceptance minutes',
                },
            },
            {
                code: 'FINAL_EXECUTION_REPORT',
                labels: {
                    fr: "Rapport final d'exécution",
                    ar: 'التقرير النهائي للتنفيذ',
                    en: 'Final execution report',
                },
            },
        ],
    },
];

export type TenderWorkflowLang = keyof ReferentialLabels;

/** Libellé d'une étape dans la langue demandée (fallback français). */
export const getTenderWorkflowLabel = (
    labels: ReferentialLabels,
    lang: TenderWorkflowLang,
): string => labels[lang] || labels.fr;

/** Étape du référentiel par code technique. */
export const getTenderWorkflowStep = (code: string) =>
    TENDER_WORKFLOW_REFERENTIAL.find((step) => step.code === code);
