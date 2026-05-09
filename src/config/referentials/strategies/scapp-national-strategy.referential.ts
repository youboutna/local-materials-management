/**
 * Référentiel SCAPP 2016-2030 - Stratégie de Croissance Accélérée et Prospérité Partagée
 * Source: scapp_volume_2.pdf
 */

export interface MultiLangLabel {
  code: string;
  fr: string;
  ar: string;
  en: string;
}

export interface MeasurableObjective {
  code: string;
  label: MultiLangLabel;
  description?: MultiLangLabel;
  baselineValue?: number;
  baselineYear?: number;
  target2020?: number;
  target2025?: number;
  target2030?: number;
  unit?: string;
  sdgReference?: string;
  dataSource?: string;
  measurementFrequency?: 'annual' | 'biennial' | 'quinquennial';
}

export interface StrategicIntervention {
  code: string;
  label: MultiLangLabel;
  description?: MultiLangLabel;
  sdgTargets: string[];
  objectives: MeasurableObjective[];
}

export interface StrategicChantier {
  code: string;
  label: MultiLangLabel;
  description?: MultiLangLabel;
  interventions: StrategicIntervention[];
}

export interface StrategicLever {
  code: string;
  label: MultiLangLabel;
  description?: MultiLangLabel;
  relatedSDGs: number[];
  chantiers: StrategicChantier[];
}

const ml = (code: string, fr: string, ar: string, en: string): MultiLangLabel => ({ code, fr, ar, en });

