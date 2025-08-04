import React, { useState, useRef, useCallback, useEffect } from "react";
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
import {
  Opening,
  CalculationResult,
  InvoiceLine,
  STANDARD_OPENINGS,
  elementTypes,
} from "@/utils/types";

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  window.location.origin + "/pdf.worker.min.js";

// --- Helper functions ---
// Synonyms and semantic links for element types
const elementTypeSynonyms: { [key: string]: string[] } = {
  concrete_slab: [
    "dalle béton", "dalle", "slab", "béton de dalle", "fondation", "foundation", "radier", "dalle de fondation"
  ],
  site_preparation: [
    "décapage", "terre végétale", "prise en possession", "préparation du terrain", "débroussaillage", "site preparation", "topsoil", "pm"
  ],
  excavation: [
    "fouille", "fouilles", "pleine masse", "rigoles", "tranchée", "excavation"
  ],
  foundation: [
    "fondation", "semelle", "semelle filante", "semelle isolée"
  ],
  hollow_core_slab: [
    "plancher", "hourdis", "poutrelles", "dalle de compression"
  ],
  masonry_wall: [
    "mur", "maçonnerie", "agglomérés", "parpaing", "bloc ciment", "cloison", "refend"
  ],
  roof_covering: [
    "couverture", "zinguerie", "tôles", "ardoise", "faitage", "sous toiture", "bardage"
  ],
  metal_gutter: [
    "gouttière", "descente", "zinc"
  ],
  wooden_roof_structure: [
    "charpente", "fermette", "bois lamellé-collé", "ossature bois"
  ],
  tiling: [
    "carrelage", "faience", "carreaux"
  ],
  painting: [
    "peinture", "parquet", "vernis"
  ],
  plumbing_installation: [
    "plomberie", "sanitaire", "eaux usées", "alimentation EF", "tube cuivre", "PER", "robinet"
  ],
  electrical_installation: [
    "électricité", "chauffage", "tableau électrique", "prise", "lumière", "convecteur", "VMC", "câblage"
  ],
  gate: [
    "porte d'entrée", "portail", "porte de service"
  ],
  fence: [
    "clôture", "grillage"
  ],
  landscaping: [
    "assainissement", "fosse", "épandage", "drains", "plantation", "jardin"
  ],
  architectural_plan: [
    "plan architectural", "plan d'architecte", "plan de masse", "plan de maison", "plan", "façade", "élévation", "coupe", "vue", "dessin", "implantation", "schéma", "layout", "drawing", "floor plan"
  ],
  // ...add more as needed for all elementTypes...
};

