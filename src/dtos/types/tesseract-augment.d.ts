// TypeScript module augmentation for tesseract.js options used in our project
// This allows passthrough of engine parameters like preserve_interword_spaces
// without modifying implementation code.
declare module 'tesseract.js' {
  interface WorkerOptions {
    preserve_interword_spaces?: number;
    tessedit_pageseg_mode?: number;
  }
  interface CreateWorkerOptions {
    preserve_interword_spaces?: number;
    tessedit_pageseg_mode?: number;
  }
}
