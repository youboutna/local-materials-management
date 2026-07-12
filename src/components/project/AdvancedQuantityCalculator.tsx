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
import { calculateAdvancedQuantities } from "@/utils/btpCalculations";
import { CalculationParams, mapToElementType, elementTypes, Opening, CalculationResult, InvoiceLine, STANDARD_OPENINGS } from "@/utils/types";
import { useCreateQuantityTakeoff, useMaterialsForTakeoff } from "@/hooks/hexagonal/useQuantityTakeoffHex";
import { boqRepository } from "@/infrastructure/supabase/adapters/SupabaseBoqRepository";
import type { BoqLineDTO } from "@/dtos/boq/BoqLineDTO";
import type { BoqResourceType } from "@/domain/boq/BoqLine";
import { unifiedBoqParser } from "@/application/services/boq/UnifiedBoqParser";
import { BoqImportOrchestrator } from "@/application/services/boq/BoqImportOrchestrator";
import { getRecommendationItems } from "@/utils/recommendations";

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
  const [currentOpening, setCurrentOpening] = useState<Opening>({ id: "", label: "", length: 0, width: 0, height: 0 });
  const [openingUnit, setOpeningUnit] = useState<'m' | 'cm' | 'mm'>('m');
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
  // Extra edit fields for imported (DQE) rows
  const [editImported, setEditImported] = useState({
    designation: "",
    unit: "",
    quantity: 0,
    unitPrice: 0,
  });
  const [editOpening, setEditOpening] = useState<Opening>({
    id: "",
    label: "",
    length: 0,
    width: 0,
    height: 0,
  });
  const [showEditOpeningForm, setShowEditOpeningForm] = useState(false);
  const [planMessage, setPlanMessage] = useState<string | null>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [resourceType, setResourceType] = useState<BoqResourceType>("material");
  const [unitPriceOverride, setUnitPriceOverride] = useState<string>("");
  const [savingAll, setSavingAll] = useState(false);
  const [sendingBoq, setSendingBoq] = useState(false);
  // Pagination réelle du tableau de résultats (remplace l'assistant fictif).
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(calculations.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, calculations.length);
  useEffect(() => { if (page >= totalPages) setPage(Math.max(0, totalPages - 1)); }, [totalPages, page]);
  const { data: materials = [] } = useMaterialsForTakeoff();
  const createTakeoff = useCreateQuantityTakeoff(projectId ?? "");

  // Matériau sélectionné → hydrate PU + unité de référence (avant tout calcul).
  const selectedMaterial = React.useMemo(
    () => (materials as any[]).find((m: any) => m?.id === selectedMaterialId),
    [materials, selectedMaterialId],
  );
  const [autoRecs, setAutoRecs] = useState(true);

  // Auto-remplissage du PU par défaut dès qu'un matériau est choisi (sans écraser
  // une saisie manuelle explicite).
  const priceAutoFilledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedMaterial) return;
    const price = Number(
      (selectedMaterial as any).pricePerUnit ??
      (selectedMaterial as any).unit_price ??
      (selectedMaterial as any).unitPrice ??
      NaN,
    );
    if (!Number.isFinite(price) || price <= 0) return;
    // N'écrase pas une valeur non issue de l'auto-fill précédent.
    const previousAuto = priceAutoFilledRef.current;
    if (unitPriceOverride && unitPriceOverride !== previousAuto) return;
    const nextValue = String(price);
    setUnitPriceOverride(nextValue);
    priceAutoFilledRef.current = nextValue;
  }, [selectedMaterial, unitPriceOverride]);



  // Extract primary numeric quantity from results (volume m³ > area m² > length m > count)
  const extractQuantity = (calc: CalculationResult): { qty: number; unit: string } => {
    const r = calc.results || {};
    const num = (k: string) => (typeof r[k] === "number" ? (r[k] as number) : undefined);
    // Imported rows: prefer explicit "Quantité" + metadata.unit.
    const importedQty = num("Quantité");
    const importedUnit = (calc.metadata as any)?.unit as string | undefined;
    if (importedQty != null && importedUnit) return { qty: importedQty, unit: importedUnit };
    const volume = num("Volume béton (m³)") ?? num("Volume (m³)") ?? num("volume");
    if (volume) return { qty: volume, unit: "m³" };
    const area = num("Surface (m²)") ?? num("Surface nette (m²)") ?? num("area");
    if (area) return { qty: area, unit: "m²" };
    const length = num("Longueur (m)") ?? calc.dimensions?.length;
    if (length) return { qty: length, unit: "m" };
    const count = num("Nombre") ?? num("count");
    if (count) return { qty: count, unit: "unité" };
    if (importedQty != null) return { qty: importedQty, unit: importedUnit || "unité" };
    return { qty: 1, unit: importedUnit ?? "unité" };
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

  const buildBoqDto = (calc: CalculationResult): BoqLineDTO => {
    const { qty, unit } = extractQuantity(calc);
    const rowPu = typeof (calc.results as any)?.PU === 'number' ? (calc.results as any).PU : null;
    const overridePu = parseFloat(unitPriceOverride);
    const unitPrice = rowPu ?? (Number.isFinite(overridePu) && overridePu > 0 ? overridePu : null);
    const material = materials.find((m: any) => m.id === selectedMaterialId);
    const designation = calc.originalLabel
      || getElementLabel(calc.elementType || 'basic_calculator')
      || material?.name
      || 'Ligne calculée';
    const meta = (calc.metadata || {}) as any;
    const rowResource: BoqResourceType = (meta.resourceType as BoqResourceType) ?? resourceType;
    const rowPhase = meta.phaseId ?? phaseId ?? null;
    return {
      source: 'quantity_takeoff',
      contextId: projectId ?? '',
      designation,
      elementType: calc.elementType ?? null,
      unit,
      length: calc.dimensions?.length ?? null,
      width: calc.dimensions?.width ?? null,
      height: calc.dimensions?.height ?? null,
      quantity: qty,
      unitPrice,
      totalHt: unitPrice != null ? qty * unitPrice : null,
      materialId: rowResource === 'material' ? (selectedMaterialId || null) : null,
      phaseId: rowPhase,
      milestoneId: meta.milestoneId ?? null,
      taskId: meta.taskId ?? null,
      resourceType: rowResource,
      note: JSON.stringify({ source: 'AdvancedQuantityCalculator', results: calc.results }),
    };
  };

  const handleSendToBoq = async () => {
    if (!projectId) {
      toast({ title: "Contexte projet manquant", description: "Ouvrez le calculateur depuis un projet.", variant: "destructive" });
      return;
    }
    if (calculations.length === 0) return;
    setSendingBoq(true);
    try {
      const lines = calculations.map(buildBoqDto);
      await boqRepository.bulkCreate(lines);
      window.dispatchEvent(new CustomEvent('boq-imported', { detail: { source: 'quantity_takeoff', projectId, count: lines.length } }));
      toast({ title: "Envoyé vers le BOQ", description: `${lines.length} ligne(s) ajoutée(s) aux Métrés du projet.` });
      onPersisted?.();
    } catch (e: any) {
      toast({ title: "Erreur BOQ", description: e?.message ?? "Échec de l'envoi", variant: "destructive" });
    } finally {
      setSendingBoq(false);
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
    // Conversion cm/mm → m via AdvancedMeterEngine.toMeters
    const factor = openingUnit === 'cm' ? 0.01 : openingUnit === 'mm' ? 0.001 : 1;
    const length = currentOpening.length * factor;
    const width = currentOpening.width * factor;
    const heightRaw = currentOpening.height ?? 0;
    const height = heightRaw > 0 ? heightRaw * factor : undefined;
    setForm(prev => ({
      ...prev,
      openings: [
        ...prev.openings,
        {
          ...currentOpening,
          length,
          width,
          id: crypto.randomUUID(),
          height: form.elementType === "concrete_slab" ? (height ?? form.height) : height,
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

  /** Mise à jour inline (désignation/quantité/PU/unité) sans passer par le mode édition. */
  const updateCalcInline = (
    index: number,
    patch: { designation?: string; unit?: string; quantity?: number; unitPrice?: number },
  ) => {
    setCalculations((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const r = { ...(c.results || {}) } as Record<string, any>;
        const qty = patch.quantity ?? (typeof r['Quantité'] === 'number' ? r['Quantité'] : 0);
        const pu = patch.unitPrice ?? (typeof r['PU'] === 'number' ? r['PU'] : undefined);
        r['Quantité'] = qty;
        if (pu != null && pu > 0) {
          r['PU'] = pu;
          r['Total HT'] = qty * pu;
        } else if (patch.unitPrice === 0) {
          delete r['PU'];
          delete r['Total HT'];
        }
        return {
          ...c,
          originalLabel: patch.designation ?? c.originalLabel,
          metadata: { ...(c.metadata || {}), unit: patch.unit ?? (c.metadata as any)?.unit },
          results: r,
        };
      }),
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    toast({ title: "Import en cours", description: `Analyse via l'importeur unifié (${file.name})...` });
    try {
      const parsed = await unifiedBoqParser.parse(file);
      const rawDtos = BoqImportOrchestrator.toDtos(parsed.rows, parsed.autoMapping, {
        source: 'quantity_takeoff',
        contextId: projectId ?? 'calculator',
        phaseId,
      });
      // Filter obvious section headers / sub-totals: no qty, no PU, and matches LOT/PHASE/CHAPITRE/TOTAL.
      const HEADER_RX = /^\s*(LOT|PHASE|CHAPITRE|TOTAL|SOUS[\s-]*TOTAL|S\/TOTAL)\b/i;
      const dtos = rawDtos.filter((d) => {
        const isHeader = HEADER_RX.test(d.designation || '');
        const empty = (!d.quantity || d.quantity === 0) && !d.unitPrice;
        return !(isHeader && empty);
      });
      const skipped = rawDtos.length - dtos.length;
      const calcs: CalculationResult[] = dtos.map((d) => {
        const qty = d.quantity ?? 0;
        const unit = d.unit || 'unité';
        const hasGeom = d.length != null || d.width != null || d.height != null;
        return {
          elementType: mapToElementType(d.designation || '') || 'basic_calculator',
          originalLabel: d.designation ?? '',
          dimensions: hasGeom
            ? {
                length: d.length ?? undefined,
                width: d.width ?? undefined,
                height: d.height ?? undefined,
              }
            : undefined,
          results: {
            Quantité: qty,
            ...(d.unitPrice != null ? { PU: d.unitPrice } : {}),
            ...(d.totalHt != null ? { 'Total HT': d.totalHt } : {}),
          },
          metadata: { unit, source: parsed.format, file: parsed.fileName, imported: true, resourceType: d.resourceType ?? 'material', phaseId: d.phaseId ?? null, milestoneId: d.milestoneId ?? null, taskId: d.taskId ?? null },
          timestamp: new Date().toISOString(),
        } as CalculationResult;
      });
      if (calcs.length > 0) {
        setCalculations((prev) => [...prev, ...calcs]);
        const lines: InvoiceLine[] = dtos.map((d) => ({
          designation: d.designation ?? '',
          unit: d.unit || 'unité',
          quantity: d.quantity ?? 0,
          unitPrice: d.unitPrice ?? 0,
          total: d.totalHt ?? 0,
        } as InvoiceLine));
        setInvoiceLines(lines);
        setPage(0);

        toast({
          title: 'Import réussi',
          description: `${calcs.length} ligne(s) importée(s) via importeur unifié (${parsed.format.toUpperCase()})${skipped ? ` — ${skipped} en-tête(s) filtré(s)` : ''}.`,
        });
      } else {
        toast({ title: 'Aucune ligne détectée', description: 'Vérifiez la mise en page du fichier.', variant: 'destructive' });
      }
    } catch (err) {
      const description = err instanceof Error ? err.message : "Impossible d'analyser le fichier";
      toast({ title: "Erreur d'import", description, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
  const isImported = (calc: CalculationResult) =>
    Boolean((calc.metadata as any)?.imported) || (calc.elementType === 'basic_calculator' && !calc.dimensions);

  const handleEdit = (i: number) => {
    const calc = calculations[i];
    setEditIndex(i);
    setEditForm({
      length: calc.dimensions?.length || 0,
      width: calc.dimensions?.width || 0,
      height: calc.dimensions?.height || 0,
      openings: calc.openings ? [...calc.openings] : [],
    });
    const r = (calc.results || {}) as Record<string, any>;
    setEditImported({
      designation: calc.originalLabel ?? '',
      unit: (calc.metadata as any)?.unit ?? '',
      quantity: typeof r['Quantité'] === 'number' ? r['Quantité'] : 0,
      unitPrice: typeof r['PU'] === 'number' ? r['PU'] : 0,
    });
  };

  const handleSaveEditImported = () => {
    if (editIndex === null) return;
    const total = (editImported.quantity || 0) * (editImported.unitPrice || 0);
    setCalculations((prev) =>
      prev.map((c, i) =>
        i === editIndex
          ? {
              ...c,
              originalLabel: editImported.designation,
              metadata: { ...(c.metadata || {}), unit: editImported.unit || (c.metadata as any)?.unit },
              results: {
                Quantité: editImported.quantity,
                ...(editImported.unitPrice ? { PU: editImported.unitPrice, 'Total HT': total } : {}),
              },
            }
          : c,
      ),
    );
    setEditIndex(null);
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
                  <div className="grid grid-cols-4 gap-2 items-end">
                    <Input type="number" step="0.01" min="0" placeholder="L" value={currentOpening.length || ""} onChange={e => setCurrentOpening(o => ({ ...o, length: parseFloat(e.target.value) || 0 }))} />
                    <Input type="number" step="0.01" min="0" placeholder="l" value={currentOpening.width || ""} onChange={e => setCurrentOpening(o => ({ ...o, width: parseFloat(e.target.value) || 0 }))} />
                    {form.elementType === "concrete_slab" && (
                      <Input type="number" step="0.01" min="0" placeholder="h" value={currentOpening.height || ""} onChange={e => setCurrentOpening(o => ({ ...o, height: parseFloat(e.target.value) || 0 }))} />
                    )}
                    <Select value={openingUnit} onValueChange={(v) => setOpeningUnit(v as 'm' | 'cm' | 'mm')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="cm">cm</SelectItem>
                        <SelectItem value="mm">mm</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={addOpening}>Ajouter</Button>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Mapping ressources (déplacé depuis résultats) */}
          {projectId && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-3">
              <div>
                <Label className="text-xs">Matériau de référence</Label>
                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un matériau..." /></SelectTrigger>
                  <SelectContent>
                    {materials.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type de ressource (défaut)</Label>
                <Select value={resourceType} onValueChange={(v) => setResourceType(v as BoqResourceType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Matériau</SelectItem>
                    <SelectItem value="labour">Main-d'œuvre</SelectItem>
                    <SelectItem value="equipment">Équipement / Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">PU par défaut (optionnel)</Label>
                <Input type="number" step="0.01" min="0" value={unitPriceOverride}
                  onChange={(e) => setUnitPriceOverride(e.target.value)} placeholder="0.00" />
              </div>
            </div>
          )}

          {/* Actions principales */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="default" onClick={handleCalculate} disabled={!hasRequiredDimensions()}><Calculator className="w-4 h-4 mr-2" />Calculer et ajouter</Button>
            <Button variant="secondary" onClick={resetForm}><Trash2 className="w-4 h-4 mr-2" />Réinitialiser</Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}><Upload className="w-4 h-4 mr-2" />{isProcessing ? "Traitement..." : "Importer (PDF/Excel/CSV)"}</Button>
            <input type="file" accept=".pdf,.xlsx,.xls,.csv,application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <Button variant="outline" disabled={safePage <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} title="Page précédente"><SkipBack className="w-4 h-4 mr-2" />Précédent</Button>
            <Button variant="outline" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} title="Page suivante"><SkipForward className="w-4 h-4 mr-2" />Suivant</Button>
            <span className="text-xs text-muted-foreground self-center px-2">Page {safePage + 1} / {totalPages}{calculations.length ? ` · ${pageStart + 1}–${pageEnd} / ${calculations.length}` : ''}</span>

            {projectId && calculations.length > 0 && (
              <>
                <Button onClick={handleSaveAll} disabled={savingAll || !selectedMaterialId} variant="secondary">
                  <Save className="w-4 h-4 mr-2" />{savingAll ? "Enregistrement..." : `Enregistrer (${calculations.length})`}
                </Button>
                <Button onClick={handleSendToBoq} disabled={sendingBoq}>
                  <Upload className="w-4 h-4 mr-2" />{sendingBoq ? "Envoi..." : `Envoyer vers BOQ (${calculations.length})`}
                </Button>
              </>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={exportToCSV} disabled={calculations.length === 0}><Download className="w-4 h-4 mr-2" />Exporter CSV</Button>
              <Button variant="destructive" onClick={() => setCalculations([])} disabled={calculations.length === 0}><Trash2 className="w-4 h-4 mr-2" />Tout effacer</Button>
            </div>
          </div>
          {phaseId && <div className="mt-2"><Badge variant="outline">Phase associée</Badge></div>}
        </CardContent>
      </Card>

      {/* Results Table */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Détail estimatif ({calculations.length} lignes)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>{/* No whitespace here */}
                    <th className=" border border-gray-200 px-1 py-1 ">#</th>
                    <th className="border border-gray-200 px-1 py-1 uppercase">Élément</th>
                    <th className="border border-gray- px-1 py-1 uppercase">Dimensions</th>
        
                    <th className="border border-gray-300 px-2 py-1 uppercase">Détail des ressources</th>
                    <th className="border border-gray-300 px-2 py-1 uppercase">Actions</th>
                    <th className="border border-gray-200 px-1 py-1 uppercase">Désignation d'origine</th> {/* NEW */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calculations.slice(pageStart, pageEnd).map((calc, localIdx) => {
                  const i = pageStart + localIdx;
                  return (
                    <tr key={i}>{/* No whitespace here */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{i + 1}</td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getElementLabel(calc.elementType || 'basic_calculator')
                       }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isImported(calc) && !calc.dimensions ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <>
                            {calc.dimensions?.length != null ? `${calc.dimensions.length.toFixed(2)}m` : ''}
                            {calc.dimensions?.width != null ? ` × ${calc.dimensions.width.toFixed(2)}m` : ''}
                            {calc.dimensions?.height != null ? ` × ${calc.dimensions.height.toFixed(2)}m` : ''}
                          </>
                        )}
                        {calc.openings && calc.openings.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            Ouvertures: {calc.openings.map(o =>
                              `${o.length.toFixed(2)}×${o.width.toFixed(2)}${o.height ? `×${o.height.toFixed(2)}` : ''}`
                            ).join(', ')}
                          </div>
                        )}
                      </td>
                       <td className="px-3 py-2 text-sm text-gray-600 min-w-[280px]">
                        {isImported(calc) ? (
                          <div className="space-y-2">
                            <Input
                              className="h-8 text-xs"
                              value={calc.originalLabel ?? ''}
                              onChange={(e) => updateCalcInline(i, { designation: e.target.value })}
                              placeholder="Désignation"
                            />
                            <div className="grid grid-cols-3 gap-1">
                              <div>
                                <Label className="text-[10px]">Unité</Label>
                                <Input className="h-8 text-xs"
                                  value={(calc.metadata as any)?.unit ?? ''}
                                  onChange={(e) => updateCalcInline(i, { unit: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label className="text-[10px]">Qté</Label>
                                <Input className="h-8 text-xs" type="number" step="0.01" min="0"
                                  value={(calc.results as any)?.['Quantité'] ?? 0}
                                  onChange={(e) => updateCalcInline(i, { quantity: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label className="text-[10px]">PU</Label>
                                <Input className="h-8 text-xs" type="number" step="0.01" min="0"
                                  value={(calc.results as any)?.['PU'] ?? 0}
                                  onChange={(e) => updateCalcInline(i, { unitPrice: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                            </div>
                            {(calc.results as any)?.['Total HT'] != null && (
                              <div className="text-xs text-muted-foreground text-right">
                                Total HT : {Number((calc.results as any)['Total HT']).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {Object.entries(calc.results || {}).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="font-medium">{key}</span>
                                <span>{typeof value === 'number' ? value.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {getRecommendations(calc.elementType || 'basic_calculator') && !isImported(calc) && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <div className="font-medium">Recommandations:</div>
                            {getRecommendations(calc.elementType || 'basic_calculator')}
                          </div>
                        )}
                      </td>
                 <td className="border border-gray-300 px-2 py-1 text-center">
                      {editIndex === i && isImported(calc) ? (
                        <div className="space-y-2 text-left">
                          <div>
                            <Label className="text-xs">Désignation</Label>
                            <Input
                              value={editImported.designation}
                              onChange={(e) => setEditImported((f) => ({ ...f, designation: e.target.value }))}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs">Unité</Label>
                              <Input
                                value={editImported.unit}
                                onChange={(e) => setEditImported((f) => ({ ...f, unit: e.target.value }))}
                                placeholder="unité"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Quantité</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editImported.quantity}
                                onChange={(e) => setEditImported((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">PU</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editImported.unitPrice}
                                onChange={(e) => setEditImported((f) => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total HT ={' '}
                            {((editImported.quantity || 0) * (editImported.unitPrice || 0)).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="default" onClick={handleSaveEditImported}>Valider</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditIndex(null)}>Annuler</Button>
                          </div>
                        </div>
                      ) : editIndex === i ? (
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
                        <div className="flex flex-col gap-1 items-stretch min-w-[180px]">
                          <Select
                            value={((calc.metadata as any)?.resourceType as BoqResourceType) ?? 'material'}
                            onValueChange={(v) => {
                              setCalculations((prev) => prev.map((c, idx) => idx === i ? { ...c, metadata: { ...(c.metadata || {}), resourceType: v } } : c));
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="material">Matériau</SelectItem>
                              <SelectItem value="labour">Main-d'œuvre</SelectItem>
                              <SelectItem value="equipment">Équipement / Service</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1 justify-center">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(i)} aria-label="Éditer">
                              <span role="img" aria-label="edit">✏️</span>
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => removeCalculation(i)} aria-label="Supprimer">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">{calc?.originalLabel || "—"}</td> {/* NEW */}
                     
                  </tr>
                  );
                })}

              </tbody>
            </table>
            </div>
            {calculations.length > PAGE_SIZE && (
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>Lignes {pageStart + 1}–{pageEnd} sur {calculations.length}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={safePage <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><SkipBack className="w-3 h-3 mr-1" />Précédent</Button>
                  <span className="self-center">Page {safePage + 1} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Suivant<SkipForward className="w-3 h-3 ml-1" /></Button>
                </div>
              </div>
            )}
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