export const scappNationalStrategy: StrategicLever[] = [
  {
    code: 'LEVIER_1',
    label: ml('LEVIER_1', 'Promouvoir une croissance forte, durable et inclusive', 'تعزيز نمو قوي ومستدام وشامل', 'Promote strong, sustainable and inclusive growth'),
    description: ml('LEVIER_1_DESC', 'Transformations structurelles pour une croissance économique forte, durable et inclusive.', 'تحولات هيكلية لنمو اقتصادي قوي ومستدام وشامل.', 'Structural transformations for strong, sustainable and inclusive economic growth.'),
    relatedSDGs: [2, 6, 7, 8, 9, 11, 12, 14],
    chantiers: [
      {
        code: 'CHANTIER_1_1',
        label: ml('CHANTIER_1_1', "Promotion d'une croissance plus diversifiée des secteurs porteurs", 'تعزيز نمو أكثر تنوعا للقطاعات الواعدة', 'Promotion of more diversified growth of key sectors'),
        interventions: [
          {
            code: 'INTERV_1_1_1',
            label: ml('INTERV_1_1_1', "Promotion d'une agriculture productive, compétitive et durable", 'تعزيز زراعة منتجة وتنافسية ومستدامة', 'Promotion of productive, competitive and sustainable agriculture'),
            sdgTargets: ['2.3', '2.4'],
            objectives: [
              { code: 'OBJ_RICE_YIELD', label: ml('OBJ_RICE_YIELD', 'Rendement du riz (tonne/hectare)', 'إنتاجية الأرز (طن/هكتار)', 'Rice yield (ton/hectare)'), baselineValue: 5.1, baselineYear: 2015, target2020: 5.3, target2025: 5.6, target2030: 5.9, unit: 't/ha', sdgReference: '2.3.1', dataSource: "Ministère de l'Agriculture / ONS", measurementFrequency: 'annual' },
              { code: 'OBJ_RICE_COVERAGE', label: ml('OBJ_RICE_COVERAGE', 'Taux de couverture des besoins en riz blanc (%)', 'نسبة تغطية الاحتياجات من الأرز الأبيض (%)', 'Coverage rate of white rice needs (%)'), baselineValue: 68, baselineYear: 2015, target2020: 114, target2025: 119, target2030: 124, unit: '%', sdgReference: '2.1.2', dataSource: "Ministère de l'Agriculture / CSA", measurementFrequency: 'annual' },
            ],
          },
          {
            code: 'INTERV_1_1_2',
            label: ml('INTERV_1_1_2', 'Développement des filières animales compétitives', 'تطوير الشعب الحيوانية التنافسية', 'Development of competitive animal value chains'),
            sdgTargets: ['2.3'],
            objectives: [
              { code: 'OBJ_MEAT_PRODUCTION', label: ml('OBJ_MEAT_PRODUCTION', 'Production contrôlée de viandes rouges (tonnes)', 'الإنتاج المراقب للحوم الحمراء (طن)', 'Controlled red meat production (tons)'), baselineValue: 31000, baselineYear: 2015, target2020: 45000, target2025: 55000, target2030: 62000, unit: 'tonnes', sdgReference: '2.3.1', dataSource: "Ministère de l'Élevage", measurementFrequency: 'annual' },
            ],
          },
        ],
      },
      {
        code: 'CHANTIER_1_3',
        label: ml('CHANTIER_1_3', 'Renforcement des infrastructures de soutien à la croissance', 'تعزيز البنى التحتية الداعمة للنمو', 'Strengthening of growth-supporting infrastructure'),
        interventions: [
          {
            code: 'INTERV_1_3_1',
            label: ml('INTERV_1_3_1', "Garantir la disponibilité de services énergétiques à un coût abordable", 'ضمان توفر خدمات الطاقة بتكلفة ميسورة', 'Guarantee availability of energy services at affordable cost'),
            sdgTargets: ['7.1', '7.2'],
            objectives: [
              { code: 'OBJ_ELECTRICITY_URBAN', label: ml('OBJ_ELECTRICITY_URBAN', "Ménages urbains avec accès à l'électricité (%)", 'نسبة الأسر الحضرية مع الوصول للكهرباء (%)', 'Urban households with electricity access (%)'), baselineValue: 76.9, baselineYear: 2014, target2020: 95, target2025: 97, target2030: 98, unit: '%', sdgReference: '7.1.1', dataSource: 'ONS / EPCV', measurementFrequency: 'annual' },
              { code: 'OBJ_ELECTRICITY_RURAL', label: ml('OBJ_ELECTRICITY_RURAL', "Ménages ruraux avec accès à l'électricité (%)", 'نسبة الأسر الريفية مع الوصول للكهرباء (%)', 'Rural households with electricity access (%)'), baselineValue: 6, baselineYear: 2015, target2020: 40, target2025: 60, target2030: 80, unit: '%', sdgReference: '7.1.1', dataSource: 'ONS / EPCV', measurementFrequency: 'annual' },
              { code: 'OBJ_RENEWABLE_SHARE', label: ml('OBJ_RENEWABLE_SHARE', 'Part des énergies renouvelables (%)', 'حصة الطاقات المتجددة (%)', 'Renewable energy share (%)'), baselineValue: 32, baselineYear: 2015, target2020: 50, target2025: 60, target2030: 70, unit: '%', sdgReference: '7.2.1', dataSource: "Ministère du Pétrole et de l'Énergie / SOMELEC", measurementFrequency: 'annual' },
            ],
          },
        ],
      },
    ],
  },
  {
    code: 'LEVIER_2',
    label: ml('LEVIER_2', "Développer le capital humain et l'accès aux services sociaux de base", 'تطوير الرأسمال البشري والوصول إلى الخدمات الاجتماعية الأساسية', 'Develop human capital and access to basic social services'),
    relatedSDGs: [1, 3, 4, 5, 6, 7, 8, 10],
    chantiers: [
      {
        code: 'CHANTIER_2_2',
        label: ml('CHANTIER_2_2', "Amélioration des conditions d'accès aux services de santé", 'تحسين ظروف الوصول إلى خدمات الصحة', 'Improvement of access to health services'),
        interventions: [
          {
            code: 'INTERV_2_2_2',
            label: ml('INTERV_2_2_2', 'Améliorer les prestations du secteur de la santé', 'تحسين خدمات قطاع الصحة', 'Improve health sector services'),
            sdgTargets: ['3.1', '3.2', '3.3', '3.7'],
            objectives: [
              { code: 'OBJ_MATERNAL_MORTALITY', label: ml('OBJ_MATERNAL_MORTALITY', 'Mortalité maternelle (pour 100.000 NV)', 'معدل وفيات الأمهات', 'Maternal mortality rate'), baselineValue: 582, baselineYear: 2013, target2020: 219, target2025: 200, target2030: 70, unit: '/100k NV', sdgReference: '3.1.1', dataSource: 'Ministère de la Santé / MICS', measurementFrequency: 'quinquennial' },
              { code: 'OBJ_INFANT_MORTALITY', label: ml('OBJ_INFANT_MORTALITY', 'Mortalité infanto-juvénile (‰)', 'وفيات الأطفال دون الخامسة', 'Under-five mortality rate'), baselineValue: 115, baselineYear: 2011, target2020: 40, target2025: 30, target2030: 20, unit: '‰', sdgReference: '3.2.1', dataSource: 'Ministère de la Santé / MICS', measurementFrequency: 'quinquennial' },
              { code: 'OBJ_HEALTH_COVERAGE', label: ml('OBJ_HEALTH_COVERAGE', 'Couverture sanitaire (%)', 'التغطية الصحية', 'Health coverage'), baselineValue: 82.2, baselineYear: 2015, target2020: 90, target2025: 95, target2030: 96, unit: '%', sdgReference: '3.8.1', dataSource: 'PNDS', measurementFrequency: 'annual' },
            ],
          },
        ],
      },
    ],
  },
  {
    code: 'LEVIER_3',
    label: ml('LEVIER_3', 'Renforcer la gouvernance dans toutes ses dimensions', 'تعزيز الحكامة في جميع أبعادها', 'Strengthen governance in all its dimensions'),
    relatedSDGs: [5, 8, 9, 11, 14, 15, 16],
    chantiers: [
      {
        code: 'CHANTIER_3_2',
        label: ml('CHANTIER_3_2', "Consolidation de l'État de droit, des droits humains et de la justice", 'تعزيز دولة القانون', 'Consolidation of the Rule of Law'),
        interventions: [
          {
            code: 'INTERV_3_2_2',
            label: ml('INTERV_3_2_2', 'Renforcer la justice', 'تعزيز العدالة', 'Strengthen justice'),
            sdgTargets: ['16.3'],
            objectives: [
              { code: 'OBJ_PRETRIAL_DETENTION', label: ml('OBJ_PRETRIAL_DETENTION', 'Population carcérale en instance de jugement (%)', 'نسبة السجناء في انتظار المحاكمة', 'Pre-trial detainees (%)'), baselineValue: 36, baselineYear: 2018, target2025: 10, target2030: 5, unit: '%', sdgReference: '16.3.2', dataSource: 'Ministère de la Justice', measurementFrequency: 'annual' },
            ],
          },
        ],
      },
    ],
  },
];

