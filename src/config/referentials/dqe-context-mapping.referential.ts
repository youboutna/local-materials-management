export type DQEContext = 'project-dqe' | 'supplier-bid' | 'supplier-invoice' | 'tender-estimate';
export type DQEPartySource = 'project_organization' | 'supplier' | 'fixed_organization';

export interface DQEContextMapping {
  code: string;
  name: string;
  context: DQEContext;
  emitterSource: DQEPartySource;
  recipientSource: DQEPartySource;
  defaultEmitter?: { organizationId?: string; position?: string; department?: string };
  defaultRecipient?: { organizationId?: string; position?: string; department?: string };
  fieldMapping: { reference: string; date: string; object: string; project: string; phase?: string; milestone?: string; percentage?: string };
  pdfTemplate?: string;
}

export const DQE_CONTEXT_MAPPING: DQEContextMapping[] = [
  { code: 'EXPRESSION_BESOIN', name: 'Expression de Besoin', context: 'project-dqe', emitterSource: 'project_organization', recipientSource: 'fixed_organization', defaultRecipient: { organizationId: 'ORG-SOMELEC-001', position: 'Directeur des Achats', department: 'Direction des Achats' }, fieldMapping: { reference: 'EB-MPE-{{year}}-{{month}}-{{day}}', date: '{{currentDate}}', object: 'Expression de Besoin - {{projectTitle}}', project: '{{projectTitle}}', phase: '{{phaseName}}' }, pdfTemplate: 'TEMP-BESOIN-MPE-001' },
  { code: 'DEVIS_FOURNISSEUR', name: 'Devis Fournisseur', context: 'supplier-bid', emitterSource: 'supplier', recipientSource: 'project_organization', fieldMapping: { reference: 'DEV-{{year}}-{{month}}-{{day}}', date: '{{currentDate}}', object: 'Devis - {{projectTitle}}', project: '{{projectTitle}}' }, pdfTemplate: 'TEMP-DEVIS-SUPPLIER-001' },
  { code: 'FACTURE_DECOMPTE', name: 'Facture Décompte', context: 'supplier-invoice', emitterSource: 'supplier', recipientSource: 'project_organization', fieldMapping: { reference: 'FACT-{{year}}-{{month}}-{{day}}', date: '{{currentDate}}', object: 'Décompte {{percentage}}% - {{projectTitle}}', project: '{{projectTitle}}', phase: '{{phaseName}}', milestone: '{{milestoneName}}', percentage: '{{percentage}}' }, pdfTemplate: 'TEMP-FACTURE-SUPPLIER-001' },
];