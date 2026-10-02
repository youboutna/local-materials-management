/** URL du worker PDF.js résolue et copiée par Vite (dev + prod, hash inclus). */
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
// Trace de diagnostic pour vérifier le worker en production (F12 → Console).
console.info(`[pdfjs] worker: ${pdfWorkerUrl}`);
export { pdfWorkerUrl };
