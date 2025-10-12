/**
 * Distribution Rurale Referential
 * Projects managed by Rural Distribution Department with Ministry funding
 */

import { ProjectReferential } from './somelec.referential';

export const distributionRuraleReferential: ProjectReferential = {
  code: 'DISTRIBUTION_RURALE',
  name: {
    code: 'DISTRIBUTION_RURALE',
    fr: 'Distribution Rurale',
    ar: 'التوزيع الريفي',
    en: 'Rural Distribution'
  },
  description: {
    code: 'DISTRIBUTION_RURALE_DESC',
    fr: 'Projets d\'électrification rurale financés par le Ministère',
    ar: 'مشاريع الكهربة الريفية الممولة من قبل الوزارة',
    en: 'Rural electrification projects funded by the Ministry'
  },
  requiresEngineeringConsultant: false,
  requiresDonorApproval: false,
  requiresMinistryApproval: true,
  paymentWorkflow: 'custom',
  phases: [
    {
      code: 'IDENTIFICATION',
      label: {
        code: 'IDENTIFICATION',
        fr: 'Identification des zones',
        ar: 'تحديد المناطق',
        en: 'Zone Identification'
      },
      order: 1,
      steps: [
        {
          code: 'ZONE_SURVEY',
          label: {
            code: 'ZONE_SURVEY',
            fr: 'Enquête de terrain',
            ar: 'مسح ميداني',
            en: 'Field Survey'
          },
          order: 1,
          tasks: [
            {
              code: 'RURAL_NEEDS_ASSESSMENT',
              label: {
                code: 'RURAL_NEEDS_ASSESSMENT',
                fr: 'Évaluation des besoins ruraux',
                ar: 'تقييم الاحتياجات الريفية',
                en: 'Rural Needs Assessment'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 14
            },
            {
              code: 'BENEFICIARY_CENSUS',
              label: {
                code: 'BENEFICIARY_CENSUS',
                fr: 'Recensement des bénéficiaires',
                ar: 'إحصاء المستفيدين',
                en: 'Beneficiary Census'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 10
            }
          ]
        },
        {
          code: 'PRIORITY_SELECTION',
          label: {
            code: 'PRIORITY_SELECTION',
            fr: 'Sélection prioritaire',
            ar: 'الاختيار ذو الأولوية',
            en: 'Priority Selection'
          },
          order: 2,
          tasks: [
            {
              code: 'DEFINE_PRIORITIES',
              label: {
                code: 'DEFINE_PRIORITIES',
                fr: 'Définition des zones prioritaires',
                ar: 'تحديد المناطق ذات الأولوية',
                en: 'Priority Zone Definition'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 7
            }
          ]
        }
      ]
    },
    {
      code: 'PLANNING_RURAL',
      label: {
        code: 'PLANNING_RURAL',
        fr: 'Planification technique',
        ar: 'التخطيط الفني',
        en: 'Technical Planning'
      },
      order: 2,
      steps: [
        {
          code: 'NETWORK_DESIGN',
          label: {
            code: 'NETWORK_DESIGN',
            fr: 'Conception du réseau',
            ar: 'تصميم الشبكة',
            en: 'Network Design'
          },
          order: 1,
          tasks: [
            {
              code: 'LOW_VOLTAGE_DESIGN',
              label: {
                code: 'LOW_VOLTAGE_DESIGN',
                fr: 'Conception réseau basse tension',
                ar: 'تصميم شبكة الجهد المنخفض',
                en: 'Low Voltage Network Design'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 21
            },
            {
              code: 'POLE_POSITIONING',
              label: {
                code: 'POLE_POSITIONING',
                fr: 'Positionnement des poteaux',
                ar: 'تحديد موقع الأعمدة',
                en: 'Pole Positioning'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 14
            }
          ]
        },
        {
          code: 'MATERIAL_PLANNING',
          label: {
            code: 'MATERIAL_PLANNING',
            fr: 'Planification matériaux',
            ar: 'تخطيط المواد',
            en: 'Material Planning'
          },
          order: 2,
          tasks: [
            {
              code: 'MATERIAL_QUANTIFICATION',
              label: {
                code: 'MATERIAL_QUANTIFICATION',
                fr: 'Quantification des matériaux',
                ar: 'تحديد كميات المواد',
                en: 'Material Quantification'
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
      code: 'PROCUREMENT_RURAL',
      label: {
        code: 'PROCUREMENT_RURAL',
        fr: 'Approvisionnement',
        ar: 'التوريد',
        en: 'Procurement'
      },
      order: 3,
      steps: [
        {
          code: 'SUPPLIER_SELECTION',
          label: {
            code: 'SUPPLIER_SELECTION',
            fr: 'Sélection fournisseurs',
            ar: 'اختيار الموردين',
            en: 'Supplier Selection'
          },
          order: 1,
          tasks: [
            {
              code: 'SELECT_SUPPLIERS',
              label: {
                code: 'SELECT_SUPPLIERS',
                fr: 'Sélection et contractualisation',
                ar: 'الاختيار والتعاقد',
                en: 'Selection and Contracting'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 30
            }
          ]
        },
        {
          code: 'MATERIAL_DELIVERY',
          label: {
            code: 'MATERIAL_DELIVERY',
            fr: 'Livraison matériaux',
            ar: 'تسليم المواد',
            en: 'Material Delivery'
          },
          order: 2,
          tasks: [
            {
              code: 'RECEIVE_MATERIALS',
              label: {
                code: 'RECEIVE_MATERIALS',
                fr: 'Réception des matériaux',
                ar: 'استلام المواد',
                en: 'Material Reception'
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
      code: 'INSTALLATION',
      label: {
        code: 'INSTALLATION',
        fr: 'Installation',
        ar: 'التركيب',
        en: 'Installation'
      },
      order: 4,
      steps: [
        {
          code: 'POLE_INSTALLATION',
          label: {
            code: 'POLE_INSTALLATION',
            fr: 'Installation poteaux',
            ar: 'تركيب الأعمدة',
            en: 'Pole Installation'
          },
          order: 1,
          tasks: [
            {
              code: 'INSTALL_POLES',
              label: {
                code: 'INSTALL_POLES',
                fr: 'Implantation et installation des poteaux',
                ar: 'غرس وتركيب الأعمدة',
                en: 'Pole Implantation and Installation'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 30
            }
          ]
        },
        {
          code: 'CABLE_INSTALLATION',
          label: {
            code: 'CABLE_INSTALLATION',
            fr: 'Installation câbles',
            ar: 'تركيب الكابلات',
            en: 'Cable Installation'
          },
          order: 2,
          tasks: [
            {
              code: 'INSTALL_CABLES',
              label: {
                code: 'INSTALL_CABLES',
                fr: 'Tirage et raccordement des câbles',
                ar: 'سحب وتوصيل الكابلات',
                en: 'Cable Pulling and Connection'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 21
            }
          ]
        },
        {
          code: 'TRANSFORMER_INSTALLATION',
          label: {
            code: 'TRANSFORMER_INSTALLATION',
            fr: 'Installation transformateurs',
            ar: 'تركيب المحولات',
            en: 'Transformer Installation'
          },
          order: 3,
          tasks: [
            {
              code: 'INSTALL_TRANSFORMERS',
              label: {
                code: 'INSTALL_TRANSFORMERS',
                fr: 'Installation des transformateurs',
                ar: 'تركيب المحولات',
                en: 'Transformer Installation'
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
      code: 'COMMISSIONING',
      label: {
        code: 'COMMISSIONING',
        fr: 'Mise en service',
        ar: 'التشغيل',
        en: 'Commissioning'
      },
      order: 5,
      steps: [
        {
          code: 'TESTING',
          label: {
            code: 'TESTING',
            fr: 'Tests et vérifications',
            ar: 'الاختبارات والتحقق',
            en: 'Testing and Verification'
          },
          order: 1,
          tasks: [
            {
              code: 'ELECTRICAL_TESTS',
              label: {
                code: 'ELECTRICAL_TESTS',
                fr: 'Tests électriques',
                ar: 'الاختبارات الكهربائية',
                en: 'Electrical Tests'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 7
            }
          ]
        },
        {
          code: 'ENERGIZATION',
          label: {
            code: 'ENERGIZATION',
            fr: 'Mise sous tension',
            ar: 'التشغيل',
            en: 'Energization'
          },
          order: 2,
          tasks: [
            {
              code: 'POWER_ON',
              label: {
                code: 'POWER_ON',
                fr: 'Mise sous tension et vérification',
                ar: 'التشغيل والتحقق',
                en: 'Power On and Verification'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 3
            }
          ]
        }
      ]
    },
    {
      code: 'HANDOVER_RURAL',
      label: {
        code: 'HANDOVER_RURAL',
        fr: 'Réception et transfert',
        ar: 'الاستلام والنقل',
        en: 'Handover and Transfer'
      },
      order: 6,
      steps: [
        {
          code: 'COMMUNITY_HANDOVER',
          label: {
            code: 'COMMUNITY_HANDOVER',
            fr: 'Remise à la communauté',
            ar: 'التسليم للمجتمع',
            en: 'Community Handover'
          },
          order: 1,
          tasks: [
            {
              code: 'COMMUNITY_TRAINING',
              label: {
                code: 'COMMUNITY_TRAINING',
                fr: 'Formation des bénéficiaires',
                ar: 'تدريب المستفيدين',
                en: 'Beneficiary Training'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              estimatedDurationDays: 5
            },
            {
              code: 'FINAL_HANDOVER',
              label: {
                code: 'FINAL_HANDOVER',
                fr: 'Réception définitive',
                ar: 'الاستلام النهائي',
                en: 'Final Handover'
              },
              requiresInspection: true,
              requiresEngineerApproval: false,
              estimatedDurationDays: 3
            }
          ]
        }
      ]
    }
  ]
};
