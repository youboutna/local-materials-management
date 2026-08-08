/**
 * Core Entities for Mauritania-specific project management:
 * Workspaces: Physical/virtual locations
 * Projects: Work initiatives with budgets and timelines
 * Tasks: Action items with Mauritania-timezone awareness
 * Materials: Inventory with import delay tracking
 * Location: Major cities and wilayas (properly structured)
 * Payments: Local transaction records
 * Inspections: Regulatory compliance tracking
 */

import { Feature, Polygon } from 'geojson';

// =================== ADMINISTRATIVE LEVELS ===================

export enum AdministrativeLevel {
  WILAYA = "wilaya",    // State/Province (15 total)
  CITY = "city",        // Major City
  COMMUNE = "commune",  // Municipality
}

// =================== INTERFACES ===================

export interface GeographicUnit {
  code: string;
  name: string;
  nameAr: string;
  lat: number;
  lng: number;
  geometry?: Feature<Polygon>;
  population?: number;
  economicImportance?: 'capital' | 'economic' | 'regional' | 'local';
}

export interface Region extends GeographicUnit {
  // Wilaya-level data
  capital: string; // Capital city code
  establishedYear?: number;
  area?: number; // in km²
}

export interface City extends GeographicUnit {
  // City-level data
  parentCode: string; // Wilaya code
  isCapital: boolean;
  marketDays?: string[]; // Weekly market days
  hasAirport?: boolean;
  hasPort?: boolean;
  hasUniversity?: boolean;
  searchTerms?: string[]; // Alternative search terms for matching
}


// =================== WILAYAS (15 States) ===================

export const MAURITANIA_REGIONS: Region[] = [
  {
    code: "NKC",
    name: "Nouakchott",
    nameAr: "نواكشوط",
    lat: 18.0858,
    lng: -15.9785,
    capital: "NKC",
    economicImportance: 'capital',
    establishedYear: 1960,
    population: 1158000
  },
  {
    code: "NDB",
    name: "Dakhlet Nouadhibou",
    nameAr: "داخلة نواذيبو",
    lat: 20.5986,
    lng: -16.2522,
    capital: "NDB",
    economicImportance: 'economic',
    establishedYear: 1976,
    population: 118000
  },
  {
    code: "ADR",
    name: "Adrar",
    nameAr: "آدرار",
    lat: 20.5091,
    lng: -12.8343,
    capital: "ATR",
    economicImportance: 'regional',
    establishedYear: 1974,
    population: 65000
  },
  {
    code: "ASA",
    name: "Assaba",
    nameAr: "العصابة",
    lat: 16.8296,
    lng: -11.3557,
    capital: "KFA",
    economicImportance: 'regional',
    establishedYear: 1974,
    population: 45000
  },
  {
    code: "BRK",
    name: "Brakna",
    nameAr: "براكنة",
    lat: 17.2318,
    lng: -13.1740,
    capital: "ALG",
    economicImportance: 'regional',
    establishedYear: 1974,
    population: 35000
  },
  {
    code: "GOG",
    name: "Gorgol",
    nameAr: "كوركول",
    lat: 15.9717,
    lng: -13.1740,
    capital: "KED",
    economicImportance: 'regional',
    establishedYear: 1974,
    population: 50000
  },
  {
    code: "GDM",
    name: "Guidimaka",
    nameAr: "غيديماغا",
    lat: 15.3833,
    lng: -12.1333,
    capital: "SLB",
    economicImportance: 'regional',
    establishedYear: 1974,
    population: 20000
  },
  {
    code: "HEC",
    name: "Hodh Ech Chargui",
    nameAr: "الحوض الشرقي",
    lat: 18.6737,
    lng: -7.0929,
    capital: "NMA",
    economicImportance: 'regional',
    establishedYear: 1974,
    population: 60000
  },
  {
    code: "HEG",
    name: "Hodh El Gharbi",
    nameAr: "الحوض الغربي",
    lat: 16.6916,
    lng: -9.5457,
    capital: "TDJ",
    economicImportance: 'regional',
    establishedYear: 1974,
    population: 25000
  },
  {
    code: "INC",
    name: "Inchiri",
    nameAr: "إينشيري",
    lat: 20.0281,
    lng: -15.4065,
    capital: "AKJ",
    economicImportance: 'local',
    establishedYear: 1974,
    population: 15000
  },
  {
    code: "TGT",
    name: "Tagant",
    nameAr: "تكانت",
    lat: 18.7128,
    lng: -10.9408,
    capital: "TDJ",
    economicImportance: 'regional',
    establishedYear: 1974,
    population: 40000
  },
  {
    code: "TRZ",
    name: "Tiris Zemmour",
    nameAr: "تيرس زمور",
    lat: 24.5774,
    lng: -9.9018,
    capital: "ZRT",
    economicImportance: 'local',
    establishedYear: 1974,
    population: 30000
  },
  {
    code: "TRR",
    name: "Trarza",
    nameAr: "ترارزة",
    lat: 17.8667,
    lng: -14.6667,
    capital: "RSO",
    economicImportance: 'regional',
    establishedYear: 1974,
    population: 35000
  }
];

