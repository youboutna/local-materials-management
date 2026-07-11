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
import { Calculator, Upload, X, Trash2, Download, SkipForward, SkipBack, Save } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import Papa from "papaparse";
import { toast } from "@/hooks/use-toast";
import { calculateAdvancedQuantities, parsePdf } from "@/utils/btpCalculations";
import { CalculationParams, mapToElementType, elementTypes, Opening, CalculationResult, InvoiceLine, STANDARD_OPENINGS } from "@/utils/types";
import { useCreateQuantityTakeoff, useMaterialsForTakeoff } from "@/hooks/hexagonal/useQuantityTakeoffHex";

// PDF.js worker — bundled via Vite so its version always matches pdfjs-dist.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const DEFAULT_FORM = {
  elementType: "basic_calculator",
  length: 0,
  width: 0,
  height: 0,
  area: 0,
  count: 0,
  capacity: 0,
  depth: 0,
  openings: [] as Opening[],
  dosage: 350,
  thickness: 0.02,
  quantity : 1,
};

const getElementLabel = (value: string) => {
  const found = elementTypes.find(e => e.value === value);
  return found ? found.label : value;
};
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
    default:
      return null;
  }
};


interface AdvancedQuantityCalculatorProps {
  projectId?: string;
  phaseId?: string;
  onPersisted?: () => void;
}

