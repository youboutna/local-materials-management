/**
 * SOMELEC Standard Project Referential
 * Infrastructure projects with donor funding and engineering consultants
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
  phases: ReferentialPhase[];
}

export const somelecReferential: ProjectReferential = {
  code: 'SOMELEC_INFRA',
  name: {
    code: 'SOMELEC_INFRA',
    fr: 'Projet d\'Infrastructure SOMELEC',
    ar: 'مشروع البنية التحتية سوميلك',
    en: 'SOMELEC Infrastructure Project'
  },
  description: {
    code: 'SOMELEC_INFRA_DESC',
    fr: 'Projets d\'infrastructures électriques avec financement bailleur et consultant ingénierie',
    ar: 'مشاريع البنية التحتية الكهربائية بتمويل المانحين والاستشارات الهندسية',
    en: 'Electrical infrastructure projects with donor funding and engineering consultant'
  },
  requiresEngineeringConsultant: true,
  requiresDonorApproval: true,
  requiresMinistryApproval: true,
  paymentWorkflow: 'standard',
  phases: [
    {
      code: 'PRE_FEASIBILITY',
      label: {
        code: 'PRE_FEASIBILITY',
        fr: 'Pré-faisabilité et Études Préliminaires',
        ar: 'ما قبل الجدوى والدراسات الأولية',
        en: 'Pre-feasibility and Preliminary Studies'
      },
      order: 1,
      steps: [
        {
          code: 'NEEDS_ASSESSMENT',
          label: {
            code: 'NEEDS_ASSESSMENT',
            fr: 'Analyse des besoins',
            ar: 'تحليل الاحتياجات',
            en: 'Needs Assessment'
          },
          order: 1,
          tasks: [
            {
              code: 'COLLECT_REQUIREMENTS',
              label: {
                code: 'COLLECT_REQUIREMENTS',
                fr: 'Collecte des besoins des parties prenantes',
                ar: 'جمع احتياجات أصحاب المصلحة',
                en: 'Stakeholder Requirements Collection'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 15
            },
            {
              code: 'MARKET_STUDY',
              label: {
                code: 'MARKET_STUDY',
                fr: 'Étude de marché',
                ar: 'دراسة السوق',
                en: 'Market Study'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 20
            }
          ]
        },
        {
          code: 'FEASIBILITY_STUDY',
          label: {
            code: 'FEASIBILITY_STUDY',
            fr: 'Étude de faisabilité',
            ar: 'دراسة الجدوى',
            en: 'Feasibility Study'
          },
          order: 2,
          tasks: [
            {
              code: 'TECHNICAL_FEASIBILITY',
              label: {
                code: 'TECHNICAL_FEASIBILITY',
                fr: 'Faisabilité technique',
                ar: 'الجدوى الفنية',
                en: 'Technical Feasibility'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 30
            },
            {
              code: 'FINANCIAL_FEASIBILITY',
              label: {
                code: 'FINANCIAL_FEASIBILITY',
                fr: 'Faisabilité financière',
                ar: 'الجدوى المالية',
                en: 'Financial Feasibility'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 25
            }
          ]
        }
      ]
    },
    {
      code: 'DESIGN_DAO',
      label: {
        code: 'DESIGN_DAO',
        fr: 'Conception et DAO',
        ar: 'التصميم وملف المناقصة',
        en: 'Design and Tender Dossier'
      },
      order: 2,
      steps: [
        {
          code: 'PRELIMINARY_DESIGN',
          label: {
            code: 'PRELIMINARY_DESIGN',
            fr: 'Avant-projet',
            ar: 'المشروع الأولي',
            en: 'Preliminary Design'
          },
          order: 1,
          tasks: [
            {
              code: 'TOPO_SURVEY',
              label: {
                code: 'TOPO_SURVEY',
                fr: 'Relevés topographiques',
                ar: 'المسوحات الطبوغرافية',
                en: 'Topographic Surveys'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 20
            },
            {
              code: 'ENVIRONMENTAL_IMPACT',
              label: {
                code: 'ENVIRONMENTAL_IMPACT',
                fr: 'Étude d\'impact environnemental',
                ar: 'دراسة الأثر البيئي',
                en: 'Environmental Impact Study'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 30
            }
          ]
        },
        {
          code: 'FINAL_DESIGN',
          label: {
            code: 'FINAL_DESIGN',
            fr: 'Études techniques détaillées',
            ar: 'الدراسات الفنية التفصيلية',
            en: 'Detailed Technical Studies'
          },
          order: 2,
          tasks: [
            {
              code: 'CIVIL_ENGINEERING',
              label: {
                code: 'CIVIL_ENGINEERING',
                fr: 'Plans génie civil',
                ar: 'خطط الهندسة المدنية',
                en: 'Civil Engineering Plans'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 45
            },
            {
              code: 'ELECTRICAL_DESIGN',
              label: {
                code: 'ELECTRICAL_DESIGN',
                fr: 'Conception électrique',
                ar: 'التصميم الكهربائي',
                en: 'Electrical Design'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 40
            }
          ]
        },
        {
          code: 'TENDER_DOSSIER',
          label: {
            code: 'TENDER_DOSSIER',
            fr: 'Rédaction DAO',
            ar: 'إعداد ملف المناقصة',
            en: 'Tender Dossier Preparation'
          },
          order: 3,
          tasks: [
            {
              code: 'DAO_PREPARATION',
              label: {
                code: 'DAO_PREPARATION',
                fr: 'Préparation du dossier d\'appel d\'offres',
                ar: 'إعداد ملف دعوة تقديم العروض',
                en: 'Tender Call Dossier Preparation'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 30
            },
            {
              code: 'DAO_VALIDATION',
              label: {
                code: 'DAO_VALIDATION',
                fr: 'Validation DAO par les autorités',
                ar: 'التحقق من ملف المناقصة من قبل السلطات',
                en: 'Tender Dossier Validation by Authorities'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 15
            }
          ]
        }
      ]
    },
    {
      code: 'EXECUTION',
      label: {
        code: 'EXECUTION',
        fr: 'Exécution',
        ar: 'التنفيذ',
        en: 'Execution'
      },
      order: 3,
      steps: [
        {
          code: 'MOBILIZATION',
          label: {
            code: 'MOBILIZATION',
            fr: 'Mobilisation chantier',
            ar: 'تعبئة الموقع',
            en: 'Site Mobilization'
          },
          order: 1,
          tasks: [
            {
              code: 'SITE_INSTALLATION',
              label: {
                code: 'SITE_INSTALLATION',
                fr: 'Installation de chantier',
                ar: 'تركيب الموقع',
                en: 'Site Installation'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 10
            }
          ]
        },
        {
          code: 'CONSTRUCTION',
          label: {
            code: 'CONSTRUCTION',
            fr: 'Travaux principaux',
            ar: 'الأعمال الرئيسية',
            en: 'Main Works'
          },
          order: 2,
          tasks: [
            {
              code: 'FOUNDATIONS',
              label: {
                code: 'FOUNDATIONS',
                fr: 'Fondations',
                ar: 'الأساسات',
                en: 'Foundations'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 30
            },
            {
              code: 'STRUCTURAL',
              label: {
                code: 'STRUCTURAL',
                fr: 'Élévation des structures',
                ar: 'رفع الهياكل',
                en: 'Structural Elevation'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 60
            },
            {
              code: 'ELECTRICAL_INSTALLATION',
              label: {
                code: 'ELECTRICAL_INSTALLATION',
                fr: 'Installation électrique',
                ar: 'التركيبات الكهربائية',
                en: 'Electrical Installation'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 45
            }
          ]
        }
      ]
    },
    {
      code: 'HANDOVER',
      label: {
        code: 'HANDOVER',
        fr: 'Réception & Garantie',
        ar: 'الاستلام والضمان',
        en: 'Handover & Warranty'
      },
      order: 4,
      steps: [
        {
          code: 'PROVISIONAL_ACCEPTANCE',
          label: {
            code: 'PROVISIONAL_ACCEPTANCE',
            fr: 'Réception provisoire',
            ar: 'الاستلام المؤقت',
            en: 'Provisional Acceptance'
          },
          order: 1,
          tasks: [
            {
              code: 'FINAL_INSPECTION',
              label: {
                code: 'FINAL_INSPECTION',
                fr: 'Inspection finale',
                ar: 'التفتيش النهائي',
                en: 'Final Inspection'
              },
              requiresInspection: true,
              requiresEngineerApproval: true,
              estimatedDurationDays: 7
            }
          ]
        },
        {
          code: 'FINAL_ACCEPTANCE',
          label: {
            code: 'FINAL_ACCEPTANCE',
            fr: 'Réception définitive',
            ar: 'الاستلام النهائي',
            en: 'Final Acceptance'
          },
          order: 2,
          tasks: [
            {
              code: 'GUARANTEE_RELEASE',
              label: {
                code: 'GUARANTEE_RELEASE',
                fr: 'Levée de garantie bancaire',
                ar: 'رفع الضمان المصرفي',
                en: 'Bank Guarantee Release'
              },
              requiresInspection: false,
              requiresEngineerApproval: true,
              estimatedDurationDays: 5
            }
          ]
        }
      ]
    }
  ]
};