/**
 * Enhanced mapping of cities/locations to their respective regions
 * Used for search, autocomplete, and validation
 * Includes multilingual terms (French, English, Arabic transliterations)
 */
export const CITY_TO_REGION_MAP: Record<string, string[]> = {
  // Nouakchott Capital District
  'NKC': [
    'nouakchott', 'nkc', 'capital', 'capitale', 'نواكشوط',
    'teyarett', 'تيارت', 'dar naim', 'دار النعيم', 
    'toujounine', 'توجنين', 'sebkha', 'السبخة',
    'el mina', 'الميناء', 'riyad', 'الرياض',
    'ain pour', 'عين بور', 'ksar', 'القصر',
    'teyaret', 'darnaim', 'toujounin', 'sebka', 'mina', 'riad', 'ainpour'
  ],
  
  // Dakhlet Nouadhibou Region
  'NDB': [
    'nouadhibou', 'ndb', 'port', 'economic capital', 'capitale economique',
    'dakhlet nouadhibou', 'داخلة نواذيبو', 'نواذيبو',
    'cansado', 'la guerre', 'pkm', 'port autonome', 
    'chami', 'الشامي', 'port de nouadhibou'
  ],
  
  // Adrar Region
  'ADR': [
    'adrar', 'آدرار', 'atar', 'أطار', 
    'chinguetti', 'شنقيط', 'ouadane', 'وادان',
    'choum', 'شوم', 'ain savra', 'عين صفرة',
    'chinguit', 'wadane', 'adrar region'
  ],
  
  // Assaba Region
  'ASA': [
    'assaba', 'العصابة', 'kifa', 'kiffa', 'كيفة',
    'guerou', 'كرو', 'barkeol', 'باركيول',
    'boumdeid', 'بومديد', 'kankossa', 'كنكوصة',
    'kiffa', 'kerou', 'barkewol', 'boumedid', 'kankosa'
  ],
  
  // Brakna Region
  'BRK': [
    'brakna', 'براكنة', 'aleg', 'ألاك',
    'magta lahjar', 'مكطع لحجار', 'matka lahjar',
    'boghé', 'boghe', 'بوكي', 'mbagne', 'امبان',
    'bababé', 'bababe', 'بابابي', 'magta', 'bogue'
  ],
  
  // Dakhlet Nouadhibou (additional)
  'DKN': [
    'dakhlet nouadhibou', 'nouadhibou', 'port autonome',
    'dakhlet', 'chami', 'la guerre', 'cansado'
  ],
  
  // Gorgol Region
  'GOG': [
    'gorgol', 'كوركول', 'kaédi', 'kaedi', 'كيدي',
    'maghama', 'مقامة', 'monguel', 'منكل',
    'lexeiba', 'الكسيبا', 'mballal', 'mbout'
  ],
  
  // Guidimaka Region
  'GDM': [
    'guidimaka', 'غيديماغا', 'sélibaby', 'selibaby', 'سليبابي',
    'ghabou', 'غابو', 'ould yengé', 'ould yenge', 'ولد ينج',
    'wompou', 'gouraye', 'baydam'
  ],
  
  // Hodh Ech Chargui Region
  'HEC': [
    'hodh ech chargui', 'الحوض الشرقي', 'néma', 'nema', 'النعمة',
    'bassiknou', 'باسكنو', 'amourj', 'آمرج',
    'djiguenni', 'جكني', 'timbedra', 'تمبدغة',
    'adel bagrou', 'فصالة', 'bassikounou'
  ],
  
  // Hodh El Gharbi Region
  'HEG': [
    'hodh el gharbi', 'الحوض الغربي', 'aioun', 'ayoun',
    'ayoun el atrous', 'عيون العتروس', 'tintane', 'الطينطان',
    'kobani', 'كوبني', 'tamchekett', 'تمشكط',
    'koussan', 'العيون', 'tintan'
  ],
  
  // Inchiri Region
  'INC': [
    'inchiri', 'إينشيري', 'akjoujt', 'أكجوجت',
    'benichab', 'بنشاب', 'akjout', 'akjoujt'
  ],
  
  // Tagant Region
  'TGT': [
    'tagant', 'تكانت', 'tidjikja', 'تيجيكجة',
    'moudjéria', 'moudjerria', 'مجيرية',
    'rachid', 'رشيد', 'tichit', 'تيشيت',
    'moudjeria', 'tidjikdja'
  ],
  
  // Tiris Zemmour Region
  'TZM': [
    'tiris zemmour', 'تيرس زمور', 'zouerate', 'الزويرات',
    'zouérat', 'fderick', 'fderik', 'افديرك',
    'bir moghrein', 'bir um grein', 'بير أم أكرين',
    'zouirat', 'fderick', 'bir moughrein'
  ],
  
  // Trarza Region
  'TRR': [
    'trarza', 'ترارزة', 'rosso', 'روصو',
    'boutilimit', 'بوتلميت', 'rkiz', 'اركيز',
    'mederdra', 'مدرذرة', 'keur macène', 'keur macene',
    'كور ماكيني', 'tekevre', 'oulad ali', 'rosso senegal'
  ]
};
// =================== MAJOR CITIES ===================