export function findLever(code: string): StrategicLever | undefined {
  return scappNationalStrategy.find(l => l.code === code);
}

export function findChantier(code: string): StrategicChantier | undefined {
  for (const lever of scappNationalStrategy) {
    const c = lever.chantiers.find(c => c.code === code);
    if (c) return c;
  }
  return undefined;
}

export function findIntervention(code: string): StrategicIntervention | undefined {
  for (const lever of scappNationalStrategy) {
    for (const chantier of lever.chantiers) {
      const i = chantier.interventions.find(i => i.code === code);
      if (i) return i;
    }
  }
  return undefined;
}

export function findObjective(code: string): MeasurableObjective | undefined {
  for (const lever of scappNationalStrategy) {
    for (const chantier of lever.chantiers) {
      for (const intervention of chantier.interventions) {
        const o = intervention.objectives.find(o => o.code === code);
        if (o) return o;
      }
    }
  }
  return undefined;
}

export function getAllObjectives(): MeasurableObjective[] {
  const out: MeasurableObjective[] = [];
  for (const lever of scappNationalStrategy)
    for (const chantier of lever.chantiers)
      for (const intervention of chantier.interventions)
        out.push(...intervention.objectives);
  return out;
}

export function searchObjectives(query: string): MeasurableObjective[] {
  if (!query) return getAllObjectives();
  const q = query.toLowerCase();
  return getAllObjectives().filter(o =>
    o.label.fr.toLowerCase().includes(q) ||
    o.label.en.toLowerCase().includes(q) ||
    o.code.toLowerCase().includes(q) ||
    (o.sdgReference || '').toLowerCase().includes(q)
  );
}
