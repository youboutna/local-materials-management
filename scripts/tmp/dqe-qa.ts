import { writeFileSync } from 'node:fs';
import { sampleDqeBoqLines } from '../../src/config/referentials/invoices/sample-dqe-boucle33kv.referential';
import { BoqPdfRenderer } from '../../src/application/services/boq/BoqPdfRenderer';
import { FacturXTransformer } from '../../src/application/services/invoice/FacturXTransformer';

const lines = sampleDqeBoqLines('boucle-33kv').map((l, i) =>
  i === 0 ? { ...l, designation: `L${i + 1}`, vatRate: null, createdAt: '2026-08-23T09:00:00Z' } : { ...l, createdAt: '2026-08-23T09:00:00Z' },
);

const blob = BoqPdfRenderer.render(lines as any, {
  title: 'Expression de besoin (DQE)',
  docPrefix: 'dqe',
  projectId: '45bcdfdc-1111-2222-3333-444455556666',
  projectTitle: 'Boucle 33 kV Kaédi',
  senderName: 'HadraTech BTP SARL',
  recipientName: 'SOMELEC — Direction des Achats',
  company: { name: 'HadraTech BTP SARL', address: 'Ilot K, Tevragh Zeina, Nouakchott', phone: '+222 45 00 00 00', email: 'contact@hadratech.mr' },
  documentStage: 'Expression de besoin',
  facturxTypeCode: '310',
  businessStatus: 'demande',
  signed: true,
  signedBy: 'Directeur technique',
  signedAt: '2026-08-24T10:00:00Z',
});
const buf = Buffer.from(await blob.arrayBuffer());
writeFileSync('/tmp/dqe-qa/dqe.pdf', buf);

const xml = FacturXTransformer.toCiiXml(lines as any, {
  documentType: 'facture',
  reference: 'FACTURE-20260823-XXXX',
  seller: { name: 'HadraTech BTP SARL', country: 'MR' },
  buyer: { name: 'SOMELEC', country: 'MR' },
});
writeFileSync('/tmp/dqe-qa/facturx.xml', xml);
console.log('OK');
