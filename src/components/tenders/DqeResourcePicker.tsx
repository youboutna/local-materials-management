/**
 * DqeResourcePicker
 * Sélecteur unifié pour ancrer une ligne DQE à une ressource :
 *  - qualification interne (organigramme)
 *  - prestataire externe (annuaire fournisseurs)
 *  - matériel (catalogue) — libre pour l'instant
 *
 * Respecte le Plan Tender v10 §3 : DQE = lien vers ressource, pas ligne anonyme.
 */
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveEmployeesHex } from '@/hooks/hexagonal/useActiveEmployeesHex';
import { useActiveSuppliersHex } from '@/hooks/hexagonal/useActiveSuppliersHex';

import { DqeResourceValue } from '@/dtos/entities/MaterialDTO';
interface Props {
  value: DqeResourceValue;
  onChange: (v: DqeResourceValue) => void;
  compact?: boolean;
}

export function validateDqeResource(v: DqeResourceValue): string | null {
  if (!v.resource_kind) return null;
  if (v.resource_kind === 'internal_qualification') {
    if (!v.employee_qualification_id) return 'Sélectionnez une qualification / employé interne.';
    if (v.supplier_id || v.supplier_contract_ref) return 'Champs prestataire non autorisés pour une ressource interne.';
  }
  if (v.resource_kind === 'external_provider') {
    if (!v.supplier_id) return 'Sélectionnez un prestataire externe.';
    if (v.employee_qualification_id) return 'Champ qualification interne non autorisé pour un prestataire externe.';
  }
  if (v.resource_kind === 'material' && (v.employee_qualification_id || v.supplier_id || v.supplier_contract_ref)) {
    return 'Aucune ressource humaine ne doit être renseignée pour un matériel.';
  }
  if ((v.resource_kind === 'internal_qualification' || v.resource_kind === 'external_provider')
    && v.estimated_hours !== undefined && v.estimated_hours < 0) {
    return 'Les heures estimées doivent être positives.';
  }
  return null;
}

export const DqeResourcePicker: React.FC<Props> = ({ value, onChange, compact }) => {
  const { data: employees = [] } = useActiveEmployeesHex();
  const { data: suppliers = [] } = useActiveSuppliersHex();

  const update = (patch: Partial<DqeResourceValue>) => {
    // Reset des champs incompatibles à chaque changement de kind (garantie de cohérence)
    if (patch.resource_kind && patch.resource_kind !== value.resource_kind) {
      onChange({
        resource_kind: patch.resource_kind,
        employee_qualification_id: undefined,
        supplier_id: undefined,
        supplier_contract_ref: undefined,
        estimated_hours: patch.resource_kind === 'material' ? undefined : value.estimated_hours,
      });
      return;
    }
    onChange({ ...value, ...patch });
  };

  const validationError = validateDqeResource(value);

  return (
    <div className="space-y-2">
    <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-4'}>
      <div>
        <Label>Type de ressource</Label>
        <Select
          value={value.resource_kind ?? ''}
          onValueChange={(v) => update({
            resource_kind: v as DqeResourceValue['resource_kind'],
            employee_qualification_id: undefined,
            supplier_id: undefined,
            supplier_contract_ref: undefined,
          })}
        >
          <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="internal_qualification">RH interne (qualification)</SelectItem>
            <SelectItem value="external_provider">Prestataire externe</SelectItem>
            <SelectItem value="material">Matériel / Équipement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.resource_kind === 'internal_qualification' && (
        <div>
          <Label>Qualification / Employé</Label>
          <Select
            value={value.employee_qualification_id ?? ''}
            onValueChange={(v) => update({ employee_qualification_id: v })}
          >
            <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.full_name}{e.position ? ` — ${e.position}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {value.resource_kind === 'external_provider' && (
        <>
          <div>
            <Label>Prestataire</Label>
            <Select
              value={value.supplier_id ?? ''}
              onValueChange={(v) => update({ supplier_id: v })}
            >
              <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Référence contractuelle</Label>
            <Input
              value={value.supplier_contract_ref ?? ''}
              onChange={(e) => update({ supplier_contract_ref: e.target.value })}
              placeholder="Convention-cadre, marché…"
            />
          </div>
        </>
      )}

      {(value.resource_kind === 'internal_qualification' || value.resource_kind === 'external_provider') && (
        <div>
          <Label>Heures estimées</Label>
          <Input
            type="number"
            value={value.estimated_hours ?? ''}
            onChange={(e) => update({ estimated_hours: parseFloat(e.target.value) || undefined })}
          />
        </div>
      )}
    </div>
      {validationError && (
        <p className="text-xs text-destructive" role="alert">{validationError}</p>
      )}
    </div>
  );
};

export default DqeResourcePicker;