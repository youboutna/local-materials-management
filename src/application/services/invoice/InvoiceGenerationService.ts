/**
 * InvoiceGenerationService — produit les sorties normalisées d'un document du
 * cycle DQE → Facture : PDF contextuel (BoqPdfRenderer) + XML Factur-X
 * (FacturXTransformer). Pure TS ; le téléchargement est délégué au
 * DocumentService BOQ.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { DocumentService, type DocumentContext } from '@/application/services/boq/DocumentService';
import { FacturXTransformer, type FacturXContext, type FacturXParty } from './FacturXTransformer';
import {
  getInvoiceDocumentType,
  type InvoiceDocumentType,
} from '@/config/referentials/invoices/invoice-document-types.referential';

export interface InvoiceGenerationInput {
  documentType: InvoiceDocumentType;
  lines: BoqLineDTO[];
  reference?: string;
  percentage?: number | null;
  fiscalProfileCode?: string | null;
  seller: FacturXParty;
  buyer: FacturXParty;
  /** Contexte PDF (titre, préfixe, entête organisation…). */
  documentContext: DocumentContext;
}

export interface InvoiceGenerationResult {
  pdf: { blob: Blob; filename: string };
  xml: { content: string; filename: string };
  facturxTypeCode: '310' | '380';
  totals: ReturnType<typeof FacturXTransformer.computeTotals>;
}

function refOf(type: InvoiceDocumentType, provided?: string): string {
  if (provided) return provided;
  const def = getInvoiceDocumentType(type);
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${def.code.toUpperCase()}-${stamp}`;
}

export const InvoiceGenerationService = {
  async generate(input: InvoiceGenerationInput): Promise<InvoiceGenerationResult> {
    const def = getInvoiceDocumentType(input.documentType);
    const reference = refOf(input.documentType, input.reference);

    const pdf = await DocumentService.generate(input.lines, {
      ...input.documentContext,
      title: input.documentContext.title || def.label,
      docPrefix: input.documentContext.docPrefix || def.code,
    });

    const ctx: FacturXContext = {
      documentType: def.code,
      reference,
      currency: undefined,
      fiscalProfileCode: input.fiscalProfileCode ?? null,
      seller: input.seller,
      buyer: input.buyer,
      percentage: input.percentage ?? null,
      note: input.documentContext.title ?? null,
    };
    const content = FacturXTransformer.toCiiXml(input.lines, ctx);

    return {
      pdf,
      xml: { content, filename: `${reference}-facturx.xml` },
      facturxTypeCode: def.facturxTypeCode,
      totals: FacturXTransformer.computeTotals(input.lines, input.fiscalProfileCode ?? null),
    };
  },

  /** Télécharge PDF + XML côté navigateur. */
  async generateAndDownload(input: InvoiceGenerationInput): Promise<InvoiceGenerationResult> {
    const res = await this.generate(input);
    DocumentService.download(res.pdf.blob, res.pdf.filename);
    DocumentService.download(
      new Blob([res.xml.content], { type: 'application/xml' }),
      res.xml.filename,
    );
    return res;
  },
};
