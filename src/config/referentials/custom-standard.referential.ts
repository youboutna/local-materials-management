/**
 * Custom Standard Construction Referential
 * Generic construction phases for custom projects
 */

import { ProjectReferential } from './somelec.referential';

export const customStandardReferential: ProjectReferential = {
  code: 'CUSTOM_STANDARD',
  name: {
    code: 'CUSTOM_STANDARD',
    fr: 'Standard Personnalisé',
    ar: 'المعيار المخصص',
    en: 'Custom Standard'
  },
  description: {
    code: 'CUSTOM_STANDARD_DESC',
    fr: 'Modèle de projet personnalisable pour tous types de construction',
    ar: 'نموذج مشروع قابل للتخصيص لجميع أنواع البناء',
    en: 'Customizable project template for all construction types'
  },
  requiresEngineeringConsultant: false,
  requiresDonorApproval: false,
  requiresMinistryApproval: false,
  paymentWorkflow: 'simplified',
  phases: [
    {
      code: 'PRE_CONSTRUCTION',
      label: {
        code: 'PRE_CONSTRUCTION',
        fr: 'Pré-construction',
        ar: 'ما قبل البناء',
        en: 'Pre-construction'
      },
      order: 1,
      steps: [
        {
          code: 'PLANNING_DESIGN',
          label: {
            code: 'PLANNING_DESIGN',
            fr: 'Planification et conception',
            ar: 'التخطيط والتصميم',
            en: 'Planning and Design'
          },
          order: 1,
          tasks: [
            {
              code: 'INITIAL_PLANNING',
              label: {
                code: 'INITIAL_PLANNING',
                fr: 'Planification initiale',
                ar: 'التخطيط الأولي',
                en: 'Initial Planning'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 14
            },
            {
              code: 'DESIGN_DOCUMENTS',
              label: {
                code: 'DESIGN_DOCUMENTS',
                fr: 'Documents de conception',
                ar: 'وثائق التصميم',
                en: 'Design Documents'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 21
            }
          ]
        },
        {
          code: 'PERMITS_APPROVALS',
          label: {
            code: 'PERMITS_APPROVALS',
            fr: 'Permis et approbations',
            ar: 'التصاريح والموافقات',
            en: 'Permits and Approvals'
          },
          order: 2,
          tasks: [
            {
              code: 'OBTAIN_PERMITS',
              label: {
                code: 'OBTAIN_PERMITS',
                fr: 'Obtention des permis',
                ar: 'الحصول على التصاريح',
                en: 'Permit Obtainment'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 30
            }
          ]
        }
      ]
    },
    {
      code: 'SITE_PREPARATION',
      label: {
        code: 'SITE_PREPARATION',
        fr: 'Préparation du site',
        ar: 'إعداد الموقع',
        en: 'Site Preparation'
      },
      order: 2,
      steps: [
        {
          code: 'SITE_CLEARING',
          label: {
            code: 'SITE_CLEARING',
            fr: 'Déblayage du site',
            ar: 'تنظيف الموقع',
            en: 'Site Clearing'
          },
          order: 1,
          tasks: [
            {
              code: 'CLEAR_SITE',
              label: {
                code: 'CLEAR_SITE',
                fr: 'Déblayage et nettoyage',
                ar: 'التنظيف والإزالة',
                en: 'Clearing and Cleaning'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 7
            }
          ]
        },
        {
          code: 'EXCAVATION',
          label: {
            code: 'EXCAVATION',
            fr: 'Excavation',
            ar: 'الحفر',
            en: 'Excavation'
          },
          order: 2,
          tasks: [
            {
              code: 'EXCAVATE',
              label: {
                code: 'EXCAVATE',
                fr: 'Travaux d\'excavation',
                ar: 'أعمال الحفر',
                en: 'Excavation Works'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 10
            }
          ]
        }
      ]
    },
    {
      code: 'FOUNDATION',
      label: {
        code: 'FOUNDATION',
        fr: 'Fondation',
        ar: 'الأساسات',
        en: 'Foundation'
      },
      order: 3,
      steps: [
        {
          code: 'FOUNDATION_WORK',
          label: {
            code: 'FOUNDATION_WORK',
            fr: 'Travaux de fondation',
            ar: 'أعمال الأساسات',
            en: 'Foundation Work'
          },
          order: 1,
          tasks: [
            {
              code: 'POUR_FOUNDATION',
              label: {
                code: 'POUR_FOUNDATION',
                fr: 'Coulage des fondations',
                ar: 'صب الأساسات',
                en: 'Foundation Pouring'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 14
            }
          ]
        }
      ]
    },
    {
      code: 'FRAMING',
      label: {
        code: 'FRAMING',
        fr: 'Charpente',
        ar: 'الإطار',
        en: 'Framing'
      },
      order: 4,
      steps: [
        {
          code: 'STRUCTURAL_FRAMING',
          label: {
            code: 'STRUCTURAL_FRAMING',
            fr: 'Charpente structurelle',
            ar: 'الإطار الإنشائي',
            en: 'Structural Framing'
          },
          order: 1,
          tasks: [
            {
              code: 'ERECT_FRAME',
              label: {
                code: 'ERECT_FRAME',
                fr: 'Érection de la charpente',
                ar: 'تركيب الإطار',
                en: 'Frame Erection'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 21
            }
          ]
        }
      ]
    },
    {
      code: 'STRUCTURAL_WORK',
      label: {
        code: 'STRUCTURAL_WORK',
        fr: 'Gros œuvre',
        ar: 'الأعمال الإنشائية',
        en: 'Structural Work'
      },
      order: 5,
      steps: [
        {
          code: 'ROOFING',
          label: {
            code: 'ROOFING',
            fr: 'Toiture',
            ar: 'السقف',
            en: 'Roofing'
          },
          order: 1,
          tasks: [
            {
              code: 'INSTALL_ROOF',
              label: {
                code: 'INSTALL_ROOF',
                fr: 'Installation de la toiture',
                ar: 'تركيب السقف',
                en: 'Roof Installation'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 14
            }
          ]
        },
        {
          code: 'ELECTRICAL_PLUMBING',
          label: {
            code: 'ELECTRICAL_PLUMBING',
            fr: 'Électricité et plomberie',
            ar: 'الكهرباء والسباكة',
            en: 'Electrical and Plumbing'
          },
          order: 2,
          tasks: [
            {
              code: 'INSTALL_SYSTEMS',
              label: {
                code: 'INSTALL_SYSTEMS',
                fr: 'Installation des systèmes',
                ar: 'تركيب الأنظمة',
                en: 'Systems Installation'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 21
            }
          ]
        }
      ]
    },
    {
      code: 'FINISHING',
      label: {
        code: 'FINISHING',
        fr: 'Finitions',
        ar: 'التشطيبات',
        en: 'Finishing'
      },
      order: 6,
      steps: [
        {
          code: 'INTERIOR_FINISHING',
          label: {
            code: 'INTERIOR_FINISHING',
            fr: 'Finitions intérieures',
            ar: 'التشطيبات الداخلية',
            en: 'Interior Finishing'
          },
          order: 1,
          tasks: [
            {
              code: 'INTERIOR_WORK',
              label: {
                code: 'INTERIOR_WORK',
                fr: 'Travaux intérieurs',
                ar: 'الأعمال الداخلية',
                en: 'Interior Works'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 28
            }
          ]
        },
        {
          code: 'EXTERIOR_FINISHING',
          label: {
            code: 'EXTERIOR_FINISHING',
            fr: 'Finitions extérieures',
            ar: 'التشطيبات الخارجية',
            en: 'Exterior Finishing'
          },
          order: 2,
          tasks: [
            {
              code: 'EXTERIOR_WORK',
              label: {
                code: 'EXTERIOR_WORK',
                fr: 'Travaux extérieurs',
                ar: 'الأعمال الخارجية',
                en: 'Exterior Works'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 21
            }
          ]
        }
      ]
    },
    {
      code: 'POST_CONSTRUCTION',
      label: {
        code: 'POST_CONSTRUCTION',
        fr: 'Post-construction',
        ar: 'ما بعد البناء',
        en: 'Post-construction'
      },
      order: 7,
      steps: [
        {
          code: 'FINAL_INSPECTION',
          label: {
            code: 'FINAL_INSPECTION',
            fr: 'Inspection finale',
            ar: 'التفتيش النهائي',
            en: 'Final Inspection'
          },
          order: 1,
          tasks: [
            {
              code: 'FINAL_CHECK',
              label: {
                code: 'FINAL_CHECK',
                fr: 'Vérification finale',
                ar: 'الفحص النهائي',
                en: 'Final Check'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 7
            }
          ]
        }
      ]
    },
    {
      code: 'HANDOVER',
      label: {
        code: 'HANDOVER',
        fr: 'Livraison',
        ar: 'التسليم',
        en: 'Handover'
      },
      order: 8,
      steps: [
        {
          code: 'HANDOVER_COMPLETE',
          label: {
            code: 'HANDOVER_COMPLETE',
            fr: 'Livraison complète',
            ar: 'التسليم الكامل',
            en: 'Complete Handover'
          },
          order: 1,
          tasks: [
            {
              code: 'TRANSFER_OWNERSHIP',
              label: {
                code: 'TRANSFER_OWNERSHIP',
                fr: 'Transfert de propriété',
                ar: 'نقل الملكية',
                en: 'Ownership Transfer'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 7
            }
          ]
        }
      ]
    }
  ]
};
