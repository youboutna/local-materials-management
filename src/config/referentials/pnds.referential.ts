/**
 * PNDS Mauritanie 2021-2030 - Référentiel Standard
 * Plan National de Développement Sanitaire avec financement bailleurs et approbations ministérielles
 */

import { MultiLanguageLabel } from './somelec.referential';

export interface ReferentialTask {
  code: string;
  label: MultiLanguageLabel;
  description?: MultiLanguageLabel;
  requiresInspection: boolean;
  requiresEngineerApproval: boolean;
  estimatedDurationDays?: number;
}

export interface ReferentialStep {
  code: string;
  label: MultiLanguageLabel;
  tasks: ReferentialTask[];
  order: number;
}

export interface ReferentialPhase {
  code: string;
  label: MultiLanguageLabel;
  description?: MultiLanguageLabel;
  steps: ReferentialStep[];
  order: number;
}

export interface ProjectReferential {
  code: string;
  name: MultiLanguageLabel;
  description: MultiLanguageLabel;
  requiresEngineeringConsultant: boolean;
  requiresDonorApproval: boolean;
  requiresMinistryApproval: boolean;
  paymentWorkflow: 'standard' | 'simplified' | 'custom';
  procurementTypes?: string[];
  phases: ReferentialPhase[];
}

export const pndsReferential: ProjectReferential = {
  code: 'PNDS_MAURITANIA_2021_2030',
  name: {
    code: 'PNDS_MAURITANIA',
    fr: 'Plan National de Développement Sanitaire 2021-2030',
    ar: 'الخطة الوطنية للتنمية الصحية 2021-2030',
    en: 'National Health Development Plan 2021-2030'
  },
  description: {
    code: 'PNDS_DESC',
    fr: 'Plan stratégique de développement sanitaire avec financement bailleurs, approbations ministérielles et coordination multisectorielle',
    ar: 'خطة استراتيجية للتنمية الصحية بتمويل المانحين وموافقات وزارية وتنسيق متعدد القطاعات',
    en: 'Strategic health development plan with donor funding, ministerial approvals and multisectoral coordination'
  },
  requiresEngineeringConsultant: true,
  requiresDonorApproval: true,
  requiresMinistryApproval: true,
  paymentWorkflow: 'standard',
  procurementTypes: ['Services de santé', 'Infrastructures', 'Équipements', 'Médicaments', 'Formation'],
  phases: [
    {
      code: 'PROGRAMME_1',
      label: {
        code: 'PROGRAMME_1',
        fr: 'Programme 1 : Accélération de la réduction de la mortalité maternelle, néonatale et infanto-juvénile',
        ar: 'البرنامج 1 : تسريع الحد من وفيات الأمهات والمواليد الجدد والأطفال دون الخامسة',
        en: 'Program 1: Acceleration of reduction of maternal, neonatal and under-5 mortality'
      },
      order: 1,
      steps: [
        {
          code: 'SOUS_PROGRAMME_1_1',
          label: {
            code: 'SOUS_PROGRAMME_1_1',
            fr: 'Sous-programme 1.1 : Réduction de la mortalité maternelle et néonatale',
            ar: 'البرنامج الفرعي 1.1 : الحد من وفيات الأمهات والمواليد الجدد',
            en: 'Sub-program 1.1: Reduction of maternal and neonatal mortality'
          },
          order: 1,
          tasks: [
            {
              code: 'MATERNITE_MOINDRE_RISQUE',
              label: {
                code: 'MATERNITE_MOINDRE_RISQUE',
                fr: 'Maternité à moindre risque',
                ar: 'الأمومة ذات المخاطر المنخفضة',
                en: 'Lower-risk maternity'
              },
              description: {
                code: 'MATERNITE_DESC',
                fr: 'Développement réseau SONU, système référence/contre-référence, 13 médicaments essentiels, centres transfusion sanguine',
                ar: 'تطوير شبكة SONU، نظام الإحالة/الإرجاع، 13 دواء أساسي، مراكز نقل الدم',
                en: 'Development of SONU network, referral/counter-referral system, 13 essential medicines, blood transfusion centers'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 730
            },
            {
              code: 'SOINS_NOUVEAU_NE',
              label: {
                code: 'SOINS_NOUVEAU_NE',
                fr: 'Soins du nouveau-né',
                ar: 'رعاية المواليد الجدد',
                en: 'Newborn care'
              },
              description: {
                code: 'SOINS_NN_DESC',
                fr: 'Vulgarisation SENN, unités réanimation néonatale, coin nouveau-nés, allaitement exclusif',
                ar: 'نشر SENN، وحدات إنعاش حديثي الولادة، ركن المواليد الجدد، الرضاعة الطبيعية الحصرية',
                en: 'Dissemination of SENN, neonatal resuscitation units, newborn corners, exclusive breastfeeding'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 365
            }
          ]
        },
        {
          code: 'SOUS_PROGRAMME_1_2',
          label: {
            code: 'SOUS_PROGRAMME_1_2',
            fr: 'Sous-programme 1.2 : Réduction de la mortalité infanto-juvénile',
            ar: 'البرنامج الفرعي 1.2 : الحد من وفيات الأطفال دون الخامسة',
            en: 'Sub-program 1.2: Reduction of under-5 mortality'
          },
          order: 2,
          tasks: [
            {
              code: 'LUTTE_MALNUTRITION',
              label: {
                code: 'LUTTE_MALNUTRITION',
                fr: 'Lutte contre la malnutrition',
                ar: 'مكافحة سوء التغذية',
                en: 'Fight against malnutrition'
              },
              description: {
                code: 'MALNUTRITION_DESC',
                fr: 'ANJE, complémentation micronutriments, prise en charge MAS, lutte surpoids, surveillance nutritionnelle',
                ar: 'تغذية الرضع وصغار الأطفال، مكملات المغذيات الدقيقة، إدارة سوء التغذية الحاد الوخيم، مكافحة زيادة الوزن، المراقبة التغذوية',
                en: 'IYCF, micronutrient supplementation, SAM management, overweight control, nutritional surveillance'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1095
            },
            {
              code: 'AMELIORATION_VACCINATION',
              label: {
                code: 'AMELIORATION_VACCINATION',
                fr: 'Amélioration couverture vaccinale',
                ar: 'تحسين التغطية التلقيحية',
                en: 'Improvement of vaccination coverage'
              },
              description: {
                code: 'VACCINATION_DESC',
                fr: 'Communication vaccination, introduction nouveaux vaccins, maintenance logistique, gestion déchets',
                ar: 'التواصل حول التلقيح، إدخال لقاحات جديدة، الصيانة اللوجستية، إدارة النفايات',
                en: 'Vaccination communication, new vaccine introduction, logistics maintenance, waste management'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 730
            }
          ]
        }
      ]
    },
    {
      code: 'PROGRAMME_2',
      label: {
        code: 'PROGRAMME_2',
        fr: 'Programme 2 : Renforcement de la lutte contre la maladie',
        ar: 'البرنامج 2 : تعزيز مكافحة الأمراض',
        en: 'Program 2: Strengthening disease control'
      },
      order: 2,
      steps: [
        {
          code: 'SOUS_PROGRAMME_2_1',
          label: {
            code: 'SOUS_PROGRAMME_2_1',
            fr: 'Sous-programme 2.1 : Maladies transmissibles',
            ar: 'البرنامج الفرعي 2.1 : الأمراض المعدية',
            en: 'Sub-program 2.1: Communicable diseases'
          },
          order: 1,
          tasks: [
            {
              code: 'VIH_HEPATITES',
              label: {
                code: 'VIH_HEPATITES',
                fr: 'Sida et hépatites',
                ar: 'الإيدز والتهابات الكبد',
                en: 'AIDS and hepatitis'
              },
              description: {
                code: 'VIH_DESC',
                fr: 'Élimination nouvelles infections, réduction mortalité VIH, approches transversales, contrôle hépatites',
                ar: 'القضاء على الإصابات الجديدة، خفض وفيات الإيدز، نهج متقاطعة، مكافحة التهاب الكبد',
                en: 'Elimination of new infections, HIV mortality reduction, cross-cutting approaches, hepatitis control'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1460
            },
            {
              code: 'TUBERCULOSE',
              label: {
                code: 'TUBERCULOSE',
                fr: 'Tuberculose',
                ar: 'السل',
                en: 'Tuberculosis'
              },
              description: {
                code: 'TB_DESC',
                fr: 'Renforcement capacités diagnostiques, détection personnes clés, augmentation demande soins, collaboration multisectorielle',
                ar: 'تعزيز القدرات التشخيصية، كشف الأشخاص الرئيسيين، زيادة الطلب على الرعاية، التعاون متعدد القطاعات',
                en: 'Strengthening diagnostic capacities, detection of key persons, increasing demand for care, multisectoral collaboration'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1460
            }
          ]
        },
        {
          code: 'SOUS_PROGRAMME_2_2',
          label: {
            code: 'SOUS_PROGRAMME_2_2',
            fr: 'Sous-programme 2.2 : Maladies non transmissibles',
            ar: 'البرنامج الفرعي 2.2 : الأمراض غير المعدية',
            en: 'Sub-program 2.2: Non-communicable diseases'
          },
          order: 2,
          tasks: [
            {
              code: 'FACTEURS_RISQUES_COMMUNS',
              label: {
                code: 'FACTEURS_RISQUES_COMMUNS',
                fr: 'Lutte contre les maladies à facteurs de risques communs',
                ar: 'مكافحة الأمراض ذات عوامل الخطر المشتركة',
                en: 'Fight against diseases with common risk factors'
              },
              description: {
                code: 'MNT_DESC',
                fr: 'Réorientation système santé, prise en charge décentralisée, surveillance et recherche',
                ar: 'إعادة توجيه النظام الصحي، الرعاية اللامركزية، المراقبة والبحث',
                en: 'Reorientation of health system, decentralized care, surveillance and research'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1825
            },
            {
              code: 'SANTE_MENTALE',
              label: {
                code: 'SANTE_MENTALE',
                fr: 'Santé mentale et neurologique',
                ar: 'الصحة النفسية والعصبية',
                en: 'Mental and neurological health'
              },
              description: {
                code: 'MENTAL_DESC',
                fr: 'Décentralisation prise en charge, soins psycho-sociaux VBG, coordination avec ONG',
                ar: 'اللامركزية في الرعاية، الرعاية النفسية الاجتماعية للعنف القائم على النوع، التنسيق مع المنظمات غير الحكومية',
                en: 'Decentralization of care, psychosocial care for GBV, coordination with NGOs'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1825
            }
          ]
        }
      ]
    },
    {
      code: 'PROGRAMME_3',
      label: {
        code: 'PROGRAMME_3',
        fr: 'Programme 3 : Sécurité sanitaire et réponse aux urgences',
        ar: 'البرنامج 3 : الأمن الصحي والاستجابة للطوارئ',
        en: 'Program 3: Health security and emergency response'
      },
      order: 3,
      steps: [
        {
          code: 'SOUS_PROGRAMME_3_1',
          label: {
            code: 'SOUS_PROGRAMME_3_1',
            fr: 'Sous-programme 3.1 : Cadres RSI et Sendai',
            ar: 'البرنامج الفرعي 3.1 : أطر اللوائح الصحية الدولية وسينداي',
            en: 'Sub-program 3.1: IHR and Sendai frameworks'
          },
          order: 1,
          tasks: [
            {
              code: 'PREPARATION_RIPOSTE',
              label: {
                code: 'PREPARATION_RIPOSTE',
                fr: 'Préparation et riposte aux crises',
                ar: 'الاستعداد والاستجابة للأزمات',
                en: 'Crisis preparedness and response'
              },
              description: {
                code: 'CRISE_DESC',
                fr: 'Cartographie risques, formation équipes rapides, simulations, collaboration multisectorielle',
                ar: 'رسم خرائط المخاطر، تدريب الفرق السريعة، المحاكاة، التعاون متعدد القطاعات',
                en: 'Risk mapping, rapid team training, simulations, multisectoral collaboration'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 730
            },
            {
              code: 'SURVEILLANCE_ONE_HEALTH',
              label: {
                code: 'SURVEILLANCE_ONE_HEALTH',
                fr: 'Surveillance épidémiologique "Une seule santé"',
                ar: 'المراقبة الوبائية "صحة واحدة"',
                en: '"One Health" epidemiological surveillance'
              },
              description: {
                code: 'ONE_HEALTH_DESC',
                fr: 'Renforcement surveillance, interopérabilité systèmes, coordination parties prenantes, prévention pandémies',
                ar: 'تعزيز المراقبة، التوافقية بين الأنظمة، تنسيق أصحاب المصلحة، الوقاية من الأوبئة',
                en: 'Strengthening surveillance, system interoperability, stakeholder coordination, pandemic prevention'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1460
            }
          ]
        },
        {
          code: 'SOUS_PROGRAMME_3_2',
          label: {
            code: 'SOUS_PROGRAMME_3_2',
            fr: 'Sous-programme 3.2 : PCI et gestion déchets biomédicaux',
            ar: 'البرنامج الفرعي 3.2 : PCI وإدارة النفايات الطبية',
            en: 'Sub-program 3.2: IPC and biomedical waste management'
          },
          order: 2,
          tasks: [
            {
              code: 'PCI_DECHETS',
              label: {
                code: 'PCI_DECHETS',
                fr: 'Prévention et contrôle infections',
                ar: 'الوقاية من العدوى ومكافحتها',
                en: 'Infection prevention and control'
              },
              description: {
                code: 'PCI_DESC',
                fr: 'Renforcement cadre institutionnel, mise à jour plans, technologies adaptées, suivi-évaluation',
                ar: 'تعزيز الإطار المؤسسي، تحديث الخطط، تقنيات مناسبة، المتابعة والتقييم',
                en: 'Strengthening institutional framework, updating plans, adapted technologies, monitoring and evaluation'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1095
            }
          ]
        }
      ]
    },
    {
      code: 'PROGRAMME_4',
      label: {
        code: 'PROGRAMME_4',
        fr: 'Programme 4 : Renforcement du système de santé pour CSU',
        ar: 'البرنامج 4 : تعزيز النظام الصحي للتغطية الصحية الشاملة',
        en: 'Program 4: Strengthening health system for UHC'
      },
      order: 4,
      steps: [
        {
          code: 'SOUS_PROGRAMME_4_1',
          label: {
            code: 'SOUS_PROGRAMME_4_1',
            fr: 'Sous-programme 4.1 : Gouvernance et leadership',
            ar: 'البرنامج الفرعي 4.1 : الحوكمة والقيادة',
            en: 'Sub-program 4.1: Governance and leadership'
          },
          order: 1,
          tasks: [
            {
              code: 'GOUVERNANCE_SECTORIELLE',
              label: {
                code: 'GOUVERNANCE_SECTORIELLE',
                fr: 'Gouvernance et leadership sectoriel',
                ar: 'الحوكمة والقيادة القطاعية',
                en: 'Sectoral governance and leadership'
              },
              description: {
                code: 'GOUV_DESC',
                fr: 'Accélération réformes, santé dans toutes politiques, décentralisation, compact contraignant',
                ar: 'تسريع الإصلاحات، الصحة في جميع السياسات، اللامركزية، ميثاق ملزم',
                en: 'Acceleration of reforms, health in all policies, decentralization, binding compact'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1825
            },
            {
              code: 'PPP_SANTE',
              label: {
                code: 'PPP_SANTE',
                fr: 'Partenariat Public-Privé',
                ar: 'الشراكة بين القطاعين العام والخاص',
                en: 'Public-Private Partnership'
              },
              description: {
                code: 'PPP_DESC',
                fr: 'Réorientation rôle MS, cadre institutionnel PPP, implication entreprises privées',
                ar: 'إعادة توجيه دور وزارة الصحة، الإطار المؤسسي للشراكة، إشراك الشركات الخاصة',
                en: 'Reorientation of MoH role, institutional PPP framework, involvement of private companies'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1460
            }
          ]
        },
        {
          code: 'SOUS_PROGRAMME_4_2',
          label: {
            code: 'SOUS_PROGRAMME_4_2',
            fr: 'Sous-programme 4.2 : Financement CSU',
            ar: 'البرنامج الفرعي 4.2 : تمويل التغطية الصحية الشاملة',
            en: 'Sub-program 4.2: UHC financing'
          },
          order: 2,
          tasks: [
            {
              code: 'FINANCEMENT_CSU',
              label: {
                code: 'FINANCEMENT_CSU',
                fr: 'Financement de la couverture sanitaire universelle',
                ar: 'تمويل التغطية الصحية الشاملة',
                en: 'Universal health coverage financing'
              },
              description: {
                code: 'FIN_CSU_DESC',
                fr: 'Augmentation budget santé, protection sociale, mécanismes financement innovants',
                ar: 'زيادة ميزانية الصحة، الحماية الاجتماعية، آليات تمويل مبتكرة',
                en: 'Increase in health budget, social protection, innovative financing mechanisms'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 1825
            }
          ]
        }
      ]
    }
  ]
};