export const MAURITANIA_CITIES: City[] = [
  // Capital District Cities
  {
    code: "NKC",
    name: "Nouakchott",
    nameAr: "نواكشوط",
    lat: 18.0858,
    lng: -15.9785,
    parentCode: "NKC",
    isCapital: true,
    economicImportance: 'capital',
    population: 1158000,
    hasAirport: true,
    hasPort: true,
    hasUniversity: true,
    searchTerms: CITY_TO_REGION_MAP['NKC']
  },
  {
    code: "TEY",
    name: "Teyarett",
    nameAr: "تيارت",
    lat: 18.0861,
    lng: -15.9631,
    parentCode: "NKC",
    isCapital: false,
    economicImportance: 'local',
    population: 278000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['teyarett', 'تيارت', 'teyaret', 'teyarett']
  },
  {
    code: "DAR",
    name: "Dar Naim",
    nameAr: "دار النعيم",
    lat: 18.1172,
    lng: -15.9506,
    parentCode: "NKC",
    isCapital: false,
    economicImportance: 'local',
    population: 144000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['dar naim', 'دار النعيم', 'darnaim']
  },
  {
    code: "TOU",
    name: "Toujounine",
    nameAr: "توجنين",
    lat: 18.1094,
    lng: -15.9503,
    parentCode: "NKC",
    isCapital: false,
    economicImportance: 'local',
    population: 156000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['toujounine', 'توجنين', 'toujounin']
  },
  {
    code: "SEB",
    name: "Sebkha",
    nameAr: "السبخة",
    lat: 18.0575,
    lng: -15.9750,
    parentCode: "NKC",
    isCapital: false,
    economicImportance: 'local',
    population: 134000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['sebkha', 'السبخة', 'sebkha']
  },
  {
    code: "MIN",
    name: "El Mina",
    nameAr: "الميناء",
    lat: 18.0506,
    lng: -15.9872,
    parentCode: "NKC",
    isCapital: false,
    economicImportance: 'local',
    population: 129000,
    hasAirport: false,
    hasPort: true,
    hasUniversity: false,
    searchTerms: ['el mina', 'الميناء', 'mina']
  },
  {
    code: "RIY",
    name: "Riyad",
    nameAr: "الرياض",
    lat: 18.0419,
    lng: -15.9711,
    parentCode: "NKC",
    isCapital: false,
    economicImportance: 'local',
    population: 118000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['riyad', 'الرياض', 'riad']
  },
  {
    code: "AIN",
    name: "Ain Pour",
    nameAr: "عين بور",
    lat: 18.1236,
    lng: -15.9319,
    parentCode: "NKC",
    isCapital: false,
    economicImportance: 'local',
    population: 95000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['ain pour', 'عين بور', 'ainpour']
  },
  {
    code: "KSA",
    name: "Ksar",
    nameAr: "القصر",
    lat: 18.1025,
    lng: -15.9544,
    parentCode: "NKC",
    isCapital: false,
    economicImportance: 'local',
    population: 89000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['ksar', 'القصر', 'el ksar']
  },

  // Dakhlet Nouadhibou Region
  {
    code: "NDB",
    name: "Nouadhibou",
    nameAr: "نواذيبو",
    lat: 20.9425,
    lng: -17.0383,
    parentCode: "NDB",
    isCapital: true,
    economicImportance: 'economic',
    population: 118000,
    hasAirport: true,
    hasPort: true,
    hasUniversity: true,
    marketDays: ["Monday", "Thursday", "Saturday"],
    searchTerms: CITY_TO_REGION_MAP['NDB']
  },
  {
    code: "CHA",
    name: "Chami",
    nameAr: "الشامي",
    lat: 20.8667,
    lng: -16.5333,
    parentCode: "NDB",
    isCapital: false,
    economicImportance: 'local',
    population: 15000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['chami', 'الشامي', 'chami']
  },

  // Adrar Region Cities
  {
    code: "ATR",
    name: "Atar",
    nameAr: "أطار",
    lat: 20.5175,
    lng: -13.0472,
    parentCode: "ADR",
    isCapital: true,
    economicImportance: 'regional',
    population: 65000,
    hasAirport: true,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Monday", "Thursday"],
    searchTerms: CITY_TO_REGION_MAP['ADR']
  },
  {
    code: "CHG",
    name: "Chinguetti",
    nameAr: "شنقيط",
    lat: 20.4631,
    lng: -12.3664,
    parentCode: "ADR",
    isCapital: false,
    economicImportance: 'regional',
    population: 4000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Tuesday"],
    searchTerms: ['chinguetti', 'شنقيط', 'chinguit']
  },
  {
    code: "OUA",
    name: "Ouadane",
    nameAr: "وادان",
    lat: 20.9333,
    lng: -11.6167,
    parentCode: "ADR",
    isCapital: false,
    economicImportance: 'local',
    population: 3000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['ouadane', 'وادان', 'wadane']
  },
  {
    code: "CHO",
    name: "Choum",
    nameAr: "شوم",
    lat: 21.2833,
    lng: -13.0333,
    parentCode: "ADR",
    isCapital: false,
    economicImportance: 'local',
    population: 2000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['choum', 'شوم']
  },
  {
    code: "AIN",
    name: "Ain Savra",
    nameAr: "عين صفرة",
    lat: 20.4167,
    lng: -12.9833,
    parentCode: "ADR",
    isCapital: false,
    economicImportance: 'local',
    population: 1500,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['ain savra', 'عين صفرة', 'savra']
  },

  // Assaba Region Cities
  {
    code: "KFA",
    name: "Kiffa",
    nameAr: "كيفة",
    lat: 16.6333,
    lng: -11.6167,
    parentCode: "ASA",
    isCapital: true,
    economicImportance: 'regional',
    population: 45000,
    hasAirport: true,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Sunday", "Wednesday"],
    searchTerms: CITY_TO_REGION_MAP['ASA']
  },
  {
    code: "GUE",
    name: "Guerou",
    nameAr: "كرو",
    lat: 16.8167,
    lng: -11.8333,
    parentCode: "ASA",
    isCapital: false,
    economicImportance: 'local',
    population: 15000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Monday", "Thursday"],
    searchTerms: ['guerou', 'كرو', 'kerou']
  },
  {
    code: "BAR",
    name: "Barkeol",
    nameAr: "باركيول",
    lat: 16.6333,
    lng: -11.8833,
    parentCode: "ASA",
    isCapital: false,
    economicImportance: 'local',
    population: 8000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['barkeol', 'باركيول', 'barkewol']
  },
  {
    code: "BOU",
    name: "Boumdeid",
    nameAr: "بومديد",
    lat: 17.4500,
    lng: -11.3500,
    parentCode: "ASA",
    isCapital: false,
    economicImportance: 'local',
    population: 6000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['boumdeid', 'بومديد', 'boumedid']
  },
  {
    code: "KAN",
    name: "Kankossa",
    nameAr: "كنكوصة",
    lat: 15.9333,
    lng: -11.5167,
    parentCode: "ASA",
    isCapital: false,
    economicImportance: 'local',
    population: 7000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['kankossa', 'كنكوصة', 'kankosa']
  },

  // Brakna Region Cities
  {
    code: "ALG",
    name: "Aleg",
    nameAr: "ألاك",
    lat: 17.0333,
    lng: -13.2833,
    parentCode: "BRK",
    isCapital: true,
    economicImportance: 'regional',
    population: 25000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Monday", "Thursday"],
    searchTerms: CITY_TO_REGION_MAP['BRK']
  },
  {
    code: "MGL",
    name: "Magta Lahjar",
    nameAr: "مكطع لحجار",
    lat: 17.5833,
    lng: -13.1333,
    parentCode: "BRK",
    isCapital: false,
    economicImportance: 'local',
    population: 18000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Tuesday", "Friday"],
    searchTerms: ['magta lahjar', 'مكطع لحجار', 'magta']
  },
  {
    code: "BOG",
    name: "Bogué",
    nameAr: "بوكي",
    lat: 16.5833,
    lng: -14.2667,
    parentCode: "BRK",
    isCapital: false,
    economicImportance: 'local',
    population: 20000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Wednesday", "Saturday"],
    searchTerms: ['bogué', 'boghe', 'بوكي']
  },
  {
    code: "MBA",
    name: "Mbagne",
    nameAr: "امبان",
    lat: 16.6167,
    lng: -13.3833,
    parentCode: "BRK",
    isCapital: false,
    economicImportance: 'local',
    population: 10000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['mbagne', 'امبان', 'mbaghne']
  },
  {
    code: "BAB",
    name: "Bababé",
    nameAr: "بابابي",
    lat: 16.3333,
    lng: -13.9500,
    parentCode: "BRK",
    isCapital: false,
    economicImportance: 'local',
    population: 12000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['bababé', 'بابابي', 'bababe']
  },

  // Gorgol Region Cities
  {
    code: "KED",
    name: "Kaédi",
    nameAr: "كيدي",
    lat: 16.1500,
    lng: -13.5000,
    parentCode: "GOG",
    isCapital: true,
    economicImportance: 'regional',
    population: 50000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Monday", "Thursday"],
    searchTerms: CITY_TO_REGION_MAP['GOG']
  },
  {
    code: "MAG",
    name: "Maghama",
    nameAr: "مقامة",
    lat: 16.0333,
    lng: -13.3333,
    parentCode: "GOG",
    isCapital: false,
    economicImportance: 'local',
    population: 15000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['maghama', 'مقامة']
  },
  {
    code: "MON",
    name: "Monguel",
    nameAr: "منكل",
    lat: 16.0833,
    lng: -13.0333,
    parentCode: "GOG",
    isCapital: false,
    economicImportance: 'local',
    population: 8000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['monguel', 'منكل']
  },
  {
    code: "LEX",
    name: "Lexeiba",
    nameAr: "الكسيبا",
    lat: 16.0833,
    lng: -12.8833,
    parentCode: "GOG",
    isCapital: false,
    economicImportance: 'local',
    population: 7000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['lexeiba', 'الكسيبا']
  },

  // Guidimaka Region Cities
  {
    code: "SLB",
    name: "Sélibabi",
    nameAr: "سليبابي",
    lat: 15.1667,
    lng: -12.2833,
    parentCode: "GDM",
    isCapital: true,
    economicImportance: 'regional',
    population: 20000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Saturday", "Wednesday"],
    searchTerms: CITY_TO_REGION_MAP['GDM']
  },
  {
    code: "GHA",
    name: "Ghabou",
    nameAr: "غابو",
    lat: 15.1667,
    lng: -12.1333,
    parentCode: "GDM",
    isCapital: false,
    economicImportance: 'local',
    population: 8000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['ghabou', 'غابو']
  },
  {
    code: "OYE",
    name: "Ould Yengé",
    nameAr: "ولد ينج",
    lat: 15.8833,
    lng: -11.9667,
    parentCode: "GDM",
    isCapital: false,
    economicImportance: 'local',
    population: 6000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['ould yengé', 'ولد ينج', 'ould yenge']
  },

  // Hodh Ech Chargui Region Cities
  {
    code: "NMA",
    name: "Néma",
    nameAr: "النعمة",
    lat: 16.6000,
    lng: -7.2500,
    parentCode: "HEC",
    isCapital: true,
    economicImportance: 'regional',
    population: 60000,
    hasAirport: true,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Tuesday", "Friday"],
    searchTerms: CITY_TO_REGION_MAP['HEC']
  },
  {
    code: "BAS",
    name: "Bassiknou",
    nameAr: "باسكنو",
    lat: 15.8500,
    lng: -5.9500,
    parentCode: "HEC",
    isCapital: false,
    economicImportance: 'local',
    population: 12000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['bassiknou', 'باسكنو']
  },
  {
    code: "AMO",
    name: "Amourj",
    nameAr: "آمرج",
    lat: 16.0333,
    lng: -7.1333,
    parentCode: "HEC",
    isCapital: false,
    economicImportance: 'local',
    population: 10000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['amourj', 'آمرج']
  },
  {
    code: "DJI",
    name: "Djiguenni",
    nameAr: "جكني",
    lat: 15.6833,
    lng: -8.7000,
    parentCode: "HEC",
    isCapital: false,
    economicImportance: 'local',
    population: 9000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['djiguenni', 'جكني']
  },
  {
    code: "TIM",
    name: "Timbedra",
    nameAr: "تمبدغة",
    lat: 16.2333,
    lng: -8.1667,
    parentCode: "HEC",
    isCapital: false,
    economicImportance: 'local',
    population: 15000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Monday", "Thursday"],
    searchTerms: ['timbedra', 'تمبدغة']
  },

  // Hodh El Gharbi Region Cities
  {
    code: "AEA",
    name: "Ayoun El Atrous",
    nameAr: "عيون العتروس",
    lat: 16.6833,
    lng: -9.6167,
    parentCode: "HEG",
    isCapital: true,
    economicImportance: 'regional',
    population: 40000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Sunday", "Wednesday"],
    searchTerms: CITY_TO_REGION_MAP['HEG']
  },
  {
    code: "TIN",
    name: "Tintane",
    nameAr: "الطينطان",
    lat: 16.4000,
    lng: -10.1667,
    parentCode: "HEG",
    isCapital: false,
    economicImportance: 'local',
    population: 20000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    marketDays: ["Tuesday", "Friday"],
    searchTerms: ['tintane', 'الطينطان']
  },
  {
    code: "KOB",
    name: "Kobani",
    nameAr: "كوبني",
    lat: 15.9833,
    lng: -9.4500,
    parentCode: "HEG",
    isCapital: false,
    economicImportance: 'local',
    population: 8000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['kobani', 'كوبني']
  },
  {
    code: "TAM",
    name: "Tamchekett",
    nameAr: "تمشكط",
    lat: 17.2333,
    lng: -10.6667,
    parentCode: "HEG",
    isCapital: false,
    economicImportance: 'local',
    population: 7000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['tamchekett', 'تمشكط']
  },

  // Inchiri Region Cities
  {
    code: "AKJ",
    name: "Akjoujt",
    nameAr: "أكجوجت",
    lat: 19.7398,
    lng: -14.3817,
    parentCode: "INC",
    isCapital: true,
    economicImportance: 'local',
    population: 15000,
    hasAirport: true,
    hasPort: false,
    hasUniversity: false,
    searchTerms: CITY_TO_REGION_MAP['INC']
  },
  {
    code: "BEN",
    name: "Benichab",
    nameAr: "بنشاب",
    lat: 19.4167,
    lng: -15.5667,
    parentCode: "INC",
    isCapital: false,
    economicImportance: 'local',
    population: 5000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['benichab', 'بنشاب']
  },

  // Tagant Region Cities
  {
    code: "TDJ",
    name: "Tidjikja",
    nameAr: "تيجيكجة",
    lat: 18.5500,
    lng: -11.5600,
    parentCode: "TGT",
    isCapital: true,
    economicImportance: 'regional',
    population: 25000,
    hasAirport: true,
    hasPort: false,
    hasUniversity: false,
    searchTerms: CITY_TO_REGION_MAP['TGT']
  },
  {
    code: "MOU",
    name: "Moudjéria",
    nameAr: "مجيرية",
    lat: 17.8833,
    lng: -12.3333,
    parentCode: "TGT",
    isCapital: false,
    economicImportance: 'local',
    population: 8000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['moudjéria', 'مجيرية', 'moudjeria']
  },
  {
    code: "RAC",
    name: "Rachid",
    nameAr: "رشيد",
    lat: 18.2333,
    lng: -11.6500,
    parentCode: "TGT",
    isCapital: false,
    economicImportance: 'local',
    population: 4000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['rachid', 'رشيد']
  },
  {
    code: "TIC",
    name: "Tichit",
    nameAr: "تيشيت",
    lat: 18.4333,
    lng: -9.5167,
    parentCode: "TGT",
    isCapital: false,
    economicImportance: 'local',
    population: 3000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['tichit', 'تيشيت']
  },

  // Tiris Zemmour Region Cities
  {
    code: "ZRT",
    name: "Zouérat",
    nameAr: "الزويرات",
    lat: 22.7333,
    lng: -12.4667,
    parentCode: "TRZ",
    isCapital: true,
    economicImportance: 'local',
    population: 30000,
    hasAirport: true,
    hasPort: false,
    hasUniversity: false,
    searchTerms: CITY_TO_REGION_MAP['TZM']
  },
  {
    code: "FDE",
    name: "Fdérick",
    nameAr: "افديرك",
    lat: 22.6833,
    lng: -12.7000,
    parentCode: "TRZ",
    isCapital: false,
    economicImportance: 'local',
    population: 5000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['fdérick', 'افديرك', 'fderik']
  },
  {
    code: "BIR",
    name: "Bir Moghrein",
    nameAr: "بير أم أكرين",
    lat: 25.2167,
    lng: -11.6167,
    parentCode: "TRZ",
    isCapital: false,
    economicImportance: 'local',
    population: 3000,
    hasAirport: true,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['bir moghrein', 'بير أم أكرين', 'bir um grein']
  },

  // Trarza Region Cities
  {
    code: "RSO",
    name: "Rosso",
    nameAr: "روصو",
    lat: 16.5167,
    lng: -12.8000,
    parentCode: "TRR",
    isCapital: true,
    economicImportance: 'regional',
    population: 35000,
    hasAirport: false,
    hasPort: true,
    hasUniversity: false,
    marketDays: ["Tuesday", "Friday"],
    searchTerms: CITY_TO_REGION_MAP['TRR']
  },
  {
    code: "BTL",
    name: "Boutilimit",
    nameAr: "بوتلميت",
    lat: 17.5500,
    lng: -14.7000,
    parentCode: "TRR",
    isCapital: false,
    economicImportance: 'local',
    population: 20000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: true,
    marketDays: ["Monday", "Thursday"],
    searchTerms: ['boutilimit', 'بوتلميت']
  },
  {
    code: "RKZ",
    name: "Rkiz",
    nameAr: "اركيز",
    lat: 16.5333,
    lng: -14.7667,
    parentCode: "TRR",
    isCapital: false,
    economicImportance: 'local',
    population: 15000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['rkiz', 'اركيز']
  },
  {
    code: "MED",
    name: "Mederdra",
    nameAr: "مدرذرة",
    lat: 16.9167,
    lng: -15.6500,
    parentCode: "TRR",
    isCapital: false,
    economicImportance: 'local',
    population: 10000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['mederdra', 'مدرذرة']
  },
  {
    code: "KEM",
    name: "Keur Macène",
    nameAr: "كور ماكيني",
    lat: 16.5833,
    lng: -15.8667,
    parentCode: "TRR",
    isCapital: false,
    economicImportance: 'local',
    population: 8000,
    hasAirport: false,
    hasPort: false,
    hasUniversity: false,
    searchTerms: ['keur macène', 'كور ماكيني', 'keur macene']
  }
];