// Enhanced semantic mapping function
const mapToElementType = (desc: string) => {
  const d = desc.toLowerCase();
  // 1. Check synonyms mapping
  for (const [type, synonyms] of Object.entries(elementTypeSynonyms)) {
    if (synonyms.some(syn => d.includes(syn))) {
      return type;
    }
  }
  // 2. Fallback: check elementTypes label/value
  const found = elementTypes.find(
    et =>
      d.includes(et.label.toLowerCase()) ||
      d.includes(et.value.replace(/_/g, " "))
  );
  return found ? found.value : "concrete_slab";
};
const detectElementType = (designation: string) => {
  if (!designation || typeof designation !== "string") return "concrete_slab";
  const d = designation.toLowerCase();
  if (d.includes("décapage") || d.includes("terre végétale") || d.includes("prise en possession")) return "site_preparation";
  if (d.includes("dalle") || d.includes("béton de propreté")) return "concrete_slab";
  if (d.includes("plancher") || d.includes("corps creux")) return "hollow_core_slab";
  if (d.includes("ferraillage") || d.includes("armé")) return "rebar";
  if (d.includes("mur") || d.includes("maçonnerie")) return "masonry_wall";
  if (d.includes("enduit") || d.includes("crépissage")) return "plaster";
  if (d.includes("poutre")) return "beam";
  if (d.includes("poteau") || d.includes("colonne")) return "column";
  if (d.includes("fondation") || d.includes("fouille")) return "foundation";
  if (d.includes("escalier")) return "staircase";
  if (d.includes("préparation") || d.includes("terrain")) return "site_preparation";
  if (d.includes("excavation")) return "excavation";
  if (d.includes("béton de propreté")) return "lean_concrete";
  if (d.includes("maçonnerie de fondation")) return "foundation_masonry";
  if (d.includes("chape")) return "foundation_chape";
  if (d.includes("roofing") || d.includes("isolation")) return "roof_insulation";
  if (d.includes("blocs ciment")) return "cement_block_masonry";
  if (d.includes("béton armé")) return "reinforced_concrete";
  if (d.includes("charpente") || d.includes("bois")) return "wooden_roof_structure";
  if (d.includes("gouttière")) return "metal_gutter";
  if (d.includes("couverture") || d.includes("zinguerie") || d.includes("tôles") || d.includes("ardoise")) return "roof_covering";
  if (d.includes("carreaux") || d.includes("revêtement")) return "tiling";
  if (d.includes("plafond") || d.includes("planchettes")) return "wooden_ceiling";
  if (d.includes("porte métallique") || d.includes("fenêtre métallique")) return "metal_doors_windows";
  if (d.includes("porte bois") || d.includes("porte en bois")) return "wooden_doors";
  if (d.includes("balustrade")) return "balustrade";
  if (d.includes("électrique") || d.includes("installation électrique")) return "electrical_installation";
  if (d.includes("sanitaire") || d.includes("plomberie")) return "plumbing_installation";
  if (d.includes("fosse septique")) return "septic_tank";
  if (d.includes("peinture")) return "painting";
  if (d.includes("clôture")) return "fence";
  if (d.includes("portail")) return "gate";
  if (d.includes("paysager") || d.includes("aménagement")) return "landscaping";
  return "concrete_slab";
};

const formatCementOutput = (cementKg: number) => {
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
};

// Extraction of construction lines from raw text
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
      const unitPrice = parseFloat(puStr.replace(/\s/g, "").replace(",", "."));
      let prixTotal = parseFloat(ptStr.replace(/\s/g, "").replace(",", "."));
      if (!prixTotal || prixTotal === 0) {
        prixTotal = quantity * unitPrice;
      }

      // Set recommended openings for types that support it
      let openings: Opening[] | undefined = undefined;
      if (
        ["concrete_slab", "masonry_wall"].includes(elementType)
      ) {
        openings = STANDARD_OPENINGS;
      }

      results.push({
        elementType,
        originalLabel: designation.trim(), // <-- add this line
        dimensions: generateDimensionsFromQuantity(quantity, unitRaw),
        openings,
        results: {
          Unité: unitRaw.trim(),
          Quantité: quantity,
          "Prix unitaire": unitPrice,
          "Prix total": prixTotal,
        },
      });
    }
  }
  return results;
};

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

