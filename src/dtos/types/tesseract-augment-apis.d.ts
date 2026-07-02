// Additional tesseract.js type declarations to match runtime API used in the app
declare module 'tesseract.js' {
  export function createWorker(lang?: string, oem?: number, options?: any): Promise<any>;
  export function recognize(image: any, options?: any): Promise<{ data: { text: string } }>;
}
