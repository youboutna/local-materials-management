/**
 * Mauritanian Public Procurement Referential
 * Based on Mauritanian public procurement laws and procedures
 */

import { ProjectReferential, MultiLanguageLabel } from './somelec.referential';

// Types de procédures mauritaniennes
export type ProcurementType = 
  | 'AOO_PREQUALIF'
  | 'AOO_SANS_PREQUALIF'
  | 'AO_2_ETAPES'
  | 'AOR'
  | 'CS'
  | 'ED'
  | 'SFQC'
  | 'SMC'
  | 'SBD'
  | 'SFQT'
  | 'QC'
  | 'CI'
  | 'EXECUTION';

export const mauritanianPublicProcurementReferential: ProjectReferential = {
  code: 'MR_PUBLIC_PROCUREMENT',
  name: {
    code: 'MR_PUBLIC_PROCUREMENT',
    fr: 'Marchés Publics Mauritaniens',
    ar: 'الصفقات العمومية الموريتانية',
    en: 'Mauritanian Public Procurement'
  },
  description: {
    code: 'MR_PUBLIC_PROCUREMENT_DESC',
    fr: 'Procédures conformes au code des marchés publics mauritaniens (13 types de procédures)',
    ar: 'إجراءات متوافقة مع قانون الصفقات العمومية الموريتانية (13 نوع من الإجراءات)',
    en: 'Procedures compliant with Mauritanian public procurement code (13 procedure types)'
  },
  requiresEngineeringConsultant: false,
  requiresDonorApproval: false,
  requiresMinistryApproval: true,
  paymentWorkflow: 'standard',
  procurementTypes: [
    'AOO_PREQUALIF',
    'AOO_SANS_PREQUALIF',
    'AO_2_ETAPES',
    'AOR',
    'CS',
    'ED',
    'SFQC',
    'SMC',
    'SBD',
    'SFQT',
    'QC',
    'CI',
    'EXECUTION'
  ],
  phases: [
    {
      code: 'PLANIFICATION',
      label: {
        code: 'PLANIFICATION',
        fr: 'Planification',
        ar: 'التخطيط',
        en: 'Planning'
      },
      order: 1,
      steps: [
        {
          code: 'ESTIMATION_RESSOURCES',
          label: {
            code: 'ESTIMATION_RESSOURCES',
            fr: 'Estimation des ressources financières',
            ar: 'تقدير الموارد المالية',
            en: 'Financial Resources Estimation'
          },
          order: 1,
          tasks: [
            {
              code: 'BUDGET_ANALYSIS',
              label: {
                code: 'BUDGET_ANALYSIS',
                fr: 'Analyse budgétaire',
                ar: 'التحليل الميزاني',
                en: 'Budget Analysis'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 10
            }
          ]
        },
        {
          code: 'PLANIFICATION_ACHATS',
          label: {
            code: 'PLANIFICATION_ACHATS',
            fr: 'Planification des achats',
            ar: 'تخطيط المشتريات',
            en: 'Procurement Planning'
          },
          order: 2,
          tasks: [
            {
              code: 'DEFINE_CATEGORIES',
              label: {
                code: 'DEFINE_CATEGORIES',
                fr: 'Définition des catégories (personnel, locations, assurances)',
                ar: 'تحديد الفئات (الموظفون، الإيجارات، التأمينات)',
                en: 'Category Definition (staff, rentals, insurance)'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 7
            }
          ]
        },
        {
          code: 'MODALITES_PLANIFICATION',
          label: {
            code: 'MODALITES_PLANIFICATION',
            fr: 'Définition des modalités',
            ar: 'تحديد الطرائق',
            en: 'Modality Definition'
          },
          order: 3,
          tasks: [
            {
              code: 'DEFINE_PROCEDURES',
              label: {
                code: 'DEFINE_PROCEDURES',
                fr: 'Définition des procédures de passation',
                ar: 'تحديد إجراءات الإسناد',
                en: 'Award Procedures Definition'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 5
            }
          ]
        }
      ]
    },
    {
      code: 'PUBLICITE',
      label: {
        code: 'PUBLICITE',
        fr: 'Publicité',
        ar: 'الإشهار',
        en: 'Advertisement'
      },
      order: 2,
      steps: [
        {
          code: 'PUBLICATION_PORTAIL',
          label: {
            code: 'PUBLICATION_PORTAIL',
            fr: 'Publication sur le Portail National',
            ar: 'النشر على البوابة الوطنية',
            en: 'National Portal Publication'
          },
          order: 1,
          tasks: [
            {
              code: 'PORTAL_UPLOAD',
              label: {
                code: 'PORTAL_UPLOAD',
                fr: 'Publication via le Portail National des Marchés Publics',
                ar: 'النشر عبر البوابة الوطنية للصفقات العمومية',
                en: 'Publication via National Public Procurement Portal'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 2
            }
          ]
        },
        {
          code: 'DIFFUSION_JOURNAUX',
          label: {
            code: 'DIFFUSION_JOURNAUX',
            fr: 'Diffusion dans les journaux',
            ar: 'النشر في الصحف',
            en: 'Newspaper Publication'
          },
          order: 2,
          tasks: [
            {
              code: 'LEGAL_NOTICES',
              label: {
                code: 'LEGAL_NOTICES',
                fr: 'Diffusion dans les journaux d\'annonces légales',
                ar: 'النشر في صحف الإعلانات القانونية',
                en: 'Legal Notice Newspaper Publication'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 3
            }
          ]
        },
        {
          code: 'INSCRIPTION_CANDIDATS',
          label: {
            code: 'INSCRIPTION_CANDIDATS',
            fr: 'Inscription des candidats',
            ar: 'تسجيل المرشحين',
            en: 'Candidate Registration'
          },
          order: 3,
          tasks: [
            {
              code: 'REGISTER_CANDIDATES',
              label: {
                code: 'REGISTER_CANDIDATES',
                fr: 'Inscription des candidats potentiels sur le portail',
                ar: 'تسجيل المرشحين المحتملين على البوابة',
                en: 'Potential Candidates Portal Registration'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 15
            }
          ]
        }
      ]
    },
    {
      code: 'RECEPTION_ANALYSE',
      label: {
        code: 'RECEPTION_ANALYSE',
        fr: 'Réception & Analyse',
        ar: 'الاستلام والتحليل',
        en: 'Reception & Analysis'
      },
      order: 3,
      steps: [
        {
          code: 'SOUMISSION_DOSSIERS',
          label: {
            code: 'SOUMISSION_DOSSIERS',
            fr: 'Soumission des dossiers',
            ar: 'تقديم الملفات',
            en: 'Dossier Submission'
          },
          order: 1,
          tasks: [
            {
              code: 'SUBMIT_TECHNICAL',
              label: {
                code: 'SUBMIT_TECHNICAL',
                fr: 'Soumission des dossiers techniques par les candidats',
                ar: 'تقديم الملفات الفنية من قبل المرشحين',
                en: 'Technical Dossier Submission by Candidates'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 30
            }
          ]
        },
        {
          code: 'ANALYSE_CPMP',
          label: {
            code: 'ANALYSE_CPMP',
            fr: 'Analyse par la CPMP',
            ar: 'التحليل من قبل لجنة الصفقات',
            en: 'CPMP Analysis'
          },
          order: 2,
          tasks: [
            {
              code: 'CPMP_REVIEW',
              label: {
                code: 'CPMP_REVIEW',
                fr: 'Analyse par la CPMP présidée par la PRMP',
                ar: 'التحليل من قبل لجنة الصفقات برئاسة المسؤول',
                en: 'Analysis by CPMP chaired by PRMP'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 14
            }
          ]
        },
        {
          code: 'EVALUATION_CONFORMITE',
          label: {
            code: 'EVALUATION_CONFORMITE',
            fr: 'Évaluation de la conformité',
            ar: 'تقييم المطابقة',
            en: 'Compliance Evaluation'
          },
          order: 3,
          tasks: [
            {
              code: 'CHECK_COMPLIANCE',
              label: {
                code: 'CHECK_COMPLIANCE',
                fr: 'Évaluation de la conformité des offres',
                ar: 'تقييم مطابقة العروض',
                en: 'Offer Compliance Evaluation'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 10
            }
          ]
        }
      ]
    },
    {
      code: 'ATTRIBUTION',
      label: {
        code: 'ATTRIBUTION',
        fr: 'Attribution',
        ar: 'الإسناد',
        en: 'Award'
      },
      order: 4,
      steps: [
        {
          code: 'SELECTION_PRIX',
          label: {
            code: 'SELECTION_PRIX',
            fr: 'Sélection basée sur le prix',
            ar: 'الاختيار على أساس السعر',
            en: 'Price-based Selection'
          },
          order: 1,
          tasks: [
            {
              code: 'PRICE_EVALUATION',
              label: {
                code: 'PRICE_EVALUATION',
                fr: 'Sélection basée sur le critère du prix ou du coût',
                ar: 'الاختيار على أساس معيار السعر أو التكلفة',
                en: 'Selection based on price or cost criterion'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 7
            }
          ]
        },
        {
          code: 'PUBLICATION_ATTRIBUTION',
          label: {
            code: 'PUBLICATION_ATTRIBUTION',
            fr: 'Publication de l\'attribution',
            ar: 'نشر الإسناد',
            en: 'Award Publication'
          },
          order: 2,
          tasks: [
            {
              code: 'PUBLISH_AWARD',
              label: {
                code: 'PUBLISH_AWARD',
                fr: 'Publication de l\'avis d\'attribution dans les 30 jours',
                ar: 'نشر إشعار الإسناد في غضون 30 يومًا',
                en: 'Award Notice Publication within 30 days'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 30
            }
          ]
        },
        {
          code: 'SIGNATURE_MARCHE',
          label: {
            code: 'SIGNATURE_MARCHE',
            fr: 'Signature du marché',
            ar: 'توقيع العقد',
            en: 'Contract Signature'
          },
          order: 3,
          tasks: [
            {
              code: 'SIGN_CONTRACT',
              label: {
                code: 'SIGN_CONTRACT',
                fr: 'Signature du marché avec l\'attributaire',
                ar: 'توقيع العقد مع الفائز',
                en: 'Contract Signature with Awardee'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 15
            }
          ]
        }
      ]
    },
    {
      code: 'CONTROLE_REGULATION',
      label: {
        code: 'CONTROLE_REGULATION',
        fr: 'Contrôle & Régulation',
        ar: 'الرقابة والتنظيم',
        en: 'Control & Regulation'
      },
      order: 5,
      steps: [
        {
          code: 'CONTROLE_CNCMP',
          label: {
            code: 'CONTROLE_CNCMP',
            fr: 'Contrôle CNCMP',
            ar: 'رقابة اللجنة الوطنية',
            en: 'CNCMP Control'
          },
          order: 1,
          tasks: [
            {
              code: 'CNCMP_AUDIT',
              label: {
                code: 'CNCMP_AUDIT',
                fr: 'Contrôle a priori et a posteriori par la CNCMP',
                ar: 'الرقابة القبلية والبعدية من قبل اللجنة الوطنية',
                en: 'Prior and Posterior Control by CNCMP'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 20
            }
          ]
        },
        {
          code: 'REGULATION_ARMP',
          label: {
            code: 'REGULATION_ARMP',
            fr: 'Régulation ARMP',
            ar: 'تنظيم الهيئة',
            en: 'ARMP Regulation'
          },
          order: 2,
          tasks: [
            {
              code: 'ARMP_OVERSIGHT',
              label: {
                code: 'ARMP_OVERSIGHT',
                fr: 'Régulation par l\'ARMP',
                ar: 'التنظيم من قبل الهيئة',
                en: 'Regulation by ARMP'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 15
            }
          ]
        }
      ]
    }
  ]
};
