/**
 * ============================================================
 * RÉFÉRENTIEL BUDGÉTAIRE - LOI DE FINANCES 2026
 * République Islamique de Mauritanie
 * ============================================================
 * 
 * Fichier unique contenant l'intégralité du référentiel budgétaire
 * extrait du PDF "Loi de Finances pour l'année 2026.pdf"
 * 
 * Structure hiérarchique :
 *   Ministère (Titre) → Programme/Dotation → Action → Chapitre → Ligne budgétaire
 * 
 * Chaque niveau possède :
 *   - Un code unique pour le référencement croisé
 *   - Des libellés trilingues (fr, ar, en)
 *   - Les montants CE et CP
 *   - Le marquage climatique quand applicable
 */

// ============================================================
// TYPES INTERNES
// ============================================================

interface MultiLang {
  code: string;
  fr: string;
  ar: string;
  en: string;
}

interface BudgetLine {
  code: string;
  label: MultiLang;
  ce: number;
  cp: number;
  climate?: 'Adaptation' | 'Atténuation' | 'Neutre';
  donor?: string;
  financeType?: 'domestic' | 'grant' | 'loan' | 'mixed';
  projectTypes?: string[];
  phaseMapping?: { default: string; phases: string[] };
  supplierTypes?: string[];
}

interface BudgetChapter {
  code: string;
  label: MultiLang;
  lines: BudgetLine[];
}

interface BudgetAction {
  code: string;
  label: MultiLang;
  description?: MultiLang;
  totalCE: number;
  totalCP: number;
  chapters: BudgetChapter[];
}

interface BudgetProgram {
  code: string;
  label: MultiLang;
  description?: MultiLang;
  actions: BudgetAction[];
}

interface BudgetMinistry {
  code: string;
  label: MultiLang;
  programs: BudgetProgram[];
}

// ============================================================
// RÉFÉRENTIEL COMPLET
// ============================================================

