/**
 * SDAU Nouakchott 2018-2040 - Référentiel Standard
 * Schéma Directeur d'Aménagement et d'Urbanisme avec financement JICA et approbations ministérielles
 */

export interface MultiLanguageLabel {
  code: string;
  fr: string;
  ar: string;
  en: string;
}

export interface ReferentialTask {
  code: string;
  label: MultiLanguageLabel;
  description?: MultiLanguageLabel;
  requiresInspection: boolean;
  requiresEngineerApproval: boolean;
  requiresDonorApproval: boolean;
  estimatedDurationDays?: number;
  estimatedBudget: number; // en millions d'UM
  responsibleEntities: string[];
  indicators?: {
    code: string;
    label: MultiLanguageLabel;
    targetValue: number;
    unit: string;
  }[];
}

export interface ReferentialStep {
  code: string;
  label: MultiLanguageLabel;
  tasks: ReferentialTask[];
  order: number;
  timeline: {
    startYear: number;
    endYear: number;
  };
}

export interface ReferentialPhase {
  code: string;
  label: MultiLanguageLabel;
  description?: MultiLanguageLabel;
  steps: ReferentialStep[];
  order: number;
  budgetAllocation: number; // en millions d'UM
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
  totalBudget: number;
  timeline: {
    startYear: number;
    endYear: number;
  };
  fundingSources: {
    name: string;
    percentage: number;
  }[];
  approvingEntities: string[];
}

