import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  Upload,
  X,
  Trash2,
  Download,
  SkipForward,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import Papa from "papaparse";
import { toast } from "@/hooks/use-toast";
import { calculateAdvancedQuantities } from "@/utils/btpCalculations";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + "/pdf.worker.min.js";

interface Opening {
  id: string;
  length: number;
  width: number;
  height?: number;
}

interface CalculationResult {
  elementType: string;
  dimensions: {
    length: number;
    width?: number;
    height?: number;
  };
  openings?: Opening[];
  results: { [key: string]: number | string };
}

const elementTypes = [
  {
    value: "concrete_slab",
    label: "Dalle béton",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.05,
    heightStep: 0.01,
    heightPlaceholder: "0.15 (ex: 15cm)",
  },
  {
    value: "hollow_core_slab",
    label: "Plancher corps creux",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.04,
    heightStep: 0.01,
  },
  {
    value: "rebar",
    label: "Ferraillage",
    requires: ["length", "width"],
    defaultUnit: "m²",
  },
  {
    value: "masonry_wall",
    label: "Mur maçonnerie",
    requires: ["length", "height"],
    defaultUnit: "m²",
    minHeight: 0.1,
  },
  {
    value: "plaster",
    label: "Enduit",
    requires: ["length", "width"],
    defaultUnit: "m²",
  },
  {
    value: "beam",
    label: "Poutre",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.2,
  },
  {
    value: "column",
    label: "Poteau",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.2,
  },
  {
    value: "foundation",
    label: "Fondation",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.3,
  },
  {
    value: "staircase",
    label: "Escalier",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.15,
  },
];

// Helper to get element type object by value
const getElementTypeObj = (value: string) =>
  elementTypes.find((el) => el.value === value) || elementTypes[0];

// Format cement output for summary
function formatCementOutput(cementKg: number) {
  if (cementKg >= 50000) {
    return {
      label: "Ciment (tonnes)",
      value: (cementKg / 1000).toFixed(2),
      hint: "Commande en vrac recommandée",
    };
  } else {
    return {
      label: "Sacs de ciment (50kg)",
      value: Math.ceil(cementKg / 50),
      hint: "",
    };
  }
}

