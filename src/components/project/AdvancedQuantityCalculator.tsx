import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calculator, Plus, Upload, X } from 'lucide-react';
import { calculateAdvancedQuantities } from '@/utils/btpCalculations';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import * as pdfjsLib from "pdfjs-dist";
import Tesseract from 'tesseract.js';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.js';

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

interface AdvancedQuantityCalculatorProps {
  onResultsChange?: (results: CalculationResult[]) => void;
}

const AdvancedQuantityCalculator = ({ onResultsChange }: AdvancedQuantityCalculatorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [elementType, setElementType] = useState('concrete_slab');
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [currentOpening, setCurrentOpening] = useState<Opening>({
    id: '',
    length: 0,
    width: 0,
    height: 0
  });
  const [showOpeningForm, setShowOpeningForm] = useState(false);

  const elementTypes = [
    { value: 'concrete_slab', label: 'Dalle béton', requires: ['length', 'width', 'height'], defaultUnit: 'm³', minHeight: 0.05, heightStep: 0.01, heightPlaceholder: '0.15 (ex: 15cm)' },
    { value: 'hollow_core_slab', label: 'Plancher corps creux', requires: ['length', 'width', 'height'], defaultUnit: 'm³', minHeight: 0.04, heightStep: 0.01 },
    { value: 'rebar', label: 'Ferraillage', requires: ['length', 'width'], defaultUnit: 'm²' },
    { value: 'masonry_wall', label: 'Mur maçonnerie', requires: ['length', 'height'], defaultUnit: 'm²', minHeight: 0.10 },
    { value: 'plaster', label: 'Enduit', requires: ['length', 'width'], defaultUnit: 'm²' },
    { value: 'beam', label: 'Poutre', requires: ['length', 'width', 'height'], defaultUnit: 'm³', minHeight: 0.20 },
    { value: 'column', label: 'Poteau', requires: ['length', 'width', 'height'], defaultUnit: 'm³', minHeight: 0.20 },
    { value: 'foundation', label: 'Fondation', requires: ['length', 'width', 'height'], defaultUnit: 'm³', minHeight: 0.30 },
    { value: 'staircase', label: 'Escalier', requires: ['length', 'width', 'height'], defaultUnit: 'm³', minHeight: 0.15 }
  ];

  const getCurrentElementType = () => elementTypes.find(type => type.value === elementType) || elementTypes[0];

  const hasRequiredDimensions = () => {
    const currentType = getCurrentElementType();
    if (!currentType) return false;

    if (currentType.requires.includes('length') && (isNaN(length) || length <= 0)) return false;
    if (currentType.requires.includes('width') && (isNaN(width) || width <= 0)) return false;
    if (currentType.requires.includes('height')) {
      if (isNaN(height) || height <= 0) return false;
      if (currentType.minHeight && height < currentType.minHeight) {
        toast({ title: "Attention", description: `La hauteur minimale pour ${currentType.label} est ${currentType.minHeight}m`, variant: "default" });
        return false;
      }
    }
    return true;
  };

  const addOpening = () => {
    if (currentOpening.length <= 0 || currentOpening.width <= 0) {
      toast({ title: "Erreur", description: "Veuillez entrer des dimensions valides pour l'ouverture", variant: "destructive" });
      return;
    }
    setOpenings([...openings, {
      ...currentOpening,
      id: Math.random().toString(36).substring(7),
      height: elementType === 'concrete_slab' ? currentOpening.height || height : undefined
    }]);
    setCurrentOpening({ id: '', length: 0, width: 0, height: 0 });
    setShowOpeningForm(false);
  };

  const handleCalculate = () => {
    if (!hasRequiredDimensions()) return;
    const currentType = getCurrentElementType();
    const elementLabel = currentType.label;

    const results = calculateAdvancedQuantities(
      elementLabel,
      length,
      width,
      height,
      { openings: ['concrete_slab', 'masonry_wall'].includes(elementType) ? openings : undefined }
    );

    const newCalculation: CalculationResult = {
      elementType: elementLabel,
      dimensions: { length, width, height },
      openings: openings.length > 0 ? [...openings] : undefined,
      results
    };

    const updatedCalculations = [...calculations, newCalculation];
    setCalculations(updatedCalculations);
    onResultsChange?.(updatedCalculations);

    setLength(0);
    setWidth(0);
    setHeight(0);
    setOpenings([]);
  };

  const removeCalculation = (index: number) => {
    const updatedCalculations = calculations.filter((_, i) => i !== index);
    setCalculations(updatedCalculations);
    onResultsChange?.(updatedCalculations);
  };

  const getTotalsByMaterial = () => {
    const totals: { [key: string]: number } = {};
    calculations.forEach(calc => {
      Object.entries(calc.results).forEach(([key, value]) => {
        const materialKey = key.replace(/\([^)]*\)/g, '').trim();
        if (typeof value === 'number') {
          if (totals[materialKey]) totals[materialKey] += value; else totals[materialKey] = value;
        }
      });
    });
    return totals;
  };

  const formatCementOutput = (cementKg: number) => {
    if (cementKg >= 50000) {
      return { label: "Ciment (tonnes)", value: (cementKg / 1000).toFixed(2), hint: "Commande en vrac recommandée" };
    } else {
      return { label: "Sacs de ciment (50kg)", value: Math.ceil(cementKg / 50), hint: "" };
    }
  };

  // Extraction DDQE (ex : peinture, chaises) depuis texte PDF
  const extractConstructionData = (text: string): CalculationResult[] => {
    const results: CalculationResult[] = [];

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const regex = /^(\d+)\s+([\w\s\/éàçèêîôûÉÀÇÈÊÎÔÛ]+)\s+[^\d]*\s([m²unitéUnité]+)\s+([\d\s,\.]+)\s+([\d\s,\.]+)\s+([\d\s,\.]+)/i;

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        const [, num, designation, unitRaw, qtyStr, puStr, ptStr] = match;

        const unit = unitRaw.trim();
        const quantity = parseFloat(qtyStr.replace(/\s/g, '').replace(',', '.'));
        const priceUnit = parseFloat(puStr.replace(/\s/g, '').replace(',', '.'));
        const priceTotal = parseFloat(ptStr.replace(/\s/g, '').replace(',', '.'));

        results.push({
          elementType: designation.trim(),
          dimensions: { length: quantity, width: 1, height: 1 },
          results: {
            Unité: unit,
            Quantité: quantity,
            "Prix unitaire": priceUnit,
            "Prix total": priceTotal,
          },
        });
        console.log("📄 results :", results);
      }
    }

    return results;
  };


  // Extraction architecture : fenêtres, portes, entrevous
  const extractArchitectureData = (text: string): CalculationResult[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const results: CalculationResult[] = [];

    const singleOpeningRegex = /(Fenêtre|Porte|Entrevous)\s+([\d.,]+)m?\s*[x×*]\s*([\d.,]+)m?(?:\s*[x×*]\s*([\d.,]+)m?)?/i;
    const openingsLineRegex = /Ouvertures?:\s*((?:\d+[,.]\d*\s*[x×]\s*\d+[,.]\d*(?:\s*[x×]\s*\d+[,.]\d*)?(?:\s*,\s*)?)+)/i;

    for (const line of lines) {
      const matchSingle = line.match(singleOpeningRegex);
      if (matchSingle) {
        const type = matchSingle[1];
        const length = parseFloat(matchSingle[2].replace(',', '.'));
        const width = parseFloat(matchSingle[3].replace(',', '.'));
        const height = matchSingle[4] ? parseFloat(matchSingle[4].replace(',', '.')) : undefined;

        results.push({
          elementType: type,
          dimensions: { length, width, height },
          results: {
            "Surface (m²)": length * width,
            ...(height && { "Hauteur (m)": height })
          }
        });
        continue;
      }

      const matchOpeningsLine = line.match(openingsLineRegex);
      if (matchOpeningsLine && matchOpeningsLine[1]) {
        const openingsStr = matchOpeningsLine[1];
        const openingsArr = openingsStr.split(',').map(o => o.trim());

        openingsArr.forEach(op => {
          const dims = op.split(/[x×]/).map(d => parseFloat(d.trim().replace(',', '.')));
          const [length = 0, width = 0, height] = dims;

          results.push({
            elementType: 'Ouverture',
            dimensions: { length, width, height },
            results: {
              "Surface (m²)": length * width,
              ...(height && { "Hauteur (m)": height })
            }
          });
        });
      }
    }

    return results;
  };

  // Parse PDF and extract data, with OCR fallback
  const parsePdf = async (file: File): Promise<CalculationResult[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      console.log("📄 Texte brut du PDF (texte natif) :", fullText);

      // OCR fallback si texte natif trop court (PDF scanné)
      if (fullText.trim().length < 20) {
        console.log("Texte natif trop court, lancement OCR sur images PDF...");

        fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;

          const { data: { text: ocrText } } = await Tesseract.recognize(
            canvas,
            'fra',
            { logger: m => console.log(m) }
          );
          fullText += ocrText + '\n';
        }
        console.log("📄 Texte OCR extrait :", fullText);
      }

      const ddqeData = extractConstructionData(fullText);
      console.log("🧱 Données DDQE :", ddqeData);

      const architectureData = extractArchitectureData(fullText);
      console.log("🏗️ Données Plan Archi :", architectureData);

      return [...ddqeData, ...architectureData];
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      let extractedData: CalculationResult[] = [];

      switch (fileType) {
        case 'pdf':
          extractedData = await parsePdf(file);
          break;
        case 'docx':
        case 'xlsx':
        case 'xls':
          toast({
            title: "Info",
            description: `Le support pour ${fileType} n'est pas encore implémenté.`,
            variant: "default",
          });
          break;
        default:
          toast({
            title: "Erreur",
            description: "Type de fichier non supporté",
            variant: "destructive",
          });
          return;
      }

      if (extractedData.length > 0) {
        setCalculations(prev => [...prev, ...extractedData]);
        onResultsChange?.([...calculations, ...extractedData]);
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le fichier",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculateur de Métrés Avancé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Type d'élément</Label>
              <Select value={elementType} onValueChange={setElementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {elementTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Longueur (m)</Label>
              <Input type="number" step="0.01" min="0.01" value={length || ''} onChange={e => setLength(parseFloat(e.target.value) || 0)} placeholder="0.00" />
            </div>

            {getCurrentElementType().requires.includes('width') && (
              <div>
                <Label>Largeur (m)</Label>
                <Input type="number" step="0.01" min="0.01" value={width || ''} onChange={e => setWidth(parseFloat(e.target.value) || 0)} placeholder="0.00" />
              </div>
            )}

            {getCurrentElementType().requires.includes('height') && (
              <div>
                <Label>Hauteur (m)</Label>
                <Input type="number" step={getCurrentElementType().heightStep || "0.01"} min={getCurrentElementType().minHeight || "0.01"} value={height || ''} onChange={e => setHeight(parseFloat(e.target.value) || 0)} placeholder={getCurrentElementType().heightPlaceholder || "0.00"} />
                {getCurrentElementType().minHeight && (
                  <p className="text-xs text-muted-foreground mt-1">Minimum: {getCurrentElementType().minHeight}m</p>
                )}
              </div>
            )}
          </div>

          {(elementType === 'concrete_slab' || elementType === 'masonry_wall') && (
            <div className="mt-4">
              <Label>Ouvertures à déduire</Label>
              <div className="space-y-2">
                {openings.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {openings.map(opening => (
                      <Badge key={opening.id} variant="outline" className="flex items-center gap-1">
                        {opening.length}m × {opening.width}m
                        {opening.height && ` × ${opening.height}m`}
                        <button onClick={() => setOpenings(openings.filter(o => o.id !== opening.id))} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {showOpeningForm ? (
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div>
                      <Label className="text-xs">Longueur</Label>
                      <Input placeholder="Longueur" type="number" step="0.01" min="0.01" value={currentOpening.length || ''} onChange={e => setCurrentOpening({ ...currentOpening, length: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <Label className="text-xs">Largeur</Label>
                      <Input placeholder="Largeur" type="number" step="0.01" min="0.01" value={currentOpening.width || ''} onChange={e => setCurrentOpening({ ...currentOpening, width: parseFloat(e.target.value) || 0 })} />
                    </div>
                    {elementType === 'concrete_slab' && (
                      <div>
                        <Label className="text-xs">Hauteur</Label>
                        <Input placeholder="Hauteur" type="number" step="0.01" min="0.01" value={currentOpening.height || ''} onChange={e => setCurrentOpening({ ...currentOpening, height: parseFloat(e.target.value) || 0 })} />
                      </div>
                    )}
                    <div className="col-span-3 flex gap-2 mt-2">
                      <Button size="sm" onClick={addOpening}>Ajouter</Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowOpeningForm(false)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setShowOpeningForm(true)}>Ajouter une ouverture</Button>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-4">
            <Button onClick={handleCalculate} disabled={!hasRequiredDimensions()}>Calculer</Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Importer PDF
            </Button>
            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={e => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </div>
        </CardContent>
      </Card>

      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats des calculs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {calculations.map((calc, idx) => (
                <div key={idx} className="border rounded p-2 relative">
                  <button onClick={() => removeCalculation(idx)} className="absolute right-2 top-2 text-red-500 hover:text-red-700">
                    <X />
                  </button>
                  <h3 className="font-semibold">{calc.elementType}</h3>
                  <p>Dimensions: L {calc.dimensions.length}m × W {calc.dimensions.width || '-'}m × H {calc.dimensions.height || '-' }m</p>
                  {calc.openings && calc.openings.length > 0 && (
                    <div>
                      <strong>Ouvertures:</strong>
                      <ul>
                        {calc.openings.map(o => (
                          <li key={o.id}>{o.length}m × {o.width}m {o.height ? `× ${o.height}m` : ''}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <strong>Quantités:</strong>
                    <ul>
                      {Object.entries(calc.results).map(([mat, val]) => (
                        <li key={mat}>{mat}: {val}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <h3 className="font-bold">Totaux des matériaux</h3>
              <ul>
                {Object.entries(getTotalsByMaterial()).map(([mat, val]) => {
                  if (mat.toLowerCase().includes("ciment")) {
                    const cementOutput = formatCementOutput(val);
                    return (
                      <li key={mat}>
                        {cementOutput.label}: {cementOutput.value} {cementOutput.hint && <em>({cementOutput.hint})</em>}
                      </li>
                    );
                  }
                  return <li key={mat}>{mat}: {val.toFixed(2)}</li>;
                })}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedQuantityCalculator;
