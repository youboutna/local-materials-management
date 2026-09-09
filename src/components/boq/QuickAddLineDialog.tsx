/**
 * src/components/boq/QuickAddLineDialog.tsx
 * QuickAddLineDialog — saisie confortable d'une ligne DQE :
 *   • autocomplétion de la désignation (matériaux + référentiels métier)
 *   • métré assisté (L × l × h → quantité selon le type d'élément)
 *   • détection automatique unité / nature / catégorie / compte PCM / WBS / fiscalité
 *   • aperçu temps réel HT · TVA · RAS · TTC
 *
 * Aucune règle métier ici : tout provient de BoqLineAutofillService + TaxService.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, Plus, Sparkles, Wand2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { T } from '@/components/i18n/T';
import { PcmAccountSelect } from './PcmAccountSelect';
import { WbsSelector, type WbsScopeValue, type WbsValue } from './WbsSelector';
import { MetreDialog } from './MetreDialog';
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import type { ReferentialType } from '@/config/referentials';
import { getUnitOptions } from '@/config/referentials/boq/unit-catalog.referential';
import { ELEMENT_TYPES } from '@/config/referentials/boq/element-types.referential';
import { MeterService } from '@/application/services/boq/MeterService';
import { TaxService } from '@/application/services/TaxService';
import { getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import { getRecommendationItems } from '@/config/referentials/boq/recommendations.referential';
import {
  BoqLineAutofillService,
  type AutofillMaterial,
  type AutofillSuggestion,
} from '@/application/services/boq/BoqLineAutofillService';
import type { MeterOpening } from '@/dtos/boq/MeterInputDTO';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqResourceType } from '@/domain/entities/boq/BoqLine';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
  materials?: AutofillMaterial[];
  phases?: WbsPhase[];
  scope?: WbsScopeValue;
  referentialCode?: ReferentialType;
  fiscalProfileCode?: string | null;
  entityCode?: string | null;
  defaultWbs?: WbsValue;
  wbsLocked?: { phase?: boolean; milestone?: boolean; task?: boolean };
  /** Ligne prête à insérer dans le brouillon du document. */
  onSubmit: (line: Partial<BoqLineDTO>) => void;
}

const money = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MRU', maximumFractionDigits: 0 }).format(n || 0);

const RESOURCE_TYPES: { value: BoqResourceType; label: string }[] = [
  { value: 'material', label: 'Métré / matériau' },
  { value: 'labor', label: 'RH / prestation' },
  { value: 'equipment', label: 'Équipement' },
];

const num = (v: string) => (v === '' ? null : Number(v.replace(',', '.')));

