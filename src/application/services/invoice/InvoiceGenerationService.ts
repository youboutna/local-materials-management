/**
 * InvoiceGenerationService — produit les sorties normalisées d'un document du
 * cycle DQE → Facture : PDF contextuel (BoqPdfRenderer) + XML Factur-X
 * (FacturXTransformer). Pure TS ; le téléchargement est délégué au
 * DocumentService BOQ.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { DocumentService, type DocumentContext } from '@/application/services/boq/DocumentService';
import { DocumentIdentityService } from '@/application/services/boq/DocumentIdentityService';
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

export const InvoiceGenerationService = {
  async generate(input: InvoiceGenerationInput): Promise<InvoiceGenerationResult> {
    const def = getInvoiceDocumentType(input.documentType);
    // D1 — référence normalisée `PREFIX-YYYYMMDD-XXXX` et date d'émission stable.
    const identity = DocumentIdentityService.resolve({
      docPrefix: input.documentContext.docPrefix || def.code,
      contextId: input.documentContext.contextId ?? input.documentContext.projectId,
      documentId: input.documentContext.documentId ?? null,
      lines: input.lines,
      reference: input.reference ?? null,
      issueDate: input.documentContext.issueDate ?? null,
    });
    const reference = identity.reference;


    const pdf = await DocumentService.generate(input.lines, {
      ...input.documentContext,
      title: input.documentContext.title || def.label,
      docPrefix: input.documentContext.docPrefix || def.code,
      // T6 — PDF contextuel : l'étape, le TypeCode et l'avancement facturé
      // proviennent du référentiel documentaire, jamais d'un libellé codé en dur.
      documentStage: input.documentContext.documentStage ?? def.label,
      facturxTypeCode: input.documentContext.facturxTypeCode ?? def.facturxTypeCode,
      businessStatus:
        input.documentContext.businessStatus ??
        (input.lines[0]?.businessStatus ?? def.initialStatus),
      billedPercentage: def.requiresPercentage
        ? input.percentage ?? input.lines[0]?.billedPercentage ?? null
        : input.documentContext.billedPercentage ?? null,
      fiscalProfileCode: input.fiscalProfileCode ?? input.documentContext.fiscalProfileCode ?? null,
      issueDate: identity.issueDateTimeIso,
      reference,
    });

    const ctx: FacturXContext = {
      documentType: def.code,
      reference,
      issueDate: identity.issueDateTimeIso,
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

  /**
   * Envoie le couple PDF + XML Factur-X au destinataire via le service de
   * communication central (Edge Function `send-email-notification`).
   */
  async generateAndEmail(
    input: InvoiceGenerationInput & { to: string; message?: string },
  ): Promise<{ ok: boolean; message?: string; result: InvoiceGenerationResult }> {
    const res = await this.generate(input);
    const def = getInvoiceDocumentType(input.documentType);

    const [{ CommunicationService }, { blobToBase64 }] = await Promise.all([
      import('@/application/services/CommunicationService'),
      import('@/utils/fileEncoding'),
    ]);

    const pdfB64 = await blobToBase64(res.pdf.blob);
    const xmlB64 = await blobToBase64(new Blob([res.xml.content], { type: 'application/xml' }));

    const body =
      input.message ??
      `Veuillez trouver ci-joint le document « ${def.label} » (${res.pdf.filename}) ` +
        `accompagné de son XML Factur-X (EN 16931, TypeCode ${def.facturxTypeCode}).`;

    const sent = await CommunicationService.sendEmail({
      to: input.to,
      subject: `${def.label} — ${input.documentContext.title || def.label}`,
      message: body,
      html: `<p>Bonjour,</p><p>${body}</p>`,
      actionType: 'invoice_document',
      metadata: {
        documentType: def.code,
        facturxTypeCode: def.facturxTypeCode,
        projectId: input.documentContext.projectId ?? null,
        tenderId: input.documentContext.tenderId ?? null,
      },
      attachments: [
        { filename: res.pdf.filename, content: pdfB64, contentType: 'application/pdf', encoding: 'base64' },
        { filename: res.xml.filename, content: xmlB64, contentType: 'application/xml', encoding: 'base64' },
      ],
    });

    return { ok: !!sent?.success, message: sent?.reference, result: res };
  },
};