const AdvancedQuantityCalculator: React.FC<AdvancedQuantityCalculatorProps> = ({ projectId, phaseId, onPersisted }) => {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentOpening, setCurrentOpening] = useState<Opening>({ id: "", label: "", length: 0, width: 0, height: 0 });
  const [showOpeningForm, setShowOpeningForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    length: 0,
    width: 0,
    height: 0,
    openings: [] as Opening[],
  });
  const [editOpening, setEditOpening] = useState<Opening>({ 
    id: "", 
    label: "", 
    length: 0, 
    width: 0, 
    height: 0 
  });
  const [showEditOpeningForm, setShowEditOpeningForm] = useState(false);
  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [savingAll, setSavingAll] = useState(false);
  const { data: materials = [] } = useMaterialsForTakeoff();
  const createTakeoff = useCreateQuantityTakeoff(projectId ?? "");

  // Extract primary numeric quantity from results (volume m³ > area m² > length m > count)
  const extractQuantity = (calc: CalculationResult): { qty: number; unit: string } => {
    const r = calc.results || {};
    const num = (k: string) => (typeof r[k] === "number" ? (r[k] as number) : undefined);
    const volume = num("Volume béton (m³)") ?? num("Volume (m³)") ?? num("volume");
    if (volume) return { qty: volume, unit: "m³" };
    const area = num("Surface (m²)") ?? num("Surface nette (m²)") ?? num("area");
    if (area) return { qty: area, unit: "m²" };
    const length = num("Longueur (m)") ?? calc.dimensions?.length;
    if (length) return { qty: length, unit: "m" };
    const count = num("Nombre") ?? num("count");
    if (count) return { qty: count, unit: "unité" };
    return { qty: 1, unit: calc.metadata?.unit ?? "unité" };
  };

  const persistCalculation = async (calc: CalculationResult) => {
    if (!projectId || !selectedMaterialId) return;
    const { qty, unit } = extractQuantity(calc);
    await createTakeoff.mutateAsync({
      material_id: selectedMaterialId,
      element_type: calc.elementType || "basic_calculator",
      unit,
      length: calc.dimensions?.length ?? qty,
      width: calc.dimensions?.width ?? 0,
      height: calc.dimensions?.height ?? 0,
      phase_id: phaseId,
      note: JSON.stringify({
        originalLabel: calc.originalLabel,
        results: calc.results,
        openings: calc.openings,
        computedQuantity: qty,
        computedUnit: unit,
      }),
    });
  };

  const handleSaveAll = async () => {
    if (!projectId) {
      toast({ title: "Contexte projet manquant", description: "Ouvrez le calculateur depuis un projet pour sauvegarder.", variant: "destructive" });
      return;
    }
    if (!selectedMaterialId) {
      toast({ title: "Matériau requis", description: "Sélectionnez un matériau de référence.", variant: "destructive" });
      return;
    }
    if (calculations.length === 0) return;
    setSavingAll(true);
    try {
      for (const calc of calculations) {
        await persistCalculation(calc);
      }
      toast({ title: "Métrés enregistrés", description: `${calculations.length} ligne(s) ajoutée(s) au projet.` });
      onPersisted?.();
    } catch (e: any) {
      toast({ title: "Erreur d'enregistrement", description: e?.message ?? "Échec", variant: "destructive" });
    } finally {
      setSavingAll(false);
    }
  };




  const currentElement = elementTypes.find(el => el.value === form.elementType);

  console.log(currentElement);

  const hasRequiredDimensions = useCallback(() => {
    if (!currentElement) return false;
    return currentElement.requires.every(req => {
      const value = form[req as keyof typeof form];
      return typeof value === "number" && value > 0;
    });
  }, [currentElement, form]);

  const resetForm = () => setForm(DEFAULT_FORM);

  const fillFormWithLine = useCallback((index: number) => {
    if (index >= invoiceLines.length) return;
    const line = invoiceLines[index];
    resetForm();
    const detectedType = mapToElementType(line.designation || "");
    const updates: Partial<typeof form> = { elementType: detectedType };

    switch (line.unit?.toLowerCase()) {
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
    setForm(prev => ({ ...prev, ...updates }));
  }, [invoiceLines]);

  const addOpening = () => {
    if (currentOpening.length <= 0 || currentOpening.width <= 0) {
      toast({ title: "Erreur", description: "Dimensions invalides pour l'ouverture", variant: "destructive" });
      return;
    }
    setForm(prev => ({
      ...prev,
      openings: [
        ...prev.openings,
        {
          ...currentOpening,
          id: crypto.randomUUID(),
          height: form.elementType === "concrete_slab" ? currentOpening.height || form.height : undefined,
        },
      ],
    }));
    setCurrentOpening({ id: "", label: "", length: 0, width: 0, height: 0 });
    setShowOpeningForm(false);
  };

  const removeOpening = (id: string) => {
    setForm(prev => ({ ...prev, openings: prev.openings.filter(o => o.id !== id) }));
  };

  const handleCalculate = () => {
    if (!hasRequiredDimensions()) {
      toast({ title: "Erreur", description: "Veuillez remplir toutes les dimensions requises", variant: "destructive" });
      return;
    }
    try {
      const params: CalculationParams = {
        elementType: form.elementType,
        length: form.length,
        width: form.width || undefined,
        height: form.height || undefined,
        quantity: form?.quantity || 1,
        count: form?.count || 0,
        options: {
          openings: ["concrete_slab", "masonry_wall"].includes(form.elementType) ? form.openings : undefined,
          dosage: form.dosage,
          thickness: form.thickness,
        },
      };
      const result = calculateAdvancedQuantities(params);
      setCalculations(prev => [...prev, { ...result, timestamp: new Date().toISOString(), elementLabel: form.elementType }]);
      resetForm();
    } catch (error) {
      toast({ title: "Erreur de calcul", description: error instanceof Error ? error.message : "Erreur inconnue", variant: "destructive" });
    }
  };

  const removeCalculation = (index: number) => {
    setCalculations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsProcessing(true);
    toast({ title: "Import en cours", description: "Analyse du fichier PDF..." });
    try {
      const parsedLines = await parsePdf(e.target.files[0]);
      if (parsedLines.length > 0) {
       //setInvoiceLines(parsedLines);
        setCalculations(parsedLines);
        toast({ title: "Import réussi", description: `${parsedLines.length} lignes importées` });
      }
    } catch (err) {
      const description =
        err instanceof Error ? err.message : "Impossible d'analyser le PDF";
      toast({ title: "Erreur d'import", description, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToCSV = () => {
    if (calculations.length === 0) {
      toast({ title: "Aucun calcul à exporter", variant: "destructive" });
      return;
    }
    const csvData = calculations.map((calc, i) => ({
      Ligne: i + 1,
      Élément: getElementLabel(calc.elementType || 'basic_calculator'),
      Désignation: calc.originalLabel || "",
      "Longueur (m)": calc.dimensions?.length ?? "",
      "Largeur (m)": calc.dimensions?.width ?? "",
      "Hauteur (m)": calc.dimensions?.height ?? "",
      "Surface (m²)": (calc.dimensions?.length != null && calc.dimensions?.width != null)
        ? (calc.dimensions.length * calc.dimensions.width).toFixed(2)
        : "",
      Quantité: calc.dimensions?.count ?? "",
      ...calc.results || {},
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calculs_quantitatifs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleEdit = (i: number) => {
    const calc = calculations[i];
    setEditIndex(i);
    setEditForm({
      length: calc.dimensions?.length || 0,
      width: calc.dimensions?.width || 0,
      height: calc.dimensions?.height || 0,
      openings: calc.openings ? [...calc.openings] : [],
    });
  };

  const handleSaveEdit = () => {
    if (editIndex === null) return;
    
    const calc = calculations[editIndex];
    const params: CalculationParams = {
      elementType: calc.elementType || form.elementType,
      length: editForm.length,
      width: editForm.width || undefined,
      height: editForm.height || undefined,
      options: {
        openings: editForm.openings,
        dosage: form.dosage,
        thickness: form.thickness,
      }
    };
    
    const result = calculateAdvancedQuantities(params);
    setCalculations(prev => 
      prev.map((c, i) => i === editIndex ? { ...result, elementType: c.elementType } : c)
    );
    setEditIndex(null);
  };

  // Effects
  useEffect(() => {
    if (invoiceLines.length > 0) {
      fillFormWithLine(0);
      setCurrentLineIndex(0);
    }
  }, [invoiceLines, fillFormWithLine]);

  useEffect(() => {
    if (["concrete_slab", "masonry_wall"].includes(form.elementType) && form.openings.length === 0) {
      setForm(f => ({ ...f, openings: STANDARD_OPENINGS }));
    }
  }, [form.elementType]);

  return (
    <div className="space-y-6">
      {/* Top form card */}
      <Card>
        <CardHeader><CardTitle><Calculator className="h-5 w-5 inline-block mr-2" />Calculateur de Métrés Avancé</CardTitle></CardHeader>
        <CardContent>
          {/* Type + dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Type d'élément</Label>
              <Select value={form.elementType} onValueChange={v => setForm(f => ({ ...f, elementType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {elementTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Length */}
            <div>
              <Label>Longueur (m)</Label>
              <Input type="number" step="0.01" min="0.01" value={form.length || ""} onChange={e => setForm(f => ({ ...f, length: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
            </div>
            {currentElement && currentElement.requires.includes("width") && (
              <div>
                <Label>Largeur (m)</Label>
                <Input type="number" step="0.01" min="0.01" value={form.width || ""} onChange={e => setForm(f => ({ ...f, width: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
              </div>
            )}
            {currentElement && currentElement.requires.includes("height") && (
              <div>
                <Label>Hauteur (m)</Label>
                <Input type="number" step="0.01" min="0.01" value={form.height || ""} onChange={e => setForm(f => ({ ...f, height: parseFloat(e.target.value) || 0 }))} placeholder="0.00" />
              </div>
            )}
                        {currentElement && currentElement.requires.includes("count") && (
              <div>
                <Label>nombre de </Label>
               <Input type="number" step="0.01" min="0" value={form.count || ""} onChange={e => setForm(f => ({ ...f, count: parseFloat(e.target.value) || 0 }))} placeholder="0" /> </div>
            )}
          {currentElement && currentElement.requires.includes("quantity") && (
            <div>
              <Label>Quantité de </Label>
              <Input type="number" step="0.01" min="1" value={form.quantity || ""} onChange={e => setForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))} placeholder="1" /> </div>
          )}
          </div>

          {/* Openings */}
          {(form.elementType === "concrete_slab" || form.elementType === "masonry_wall") && (
            <div className="mt-4">
              <Label>Ouvertures</Label>
              <div className="space-y-2">
                {form.openings.map(o => (
                  <Badge key={o.id} variant="outline">
                    {o.length}m × {o.width}m {o.height ? `× ${o.height}m` : ""}
                    <Button size="icon" variant="ghost" onClick={() => removeOpening(o.id)}><X className="w-3 h-3" /></Button>
                  </Badge>
                ))}
                {!showOpeningForm ? (
                  <Button onClick={() => setShowOpeningForm(true)}>Ajouter ouverture</Button>
                ) : (
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <Input type="number" step="0.01" min="0" placeholder="L" value={currentOpening.length || ""} onChange={e => setCurrentOpening(o => ({ ...o, length: parseFloat(e.target.value) || 0 }))} />
                    <Input type="number" step="0.01" min="0" placeholder="l" value={currentOpening.width || ""} onChange={e => setCurrentOpening(o => ({ ...o, width: parseFloat(e.target.value) || 0 }))} />
                    {form.elementType === "concrete_slab" && (
                      <Input type="number" step="0.01" min="0" placeholder="h" value={currentOpening.height || ""} onChange={e => setCurrentOpening(o => ({ ...o, height: parseFloat(e.target.value) || 0 }))} />
                    )}
                    <Button variant="outline" onClick={addOpening}>Ajouter</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="default" onClick={handleCalculate} disabled={!hasRequiredDimensions()}><Calculator className="w-4 h-4 mr-2" />Calculer et ajouter</Button>
            <Button variant="secondary" onClick={resetForm}><Trash2 className="w-4 h-4 mr-2" />Réinitialiser</Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}><Upload className="w-4 h-4 mr-2" />{isProcessing ? "Traitement..." : "Importer PDF"}</Button>
            <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <Button variant="outline" disabled={currentLineIndex <= 0} onClick={() => { fillFormWithLine(currentLineIndex - 1); setCurrentLineIndex(i => i - 1); }}><SkipBack className="w-4 h-4 mr-2" />Précédent</Button>
            <Button variant="outline" disabled={invoiceLines.length === 0 || currentLineIndex >= invoiceLines.length - 1} onClick={() => { fillFormWithLine(currentLineIndex + 1); setCurrentLineIndex(i => i + 1); }}><SkipForward className="w-4 h-4 mr-2" />Suivant</Button>
            <Button variant="destructive" onClick={() => setCalculations([])}><Trash2 className="w-4 h-4 mr-2" />Tout effacer</Button>
            <Button variant="default" onClick={exportToCSV}><Download className="w-4 h-4 mr-2" />Exporter CSV</Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle>Résultats des calculs ({calculations.length} éléments)</CardTitle>
            {projectId && (
              <div className="flex flex-wrap items-end gap-2 border-t pt-3">
                <div className="flex-1 min-w-[220px]">
                  <Label className="text-xs">Matériau de référence (requis)</Label>
                  <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un matériau..." /></SelectTrigger>
                    <SelectContent>
                      {materials.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSaveAll}
                  disabled={savingAll || !selectedMaterialId || calculations.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingAll ? "Enregistrement..." : `Enregistrer ${calculations.length} métré(s) dans le projet`}
                </Button>
                {phaseId && <Badge variant="outline" className="ml-2">Phase associée</Badge>}
              </div>
            )}
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>{/* No whitespace here */}
                    <th className=" border border-gray-200 px-1 py-1 ">#</th>
                    <th className="border border-gray-200 px-1 py-1 uppercase">Élément</th>
                    <th className="border border-gray- px-1 py-1 uppercase">Dimensions</th>
        
                    <th className="border border-gray-300 px-2 py-1 uppercase">Calculs</th>
                    <th className="border border-gray-300 px-2 py-1 uppercase">Actions</th>
                    <th className="border border-gray-200 px-1 py-1 uppercase">Désignation d'origine</th> {/* NEW */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calculations.map((calc, i) => (
                    <tr key={i}>{/* No whitespace here */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{i + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getElementLabel(calc.elementType || 'basic_calculator')
                       }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {calc.dimensions?.length != null ? `${calc.dimensions.length.toFixed(2)}m` : ''}
                        {calc.dimensions?.width != null ? ` × ${calc.dimensions.width.toFixed(2)}m` : ''}
                        {calc.dimensions?.height != null ? ` × ${calc.dimensions.height.toFixed(2)}m` : ''}
                        {calc.openings && calc.openings.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            Ouvertures: {calc.openings.map(o => 
                              `${o.length.toFixed(2)}×${o.width.toFixed(2)}${o.height ? `×${o.height.toFixed(2)}` : ''}`
                            ).join(', ')}
                          </div>
                        )}
                      </td>
                       <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          {Object.entries(calc.results || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">{key}</span>
                              <span>
                                {typeof value === 'number' 
                                  ? value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
                                  : value}
                              </span>
                            </div>
                          ))}
                          <div>
                          {calc?.metadata && Object.entries(calc.metadata).map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}:</strong> {String(value)}
                            </div>
                          ))}
                        </div>
                        </div>
                        {getRecommendations(calc.elementType || 'basic_calculator') && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <div className="font-medium">Recommandations:</div>
                            {getRecommendations(calc.elementType || 'basic_calculator')}
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
                                          id: crypto.randomUUID(),
                                        },
                                      ],
                                    }));
                                    setEditOpening({ id: "", label: "", length: 0, width: 0, height: 0 });
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
                    <td className="border border-gray-300 px-2 py-1">{calc?.originalLabel || "—"}</td> {/* NEW */}
                     
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
};

export default AdvancedQuantityCalculator;
