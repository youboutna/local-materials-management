import * as pdfjsLib from "pdfjs-dist";
// PDF.js worker — bundled via Vite so its version always matches pdfjs-dist.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

import Papa from "papaparse";
import type { CalculationResult, InvoiceLine } from "@/utils/types";

/**
 * Extract raw text from a PDF, reconstructing lines using each item's Y position
 * (transform[5]) instead of the naïve "\n" split which produced garbage on most
 * real PDFs (root cause of the previous "Impossible d'analyser le PDF" error).
 *
 * Returns one string per page joined by "\n". Callers can further split rows.
 */
export async function extractPdfTextByLines(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  const pagesText: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Group items by Y (line) — pdfjs items have transform = [a,b,c,d,x,y].
    const lines: Record<number, Array<{ x: number; str: string }>> = {};
    for (const raw of textContent.items as Array<{ str: string; transform: number[] }>) {
      if (!raw?.str) continue;
      const y = Math.round(raw.transform[5]); // integer bucket by pixel
      const x = raw.transform[4];
      if (!lines[y]) lines[y] = [];
      lines[y].push({ x, str: raw.str });
    }

    // Sort lines top-to-bottom (higher Y = higher on page in PDF space).
    const sortedYs = Object.keys(lines)
      .map((k) => Number(k))
      .sort((a, b) => b - a);

    const pageLines = sortedYs.map((y) =>
      lines[y]
        .sort((a, b) => a.x - b.x)
        .map((c) => c.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    );

    pagesText.push(pageLines.filter(Boolean).join('\n'));
  }

  return pagesText.join('\n');
}

export async function parseInvoiceFromPdf(file: File): Promise<InvoiceLine[]> {
  const fullText = await extractPdfTextByLines(file);
  const lines = fullText.split('\n').filter((l) => l.trim());

  if (lines.length === 0) {
    throw new Error(
      "Aucun texte exploitable détecté dans le PDF. Il s'agit peut-être d'un scan (image) — un fallback OCR sera proposé."
    );
  }

  return lines
    .map((line) => {
      const parts = line.split(/\s+/).filter(Boolean);
      if (parts.length < 5) return null; // not a real invoice row
      return {
        id: Math.random().toString(36).substring(7),
        number: parts[0] || '',
        designation: parts.slice(1, -4).join(' '),
        unit: parts[parts.length - 4] || '',
        quantity: parseFloat(parts[parts.length - 3]?.replace(',', '.')) || 0,
        unitPrice: parseFloat(parts[parts.length - 2]?.replace(',', '.')) || 0,
        totalPrice: parseFloat(parts[parts.length - 1]?.replace(',', '.')) || 0,
      } as InvoiceLine;
    })
    .filter((l): l is InvoiceLine => l !== null);
}

export function exportCalculationsToCSV(calculations: CalculationResult[]) {
  const csvData = calculations.map((calc, i) => ({
    "N°": i + 1,
    "Type d'élément": calc.elementType || "",
    "Longueur (m)": calc.dimensions?.length || "",
    "Largeur (m)": calc.dimensions?.width || "",
    "Hauteur (m)": calc.dimensions?.height || "",
    "Surface (m²)": (calc.dimensions?.length && calc.dimensions?.width)
      ? ((calc.dimensions.length as number) * (calc.dimensions.width as number)).toFixed(2)
      : "",
    "Quantité": calc.dimensions?.count || "",
    "Capacité": "",
    "Profondeur (m)": "",
    ...calc.results || {},
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "calculs_quantitatifs.csv";
  link.click();
  URL.revokeObjectURL(url);
}
