/**
 * FacturXPdfService — embarque le XML CII (EN 16931 / Factur-X) dans le PDF
 * généré, conformément à la norme : fichier attaché `factur-x.xml` avec
 * relation `Data`. Pure TS, aucune dépendance React.
 */
import { PDFDocument, AFRelationship } from 'pdf-lib';

export const FACTURX_ATTACHMENT_NAME = 'factur-x.xml';

export const FacturXPdfService = {
  /**
   * Retourne un nouveau Blob PDF contenant le XML Factur-X en pièce jointe.
   * En cas d'échec (PDF non ré-ouvrable), le PDF d'origine est renvoyé.
   */
  async embed(pdf: Blob, xml: string): Promise<Blob> {
    try {
      const bytes = new Uint8Array(await pdf.arrayBuffer());
      const doc = await PDFDocument.load(bytes);
      doc.attach(new TextEncoder().encode(xml), FACTURX_ATTACHMENT_NAME, {
        mimeType: 'application/xml',
        description: 'Factur-X / EN 16931 invoice data',
        creationDate: new Date(),
        modificationDate: new Date(),
        afRelationship: AFRelationship.Data,
      });
      const out = await doc.save();
      return new Blob([out], { type: 'application/pdf' });
    } catch {
      return pdf;
    }
  },
};

export default FacturXPdfService;
