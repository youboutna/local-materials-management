import * as pdfjsLib from "pdfjs-dist";
import Papa from "papaparse";
import type { CalculationResult,InvoiceLine } from "@/utils/types";

// PDF.js worker config
pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;


export async function parseDevisFromPdf(file: File): Promise<InvoiceLine[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item: any) => item.str).join(" ");
  }

  const lines = fullText.split("\n").filter(line => line.trim());
  return lines.map(line => {
    const parts = line.split(/\s+/).filter(part => part.trim());
    return {
      id: Math.random().toString(36).substring(7),
      numero: parts[0] || "",
      designation: parts.slice(1, -4).join(" "),
      unite: parts[parts.length - 4] || "",
      quantite: parseFloat(parts[parts.length - 3]?.replace(",", ".")) || 0,
      prixUnitaire: parseFloat(parts[parts.length - 2]?.replace(",", ".")) || 0,
      prixTotal: parseFloat(parts[parts.length - 1]?.replace(",", ".")) || 0,
    };
  });
}

export function exportCalculationsToCSV(calculations: CalculationResult[]) {
  const csvData = calculations.map((calc, i) => ({
    "N°": i + 1,
    "Type d'élément": calc.elementType,
    "Longueur (m)": calc.dimensions.length || "",
    "Largeur (m)": calc.dimensions.width || "",
    "Hauteur (m)": calc.dimensions.height || "",
    "Surface (m²)": calc.dimensions.area || "",
    "Quantité": calc.dimensions.count || "",
    "Capacité": calc.dimensions.capacity || "",
    "Profondeur (m)": calc.dimensions.depth || "",
    ...calc.results,
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
