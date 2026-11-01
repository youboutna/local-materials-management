import type { PlanningTextMappingDTO } from '@/dtos/entities/PlanningPreviewDTO';
import type { PlanningWorkbookMappingDTO } from '@/dtos/entities/PlanningWorkbookDTO';
/** Column preset only; monetary scale must be explicitly reviewed by the operator. */
export const DEFAULT_WORKBOOK_MAPPING: PlanningWorkbookMappingDTO = {
  codeColumn: 0, titleColumn: 1, responsibleColumn: 2, associatesColumn: 3,
  unitColumn: 4, quantityColumn: 5, unitPriceColumn: 6, amountColumn: 7,
  amountMultiplier: 1, codePattern: '^\\d+(?:[.\\-]\\d+)+[.\\-]?$',
  totalPattern: '^(?:total|sous[- ]?total|grand total)\\b',
  subComponentDepth: 2, headerRows: 3,
  titleCodePattern: '^(\\d+(?:\\.\\d+)+)\\.?\\s',
  financingGroupPattern: 'source\\s+de\\s+financement|^total$',
  periodPattern: '^(?:T\\d|[A-Z])$',
  thousandsPattern: 'mill',
  summarySheetPattern: '^\\s*r[ée]cap',
  componentPattern: '^\\s*composante\\s*(\\d+)',
  headerTitlePattern: '^(?:libell[ée]|activit[ée]s?|d[ée]signation|[IVX]+\\.\\s.+)$',
  arithmeticTolerance: 0.005,
  columnSynonyms: {
    code: '^(?:codes?|n[°o]|r[ée]f(?:[ée]rence)?|item)$',
    title: '^(?:libell[ée]s?|activit[ée]s?|d[ée]signations?|description|t[âa]ches?|intitul[ée])$',
    responsible: '^(?:responsables?|resp\\.?|pilote|ma[îi]tre d.ouvrage)$',
    associates: '^(?:associ[ée]s?|partenaires?|intervenants?|parties prenantes)$',
    unit: '^(?:unit[ée]s?|u)$',
    quantity: '^(?:qt[ée]s?|quantit[ée]s?|nombre|nb)$',
    unitPrice: '^(?:p\\.?\\s?u\\b.*|prix unitaire.*)$',
    amount: '^(?:p\\.?\\s?t\\b.*|montant.*|prix total.*|co[ûu]t total.*)$',
  },
  actorSeparatorPattern: '\\s*(?:/|,|;|\\+|\\bet\\b)\\s*',
  actorClassification: [
    { entityType: 'supplier', namePattern: 'consult|bureau\\s*d.?[ée]tudes?|^BE$|entreprise|fournisseur|prestataire|cabinet|op[ée]rateur' },
    { entityType: 'employee', namePattern: '^(?:UCP|UGP|UGP?\\b.*|coordonn|RSE|RSS|RAF|RPM|RSSE|SSE|S&E|expert|sp[ée]cialiste|charg[ée]|comptable|assistant|point\\s*focal|responsable)' },
    { entityType: 'community', namePattern: 'communaut|b[ée]n[ée]ficiaire|coop[ée]rative|^OP$|groupement|m[ée]nages?|population|femmes|jeunes', communityType: 'communautes_locales' },
  ],
};
/** Import vocabulary is configurable; this is only a French table mapping preset. */
export const DEFAULT_PLANNING_MAPPING: PlanningTextMappingDTO = {
  delimiter:'\t',phaseColumn:0,missionsColumn:1,scheduleColumn:2,deliverableColumn:3,
  weekPattern:'Semaines?\\s*(\\d+)(?:\\s*[-–à]\\s*(\\d+))?',
  postDeliveryPattern:'J\\+(\\d+)\\s*(?:à|[-–])\\s*J\\+(\\d+)',
  milestonePattern:'S(\\d+)',daysPerWeek:7,
};