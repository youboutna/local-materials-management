import { useState } from 'react';
import type { CreateOrganizationDTO } from '@/dtos/entities/OrganizationDTO';

interface OrganizationFormProps {
  initialValue?: Partial<CreateOrganizationDTO>;
  onSubmit: (value: CreateOrganizationDTO) => void | Promise<void>;
}

export function OrganizationForm({ initialValue, onSubmit }: OrganizationFormProps) {
  const [value, setValue] = useState<CreateOrganizationDTO>({ name: '', isActive: true, ...initialValue });
  const update = (key: keyof CreateOrganizationDTO, next: string | boolean) => setValue((current) => ({ ...current, [key]: next }));
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void onSubmit(value); }}>
      <input required value={value.name} onChange={(event) => update('name', event.target.value)} placeholder="Nom de l'organisation" />
      <input value={value.code || ''} onChange={(event) => update('code', event.target.value)} placeholder="Code" />
      <input value={value.externalRef || ''} onChange={(event) => update('externalRef', event.target.value)} placeholder="Référence externe" />
      <input value={value.orgType || ''} onChange={(event) => update('orgType', event.target.value)} placeholder="Type d'organisation" />
      <button type="submit">Enregistrer</button>
    </form>
  );
}