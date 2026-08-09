/**
 * ResourceSelector — sélecteur unifié Matériau / Main d'œuvre / Équipement.
 *
 * Consommé par AdvancedQuantityCalculator, TenderEstimatorForm et
 * BoqImportDialog (mapping ressource). Zéro accès Supabase — les listes
 * sont injectées par le parent.
 */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BoqResourceType } from '@/domain/entities/boq/BoqLine';
import React from 'react';

export interface ResourceOption {
  id: string;
  name: string;
  unit?: string;
  unitPrice?: number | null;
}

interface Props {
  resourceType: BoqResourceType;
  onResourceTypeChange: (t: BoqResourceType) => void;
  options: ResourceOption[];
  value?: string | null;
  onChange: (id: string | null, opt?: ResourceOption) => void;
  disabled?: boolean;
}

const TYPE_LABEL: Record<BoqResourceType, string> = {
  material: 'Matériau',
  labor: "Main d'œuvre",
  equipment: 'Équipement',
};

export const ResourceSelector: React.FC<Props> = ({
  resourceType,
  onResourceTypeChange,
  options,
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Select value={resourceType} onValueChange={(v) => onResourceTypeChange(v as BoqResourceType)} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          {(Object.keys(TYPE_LABEL) as BoqResourceType[]).map((k) => (
            <SelectItem key={k} value={k}>{TYPE_LABEL[k]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value ?? ''}
        onValueChange={(v) => {
          const opt = options.find((o) => o.id === v);
          onChange(v || null, opt);
        }}
        disabled={disabled || options.length === 0}
      >
        <SelectTrigger><SelectValue placeholder={options.length ? 'Ressource…' : 'Aucune ressource'} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}{o.unitPrice ? ` — ${o.unitPrice.toLocaleString('fr-FR')}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ResourceSelector;
