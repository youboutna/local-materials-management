import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/hooks/useI18n';
import type { TechnicalPlanDTO, TechnicalPlanElementDTO } from '@/dtos/boq/TechnicalPlanDTO';
import { TechnicalPlanTransformer } from '@/dtos/transforms/TechnicalPlanTransformer';
import { ELEMENT_TYPES, type ElementTypeCode } from '@/config/referentials/boq/element-types.referential';

/** Review step inside the single document import, with no picker, dialog or persistence of its own. */
export function TechnicalPlanReview({ plan, disabled, onReviewed }: {
  plan: TechnicalPlanDTO; disabled: boolean; onReviewed: (elements: TechnicalPlanElementDTO[]) => Promise<void>;
}) {
  const { t } = useI18n();
  const [elements, setElements] = useState(plan.elements);
  const update = (index: number, element: TechnicalPlanElementDTO) => setElements(previous => previous.map((item, row) => row === index ? element : item));
  return <div className="space-y-4">
    <p className="text-sm">{plan.fileName} · {plan.pages.length} {t('plans.pages')}</p>
    <ul className="text-xs text-destructive">{plan.warnings.map((warning, index) => <li key={index}>{t(`plans.warning.${warning.code}`)} · {warning.page}</li>)}</ul>
    {elements.map((element, index) => <section className="space-y-2 border-b pb-3" key={index}>
      <div className="flex items-center gap-2"><Input aria-label={t('plans.reference')} value={element.ref} onChange={event => update(index, { ...element, ref: event.target.value, confirmed: false })} /><span className="text-xs text-muted-foreground">{element.page}</span><Button size="icon" variant="ghost" aria-label={t('plans.remove')} onClick={() => setElements(previous => previous.filter((_, row) => row !== index))}><Trash2 className="h-4 w-4" /></Button></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <div><Label>{t('plans.type')}</Label><Select value={element.elementType} onValueChange={value => update(index, { ...element, elementType: value as ElementTypeCode, confirmed: false })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ELEMENT_TYPES.map(type => <SelectItem key={type.code} value={type.code}>{t(`plans.type.${type.code}`)}</SelectItem>)}</SelectContent></Select></div>
        {(['length', 'width', 'height'] as const).map(field => <div key={field}><Label>{t(`plans.${field}`)} (m)</Label><Input aria-label={`${t(`plans.${field}`)} ${element.ref}`} type="number" min="0" step="any" value={element[field] ?? ''} onChange={event => update(index, TechnicalPlanTransformer.updateDimension(element, field, event.target.value))} /></div>)}
        <div><Label>{t('plans.count')}</Label><Input type="number" min="1" step="1" value={element.count} onChange={event => update(index, { ...element, count: Number(event.target.value), confirmed: false })} /></div>
        <Label className="flex items-center gap-2"><Checkbox checked={element.confirmed} onCheckedChange={value => update(index, { ...element, confirmed: value === true })} />{t('plans.confirmed')}</Label>
      </div>
    </section>)}
    <div className="flex flex-wrap justify-between gap-2"><Button variant="outline" disabled={disabled} onClick={() => setElements(previous => [...previous, { ref: `M${previous.length + 1}`, page: 1, rawLabel: '', elementType: 'concrete_beam', count: 1, confirmed: false }])}><Plus className="mr-1 h-4 w-4" />{t('plans.add')}</Button><Button disabled={disabled || !elements.some(element => element.confirmed)} onClick={() => { void onReviewed(elements).catch(() => undefined); }}>{t('plans.prepare')}</Button></div>
  </div>;
}