// =================== UTILITY FUNCTIONS ===================

export function getWilayaByCode(code: string): Region | undefined {
  return MAURITANIA_REGIONS.find(region => region.code === code);
}

export function getCitiesByWilaya(wilayaCode: string): City[] {
  return MAURITANIA_CITIES.filter(city => city.parentCode === wilayaCode);
}

export function getCityByCode(code: string): City | undefined {
  return MAURITANIA_CITIES.find(city => city.code === code);
}

export function getWilayaCapital(wilayaCode: string): City | undefined {
  const wilaya = getWilayaByCode(wilayaCode);
  if (!wilaya) return undefined;
  
  return MAURITANIA_CITIES.find(city => 
    city.code === wilaya.capital && 
    city.parentCode === wilayaCode
  );
}

export function getMajorCities(): City[] {
  return MAURITANIA_CITIES.filter(city => 
    city.economicImportance === 'capital' || 
    city.economicImportance === 'economic' ||
    (city.population && city.population > 50000)
  );
}

export function getAllGeographicUnits(): (Region | City)[] {
  return [...MAURITANIA_REGIONS, ...MAURITANIA_CITIES];
}


export enum OperationalStatus {
  active = "active",
  inactive = "inactive",
  closed = "closed",
}


export interface Workspace {
  id: string;
  name: string;
  location: GeographicUnit;
  contact?: {
    manager: string;
    phone: string; // Mauritania format
  };
  facilities?: string[]; // ["warehouse", "dormitory"]
  status?: OperationalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeLine {
  start: Date; // Auto-set to Mauritania timezone
  end: Date;
  estimatedDuration?: number; // In days
}

export enum ProjectStatus {
  Planning = "Planning",
  InProgress = "InProgress",
  Pending = "Pending",
  OnHold = "OnHold",
  Suspended = "Suspended",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export interface ProjectBudget {
  total: number; // In MRU (auto-convert if USD entered)
  spent: number;
  currency: "MRU" | "USD"; // Defaults to MRU
  exchangeRate?: number; // For USD conversions
  lastUpdated: Date;
}

export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string; // Unique identifier
  name: string; // Display name ("Construction")
  slug: string; // URL-safe version ("construction")
  color?: string; // For UI display ("#FF5733")
  description?: string; // Additional context
  userId: string;
}

export enum UserRole {
  Admin = "admin",
  Manager = "manager",
  FieldAgent = "field_agent",
  Inspector = "inspector",
  Viewer = "viewer",
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string; // Mauritania format
  role: UserRole;
  image: string;
  workspaceIds: string[]; // Which workspaces they can access
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  Todo = "todo",
  Blocked = "blocked",
  InProgress = "inProgress",
  Done = "done",
}

export interface Task {
  id: string;
  deadline: Date; // Auto-adjust for Mauritania timezone
  assignedTo: string; // User ID
  projectId: string;
  title: string; // "Clear customs for drill parts"
  description?: string;
  status: TaskStatus;
  timeline: TimeLine;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialImage {
  id: string;
  url: string;
  materialId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedMaterial {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string; // "kg", "liters", "units", etc.
  minQuantity: number; // Alert when below this
  workspaceId: string; // Stock is workspace-specific
  workspace?: Workspace; // Populated workspace info
  location: GeographicUnit; // Where material is located
  timeline?: TimeLine; // Delivery/availability timeline
  lastRestock: Date; // Critical for import delays
  supplier?: {
    name: string;
    contact: string;
    leadTime: number; // Days for restocking
  };
  images: MaterialImage[];
  pricePerUnit: number;
  availableQuantity: number;
  originLocation?: string;
  createdAt: Date;
  updatedAt: Date;

  localisation: GeographicUnit[]; // Selected regions
  forme?: "polygon" | "rectangle" | "circle"; // Shape type
  adresse?: string; // Full address
}

export enum PaymentMethod {
  Cash = "cash",
  Bank = "bank",
  MobileMoney = "mobile_money",
  Hawala = "hawala",
}

export interface EnhancedPayment {
  id: string;
  amount: number;
  date: string; // ISO format
  method: PaymentMethod;
  progressAtPayment: number;
  reference: string; // Better than "transaction_id"
  recipient?: string; // Who received payment locally
  verifiedBy?: string; // User ID who verified
  notes?: string;
  attachments?: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export enum InspectionStatus {
  Approved = "Approved",
  RequiresChanges = "RequiresChanges",
  Rejected = "Rejected",
  Pending = "Pending",
}

export interface Inspector {
  id?: string; // If system user
  name: string;
  agency: string;
}

export interface EnhancedInspection {
  id: string;
  date: string;
  status: InspectionStatus;
  inspector: Inspector;
  progressAtInspection: number;
  comments?: string;
  documents?: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  Contract = "contract",
  Report = "report",
  Invoice = "invoice",
  Inspection = "inspection",
  Permit = "permit",
  Customs = "customs",
}

export enum DocumentFormat {
  Photo = "photo",
  Pdf = "pdf",
  Doc = "doc",
  Excel = "excel",
  CustomsForm = "customs_form",
}

export interface Document {
  id: string;
  type: DocumentType;
  format: DocumentFormat;
  url: string;
  name: string;
  uploadedBy: string; // User ID
  uploadedAt: Date;
  size: number; // KB
  description?: string;
  validityDate?: Date; // For permits, licenses
  createdAt: Date;
  updatedAt: Date;
}

export interface EnhancedProject {
  id: string;
  name: string;
  workspaceId: string;
  workspace?: Workspace;
  status: ProjectStatus;
  priority: Priority;
  budget: ProjectBudget;
  coordinates?: Coordinates;
  location: GeographicUnit;
  timeline: TimeLine;
  payments: EnhancedPayment[];
  inspections?: EnhancedInspection[];
  tags?: Tag[];
  createdAt: Date;
  updatedAt: Date;
}