const AdvancedQuantityCalculator: React.FC = () => {
  // State form inputs
  const [elementType, setElementType] = useState<string>("concrete_slab");
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [currentOpening, setCurrentOpening] = useState<Opening>({
    id: "",
    length: 0,
    width: 0,
    height: 0,
  });
  const [showOpeningForm, setShowOpeningForm] = useState(false);

  // Calculations & parsing
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [parsedLines, setParsedLines] = useState<CalculationResult[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation helpers
  const currentElement = getElementTypeObj(elementType);

  const hasRequiredDimensions = () => {
    if (currentElement.requires.includes("length") && (isNaN(length) || length <= 0))
      return false;
    if (currentElement.requires.includes("width") && (isNaN(width) || width <= 0)) return false;
    if (currentElement.requires.includes("height")) {
      if (isNaN(height) || height <= 0) return false;
      if (currentElement.minHeight && height < currentElement.minHeight) {
        toast({
          title: "Attention",
          description: `La hauteur minimale pour ${currentElement.label} est ${currentElement.minHeight}m`,
          variant: "default",
        });
        return false;
      }
    }
    return true;
  };

  // Add opening to openings list
  const addOpening = () => {
    if (currentOpening.length <= 0 || currentOpening.width <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer des dimensions valides pour l'ouverture",
        variant: "destructive",
      });
      return;
    }
    setOpenings((o) => [
      ...o,
      {
        ...currentOpening,
        id: Math.random().toString(36).substring(7),
        height: elementType === "concrete_slab" ? currentOpening.height || height : undefined,
      },
    ]);
    setCurrentOpening({ id: "", length: 0, width: 0, height: 0 });
    setShowOpeningForm(false);
  };

  // Calculate quantities and add to calculations list
  const handleCalculate = () => {
    if (!hasRequiredDimensions()) return;

    const results = calculateAdvancedQuantities(
      currentElement.label,
      length,
      width,
      height,
      {
        openings: ["concrete_slab", "masonry_wall"].includes(elementType)
          ? openings
          : undefined,
      }
    );

    const newCalc: CalculationResult = {
      elementType: currentElement.label,
      dimensions: { length, width, height },
      openings: openings.length > 0 ? [...openings] : undefined,
      results,
    };

    setCalculations((prev) => [...prev, newCalc]);
    resetForm();
  };

  const resetForm = () => {
    setLength(0);
    setWidth(0);
    setHeight(0);
    setOpenings([]);
    setShowOpeningForm(false);
    setCurrentOpening({ id: "", length: 0, width: 0, height: 0 });
  };

  // Remove calculation by index
  const removeCalculation = (index: number) => {
    setCalculations((prev) => prev.filter((_, i) => i !== index));
  };

  // Totals by material
  const getTotalsByMaterial = () => {
    const totals: { [key: string]: number } = {};
    calculations.forEach((calc) => {
      Object.entries(calc.results).forEach(([key, val]) => {
        const materialKey = key.replace(/\([^)]*\)/g, "").trim();
        if (typeof val === "number") {
          totals[materialKey] = (totals[materialKey] || 0) + val;
        }
      });
    });
    return totals;
  };

  // PDF parsing + OCR fallback + extraction of lines (same as your original logic)
  const parsePdf = async (file: File): Promise<CalculationResult[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
      }

      if (fullText.trim().length < 20) {
        // OCR fallback
        fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport, canvas }).promise;

          const {
            data: { text: ocrText },
          } = await Tesseract.recognize(canvas, "fra", { logger: (m) => {} });
          fullText += ocrText + "\n";
        }
      }

      // Extraction logic of lines from text:
      const extractedLines = extractConstructionData(fullText);
      toast({ title: "Import réussi", description: `${extractedLines.length} lignes extraites.` });
      return extractedLines;
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur lors de la lecture du PDF", variant: "destructive" });
      console.error(error);
      return [];
    }
  };

  // Extraction of construction lines from raw text
  // You can keep your previous implementation or slightly adapted here:
  const extractConstructionData = (text: string): CalculationResult[] => {
    const lines = text
      .split(/(?=\d{1,2}\.[\d\.]?)/g)
      .map((l) => l.trim())
      .filter(Boolean);

    const results: CalculationResult[] = [];
    const pattern = /^(\d{1,2}\.?\d*)\s+(.+?)\s+(ff|m2|m3|ml|pce|pcs|m²|m³)\s+(\d+[\d\s,]*)\s+(\d+[\d\s,]*)\s+(\d+[\d\s,]*)$/i;

    for (const line of lines) {
      const match = line.match(pattern);
      if (match) {
        const [, , designation, unitRaw, qtyStr, puStr, ptStr] = match;
        const elementType = mapToElementType(designation.trim());
        const quantity = parseFloat(qtyStr.replace(/\s/g, "").replace(",", "."));
        results.push({
          elementType,
          dimensions: generateDimensionsFromQuantity(quantity, unitRaw),
          results: {
            Unité: unitRaw.trim(),
            Quantité: quantity,
            "Prix unitaire": parseFloat(puStr.replace(/\s/g, "").replace(",", ".")),
            "Prix total": parseFloat(ptStr.replace(/\s/g, "").replace(",", ".")),
          },
        });
      }
    }
    return results;
  };

  // Map description to element type
  const mapToElementType = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes("dalle") || d.includes("béton de propreté")) return "Dalle béton";
    if (d.includes("mur") || d.includes("maçonnerie")) return "Mur maçonnerie";
    if (d.includes("poutre")) return "Poutre";
    if (d.includes("poteau") || d.includes("colonne")) return "Poteau";
    if (d.includes("fondation") || d.includes("fouille")) return "Fondation";
    if (d.includes("plancher")) return "Plancher corps creux";
    if (d.includes("ferraillage") || d.includes("armé")) return "Ferraillage";
    if (d.includes("enduit") || d.includes("crépissage")) return "Enduit";
    if (d.includes("peinture") || d.includes("latex")) return "Peinture";
    if (d.includes("vernis") || d.includes("email")) return "Peinture";
    if (d.includes("carreau")) return "Revêtement sol";
    if (d.includes("trottoir")) return "Revêtement sol";
    if (d.includes("toiture") || d.includes("charpente")) return "Toiture";
    if (d.includes("porte") || d.includes("fenêtre")) return "Huissière";
    if (d.includes("clôture") || d.includes("grillage")) return "Clôture";
    if (d.includes("chauffe") || d.includes("eau") || d.includes("douche") || d.includes("wc")) return "Sanitaire";
    return desc;
  };

  // Generate dimensions from quantity and unit
  const generateDimensionsFromQuantity = (quantity: number, unit: string) => {
    switch (unit.toLowerCase()) {
      case "m²":
      case "m2": {
        const side = Math.sqrt(quantity);
        return { length: side, width: side };
      }
      case "m³":
      case "m3": {
        const cube = Math.cbrt(quantity);
        return { length: cube, width: cube, height: cube };
      }
      case "ml":
        return { length: quantity, width: undefined, height: undefined };
      default:
        return { length: quantity, width: 1, height: 1 };
    }
  };

  // Autofill next line from parsedLines
  const fillFormWithLine = (index: number) => {
    if (index >= parsedLines.length) return;
    const line = parsedLines[index];

    // Try to map elementType from label to value used in select:
    const foundType = elementTypes.find(
      (e) => e.label.toLowerCase() === line.elementType.toLowerCase()
    );
    if (foundType) setElementType(foundType.value);
    else setElementType("concrete_slab");

    setLength(line.dimensions.length || 0);
    setWidth(line.dimensions.width || 0);
    setHeight(line.dimensions.height || 0);
    setOpenings(line.openings || []);

    setCurrentLineIndex(index + 1);
  };

  // Add current form values to calculations (used for "Remplir la ligne suivante")
  const addCurrentFormToCalculations = () => {
    if (!hasRequiredDimensions()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir correctement les dimensions requises.",
        variant: "destructive",
      });
      return;
    }
    const results = calculateAdvancedQuantities(
      getElementTypeObj(elementType).label,
      length,
      width,
      height,
      {
        openings: ["concrete_slab", "masonry_wall"].includes(elementType)
          ? openings
          : undefined,
      }
    );
    const newCalc: CalculationResult = {
      elementType: getElementTypeObj(elementType).label,
      dimensions: { length, width, height },
      openings: openings.length > 0 ? [...openings] : undefined,
      results,
    };
    setCalculations((prev) => [...prev, newCalc]);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Calculateur de Métrés Avancé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Type d'élément</Label>
              <Select value={elementType} onValueChange={setElementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {elementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Longueur (m)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={length || ""}
                onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            {currentElement.requires.includes("width") && (
              <div>
                <Label>Largeur (m)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={width || ""}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            )}

            {currentElement.requires.includes("height") && (
              <div>
                <Label>Hauteur (m)</Label>
                <Input
                  type="number"
                  step={currentElement.heightStep || "0.01"}
                  min={currentElement.minHeight || "0.01"}
                  value={height || ""}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  placeholder={currentElement.heightPlaceholder || "0.00"}
                />
                {currentElement.minHeight && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: {currentElement.minHeight}m
                  </p>
                )}
              </div>
            )}
          </div>

          {(elementType === "concrete_slab" || elementType === "masonry_wall") && (
            <div className="mt-4">
              <Label>Ouvertures à déduire</Label>
              <div className="space-y-2">
                {openings.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {openings.map((o) => (
                      <Badge key={o.id} variant="outline" className="flex items-center gap-1">
                        {o.length}m x {o.width}m {o.height ? `x ${o.height}m` : ""}
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Supprimer ouverture"
                          onClick={() =>
                            setOpenings((prev) => prev.filter((oo) => oo.id !== o.id))
                          }
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                {!showOpeningForm && (
                  <Button onClick={() => setShowOpeningForm(true)}>Ajouter une ouverture</Button>
                )}
                {showOpeningForm && (
                  <div className="grid grid-cols-3 gap-2 items-end mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Longueur (m)"
                      value={currentOpening.length || ""}
                      onChange={(e) =>
                        setCurrentOpening((prev) => ({
                          ...prev,
                          length: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Largeur (m)"
                      value={currentOpening.width || ""}
                      onChange={(e) =>
                        setCurrentOpening((prev) => ({
                          ...prev,
                          width: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                    {elementType === "concrete_slab" && (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Hauteur (m)"
                        value={currentOpening.height || ""}
                        onChange={(e) =>
                          setCurrentOpening((prev) => ({
                            ...prev,
                            height: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    )}
                    <Button
                      variant="outline"
                      onClick={addOpening}
                      className="col-span-1"
                    >
                      Ajouter
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowOpeningForm(false)}
                      className="col-span-1"
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="default"
              onClick={handleCalculate}
              disabled={!hasRequiredDimensions()}
              leftIcon={<Calculator className="w-4 h-4" />}
            >
              Calculer et ajouter
            </Button>

            <Button
              variant="secondary"
              onClick={resetForm}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Réinitialiser
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Importer PDF
            </Button>

            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const results = await parsePdf(e.target.files[0]);
                  setParsedLines(results);
                  if (results.length > 0) fillFormWithLine(0);
                }
              }}
            />

            <Button
              variant="outline"
              disabled={parsedLines.length === 0 || currentLineIndex >= parsedLines.length}
              onClick={() => fillFormWithLine(currentLineIndex)}
              leftIcon={<SkipForward className="w-4 h-4" />}
            >
              Remplir ligne suivante
            </Button>

            <Button
              variant="destructive"
              onClick={() => setCalculations([])}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Tout effacer
            </Button>

            <Button
              variant="default"
              onClick={() => {
                if (calculations.length === 0) {
                  toast({ title: "Aucun calcul à exporter", variant: "destructive" });
                  return;
                }
                const csvData = calculations.map((calc, i) => ({
                  Ligne: i + 1,
                  Élément: calc.elementType,
                  Longueur: calc.dimensions.length.toFixed(2),
                  Largeur: calc.dimensions.width?.toFixed(2) || "",
                  Hauteur: calc.dimensions.height?.toFixed(2) || "",
                  Résultats: JSON.stringify(calc.results),
                }));
                const csv = Papa.unparse(csvData);
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "calculs_quantite.csv";
                link.click();
                URL.revokeObjectURL(link.href);
              }}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Exporter CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats des calculs ({calculations.length} éléments)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1">#</th>
                  <th className="border border-gray-300 px-2 py-1">Élément</th>
                  <th className="border border-gray-300 px-2 py-1">Dimensions (LxWxH m)</th>
                  <th className="border border-gray-300 px-2 py-1">Ouvertures</th>
                  <th className="border border-gray-300 px-2 py-1">Calculs</th>
                  <th className="border border-gray-300 px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1 text-center">{i + 1}</td>
                    <td className="border border-gray-300 px-2 py-1">{calc.elementType}</td>
                    <td className="border border-gray-300 px-2 py-1">
                      {calc.dimensions.length.toFixed(2)} x{" "}
                      {(calc.dimensions.width ?? 0).toFixed(2)} x{" "}
                      {(calc.dimensions.height ?? 0).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {calc.openings && calc.openings.length > 0
                        ? calc.openings
                            .map(
                              (o) =>
                                `${o.length.toFixed(2)}x${o.width.toFixed(2)}${o.height ? `x${o.height.toFixed(2)}` : ""
                                }`
                            )
                            .join(", ")
                        : "—"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {Object.entries(calc.results).map(([k, v]) => (
                        <div key={k}>
                          <b>{k}:</b> {typeof v === "number" ? v.toFixed(3) : v}
                        </div>
                      ))}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeCalculation(i)}
                        aria-label="Supprimer ce calcul"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Total matériaux estimés</h3>
            <div className="space-y-1">
              {Object.entries(getTotalsByMaterial()).map(([mat, val]) => {
                if (mat.toLowerCase().includes("ciment")) {
                  const cement = formatCementOutput(val);
                  return (
                    <div key={mat} className="flex justify-between">
                      <span>{cement.label}</span>
                      <span>{cement.value}</span>
                      <small className="text-muted-foreground">{cement.hint}</small>
                    </div>
                  );
                }
                return (
                  <div key={mat} className="flex justify-between">
                    <span>{mat}</span>
                    <span>{val.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedQuantityCalculator;
