import type { ITechnicalPlanReader } from '@/domain/repositories/ITechnicalPlanReader';
import type { TechnicalPlanPageDTO } from '@/dtos/boq/TechnicalPlanDTO';
import { TECHNICAL_PLAN_POLICY } from '@/config/referentials/boq/technical-plan.referential';
import { pdfWorkerUrl } from '@/lib/pdf/pdfWorker';

/** PDF.js rasterization plus Tesseract's own worker for image-only pages. */
export class PdfTechnicalPlanReader implements ITechnicalPlanReader {
  async read(file: File): Promise<TechnicalPlanPageDTO[]> {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: TechnicalPlanPageDTO[] = [];
    let worker: Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>> | undefined;
    try {
      if (doc.numPages > TECHNICAL_PLAN_POLICY.maximumPages) throw new Error('Plan exceeds supported page count');
      for (let number = 1; number <= doc.numPages; number++) {
        const page = await doc.getPage(number);
        const content = await page.getTextContent();
        const text = content.items.map((item) => 'str' in item ? `${item.str}${item.hasEOL ? '\n' : ' '}` : '').join('');
        if (text.trim()) {
          pages.push({ page: number, text, source: 'text', confidence: 100 });
          continue;
        }
        const viewport = page.getViewport({ scale: TECHNICAL_PLAN_POLICY.renderScale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Plan canvas unavailable');
        await page.render({ canvasContext: context, viewport, canvas }).promise;
        if (!worker) worker = await (await import('tesseract.js')).createWorker('fra+eng');
        const result = await worker.recognize(canvas);
        pages.push({ page: number, text: result.data.text, confidence: result.data.confidence, source: 'ocr' });
        canvas.width = 0;
        canvas.height = 0;
      }
      return pages;
    } finally {
      await worker?.terminate();
      await doc.destroy();
    }
  }
}