export function QuickAddLineDialog({
  open, onOpenChange, trigger, disabled, materials = [], phases, scope, referentialCode,
  fiscalProfileCode, entityCode, defaultWbs, wbsLocked, onSubmit,
}: Props) {
  const [designation, setDesignation] = useState('');
  const [unit, setUnit] = useState('u');
  const [quantity, setQuantity] = useState<number | null>(null);
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [length, setLength] = useState<number | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [resourceType, setResourceType] = useState<BoqResourceType>('material');
  const [accountCode, setAccountCode] = useState<string | null>(null);
  const [wbs, setWbs] = useState<WbsValue>(defaultWbs ?? {});
  const [note, setNote] = useState('');
  const [elementType, setElementType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [openWidth, setOpenWidth] = useState<number | null>(null);
  const [openHeight, setOpenHeight] = useState<number | null>(null);
  const [deductOpenings, setDeductOpenings] = useState(true);
  const [meterDialogOpen, setMeterDialogOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [detections, setDetections] = useState<{ field: string; label: string; value: string }[]>([]);
  const touchedUnit = useRef(false);
  const touchedQty = useRef(false);
  const touchedPrice = useRef(false);
  const touchedAccount = useRef(false);

  const unitOptions = useMemo(() => getUnitOptions(), []);
  const suggestions: AutofillSuggestion[] = useMemo(
    () => BoqLineAutofillService.suggest(designation, { materials, entityCode }, 10),
    [designation, materials, entityCode],
  );

  const reset = () => {
    setDesignation(''); setUnit('u'); setQuantity(null); setUnitPrice(null);
    setLength(null); setWidth(null); setHeight(null); setResourceType('material');
    setAccountCode(null); setWbs(defaultWbs ?? {}); setNote('');
    setElementType(null); setCategory(null); setOpenCount(null); setOpenWidth(null); setOpenHeight(null); setDeductOpenings(true);
    setDetections([]);
    touchedUnit.current = false; touchedPrice.current = false; touchedAccount.current = false;
    touchedQty.current = false;
  };

  useEffect(() => { if (open) setWbs(defaultWbs ?? {}); /* hérite du contexte document */ }, [open]);

  /** Applique la détection référentielle sans écraser les saisies manuelles. */
  const runAutofill = (nextDesignation = designation) => {
    const { patch, detections: found } = BoqLineAutofillService.autofill({
      designation: nextDesignation,
      length, width, height,
      quantity, unit: touchedUnit.current ? unit : null,
      unitPrice: touchedPrice.current ? unitPrice : null,
      fiscalProfileCode, entityCode,
      phases: phases as never,
      materials,
    });
    setDetections(found);
    if (patch.unit && !touchedUnit.current) setUnit(patch.unit);
    if (patch.quantity != null) setQuantity(patch.quantity);
    if (patch.unitPrice != null && !touchedPrice.current) setUnitPrice(patch.unitPrice);
    if (patch.resourceType) setResourceType(patch.resourceType);
    if (patch.accountCode && !touchedAccount.current) setAccountCode(patch.accountCode);
    if (patch.elementType) setElementType(patch.elementType);
    if (patch.category) setCategory(patch.category);
    if (patch.phaseId && !wbs.phaseId) {
      setWbs({ phaseId: patch.phaseId, milestoneId: patch.milestoneId ?? null, taskId: patch.taskId ?? null });
    }
  };

  // Détection automatique dès que la désignation ou les dimensions changent.
  useEffect(() => {
    if (!designation.trim()) { setDetections([]); return; }
    const timer = setTimeout(() => runAutofill(), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designation, length, width, height]);

  // Métré centralisé (MeterService) : le type d'ouvrage fixe l'unité attendue et
  // la formule ; la quantité se recalcule à chaque frappe sur L / l / h.
  const openings = useMemo<MeterOpening[]>(() => {
    if (!openWidth || !openHeight) return [];
    return [{ width: openWidth, height: openHeight, count: openCount ?? 1 }];
  }, [openCount, openWidth, openHeight]);

  const metre = useMemo(
    () => MeterService.quantityFor({ designation, elementType, length, width, height, openings, deductOpenings }),
    [designation, elementType, length, width, height, openings, deductOpenings],
  );
  useEffect(() => {
    if (metre.unit) setUnit(metre.unit);
    if (!touchedQty.current && metre.quantity > 0) setQuantity(Number(metre.quantity.toFixed(3)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metre.unit, metre.quantity]);

  const recommendations = useMemo(() => (elementType ? getRecommendationItems(elementType) : []), [elementType]);

  useEffect(() => {
    if (!designation.trim() || accountCode) return;
    const autoTax = TaxService.resolve(
      {
        designation,
        resourceType,
        category: category ?? null,
        elementType,
        accountCode: null,
        totalHt: (quantity ?? 0) * (unitPrice ?? 0),
      },
      getFiscalProfile(fiscalProfileCode),
    );
    if (autoTax.accountCode && !touchedAccount.current) setAccountCode(autoTax.accountCode);
  }, [accountCode, category, designation, elementType, fiscalProfileCode, quantity, resourceType, unitPrice]);

  const pickSuggestion = (s: AutofillSuggestion) => {
    setDesignation(s.label);
    if (s.unit) { setUnit(s.unit); touchedUnit.current = false; }
    if (s.unitPrice != null) setUnitPrice(s.unitPrice);
    if (s.resourceType) setResourceType(s.resourceType);
    if (s.category) setCategory(s.category);
    if (s.elementType) setElementType(s.elementType);
    setSuggestOpen(false);
    runAutofill(s.label);
  };

  const totalHt = (quantity ?? 0) * (unitPrice ?? 0);
  const tax = useMemo(
    () => TaxService.resolve(
      { designation, resourceType, category, elementType, accountCode, totalHt },
      getFiscalProfile(fiscalProfileCode),
    ),
    [designation, resourceType, category, elementType, accountCode, totalHt, fiscalProfileCode],
  );

  const canSubmit = designation.trim().length > 0 && (quantity ?? 0) > 0;

  const submit = (keepOpen: boolean) => {
    if (!canSubmit) return;
    const material = materials.find((m) => m.name === designation) ?? null;
    onSubmit({
      designation: designation.trim(),
      unit,
      quantity: quantity ?? 0,
      unitPrice: unitPrice ?? 0,
      totalHt,
      length, width, height,
      elementType,
      category,
      accountCode,
      materialId: material?.id ?? null,
      resourceType,
      vatRate: tax.vatRate,
      rasRate: tax.rasRate,
      taxRegimeCode: tax.regimeCode,
      phaseId: wbs.phaseId ?? null,
      milestoneId: wbs.milestoneId ?? null,
      taskId: wbs.taskId ?? null,
      openings: openings.length ? openings : undefined,
      deductOpenings,
      note: note.trim() || null,
      sourceType: 'rapide',
    });
    reset();
    if (!keepOpen) onOpenChange(false);
  };

  return (
    <>
      <MetreDialog
        open={meterDialogOpen}
        onOpenChange={setMeterDialogOpen}
        initial={{
          designation,
          elementType,
          unit,
          length,
          width,
          height,
          quantity: quantity ?? metre.quantity,
          openings,
          deductOpenings,
        }}
        onApply={(value) => {
          setElementType(value.elementType);
          setLength(value.length);
          setWidth(value.width);
          setHeight(value.height);
          setUnit(value.unit || unit);
          setQuantity(value.quantity);
          setOpenCount(value.openings?.[0]?.count ?? null);
          setOpenWidth(value.openings?.[0]?.width ?? null);
          setOpenHeight(value.openings?.[0]?.height ?? null);
          setDeductOpenings(value.deductOpenings ?? true);
          if (value.quantity > 0) { touchedQty.current = true; }
        }}
      />
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      {trigger ? <DialogTrigger asChild disabled={disabled}>{trigger}</DialogTrigger> : null}
      <DialogContent className="max-h-[92vh] w-[min(96vw,900px)] max-w-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <T k="dqe.quickadd.title" fallback="Ajouter une ligne assistée" />
          </DialogTitle>
          <DialogDescription>
            <T
              k="dqe.quickadd.description"
              fallback="Saisissez la désignation : unité, métré, catégorie, compte comptable, rattachement et fiscalité sont proposés automatiquement."
            />
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Désignation + autocomplétion */}
          <div className="space-y-1">
            <Label htmlFor="quickadd-designation"><T k="dqe.quickadd.designation" fallback="Désignation" /></Label>
            <Popover open={suggestOpen && suggestions.length > 0} onOpenChange={setSuggestOpen}>
              <PopoverAnchor asChild>
                <Input
                  id="quickadd-designation"
                  autoFocus
                  value={designation}
                  placeholder="Ex. Dalle béton armé, Ingénieur travaux, Location camion…"
                  onChange={(e) => { setDesignation(e.target.value); setSuggestOpen(true); }}
                  onFocus={() => setSuggestOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSuggestOpen(false);
                    if (e.key === 'Enter' && suggestions.length && suggestOpen) {
                      e.preventDefault();
                      pickSuggestion(suggestions[0]);
                    }
                  }}
                />
              </PopoverAnchor>
              <PopoverContent
                align="start"
                className="w-[min(90vw,640px)] p-1"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <ul className="max-h-64 overflow-y-auto text-sm" role="listbox">
                  {suggestions.map((s) => (
                    <li key={`${s.origin}-${s.label}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left hover:bg-accent"
                        onClick={() => pickSuggestion(s)}
                      >
                        <span className="truncate">{s.label}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {s.unit ? <Badge variant="outline" className="text-[10px]">{s.unit}</Badge> : null}
                          {s.unitPrice != null ? <span className="text-[11px] text-muted-foreground">{money(s.unitPrice)}</span> : null}
                          <Badge variant="secondary" className="text-[10px]">{s.origin}</Badge>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          </div>

          {/* Métré assisté */}
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                <T k="dqe.quickadd.takeoff" fallback="Métré (longueur × largeur × hauteur)" />
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => setMeterDialogOpen(true)}>
                  <Wand2 className="mr-1 h-3.5 w-3.5" />
                  <T k="auto.boqworkspace.calcul_metre" fallback="Calcul métré" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => runAutofill()}>
                  <Wand2 className="mr-1 h-3.5 w-3.5" />
                  <T k="dqe.quickadd.detect" fallback="Détecter" />
                </Button>
              </div>
            </div>
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="dqe.quickadd.element_type" fallback="Type d'ouvrage (métré)" /></Label>
                <Select value={elementType ?? 'generic'} onValueChange={(v) => setElementType(v === 'generic' ? null : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="generic">— forfait / saisie libre —</SelectItem>
                    {ELEMENT_TYPES.map((e) => <SelectItem key={e.code} value={e.code}>{e.label} ({e.defaultUnit})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end text-xs text-muted-foreground">{metre.formula}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
              <div className="space-y-1">
                <Label className="text-[11px]">L (m)</Label>
                <Input inputMode="decimal" value={length ?? ''} onChange={(e) => setLength(num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">l (m)</Label>
                <Input inputMode="decimal" value={width ?? ''} onChange={(e) => setWidth(num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">h (m)</Label>
                <Input inputMode="decimal" value={height ?? ''} onChange={(e) => setHeight(num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="dqe.quickadd.quantity" fallback="Quantité (calculée)" /></Label>
                <Input inputMode="decimal" value={quantity ?? ''} onChange={(e) => { touchedQty.current = true; setQuantity(num(e.target.value)); }} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="dqe.quickadd.unit" fallback="Unité" /></Label>
                <Select value={unit} disabled={!!metre.unit} onValueChange={(v) => { touchedUnit.current = true; setUnit(v); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {unitOptions.map((u) => <SelectItem key={u.code} value={u.code}>{u.code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="dqe.quickadd.unit_price" fallback="Prix unitaire" /></Label>
                <Input
                  inputMode="decimal"
                  value={unitPrice ?? ''}
                  onChange={(e) => { touchedPrice.current = true; setUnitPrice(num(e.target.value)); }}
                />
              </div>
            </div>
            <div className="mt-3 rounded-md border bg-muted/25 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">Ouvertures à déduire</span>
                <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  Déduire
                  <input type="checkbox" checked={deductOpenings} onChange={(e) => setDeductOpenings(e.target.checked)} />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[11px]">Nombre</Label>
                  <Input inputMode="numeric" value={openCount ?? ''} onChange={(e) => setOpenCount(num(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Largeur (m)</Label>
                  <Input inputMode="decimal" value={openWidth ?? ''} onChange={(e) => setOpenWidth(num(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Hauteur (m)</Label>
                  <Input inputMode="decimal" value={openHeight ?? ''} onChange={(e) => setOpenHeight(num(e.target.value))} />
                </div>
              </div>
            </div>
          </div>

          {/* Classification + imputation */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[11px]"><T k="dqe.quickadd.resource" fallback="Nature de ressource" /></Label>
              <Select value={resourceType} onValueChange={(v) => setResourceType(v as BoqResourceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]"><T k="dqe.quickadd.account" fallback="Compte comptable (PCM)" /></Label>
              <PcmAccountSelect
                value={accountCode}
                onChange={(code) => { touchedAccount.current = true; setAccountCode(code); }}
              />
            </div>
          </div>

          <WbsSelector
            value={wbs}
            onChange={setWbs}
            phases={phases}
            scope={scope}
            referentialCode={referentialCode}
            locked={wbsLocked}
          />

          <div className="space-y-1">
            <Label className="text-[11px]"><T k="dqe.quickadd.note" fallback="Note" /></Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Précision, hypothèse de métré…" />
          </div>

          {/* Détections référentielles */}
          {detections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 rounded-md bg-muted/40 p-2">
              {detections.map((d) => (
                <Badge key={d.field} variant="outline" className="text-[10px]">
                  {d.label} : {d.value}
                </Badge>
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-primary" />
                Recommandations ({recommendations.length})
              </div>
              <ul className="grid gap-1 text-xs sm:grid-cols-2">
                {recommendations.map((r) => (
                  <li key={r.label} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Aperçu fiscal temps réel */}
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div><div className="text-[11px] text-muted-foreground">HT</div><div className="font-semibold">{money(totalHt)}</div></div>
            <div><div className="text-[11px] text-muted-foreground">TVA {(tax.vatRate * 100).toFixed(0)}%</div><div className="font-semibold">{money(tax.vatAmount)}</div></div>
            <div><div className="text-[11px] text-muted-foreground">RAS {(tax.rasRate * 100).toFixed(0)}%</div><div className="font-semibold">{money(tax.rasAmount)}</div></div>
            <div><div className="text-[11px] text-muted-foreground">TTC</div><div className="font-semibold">{money(tax.totalTtc)}</div></div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
            <T k="dqe.quickadd.cancel" fallback="Annuler" />
          </Button>
          <Button variant="outline" disabled={!canSubmit} onClick={() => submit(true)}>
            <Plus className="mr-1 h-4 w-4" />
            <T k="dqe.quickadd.add_more" fallback="Ajouter et continuer" />
          </Button>
          <Button disabled={!canSubmit} onClick={() => submit(false)}>
            <T k="dqe.quickadd.add" fallback="Ajouter la ligne" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