// --- Main Component ---
const AdvancedQuantityCalculator: React.FC = () => {
  // --- State ---
  const [form, setForm] = useState({
    elementType: "concrete_slab",
    length: 0,
    width: 0,
    height: 0,
    area: 0,
    count: 0,
    capacity: 0,
    depth: 0,
    openings: [] as Opening[],
  });
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showOpeningForm, setShowOpeningForm] = useState(false);
  const [currentOpening, setCurrentOpening] = useState<Opening>({
    id: "",
    length: 0,
    width: 0,
    height: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add to component state
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    length: number;
    width?: number;
    height?: number;
    openings: Opening[];
  }>({ length: 0, width: 0, height: 0, openings: [] });
  const [editOpening, setEditOpening] = useState<Opening>({ id: "", length: 0, width: 0, height: 0 });
  const [showEditOpeningForm, setShowEditOpeningForm] = useState(false);
  const [planMessage, setPlanMessage] = useState<string | null>(null);

  // --- Derived ---
  const currentElement = elementTypes.find(
    (el) => el.value === form.elementType
  ) || elementTypes[0];

  // --- Handlers ---
  const resetForm = () => {
    setForm({
      elementType: "concrete_slab",
      length: 0,
      width: 0,
      height: 0,
      area: 0,
      count: 0,
      capacity: 0,
      depth: 0,
      openings: [],
    });
  };

  const hasRequiredDimensions = useCallback(() => {
    return currentElement.requires.every((req) => {
      return form[req as keyof typeof form] > 0;
    });
  }, [currentElement, form]);

  const fillFormWithLine = useCallback(
    (index: number) => {
      if (index >= invoiceLines.length) return;
      const line = invoiceLines[index];
      resetForm();
      const detectedType = detectElementType(line.designation || "");
      let updates: Partial<typeof form> = { elementType: detectedType };
      switch (line.unit.toLowerCase()) {
        case "m²":
          updates.area = line.quantity;
          updates.length = Math.sqrt(line.quantity);
          updates.width = Math.sqrt(line.quantity);
          break;
        case "m³":
          updates.length = Math.cbrt(line.quantity);
          updates.width = Math.cbrt(line.quantity);
          updates.height = Math.cbrt(line.quantity);
          break;
        case "ml":
          updates.length = line.quantity;
          break;
        case "pce":
          updates.count = line.quantity;
          break;
        default:
          updates.length = line.quantity;
      }
      setForm((prev) => ({ ...prev, ...updates }));
    },
    [invoiceLines]
  );

  const addOpening = () => {
    if (currentOpening.length <= 0 || currentOpening.width <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer des dimensions valides pour l'ouverture",
        variant: "destructive",
      });
      return;
    }
    setForm((prev) => ({
      ...prev,
      openings: [
        ...prev.openings,
        {
          ...currentOpening,
          id: Math.random().toString(36).substring(7),
          height:
            form.elementType === "concrete_slab"
              ? currentOpening.height || form.height
              : undefined,
        },
      ],
    }));
    setCurrentOpening({ id: "", length: 0, width: 0, height: 0 });
    setShowOpeningForm(false);
  };

  const removeOpening = (id: string) => {
    setForm((prev) => ({
      ...prev,
      openings: prev.openings.filter((o) => o.id !== id),
    }));
  };

  const handleCalculate = () => {
    if (!hasRequiredDimensions()) return;
    const result = calculateAdvancedQuantities(
      currentElement.label,
      form.length,
      form.width,
      form.height,
      {
        openings: ["concrete_slab", "masonry_wall"].includes(form.elementType)
          ? form.openings
          : undefined,
      }
    );
    setCalculations((prev) => [...prev, result]);
    resetForm();
  };

  const removeCalculation = (index: number) => {
    setCalculations((prev) => prev.filter((_, i) => i !== index));
  };

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
          } = await Tesseract.recognize(canvas, "fra", { logger: () => {} });
          fullText += ocrText + "\n";
        }
      }

      if (isArchitecturalPlan(fullText)) {
        setPlanMessage("Plan architectural détecté : ce document semble être un plan. L'extraction quantitative n'est pas applicable.");
        //return [];
      }
      setPlanMessage(null);

      // Use the helper to extract lines
      const extractedLines = extractConstructionData(fullText);
      toast({ title: "Import réussi", description: `${extractedLines.length} lignes extraites.` });
      return extractedLines;
    } catch (error) {
      toast({ title: "Erreur", description: "Erreur lors de la lecture du PDF", variant: "destructive" });
      console.error(error);
      return [];
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const parsedLines = await parsePdf(e.target.files[0]);
      if (parsedLines.length > 0) {
        setCalculations(parsedLines);
        // Optionally autofill the form with the first line:
        // fillFormWithLine(0);
        // setCurrentLineIndex(0);
      }
    }
  };

  const exportToCSV = () => {
    if (calculations.length === 0) {
      toast({ title: "Aucun calcul à exporter", variant: "destructive" });
      return;
    }
    const csvData = calculations.map((calc, i) => ({
      "Ligne": i + 1,
      "Élément": getElementLabel(calc.elementType), // Use label here
      "Type interne": calc.elementType, // (optional, for debugging)
      "Longueur (m)": calc.dimensions.length ?? "",
      "Largeur (m)": calc.dimensions.width ?? "",
      "Hauteur (m)": calc.dimensions.height ?? "",
      "Surface (m²)": calc.dimensions.area ?? "",
      "Quantité": calc.dimensions.count ?? "",
      "Capacité": calc.dimensions.capacity ?? "",
      "Profondeur (m)": calc.dimensions.depth ?? "",
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
  };

  const handleSaveEdit = () => {
    if (editIndex === null) return;
    const calc = calculations[editIndex];
    const result = calculateAdvancedQuantities(
      calc.elementType,
      editForm.length,
      editForm.width,
      editForm.height,
      { openings: editForm.openings }
    );
    const updated = { ...result, elementType: calc.elementType }; // preserve original elementType
    setCalculations((prev) =>
      prev.map((c, i) => (i === editIndex ? updated : c))
    );
    setEditIndex(null);
  };

  // --- Handlers (continued) ---
  const handleEdit = (i: number) => {
    const calc = calculations[i];
    setEditIndex(i);
    setEditForm({
      length: calc.dimensions.length,
      width: calc.dimensions.width,
      height: calc.dimensions.height,
      openings: calc.openings ? [...calc.openings] : [],
    });
    setShowEditOpeningForm(false);
  };

  // --- Effects ---
  useEffect(() => {
    if (invoiceLines.length > 0) {
      fillFormWithLine(0);
      setCurrentLineIndex(0);
    }
  }, [invoiceLines, fillFormWithLine]);

  useEffect(() => {
    if (
      ["concrete_slab", "masonry_wall"].includes(form.elementType) &&
      (!form.openings || form.openings.length === 0)
    ) {
      setForm(f => ({ ...f, openings: STANDARD_OPENINGS }));
    }
    // eslint-disable-next-line
  }, [form.elementType]);

  // --- Render ---
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
              <Select
                value={form.elementType}
                onValueChange={(v) => setForm((f) => ({ ...f, elementType: v }))}
              >
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
                value={form.length || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    length: parseFloat(e.target.value) || 0,
                  }))
                }
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
                  value={form.width || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      width: parseFloat(e.target.value) || 0,
                    }))
                  }
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
                  value={form.height || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      height: parseFloat(e.target.value) || 0,
                    }))
                  }
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
          {(form.elementType === "concrete_slab" ||
            form.elementType === "masonry_wall") && (
            <div className="mt-4">
              <Label>Ouvertures à déduire</Label>
              <div className="space-y-2">
                {form.openings.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.openings.map((o) => (
                      <Badge
                        key={o.id}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {o.length}m x {o.width}m{" "}
                        {o.height ? `x ${o.height}m` : ""}
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Supprimer ouverture"
                          onClick={() => removeOpening(o.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                {!showOpeningForm && (
                  <Button onClick={() => setShowOpeningForm(true)}>
                    Ajouter une ouverture
                  </Button>
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
                    {form.elementType === "concrete_slab" && (
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
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculer et ajouter
            </Button>
            <Button variant="secondary" onClick={resetForm}>
              <Trash2 className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer PDF
            </Button>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              disabled={invoiceLines.length === 0 || currentLineIndex >= invoiceLines.length}
              onClick={() => {
                fillFormWithLine(currentLineIndex + 1);
                setCurrentLineIndex((i) => i + 1);
              }}
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Remplir ligne suivante
            </Button>
            <Button variant="destructive" onClick={() => setCalculations([])}>
              <Trash2 className="w-4 h-4 mr-2" />
              Tout effacer
            </Button>
            <Button variant="default" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Résultats */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Résultats des calculs ({calculations.length} éléments)
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1">#</th>
                  <th className="border border-gray-300 px-2 py-1">Élément</th>
                  <th className="border border-gray-300 px-2 py-1">Désignation d'origine</th> {/* NEW */}
                  <th className="border border-gray-300 px-2 py-1">
                    Dimensions (LxWxH m)
                  </th>
                  <th className="border border-gray-300 px-2 py-1">
                    Ouvertures
                  </th>
                  <th className="border border-gray-300 px-2 py-1">Calculs</th>
                  <th className="border border-gray-300 px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {calculations.map((calc, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1 text-center">{i + 1}</td>
                    <td className="border border-gray-300 px-2 py-1">{getElementLabel(calc.elementType)}</td>
                    <td className="border border-gray-300 px-2 py-1">{calc?.originalLabel || "—"}</td> {/* NEW */}
                    <td className="border border-gray-300 px-2 py-1">
                      {calc.dimensions.length?.toFixed(2)} x {(calc.dimensions.width ?? 0).toFixed(2)} x {(calc.dimensions.height ?? 0).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {calc.openings && calc.openings.length > 0
                        ? calc.openings.map(
                            (o) =>
                              `${o.length.toFixed(2)}x${o.width.toFixed(2)}` + (o.height ? `x${o.height.toFixed(2)}` : "")
                          ).join(", ")
                        : "—"}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      {Object.entries(calc.results).map(([k, v]) => (
                        <div key={k} className={k.toLowerCase().includes("prix total") && Number(v) === 0 ? "text-red-600 font-bold" : ""}>
                          <b>{k}:</b> {typeof v === "number" ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v}
                          {k.toLowerCase().includes("prix total") && Number(v) === 0 && (
                            <span className="ml-2 text-xs text-red-500">⚠️ Vérifiez le prix unitaire ou la quantité</span>
                          )}
                        </div>
                      ))}
                      {getRecommendations(calc.elementType) && (
                        <div className="mt-2 p-2 bg-blue-50 rounded">
                          <b>Recommandations :</b>
                          {getRecommendations(calc.elementType)}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center">
                      {editIndex === i ? (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={editForm.length}
                            onChange={e =>
                              setEditForm(f => ({
                                ...f,
                                length: parseFloat(e.target.value) || 0,
                              }))
                            }
                            placeholder="Longueur"
                          />
                          {typeof editForm.width !== "undefined" && (
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editForm.width}
                              onChange={e =>
                                setEditForm(f => ({
                                  ...f,
                                  width: parseFloat(e.target.value) || 0,
                                }))
                              }
                              placeholder="Largeur"
                            />
                          )}
                          {typeof editForm.height !== "undefined" && (
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={editForm.height}
                              onChange={e =>
                                setEditForm(f => ({
                                  ...f,
                                  height: parseFloat(e.target.value) || 0,
                                }))
                              }
                              placeholder="Hauteur"
                            />
                          )}
                          {/* Openings display and add */}
                          <div>
                            {editForm.openings.map((o, oi) => (
                              <Badge key={o.id} className="mr-1">
                                {o.length}x{o.width}
                                {o.height ? `x${o.height}` : ""}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() =>
                                    setEditForm(f => ({
                                      ...f,
                                      openings: f.openings.filter((_, idx) => idx !== oi),
                                    }))
                                  }
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                            ))}
                            {!showEditOpeningForm && (
                              <Button size="sm" onClick={() => setShowEditOpeningForm(true)}>
                                Ajouter ouverture
                              </Button>
                            )}
                            {showEditOpeningForm && (
                              <div className="flex gap-1 mt-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="L"
                                  value={editOpening.length || ""}
                                  onChange={e =>
                                    setEditOpening(o => ({
                                      ...o,
                                      length: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="l"
                                  value={editOpening.width || ""}
                                  onChange={e =>
                                    setEditOpening(o => ({
                                      ...o,
                                      width: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="h"
                                  value={editOpening.height || ""}
                                  onChange={e =>
                                    setEditOpening(o => ({
                                      ...o,
                                      height: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditForm(f => ({
                                      ...f,
                                      openings: [
                                        ...f.openings,
                                        {
                                          ...editOpening,
                                          id: Math.random().toString(36).substring(7),
                                        },
                                      ],
                                    }));
                                    setEditOpening({ id: "", length: 0, width: 0, height: 0 });
                                    setShowEditOpeningForm(false);
                                  }}
                                >
                                  OK
                                </Button>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Button size="sm" variant="default" onClick={handleSaveEdit}>
                              Valider
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditIndex(null)}>
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(i)}
                            aria-label="Éditer"
                          >
                            <span role="img" aria-label="edit">✏️</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeCalculation(i)}
                            aria-label="Supprimer"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">
              Total matériaux estimés
            </h3>
            <div className="space-y-1">
              {Object.entries(getTotalsByMaterial()).map(([mat, val]) => {
                if (mat.toLowerCase().includes("ciment")) {
                  const cement = formatCementOutput(val);
                  return (
                    <div key={mat} className="flex justify-between">
                      <span>{cement.label}</span>
                      <span>{cement.value}</span>
                      <small className="text-muted-foreground">
                        {cement.hint}
                      </small>
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
      {/* Recommendations */}
      {form.elementType && (
        <Card>
          <CardHeader>
            <CardTitle>Recommandations pour {getElementLabel(form.elementType)}</CardTitle>
          </CardHeader>
          <CardContent>
            {getRecommendations(form.elementType)}
          </CardContent>
        </Card>
      )}
      {planMessage && (
        <aside className="fixed right-0 top-20 w-80 bg-blue-50 border-l border-blue-200 shadow-lg p-4 z-50">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-blue-900">Information</span>
            <Button size="icon" variant="ghost" onClick={() => setPlanMessage(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-blue-900">{planMessage}</div>
        </aside>
      )}
    </div>
  );
};

const getElementLabel = (value: string) => {
  const found = elementTypes.find(e => e.value === value);
  return found ? found.label : value;
};

const getInvoiceLineLabel = (designation: string) => {
  const type = mapToElementType(designation);
  return getElementLabel(type);
};

// Usage in your invoice table:
// <td>{getInvoiceLineLabel(line.designation)}</td>

const getRecommendations = (elementType: string) => {
  switch (elementType) {
    case "concrete_slab":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Épaisseur recommandée : 15 cm (0.15 m) pour dalle courante</li>
          <li>Classe de béton : C25/30</li>
          <li>Dosage ciment : 350 kg/m³</li>
          <li>Ferraillage minimal : ST25C ou équivalent</li>
        </ul>
      );
    case "lean_concrete":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Épaisseur courante : 5 à 10 cm</li>
          <li>Classe de béton : C12/15</li>
          <li>Utilisé comme couche de propreté sous fondations</li>
          <li>Dosage ciment : 200 à 250 kg/m³</li>
        </ul>
      );
    case "foundation":
      return (
        <ul className="list-disc ml-4 text-xs text-orange-900">
          <li>Profondeur selon étude de sol (généralement ≥ 0.8 m)</li>
          <li>Largeur minimale : 40 cm</li>
          <li>Utiliser béton de propreté en fond de fouille</li>
        </ul>
      );
    case "foundation_masonry":
      return (
        <ul className="list-disc ml-4 text-xs text-orange-900">
          <li>Utiliser blocs ou pierres de fondation</li>
          <li>Épaisseur minimale : 30 cm</li>
          <li>Jointement au mortier dosé à 400 kg/m³</li>
        </ul>
      );
    case "foundation_chape":
      return (
        <ul className="list-disc ml-4 text-xs text-orange-900">
          <li>Chape de propreté sur fondation</li>
          <li>Épaisseur courante : 2 à 3 cm</li>
          <li>Dosage ciment : 300 kg/m³</li>
        </ul>
      );
    case "roof_insulation":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Utiliser panneaux isolants adaptés (laine de roche, polystyrène...)</li>
          <li>Épaisseur recommandée : 5 à 10 cm</li>
          <li>Vérifier la résistance thermique (R ≥ 3 m².K/W)</li>
        </ul>
      );
    case "cement_block_masonry":
      return (
        <ul className="list-disc ml-4 text-xs text-green-900">
          <li>Blocs creux 20x20x40 cm courants</li>
          <li>13 blocs/m² environ</li>
          <li>Dosage mortier : 400 kg/m³</li>
        </ul>
      );
    case "reinforced_concrete":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Classe de béton : C25/30 minimum</li>
          <li>Ferraillage selon plans d’exécution</li>
          <li>Vibrer le béton pour éviter les nids de cailloux</li>
        </ul>
      );
    case "wooden_roof_structure":
      return (
        <ul className="list-disc ml-4 text-xs text-yellow-900">
          <li>Bois sec et traité contre insectes</li>
          <li>Section minimale des chevrons : 6x12 cm</li>
          <li>Entraxe courant : 60 cm</li>
        </ul>
      );
    case "metal_gutter":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Acier galvanisé ou PVC</li>
          <li>Pente minimale : 5 mm/m</li>
          <li>Fixation tous les 50 cm</li>
        </ul>
      );
    case "roof_covering":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Pente minimale : 10%</li>
          <li>Prévoir écran sous toiture pour étanchéité</li>
          <li>Fixation selon DTU</li>
        </ul>
      );
    case "tiling":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Prévoir 5% de pertes</li>
          <li>Jointement : 2 à 5 mm</li>
          <li>Colle adaptée au support</li>
        </ul>
      );
    case "wooden_ceiling":
      return (
        <ul className="list-disc ml-4 text-xs text-yellow-900">
          <li>Bois sec et traité</li>
          <li>Épaisseur courante : 15 à 20 mm</li>
          <li>Fixation sur ossature bois</li>
        </ul>
      );
    case "balustrade":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Hauteur réglementaire : 1 m minimum</li>
          <li>Espacement barreaux : ≤ 11 cm</li>
          <li>Matériau : acier, bois ou aluminium</li>
        </ul>
      );
    case "electrical_installation":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Respecter la norme NFC 15-100</li>
          <li>Utiliser câbles de section adaptée</li>
          <li>Protection différentielle obligatoire</li>
        </ul>
      );
    case "plumbing_installation":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Utiliser tubes PER ou multicouche</li>
          <li>Pression d’essai : 6 bars</li>
          <li>Prévoir vannes d’arrêt accessibles</li>
        </ul>
      );
    case "septic_tank":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Volume selon nombre d’usagers</li>
          <li>Étanchéité parfaite indispensable</li>
          <li>Ventilation obligatoire</li>
        </ul>
      );
    case "site_preparation":
      return (
        <ul className="list-disc ml-4 text-xs text-green-900">
          <li>Débroussaillage complet du terrain</li>
          <li>Évacuation des déchets et gravats</li>
          <li>Nivellement avant travaux</li>
        </ul>
      );
    case "excavation":
      return (
        <ul className="list-disc ml-4 text-xs text-orange-900">
          <li>Profondeur selon étude de sol</li>
          <li>Talutage ou blindage pour sécurité</li>
          <li>Évacuation des terres excédentaires</li>
        </ul>
      );
    case "masonry_wall":
      return (
        <ul className="list-disc ml-4 text-xs text-green-900">
          <li>Épaisseur mur standard : 20 cm</li>
          <li>Type de brique : Brique creuse ou bloc ciment</li>
          <li>Dosage mortier : 400 kg/m³</li>
          <li>Joint vertical décalé pour stabilité</li>
          <li>Chaînage horizontal tous les 1,20 m de hauteur</li>
          <li>Humidifier les blocs avant pose</li>
        </ul>
      );
    case "painting":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Préparer soigneusement les supports</li>
          <li>Appliquer une sous-couche adaptée</li>
          <li>Respecter les temps de séchage</li>
        </ul>
      );
    case "fence":
      return (
        <ul className="list-disc ml-4 text-xs text-green-900">
          <li>Hauteur réglementaire selon PLU</li>
          <li>Fondations adaptées au sol</li>
          <li>Traitement anticorrosion pour les parties métalliques</li>
        </ul>
      );
    case "gate":
      return (
        <ul className="list-disc ml-4 text-xs text-green-900">
          <li>Prévoir une ouverture sécurisée</li>
          <li>Matériau adapté à l'usage (acier, alu, bois)</li>
          <li>Vérifier l’alignement et la fixation</li>
        </ul>
      );
    case "landscaping":
      return (
        <ul className="list-disc ml-4 text-xs text-green-900">
          <li>Prévoir un drainage efficace</li>
          <li>Choisir des plantes adaptées au climat</li>
          <li>Stabiliser les allées et accès</li>
        </ul>
      );
    case "architectural_plan":
      return (
        <ul className="list-disc ml-4 text-xs text-blue-900">
          <li>Vérifier la conformité aux règles d’urbanisme</li>
          <li>Inclure toutes les vues nécessaires (plan, coupe, élévation)</li>
          <li>Joindre un plan de masse et des détails techniques</li>
        </ul>
      );
    // ...les autres cas déjà fournis...
    default:
      return null;
  }
};

const isArchitecturalPlan = (text: string) => {
  const planWords = [
    "plan architectural", "plan d'architecte", "floor plan"
  ];
  const lower = text.toLowerCase();
  return planWords.some(word => lower.includes(word));
};

export default AdvancedQuantityCalculator;