export const budget2026Referential: BudgetMinistry[] = [

  // ==========================================================
  // TITRE 1 : PRÉSIDENCE DE LA RÉPUBLIQUE
  // ==========================================================
  {
    code: '01',
    label: {
      code: 'MIN_PRESIDENCE',
      fr: 'Présidence de la République',
      ar: 'رئاسة الجمهورية',
      en: 'Presidency of the Republic'
    },
    programs: [
      {
        code: '01_001',
        label: {
          code: 'PROG_001',
          fr: 'Présidence de la République',
          ar: 'رئاسة الجمهورية',
          en: 'Presidency of the Republic'
        },
        actions: [
          {
            code: '001_01',
            label: {
              code: 'ACT_001_01',
              fr: 'Coordination de l\'activité de la Présidence',
              ar: 'تنسيق نشاط الرئاسة',
              en: 'Coordination of Presidency Activity'
            },
            totalCE: 12980000,
            totalCP: 426506930,
            chapters: [
              {
                code: '01_001_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '01_001_01_CAB_02',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 110528901, climate: 'Neutre'
                  },
                  {
                    code: '01_001_01_CAB_08',
                    label: { code: 'LN_PROTOCOLE', fr: 'Protocole', ar: 'المراسم', en: 'Protocol' },
                    ce: 0, cp: 2600000, climate: 'Neutre'
                  },
                  {
                    code: '01_001_01_CAB_09',
                    label: { code: 'LN_LOYER_TELECOM', fr: 'Charges loyer et télécom', ar: 'أعباء الكراء والاتصالات', en: 'Rent and Telecom Charges' },
                    ce: 0, cp: 4901676, climate: 'Neutre'
                  },
                  {
                    code: '01_001_01_CAB_10',
                    label: { code: 'LN_COORD_ADMIN', fr: 'Coordination des activités administratives', ar: 'تنسيق الأنشطة الإدارية', en: 'Coordination of Administrative Activities' },
                    ce: 0, cp: 72773527, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '01_001_01_IGE',
                label: { code: 'CH_IGE', fr: 'IGE - Inspection Générale d\'État', ar: 'المفتشية العامة للدولة', en: 'IGE - General State Inspectorate' },
                lines: [
                  {
                    code: '01_001_01_IGE_03',
                    label: { code: 'LN_REM_PERSONNEL_IGE', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 13931347, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '01_001_01_EMP',
                label: { code: 'CH_ETAT_MAJOR', fr: 'État Major Particulier', ar: 'الأركان الخاصة', en: 'Special Staff' },
                lines: [
                  {
                    code: '01_001_01_EMP_04',
                    label: { code: 'LN_GESTION_DOMAINE', fr: 'Gestion du domaine des résidences, palais et parc automobile', ar: 'إدارة مجال الإقامات والقصور وحظيرة السيارات', en: 'Management of Residences, Palaces and Vehicle Fleet' },
                    ce: 0, cp: 24975270, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '01_001_01_DGSED',
                label: { code: 'CH_DGSED', fr: 'Direction Générale de la Sécurité Extérieure et de la Documentation', ar: 'المديرية العامة للأمن الخارجي والوثائق', en: 'General Directorate of External Security and Documentation' },
                lines: [
                  {
                    code: '01_001_01_DGSED_03',
                    label: { code: 'LN_SECURITE_EXT', fr: 'Sécurité extérieure et Documentation', ar: 'الأمن الخارجي والوثائق', en: 'External Security and Documentation' },
                    ce: 0, cp: 101999725, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '01_001_01_COM',
                label: { code: 'CH_COMMUNICATION', fr: 'Bureau de Communication', ar: 'مكتب الاتصال', en: 'Communication Office' },
                lines: [
                  {
                    code: '01_001_01_COM_01',
                    label: { code: 'LN_COMMUNICATION', fr: 'Communication', ar: 'الاتصال', en: 'Communication' },
                    ce: 0, cp: 13410000, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '001_02',
            label: {
              code: 'ACT_001_02',
              fr: 'Contrôle des ressources publiques',
              ar: 'مراقبة الموارد العمومية',
              en: 'Control of Public Resources'
            },
            totalCE: 12980000,
            totalCP: 78635514,
            chapters: [
              {
                code: '01_001_02_IGE',
                label: { code: 'CH_IGE', fr: 'IGE - Inspection Générale d\'État', ar: 'المفتشية العامة للدولة', en: 'IGE - General State Inspectorate' },
                lines: [
                  {
                    code: '01_001_02_IGE_06',
                    label: { code: 'LN_APPUI_IGE', fr: 'Appui de l\'IGE', ar: 'دعم المفتشية العامة للدولة', en: 'IGE Support' },
                    ce: 0, cp: 650000, climate: 'Neutre'
                  },
                  {
                    code: '01_001_02_IGE_07',
                    label: { code: 'LN_MODERNISATION_IGE', fr: 'Modernisation de l\'IGE', ar: 'عصرنة المفتشية العامة للدولة', en: 'IGE Modernization' },
                    ce: 900000, cp: 900000, climate: 'Neutre'
                  },
                  {
                    code: '01_001_02_IGE_08',
                    label: { code: 'LN_FORMATION_IGE', fr: 'Formation et renforcement des capacités du personnel de l\'IGE', ar: 'تكوين وتعزيز قدرات موظفي المفتشية العامة للدولة', en: 'IGE Staff Training and Capacity Building' },
                    ce: 12080000, cp: 80000, climate: 'Neutre'
                  },
                  {
                    code: '01_001_02_IGE_72',
                    label: { code: 'LN_INSPECTION_GENERALE', fr: 'Inspection générale de l\'État', ar: 'المفتشية العامة للدولة', en: 'General State Inspectorate' },
                    ce: 0, cp: 49164046, climate: 'Neutre'
                  },
                  {
                    code: '01_001_02_IGE_73',
                    label: { code: 'LN_STRATEGIE_LUTTE_CORRUPTION', fr: 'Mise en œuvre de la stratégie nationale de lutte contre la corruption', ar: 'تنفيذ الاستراتيجية الوطنية لمكافحة الفساد', en: 'Implementation of National Anti-Corruption Strategy' },
                    ce: 0, cp: 20000000, climate: 'Neutre'
                  },
                  {
                    code: '01_001_02_IGE_74',
                    label: { code: 'LN_SUIVI_STRATEGIE_CORRUPTION', fr: 'Suivi de la mise en œuvre de la stratégie nationale de lutte contre la corruption', ar: 'متابعة تنفيذ الاستراتيجية الوطنية لمكافحة الفساد', en: 'Monitoring of National Anti-Corruption Strategy' },
                    ce: 0, cp: 1000000, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '01_001_02_IGFA',
                label: { code: 'CH_IGFA', fr: 'Inspection Générale des Forces Armées', ar: 'المفتشية العامة للقوات المسلحة', en: 'General Inspectorate of Armed Forces' },
                lines: [
                  {
                    code: '01_001_02_IGFA_03',
                    label: { code: 'LN_ENTRETIEN_BATIMENTS', fr: 'Entretien bâtiments administratifs', ar: 'صيانة المباني الإدارية', en: 'Administrative Buildings Maintenance' },
                    ce: 0, cp: 392853, climate: 'Neutre'
                  },
                  {
                    code: '01_001_02_IGFA_04',
                    label: { code: 'LN_INSPECTION_FORCES_ARMEES', fr: 'Inspection des Forces armées et de sécurité', ar: 'تفتيش القوات المسلحة والأمن', en: 'Inspection of Armed and Security Forces' },
                    ce: 0, cp: 6448615, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 3 : PREMIER MINISTÈRE
  // ==========================================================
  {
    code: '03',
    label: {
      code: 'MIN_PRIMATURE',
      fr: 'Premier Ministère',
      ar: 'الوزارة الأولى',
      en: 'Prime Ministry'
    },
    programs: [
      {
        code: '03_003',
        label: {
          code: 'PROG_003',
          fr: 'Premier Ministère',
          ar: 'الوزارة الأولى',
          en: 'Prime Ministry'
        },
        actions: [
          {
            code: '003_01',
            label: {
              code: 'ACT_003_01',
              fr: 'Coordination de l\'activité de la Primature',
              ar: 'تنسيق نشاط الوزارة الأولى',
              en: 'Coordination of Prime Ministry Activity'
            },
            totalCE: 0,
            totalCP: 143760122,
            chapters: [
              {
                code: '03_003_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '03_003_01_CAB_05',
                    label: { code: 'LN_GESTION_ADMIN', fr: 'Gestion administrative', ar: 'التسيير الإداري', en: 'Administrative Management' },
                    ce: 0, cp: 58899735, climate: 'Neutre'
                  },
                  {
                    code: '03_003_01_CAB_11',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 78010398, climate: 'Neutre'
                  },
                  {
                    code: '03_003_01_CAB_34',
                    label: { code: 'LN_LOYER_TELECOM_CONTRIB', fr: 'Charges loyers, télécommunication et contributions aux organismes internationaux', ar: 'أعباء الكراء والاتصالات والمساهمات في المنظمات الدولية', en: 'Rent, Telecom and International Organization Contributions' },
                    ce: 0, cp: 1453889, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '03_003_01_PRESSE',
                label: { code: 'CH_BUREAU_PRESSE', fr: 'Bureau de Presse', ar: 'مكتب الصحافة', en: 'Press Office' },
                lines: [
                  {
                    code: '03_003_01_PRESSE_02',
                    label: { code: 'LN_COMMUNICATION', fr: 'Communication', ar: 'الاتصال', en: 'Communication' },
                    ce: 0, cp: 3310600, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '003_02',
            label: {
              code: 'ACT_003_02',
              fr: 'Promotion de la Gouvernance',
              ar: 'تعزيز الحكامة',
              en: 'Governance Promotion'
            },
            totalCE: 70981227,
            totalCP: 548403439,
            chapters: [
              {
                code: '03_003_02_SIDA',
                label: { code: 'CH_LUTTE_SIDA', fr: 'Lutte contre le SIDA', ar: 'مكافحة السيدا', en: 'Fight against AIDS' },
                lines: [
                  {
                    code: '03_003_02_SIDA_01',
                    label: { code: 'LN_LUTTE_SIDA', fr: 'Lutte contre le SIDA', ar: 'مكافحة السيدا', en: 'Fight against AIDS' },
                    ce: 0, cp: 37375000, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '03_003_02_ITIE',
                label: { code: 'CH_ITIE', fr: 'Initiative sur la Transparence des Industries Extractives', ar: 'مبادرة الشفافية في الصناعات الاستخراجية', en: 'Extractive Industries Transparency Initiative' },
                lines: [
                  {
                    code: '03_003_02_ITIE_01',
                    label: { code: 'LN_ITIE', fr: 'Initiative sur la transparence des industries extractives', ar: 'مبادرة الشفافية في الصناعات الاستخراجية', en: 'Extractive Industries Transparency Initiative' },
                    ce: 0, cp: 17680000, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '03_003_02_CNC',
                label: { code: 'CH_COMMISSION_CONCOURS', fr: 'Commission Nationale des Concours', ar: 'اللجنة الوطنية للمسابقات', en: 'National Commission for Competitive Examinations' },
                lines: [
                  {
                    code: '03_003_02_CNC_72',
                    label: { code: 'LN_ORGANISATION_CONCOURS', fr: 'Organisation des concours nationaux', ar: 'تنظيم المسابقات الوطنية', en: 'Organization of National Examinations' },
                    ce: 0, cp: 52017360, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '03_003_02_CNDH',
                label: { code: 'CH_CNDH', fr: 'Commission Nationale des Droits de l\'Homme', ar: 'اللجنة الوطنية لحقوق الإنسان', en: 'National Human Rights Commission' },
                lines: [
                  {
                    code: '03_003_02_CNDH_29',
                    label: { code: 'LN_CNDH', fr: 'Commission Nationale des Droits de l\'Homme', ar: 'اللجنة الوطنية لحقوق الإنسان', en: 'National Human Rights Commission' },
                    ce: 0, cp: 17601395, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '03_003_02_APIM',
                label: { code: 'CH_APIM', fr: 'Agence de Promotion des Investissements en Mauritanie', ar: 'وكالة ترقية الاستثمارات في موريتانيا', en: 'Investment Promotion Agency in Mauritania' },
                lines: [
                  {
                    code: '03_003_02_APIM_01',
                    label: { code: 'LN_REM_PERSONNEL_APIM', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 88724496, climate: 'Neutre'
                  },
                  {
                    code: '03_003_02_APIM_06',
                    label: { code: 'LN_CREATION_OPPORTUNITES', fr: 'Création d\'opportunités d\'investissement', ar: 'خلق فرص الاستثمار', en: 'Creation of Investment Opportunities' },
                    ce: 55972164, cp: 22796340, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 10 : MINISTÈRE DE LA DÉFENSE
  // ==========================================================
  {
    code: '10',
    label: {
      code: 'MIN_DEFENSE',
      fr: 'Ministère de la Défense et des Affaires des Retraités et des Enfants de Martyrs',
      ar: 'وزارة الدفاع وشؤون المتقاعدين وأبناء الشهداء',
      en: 'Ministry of Defense, Retirees and Martyrs\' Children Affairs'
    },
    programs: [
      {
        code: '10_010',
        label: {
          code: 'PROG_010_DEFENSE',
          fr: 'Défense Nationale',
          ar: 'الدفاع الوطني',
          en: 'National Defense'
        },
        actions: [
          {
            code: '010_01',
            label: {
              code: 'ACT_010_01',
              fr: 'Armée Nationale',
              ar: 'الجيش الوطني',
              en: 'National Army'
            },
            totalCE: 0,
            totalCP: 4111429819,
            chapters: [
              {
                code: '10_010_01_ARMEE',
                label: { code: 'CH_ARMEE', fr: 'Armée Nationale', ar: 'الجيش الوطني', en: 'National Army' },
                lines: [
                  {
                    code: '10_010_01_ARMEE_06',
                    label: { code: 'LN_REM_PERSONNEL_ARMEE', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 4111429819, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '010_02',
            label: {
              code: 'ACT_010_02',
              fr: 'Gendarmerie Nationale',
              ar: 'الدرك الوطني',
              en: 'National Gendarmerie'
            },
            totalCE: 867797730,
            totalCP: 1598796972,
            chapters: [
              {
                code: '10_010_02_GEND',
                label: { code: 'CH_GENDARMERIE', fr: 'Gendarmerie Nationale', ar: 'الدرك الوطني', en: 'National Gendarmerie' },
                lines: [
                  {
                    code: '10_010_02_GEND_02',
                    label: { code: 'LN_APPUI_GENDARMERIE', fr: 'Appui à la gendarmerie nationale', ar: 'دعم الدرك الوطني', en: 'Support to National Gendarmerie' },
                    ce: 867797730, cp: 287797730, climate: 'Neutre'
                  },
                  {
                    code: '10_010_02_GEND_03',
                    label: { code: 'LN_REM_PERSONNEL_GEND', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 1139872610, climate: 'Neutre'
                  },
                  {
                    code: '10_010_02_GEND_72',
                    label: { code: 'LN_INTEGRITE_TERRITORIALE', fr: 'Préservation de l\'intégrité territoriale', ar: 'الحفاظ على السلامة الترابية', en: 'Preservation of Territorial Integrity' },
                    ce: 0, cp: 159326632, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '010_03',
            label: {
              code: 'ACT_010_03',
              fr: 'Administration Centrale',
              ar: 'الإدارة المركزية',
              en: 'Central Administration'
            },
            totalCE: 12643454120,
            totalCP: 6645449066,
            chapters: [
              {
                code: '10_010_03_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '10_010_03_CAB_06',
                    label: { code: 'LN_REM_PERSONNEL_CAB', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 21109237, climate: 'Neutre'
                  },
                  {
                    code: '10_010_03_CAB_25',
                    label: { code: 'LN_CONSTRUCTION_NAVALE', fr: 'Construction navale', ar: 'بناء السفن', en: 'Naval Construction' },
                    ce: 2700000000, cp: 900000000, climate: 'Neutre'
                  },
                  {
                    code: '10_010_03_CAB_26',
                    label: { code: 'LN_TUCANO_AVIATION', fr: 'Tucano - aviation militaire', ar: 'توكانو - الطيران العسكري', en: 'Tucano - Military Aviation' },
                    ce: 629738860, cp: 229738860, climate: 'Neutre'
                  },
                  {
                    code: '10_010_03_CAB_31',
                    label: { code: 'LN_EQUIPEMENTS_SPECIFIQUES', fr: 'Acquisition des équipements spécifiques', ar: 'اقتناء المعدات النوعية', en: 'Acquisition of Specific Equipment' },
                    ce: 1052500000, cp: 352500000, climate: 'Neutre'
                  },
                  {
                    code: '10_010_03_CAB_74',
                    label: { code: 'LN_ACQUISITION_MATERIEL', fr: 'Acquisition Matériel', ar: 'اقتناء العتاد', en: 'Equipment Acquisition' },
                    ce: 5079825260, cp: 1479825260, climate: 'Neutre'
                  },
                  {
                    code: '10_010_03_CAB_75',
                    label: { code: 'LN_ENTRETIEN_AERONEFS', fr: 'Entretien des aéronefs', ar: 'صيانة الطائرات', en: 'Aircraft Maintenance' },
                    ce: 20000000, cp: 20000000, climate: 'Neutre'
                  },
                  {
                    code: '10_010_03_CAB_76',
                    label: { code: 'LN_NOUVEAUX_EQUIPEMENTS', fr: 'Acquisition nouveaux équipements', ar: 'اقتناء معدات جديدة', en: 'New Equipment Acquisition' },
                    ce: 3000000000, cp: 3000000000, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '10_010_03_SANTE',
                label: { code: 'CH_SANTE_FORCES_ARMEES', fr: 'Direction Générale des Services de Santé des Forces Armées', ar: 'المديرية العامة للمصالح الصحية للقوات المسلحة', en: 'General Directorate of Armed Forces Health Services' },
                lines: [
                  {
                    code: '10_010_03_SANTE_02',
                    label: { code: 'LN_APPUI_SANITAIRE', fr: 'Appui sanitaire aux forces armées', ar: 'الدعم الصحي للقوات المسلحة', en: 'Health Support to Armed Forces' },
                    ce: 60000000, cp: 20000000, climate: 'Neutre'
                  },
                  {
                    code: '10_010_03_SANTE_72',
                    label: { code: 'LN_SOUTIEN_SANITAIRE', fr: 'Soutien sanitaire aux forces armées', ar: 'الإسناد الصحي للقوات المسلحة', en: 'Health Support to Armed Forces' },
                    ce: 0, cp: 6463800, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '10_010_03_ADMIN',
                label: { code: 'CH_ADMIN_CENTRALE', fr: 'Administration Centrale', ar: 'الإدارة المركزية', en: 'Central Administration' },
                lines: [
                  {
                    code: '10_010_03_ADMIN_02',
                    label: { code: 'LN_APPUI_MINISTERE', fr: 'Appui au ministère de la défense nationale', ar: 'دعم وزارة الدفاع الوطني', en: 'Support to Ministry of National Defense' },
                    ce: 75000000, cp: 25000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 11 : MINISTÈRE DES AFFAIRES ÉTRANGÈRES
  // ==========================================================
  {
    code: '11',
    label: {
      code: 'MIN_AFFAIRES_ETRANGERES',
      fr: 'Ministère des Affaires Étrangères, de la Coopération Africaine et des Mauritaniens de l\'Extérieur',
      ar: 'وزارة الشؤون الخارجية والتعاون الإفريقي والموريتانيين في الخارج',
      en: 'Ministry of Foreign Affairs, African Cooperation and Mauritanians Abroad'
    },
    programs: [
      {
        code: '11_019',
        label: {
          code: 'PROG_019',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '019_01',
            label: {
              code: 'ACT_019_01',
              fr: 'Pilotage et stratégie Ministériels',
              ar: 'القيادة والاستراتيجية القطاعية',
              en: 'Ministry Leadership and Strategy'
            },
            totalCE: 0,
            totalCP: 3488204,
            chapters: [
              {
                code: '11_019_01_IGA',
                label: { code: 'CH_IGA', fr: 'Inspection Générale des Ambassades', ar: 'المفتشية العامة للسفارات', en: 'General Inspectorate of Embassies' },
                lines: [
                  {
                    code: '11_019_01_IGA_72',
                    label: { code: 'LN_INSPECTION_AMBASSADES', fr: 'Inspection des ambassades', ar: 'تفتيش السفارات', en: 'Embassy Inspection' },
                    ce: 0, cp: 859824, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '019_02',
            label: {
              code: 'ACT_019_02',
              fr: 'Coordination Administrative',
              ar: 'التنسيق الإداري',
              en: 'Administrative Coordination'
            },
            totalCE: 149000000,
            totalCP: 449488993,
            chapters: [
              {
                code: '11_019_02_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '11_019_02_CAB_03',
                    label: { code: 'LN_FETES_CEREMONIES', fr: 'Fêtes et cérémonies', ar: 'الأعياد والحفلات', en: 'Celebrations and Ceremonies' },
                    ce: 0, cp: 21194188, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_CAB_04',
                    label: { code: 'LN_COORD_ADMIN', fr: 'Coordination et suivi de l\'administration générale', ar: 'تنسيق ومتابعة الإدارة العامة', en: 'Coordination and Monitoring of General Administration' },
                    ce: 0, cp: 60973301, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_CAB_07',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 57832371, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_CAB_11',
                    label: { code: 'LN_CONTRIBUTIONS_ORGANISATIONS', fr: 'Contributions aux organisations internationales', ar: 'المساهمات في المنظمات الدولية', en: 'International Organization Contributions' },
                    ce: 0, cp: 134117873, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_CAB_20',
                    label: { code: 'LN_ARCHIVES', fr: 'Archives', ar: 'الأرشيف', en: 'Archives' },
                    ce: 8754627, cp: 4754627, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_CAB_21',
                    label: { code: 'LN_EQUIPEMENT_MISSIONS', fr: 'Équipement des missions diplomatiques', ar: 'تجهيز البعثات الدبلوماسية', en: 'Diplomatic Mission Equipment' },
                    ce: 111923377, cp: 22923377, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_CAB_22',
                    label: { code: 'LN_EQUIPEMENT_MINISTERE', fr: 'Équipement du Ministère', ar: 'تجهيز الوزارة', en: 'Ministry Equipment' },
                    ce: 16051996, cp: 7051996, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '11_019_02_AMB',
                label: { code: 'CH_FONCTIONNEMENT_AMBASSADES', fr: 'Fonctionnement des Ambassades', ar: 'تسيير السفارات', en: 'Embassy Operations' },
                lines: [
                  {
                    code: '11_019_02_AMB_02',
                    label: { code: 'LN_ASSURANCES_MISSIONS', fr: 'Assurances missions diplomatiques', ar: 'تأمينات البعثات الدبلوماسية', en: 'Diplomatic Mission Insurance' },
                    ce: 0, cp: 40488764, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_AMB_03',
                    label: { code: 'LN_FESTIVITES_FETE_NATIONALE', fr: 'Festivités de la fête nationale', ar: 'احتفالات العيد الوطني', en: 'National Day Festivities' },
                    ce: 0, cp: 10000000, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_AMB_04',
                    label: { code: 'LN_ALLOCATIONS_SCOLAIRES', fr: 'Allocations scolaires des missions diplomatiques', ar: 'المنح المدرسية للبعثات الدبلوماسية', en: 'Diplomatic Mission School Allowances' },
                    ce: 0, cp: 15800000, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_AMB_72',
                    label: { code: 'LN_COTISATIONS_SOCIALES', fr: 'Cotisations sociales des missions diplomatiques', ar: 'المساهمات الاجتماعية للبعثات الدبلوماسية', en: 'Diplomatic Mission Social Contributions' },
                    ce: 0, cp: 20000000, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '11_019_02_ACAD',
                label: { code: 'CH_ACADEMIE_DIPLOMATIQUE', fr: 'Académie Diplomatique', ar: 'الأكاديمية الدبلوماسية', en: 'Diplomatic Academy' },
                lines: [
                  {
                    code: '11_019_02_ACAD_02',
                    label: { code: 'LN_REM_PERSONNEL_ACAD', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 12068563, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_ACAD_03',
                    label: { code: 'LN_RENFORCEMENT_ACADEMIE', fr: 'Renforcement des capacités de l\'Académie Diplomatique', ar: 'تعزيز قدرات الأكاديمية الدبلوماسية', en: 'Diplomatic Academy Capacity Building' },
                    ce: 12270000, cp: 7270000, climate: 'Neutre'
                  },
                  {
                    code: '11_019_02_ACAD_72',
                    label: { code: 'LN_GESTION_ACADEMIE', fr: 'Gestion de l\'Académie diplomatique', ar: 'تسيير الأكاديمية الدبلوماسية', en: 'Diplomatic Academy Management' },
                    ce: 0, cp: 16530015, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '11_020',
        label: {
          code: 'PROG_020',
          fr: 'Monde Arabe Afrique',
          ar: 'العالم العربي وأفريقيا',
          en: 'Arab World and Africa'
        },
        actions: [
          {
            code: '020_01',
            label: {
              code: 'ACT_020_01',
              fr: 'Diplomatie',
              ar: 'الدبلوماسية',
              en: 'Diplomacy'
            },
            totalCE: 0,
            totalCP: 740396244,
            chapters: [
              {
                code: '11_020_01_ABIDJAN',
                label: { code: 'CH_AMB_ABIDJAN', fr: 'Ambassade RIM à Abidjan', ar: 'سفارة الجمهورية الإسلامية الموريتانية في أبيدجان', en: 'RIM Embassy in Abidjan' },
                lines: [
                  {
                    code: '11_020_01_ABIDJAN_02',
                    label: { code: 'LN_REPRESENTATION_ABIDJAN', fr: 'Représentation diplomatique à Abidjan', ar: 'التمثيل الدبلوماسي في أبيدجان', en: 'Diplomatic Representation in Abidjan' },
                    ce: 0, cp: 12305297, climate: 'Neutre'
                  },
                  {
                    code: '11_020_01_ABIDJAN_72',
                    label: { code: 'LN_REM_PERSONNEL_ABIDJAN', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 17017169, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '11_020_01_ADDIS',
                label: { code: 'CH_AMB_ADDIS', fr: 'Ambassade RIM à Addis-Abeba', ar: 'سفارة الجمهورية الإسلامية الموريتانية في أديس أبابا', en: 'RIM Embassy in Addis Ababa' },
                lines: [
                  {
                    code: '11_020_01_ADDIS_02',
                    label: { code: 'LN_REPRESENTATION_ADDIS', fr: 'Représentation diplomatique - Addis-Abeba', ar: 'التمثيل الدبلوماسي - أديس أبابا', en: 'Diplomatic Representation - Addis Ababa' },
                    ce: 0, cp: 8334931, climate: 'Neutre'
                  },
                  {
                    code: '11_020_01_ADDIS_72',
                    label: { code: 'LN_REM_PERSONNEL_ADDIS', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 17772360, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '11_020_01_DAKAR',
                label: { code: 'CH_AMB_DAKAR', fr: 'Ambassade RIM à Dakar', ar: 'سفارة الجمهورية الإسلامية الموريتانية في داكار', en: 'RIM Embassy in Dakar' },
                lines: [
                  {
                    code: '11_020_01_DAKAR_02',
                    label: { code: 'LN_REM_PERSONNEL_DAKAR', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 27990251, climate: 'Neutre'
                  },
                  {
                    code: '11_020_01_DAKAR_72',
                    label: { code: 'LN_REPRESENTATION_DAKAR', fr: 'Représentation diplomatique - Dakar', ar: 'التمثيل الدبلوماسي - داكار', en: 'Diplomatic Representation - Dakar' },
                    ce: 0, cp: 11177430, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '11_020_01_RIYAD',
                label: { code: 'CH_AMB_RIYAD', fr: 'Ambassade RIM à Riyad', ar: 'سفارة الجمهورية الإسلامية الموريتانية في الرياض', en: 'RIM Embassy in Riyadh' },
                lines: [
                  {
                    code: '11_020_01_RIYAD_02',
                    label: { code: 'LN_REPRESENTATION_RIYAD', fr: 'Représentation diplomatique Riyad', ar: 'التمثيل الدبلوماسي في الرياض', en: 'Diplomatic Representation Riyadh' },
                    ce: 0, cp: 14161607, climate: 'Neutre'
                  },
                  {
                    code: '11_020_01_RIYAD_72',
                    label: { code: 'LN_REM_PERSONNEL_RIYAD', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 28680588, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '11_021',
        label: {
          code: 'PROG_021',
          fr: 'Europe Amérique Asie',
          ar: 'أوروبا وأمريكا وآسيا',
          en: 'Europe America Asia'
        },
        actions: [
          {
            code: '021_01',
            label: {
              code: 'ACT_021_01',
              fr: 'Diplomatie',
              ar: 'الدبلوماسية',
              en: 'Diplomacy'
            },
            totalCE: 0,
            totalCP: 664164728,
            chapters: [
              {
                code: '11_021_01_PARIS',
                label: { code: 'CH_AMB_PARIS', fr: 'Ambassade RIM à Paris', ar: 'سفارة الجمهورية الإسلامية الموريتانية في باريس', en: 'RIM Embassy in Paris' },
                lines: [
                  {
                    code: '11_021_01_PARIS_02',
                    label: { code: 'LN_REM_PERSONNEL_PARIS', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 43449623, climate: 'Neutre'
                  },
                  {
                    code: '11_021_01_PARIS_72',
                    label: { code: 'LN_REPRESENTATION_PARIS', fr: 'Représentation diplomatique - Paris', ar: 'التمثيل الدبلوماسي - باريس', en: 'Diplomatic Representation - Paris' },
                    ce: 0, cp: 24066994, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '11_021_01_BRUXELLES',
                label: { code: 'CH_AMB_BRUXELLES', fr: 'Ambassade RIM à Bruxelles', ar: 'سفارة الجمهورية الإسلامية الموريتانية في بروكسيل', en: 'RIM Embassy in Brussels' },
                lines: [
                  {
                    code: '11_021_01_BRUXELLES_02',
                    label: { code: 'LN_REPRESENTATION_BRUXELLES', fr: 'Représentation diplomatique - Bruxelles', ar: 'التمثيل الدبلوماسي - بروكسيل', en: 'Diplomatic Representation - Brussels' },
                    ce: 0, cp: 17301780, climate: 'Neutre'
                  },
                  {
                    code: '11_021_01_BRUXELLES_72',
                    label: { code: 'LN_REM_PERSONNEL_BRUXELLES', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 21751185, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '11_021_01_WASHINGTON',
                label: { code: 'CH_AMB_WASHINGTON', fr: 'Ambassade RIM à Washington', ar: 'سفارة الجمهورية الإسلامية الموريتانية في واشنطن', en: 'RIM Embassy in Washington' },
                lines: [
                  {
                    code: '11_021_01_WASHINGTON_02',
                    label: { code: 'LN_REPRESENTATION_WASHINGTON', fr: 'Représentation diplomatique - Washington', ar: 'التمثيل الدبلوماسي - واشنطن', en: 'Diplomatic Representation - Washington' },
                    ce: 0, cp: 16221210, climate: 'Neutre'
                  },
                  {
                    code: '11_021_01_WASHINGTON_72',
                    label: { code: 'LN_REM_PERSONNEL_WASHINGTON', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 34167197, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 12 : MINISTÈRE DE L'AUTONOMISATION DES JEUNES, 
  //           DE L'EMPLOI, DES SPORTS ET SERVICE CIVIQUE
  // ==========================================================
  {
    code: '12',
    label: {
      code: 'MIN_JEUNESSE_EMPLOI_SPORTS',
      fr: 'Ministère de l\'Autonomisation des Jeunes, de l\'Emploi, des Sports et Service Civique',
      ar: 'وزارة تمكين الشباب والتشغيل والرياضة والخدمة المدنية',
      en: 'Ministry of Youth Empowerment, Employment, Sports and Civic Service'
    },
    programs: [
      {
        code: '12_010',
        label: {
          code: 'PROG_012_010',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '012_01',
            label: {
              code: 'ACT_012_01',
              fr: 'Pilotage et Stratégie du ministère',
              ar: 'القيادة والاستراتيجية القطاعية',
              en: 'Ministry Leadership and Strategy'
            },
            totalCE: 0,
            totalCP: 49796701,
            chapters: [
              {
                code: '12_010_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '12_010_01_CAB_24',
                    label: { code: 'LN_COORDINATION_CAB', fr: 'Coordination', ar: 'التنسيق', en: 'Coordination' },
                    ce: 0, cp: 20945654, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '12_012',
        label: {
          code: 'PROG_012_012',
          fr: 'Emploi',
          ar: 'التشغيل',
          en: 'Employment'
        },
        actions: [
          {
            code: '012_03',
            label: {
              code: 'ACT_012_03',
              fr: 'Promotion et développement de l\'entrepreneuriat et faciliter l\'accès aux financements',
              ar: 'تعزيز وتطوير ريادة الأعمال وتسهيل الوصول إلى التمويلات',
              en: 'Promotion and Development of Entrepreneurship and Facilitation of Access to Financing'
            },
            totalCE: 3353250177,
            totalCP: 1207175749,
            chapters: [
              {
                code: '12_012_03_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '12_012_03_CAB_55',
                    label: { code: 'LN_MON_PROJET_AVENIR', fr: 'Mon projet mon avenir', ar: 'مشروعي مستقبلي', en: 'My Project My Future' },
                    ce: 15400000, cp: 12125596, climate: 'Neutre'
                  },
                  {
                    code: '12_012_03_CAB_61',
                    label: { code: 'LN_PREVENTION_CONFLITS_JEUNESSE', fr: 'Prévention des conflits et promotion du dialogue interculturel - Jeunesse Inclusive et Durable', ar: 'منع النزاعات وتعزيز الحوار بين الثقافات - شباب شامل ومستدام', en: 'Conflict Prevention and Intercultural Dialogue - Inclusive and Sustainable Youth' },
                    ce: 293000000, cp: 99400399,
                    climate: 'Neutre', donor: 'UE', financeType: 'grant'
                  },
                  {
                    code: '12_012_03_CAB_63',
                    label: { code: 'LN_PADEM', fr: 'Programme d\'appui au Développement de l\'entreprenariat en Mauritanie notamment les femmes (PADEM)', ar: 'برنامج دعم تطوير ريادة الأعمال في موريتانيا خاصة النساء', en: 'Support Program for Entrepreneurship Development in Mauritania, Especially Women (PADEM)' },
                    ce: 543150177, cp: 204800000,
                    climate: 'Neutre', donor: 'FRANCE-AFD', financeType: 'grant'
                  },
                  {
                    code: '12_012_03_CAB_75',
                    label: { code: 'LN_FONDS_EMPLOI', fr: 'Fonds National de l\'Emploi', ar: 'الصندوق الوطني للتشغيل', en: 'National Employment Fund' },
                    ce: 1950000000, cp: 550000000, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '12_012_03_JEUNESSE',
                label: { code: 'CH_DIRECTION_JEUNESSE', fr: 'Direction Générale de la Jeunesse', ar: 'المديرية العامة للشباب', en: 'General Directorate of Youth' },
                lines: [
                  {
                    code: '12_012_03_JEUNESSE_16',
                    label: { code: 'LN_PNAGSB_JEUNESSE', fr: 'Programme National d\'Accès Généralisé aux Services de Base/Composante Jeunesse', ar: 'البرنامج الوطني للوصول الشامل للخدمات الأساسية/مكون الشباب', en: 'National Program for Generalized Access to Basic Services/Youth Component' },
                    ce: 286000000, cp: 56000000, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '12_012_03_SPORTS',
                label: { code: 'CH_DIRECTION_SPORTS', fr: 'Direction Générale des Sports', ar: 'المديرية العامة للرياضة', en: 'General Directorate of Sports' },
                lines: [
                  {
                    code: '12_012_03_SPORTS_24',
                    label: { code: 'LN_PNAGSB_SPORT', fr: 'Programme National d\'Accès Généralisé aux Services de Base/Composante Sport', ar: 'البرنامج الوطني للوصول الشامل للخدمات الأساسية/مكون الرياضة', en: 'National Program for Generalized Access to Basic Services/Sport Component' },
                    ce: 250000000, cp: 130000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '012_04',
            label: {
              code: 'ACT_012_04',
              fr: 'Renforcement de l\'employabilité',
              ar: 'تعزيز قابلية التشغيل',
              en: 'Strengthening Employability'
            },
            totalCE: 487597449,
            totalCP: 162000000,
            chapters: [
              {
                code: '12_012_04_EMPLOYABILITE',
                label: { code: 'CH_EMPLOYABILITE_JEUNES', fr: 'Employabilité des Jeunes', ar: 'قابلية تشغيل الشباب', en: 'Youth Employability' },
                lines: [
                  {
                    code: '12_012_04_EMPLOYABILITE_43',
                    label: { code: 'LN_EMPLOYABILITE_IDA', fr: 'Employabilité des jeunes - Contrepartie (IDA)', ar: 'قابلية تشغيل الشباب - مساهمة (IDA)', en: 'Youth Employability - Counterpart (IDA)' },
                    ce: 487597449, cp: 162000000,
                    climate: 'Neutre', donor: 'BM-IDA', financeType: 'loan'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 14 : MINISTÈRE DE LA JUSTICE
  // ==========================================================
  {
    code: '14',
    label: {
      code: 'MIN_JUSTICE',
      fr: 'Ministère de la Justice',
      ar: 'وزارة العدل',
      en: 'Ministry of Justice'
    },
    programs: [
      {
        code: '14_016',
        label: {
          code: 'PROG_016',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '016_01',
            label: {
              code: 'ACT_016_01',
              fr: 'Coordination administrative',
              ar: 'التنسيق الإداري',
              en: 'Administrative Coordination'
            },
            totalCE: 296953380,
            totalCP: 242449270,
            chapters: [
              {
                code: '14_016_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '14_016_01_CAB_02',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 46875425, climate: 'Neutre'
                  },
                  {
                    code: '14_016_01_CAB_10',
                    label: { code: 'LN_COORD_ACTION_DEP', fr: 'Coordination de l\'action départementale', ar: 'تنسيق العمل القطاعي', en: 'Departmental Action Coordination' },
                    ce: 0, cp: 11748926, climate: 'Neutre'
                  },
                  {
                    code: '14_016_01_CAB_15',
                    label: { code: 'LN_EQUIPEMENT_JURIDICTIONS', fr: 'Équipement des juridictions et de la chancellerie', ar: 'تجهيز المحاكم وديوان الوزارة', en: 'Court and Chancellery Equipment' },
                    ce: 140000000, cp: 40000000, climate: 'Neutre'
                  },
                  {
                    code: '14_016_01_CAB_16',
                    label: { code: 'LN_APPUI_JUSTICE_AFD', fr: 'Projet d\'appui à la justice/AFD', ar: 'مشروع دعم العدالة/الوكالة الفرنسية للتنمية', en: 'Justice Support Project/AFD' },
                    ce: 149095800, cp: 43100000,
                    climate: 'Neutre', donor: 'FRANCE-AFD', financeType: 'grant'
                  }
                ]
              }
            ]
          },
          {
            code: '016_02',
            label: {
              code: 'ACT_016_02',
              fr: 'Pilotage',
              ar: 'القيادة',
              en: 'Leadership'
            },
            totalCE: 0,
            totalCP: 36441371,
            chapters: [
              {
                code: '14_016_02_CAB',
                label: { code: 'CH_CABINET_PILOTAGE', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '14_016_02_CAB_27',
                    label: { code: 'LN_CONTRIBUTIONS_ORGANISMES', fr: 'Contributions aux organismes internationaux', ar: 'المساهمات في المنظمات الدولية', en: 'International Organization Contributions' },
                    ce: 0, cp: 845000, climate: 'Neutre'
                  },
                  {
                    code: '14_016_02_CAB_86',
                    label: { code: 'LN_SUIVI_REFORME_JUDICIAIRE', fr: 'Suivi et exécution de la feuille de route de la réforme judiciaire', ar: 'متابعة وتنفيذ خارطة طريق الإصلاح القضائي', en: 'Monitoring and Execution of Judicial Reform Roadmap' },
                    ce: 0, cp: 5000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '14_017',
        label: {
          code: 'PROG_017',
          fr: 'Administration Judiciaire',
          ar: 'الإدارة القضائية',
          en: 'Judicial Administration'
        },
        actions: [
          {
            code: '017_01',
            label: {
              code: 'ACT_017_01',
              fr: 'Amélioration de la qualité des services de la justice',
              ar: 'تحسين جودة خدمات العدالة',
              en: 'Improvement of Justice Service Quality'
            },
            totalCE: 0,
            totalCP: 10375195,
            chapters: []
          },
          {
            code: '017_02',
            label: {
              code: 'ACT_017_02',
              fr: 'Accès à la justice',
              ar: 'الوصول إلى العدالة',
              en: 'Access to Justice'
            },
            totalCE: 0,
            totalCP: 459607788,
            chapters: [
              {
                code: '14_017_02_PARQUET',
                label: { code: 'CH_PARQUET_SUPREME', fr: 'Parquet Général auprès de la Cour Suprême', ar: 'النيابة العامة لدى المحكمة العليا', en: 'General Prosecutor at the Supreme Court' },
                lines: [
                  {
                    code: '14_017_02_PARQUET_03',
                    label: { code: 'LN_FRAIS_JUSTICE', fr: 'Frais de justice', ar: 'أتعاب العدالة', en: 'Court Costs' },
                    ce: 0, cp: 13500000, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '14_017_02_NKTT_OUEST',
                label: { code: 'CH_STRUCTURES_NKTT_OUEST', fr: 'Structures Judiciaires de Nouakchott Ouest', ar: 'الهياكل القضائية لنواكشوط الغربية', en: 'Judicial Structures of Nouakchott West' },
                lines: [
                  {
                    code: '14_017_02_NKTT_OUEST_13',
                    label: { code: 'LN_REM_PERSONNEL_NKTT_OUEST', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 164560225, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '14_017_02_DN',
                label: { code: 'CH_STRUCTURES_DN', fr: 'Structures Judiciaires de Dakhlet Nouadhibou', ar: 'الهياكل القضائية لولاية داخلت نواذيبو', en: 'Judicial Structures of Dakhlet Nouadhibou' },
                lines: [
                  {
                    code: '14_017_02_DN_73',
                    label: { code: 'LN_REM_PERSONNEL_DN', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 29656170, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '14_018',
        label: {
          code: 'PROG_018',
          fr: 'Politique Pénale et Pénitentiaire',
          ar: 'السياسة الجنائية والسجنية',
          en: 'Penal and Penitentiary Policy'
        },
        actions: [
          {
            code: '018_01',
            label: {
              code: 'ACT_018_01',
              fr: 'Accueil et Accompagnement des détenus',
              ar: 'استقبال ومرافقة السجناء',
              en: 'Reception and Support of Detainees'
            },
            totalCE: 0,
            totalCP: 211416111,
            chapters: [
              {
                code: '14_018_01_DGAPR',
                label: { code: 'CH_DGAPR', fr: 'Direction Générale de l\'Administration Pénitentiaire et de la Réinsertion', ar: 'المديرية العامة للإدارة السجنية وإعادة الإدماج', en: 'General Directorate of Penitentiary Administration and Reintegration' },
                lines: [
                  {
                    code: '14_018_01_DGAPR_05',
                    label: { code: 'LN_ALIMENTATION_DETENUS', fr: 'Alimentation des détenus', ar: 'إطعام السجناء', en: 'Detainee Food' },
                    ce: 0, cp: 73592700, climate: 'Neutre'
                  },
                  {
                    code: '14_018_01_DGAPR_06',
                    label: { code: 'LN_HABILLEMENT_DETENUS', fr: 'Habillement des détenus', ar: 'كسوة السجناء', en: 'Detainee Clothing' },
                    ce: 0, cp: 4750000, climate: 'Neutre'
                  },
                  {
                    code: '14_018_01_DGAPR_20',
                    label: { code: 'LN_ATELIERS_REINSERTION', fr: 'Ateliers Multidisciplinaires de la Réinsertion', ar: 'الورشات متعددة التخصصات لإعادة الإدماج', en: 'Multidisciplinary Reintegration Workshops' },
                    ce: 20500000, cp: 6500000, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '018_02',
            label: {
              code: 'ACT_018_02',
              fr: 'Garde et contrôle des établissements Pénitentiaires et de Réinsertion',
              ar: 'حراسة ومراقبة المؤسسات السجنية وإعادة الإدماج',
              en: 'Guard and Control of Penitentiary and Reintegration Establishments'
            },
            totalCE: 57000000,
            totalCP: 36389700,
            chapters: [
              {
                code: '14_018_02_DGAPR',
                label: { code: 'CH_DGAPR_SECURITE', fr: 'Direction Générale de l\'Administration Pénitentiaire et de la Réinsertion', ar: 'المديرية العامة للإدارة السجنية وإعادة الإدماج', en: 'General Directorate of Penitentiary Administration and Reintegration' },
                lines: [
                  {
                    code: '14_018_02_DGAPR_16',
                    label: { code: 'LN_EQUIPEMENT_CUISINE', fr: 'Équipement Ménager (Cuisine et Froid)', ar: 'المعدات المنزلية (المطبخ والتبريد)', en: 'Household Equipment (Kitchen and Cold)' },
                    ce: 21000000, cp: 7000000, climate: 'Neutre'
                  },
                  {
                    code: '14_018_02_DGAPR_18',
                    label: { code: 'LN_APPUI_SECURITE_PENITENTIAIRE', fr: 'Appui à la Sécurité des Établissements Pénitentiaires', ar: 'دعم أمن المؤسسات السجنية', en: 'Support to Penitentiary Establishment Security' },
                    ce: 36000000, cp: 12000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 19 : MINISTÈRE DE LA PÊCHE ET DES INFRASTRUCTURES 
  //           MARITIMES ET PORTUAIRES
  // ==========================================================
  {
    code: '19',
    label: {
      code: 'MIN_PECHE',
      fr: 'Ministère de la Pêche et des Infrastructures Maritimes et Portuaires',
      ar: 'وزارة الصيد والبنى التحتية البحرية والمينائية',
      en: 'Ministry of Fisheries and Maritime and Port Infrastructure'
    },
    programs: [
      {
        code: '19_060',
        label: {
          code: 'PROG_060',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '060_01',
            label: {
              code: 'ACT_060_01',
              fr: 'Stratégie Ministérielle',
              ar: 'الاستراتيجية القطاعية',
              en: 'Ministry Strategy'
            },
            totalCE: 609000000,
            totalCP: 444307391,
            chapters: [
              {
                code: '19_060_01_DPC',
                label: { code: 'CH_DPC', fr: 'DPC - Direction de la Programmation et de la Coopération', ar: 'مديرية البرمجة والتعاون', en: 'DPC - Programming and Cooperation Directorate' },
                lines: [
                  {
                    code: '19_060_01_DPC_75',
                    label: { code: 'LN_DEV_CHAINE_VALEUR', fr: 'Projet de Développement de la Chaîne de Valeur et Création d\'emploi', ar: 'مشروع تطوير سلسلة القيمة وخلق فرص العمل', en: 'Value Chain Development and Job Creation Project' },
                    ce: 609000000, cp: 157000000,
                    climate: 'Neutre', donor: 'RFA-KFW', financeType: 'grant'
                  }
                ]
              }
            ]
          },
          {
            code: '060_02',
            label: {
              code: 'ACT_060_02',
              fr: 'Coordination Administrative',
              ar: 'التنسيق الإداري',
              en: 'Administrative Coordination'
            },
            totalCE: 12000000,
            totalCP: 292159779,
            chapters: [
              {
                code: '19_060_02_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '19_060_02_CAB_04',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 30035631, climate: 'Neutre'
                  },
                  {
                    code: '19_060_02_CAB_12',
                    label: { code: 'LN_ETUDES_RECHERCHES', fr: 'Études et recherches', ar: 'الدراسات والبحوث', en: 'Studies and Research' },
                    ce: 12000000, cp: 3000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '19_061',
        label: {
          code: 'PROG_061',
          fr: 'Pêche et Aquaculture',
          ar: 'الصيد وتربية الأحياء المائية',
          en: 'Fisheries and Aquaculture'
        },
        actions: [
          {
            code: '061_01',
            label: {
              code: 'ACT_061_01',
              fr: 'Exploitation des ressources halieutiques et Aquaculture Marine',
              ar: 'استغلال الموارد السمكية وتربية الأحياء البحرية',
              en: 'Exploitation of Fishery Resources and Marine Aquaculture'
            },
            totalCE: 0,
            totalCP: 566395,
            chapters: []
          },
          {
            code: '061_02',
            label: {
              code: 'ACT_061_02',
              fr: 'Pêche continentale et pisciculture',
              ar: 'الصيد القاري وتربية الأسماك',
              en: 'Continental Fishing and Fish Farming'
            },
            totalCE: 100000000,
            totalCP: 144000000,
            chapters: [
              {
                code: '19_061_02_CAB',
                label: { code: 'CH_CABINET_PISCICULTURE', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '19_061_02_CAB_18',
                    label: { code: 'LN_STATION_PISCICULTURE', fr: 'Projet de construction d\'une station de pisciculture', ar: 'مشروع بناء محطة لتربية الأسماك', en: 'Fish Farming Station Construction Project' },
                    ce: 100000000, cp: 100000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          },
          {
            code: '061_03',
            label: {
              code: 'ACT_061_03',
              fr: 'Conservation et préservation des ressources halieutiques et de leur Environnement',
              ar: 'حفظ وصيانة الموارد السمكية وبيئتها',
              en: 'Conservation and Preservation of Fishery Resources and their Environment'
            },
            totalCE: 1510800480,
            totalCP: 1050702803,
            chapters: [
              {
                code: '19_061_03_CAB',
                label: { code: 'CH_CABINET_FORMATION', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '19_061_03_CAB_11',
                    label: { code: 'LN_AMELIORATION_CENTRE_FORMATION', fr: 'Amélioration des installations du centre de qualification et de formation aux métiers', ar: 'تحسين منشآت مركز التأهيل والتكوين على المهن', en: 'Improvement of Qualification and Vocational Training Center Facilities' },
                    ce: 81550480, cp: 31146000,
                    climate: 'Neutre', donor: 'JAPON', financeType: 'grant'
                  }
                ]
              },
              {
                code: '19_061_03_GARDE_COTES',
                label: { code: 'CH_GARDE_COTES', fr: 'Garde Côte de Mauritanie', ar: 'خفر السواحل الموريتاني', en: 'Mauritania Coast Guard' },
                lines: [
                  {
                    code: '19_061_03_GARDE_COTES_03',
                    label: { code: 'LN_EQUIPEMENT_GARDE_COTES', fr: 'Acquisition d\'équipements au profit des garde-côtes de Mauritanie', ar: 'اقتناء معدات لصالح خفر السواحل الموريتاني', en: 'Equipment Acquisition for Mauritania Coast Guard' },
                    ce: 400000000, cp: 100000000, climate: 'Neutre'
                  },
                  {
                    code: '19_061_03_GARDE_COTES_04',
                    label: { code: 'LN_REM_PERSONNEL_GC', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 77487506, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '19_061_03_IMROP',
                label: { code: 'CH_IMROP', fr: 'IMROP - Institut Mauritanien de Recherches Océanographiques et de la Pêche', ar: 'المعهد الموريتاني لبحوث المحيطات والصيد', en: 'IMROP - Mauritanian Institute of Oceanographic and Fisheries Research' },
                lines: [
                  {
                    code: '19_061_03_IMROP_02',
                    label: { code: 'LN_REM_PERSONNEL_IMROP', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 84604512, climate: 'Neutre'
                  },
                  {
                    code: '19_061_03_IMROP_03',
                    label: { code: 'LN_ETUDES_RECHERCHE_IMROP', fr: 'Études et recherche', ar: 'الدراسات والبحث', en: 'Studies and Research' },
                    ce: 0, cp: 48950000, climate: 'Neutre'
                  },
                  {
                    code: '19_061_03_IMROP_05',
                    label: { code: 'LN_NAVIRE_RECHERCHE', fr: 'Construction d\'un navire de recherche halieutique', ar: 'بناء سفينة بحث سمكي', en: 'Construction of a Fishery Research Vessel' },
                    ce: 1029250000, cp: 465400000,
                    climate: 'Adaptation', donor: 'JAPON', financeType: 'grant'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '19_062',
        label: {
          code: 'PROG_062',
          fr: 'Affaires Maritimes et Infrastructures Maritimes et Portuaires',
          ar: 'الشؤون البحرية والبنى التحتية البحرية والمينائية',
          en: 'Maritime Affairs and Maritime and Port Infrastructure'
        },
        actions: [
          {
            code: '062_01',
            label: {
              code: 'ACT_062_01',
              fr: 'Opérationnalisation et développement des infrastructures maritimes',
              ar: 'تشغيل وتطوير البنى التحتية البحرية',
              en: 'Operationalization and Development of Maritime Infrastructure'
            },
            totalCE: 1090000000,
            totalCP: 362516654,
            chapters: [
              {
                code: '19_062_01_CAB',
                label: { code: 'CH_CABINET_INFRA', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '19_062_01_CAB_09',
                    label: { code: 'LN_PORT_TANIT', fr: 'Viabilisation et opérationnalisation du Port TANIT', ar: 'تهيئة وتشغيل ميناء تانيت', en: 'Servicing and Operationalization of Port TANIT' },
                    ce: 300000000, cp: 63290000, climate: 'Adaptation'
                  },
                  {
                    code: '19_062_01_CAB_19',
                    label: { code: 'LN_OUVRAGE_MARITIME_PK93', fr: 'Projet de construction de l\'ouvrage maritime du PK 93', ar: 'مشروع بناء المنشأة البحرية للنقطة الكيلومترية 93', en: 'PK 93 Maritime Structure Construction Project' },
                    ce: 50000000, cp: 50000000, climate: 'Neutre'
                  },
                  {
                    code: '19_062_01_CAB_22',
                    label: { code: 'LN_MODERNISATION_PORT_PECHE_NDB', fr: 'Projet de modernisation du Port des Pêches Artisanales de Nouadhibou', ar: 'مشروع عصرنة ميناء الصيد التقليدي في نواذيبو', en: 'Modernization Project of the Nouadhibou Artisanal Fishing Port' },
                    ce: 40000000, cp: 40000000, climate: 'Adaptation'
                  },
                  {
                    code: '19_062_01_CAB_80',
                    label: { code: 'LN_PORT_NDIAGO', fr: 'Viabilisation et opérationnalisation du Port de Ndiago', ar: 'تهيئة وتشغيل ميناء انجاكو', en: 'Servicing and Operationalization of Ndiago Port' },
                    ce: 600000000, cp: 126580000, climate: 'Neutre'
                  },
                  {
                    code: '19_062_01_CAB_90',
                    label: { code: 'LN_EQUIPEMENT_CHANTIER_NAVAL', fr: 'Acquisition d\'équipements au profit de la société du Chantier Naval', ar: 'اقتناء معدات لصالح شركة الورشة البحرية', en: 'Equipment Acquisition for Naval Shipyard Company' },
                    ce: 100000000, cp: 50000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '062_02',
            label: {
              code: 'ACT_062_02',
              fr: 'Immatriculation du parc de pêche artisanale et côtière, Renforcement des capacités de l\'AMAM',
              ar: 'ترقيم أسطول الصيد التقليدي والساحلي، تعزيز قدرات الوكالة الموريتانية للشؤون البحرية',
              en: 'Registration of the Artisanal and Coastal Fishing Fleet, Capacity Building of AMAM'
            },
            totalCE: 17000000,
            totalCP: 7000000,
            chapters: [
              {
                code: '19_062_02_CAB',
                label: { code: 'CH_CABINET_AMAM', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '19_062_02_CAB_16',
                    label: { code: 'LN_INSPECTION_NAVIRES', fr: 'Inspection des Navires de Pêches', ar: 'تفتيش سفن الصيد', en: 'Fishing Vessel Inspection' },
                    ce: 17000000, cp: 7000000, climate: 'Atténuation'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 21 : MINISTÈRE DE L'ÉQUIPEMENT ET DES TRANSPORTS
  // ==========================================================
  {
    code: '21',
    label: {
      code: 'MIN_EQUIPEMENT_TRANSPORTS',
      fr: 'Ministère de l\'Équipement et des Transports',
      ar: 'وزارة التجهيز والنقل',
      en: 'Ministry of Equipment and Transport'
    },
    programs: [
      {
        code: '21_083',
        label: {
          code: 'PROG_083',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '083_01',
            label: {
              code: 'ACT_083_01',
              fr: 'Coordination Administrative',
              ar: 'التنسيق الإداري',
              en: 'Administrative Coordination'
            },
            totalCE: 0,
            totalCP: 322725160,
            chapters: [
              {
                code: '21_083_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '21_083_01_CAB_01',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 12263109, climate: 'Neutre'
                  },
                  {
                    code: '21_083_01_CAB_04',
                    label: { code: 'LN_GESTION_ADMIN', fr: 'Pilotage et gestion administrative', ar: 'القيادة والتسيير الإداري', en: 'Management and Administrative Management' },
                    ce: 0, cp: 43623618, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '083_02',
            label: {
              code: 'ACT_083_02',
              fr: 'Pilotage stratégique',
              ar: 'القيادة الاستراتيجية',
              en: 'Strategic Leadership'
            },
            totalCE: 70000000,
            totalCP: 10000000,
            chapters: [
              {
                code: '21_083_02_DPC',
                label: { code: 'CH_DPC', fr: 'Direction de la Coopération et de la Programmation', ar: 'مديرية التعاون والبرمجة', en: 'Cooperation and Programming Directorate' },
                lines: [
                  {
                    code: '21_083_02_DPC_08',
                    label: { code: 'LN_ETUDES_STRATEGIQUES', fr: 'Études Stratégiques pour le département', ar: 'الدراسات الاستراتيجية للقطاع', en: 'Strategic Studies for the Department' },
                    ce: 70000000, cp: 10000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '21_084',
        label: {
          code: 'PROG_084',
          fr: 'Accessibilité et Mobilité',
          ar: 'الولوجية والتنقل',
          en: 'Accessibility and Mobility'
        },
        description: {
          code: 'PROG_084_DESC',
          fr: 'Amélioration de l\'accessibilité routière et développement de la mobilité urbaine',
          ar: 'تحسين الولوجية الطرقية وتطوير التنقل الحضري',
          en: 'Improvement of road accessibility and urban mobility development'
        },
        actions: [
          {
            code: '084_01',
            label: {
              code: 'ACT_084_01',
              fr: 'Amélioration de l\'accessibilité routière par réseau national',
              ar: 'تحسين الولوجية الطرقية عبر الشبكة الوطنية',
              en: 'Improvement of Road Accessibility via National Network'
            },
            totalCE: 13534345377,
            totalCP: 5174651686,
            chapters: [
              {
                code: '21_084_01_DTI',
                label: { code: 'CH_DTI', fr: 'Direction des Travaux d\'Infrastructures', ar: 'مديرية أشغال البنى التحتية', en: 'Infrastructure Works Directorate' },
                lines: [
                  {
                    code: '21_084_01_16',
                    label: { code: 'LN_PONT_ROSSO', fr: 'Construction du pont de Rosso sur le Fleuve du Sénégal', ar: 'بناء جسر روصو على نهر السنغال', en: 'Construction of the Rosso Bridge over the Senegal River' },
                    ce: 1048668691, cp: 342982400,
                    climate: 'Neutre', donor: 'UE', financeType: 'grant'
                  },
                  {
                    code: '21_084_01_20',
                    label: { code: 'LN_ROUTE_AMOURJ_ADEL_BAGROU', fr: 'Construction de la route Amourj - Adel Bagrou', ar: 'بناء طريق آمورج - عادل بگرو', en: 'Construction of the Amourj - Adel Bagrou Road' },
                    ce: 100000000, cp: 100000000, climate: 'Neutre'
                  },
                  {
                    code: '21_084_01_22',
                    label: { code: 'LN_ROUTE_ATAR_CHINGUITTI', fr: 'Travaux de Construction de la route Atar - Chinguitti', ar: 'أشغال بناء طريق أطار - شنقيط', en: 'Construction Works of the Atar - Chinguitti Road' },
                    ce: 795007859, cp: 253624014,
                    climate: 'Neutre', donor: 'BID', financeType: 'loan'
                  },
                  {
                    code: '21_084_01_28',
                    label: { code: 'LN_DESENCLAVEMENT', fr: 'Programme de désenclavement d\'accès généralisé aux services de base', ar: 'برنامج فك العزلة والوصول الشامل للخدمات الأساسية', en: 'Program for Opening Up Access to Basic Services' },
                    ce: 1002357346, cp: 621717346, climate: 'Neutre'
                  },
                  {
                    code: '21_084_01_29',
                    label: { code: 'LN_ROUTE_TIDJIKJA_KAYES', fr: 'Construction de la route Tidjikja - Kiffa - Kankoussa - Selibaby - Kayes', ar: 'بناء طريق تجكجة - كيفة - كنكوصة - سيلبابي - كايس', en: 'Construction of the Tidjikja - Kiffa - Kankoussa - Selibaby - Kayes Road' },
                    ce: 6082989903, cp: 1193916700,
                    climate: 'Neutre', donor: 'FADES', financeType: 'loan'
                  },
                  {
                    code: '21_084_01_73',
                    label: { code: 'LN_TRIANGLE_ESPOIR', fr: 'Réseaux routiers de triangle de l\'espoir MONGUEL SAWATA BAREKEOUL', ar: 'الشبكات الطرقية لمثلث الأمل مونكل - صواطه - باركيول', en: 'Triangle of Hope Road Networks MONGUEL SAWATA BAREKEOUL' },
                    ce: 500000000, cp: 500000000, climate: 'Neutre'
                  },
                  {
                    code: '21_084_01_91',
                    label: { code: 'LN_ROUTE_TEMBEDRA_BOUSTEILA', fr: 'Construction de la route Tembedra - Bousteila - Adel Bagrou', ar: 'بناء طريق تمبدغة - بوسطيلة - عادل بگرو', en: 'Construction of the Tembedra - Bousteila - Adel Bagrou Road' },
                    ce: 550000000, cp: 400000000, climate: 'Neutre'
                  },
                  {
                    code: '21_084_01_92',
                    label: { code: 'LN_PROGRAMME_PRIORITAIRE_NKTT', fr: 'Programme prioritaire de développement de centre ville de NKTT', ar: 'البرنامج ذو الأولوية لتطوير وسط مدينة نواكشوط', en: 'Priority Program for NKTT City Center Development' },
                    ce: 803440000, cp: 403440000, climate: 'Adaptation'
                  },
                  {
                    code: '21_084_01_93',
                    label: { code: 'LN_DEV_VILLE_NKTT', fr: 'Programme de développement de la ville de NKTT', ar: 'برنامج تطوير مدينة نواكشوط', en: 'NKTT City Development Program' },
                    ce: 631528921, cp: 631528921, climate: 'Neutre'
                  },
                  {
                    code: '21_084_01_95',
                    label: { code: 'LN_MOBILITE_URBAINE_NDB', fr: 'Projet mobilité urbaine Nouadhibou', ar: 'مشروع التنقل الحضري في نواذيبو', en: 'Nouadhibou Urban Mobility Project' },
                    ce: 140000000, cp: 40000000, climate: 'Atténuation'
                  }
                ]
              },
              {
                code: '21_084_01_DEI',
                label: { code: 'CH_DEI_ETUDES', fr: 'Direction des Études des Infrastructures', ar: 'مديرية دراسات البنى التحتية', en: 'Infrastructure Studies Directorate' },
                lines: [
                  {
                    code: '21_084_01_DEI_05',
                    label: { code: 'LN_FONDS_ETUDES_INFRA', fr: 'Fonds des études des infrastructures', ar: 'صندوق دراسات البنى التحتية', en: 'Infrastructure Studies Fund' },
                    ce: 155000000, cp: 60000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '084_04',
            label: {
              code: 'ACT_084_04',
              fr: 'Développement de la Mobilité urbaine',
              ar: 'تطوير التنقل الحضري',
              en: 'Urban Mobility Development'
            },
            totalCE: 265000000,
            totalCP: 335000000,
            chapters: [
              {
                code: '21_084_04_STP',
                label: { code: 'CH_STP', fr: 'Société de Transport Public', ar: 'شركة النقل العمومي', en: 'Public Transport Company' },
                lines: [
                  {
                    code: '21_084_04_STP_40',
                    label: { code: 'LN_MOBILITE_NKTT_HORIZON', fr: 'Projet mobilité urbain Nouakchott mobilité Horizon 2026', ar: 'مشروع التنقل الحضري نواكشوط موبيليتي أفاق 2026', en: 'Nouakchott Urban Mobility Project Horizon 2026' },
                    ce: 200000000, cp: 200000000, climate: 'Atténuation'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '21_085',
        label: {
          code: 'PROG_085',
          fr: 'Entretien et Sécurité Routière',
          ar: 'صيانة وسلامة الطرق',
          en: 'Road Maintenance and Safety'
        },
        actions: [
          {
            code: '085_01',
            label: {
              code: 'ACT_085_01',
              fr: 'Maintenance des infrastructures de transport',
              ar: 'صيانة البنى التحتية للنقل',
              en: 'Transport Infrastructure Maintenance'
            },
            totalCE: 6575993770,
            totalCP: 1145393720,
            chapters: [
              {
                code: '21_085_01_DEI',
                label: { code: 'CH_DEI_ENTRETIEN', fr: 'Direction de l\'Entretien des Infrastructures', ar: 'مديرية صيانة البنى التحتية', en: 'Infrastructure Maintenance Directorate' },
                lines: [
                  {
                    code: '21_085_01_02',
                    label: { code: 'LN_ENTRETIEN_RESEAU_ROUTIER', fr: 'Travaux d\'entretien du réseau routier national', ar: 'أشغال صيانة الشبكة الطرقية الوطنية', en: 'National Road Network Maintenance Works' },
                    ce: 2075993770, cp: 635993770, climate: 'Adaptation'
                  },
                  {
                    code: '21_085_01_45',
                    label: { code: 'LN_COPREVU', fr: 'Contrat-Programme d\'entretien des Voiries Urbaines/COPREVU', ar: 'عقد-برنامج صيانة الطرق الحضرية/COPREVU', en: 'Urban Road Maintenance Program Contract/COPREVU' },
                    ce: 200000000, cp: 200000000, climate: 'Adaptation'
                  },
                  {
                    code: '21_085_01_97',
                    label: { code: 'LN_REHAB_RESEAU_ROUTIER', fr: 'Réhabilitation du réseau routier national', ar: 'إعادة تأهيل الشبكة الطرقية الوطنية', en: 'Rehabilitation of the National Road Network' },
                    ce: 4300000000, cp: 300000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '21_086',
        label: {
          code: 'PROG_086',
          fr: 'Service de Transport',
          ar: 'خدمة النقل',
          en: 'Transport Service'
        },
        actions: [
          {
            code: '086_01',
            label: {
              code: 'ACT_086_01',
              fr: 'Régulation des transports terrestres',
              ar: 'تنظيم النقل البري',
              en: 'Land Transport Regulation'
            },
            totalCE: 940000000,
            totalCP: 713403920,
            chapters: [
              {
                code: '21_086_01_DT',
                label: { code: 'CH_DIRECTION_TRANSPORT', fr: 'Direction de Transport', ar: 'مديرية النقل', en: 'Transport Directorate' },
                lines: [
                  {
                    code: '21_086_01_DT_18',
                    label: { code: 'LN_PLAQUES_IMMATRICULATION', fr: 'Fournitures de plaque d\'immatriculation', ar: 'لوازم لوحات الترقيم', en: 'License Plate Supplies' },
                    ce: 200000000, cp: 200000000, climate: 'Neutre'
                  },
                  {
                    code: '21_086_01_DT_19',
                    label: { code: 'LN_CENTRES_EXAMEN_PERMIS', fr: 'Centres d\'examen des permis', ar: 'مراكز امتحان رخص السياقة', en: 'Driving License Examination Centers' },
                    ce: 50000000, cp: 50000000, climate: 'Neutre'
                  },
                  {
                    code: '21_086_01_DT_21',
                    label: { code: 'LN_MISE_NORMES_AEROPORTS', fr: 'Mise aux normes des aéroports à l\'intérieur du pays', ar: 'مطابقة المطارات الداخلية للمعايير', en: 'Upgrading of Domestic Airports to Standards' },
                    ce: 680000000, cp: 430000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 22 : MINISTÈRE DE L'AGRICULTURE ET DE LA 
  //           SOUVERAINETÉ ALIMENTAIRE
  // ==========================================================
  {
    code: '22',
    label: {
      code: 'MIN_AGRICULTURE',
      fr: 'Ministère de l\'Agriculture et de la Souveraineté Alimentaire',
      ar: 'وزارة الزراعة والسيادة الغذائية',
      en: 'Ministry of Agriculture and Food Sovereignty'
    },
    programs: [
      {
        code: '22_063',
        label: {
          code: 'PROG_063',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '063_01',
            label: {
              code: 'ACT_063_01',
              fr: 'Pilotage et Coordination',
              ar: 'القيادة والتنسيق',
              en: 'Leadership and Coordination'
            },
            totalCE: 6963600000,
            totalCP: 2006237522,
            chapters: [
              {
                code: '22_063_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '22_063_01_CAB_02',
                    label: { code: 'LN_MISE_OEUVRE_CHENAUX', fr: 'Projet de mise en œuvre des chenaux', ar: 'مشروع تنفيذ القنوات', en: 'Channel Implementation Project' },
                    ce: 970000000, cp: 970000000, climate: 'Adaptation'
                  },
                  {
                    code: '22_063_01_CAB_48',
                    label: { code: 'LN_INTRANTS_AGRICOLES', fr: 'Intrants agricoles', ar: 'المدخلات الزراعية', en: 'Agricultural Inputs' },
                    ce: 400000000, cp: 400000000, climate: 'Adaptation'
                  },
                  {
                    code: '22_063_01_CAB_51',
                    label: { code: 'LN_PAFAC', fr: 'Projet d\'appui au développement des filières porteuses et de l\'agriculture contractuelle (PAFAC)', ar: 'مشروع دعم تطوير الشعب الواعدة والزراعة التعاقدية', en: 'Support Project for Promising Value Chains and Contract Farming (PAFAC)' },
                    ce: 63600000, cp: 63600000,
                    climate: 'Adaptation', donor: 'FRANCE-AFD', financeType: 'grant'
                  },
                  {
                    code: '22_063_01_CAB_52',
                    label: { code: 'LN_PNAGSB_AGRICULTURE', fr: 'Programme National d\'Accès Généralisé aux Services de Base/Composante Agriculture', ar: 'البرنامج الوطني للوصول الشامل للخدمات الأساسية/مكون الزراعة', en: 'National Program for Generalized Access to Basic Services/Agriculture Component' },
                    ce: 724800000, cp: 362400000, climate: 'Adaptation'
                  },
                  {
                    code: '22_063_01_CAB_54',
                    label: { code: 'LN_COORDINATION_ADMIN', fr: 'Coordination administrative', ar: 'التنسيق الإداري', en: 'Administrative Coordination' },
                    ce: 0, cp: 14845289, climate: 'Neutre'
                  },
                  {
                    code: '22_063_01_CAB_55',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 65253347, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '22_064',
        label: {
          code: 'PROG_064',
          fr: 'Aménagement Rural',
          ar: 'التهيئة الريفية',
          en: 'Rural Development'
        },
        actions: [
          {
            code: '064_01',
            label: {
              code: 'ACT_064_01',
              fr: 'Aménagements hydro-agricoles',
              ar: 'التهيئات المائية الزراعية',
              en: 'Hydro-agricultural Developments'
            },
            totalCE: 9475763991,
            totalCP: 2093141401,
            chapters: [
              {
                code: '22_064_01_CAB',
                label: { code: 'CH_CABINET_AMENAGEMENT', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '22_064_01_CAB_20',
                    label: { code: 'LN_APPUI_INNOVATION_AGRICOLE', fr: 'Projet d\'Appui au développement et d\'innovation du secteur agricole en Mauritanie', ar: 'مشروع دعم تطوير وابتكار القطاع الزراعي في موريتانيا', en: 'Support Project for Agricultural Sector Development and Innovation in Mauritania' },
                    ce: 1349213701, cp: 127400000,
                    climate: 'Adaptation', donor: 'BM-IDA', financeType: 'loan'
                  },
                  {
                    code: '22_064_01_CAB_38',
                    label: { code: 'LN_ASARIGG', fr: 'Amélioration de la sécurité alimentaire par la relance de l\'irrigué dans le Gorgol et le Guidimagha (ASARIGG)', ar: 'تحسين الأمن الغذائي عبر إنعاش الزراعة المروية في كركول وكيديماغا', en: 'Improvement of Food Security through Irrigated Farming Revival in Gorgol and Guidimagha (ASARIGG)' },
                    ce: 315000000, cp: 62000000,
                    climate: 'Adaptation', donor: 'FRANCE-AFD', financeType: 'grant'
                  }
                ]
              },
              {
                code: '22_064_01_DAR',
                label: { code: 'CH_DAR', fr: 'Direction de l\'Aménagement Rural', ar: 'مديرية التهيئة الريفية', en: 'Rural Development Directorate' },
                lines: [
                  {
                    code: '22_064_01_DAR_02',
                    label: { code: 'LN_PDRI_INFRA', fr: 'PDRI - Infrastructures et aménagements rural', ar: 'مشروع تنمية الري القروي - البنى التحتية والتهيئة الريفية', en: 'PDRI - Rural Infrastructure and Development' },
                    ce: 4751000000, cp: 751000000, climate: 'Adaptation'
                  }
                ]
              },
              {
                code: '22_064_01_SONADER',
                label: { code: 'CH_SONADER', fr: 'Société Nationale pour le Développement Rural', ar: 'الشركة الوطنية للتنمية الريفية', en: 'National Company for Rural Development' },
                lines: [
                  {
                    code: '22_064_01_SONADER_04',
                    label: { code: 'LN_PERIMETRES_JEUNES_DIPLOMES', fr: 'Aménagements de périmètres agricoles au profit des jeunes diplômés', ar: 'تهيئة محيطات زراعية لفائدة الشباب الخريجين', en: 'Agricultural Perimeter Development for Young Graduates' },
                    ce: 300000000, cp: 300000000, climate: 'Adaptation'
                  },
                  {
                    code: '22_064_01_SONADER_72',
                    label: { code: 'LN_AMENAGEMENT_RURAL_SONADER', fr: 'Aménagement rural', ar: 'التهيئة الريفية', en: 'Rural Development' },
                    ce: 1365000000, cp: 501046725, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '22_064_01_PATAM',
                label: { code: 'CH_PATAM', fr: 'Projet Appui à la Transformation Agricole en Mauritanie (PATAM)', ar: 'مشروع دعم التحول الزراعي في موريتانيا', en: 'Support Project for Agricultural Transformation in Mauritania (PATAM)' },
                lines: [
                  {
                    code: '22_064_01_PATAM_37',
                    label: { code: 'LN_PATAM', fr: 'Programme d\'Appui à la Transformation Agricole en Mauritanie (PATAM)', ar: 'برنامج دعم التحول الزراعي في موريتانيا', en: 'Agricultural Transformation Support Program in Mauritania (PATAM)' },
                    ce: 1395550290, cp: 328750000,
                    climate: 'Adaptation', donor: 'BAD-BAD', financeType: 'grant'
                  }
                ]
              }
            ]
          },
          {
            code: '064_02',
            label: {
              code: 'ACT_064_02',
              fr: 'Infrastructures rurales',
              ar: 'البنى التحتية الريفية',
              en: 'Rural Infrastructure'
            },
            totalCE: 2130641672,
            totalCP: 312400000,
            chapters: [
              {
                code: '22_064_02_CAB',
                label: { code: 'CH_CABINET_RESILIENCE', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '22_064_02_CAB_50',
                    label: { code: 'LN_PRDC_VFS', fr: 'Projet de Résilience et de Développement Communautaire de la Vallée du fleuve Sénégal (PRDC-VFS)', ar: 'مشروع صمود وتنمية المجتمعات المحلية لوادي نهر السنغال', en: 'Senegal River Valley Community Resilience and Development Project (PRDC-VFS)' },
                    ce: 1427961140, cp: 110500000,
                    climate: 'Adaptation', donor: 'BM-IDA', financeType: 'loan'
                  }
                ]
              },
              {
                code: '22_064_02_PROGRES',
                label: { code: 'CH_PROGRES', fr: 'Gestion Durable des Ressources Naturelles (PROGRES)', ar: 'التسيير المستدام للموارد الطبيعية (PROGRES)', en: 'Sustainable Natural Resource Management (PROGRES)' },
                lines: [
                  {
                    code: '22_064_02_PROGRES_50',
                    label: { code: 'LN_PROGRES', fr: 'Gestion durable des ressources naturelles, d\'équipement communal et de structuration des producteurs ruraux (PROGRES)', ar: 'التسيير المستدام للموارد الطبيعية والتجهيز البلدي وهيكلة المنتجين الريفيين', en: 'Sustainable Management of Natural Resources, Communal Equipment and Rural Producer Structuring (PROGRES)' },
                    ce: 484305006, cp: 166900000,
                    climate: 'Adaptation', donor: 'FIDA', financeType: 'grant'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '22_065',
        label: {
          code: 'PROG_065',
          fr: 'Développement de la Production Agricole',
          ar: 'تطوير الإنتاج الزراعي',
          en: 'Agricultural Production Development'
        },
        actions: [
          {
            code: '065_01',
            label: {
              code: 'ACT_065_01',
              fr: 'Appui au développement des filières agricoles',
              ar: 'دعم تطوير الشعب الزراعية',
              en: 'Support for Agricultural Value Chain Development'
            },
            totalCE: 180000000,
            totalCP: 132914328,
            chapters: [
              {
                code: '22_065_01_CULTURES_FOURRAGERES',
                label: { code: 'CH_CULTURES_FOURRAGERES', fr: 'Projet de Développement des Cultures Fourragères', ar: 'مشروع تطوير الزراعات العلفية', en: 'Forage Crop Development Project' },
                lines: [
                  {
                    code: '22_065_01_CULTURES_FOURRAGERES_01',
                    label: { code: 'LN_DEV_CULTURES_FOURRAGERES', fr: 'Développement des Cultures', ar: 'تطوير الزراعات', en: 'Crop Development' },
                    ce: 180000000, cp: 79849599, climate: 'Adaptation'
                  }
                ]
              }
            ]
          },
          {
            code: '065_04',
            label: {
              code: 'ACT_065_04',
              fr: 'Conseil et organisation socioprofessionnelle',
              ar: 'الإرشاد والتنظيم الاجتماعي المهني',
              en: 'Advisory Services and Socio-professional Organization'
            },
            totalCE: 650000000,
            totalCP: 408055254,
            chapters: [
              {
                code: '22_065_04_DDFA',
                label: { code: 'CH_DDFA', fr: 'Direction de Développement des Filières Agricole', ar: 'مديرية تطوير الشعب الزراعية', en: 'Agricultural Value Chain Development Directorate' },
                lines: [
                  {
                    code: '22_065_04_DDFA_18',
                    label: { code: 'LN_PDRI_FILIERES', fr: 'PDRI développement des filières agricoles', ar: 'مشروع تنمية الري القروي - تطوير الشعب الزراعية', en: 'PDRI Agricultural Value Chain Development' },
                    ce: 650000000, cp: 300000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '22_066',
        label: {
          code: 'PROG_066',
          fr: 'Protection des Végétaux',
          ar: 'وقاية النباتات',
          en: 'Plant Protection'
        },
        actions: [
          {
            code: '066_01',
            label: {
              code: 'ACT_066_01',
              fr: 'Lutte contre les ennemis et les maladies des cultures',
              ar: 'مكافحة أعداء وأمراض الزراعات',
              en: 'Fight against Crop Pests and Diseases'
            },
            totalCE: 400000000,
            totalCP: 245729591,
            chapters: [
              {
                code: '22_066_01_DPV',
                label: { code: 'CH_DPV', fr: 'Direction de la Protection des Végétaux', ar: 'مديرية وقاية النباتات', en: 'Plant Protection Directorate' },
                lines: [
                  {
                    code: '22_066_01_DPV_02',
                    label: { code: 'LN_PDRI_PROTECTION_VEGETAUX', fr: 'PDRI protection des végétaux', ar: 'مشروع تنمية الري القروي - وقاية النباتات', en: 'PDRI Plant Protection' },
                    ce: 400000000, cp: 100000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 25 : MINISTÈRE DE L'ÉDUCATION ET DE LA RÉFORME
  //           DU SYSTÈME D'ENSEIGNEMENT
  // ==========================================================
  {
    code: '25',
    label: {
      code: 'MIN_EDUCATION',
      fr: 'Ministère de l\'Éducation et de la Réforme du Système d\'Enseignement',
      ar: 'وزارة التربية وإصلاح النظام التعليمي',
      en: 'Ministry of Education and Education System Reform'
    },
    programs: [
      {
        code: '25_037',
        label: {
          code: 'PROG_037',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '037_01',
            label: {
              code: 'ACT_037_01',
              fr: 'Pilotage, coordination et gestion administrative',
              ar: 'القيادة والتنسيق والتسيير الإداري',
              en: 'Leadership, Coordination and Administrative Management'
            },
            totalCE: 566000000,
            totalCP: 1919776496,
            chapters: [
              {
                code: '25_037_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '25_037_01_CAB_02',
                    label: { code: 'LN_FONCTIONNEMENT_CABINET', fr: 'Fonctionnement du cabinet', ar: 'تسيير الديوان', en: 'Cabinet Operations' },
                    ce: 0, cp: 80713188, climate: 'Neutre'
                  },
                  {
                    code: '25_037_01_CAB_05',
                    label: { code: 'LN_FOURNITURES_SCOLAIRES', fr: 'Approvisionnement des établissements de l\'éducation en fournitures scolaires', ar: 'تزويد مؤسسات التعليم بالأدوات المدرسية', en: 'Supply of School Materials to Educational Establishments' },
                    ce: 0, cp: 11703451, climate: 'Neutre'
                  },
                  {
                    code: '25_037_01_CAB_21',
                    label: { code: 'LN_OUKHOUWA', fr: 'OUKHOUWA : Discrimination Positive dans les Lycées d\'Excellence', ar: 'أخوة: التمييز الإيجابي في ثانويات الامتياز', en: 'OUKHOUWA: Positive Discrimination in Excellence High Schools' },
                    ce: 0, cp: 4400000, climate: 'Neutre'
                  },
                  {
                    code: '25_037_01_CAB_22',
                    label: { code: 'LN_APPUI_ETABLISSEMENTS', fr: 'Appui au renforcement des capacités d\'établissements scolaires', ar: 'دعم تعزيز قدرات المؤسسات المدرسية', en: 'Support for School Capacity Building' },
                    ce: 16000000, cp: 16000000, climate: 'Neutre'
                  },
                  {
                    code: '25_037_01_CAB_29',
                    label: { code: 'LN_SUBVENTIONS_APE', fr: 'Subventions aux Associations des Parents d\'Élèves', ar: 'إعانات لجمعيات آباء التلاميذ', en: 'Grants to Parent-Teacher Associations' },
                    ce: 0, cp: 4500000, climate: 'Neutre'
                  },
                  {
                    code: '25_037_01_CAB_31',
                    label: { code: 'LN_ENTRETIEN_BATIMENTS_SCOLAIRES', fr: 'Entretien des bâtiments scolaires', ar: 'صيانة المباني المدرسية', en: 'School Building Maintenance' },
                    ce: 0, cp: 19503186, climate: 'Neutre'
                  },
                  {
                    code: '25_037_01_CAB_40',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 854608797, climate: 'Neutre'
                  },
                  {
                    code: '25_037_01_CAB_42',
                    label: { code: 'LN_PRIX_EXCELLENCE', fr: 'Prix d\'excellence', ar: 'جائزة الامتياز', en: 'Excellence Award' },
                    ce: 0, cp: 25000000, climate: 'Neutre'
                  },
                  {
                    code: '25_037_01_CAB_45',
                    label: { code: 'LN_FONDS_LOGEMENT_ENSEIGNANTS', fr: 'Fonds d\'appui au logement des enseignants', ar: 'صندوق دعم سكن المدرسين', en: 'Teacher Housing Support Fund' },
                    ce: 600000000, cp: 600000000, climate: 'Neutre'
                  },
                  {
                    code: '25_037_01_CAB_73',
                    label: { code: 'LN_PRODUCTION_TABLES_BANCS', fr: 'Production des tables bancs pour accompagner le développement de l\'offre scolaire', ar: 'إنتاج الطاولات المدرسية لمرافقة تطوير العرض المدرسي', en: 'Production of School Desks to Support School Offer Development' },
                    ce: 490000000, cp: 150000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '037_02',
            label: {
              code: 'ACT_037_02',
              fr: 'Mise en œuvre de la réforme éducative',
              ar: 'تنفيذ الإصلاح التربوي',
              en: 'Implementation of Educational Reform'
            },
            totalCE: 430000000,
            totalCP: 144386504,
            chapters: [
              {
                code: '25_037_02_IPN',
                label: { code: 'CH_IPN', fr: 'Institut Pédagogique National', ar: 'المعهد التربوي الوطني', en: 'National Pedagogical Institute' },
                lines: [
                  {
                    code: '25_037_02_IPN_03',
                    label: { code: 'LN_IMPRESSION_MANUELS', fr: 'Impression et distribution des manuels scolaires', ar: 'طباعة وتوزيع الكتب المدرسية', en: 'Printing and Distribution of Textbooks' },
                    ce: 430000000, cp: 100000000, climate: 'Neutre'
                  },
                  {
                    code: '25_037_02_IPN_72',
                    label: { code: 'LN_REM_PERSONNEL_IPN', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 21593632, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '037_03',
            label: {
              code: 'ACT_037_03',
              fr: 'Évaluation, contrôle, audit',
              ar: 'التقييم والمراقبة والتدقيق',
              en: 'Evaluation, Control, Audit'
            },
            totalCE: 0,
            totalCP: 3043076003,
            chapters: [
              {
                code: '25_037_03_DGE',
                label: { code: 'CH_DGE', fr: 'Direction Générale de l\'Enseignement', ar: 'المديرية العامة للتعليم', en: 'General Directorate of Education' },
                lines: [
                  {
                    code: '25_037_03_DGE_08',
                    label: { code: 'LN_REM_PERSONNEL_DGE', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 2808277554, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '25_037_03_DEC',
                label: { code: 'CH_DEC', fr: 'Direction des Examens et Concours', ar: 'مديرية الامتحانات والمسابقات', en: 'Examinations and Competitions Directorate' },
                lines: [
                  {
                    code: '25_037_03_DEC_02',
                    label: { code: 'LN_REM_PERSONNEL_DEC', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 118509021, climate: 'Neutre'
                  },
                  {
                    code: '25_037_03_DEC_03',
                    label: { code: 'LN_ORGANISATION_EXAMENS', fr: 'Organisation des examens et concours', ar: 'تنظيم الامتحانات والمسابقات', en: 'Organization of Examinations and Competitions' },
                    ce: 0, cp: 95793284, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '25_038',
        label: {
          code: 'PROG_038',
          fr: 'Enseignement de Base',
          ar: 'التعليم الأساسي',
          en: 'Basic Education'
        },
        actions: [
          {
            code: '038_01',
            label: {
              code: 'ACT_038_01',
              fr: 'Éducation de base',
              ar: 'التعليم الأساسي',
              en: 'Basic Education'
            },
            totalCE: 0,
            totalCP: 263521594,
            chapters: [
              {
                code: '25_038_01_DGE',
                label: { code: 'CH_DGE_BASE', fr: 'Direction Générale de l\'Enseignement', ar: 'المديرية العامة للتعليم', en: 'General Directorate of Education' },
                lines: [
                  {
                    code: '25_038_01_DGE_10',
                    label: { code: 'LN_INDEMNITES_EQUIPEMENT', fr: 'Indemnités d\'équipement pour instituteurs et professeurs', ar: 'تعويضات التجهيز للمعلمين والأساتذة', en: 'Equipment Allowances for Teachers and Professors' },
                    ce: 0, cp: 110447200, climate: 'Neutre'
                  },
                  {
                    code: '25_038_01_DGE_12',
                    label: { code: 'LN_BOURSES_SECONDAIRE', fr: 'Bourses élèves de l\'enseignement secondaire', ar: 'منح تلاميذ التعليم الثانوي', en: 'Secondary Education Student Scholarships' },
                    ce: 0, cp: 20000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '038_02',
            label: {
              code: 'ACT_038_02',
              fr: 'Formation et environnement scolaire',
              ar: 'التكوين والوسط المدرسي',
              en: 'Training and School Environment'
            },
            totalCE: 0,
            totalCP: 50794508,
            chapters: [
              {
                code: '25_038_02_DNES',
                label: { code: 'CH_DNES', fr: 'Direction de la Nutrition et de l\'Éducation Sanitaire', ar: 'مديرية التغذية والتربية الصحية', en: 'Nutrition and Health Education Directorate' },
                lines: [
                  {
                    code: '25_038_02_DNES_03',
                    label: { code: 'LN_CANTINES_SCOLAIRES', fr: 'Mise en place d\'un programme de cantines scolaires', ar: 'وضع برنامج للمطاعم المدرسية', en: 'Implementation of School Canteen Program' },
                    ce: 0, cp: 50000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '25_039',
        label: {
          code: 'PROG_039',
          fr: 'Enseignement Secondaire',
          ar: 'التعليم الثانوي',
          en: 'Secondary Education'
        },
        actions: [
          {
            code: '039_02',
            label: {
              code: 'ACT_039_02',
              fr: 'Établissements secondaire (Lycées)',
              ar: 'المؤسسات الثانوية (الثانويات)',
              en: 'Secondary Establishments (High Schools)'
            },
            totalCE: 0,
            totalCP: 6637989730,
            chapters: [
              {
                code: '25_039_02_HE_CHARGUI',
                label: { code: 'CH_DREN_HE_CHARGUI', fr: 'DREN Hodh El Chargui', ar: 'الإدارة الجهوية للتهذيب الوطني بالحوض الشرقي', en: 'DREN Hodh El Chargui' },
                lines: [
                  {
                    code: '25_039_02_HE_CHARGUI_02',
                    label: { code: 'LN_REM_PERSONNEL_HE_CHARGUI', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 394468017, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '25_039_02_BRAKNA',
                label: { code: 'CH_DREN_BRAKNA', fr: 'DREN Brakna', ar: 'الإدارة الجهوية للتهذيب الوطني بالبراكنة', en: 'DREN Brakna' },
                lines: [
                  {
                    code: '25_039_02_BRAKNA_02',
                    label: { code: 'LN_REM_PERSONNEL_BRAKNA', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 627795898, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '25_039_02_TRARZA',
                label: { code: 'CH_DREN_TRARZA', fr: 'DREN Trarza', ar: 'الإدارة الجهوية للتهذيب الوطني بترارزة', en: 'DREN Trarza' },
                lines: [
                  {
                    code: '25_039_02_TRARZA_02',
                    label: { code: 'LN_REM_PERSONNEL_TRARZA', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 718175654, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '25_039_02_NKTT',
                label: { code: 'CH_DREN_NKTT', fr: 'DREN Nouakchott', ar: 'الإدارة الجهوية للتهذيب الوطني بنواكشوط', en: 'DREN Nouakchott' },
                lines: [
                  {
                    code: '25_039_02_NKTT_NORD_02',
                    label: { code: 'LN_REM_PERSONNEL_NKTT_NORD', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 679338000, climate: 'Neutre'
                  },
                  {
                    code: '25_039_02_NKTT_OUEST_02',
                    label: { code: 'LN_REM_PERSONNEL_NKTT_OUEST', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 287327146, climate: 'Neutre'
                  },
                  {
                    code: '25_039_02_NKTT_SUD_02',
                    label: { code: 'LN_REM_PERSONNEL_NKTT_SUD', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 621208482, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '25_039_02_GORGOL',
                label: { code: 'CH_DREN_GORGOL', fr: 'DREN Gorgol', ar: 'الإدارة الجهوية للتهذيب الوطني بكوركول', en: 'DREN Gorgol' },
                lines: [
                  {
                    code: '25_039_02_GORGOL_02',
                    label: { code: 'LN_REM_PERSONNEL_GORGOL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 550323925, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 26 : MINISTÈRE DE L'ÉLEVAGE
  // ==========================================================
  {
    code: '26',
    label: {
      code: 'MIN_ELEVAGE',
      fr: 'Ministère de l\'Élevage',
      ar: 'وزارة التنمية الحيوانية',
      en: 'Ministry of Livestock'
    },
    programs: [
      {
        code: '26_067',
        label: {
          code: 'PROG_067',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '067_01',
            label: {
              code: 'ACT_067_01',
              fr: 'Pilotage',
              ar: 'القيادة',
              en: 'Leadership'
            },
            totalCE: 100800000,
            totalCP: 668549249,
            chapters: [
              {
                code: '26_067_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '26_067_01_CAB_87',
                    label: { code: 'LN_PNAGSB_ELEVAGE', fr: 'Programme National d\'Accès Généralisé aux Services de Base/Composante Élevage', ar: 'البرنامج الوطني للوصول الشامل للخدمات الأساسية/مكون التنمية الحيوانية', en: 'National Program for Generalized Access to Basic Services/Livestock Component' },
                    ce: 100800000, cp: 50400000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '26_068',
        label: {
          code: 'PROG_068',
          fr: 'Développement des Filières Animales',
          ar: 'تطوير الشعب الحيوانية',
          en: 'Animal Value Chain Development'
        },
        actions: [
          {
            code: '068_01',
            label: {
              code: 'ACT_068_01',
              fr: 'Alimentation animale',
              ar: 'التغذية الحيوانية',
              en: 'Animal Feed'
            },
            totalCE: 90000000,
            totalCP: 31300000,
            chapters: []
          },
          {
            code: '068_02',
            label: {
              code: 'ACT_068_02',
              fr: 'Filières bétail, viandes, avicole et sous-produits',
              ar: 'شعب الماشية واللحوم والدواجن والمنتجات الثانوية',
              en: 'Livestock, Meat, Poultry and By-products Value Chains'
            },
            totalCE: 90000000,
            totalCP: 159000000,
            chapters: [
              {
                code: '26_068_02_CAB',
                label: { code: 'CH_CABINET_MICROPROJETS', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '26_068_02_CAB_60',
                    label: { code: 'LN_APPUI_CHAINE_VIANDE', fr: 'Projet d\'appui à la chaîne de production des viandes rouges de qualité', ar: 'مشروع دعم سلسلة إنتاج اللحوم الحمراء ذات الجودة', en: 'Support Project for Quality Red Meat Production Chain' },
                    ce: 90000000, cp: 30000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          },
          {
            code: '068_03',
            label: {
              code: 'ACT_068_03',
              fr: 'Filière laitière',
              ar: 'شعبة الحليب',
              en: 'Dairy Value Chain'
            },
            totalCE: 838199612,
            totalCP: 216872905,
            chapters: [
              {
                code: '26_068_03_PDIE',
                label: { code: 'CH_PDIE', fr: 'Projet de Développement Intégré de l\'Élevage PDIE', ar: 'مشروع التنمية المتكاملة للتنمية الحيوانية', en: 'Integrated Livestock Development Project PDIE' },
                lines: [
                  {
                    code: '26_068_03_PDIE_02',
                    label: { code: 'LN_BASSINS_LAITIERS', fr: 'Développement des bassins laitiers', ar: 'تطوير الأحواض الحليبية', en: 'Dairy Basin Development' },
                    ce: 838199612, cp: 138199612, climate: 'Adaptation'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '26_069',
        label: {
          code: 'PROG_069',
          fr: 'Développement des Ressources Pastorales et Fourragères',
          ar: 'تطوير الموارد الرعوية والعلفية',
          en: 'Pastoral and Forage Resource Development'
        },
        actions: [
          {
            code: '069_01',
            label: {
              code: 'ACT_069_01',
              fr: 'Alimentation animale',
              ar: 'التغذية الحيوانية',
              en: 'Animal Feed'
            },
            totalCE: 1002800000,
            totalCP: 84800000,
            chapters: [
              {
                code: '26_069_01_CAB',
                label: { code: 'CH_CABINET_AWKAR', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '26_069_01_CAB_08',
                    label: { code: 'LN_AWKAR', fr: 'Projet de valorisation des ressources agropastorales (AWKAR)', ar: 'مشروع تثمين الموارد الرعوية الزراعية (أوكار)', en: 'Agropastoral Resource Valorization Project (AWKAR)' },
                    ce: 892800000, cp: 54800000,
                    climate: 'Adaptation', donor: 'BAD-FAD', financeType: 'loan'
                  }
                ]
              },
              {
                code: '26_069_01_DDFA',
                label: { code: 'CH_DDFA', fr: 'Direction de Développement des Filières Animales', ar: 'مديرية تطوير الشعب الحيوانية', en: 'Animal Value Chain Development Directorate' },
                lines: [
                  {
                    code: '26_069_01_DDFA_10',
                    label: { code: 'LN_VALORISATION_CULTURES_FOURRAGERES', fr: 'Valorisation durable de cultures fourragères et des pâturages', ar: 'التثمين المستدام للزراعات العلفية والمراعي', en: 'Sustainable Valorization of Forage Crops and Pastures' },
                    ce: 110000000, cp: 30000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          },
          {
            code: '069_02',
            label: {
              code: 'ACT_069_02',
              fr: 'Pastoralisme',
              ar: 'الرعي',
              en: 'Pastoralism'
            },
            totalCE: 2150169024,
            totalCP: 628920000,
            chapters: [
              {
                code: '26_069_02_ONRDEL',
                label: { code: 'CH_ONRDEL', fr: 'Office National de Recherches et de Développement de l\'Élevage', ar: 'المكتب الوطني للبحوث وتنمية التنمية الحيوانية', en: 'National Office for Livestock Research and Development' },
                lines: [
                  {
                    code: '26_069_02_ONRDEL_03',
                    label: { code: 'LN_HYDRAULIQUE_PASTORALE', fr: 'Programme National d\'hydraulique Pastorale', ar: 'البرنامج الوطني للمياه الرعوية', en: 'National Pastoral Hydraulics Program' },
                    ce: 250000000, cp: 50000000, climate: 'Adaptation'
                  }
                ]
              },
              {
                code: '26_069_02_PRAPS',
                label: { code: 'CH_PRAPS', fr: 'Appui au pastoralisme au Sahel (PRAPS)', ar: 'دعم الرعي في الساحل', en: 'Pastoralism Support in the Sahel (PRAPS)' },
                lines: [
                  {
                    code: '26_069_02_PRAPS_34',
                    label: { code: 'LN_PRAPS_II', fr: 'Projet Appui au pastoralisme au Sahel (PRAPS) - Phase II', ar: 'مشروع دعم الرعي في الساحل - المرحلة الثانية', en: 'Pastoralism Support Project in the Sahel (PRAPS) - Phase II' },
                    ce: 1900169024, cp: 578920000,
                    climate: 'Adaptation', donor: 'BM-IDA', financeType: 'grant'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '26_070',
        label: {
          code: 'PROG_070',
          fr: 'Santé Animale',
          ar: 'الصحة الحيوانية',
          en: 'Animal Health'
        },
        actions: [
          {
            code: '070_01',
            label: {
              code: 'ACT_070_01',
              fr: 'Prévention et surveillance épidémiologique',
              ar: 'الوقاية والمراقبة الوبائية',
              en: 'Epidemiological Prevention and Surveillance'
            },
            totalCE: 205000000,
            totalCP: 105118574,
            chapters: [
              {
                code: '26_070_01_DSV',
                label: { code: 'CH_DSV', fr: 'Direction des Services Vétérinaires', ar: 'مديرية المصالح البيطرية', en: 'Veterinary Services Directorate' },
                lines: [
                  {
                    code: '26_070_01_DSV_11',
                    label: { code: 'LN_INFRA_SANITAIRES', fr: 'Renforcements des infrastructures sanitaires', ar: 'تعزيز البنى التحتية الصحية', en: 'Health Infrastructure Reinforcement' },
                    ce: 205000000, cp: 50000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 53 : MINISTÈRE DE LA SANTÉ
  // ==========================================================
  {
    code: '53',
    label: {
      code: 'MIN_SANTE',
      fr: 'Ministère de la Santé',
      ar: 'وزارة الصحة',
      en: 'Ministry of Health'
    },
    programs: [
      {
        code: '53_044',
        label: {
          code: 'PROG_044',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '044_01',
            label: {
              code: 'ACT_044_01',
              fr: 'Pilotage, Coordination et régulation',
              ar: 'القيادة والتنسيق والتنظيم',
              en: 'Leadership, Coordination and Regulation'
            },
            totalCE: 7334437276,
            totalCP: 8704475008,
            chapters: [
              {
                code: '53_044_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '53_044_01_CAB_10',
                    label: { code: 'LN_PRISE_CHARGE_RESIDENTS', fr: 'Prise en Charge des Résidents de la Santé', ar: 'التكفل بالأطباء المقيمين في الصحة', en: 'Health Residents Care' },
                    ce: 0, cp: 71875200, climate: 'Neutre'
                  },
                  {
                    code: '53_044_01_CAB_27',
                    label: { code: 'LN_EQUIPEMENTS_MEDICAUX', fr: 'Acquisition du Matériel et des équipements médicaux techniques', ar: 'اقتناء العتاد والمعدات الطبية التقنية', en: 'Acquisition of Technical Medical Equipment and Materials' },
                    ce: 3436800000, cp: 1396800000, climate: 'Neutre'
                  },
                  {
                    code: '53_044_01_CAB_32',
                    label: { code: 'LN_SOINS_CARDIOLOGIE', fr: 'Prise en charge sociale des soins vitaux de cardiologie', ar: 'التكفل الاجتماعي بالعلاجات الحيوية لأمراض القلب', en: 'Social Care for Vital Cardiology Treatments' },
                    ce: 0, cp: 60000000, climate: 'Neutre'
                  },
                  {
                    code: '53_044_01_CAB_54',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 169937627, climate: 'Neutre'
                  },
                  {
                    code: '53_044_01_CAB_61',
                    label: { code: 'LN_PROG_PILOTE_SANTE_NKTT', fr: 'Programme pilote des investissements du secteur de la santé à Nouakchott', ar: 'البرنامج النموذجي لاستثمارات قطاع الصحة في نواكشوط', en: 'Pilot Program for Health Sector Investments in Nouakchott' },
                    ce: 870000000, cp: 190000000, climate: 'Neutre'
                  },
                  {
                    code: '53_044_01_CAB_62',
                    label: { code: 'LN_HOPITAL_ROI_SALMANE', fr: 'Construction de l\'hôpital du roi Salmane Ben Abdel Aziz', ar: 'بناء مستشفى الملك سلمان بن عبد العزيز', en: 'Construction of King Salmane Ben Abdel Aziz Hospital' },
                    ce: 562500000, cp: 112500000,
                    climate: 'Neutre', donor: 'FSD', financeType: 'grant'
                  }
                ]
              },
              {
                code: '53_044_01_INFRA',
                label: { code: 'CH_INFRA_MAINTENANCE', fr: 'Direction des Infrastructures, de la Maintenance et du Matériel', ar: 'مديرية البنى التحتية والصيانة والعتاد', en: 'Infrastructure, Maintenance and Equipment Directorate' },
                lines: [
                  {
                    code: '53_044_01_INFRA_02',
                    label: { code: 'LN_INFRA_MAINTENANCE', fr: 'Infrastructures, de la Maintenance et du Matériel', ar: 'البنى التحتية والصيانة والعتاد', en: 'Infrastructure, Maintenance and Equipment' },
                    ce: 0, cp: 1186548, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '53_044_01_SERVICES_REGIONAUX',
                label: { code: 'CH_SERVICES_REGIONAUX', fr: 'Services Régionaux', ar: 'المصالح الجهوية', en: 'Regional Services' },
                lines: [
                  {
                    code: '53_044_01_SERVICES_REGIONAUX_02',
                    label: { code: 'LN_REM_PERSONNEL_REGION', fr: 'Rémunération du Personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 2201530360, climate: 'Neutre'
                  },
                  {
                    code: '53_044_01_SERVICES_REGIONAUX_10',
                    label: { code: 'LN_PRISE_CHARGE_DIALYSES', fr: 'Prise en charge des malades dialysés', ar: 'التكفل بمرضى تصفية الكلى', en: 'Care for Dialysis Patients' },
                    ce: 0, cp: 380400000, climate: 'Neutre'
                  },
                  {
                    code: '53_044_01_SERVICES_REGIONAUX_11',
                    label: { code: 'LN_MEDICAMENTS_CANCEREUX', fr: 'Prise en charge des médicaments Roche pour les cancéreux', ar: 'التكفل بأدوية روش لمرضى السرطان', en: 'Roche Medication Care for Cancer Patients' },
                    ce: 0, cp: 91000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '53_045',
        label: {
          code: 'PROG_045',
          fr: 'Santé de Base Préventive',
          ar: 'الصحة الأساسية الوقائية',
          en: 'Preventive Basic Health'
        },
        actions: [
          {
            code: '045_01',
            label: {
              code: 'ACT_045_01',
              fr: 'Développement des structures de santé de base',
              ar: 'تطوير هياكل الصحة الأساسية',
              en: 'Development of Basic Health Structures'
            },
            totalCE: 0,
            totalCP: 357980235,
            chapters: []
          },
          {
            code: '045_02',
            label: {
              code: 'ACT_045_02',
              fr: 'Promotion de la santé, prévention et prise en charge des maladies',
              ar: 'تعزيز الصحة والوقاية والتكفل بالأمراض',
              en: 'Health Promotion, Prevention and Disease Management'
            },
            totalCE: 622955571,
            totalCP: 207971651,
            chapters: [
              {
                code: '53_045_02_SMENE',
                label: { code: 'CH_SMENE', fr: 'Direction de la Santé de la Mère, de l\'Enfant et de la Nutrition', ar: 'مديرية صحة الأم والطفل والتغذية', en: 'Mother, Child and Nutrition Health Directorate' },
                lines: [
                  {
                    code: '53_045_02_SMENE_10',
                    label: { code: 'LN_ACQUISITION_VACCINS', fr: 'Acquisition des vaccins du PEV/ PforR', ar: 'اقتناء لقاحات البرنامج الموسع للتلقيح', en: 'Acquisition of EPI Vaccines/ PforR' },
                    ce: 241591186, cp: 101591186, climate: 'Neutre'
                  },
                  {
                    code: '53_045_02_SMENE_11',
                    label: { code: 'LN_CONSTRUCTION_VACCINATION', fr: 'Construction et Réhabilitation des Structures de la Vaccination/PforR', ar: 'بناء وإعادة تأهيل هياكل التلقيح', en: 'Construction and Rehabilitation of Vaccination Structures/PforR' },
                    ce: 3000000, cp: 3000000, climate: 'Neutre'
                  },
                  {
                    code: '53_045_02_SMENE_15',
                    label: { code: 'LN_APPUI_SANTE_MATERNELLE', fr: 'Appui aux services de la santé maternelle et néonatale', ar: 'دعم خدمات صحة الأم والوليد', en: 'Support for Maternal and Neonatal Health Services' },
                    ce: 378364385, cp: 26010000,
                    climate: 'Neutre', donor: 'BID-Vente à terme', financeType: 'loan'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '53_046',
        label: {
          code: 'PROG_046',
          fr: 'Soins de Référence et Soins Spécialisés',
          ar: 'العلاجات المرجعية والعلاجات المتخصصة',
          en: 'Referral Care and Specialized Care'
        },
        actions: [
          {
            code: '046_02',
            label: {
              code: 'ACT_046_02',
              fr: 'Amélioration de la qualité des soins hospitaliers',
              ar: 'تحسين جودة العلاجات الاستشفائية',
              en: 'Improvement of Hospital Care Quality'
            },
            totalCE: 0,
            totalCP: 1000000,
            chapters: []
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 67 : MINISTÈRE DE FINANCES
  // ==========================================================
  {
    code: '67',
    label: {
      code: 'MIN_FINANCES',
      fr: 'Ministère des Finances',
      ar: 'وزارة المالية',
      en: 'Ministry of Finance'
    },
    programs: [
      {
        code: '67_100',
        label: {
          code: 'PROG_100',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '100_01',
            label: {
              code: 'ACT_100_01',
              fr: 'Pilotage et stratégie ministérielle',
              ar: 'القيادة والاستراتيجية القطاعية',
              en: 'Ministry Leadership and Strategy'
            },
            totalCE: 255160000,
            totalCP: 374370694,
            chapters: [
              {
                code: '67_100_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '67_100_01_CAB_17',
                    label: { code: 'LN_APPUI_REFORME_FINANCES', fr: 'Projet d\'Appui au Programme National de Réforme Intégrée des Finances Publiques', ar: 'مشروع دعم البرنامج الوطني للإصلاح المندمج للمالية العمومية', en: 'Support Project for the National Integrated Public Finance Reform Program' },
                    ce: 255160000, cp: 63840000,
                    climate: 'Neutre', donor: 'UE', financeType: 'grant'
                  },
                  {
                    code: '67_100_01_CAB_47',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 61987946, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '100_02',
            label: {
              code: 'ACT_100_02',
              fr: 'Coordination administrative',
              ar: 'التنسيق الإداري',
              en: 'Administrative Coordination'
            },
            totalCE: 0,
            totalCP: 92417751,
            chapters: [
              {
                code: '67_100_02_AJE',
                label: { code: 'CH_AJE', fr: 'Agence Judiciaire de l\'État (AJE)', ar: 'الوكالة القضائية للدولة', en: 'State Judicial Agency (AJE)' },
                lines: [
                  {
                    code: '67_100_02_AJE_02',
                    label: { code: 'LN_AGENCE_JUDICIAIRE', fr: 'Agence Judiciaire de l\'État', ar: 'الوكالة القضائية للدولة', en: 'State Judicial Agency' },
                    ce: 0, cp: 15814377, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '67_101',
        label: {
          code: 'PROG_101',
          fr: 'Budget et Gouvernance des Entreprises Publiques',
          ar: 'الميزانية وحوكمة المؤسسات العمومية',
          en: 'Budget and Public Enterprise Governance'
        },
        actions: [
          {
            code: '101_02',
            label: {
              code: 'ACT_101_02',
              fr: 'Programmation Budgétaire',
              ar: 'البرمجة الميزانياتية',
              en: 'Budget Programming'
            },
            totalCE: 1927000000,
            totalCP: 280000000,
            chapters: [
              {
                code: '67_101_02_DGB',
                label: { code: 'CH_DGB', fr: 'Direction Générale du Budget', ar: 'المديرية العامة للميزانية', en: 'General Directorate of Budget' },
                lines: [
                  {
                    code: '67_101_02_DGB_02',
                    label: { code: 'LN_PROG_SOUTIEN_EFFICACITE', fr: 'Programme de soutien à l\'efficacité et à l\'efficience des dépenses publiques', ar: 'برنامج دعم فعالية ونجاعة النفقات العمومية', en: 'Program to Support the Effectiveness and Efficiency of Public Expenditure' },
                    ce: 1927000000, cp: 280000000,
                    climate: 'Neutre', donor: 'BM-IDA', financeType: 'loan'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '67_102',
        label: {
          code: 'PROG_102',
          fr: 'Douanes',
          ar: 'الجمارك',
          en: 'Customs'
        },
        actions: [
          {
            code: '102_01',
            label: {
              code: 'ACT_102_01',
              fr: 'Pilotage, appui et modernisation de l\'administration douanière',
              ar: 'قيادة ودعم وعصرنة الإدارة الجمركية',
              en: 'Leadership, Support and Modernization of Customs Administration'
            },
            totalCE: 144000000,
            totalCP: 572881747,
            chapters: [
              {
                code: '67_102_01_DGD',
                label: { code: 'CH_DGD', fr: 'DGD - Direction Générale des Douanes', ar: 'المديرية العامة للجمارك', en: 'DGD - General Directorate of Customs' },
                lines: [
                  {
                    code: '67_102_01_DGD_02',
                    label: { code: 'LN_REM_PERSONNEL_DOUANES', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 330071494, climate: 'Neutre'
                  },
                  {
                    code: '67_102_01_DGD_20',
                    label: { code: 'LN_SCANNEURS', fr: 'Acquisition des scanneurs (fixe et portable) et détecteurs portatifs', ar: 'اقتناء الماسحات الضوئية (ثابتة ومحمولة) وأجهزة الكشف المحمولة', en: 'Acquisition of Scanners (Fixed and Portable) and Portable Detectors' },
                    ce: 110000000, cp: 110000000, climate: 'Neutre'
                  },
                  {
                    code: '67_102_01_DGD_21',
                    label: { code: 'LN_VEDETTES_FLUVIALES', fr: 'Acquisition des vedettes fluviales', ar: 'اقتناء الزوارق النهرية', en: 'Acquisition of River Boats' },
                    ce: 7000000, cp: 7000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '102_03',
            label: {
              code: 'ACT_102_03',
              fr: 'Mobilisation des recettes douanières',
              ar: 'تعبئة الموارد الجمركية',
              en: 'Customs Revenue Mobilization'
            },
            totalCE: 140000000,
            totalCP: 42379938,
            chapters: [
              {
                code: '67_102_03_DGD',
                label: { code: 'CH_DGD_RECETTES', fr: 'DGD - Direction Générale des Douanes', ar: 'المديرية العامة للجمارك', en: 'DGD - General Directorate of Customs' },
                lines: [
                  {
                    code: '67_102_03_DGD_17',
                    label: { code: 'LN_CONSTRUCTION_POSTES_DOUANES', fr: 'Construction des locaux pour les postes des Douanes à l\'intérieur du pays', ar: 'بناء مقرات المراكز الجمركية في الداخل', en: 'Construction of Buildings for Customs Posts in the Interior' },
                    ce: 140000000, cp: 40000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '67_103',
        label: {
          code: 'PROG_103',
          fr: 'Fiscalité',
          ar: 'الجباية',
          en: 'Taxation'
        },
        actions: [
          {
            code: '103_01',
            label: {
              code: 'ACT_103_01',
              fr: 'Pilotage, appui et modernisation de l\'administration fiscale',
              ar: 'قيادة ودعم وعصرنة الإدارة الجبائية',
              en: 'Leadership, Support and Modernization of Tax Administration'
            },
            totalCE: 12000000,
            totalCP: 230298774,
            chapters: [
              {
                code: '67_103_01_DGI',
                label: { code: 'CH_DGI', fr: 'Direction Générale des Impôts', ar: 'المديرية العامة للضرائب', en: 'General Directorate of Taxes' },
                lines: [
                  {
                    code: '67_103_01_DGI_03',
                    label: { code: 'LN_REM_PERSONNEL_DGI', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 221526126, climate: 'Neutre'
                  },
                  {
                    code: '67_103_01_DGI_18',
                    label: { code: 'LN_APPUI_REFORME_FISCALE', fr: 'Appui à la réforme fiscale', ar: 'دعم الإصلاح الجبائي', en: 'Tax Reform Support' },
                    ce: 12000000, cp: 6000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '67_104',
        label: {
          code: 'PROG_104',
          fr: 'Trésor et Comptabilité Publique',
          ar: 'الخزينة والمحاسبة العمومية',
          en: 'Treasury and Public Accounting'
        },
        actions: [
          {
            code: '104_01',
            label: {
              code: 'ACT_104_01',
              fr: 'Pilotage, appui et développement de l\'administration du trésor public',
              ar: 'قيادة ودعم وتطوير إدارة الخزينة العمومية',
              en: 'Leadership, Support and Development of Public Treasury Administration'
            },
            totalCE: 0,
            totalCP: 398368306,
            chapters: [
              {
                code: '67_104_01_DGTCP',
                label: { code: 'CH_DGTCP', fr: 'Direction Générale du Trésor et de la Comptabilité Publique', ar: 'المديرية العامة للخزينة والمحاسبة العمومية', en: 'General Directorate of Treasury and Public Accounting' },
                lines: [
                  {
                    code: '67_104_01_DGTCP_02',
                    label: { code: 'LN_REM_PERSONNEL_TRESOR', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 339200333, climate: 'Neutre'
                  },
                  {
                    code: '67_104_01_DGTCP_10',
                    label: { code: 'LN_ADMIN_CENTRALE_DCM', fr: 'Pilotage et gestion administrative de l\'administration centrale et des DCM/PforR', ar: 'قيادة وتسيير الإدارة المركزية والإدارات الجهوية/برنامج دعم الإصلاح', en: 'Central Administration and DCM Management and Administration/PforR' },
                    ce: 0, cp: 45779096, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '104_03',
            label: {
              code: 'ACT_104_03',
              fr: 'Production, fiabilisation des comptes et gestion de la trésorerie',
              ar: 'إنتاج وتوثيق الحسابات وإدارة الخزينة',
              en: 'Production, Reliability of Accounts and Cash Management'
            },
            totalCE: 14000000,
            totalCP: 4000000,
            chapters: [
              {
                code: '67_104_03_DGTCP',
                label: { code: 'CH_DGTCP_PRODUCTION', fr: 'Direction Générale du Trésor et de la Comptabilité Publique', ar: 'المديرية العامة للخزينة والمحاسبة العمومية', en: 'General Directorate of Treasury and Public Accounting' },
                lines: [
                  {
                    code: '67_104_03_DGTCP_12',
                    label: { code: 'LN_PRODUCTION_DONNEES', fr: 'Production des données d\'exécution financière fiables et disponibles/PforR', ar: 'إنتاج معطيات التنفيذ المالي الموثوقة والمتاحة/برنامج دعم الإصلاح', en: 'Production of Reliable and Available Financial Execution Data/PforR' },
                    ce: 14000000, cp: 4000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 73 : MINISTÈRE DE L'INTÉRIEUR
  // ==========================================================
  {
    code: '73',
    label: {
      code: 'MIN_INTERIEUR',
      fr: 'Ministère de l\'Intérieur, de la Promotion de la Décentralisation et du Développement Local',
      ar: 'وزارة الداخلية وترقية اللامركزية والتنمية المحلية',
      en: 'Ministry of Interior, Decentralization Promotion and Local Development'
    },
    programs: [
      {
        code: '73_024',
        label: {
          code: 'PROG_024',
          fr: 'Sécurité Intérieure et Protection Civile',
          ar: 'الأمن الداخلي والحماية المدنية',
          en: 'Internal Security and Civil Protection'
        },
        actions: [
          {
            code: '024_01',
            label: {
              code: 'ACT_024_01',
              fr: 'Sûreté nationale (Police)',
              ar: 'الأمن الوطني (الشرطة)',
              en: 'National Security (Police)'
            },
            totalCE: 893920000,
            totalCP: 2279791273,
            chapters: [
              {
                code: '73_024_01_DGSN',
                label: { code: 'CH_DGSN', fr: 'Direction Générale de la Sûreté Nationale', ar: 'المديرية العامة للأمن الوطني', en: 'General Directorate of National Security' },
                lines: [
                  {
                    code: '73_024_01_DGSN_10',
                    label: { code: 'LN_LUTTE_IMMIGRATION_CLANDESTINE', fr: 'Lutte contre l\'immigration clandestine', ar: 'مكافحة الهجرة السرية', en: 'Fight against Illegal Immigration' },
                    ce: 0, cp: 30000000, climate: 'Neutre'
                  },
                  {
                    code: '73_024_01_DGSN_11',
                    label: { code: 'LN_ALIMENTATION_POLICIERS', fr: 'Alimentation policiers', ar: 'إطعام رجال الشرطة', en: 'Police Officer Food' },
                    ce: 0, cp: 138000000, climate: 'Neutre'
                  },
                  {
                    code: '73_024_01_DGSN_16',
                    label: { code: 'LN_APPUI_DGSN', fr: 'Appui à la DGSN', ar: 'دعم المديرية العامة للأمن الوطني', en: 'DGSN Support' },
                    ce: 893920000, cp: 373920000, climate: 'Neutre'
                  },
                  {
                    code: '73_024_01_DGSN_72',
                    label: { code: 'LN_REM_PERSONNEL_DGSN', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 1326297826, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '024_02',
            label: {
              code: 'ACT_024_02',
              fr: 'Garde Nationale',
              ar: 'الحرس الوطني',
              en: 'National Guard'
            },
            totalCE: 750000000,
            totalCP: 1522289128,
            chapters: [
              {
                code: '73_024_02_GARDE',
                label: { code: 'CH_GARDE_NATIONALE', fr: 'Garde Nationale', ar: 'الحرس الوطني', en: 'National Guard' },
                lines: [
                  {
                    code: '73_024_02_GARDE_04',
                    label: { code: 'LN_SECURISATION_ADMIN', fr: 'Sécurisation de l\'administration', ar: 'تأمين الإدارة', en: 'Administration Security' },
                    ce: 0, cp: 196577094, climate: 'Neutre'
                  },
                  {
                    code: '73_024_02_GARDE_05',
                    label: { code: 'LN_APPUI_GARDE', fr: 'Appui à la garde nationale', ar: 'دعم الحرس الوطني', en: 'National Guard Support' },
                    ce: 750000000, cp: 250000000, climate: 'Neutre'
                  },
                  {
                    code: '73_024_02_GARDE_72',
                    label: { code: 'LN_REM_PERSONNEL_GARDE', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 1075712034, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '024_03',
            label: {
              code: 'ACT_024_03',
              fr: 'Protection Civile',
              ar: 'الحماية المدنية',
              en: 'Civil Protection'
            },
            totalCE: 656000000,
            totalCP: 387812624,
            chapters: [
              {
                code: '73_024_03_DGSEC',
                label: { code: 'CH_DGSEC', fr: 'Délégation Générale à la Sécurité Civile et à la Gestion des Crises', ar: 'المندوبية العامة للأمن المدني وتسيير الأزمات', en: 'General Delegation for Civil Security and Crisis Management' },
                lines: [
                  {
                    code: '73_024_03_DGSEC_02',
                    label: { code: 'LN_REM_PERSONNEL_PC', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 165501508, climate: 'Neutre'
                  },
                  {
                    code: '73_024_03_DGSEC_12',
                    label: { code: 'LN_MATERIEL_SECURITE_CIVILE', fr: 'Acquisition matériel sécurité civile', ar: 'اقتناء عتاد الأمن المدني', en: 'Civil Security Equipment Acquisition' },
                    ce: 656000000, cp: 141000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '73_026',
        label: {
          code: 'PROG_026',
          fr: 'Décentralisation et Développement Local',
          ar: 'اللامركزية والتنمية المحلية',
          en: 'Decentralization and Local Development'
        },
        actions: [
          {
            code: '026_03',
            label: {
              code: 'ACT_026_03',
              fr: 'Coordination de décentralisation',
              ar: 'تنسيق اللامركزية',
              en: 'Decentralization Coordination'
            },
            totalCE: 2352600000,
            totalCP: 1680423565,
            chapters: [
              {
                code: '73_026_03_DGCT',
                label: { code: 'CH_DGCT', fr: 'Direction Générale des Collectivités Territoriales', ar: 'المديرية العامة للجماعات الترابية', en: 'General Directorate of Territorial Collectivities' },
                lines: [
                  {
                    code: '73_026_03_DGCT_09',
                    label: { code: 'LN_FONDS_REGIONAL_DEV', fr: 'Fonds régional de développement', ar: 'الصندوق الجهوي للتنمية', en: 'Regional Development Fund' },
                    ce: 2300000000, cp: 600000000, climate: 'Neutre'
                  },
                  {
                    code: '73_026_03_DGCT_24',
                    label: { code: 'LN_DECHETS_SOLIDES_NKTT', fr: 'Les Déchets Solides de la Ville de Nouakchott', ar: 'النفايات الصلبة لمدينة نواكشوط', en: 'Solid Waste of the City of Nouakchott' },
                    ce: 0, cp: 782789432, climate: 'Neutre'
                  },
                  {
                    code: '73_026_03_DGCT_25',
                    label: { code: 'LN_DECHETS_SOLIDES_COMMUNES', fr: 'Dépenses Relatives aux déchets Solides des Communes', ar: 'نفقات متعلقة بالنفايات الصلبة للبلديات', en: 'Expenses Related to Municipal Solid Waste' },
                    ce: 0, cp: 208577477, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '73_028',
        label: {
          code: 'PROG_028',
          fr: 'Sécurisation des Documents Nationaux',
          ar: 'تأمين الوثائق الوطنية',
          en: 'National Document Security'
        },
        actions: [
          {
            code: '028_01',
            label: {
              code: 'ACT_028_01',
              fr: 'Sécurisation documents',
              ar: 'تأمين الوثائق',
              en: 'Document Security'
            },
            totalCE: 150000000,
            totalCP: 363834419,
            chapters: [
              {
                code: '73_028_01_ANRPTS',
                label: { code: 'CH_ANRPTS', fr: 'Agence Nationale du Registre des Populations et des Titres Sécurisés', ar: 'الوكالة الوطنية لسجل السكان والوثائق المؤمنة', en: 'National Agency for Population Registry and Secure Documents' },
                lines: [
                  {
                    code: '73_028_01_ANRPTS_02',
                    label: { code: 'LN_REM_PERSONNEL_ANRPTS', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 253621128, climate: 'Neutre'
                  },
                  {
                    code: '73_028_01_ANRPTS_08',
                    label: { code: 'LN_APPUI_ANRPTS', fr: 'Appui à l\'ANRPTS', ar: 'دعم الوكالة الوطنية لسجل السكان والوثائق المؤمنة', en: 'ANRPTS Support' },
                    ce: 150000000, cp: 50000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 75 : MINISTÈRE DE L'HABITAT
  // ==========================================================
  {
    code: '75',
    label: {
      code: 'MIN_HABITAT',
      fr: 'Ministère de l\'Habitat, de l\'Urbanisme et de l\'Aménagement du Territoire',
      ar: 'وزارة الإسكان والعمران والاستصلاح الترابي',
      en: 'Ministry of Housing, Urbanism and Territorial Development'
    },
    programs: [
      {
        code: '75_082',
        label: {
          code: 'PROG_082',
          fr: 'Bâtiment et Équipement Publics',
          ar: 'البنايات والتجهيزات العمومية',
          en: 'Public Buildings and Equipment'
        },
        actions: [
          {
            code: '082_02',
            label: {
              code: 'ACT_082_02',
              fr: 'Constructions et réhabilitations',
              ar: 'البناء والتأهيل',
              en: 'Constructions and Rehabilitations'
            },
            totalCE: 19594880000,
            totalCP: 5533443477,
            chapters: [
              {
                code: '75_082_02_DBEP',
                label: { code: 'CH_DBEP', fr: 'Direction des Bâtiments et Équipements Publics', ar: 'مديرية المباني والتجهيزات العمومية', en: 'Public Buildings and Equipment Directorate' },
                lines: [
                  {
                    code: '75_082_02_DBEP_03',
                    label: { code: 'LN_INFRA_JEUNESSE_SPORT', fr: 'Infrastructures jeunesse et sport', ar: 'البنى التحتية للشباب والرياضة', en: 'Youth and Sports Infrastructure' },
                    ce: 400000000, cp: 200000000, climate: 'Neutre'
                  },
                  {
                    code: '75_082_02_DBEP_06',
                    label: { code: 'LN_CONSTRUCTION_BATIMENTS_ADMIN', fr: 'Construction et réhabilitation des bâtiments administratifs', ar: 'بناء وإعادة تأهيل المباني الإدارية', en: 'Construction and Rehabilitation of Administrative Buildings' },
                    ce: 9800000000, cp: 300000000, climate: 'Neutre'
                  },
                  {
                    code: '75_082_02_DBEP_08',
                    label: { code: 'LN_INFRA_ENSEIGNEMENT_SUP', fr: 'Infrastructures enseignement supérieur', ar: 'البنى التحتية للتعليم العالي', en: 'Higher Education Infrastructure' },
                    ce: 300000000, cp: 300000000, climate: 'Neutre'
                  },
                  {
                    code: '75_082_02_DBEP_54',
                    label: { code: 'LN_PUM_NKTT_SANTE', fr: 'Programme d\'urgence 2 pour la modernisation de la ville de Nouakchott/Composante Santé', ar: 'البرنامج الاستعجالي 2 لتحديث مدينة نواكشوط/مكون الصحة', en: 'Emergency Program 2 for the Modernization of Nouakchott/Health Component' },
                    ce: 500000000, cp: 300000000, climate: 'Neutre'
                  },
                  {
                    code: '75_082_02_DBEP_55',
                    label: { code: 'LN_PUM_NKTT_EDUCATION', fr: 'Programme d\'urgence 2 pour la modernisation de la ville de Nouakchott/Composante Éducation', ar: 'البرنامج الاستعجالي 2 لتحديث مدينة نواكشوط/مكون التعليم', en: 'Emergency Program 2 for the Modernization of Nouakchott/Education Component' },
                    ce: 400000000, cp: 200000000, climate: 'Neutre'
                  },
                  {
                    code: '75_082_02_DBEP_56',
                    label: { code: 'LN_PNAGSB_EDUCATION', fr: 'Programme National d\'Accès Généralisé aux Services de Base/Composante Éducation', ar: 'البرنامج الوطني للوصول الشامل للخدمات الأساسية/مكون التعليم', en: 'National Program for Generalized Access to Basic Services/Education Component' },
                    ce: 3456000000, cp: 1728000000, climate: 'Neutre'
                  },
                  {
                    code: '75_082_02_DBEP_57',
                    label: { code: 'LN_PUM_NKTT_SANTE_1', fr: 'Programme d\'urgence pour la modernisation de la ville de Nouakchott/Composante Santé', ar: 'البرنامج الاستعجالي لتحديث مدينة نواكشوط/مكون الصحة', en: 'Emergency Program for the Modernization of Nouakchott/Health Component' },
                    ce: 589680000, cp: 309680000, climate: 'Neutre'
                  },
                  {
                    code: '75_082_02_DBEP_58',
                    label: { code: 'LN_PNAGSB_SANTE', fr: 'Programme National d\'Accès Généralisé aux Services de Base/Composante Santé', ar: 'البرنامج الوطني للوصول الشامل للخدمات الأساسية/مكون الصحة', en: 'National Program for Generalized Access to Basic Services/Health Component' },
                    ce: 3859200000, cp: 1929600000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 76 : MINISTÈRE DE L'HYDRAULIQUE ET DE 
  //           L'ASSAINISSEMENT
  // ==========================================================
  {
    code: '76',
    label: {
      code: 'MIN_HYDRAULIQUE',
      fr: 'Ministère de l\'Hydraulique et de l\'Assainissement',
      ar: 'وزارة المياه والصرف الصحي',
      en: 'Ministry of Hydraulics and Sanitation'
    },
    programs: [
      {
        code: '76_088',
        label: {
          code: 'PROG_088',
          fr: 'Amélioration de l\'Accès à l\'Eau',
          ar: 'تحسين الوصول إلى الماء',
          en: 'Improvement of Access to Water'
        },
        description: {
          code: 'PROG_088_DESC',
          fr: 'Reconnaissance, suivi, protection des ressources en eau et réalisation des ouvrages de production, transport et distribution d\'eau potable',
          ar: 'استكشاف ومتابعة وحماية الموارد المائية وإنجاز منشآت إنتاج ونقل وتوزيع المياه الصالحة للشرب',
          en: 'Survey, monitoring, protection of water resources and construction of drinking water production, transport and distribution facilities'
        },
        actions: [
          {
            code: '088_01',
            label: {
              code: 'ACT_088_01',
              fr: 'Reconnaissance, suivi, protection et bonne exploitation des ressources en eau',
              ar: 'استكشاف ومتابعة وحماية وحسن استغلال الموارد المائية',
              en: 'Survey, Monitoring, Protection and Proper Exploitation of Water Resources'
            },
            totalCE: 113000000,
            totalCP: 138415647,
            chapters: [
              {
                code: '76_088_01_CNRE',
                label: { code: 'CH_CNRE', fr: 'CNRE - Centre National des Ressources en Eau', ar: 'المركز الوطني للموارد المائية', en: 'CNRE - National Center for Water Resources' },
                lines: [
                  {
                    code: '76_088_01_CNRE_08',
                    label: { code: 'LN_ETUDE_AQUIFERE_AOUKAR', fr: 'Étude hydrogéologique du système aquifère de l\'Aoukar', ar: 'دراسة هيدروجيولوجية للنظام المائي الجوفي لأوكار', en: 'Hydrogeological Study of the Aoukar Aquifer System' },
                    ce: 12000000, cp: 12000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_01_CNRE_10',
                    label: { code: 'LN_ETUDES_IMPLANTATION_GEOPHYSIQUES', fr: 'Études d\'implantation géophysiques et hydrogéologiques et contrôle des Forages', ar: 'دراسات التموقع الجيوفيزيائية والهيدروجيولوجية ومراقبة الآبار', en: 'Geophysical and Hydrogeological Site Studies and Drilling Control' },
                    ce: 6000000, cp: 6000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_01_CNRE_11',
                    label: { code: 'LN_RESEAU_PIEZOMETRIQUE', fr: 'Réalisation d\'un réseau piézométrique national de suivi des nappes phase 1', ar: 'إنجاز شبكة بيزومترية وطنية لمتابعة الفرشات المائية المرحلة 1', en: 'Implementation of a National Piezometric Network for Aquifer Monitoring Phase 1' },
                    ce: 32000000, cp: 32000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_01_CNRE_23',
                    label: { code: 'LN_SECURISATION_NAPPE_DHAR', fr: 'Sécurisation de l\'exploitation des eaux souterraines de la Nappe du Dhar', ar: 'تأمين استغلال المياه الجوفية لفرشة الظهر', en: 'Securing the Exploitation of the Dhar Aquifer Groundwater' },
                    ce: 19000000, cp: 19000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_01_CNRE_26',
                    label: { code: 'LN_SUIVI_EAUX_SURFACE', fr: 'Suivi des eaux de surface', ar: 'متابعة المياه السطحية', en: 'Surface Water Monitoring' },
                    ce: 4000000, cp: 4000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_01_CNRE_27',
                    label: { code: 'LN_GESTION_INTEGREE_EAU', fr: 'Mise en place d\'une gestion intégrée des ressources en eau', ar: 'وضع إدارة متكاملة للموارد المائية', en: 'Implementation of Integrated Water Resources Management' },
                    ce: 1000000, cp: 1000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          },
          {
            code: '088_02',
            label: {
              code: 'ACT_088_02',
              fr: 'Réalisation, renforcement et sécurisation des ouvrages de production, de transport et distribution d\'eau potable',
              ar: 'إنجاز وتعزيز وتأمين منشآت إنتاج ونقل وتوزيع المياه الصالحة للشرب',
              en: 'Construction, Reinforcement and Securing of Drinking Water Production, Transport and Distribution Facilities'
            },
            totalCE: 24997038269,
            totalCP: 4539306847,
            chapters: [
              {
                code: '76_088_02_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '76_088_02_CAB_02',
                    label: { code: 'LN_AEP_IDINI', fr: 'Sécurisation et renforcement AEP Nouakchott à partir de la nappe d\'Idini', ar: 'تأمين وتعزيز تزويد نواكشوط بالماء الصالح للشرب انطلاقا من حوض إديني', en: 'Securing and Reinforcing the Nouakchott Water Supply from the Idini Aquifer' },
                    ce: 2233010680, cp: 496308547,
                    climate: 'Adaptation', donor: 'FADES', financeType: 'loan'
                  },
                  {
                    code: '76_088_02_CAB_14',
                    label: { code: 'LN_RENFORCEMENT_AEP_NDB_BOULANOUAR', fr: 'Projet de Renforcement du Système d\'Alimentation en Eau Potable de la ville de Nouadhibou à partir de Boulanouar', ar: 'مشروع تعزيز نظام تزويد مدينة نواذيبو بالماء الصالح للشرب من بولنوار', en: 'Reinforcement Project of the Nouadhibou Drinking Water Supply System from Boulanouar' },
                    ce: 69000000, cp: 69000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_02_CAB_35',
                    label: { code: 'LN_PROJET_SECTORIEL_EAU_ASSAINISSEMENT', fr: 'Projet Sectoriel Eau et Assainissement', ar: 'مشروع قطاعي للماء والصرف الصحي', en: 'Sectoral Water and Sanitation Project' },
                    ce: 545322463, cp: 277000000,
                    climate: 'Adaptation', donor: 'BM-IDA', financeType: 'grant'
                  },
                  {
                    code: '76_088_02_CAB_52',
                    label: { code: 'LN_STATION_PRETRAITEMENT_BENI_NAGI', fr: 'Construction d\'une station de pré-traitement (débourbeur) à Béni Nagi', ar: 'بناء محطة معالجة أولية (مصفق) في بني ناجي', en: 'Construction of a Pre-treatment Station (Desilter) at Béni Nagi' },
                    ce: 125922986, cp: 125922986, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_02_CAB_59',
                    label: { code: 'LN_AEP_KIFFA_FLEUVE_SENEGAL', fr: 'Projet AEP de la Ville de Kiffa à partir du Fleuve du Sénégal', ar: 'مشروع تزويد مدينة كيفة بالماء الصالح للشرب من نهر السنغال', en: 'Kiffa Water Supply Project from the Senegal River' },
                    ce: 9891540927, cp: 754000000,
                    climate: 'Adaptation',
                    donor: 'F. ABOU DHABI', financeType: 'mixed'
                  },
                  {
                    code: '76_088_02_CAB_70',
                    label: { code: 'LN_EXTENSION_AFTOUT_ESSAHLI_II', fr: 'Projet d\'Extension d\'adduction d\'eau d\'Aftout Essahli (Phase II)', ar: 'مشروع توسيع جر مياه أفتوت الساحلي (المرحلة الثانية)', en: 'Aftout Essahli Water Supply Extension Project (Phase II)' },
                    ce: 1720000000, cp: 52000000,
                    climate: 'Adaptation', donor: 'France-C2D', financeType: 'loan'
                  },
                  {
                    code: '76_088_02_CAB_72',
                    label: { code: 'LN_RENFORCEMENT_SECURISATION_DHAR', fr: 'Travaux de renforcement et sécurisation énergétique du système de pompage de l\'axe nord du complexe DHAR', ar: 'أشغال تعزيز وتأمين الطاقة لنظام الضخ للمحور الشمالي لمركب الظهر', en: 'Reinforcement and Energy Security Works for the Pumping System of the Northern Axis of the DHAR Complex' },
                    ce: 300000000, cp: 300000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_02_CAB_77',
                    label: { code: 'LN_RESILIENCE_RURALE_EAU', fr: 'Projet de renforcement de la résilience rurale de Mauritanie par la gestion et le développement des ressources en eau', ar: 'مشروع تعزيز الصمود الريفي في موريتانيا عبر إدارة وتطوير الموارد المائية', en: 'Rural Resilience Reinforcement Project in Mauritania through Water Resource Management and Development' },
                    ce: 640289200, cp: 61600000,
                    climate: 'Adaptation', donor: 'BAD-FAD', financeType: 'loan'
                  },
                  {
                    code: '76_088_02_CAB_79',
                    label: { code: 'LN_PROGRAMME_SAOUDIEN_FORAGES', fr: 'Programme Saoudien de réalisation des forages et de développement rural en Afrique - Phase V', ar: 'البرنامج السعودي لحفر الآبار والتنمية الريفية في إفريقيا - المرحلة الخامسة', en: 'Saudi Program for Drilling and Rural Development in Africa - Phase V' },
                    ce: 225000000, cp: 75000000,
                    climate: 'Adaptation', donor: 'FSD', financeType: 'grant'
                  }
                ]
              },
              {
                code: '76_088_02_DH',
                label: { code: 'CH_DH', fr: 'Direction de l\'Hydraulique', ar: 'مديرية المياه', en: 'Hydraulics Directorate' },
                lines: [
                  {
                    code: '76_088_02_DH_01',
                    label: { code: 'LN_EAU_ASSAINISSEMENT_G5_SAHEL', fr: 'Projet d\'accès à l\'eau et à l\'assainissement dans les deux Hodhs (G5 Sahel)', ar: 'مشروع الوصول إلى الماء والصرف الصحي في الحوضين (G5 الساحل)', en: 'Water and Sanitation Access Project in the Two Hodhs (G5 Sahel)' },
                    ce: 394762995, cp: 83000000,
                    climate: 'Adaptation', donor: 'FRANCE-AFD', financeType: 'grant'
                  },
                  {
                    code: '76_088_02_DH_02',
                    label: { code: 'LN_CREATION_POINTS_EAU', fr: 'Création et équipement des points d\'eau', ar: 'إنشاء وتجهيز نقاط المياه', en: 'Creation and Equipping of Water Points' },
                    ce: 3117000000, cp: 117000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_02_DH_06',
                    label: { code: 'LN_REALISATION_AEP', fr: 'Réalisation et renforcement des AEP', ar: 'إنجاز وتعزيز التزويد بالماء الصالح للشرب', en: 'Realization and Reinforcement of Water Supply Systems' },
                    ce: 1810000000, cp: 110000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_02_DH_19',
                    label: { code: 'LN_PROJET_2HAT', fr: 'Projet d\'accès à l\'eau et à l\'assainissement dans les deux Hodhs, l\'Adrar et le Tagant (2HAT)', ar: 'مشروع الوصول إلى الماء والصرف الصحي في الحوضين وآدرار وتكانت', en: 'Water and Sanitation Access Project in the Two Hodhs, Adrar and Tagant (2HAT)' },
                    ce: 452195099, cp: 181531264,
                    climate: 'Adaptation', donor: 'FRANCE-AFD', financeType: 'grant'
                  },
                  {
                    code: '76_088_02_DH_20',
                    label: { code: 'LN_PNAGSB_EAU', fr: 'Programme National d\'Accès Généralisé aux Services de Base pour le développement local', ar: 'البرنامج الوطني للوصول الشامل للخدمات الأساسية للتنمية المحلية', en: 'National Program for Generalized Access to Basic Services for Local Development' },
                    ce: 828600000, cp: 207000000, climate: 'Adaptation'
                  }
                ]
              },
              {
                code: '76_088_02_SNDE',
                label: { code: 'CH_SNDE', fr: 'SNDE', ar: 'الشركة الوطنية للماء', en: 'SNDE' },
                lines: [
                  {
                    code: '76_088_02_SNDE_33',
                    label: { code: 'LN_RENFORCEMENT_CAPACITES_PRODUCTION', fr: 'Programme de renforcement et d\'extension des capacités de production, des réseaux de transport et de distribution dans les centres urbains de l\'intérieur (Phase 2)', ar: 'برنامج تعزيز وتوسيع قدرات الإنتاج وشبكات النقل والتوزيع في المراكز الحضرية الداخلية (المرحلة 2)', en: 'Program for Reinforcement and Extension of Production Capacities, Transport and Distribution Networks in Interior Urban Centers (Phase 2)' },
                    ce: 840000000, cp: 350000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_02_SNDE_34',
                    label: { code: 'LN_MODERNISATION_RESEAUX_NKTT_NDB', fr: 'Programme de modernisation et d\'optimisation des réseaux de distribution de Nouakchott et Nouadhibou', ar: 'برنامج عصرنة وتحسين شبكات التوزيع في نواكشوط ونواذيبو', en: 'Program for Modernization and Optimization of Distribution Networks in Nouakchott and Nouadhibou' },
                    ce: 100000000, cp: 50000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_02_SNDE_35',
                    label: { code: 'LN_MAINTENANCE_POLES_PRODUCTION', fr: 'Programme de maintenance et de remise à niveau des pôles de production (hydraulique et énergétique)', ar: 'برنامج صيانة وإعادة تأهيل أقطاب الإنتاج (المائي والطاقوي)', en: 'Program for Maintenance and Upgrading of Production Poles (Hydraulic and Energy)' },
                    ce: 400000000, cp: 280000000, climate: 'Adaptation'
                  }
                ]
              },
              {
                code: '76_088_02_SONAFOR',
                label: { code: 'CH_SONAFOR', fr: 'Société Nationale des Forages et Puits', ar: 'الشركة الوطنية للحفر والآبار', en: 'National Drilling and Wells Company' },
                lines: [
                  {
                    code: '76_088_02_SONAFOR_56',
                    label: { code: 'LN_CONTRAT_PROGRAMME_FORAGES', fr: 'Contrat programme (travaux de forages)', ar: 'عقد برنامج (أشغال الحفر)', en: 'Program Contract (Drilling Works)' },
                    ce: 186000000, cp: 186000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_02_SONAFOR_57',
                    label: { code: 'LN_ACQUISITION_ATELIERS_FORAGE', fr: 'Acquisition de 2 ateliers de forage', ar: 'اقتناء ورشتي حفر', en: 'Acquisition of 2 Drilling Rigs' },
                    ce: 300000000, cp: 100000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_02_SONAFOR_60',
                    label: { code: 'LN_RENFORCEMENT_EQUIPEMENTS_FORATION', fr: 'Renforcement des équipements de foration', ar: 'تعزيز معدات الحفر', en: 'Reinforcement of Drilling Equipment' },
                    ce: 40000000, cp: 40000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          },
          {
            code: '088_03',
            label: {
              code: 'ACT_088_03',
              fr: 'Mobilisation des eaux de surface',
              ar: 'تعبئة المياه السطحية',
              en: 'Surface Water Mobilization'
            },
            totalCE: 8248906747,
            totalCP: 1512741667,
            chapters: [
              {
                code: '76_088_03_DHB',
                label: { code: 'CH_DHB', fr: 'Direction de l\'Hydrologie et des Barrages', ar: 'مديرية الهيدرولوجيا والسدود', en: 'Hydrology and Dams Directorate' },
                lines: [
                  {
                    code: '76_088_03_DHB_01',
                    label: { code: 'LN_CONSTRUCTION_3_BARRAGES', fr: 'Construction de 3 barrages (Aghmamin, Levtah et Barbara)', ar: 'بناء 3 سدود (أغمامين، لفتاح وبربارة)', en: 'Construction of 3 Dams (Aghmamin, Levtah and Barbara)' },
                    ce: 27000000, cp: 27000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_03_DHB_02',
                    label: { code: 'LN_PIME', fr: 'Projet intégré de mobilisation de l\'eau (PIME)', ar: 'المشروع المندمج لتعبئة المياه', en: 'Integrated Water Mobilization Project (PIME)' },
                    ce: 1463000000, cp: 185000000,
                    climate: 'Adaptation', donor: 'FRANCE-AFD', financeType: 'mixed'
                  },
                  {
                    code: '76_088_03_DHB_04',
                    label: { code: 'LN_PIVRE', fr: 'Projet Intégré de Valorisation des Ressources en Eau dans les deux Hodhs (PIVRE)', ar: 'المشروع المندمج لتثمين الموارد المائية في الحوضين', en: 'Integrated Water Resource Valorization Project in the Two Hodhs (PIVRE)' },
                    ce: 375081747, cp: 117066667,
                    climate: 'Adaptation', donor: 'FRANCE-AFD', financeType: 'grant'
                  },
                  {
                    code: '76_088_03_DHB_07',
                    label: { code: 'LN_CONSTRUCTION_5_BARRAGES', fr: 'Construction de 5 barrages', ar: 'بناء 5 سدود', en: 'Construction of 5 Dams' },
                    ce: 40000000, cp: 40000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_03_DHB_13',
                    label: { code: 'LN_DESSALEMENT_PORT_NDIAGO', fr: 'Construction et Mise en service de 2 unités de dessalement d\'eau de mer pour le Port de N\'DIAGO', ar: 'بناء وتشغيل وحدتي تحلية مياه البحر لميناء انجاكو', en: 'Construction and Commissioning of 2 Seawater Desalination Units for the Port of N\'DIAGO' },
                    ce: 60000000, cp: 60000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_03_DHB_44',
                    label: { code: 'LN_AEP_AFTOUT_ECHARGHI', fr: 'AEP de la zone rurale de l\'Aftout Echarghi', ar: 'تزويد المنطقة الريفية لأفتوت الشرقي بالماء الصالح للشرب', en: 'Rural Water Supply of Aftout Echarghi' },
                    ce: 18800000, cp: 18800000, climate: 'Adaptation'
                  },
                  {
                    code: '76_088_03_DHB_45',
                    label: { code: 'LN_AEP_165_LOCALITES_BISEAU_SEC', fr: 'Projet d\'Alimentation en Eau Potable de 165 localités situées dans le biseau sec à partir du fleuve Sénégal', ar: 'مشروع تزويد 165 قرية واقعة في المنطقة الجافة بالماء الصالح للشرب من نهر السنغال', en: 'Drinking Water Supply Project for 165 Localities in the Dry Wedge from the Senegal River' },
                    ce: 6100250000, cp: 898100000,
                    climate: 'Adaptation', donor: 'F. ABOU DHABI', financeType: 'grant'
                  },
                  {
                    code: '76_088_03_DHB_51',
                    label: { code: 'LN_REHABILITATION_5_BARRAGES', fr: 'Réhabilitation et construction de cinq barrages dans les Wilayas de deux Hodhs et l\'Inchiri', ar: 'إعادة تأهيل وبناء خمسة سدود في ولايتي الحوضين وإينشيري', en: 'Rehabilitation and Construction of Five Dams in the Wilayas of the Two Hodhs and Inchiri' },
                    ce: 75775000, cp: 75775000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '76_089',
        label: {
          code: 'PROG_089',
          fr: 'Amélioration de l\'Accès à l\'Assainissement',
          ar: 'تحسين الوصول إلى الصرف الصحي',
          en: 'Improvement of Access to Sanitation'
        },
        actions: [
          {
            code: '089_01',
            label: {
              code: 'ACT_089_01',
              fr: 'Assainissement en milieu rural',
              ar: 'الصرف الصحي في الوسط الريفي',
              en: 'Rural Sanitation'
            },
            totalCE: 4661416579,
            totalCP: 663916579,
            chapters: [
              {
                code: '76_089_01_DA',
                label: { code: 'CH_DA', fr: 'Direction de l\'Assainissement', ar: 'مديرية الصرف الصحي', en: 'Sanitation Directorate' },
                lines: [
                  {
                    code: '76_089_01_DA_60',
                    label: { code: 'LN_ASSAINISSEMENT_NKTT', fr: 'Projet d\'assainissement de la ville de Nouakchott', ar: 'مشروع الصرف الصحي لمدينة نواكشوط', en: 'Nouakchott City Sanitation Project' },
                    ce: 4600000000, cp: 600000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          },
          {
            code: '089_02',
            label: {
              code: 'ACT_089_02',
              fr: 'Assainissement dans le milieu urbain',
              ar: 'الصرف الصحي في الوسط الحضري',
              en: 'Urban Sanitation'
            },
            totalCE: 632400000,
            totalCP: 478178000,
            chapters: [
              {
                code: '76_089_02_ONA',
                label: { code: 'CH_ONA', fr: 'ONA - Office National de l\'Assainissement', ar: 'المكتب الوطني للصرف الصحي', en: 'ONA - National Sanitation Office' },
                lines: [
                  {
                    code: '76_089_02_ONA_61',
                    label: { code: 'LN_CURAGE_NETTOYAGE_NKTT', fr: 'Projet de curage et nettoyage des réseaux d\'assainissement des eaux usées et pluviales de Nouakchott', ar: 'مشروع تطهير وتنظيف شبكات الصرف الصحي للمياه العادمة ومياه الأمطار في نواكشوط', en: 'Cleaning and Desilting Project of Wastewater and Stormwater Sanitation Networks in Nouakchott' },
                    ce: 40000000, cp: 40000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_089_02_ONA_63',
                    label: { code: 'LN_CURAGE_NETTOYAGE_VILLES_INTERIEUR', fr: 'Projet de curage et de nettoyage des réseaux d\'assainissement des eaux pluviales de Rosso, Kaédi, Aleg, Akjoujt, Atar et Bassiknou', ar: 'مشروع تطهير وتنظيف شبكات تصريف مياه الأمطار في روصو وكيهيدي وألاك وأكجوجت وأطار وباسكنو', en: 'Cleaning and Desilting Project of Stormwater Sanitation Networks in Rosso, Kaédi, Aleg, Akjoujt, Atar and Bassiknou' },
                    ce: 40000000, cp: 40000000, climate: 'Adaptation'
                  },
                  {
                    code: '76_089_02_ONA_68',
                    label: { code: 'LN_EXTENSION_ASSAINISSEMENT_NKTT', fr: 'Programme prioritaire de développement de la ville de Nouakchott - Travaux d\'extension du réseau d\'assainissement des eaux pluviales', ar: 'البرنامج ذو الأولوية لتطوير مدينة نواكشوط - أشغال توسيع شبكة تصريف مياه الأمطار', en: 'Priority Program for Nouakchott City Development - Stormwater Sanitation Network Extension Works' },
                    ce: 501400000, cp: 300000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 78 : MINISTÈRE DE L'ENVIRONNEMENT ET 
  //           DÉVELOPPEMENT DURABLE
  // ==========================================================
  {
    code: '78',
    label: {
      code: 'MIN_ENVIRONNEMENT',
      fr: 'Ministère de l\'Environnement et Développement Durable',
      ar: 'وزارة البيئة والتنمية المستدامة',
      en: 'Ministry of Environment and Sustainable Development'
    },
    programs: [
      {
        code: '78_099',
        label: {
          code: 'PROG_099',
          fr: 'Gestion des Pollutions et Restauration des Écosystèmes Dégradés et Biodiversité',
          ar: 'إدارة التلوث واستعادة النظم البيئية المتدهورة والتنوع البيولوجي',
          en: 'Pollution Management and Restoration of Degraded Ecosystems and Biodiversity'
        },
        actions: [
          {
            code: '099_02',
            label: {
              code: 'ACT_099_02',
              fr: 'Préservation et restauration des ressources forestières et des écosystèmes dégradés',
              ar: 'حفظ واستعادة الموارد الغابوية والنظم البيئية المتدهورة',
              en: 'Preservation and Restoration of Forest Resources and Degraded Ecosystems'
            },
            totalCE: 83700000,
            totalCP: 97181500,
            chapters: [
              {
                code: '78_099_02_DPRS',
                label: { code: 'CH_DPRS', fr: 'Direction de la Protection et de la Restauration des Sols', ar: 'مديرية حماية واستعادة التربة', en: 'Soil Protection and Restoration Directorate' },
                lines: [
                  {
                    code: '78_099_02_DPRS_08',
                    label: { code: 'LN_REHABILITATION_TERRES_DUNES', fr: 'Réhabilitation des terres dégradées par la fixation des dunes et la conservation des sols', ar: 'إعادة تأهيل الأراضي المتدهورة عبر تثبيت الكثبان والمحافظة على التربة', en: 'Rehabilitation of Degraded Lands through Dune Fixation and Soil Conservation' },
                    ce: 9200000, cp: 10912375, climate: 'Adaptation'
                  },
                  {
                    code: '78_099_02_DPRS_12',
                    label: { code: 'LN_LUTTE_DEFORESTATION', fr: 'Programme national de lutte contre la déforestation', ar: 'البرنامج الوطني لمكافحة إزالة الغابات', en: 'National Program to Fight Deforestation' },
                    ce: 14500000, cp: 5142500, climate: 'Atténuation'
                  },
                  {
                    code: '78_099_02_DPRS_16',
                    label: { code: 'LN_RESTAURATION_ZONES_HUMIDES', fr: 'Restaurer les zones humides stratégiques', ar: 'استعادة المناطق الرطبة الاستراتيجية', en: 'Restore Strategic Wetlands' },
                    ce: 60000000, cp: 21423080, climate: 'Adaptation'
                  }
                ]
              }
            ]
          },
          {
            code: '099_04',
            label: {
              code: 'ACT_099_04',
              fr: 'Initiative Grande Muraille Verte (IGMV)',
              ar: 'مبادرة السور الأخضر الكبير',
              en: 'Great Green Wall Initiative (GGWI)'
            },
            totalCE: 529000000,
            totalCP: 195532741,
            chapters: [
              {
                code: '78_099_04_ANGMV',
                label: { code: 'CH_ANGMV', fr: 'Agence Nationale de la Grande Muraille Verte', ar: 'الوكالة الوطنية للسور الأخضر الكبير', en: 'National Agency for the Great Green Wall' },
                lines: [
                  {
                    code: '78_099_04_ANGMV_11',
                    label: { code: 'LN_CAMPAGNE_REBOISEMENT', fr: 'Campagne de reboisement et ensemencement direct', ar: 'حملة التشجير والبذر المباشر', en: 'Reforestation and Direct Seeding Campaign' },
                    ce: 42000000, cp: 6000000, climate: 'Atténuation'
                  },
                  {
                    code: '78_099_04_ANGMV_17',
                    label: { code: 'LN_APPUI_ADMIN_GMV', fr: 'Appui à l\'administration', ar: 'دعم الإدارة', en: 'Administration Support' },
                    ce: 0, cp: 9102773, climate: 'Neutre'
                  },
                  {
                    code: '78_099_04_ANGMV_18',
                    label: { code: 'LN_RESTAURATION_TERRES_AGROSYLVOPASTORALES', fr: 'Restauration des terres agrosylvopastorales dégradées', ar: 'استعادة الأراضي الزراعية الرعوية الغابوية المتدهورة', en: 'Restoration of Degraded Agrosylvopastoral Lands' },
                    ce: 45000000, cp: 15000000, climate: 'Adaptation'
                  },
                  {
                    code: '78_099_04_ANGMV_22',
                    label: { code: 'LN_FORAGES_PEPINIERES_FORESTIERES', fr: 'Réalisation et équipements des forages / points d\'eau pour les pépinières forestières collectives', ar: 'إنجاز وتجهيز الآبار/نقاط المياه للمشاتل الغابوية الجماعية', en: 'Drilling and Equipment of Boreholes/Water Points for Collective Forest Nurseries' },
                    ce: 120000000, cp: 30000000, climate: 'Adaptation'
                  },
                  {
                    code: '78_099_04_ANGMV_30',
                    label: { code: 'LN_PROJET_APPUI_GMV_AFD', fr: 'Projet d\'appui à la GMV/AFD', ar: 'مشروع دعم السور الأخضر الكبير/الوكالة الفرنسية للتنمية', en: 'GGW Support Project/AFD' },
                    ce: 322000000, cp: 108000000,
                    climate: 'Adaptation', donor: 'FRANCE-AFD', financeType: 'grant'
                  }
                ]
              }
            ]
          },
          {
            code: '099_05',
            label: {
              code: 'ACT_099_05',
              fr: 'Mise en œuvre du plan de gestion du Parc National d\'Awleigatt',
              ar: 'تنفيذ مخطط تسيير منتزه أوليكات الوطني',
              en: 'Implementation of the Awleigatt National Park Management Plan'
            },
            totalCE: 147000000,
            totalCP: 89455315,
            chapters: [
              {
                code: '78_099_05_PNA',
                label: { code: 'CH_PNA', fr: 'Parc National d\'Awleigatt', ar: 'منتزه أوليكات الوطني', en: 'Awleigatt National Park' },
                lines: [
                  {
                    code: '78_099_05_PNA_08',
                    label: { code: 'LN_INFRA_EQUIPEMENTS_PNA', fr: 'Infrastructures et équipements du PNA', ar: 'البنى التحتية والتجهيزات لمنتزه أوليكات الوطني', en: 'PNA Infrastructure and Equipment' },
                    ce: 147000000, cp: 47000000, climate: 'Adaptation'
                  }
                ]
              }
            ]
          },
          {
            code: '099_07',
            label: {
              code: 'ACT_099_07',
              fr: 'Gestion et renforcement du cordon dunaire du littoral',
              ar: 'إدارة وتعزيز الحزام الرملي الساحلي',
              en: 'Management and Reinforcement of the Coastal Dune Belt'
            },
            totalCE: 72112374,
            totalCP: 47725048,
            chapters: [
              {
                code: '78_099_07_WACA',
                label: { code: 'CH_WACA', fr: 'Projet d\'Investissement de Résilience des Zones Côtières en Afrique de l\'Ouest', ar: 'مشروع استثمار صمود المناطق الساحلية في غرب إفريقيا', en: 'West Africa Coastal Areas Resilience Investment Project' },
                lines: [
                  {
                    code: '78_099_07_WACA_22',
                    label: { code: 'LN_RESILIENCE_ZONES_COTIERES', fr: 'Projet d\'investissement de résilience des zones côtières en Afrique de l\'Ouest', ar: 'مشروع استثمار صمود المناطق الساحلية في غرب إفريقيا', en: 'West Africa Coastal Areas Resilience Investment Project' },
                    ce: 72112374, cp: 47725048,
                    climate: 'Adaptation', donor: 'BM-IDA', financeType: 'grant'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 82 : MINISTÈRE DU PÉTROLE ET DE L'ÉNERGIE
  // ==========================================================
  {
    code: '82',
    label: {
      code: 'MIN_PETROLE_ENERGIE',
      fr: 'Ministère du Pétrole et de l\'Énergie',
      ar: 'وزارة البترول والطاقة',
      en: 'Ministry of Petroleum and Energy'
    },
    programs: [
      {
        code: '82_054',
        label: {
          code: 'PROG_054',
          fr: 'Support',
          ar: 'الدعم',
          en: 'Support'
        },
        actions: [
          {
            code: '054_01',
            label: {
              code: 'ACT_054_01',
              fr: 'Pilotage et Stratégie ministérielle',
              ar: 'القيادة والاستراتيجية القطاعية',
              en: 'Ministry Leadership and Strategy'
            },
            totalCE: 27000000,
            totalCP: 594794601,
            chapters: [
              {
                code: '82_054_01_CAB',
                label: { code: 'CH_CABINET', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '82_054_01_CAB_03',
                    label: { code: 'LN_COORDINATION_ADMIN', fr: 'Coordination administrative', ar: 'التنسيق الإداري', en: 'Administrative Coordination' },
                    ce: 0, cp: 116345856, climate: 'Neutre'
                  },
                  {
                    code: '82_054_01_CAB_15',
                    label: { code: 'LN_REM_PERSONNEL', fr: 'Rémunération du personnel', ar: 'أجور الموظفين', en: 'Personnel Remuneration' },
                    ce: 0, cp: 26611258, climate: 'Neutre'
                  },
                  {
                    code: '82_054_01_CAB_29',
                    label: { code: 'LN_TELECOM_CONTRIBUTIONS', fr: 'Charges télécom et contributions aux organismes internationales', ar: 'أعباء الاتصالات والمساهمات في المنظمات الدولية', en: 'Telecom Charges and International Organization Contributions' },
                    ce: 0, cp: 155012503, climate: 'Neutre'
                  },
                  {
                    code: '82_054_01_CAB_39',
                    label: { code: 'LN_SUBVENTION_SOMELEC', fr: 'Subvention d\'équilibre SOMELEC', ar: 'إعانة التوازن لصوملك', en: 'SOMELEC Balance Subsidy' },
                    ce: 0, cp: 270000000, climate: 'Neutre'
                  },
                  {
                    code: '82_054_01_CAB_53',
                    label: { code: 'LN_RENFORCEMENT_CAPACITES_MPE', fr: 'Renforcement des capacités du MPE', ar: 'تعزيز قدرات وزارة البترول والطاقة', en: 'MPE Capacity Building' },
                    ce: 22000000, cp: 2000000, climate: 'Neutre'
                  },
                  {
                    code: '82_054_01_CAB_57',
                    label: { code: 'LN_REHABILITATION_BATIMENT_MPE', fr: 'Réhabilitation du bâtiment du Ministère du Pétrole et de l\'Énergie', ar: 'إعادة تأهيل مبنى وزارة البترول والطاقة', en: 'Ministry of Petroleum and Energy Building Rehabilitation' },
                    ce: 5000000, cp: 5000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '054_03',
            label: {
              code: 'ACT_054_03',
              fr: 'Coordination administrative',
              ar: 'التنسيق الإداري',
              en: 'Administrative Coordination'
            },
            totalCE: 0,
            totalCP: 109706801,
            chapters: []
          }
        ]
      },
      {
        code: '82_055',
        label: {
          code: 'PROG_055',
          fr: 'Pétrole',
          ar: 'البترول',
          en: 'Petroleum'
        },
        actions: [
          {
            code: '055_02',
            label: {
              code: 'ACT_055_02',
              fr: 'Régulation du marché des produits pétroliers',
              ar: 'تنظيم سوق المنتجات البترولية',
              en: 'Petroleum Products Market Regulation'
            },
            totalCE: 0,
            totalCP: 2930107019,
            chapters: [
              {
                code: '82_055_02_CAB',
                label: { code: 'CH_CABINET_REGULATION', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '82_055_02_CAB_09',
                    label: { code: 'LN_REGULATION_PRODUITS_PETROLIERS', fr: 'Régulation des produits pétroliers', ar: 'تنظيم المنتجات البترولية', en: 'Petroleum Products Regulation' },
                    ce: 0, cp: 2930107019, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '82_056',
        label: {
          code: 'PROG_056',
          fr: 'Énergie',
          ar: 'الطاقة',
          en: 'Energy'
        },
        description: {
          code: 'PROG_056_DESC',
          fr: 'Programme pour le développement des infrastructures électriques et l\'accès universel à l\'énergie',
          ar: 'برنامج تطوير البنى التحتية الكهربائية والوصول الشامل للطاقة',
          en: 'Program for Electrical Infrastructure Development and Universal Energy Access'
        },
        actions: [
          {
            code: '056_01',
            label: {
              code: 'ACT_056_01',
              fr: 'Développement des infrastructures Électriques et l\'Accès Universel à l\'Énergie',
              ar: 'تطوير البنى التحتية الكهربائية والوصول الشامل للطاقة',
              en: 'Development of Electrical Infrastructures and Universal Access to Energy'
            },
            totalCE: 12372104375,
            totalCP: 7786402448,
            chapters: [
              {
                code: '82_056_01_CAB',
                label: { code: 'CH_CABINET_ENERGIE', fr: 'Cabinet', ar: 'الديوان', en: 'Cabinet' },
                lines: [
                  {
                    code: '82_056_01_CAB_56',
                    label: { code: 'LN_ACQUISITION_VEHICULES', fr: 'Acquisition des véhicules', ar: 'اقتناء السيارات', en: 'Vehicle Acquisition' },
                    ce: 10000000, cp: 10000000, climate: 'Neutre'
                  },
                  {
                    code: '82_056_01_CAB_58',
                    label: { code: 'LN_DREAM_PHASE1', fr: 'Développement des Ressources Energétiques et Appui au secteur Minier (DREAM) - Phase 1', ar: 'تنمية الموارد الطاقوية ودعم القطاع المعدني (DREAM) - المرحلة 1', en: 'Energy Resources Development and Mining Sector Support (DREAM) - Phase 1' },
                    ce: 3184000000, cp: 217720000,
                    climate: 'Atténuation', donor: 'BM-IDA', financeType: 'loan'
                  }
                ]
              },
              {
                code: '82_056_01_DGEER',
                label: { code: 'CH_DGEER', fr: 'Direction Générale de l\'Électricité et des Énergies Renouvelables', ar: 'المديرية العامة للكهرباء والطاقات المتجددة', en: 'General Directorate of Electricity and Renewable Energy' },
                lines: [
                  {
                    code: '82_056_01_DGEER_02',
                    label: { code: 'LN_MAINTENANCE_19_CENTRES', fr: 'Maintenance des 19 centres semi-urbains', ar: 'صيانة 19 مركزا شبه حضري', en: 'Maintenance of 19 Semi-Urban Centers' },
                    ce: 4500000, cp: 4000000, climate: 'Neutre'
                  },
                  {
                    code: '82_056_01_DGEER_03',
                    label: { code: 'LN_CENTRALES_HYBRIDES', fr: 'Construction de centrales hybrides éoliennes thermiques sur le littoral', ar: 'بناء محطات هجينة ريحية حرارية على الساحل', en: 'Construction of Hybrid Wind-Thermal Power Plants on the Coastline' },
                    ce: 14716739, cp: 14716739, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_04',
                    label: { code: 'LN_ELECTRIFICATION_RURALE_ISOLEE', fr: 'Développement des infrastructures électriques rurales en zones isolées', ar: 'تطوير البنى التحتية الكهربائية القروية في المناطق المعزولة', en: 'Rural Electrical Infrastructure Development in Isolated Zones' },
                    ce: 530000000, cp: 50000000, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_10',
                    label: { code: 'LN_EXTENSION_MT_KAEDI_SELIBABI', fr: 'Extension des Réseaux MT Zone Sud Est du Projet BOUCLE entre Kaédi et Sélibabi', ar: 'توسيع شبكات الجهد المتوسط المنطقة الجنوبية الشرقية لمشروع بوكلي بين كيهيدي وسيلبابي', en: 'Extension of MT Networks South-East Zone of BOUCLE Project between Kaédi and Sélibabi' },
                    ce: 536717636, cp: 536717636, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_11',
                    label: { code: 'LN_EXTENSION_DUAL_180MW', fr: 'Projet d\'extension de la centrale "Dual" 180 MW d\'une Capacité de 60 MW', ar: 'مشروع توسيع محطة "دوال" 180 ميجاوات بقدرة 60 ميجاوات', en: 'Extension Project of the "Dual" 180 MW Plant with 60 MW Capacity' },
                    ce: 1550000000, cp: 1550000000, climate: 'Atténuation',
                    projectTypes: ['CENTRALE_SOLAIRE', 'CENTRALE_THERMIQUE'],
                    phaseMapping: { default: 'EXECUTION', phases: ['PRE_FEASIBILITY', 'DESIGN_DAO', 'EXECUTION', 'HANDOVER'] },
                    supplierTypes: ['contractant_principal', 'fournisseur']
                  },
                  {
                    code: '82_056_01_DGEER_12',
                    label: { code: 'LN_LIGNE_225KV_KIFFA_AIQUN', fr: 'Ligne électrique 225 k.v entre Kiffa-Aioun et Tintane-Yelimane et postes associés', ar: 'خط كهربائي 225 ك.ف بين كيفة-عيون وطينطان-يليمان والمحطات المرتبطة', en: '225 kV Power Line between Kiffa-Aioun and Tintane-Yelimane and Associated Substations' },
                    ce: 193160000, cp: 83160000, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_29',
                    label: { code: 'LN_ECLAIRAGE_PUBLIC', fr: 'Éclairage Public', ar: 'الإنارة العمومية', en: 'Public Lighting' },
                    ce: 250000000, cp: 250000000, climate: 'Neutre'
                  },
                  {
                    code: '82_056_01_DGEER_32',
                    label: { code: 'LN_ELECTRIFICATION_DETTE_ESPAGNOLE', fr: 'Électrification de 50 localités à travers la conversion de la dette espagnole', ar: 'كهربة 50 قرية عبر تحويل الديون الإسبانية', en: 'Electrification of 50 Localities through Spanish Debt Conversion' },
                    ce: 3000000, cp: 3000000, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_33',
                    label: { code: 'LN_PROJET_BEST_CEDEAO', fr: 'Projet BEST CEDEAO', ar: 'مشروع BEST ECOWAS', en: 'BEST ECOWAS Project' },
                    ce: 300000000, cp: 300000000, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_38',
                    label: { code: 'LN_RIMDIR', fr: '(RIMDIR) Renforcement des investissements productifs et énergétiques en Mauritanie pour le développement durable des zones rurales', ar: '(RIMDIR) تعزيز الاستثمارات الإنتاجية والطاقوية في موريتانيا للتنمية المستدامة للمناطق الريفية', en: '(RIMDIR) Reinforcement of Productive and Energy Investments in Mauritania for Sustainable Rural Development' },
                    ce: 4000000, cp: 4000000, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_51',
                    label: { code: 'LN_PROJET_REGIONAL_BATTERIES', fr: 'Projet régional d\'accès à l\'électricité et à la technologie de stockage d\'énergie par batteries', ar: 'المشروع الجهوي للوصول إلى الكهرباء وتكنولوجيا تخزين الطاقة بالبطاريات', en: 'Regional Project for Access to Electricity and Battery Energy Storage Technology' },
                    ce: 3000000, cp: 3000000, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_52',
                    label: { code: 'LN_PNAGSB_ELECTRICITE', fr: 'Programme National d\'Accès Généralisé aux Services de Base/Composante Accès à l\'électricité', ar: 'البرنامج الوطني للوصول الشامل للخدمات الأساسية/مكون الوصول للكهرباء', en: 'National Program for Generalized Access to Basic Services/Electricity Access Component' },
                    ce: 2969600000, cp: 2000000000, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_53',
                    label: { code: 'LN_PUM_NKTT_ELECTRICITE', fr: 'Programme d\'urgence pour la modernisation de la ville de Nouakchott/Volet Accès à l\'électricité et à l\'éclairage public', ar: 'البرنامج الاستعجالي لتحديث مدينة نواكشوط/مكون الوصول للكهرباء والإنارة العمومية', en: 'Emergency Program for the Modernization of Nouakchott/Electricity Access and Public Lighting Component' },
                    ce: 319410000, cp: 200000000, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_54',
                    label: { code: 'LN_RENFORCEMENT_RESEAUX_DISTRIBUTION', fr: 'Renforcement des Réseaux de distribution (MT, BT et Éclairage public) à NKTT', ar: 'تعزيز شبكات التوزيع (الجهد المتوسط، الجهد المنخفض والإنارة العمومية) في نواكشوط', en: 'Reinforcement of Distribution Networks (MT, BT and Public Lighting) in NKTT' },
                    ce: 200000000, cp: 200000000, climate: 'Atténuation'
                  },
                  {
                    code: '82_056_01_DGEER_55',
                    label: { code: 'LN_RENFORCEMENT_PARC_PRODUCTION', fr: 'Renforcement du parc de production à Nktt et NDB', ar: 'تعزيز حظيرة الإنتاج في نواكشوط ونواذيبو', en: 'Reinforcement of Production Facilities in NKTT and NDB' },
                    ce: 550000000, cp: 350000000, climate: 'Neutre'
                  },
                  {
                    code: '82_056_01_DGEER_60',
                    label: { code: 'LN_RENFORCEMENT_CAPACITES_SOMELEC', fr: 'Renforcement des capacités de la SOMELEC', ar: 'تعزيز قدرات صوملك', en: 'SOMELEC Capacity Building' },
                    ce: 2000000000, cp: 2000000000, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '82_056_01_SOMELEC',
                label: { code: 'CH_SOMELEC', fr: 'SOMELEC', ar: 'صوملك', en: 'SOMELEC' },
                lines: [
                  {
                    code: '82_056_01_SOMELEC_03',
                    label: { code: 'LN_INTERCONNEXION_RIM_SENEGAL', fr: 'Renforcement de l\'interconnexion Électrique entre la Mauritanie et le Sénégal (ligne Nouakchott-Tobène)', ar: 'تعزيز الربط الكهربائي بين موريتانيا والسنغال (خط نواكشوط-طوبين)', en: 'Reinforcement of the Electrical Interconnection between Mauritania and Senegal (Nouakchott-Tobène line)' },
                    ce: 1465722304, cp: 1200000000,
                    climate: 'Atténuation', donor: 'FADES', financeType: 'loan'
                  },
                  {
                    code: '82_056_01_SOMELEC_04',
                    label: { code: 'LN_DEV_RESEAUX_TRANSPORT_DISTRIBUTION', fr: 'Projet de Développement des Réseaux de Transport et de Distribution de l\'Électricité', ar: 'مشروع تطوير شبكات نقل وتوزيع الكهرباء', en: 'Electricity Transport and Distribution Networks Development Project' },
                    ce: 733217927, cp: 420000000,
                    climate: 'Atténuation', donor: 'FADES', financeType: 'loan'
                  }
                ]
              }
            ]
          },
          {
            code: '056_02',
            label: {
              code: 'ACT_056_02',
              fr: 'Accès aux services de l\'énergie',
              ar: 'الوصول إلى خدمات الطاقة',
              en: 'Access to Energy Services'
            },
            totalCE: 530000000,
            totalCP: 99227236,
            chapters: [
              {
                code: '82_056_02_DGEER',
                label: { code: 'CH_DGEER_ACCES', fr: 'Direction Générale de l\'Électricité et des Énergies Renouvelables', ar: 'المديرية العامة للكهرباء والطاقات المتجددة', en: 'General Directorate of Electricity and Renewable Energy' },
                lines: [
                  {
                    code: '82_056_02_DGEER_41',
                    label: { code: 'LN_ACCES_ELECTRICITE_PROPRE', fr: 'Accès abordable à une électricité propre et renouvelable', ar: 'وصول ميسور إلى كهرباء نظيفة ومتجددة', en: 'Affordable Access to Clean and Renewable Electricity' },
                    ce: 530000000, cp: 75714286,
                    climate: 'Atténuation', donor: 'UE', financeType: 'grant'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 89 : DÉLÉGATION GÉNÉRALE Á LA SOLIDARITÉ 
  //           NATIONALE (TAAZOUR)
  // ==========================================================
  {
    code: '89',
    label: {
      code: 'MIN_TAAZOUR',
      fr: 'Délégation Générale à la Solidarité Nationale et à la Lutte contre l\'Exclusion (TAAZOUR)',
      ar: 'المندوبية العامة للتضامن الوطني ومكافحة الإقصاء (تآزر)',
      en: 'General Delegation for National Solidarity and the Fight against Exclusion (TAAZOUR)'
    },
    programs: [
      {
        code: '89_111',
        label: {
          code: 'PROG_111',
          fr: 'Amélioration du Cadre de Vie',
          ar: 'تحسين الإطار المعيشي',
          en: 'Improvement of Living Environment'
        },
        actions: [
          {
            code: '111_01',
            label: {
              code: 'ACT_111_01',
              fr: 'Amélioration de l\'accès des populations pauvres aux services',
              ar: 'تحسين وصول السكان الفقراء إلى الخدمات',
              en: 'Improvement of Poor Populations\' Access to Services'
            },
            totalCE: 7675000000,
            totalCP: 2386087187,
            chapters: [
              {
                code: '89_111_01_DARI',
                label: { code: 'CH_DARI', fr: 'Amélioration du cadre de vie', ar: 'تحسين الإطار المعيشي', en: 'Improvement of Living Environment' },
                lines: [
                  {
                    code: '89_111_01_DARI_05',
                    label: { code: 'LN_PROGRAMME_DARI', fr: 'Programme Dari (Amélioration du cadre de vie)', ar: 'برنامج داري (تحسين الإطار المعيشي)', en: 'Dari Program (Living Environment Improvement)' },
                    ce: 3325000000, cp: 329489559, climate: 'Neutre'
                  }
                ]
              },
              {
                code: '89_111_01_CHEYLA',
                label: { code: 'CH_CHEYLA', fr: 'Accès aux services de base', ar: 'الوصول إلى الخدمات الأساسية', en: 'Access to Basic Services' },
                lines: [
                  {
                    code: '89_111_01_CHEYLA_09',
                    label: { code: 'LN_CHEYLA_EDUCATION', fr: 'Programme Cheyla (Accès aux services de base Éducation)', ar: 'برنامج شيلة (الوصول إلى الخدمات الأساسية - التعليم)', en: 'Cheyla Program (Access to Basic Services - Education)' },
                    ce: 2000000000, cp: 1000000000, climate: 'Neutre'
                  },
                  {
                    code: '89_111_01_CHEYLA_10',
                    label: { code: 'LN_CHEYLA_SANTE', fr: 'Programme Cheyla (Accès aux services de base Santé)', ar: 'برنامج شيلة (الوصول إلى الخدمات الأساسية - الصحة)', en: 'Cheyla Program (Access to Basic Services - Health)' },
                    ce: 1000000000, cp: 350000000, climate: 'Neutre'
                  },
                  {
                    code: '89_111_01_CHEYLA_11',
                    label: { code: 'LN_CHEYLA_EAU', fr: 'Programme Cheyla (Accès aux services de base Eau Potable)', ar: 'برنامج شيلة (الوصول إلى الخدمات الأساسية - الماء الصالح للشرب)', en: 'Cheyla Program (Access to Basic Services - Drinking Water)' },
                    ce: 300000000, cp: 100000000, climate: 'Neutre'
                  },
                  {
                    code: '89_111_01_CHEYLA_12',
                    label: { code: 'LN_CHEYLA_ELECTRICITE', fr: 'Programme Cheyla (Accès aux services de base Électricité)', ar: 'برنامج شيلة (الوصول إلى الخدمات الأساسية - الكهرباء)', en: 'Cheyla Program (Access to Basic Services - Electricity)' },
                    ce: 300000000, cp: 100000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '89_112',
        label: {
          code: 'PROG_112',
          fr: 'Assistance Sociale',
          ar: 'المساعدة الاجتماعية',
          en: 'Social Assistance'
        },
        actions: [
          {
            code: '112_01',
            label: {
              code: 'ACT_112_01',
              fr: 'Subvention des ménages en denrées alimentaires',
              ar: 'دعم الأسر بالمواد الغذائية',
              en: 'Household Food Subsidies'
            },
            totalCE: 4500000000,
            totalCP: 1003136060,
            chapters: [
              {
                code: '89_112_01_DENREES',
                label: { code: 'CH_DENREES_ALIMENTAIRES', fr: 'Accès aux denrées alimentaires et défense du pouvoir d\'achat', ar: 'الوصول إلى المواد الغذائية والدفاع عن القدرة الشرائية', en: 'Access to Foodstuffs and Purchasing Power Protection' },
                lines: [
                  {
                    code: '89_112_01_DENREES_10',
                    label: { code: 'LN_ACCES_DENREES_ALIMENTAIRES', fr: 'Accès aux denrées alimentaires et défense du pouvoir d\'achat', ar: 'الوصول إلى المواد الغذائية والدفاع عن القدرة الشرائية', en: 'Access to Foodstuffs and Purchasing Power Protection' },
                    ce: 4500000000, cp: 1003136060, climate: 'Neutre'
                  }
                ]
              }
            ]
          },
          {
            code: '112_02',
            label: {
              code: 'ACT_112_02',
              fr: 'Paiement des cash Transfer et charges assimilées et Promotion sociale et économique',
              ar: 'دفع التحويلات النقدية والأعباء المرتبطة والترقية الاجتماعية والاقتصادية',
              en: 'Cash Transfer Payments and Related Charges, Social and Economic Promotion'
            },
            totalCE: 4384000000,
            totalCP: 1384000000,
            chapters: [
              {
                code: '89_112_02_TAKAVOUL',
                label: { code: 'CH_TAKAVOUL', fr: 'Filets sociaux et amélioration du pouvoir d\'achat', ar: 'شبكات الأمان الاجتماعي وتحسين القدرة الشرائية', en: 'Social Safety Nets and Purchasing Power Improvement' },
                lines: [
                  {
                    code: '89_112_02_TAKAVOUL_06',
                    label: { code: 'LN_PROGRAMME_TAKAVOUL', fr: 'Programme Takavoul (filets de protection sociale et amélioration du pouvoir d\'achat)', ar: 'برنامج تكافل (شبكات الحماية الاجتماعية وتحسين القدرة الشرائية)', en: 'Takavoul Program (Social Protection Nets and Purchasing Power Improvement)' },
                    ce: 4384000000, cp: 1384000000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        code: '89_113',
        label: {
          code: 'PROG_113',
          fr: 'Inclusion Économique et Changement de Mentalité',
          ar: 'الإدماج الاقتصادي وتغيير العقليات',
          en: 'Economic Inclusion and Change of Mindset'
        },
        actions: [
          {
            code: '113_01',
            label: {
              code: 'ACT_113_01',
              fr: 'Création d\'emplois et amélioration des conditions de vie des populations pauvres et vulnérables',
              ar: 'خلق فرص العمل وتحسين ظروف عيش السكان الفقراء والهشين',
              en: 'Job Creation and Improvement of Living Conditions of Poor and Vulnerable Populations'
            },
            totalCE: 1015000000,
            totalCP: 510993900,
            chapters: [
              {
                code: '89_113_01_BARAKA',
                label: { code: 'CH_BARAKA', fr: 'Inclusion économique', ar: 'الإدماج الاقتصادي', en: 'Economic Inclusion' },
                lines: [
                  {
                    code: '89_113_01_BARAKA_04',
                    label: { code: 'LN_PROGRAMME_BARAKA', fr: 'Programme Al Baraka (inclusion économique)', ar: 'برنامج البركة (الإدماج الاقتصادي)', en: 'Al Baraka Program (Economic Inclusion)' },
                    ce: 1015000000, cp: 510993900, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================
  // TITRE 98 : CHARGES DE LA DETTE PUBLIQUE
  // ==========================================================
  {
    code: '98',
    label: {
      code: 'CHARGES_DETTE',
      fr: 'Charges de la Dette Publique',
      ar: 'أعباء الدين العمومي',
      en: 'Public Debt Charges'
    },
    programs: [
      {
        code: '98_128',
        label: {
          code: 'PROG_128',
          fr: 'Charges de la Dette Publique',
          ar: 'أعباء الدين العمومي',
          en: 'Public Debt Charges'
        },
        actions: [
          {
            code: '128_01',
            label: {
              code: 'ACT_128_01',
              fr: 'Paiement des charges de la dette publique',
              ar: 'دفع أعباء الدين العمومي',
              en: 'Public Debt Charges Payment'
            },
            totalCE: 0,
            totalCP: 5078600000,
            chapters: [
              {
                code: '98_128_01_DETTE',
                label: { code: 'CH_DETTE_PUBLIQUE', fr: 'Charges de la Dette Publique', ar: 'أعباء الدين العمومي', en: 'Public Debt Charges' },
                lines: [
                  {
                    code: '98_128_01_DETTE_02',
                    label: { code: 'LN_CHARGES_DETTE_PUBLIQUE', fr: 'Charges de la dette publique', ar: 'أعباء الدين العمومي', en: 'Public Debt Charges' },
                    ce: 0, cp: 5078600000, climate: 'Neutre'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Recherche un ministère par son code
 */
export function findMinistry(code: string): BudgetMinistry | undefined {
  return budget2026Referential.find(m => m.code === code);
}

/**
 * Recherche un programme par le code complet (ministère_programme)
 */
export function findProgram(fullCode: string): { ministry: BudgetMinistry; program: BudgetProgram } | undefined {
  const [ministryCode] = fullCode.split('_');
  const ministry = findMinistry(ministryCode);
  if (!ministry) return undefined;
  const program = ministry.programs.find(p => p.code === fullCode);
  if (!program) return undefined;
  return { ministry, program };
}

/**
 * Recherche une action par son code
 */
export function findAction(actionCode: string): { ministry: BudgetMinistry; program: BudgetProgram; action: BudgetAction } | undefined {
  for (const ministry of budget2026Referential) {
    for (const program of ministry.programs) {
      const action = program.actions.find(a => a.code === actionCode);
      if (action) {
        return { ministry, program, action };
      }
    }
  }
  return undefined;
}

/**
 * Recherche une ligne budgétaire par son code
 */
export function findBudgetLine(lineCode: string): { line: BudgetLine; action: BudgetAction; program: BudgetProgram; ministry: BudgetMinistry } | undefined {
  for (const ministry of budget2026Referential) {
    for (const program of ministry.programs) {
      for (const action of program.actions) {
        for (const chapter of action.chapters) {
          const line = chapter.lines.find(l => l.code === lineCode);
          if (line) {
            return { line, action, program, ministry };
          }
        }
      }
    }
  }
  return undefined;
}

/**
 * Retourne tous les programmes d'un ministère
 */
export function getProgramsByMinistry(ministryCode: string): BudgetProgram[] {
  const ministry = findMinistry(ministryCode);
  return ministry?.programs || [];
}

/**
 * Retourne toutes les actions d'un programme
 */
export function getActionsByProgram(programCode: string): BudgetAction[] {
  const result = findProgram(programCode);
  return result?.program.actions || [];
}

/**
 * Retourne toutes les lignes budgétaires d'une action
 */
export function getLinesByAction(actionCode: string): BudgetLine[] {
  const lines: BudgetLine[] = [];
  for (const ministry of budget2026Referential) {
    for (const program of ministry.programs) {
      const action = program.actions.find(a => a.code === actionCode);
      if (action) {
        for (const chapter of action.chapters) {
          lines.push(...chapter.lines);
        }
        return lines;
      }
    }
  }
  return lines;
}

/**
 * Calcule le total CE pour une liste de lignes
 */
export function calculateTotalCE(lines: BudgetLine[]): number {
  return lines.reduce((sum, line) => sum + line.ce, 0);
}

/**
 * Calcule le total CP pour une liste de lignes
 */
export function calculateTotalCP(lines: BudgetLine[]): number {
  return lines.reduce((sum, line) => sum + line.cp, 0);
}

/**
 * Filtre les lignes par marquage climatique
 */
export function filterLinesByClimate(lines: BudgetLine[], climate: 'Adaptation' | 'Atténuation' | 'Neutre'): BudgetLine[] {
  return lines.filter(line => line.climate === climate);
}

/**
 * Filtre les lignes par source de financement
 */
export function filterLinesByFinanceType(lines: BudgetLine[], financeType: 'domestic' | 'grant' | 'loan' | 'mixed'): BudgetLine[] {
  return lines.filter(line => line.financeType === financeType);
}

/**
 * Filtre les lignes par bailleur
 */
export function filterLinesByDonor(lines: BudgetLine[], donor: string): BudgetLine[] {
  return lines.filter(line => line.donor === donor);
}

/**
 * Retourne le résumé complet du référentiel
 */
export function getReferentialSummary(): {
  totalMinistries: number;
  totalPrograms: number;
  totalActions: number;
  totalLines: number;
  totalCE: number;
  totalCP: number;
} {
  let totalPrograms = 0;
  let totalActions = 0;
  let totalLines = 0;
  let totalCE = 0;
  let totalCP = 0;

  for (const ministry of budget2026Referential) {
    totalPrograms += ministry.programs.length;
    for (const program of ministry.programs) {
      totalActions += program.actions.length;
      for (const action of program.actions) {
        for (const chapter of action.chapters) {
          totalLines += chapter.lines.length;
          totalCE += calculateTotalCE(chapter.lines);
          totalCP += calculateTotalCP(chapter.lines);
        }
      }
    }
  }

  return {
    totalMinistries: budget2026Referential.length,
    totalPrograms,
    totalActions,
    totalLines,
    totalCE,
    totalCP
  };
}