export const sdauReferential: ProjectReferential = {
  code: 'SDAU_NOUAKCHOTT_2018_2040',
  name: {
    code: 'SDAU_NOUAKCHOTT',
    fr: 'Schéma Directeur d\'Aménagement et d\'Urbanisme de Nouakchott 2018-2040',
    ar: 'المخطط التوجيهي للتهيئة والتعمير لمدينة نواكشوط 2018-2040',
    en: 'Master Plan for Planning and Urbanism of Nouakchott 2018-2040'
  },
  description: {
    code: 'SDAU_DESC',
    fr: 'Plan stratégique d\'aménagement urbain avec financement JICA, approbations ministérielles et coordination multisectorielle',
    ar: 'خطة استراتيجية للتهيئة الحضرية بتمويل الوكالة اليابانية للتعاون الدولي وموافقات وزارية وتنسيق متعدد القطاعات',
    en: 'Strategic urban planning plan with JICA funding, ministerial approvals and multisectoral coordination'
  },
  requiresEngineeringConsultant: true,
  requiresDonorApproval: true,
  requiresMinistryApproval: true,
  paymentWorkflow: 'standard',
  procurementTypes: ['Infrastructures routières', 'Transport public', 'Assainissement', 'Équipements publics', 'Études techniques'],
  totalBudget: 500000, // 500 milliards d'UM
  timeline: {
    startYear: 2018,
    endYear: 2040
  },
  fundingSources: [
    { name: 'JICA (Agence Japonaise de Coopération Internationale)', percentage: 60 },
    { name: 'Gouvernement Mauritanien', percentage: 25 },
    { name: 'Banque Mondiale', percentage: 10 },
    { name: 'Autres bailleurs', percentage: 5 }
  ],
  approvingEntities: ['MHUAT', 'CUN', 'Ministère des Finances', 'Ministère de l\'Intérieur'],
  phases: [
    {
      code: 'PHASE_1_STRUCTURANTE',
      label: {
        code: 'PHASE_1',
        fr: 'Phase 1 : Projets structurants (2018-2025)',
        ar: 'المرحلة 1 : مشاريع هيكلية (2018-2025)',
        en: 'Phase 1: Structuring projects (2018-2025)'
      },
      description: {
        code: 'PHASE_1_DESC',
        fr: 'Mise en place des infrastructures fondamentales pour maîtriser la croissance urbaine',
        ar: 'إنجاز البنى التحتية الأساسية للسيطرة على النمو الحضري',
        en: 'Implementation of fundamental infrastructures to control urban growth'
      },
      order: 1,
      budgetAllocation: 150000, // 150 milliards
      steps: [
        {
          code: 'STEP_1_1_TRANSPORT',
          label: {
            code: 'STEP_1_1',
            fr: 'Étape 1.1 : Réseau de transport structurant',
            ar: 'المرحلة 1.1 : شبكة النقل الهيكلية',
            en: 'Step 1.1: Structuring transport network'
          },
          order: 1,
          timeline: {
            startYear: 2018,
            endYear: 2025
          },
          tasks: [
            {
              code: 'CONSTRUCTION_ROCADE',
              label: {
                code: 'CONSTRUCTION_ROCADE',
                fr: 'Construction des trois rocades urbaines',
                ar: 'بناء ثلاث طرق محيطية حضرية',
                en: 'Construction of three urban ring roads'
              },
              description: {
                code: 'ROCADE_DESC',
                fr: 'Rocade Nord, Rocade Est et Rocade Sud pour fluidifier la circulation et structurer l\'expansion urbaine',
                ar: 'الطريق المحيطي الشمالي، الشرقي والجنوبي لتسهيل حركة المرور وهيكلة التوسع الحضري',
                en: 'North, East and South ring roads to facilitate traffic and structure urban expansion'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              requiresDonorApproval: true,
              estimatedDurationDays: 2555,
              estimatedBudget: 75000,
              responsibleEntities: ['MHUAT', 'CUN', 'Ministère des Transports'],
              indicators: [
                {
                  code: 'KM_ROUTES',
                  label: {
                    code: 'KM_ROUTES',
                    fr: 'Kilomètres de rocades construites',
                    ar: 'كيلومترات الطرق المحيطية المنجزة',
                    en: 'Kilometers of ring roads built'
                  },
                  targetValue: 150,
                  unit: 'km'
                }
              ]
            },
            {
              code: 'BHNS_SYSTEM',
              label: {
                code: 'BHNS_SYSTEM',
                fr: 'Mise en service du système BHNS',
                ar: 'تشغيل نظام الحافلات عالية المستوى',
                en: 'Commissioning of the BRT system'
              },
              description: {
                code: 'BHNS_DESC',
                fr: 'Bus à Haut Niveau de Service avec voies dédiées, stations et centres de contrôle',
                ar: 'حافلات عالية المستوى مع مسارات مخصصة، محطات ومراكز مراقبة',
                en: 'Bus Rapid Transit with dedicated lanes, stations and control centers'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              requiresDonorApproval: true,
              estimatedDurationDays: 1825,
              estimatedBudget: 30000,
              responsibleEntities: ['CUN', 'Société de Transport Public'],
              indicators: [
                {
                  code: 'PASSAGERS_BHNS',
                  label: {
                    code: 'PASSAGERS_BHNS',
                    fr: 'Nombre de passagers transportés quotidiennement',
                    ar: 'عدد الركاب المنقولين يوميا',
                    en: 'Number of passengers transported daily'
                  },
                  targetValue: 50000,
                  unit: 'passagers/jour'
                }
              ]
            }
          ]
        },
        {
          code: 'STEP_1_2_ASSAINISSEMENT',
          label: {
            code: 'STEP_1_2',
            fr: 'Étape 1.2 : Système d\'assainissement intégré',
            ar: 'المرحلة 1.2 : نظام الصرف الصحي المتكامل',
            en: 'Step 1.2: Integrated sanitation system'
          },
          order: 2,
          timeline: {
            startYear: 2019,
            endYear: 2027
          },
          tasks: [
            {
              code: 'RESEAU_ASSAINISSEMENT',
              label: {
                code: 'RESEAU_ASSAINISSEMENT',
                fr: 'Construction du réseau d\'assainissement principal',
                ar: 'بناء شبكة الصرف الصحي الرئيسية',
                en: 'Construction of main sanitation network'
              },
              description: {
                code: 'ASSAIN_DESC',
                fr: 'Réseau d\'égouts, stations de pompage et stations d\'épuration selon le PDAN',
                ar: 'شبكة المجاري، محطات الضخ ومحطات المعالجة وفق مخطط الصرف الصحي',
                en: 'Sewer network, pumping stations and treatment plants according to the Sanitation Master Plan'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              requiresDonorApproval: true,
              estimatedDurationDays: 2920,
              estimatedBudget: 45000,
              responsibleEntities: ['ONAS', 'Ministère de l\'Hydraulique'],
              indicators: [
                {
                  code: 'POPULATION_COUVERTE',
                  label: {
                    code: 'POPULATION_COUVERTE',
                    fr: 'Population couverte par le réseau',
                    ar: 'السكان المغطاة بالشبكة',
                    en: 'Population covered by the network'
                  },
                  targetValue: 70,
                  unit: '%'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      code: 'PHASE_2_DENSIFICATION',
      label: {
        code: 'PHASE_2',
        fr: 'Phase 2 : Densification et équipements (2025-2035)',
        ar: 'المرحلة 2 : التكثيف والتجهيزات (2025-2035)',
        en: 'Phase 2: Densification and equipment (2025-2035)'
      },
      description: {
        code: 'PHASE_2_DESC',
        fr: 'Développement des équipements publics et densification urbaine contrôlée',
        ar: 'تطوير التجهيزات العمومية والتكثيف الحضري المنضبط',
        en: 'Development of public facilities and controlled urban densification'
      },
      order: 2,
      budgetAllocation: 200000, // 200 milliards
      steps: [
        {
          code: 'STEP_2_1_EQUIPEMENTS',
          label: {
            code: 'STEP_2_1',
            fr: 'Étape 2.1 : Équipements publics structurants',
            ar: 'المرحلة 2.1 : التجهيزات العمومية الهيكلية',
            en: 'Step 2.1: Structuring public facilities'
          },
          order: 1,
          timeline: {
            startYear: 2025,
            endYear: 2032
          },
          tasks: [
            {
              code: 'ECOLE_HOPITAUX',
              label: {
                code: 'ECOLE_HOPITAUX',
                fr: 'Construction d\'écoles et hôpitaux',
                ar: 'بناء المدارس والمستشفيات',
                en: 'Construction of schools and hospitals'
              },
              description: {
                code: 'EDUC_SANTE_DESC',
                fr: '50 nouvelles écoles, 5 hôpitaux de district et centres de santé selon les normes SDAU',
                ar: '50 مدرسة جديدة، 5 مستشفيات جهوية ومراكز صحية وفق معايير المخطط التوجيهي',
                en: '50 new schools, 5 district hospitals and health centers according to SDAU standards'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              requiresDonorApproval: true,
              estimatedDurationDays: 2555,
              estimatedBudget: 80000,
              responsibleEntities: ['Ministère de l\'Éducation', 'Ministère de la Santé', 'CUN'],
              indicators: [
                {
                  code: 'NB_ECOLE_CONSTRUITES',
                  label: {
                    code: 'NB_ECOLE_CONSTRUITES',
                    fr: 'Nombre d\'écoles construites',
                    ar: 'عدد المدارس المبنية',
                    en: 'Number of schools built'
                  },
                  targetValue: 50,
                  unit: 'unités'
                }
              ]
            },
            {
              code: 'CENTRALITES_SECONDAIRES',
              label: {
                code: 'CENTRALITES_SECONDAIRES',
                fr: 'Développement des centralités secondaires',
                ar: 'تطوير المراكز الثانوية',
                en: 'Development of secondary centers'
              },
              description: {
                code: 'CENTRALITES_DESC',
                fr: 'Création de 8 pôles urbains secondaires avec équipements commerciaux et administratifs',
                ar: 'إنشاء 8 أقطاب حضرية ثانوية مع تجهيزات تجارية وإدارية',
                en: 'Creation of 8 secondary urban poles with commercial and administrative facilities'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              requiresDonorApproval: false,
              estimatedDurationDays: 3650,
              estimatedBudget: 70000,
              responsibleEntities: ['CUN', 'Communes'],
              indicators: [
                {
                  code: 'CENTRALITES_OPERATIONNELLES',
                  label: {
                    code: 'CENTRALITES_OPERATIONNELLES',
                    fr: 'Centralités secondaires opérationnelles',
                    ar: 'المراكز الثانوية العاملة',
                    en: 'Operational secondary centers'
                  },
                  targetValue: 8,
                  unit: 'unités'
                }
              ]
            }
          ]
        },
        {
          code: 'STEP_2_2_DENSIFICATION',
          label: {
            code: 'STEP_2_2',
            fr: 'Étape 2.2 : Densification urbaine',
            ar: 'المرحلة 2.2 : التكثيف الحضري',
            en: 'Step 2.2: Urban densification'
          },
          order: 2,
          timeline: {
            startYear: 2026,
            endYear: 2035
          },
          tasks: [
            {
              code: 'RENOUVELLEMENT_URBAIN',
              label: {
                code: 'RENOUVELLEMENT_URBAIN',
                fr: 'Renouvellement urbain des quartiers existants',
                ar: 'التجديد الحضري للأحياء القائمة',
                en: 'Urban renewal of existing neighborhoods'
              },
              description: {
                code: 'RENOUV_DESC',
                fr: 'Restauration de bidonvilles, amélioration des logements, création d\'espaces verts',
                ar: 'إعادة تأهيل الأحياء العشوائية، تحسين المساكن، إنشاء المساحات الخضراء',
                en: 'Slum upgrading, housing improvement, creation of green spaces'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              requiresDonorApproval: true,
              estimatedDurationDays: 3285,
              estimatedBudget: 50000,
              responsibleEntities: ['ADU', 'Communes', 'MHUAT'],
              indicators: [
                {
                  code: 'POPULATION_RELOGEE',
                  label: {
                    code: 'POPULATION_RELOGEE',
                    fr: 'Population relogée',
                    ar: 'السكان المعاد إسكانهم',
                    en: 'Population relocated'
                  },
                  targetValue: 100000,
                  unit: 'personnes'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      code: 'PHASE_3_CONSOLIDATION',
      label: {
        code: 'PHASE_3',
        fr: 'Phase 3 : Consolidation (2035-2040)',
        ar: 'المرحلة 3 : التعزيز (2035-2040)',
        en: 'Phase 3: Consolidation (2035-2040)'
      },
      description: {
        code: 'PHASE_3_DESC',
        fr: 'Achèvement des réseaux et consolidation du développement urbain',
        ar: 'إكمال الشبكات وتعزيز التنمية الحضرية',
        en: 'Completion of networks and consolidation of urban development'
      },
      order: 3,
      budgetAllocation: 150000, // 150 milliards
      steps: [
        {
          code: 'STEP_3_1_RESEAUX_FINAUX',
          label: {
            code: 'STEP_3_1',
            fr: 'Étape 3.1 : Achèvement des réseaux',
            ar: 'المرحلة 3.1 : إكمال الشبكات',
            en: 'Step 3.1: Network completion'
          },
          order: 1,
          timeline: {
            startYear: 2035,
            endYear: 2040
          },
          tasks: [
            {
              code: 'RESEAUX_SECONDAIRES',
              label: {
                code: 'RESEAUX_SECONDAIRES',
                fr: 'Extension des réseaux secondaires',
                ar: 'توسيع الشبكات الثانوية',
                en: 'Extension of secondary networks'
              },
              description: {
                code: 'RESEAUX_SEC_DESC',
                fr: 'Réseaux d\'eau potable, électricité, télécommunications dans toutes les zones urbanisées',
                ar: 'شبكات المياه الصالحة للشرب، الكهرباء، الاتصالات في جميع المناطق العمرانية',
                en: 'Drinking water, electricity, telecommunications networks in all urbanized areas'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              requiresDonorApproval: false,
              estimatedDurationDays: 1825,
              estimatedBudget: 80000,
              responsibleEntities: ['SNDE', 'SOMELEC', 'CUN'],
              indicators: [
                {
                  code: 'COUVERTURE_EAU',
                  label: {
                    code: 'COUVERTURE_EAU',
                    fr: 'Couverture en eau potable',
                    ar: 'تغطية المياه الصالحة للشرب',
                    en: 'Drinking water coverage'
                  },
                  targetValue: 95,
                  unit: '%'
                }
              ]
            },
            {
              code: 'ESPACES_VERTS',
              label: {
                code: 'ESPACES_VERTS',
                fr: 'Aménagement des espaces verts',
                ar: 'تهيئة المساحات الخضراء',
                en: 'Development of green spaces'
              },
              description: {
                code: 'VERTS_DESC',
                fr: 'Parcs urbains, ceinture verte étendue, corridors écologiques',
                ar: 'المتنزهات الحضرية، الحزام الأخضر الموسع، الممرات البيئية',
                en: 'Urban parks, extended green belt, ecological corridors'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              requiresDonorApproval: false,
              estimatedDurationDays: 1825,
              estimatedBudget: 70000,
              responsibleEntities: ['CUN', 'Communes', 'MEDD'],
              indicators: [
                {
                  code: 'SURFACE_VERTS',
                  label: {
                    code: 'SURFACE_VERTS',
                    fr: 'Surface d\'espaces verts par habitant',
                    ar: 'مساحة المساحات الخضراء لكل ساكن',
                    en: 'Green space surface per inhabitant'
                  },
                  targetValue: 15,
                  unit: 'm²/habitant'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      code: 'PHASE_4_GOUVERNANCE',
      label: {
        code: 'PHASE_4',
        fr: 'Phase 4 : Gouvernance et suivi (2018-2040)',
        ar: 'المرحلة 4 : الحوكمة والمتابعة (2018-2040)',
        en: 'Phase 4: Governance and monitoring (2018-2040)'
      },
      description: {
        code: 'PHASE_4_DESC',
        fr: 'Renforcement institutionnel, planification participative et suivi-évaluation',
        ar: 'التعزيز المؤسسي، التخطيط التشاركي والمتابعة والتقييم',
        en: 'Institutional strengthening, participatory planning and monitoring-evaluation'
      },
      order: 4,
      budgetAllocation: 50000, // 50 milliards
      steps: [
        {
          code: 'STEP_4_1_CAPACITES',
          label: {
            code: 'STEP_4_1',
            fr: 'Étape 4.1 : Renforcement des capacités',
            ar: 'المرحلة 4.1 : تعزيز القدرات',
            en: 'Step 4.1: Capacity building'
          },
          order: 1,
          timeline: {
            startYear: 2018,
            endYear: 2040
          },
          tasks: [
            {
              code: 'FORMATION_ACTEURS',
              label: {
                code: 'FORMATION_ACTEURS',
                fr: 'Formation des acteurs institutionnels',
                ar: 'تدريب الفاعلين المؤسسيين',
                en: 'Training of institutional actors'
              },
              description: {
                code: 'FORMATION_DESC',
                fr: 'Formation du MHUAT, CUN et communes en urbanisme, SIG, gestion de projet',
                ar: 'تدريب وزارة الإسكان، المجموعة الحضرية والبلديات في التعمير، نظم المعلومات الجغرافية، إدارة المشاريع',
                en: 'Training of MHUAT, CUN and communes in urban planning, GIS, project management'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              requiresDonorApproval: true,
              estimatedDurationDays: 8030,
              estimatedBudget: 20000,
              responsibleEntities: ['MHUAT', 'JICA', 'CUN'],
              indicators: [
                {
                  code: 'AGENTS_FORMES',
                  label: {
                    code: 'AGENTS_FORMES',
                    fr: 'Agents formés',
                    ar: 'العاملين المدربين',
                    en: 'Trained agents'
                  },
                  targetValue: 500,
                  unit: 'personnes'
                }
              ]
            },
            {
              code: 'SYSTEME_SUIVI',
              label: {
                code: 'SYSTEME_SUIVI',
                fr: 'Système de suivi-évaluation',
                ar: 'نظام المتابعة والتقييم',
                en: 'Monitoring-evaluation system'
              },
              description: {
                code: 'SUIVI_DESC',
                fr: 'Plateforme SIG, indicateurs de performance, rapports périodiques',
                ar: 'منصة نظم المعلومات الجغرافية، مؤشرات الأداء، تقارير دورية',
                en: 'GIS platform, performance indicators, periodic reports'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              requiresDonorApproval: true,
              estimatedDurationDays: 730,
              estimatedBudget: 10000,
              responsibleEntities: ['OSPUN', 'MHUAT'],
              indicators: [
                {
                  code: 'INDICATEURS_MONITORES',
                  label: {
                    code: 'INDICATEURS_MONITORES',
                    fr: 'Indicateurs monitorés en temps réel',
                    ar: 'المؤشرات المراقبة في الوقت الحقيقي',
                    en: 'Indicators monitored in real time'
                  },
                  targetValue: 50,
                  unit: 'indicateurs'
                }
              ]
            }
          ]
        },
        {
          code: 'STEP_4_2_PARTICIPATION',
          label: {
            code: 'STEP_4_2',
            fr: 'Étape 4.2 : Planification participative',
            ar: 'المرحلة 4.2 : التخطيط التشاركي',
            en: 'Step 4.2: Participatory planning'
          },
          order: 2,
          timeline: {
            startYear: 2018,
            endYear: 2040
          },
          tasks: [
            {
              code: 'CONCERTATION_PUBLIQUE',
              label: {
                code: 'CONCERTATION_PUBLIQUE',
                fr: 'Concertation publique',
                ar: 'التشاور العمومي',
                en: 'Public consultation'
              },
              description: {
                code: 'CONCERT_DESC',
                fr: 'Ateliers participatifs dans les 9 communes, intégration dans l\'Évaluation Environnementale Stratégique',
                ar: 'ورشات تشاركية في البلديات التسع، الإدماج في التقييم البيئي الاستراتيجي',
                en: 'Participatory workshops in the 9 communes, integration in the Strategic Environmental Assessment'
              },
              requiresInspection: false,
              requiresEngineerApproval: false,
              requiresDonorApproval: true,
              estimatedDurationDays: 8030,
              estimatedBudget: 20000,
              responsibleEntities: ['CUN', 'Communes', 'MHUAT'],
              indicators: [
                {
                  code: 'CITOYENS_CONSULTES',
                  label: {
                    code: 'CITOYENS_CONSULTES',
                    fr: 'Citoyens consultés',
                    ar: 'المواطنين المستشارين',
                    en: 'Citizens consulted'
                  },
                  targetValue: 10000,
                  unit: 'personnes'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Fonctions utilitaires pour manipuler le référentiel
export class SDAUProjectManager {
  private referential: ProjectReferential;

  constructor(referential: ProjectReferential = sdauReferential) {
    this.referential = referential;
  }

  // Obtenir toutes les tâches d'une phase spécifique
  getTasksByPhase(phaseCode: string): ReferentialTask[] {
    const phase = this.referential.phases.find(p => p.code === phaseCode);
    if (!phase) return [];

    return phase.steps.flatMap(step => step.tasks);
  }

  // Calculer le budget total consommé jusqu'à une année donnée
  calculateBudgetUntilYear(year: number): number {
    let total = 0;
    
    this.referential.phases.forEach(phase => {
      phase.steps.forEach(step => {
        if (step.timeline.endYear <= year) {
          step.tasks.forEach(task => {
            total += task.estimatedBudget;
          });
        }
      });
    });

    return total;
  }

  // Obtenir les tâches nécessitant l'approbation d'un bailleur
  getTasksRequiringDonorApproval(): ReferentialTask[] {
    const allTasks: ReferentialTask[] = [];
    
    this.referential.phases.forEach(phase => {
      phase.steps.forEach(step => {
        step.tasks.forEach(task => {
          if (task.requiresDonorApproval) {
            allTasks.push(task);
          }
        });
      });
    });

    return allTasks;
  }

  // Générer un rapport de synthèse
  generateSummaryReport() {
    const totalTasks = this.referential.phases.reduce((sum, phase) => {
      return sum + phase.steps.reduce((stepSum, step) => stepSum + step.tasks.length, 0);
    }, 0);

    const tasksWithInspection = this.referential.phases.reduce((sum, phase) => {
      return sum + phase.steps.reduce((stepSum, step) => {
        return stepSum + step.tasks.filter(t => t.requiresInspection).length;
      }, 0);
    }, 0);

    return {
      projectName: this.referential.name.fr,
      totalPhases: this.referential.phases.length,
      totalTasks,
      tasksWithInspection,
      tasksRequiringDonorApproval: this.getTasksRequiringDonorApproval().length,
      totalBudget: this.referential.totalBudget,
      timeline: `${this.referential.timeline.startYear}-${this.referential.timeline.endYear}`,
      fundingSources: this.referential.fundingSources
    };
  }

  // Obtenir la progression par année
  getYearlyProgress(year: number) {
    const phasesProgress = this.referential.phases.map(phase => {
      const phaseTasks = this.getTasksByPhase(phase.code);
      const completedTasks = phaseTasks.filter(task => {
        // Logique simplifiée: considère une tâche comme terminée si son année de fin est passée
        const step = phase.steps.find(s => s.tasks.includes(task));
        return step && step.timeline.endYear <= year;
      }).length;

      return {
        phase: phase.label.fr,
        progress: phaseTasks.length > 0 ? (completedTasks / phaseTasks.length) * 100 : 0,
        completedTasks,
        totalTasks: phaseTasks.length
      };
    });

    const totalTasks = phasesProgress.reduce((sum, p) => sum + p.totalTasks, 0);
    const totalCompleted = phasesProgress.reduce((sum, p) => sum + p.completedTasks, 0);
    const overallProgress = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

    return {
      year,
      overallProgress,
      budgetSpent: this.calculateBudgetUntilYear(year),
      phases: phasesProgress
    };
  }
}

