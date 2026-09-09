import { useState } from 'react';
import type { CreateOrganizationDTO } from '@/dtos/entities/OrganizationDTO';
import { T } from '@/components/i18n/T';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrganizationFormProps {
  initialValue?: Partial<CreateOrganizationDTO>;
  onSubmit: (value: CreateOrganizationDTO) => void | Promise<void>;
}

export function OrganizationForm({ initialValue, onSubmit }: OrganizationFormProps) {
  const { t } = useLanguage();
  const [value, setValue] = useState<CreateOrganizationDTO>({ name: '', isActive: true, ...initialValue });
  const update = (key: keyof CreateOrganizationDTO, next: string | boolean) => setValue((current) => ({ ...current, [key]: next }));
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void onSubmit(value); }}>
      <input required value={value.name} onChange={(event) => update('name', event.target.value)} placeholder={t('auto.organizationform.nom_de_l_organisation')} />
      <input value={value.code || ''} onChange={(event) => update('code', event.target.value)} placeholder={t('auto.organizationform.code')} />
      <input value={value.externalRef || ''} onChange={(event) => update('externalRef', event.target.value)} placeholder={t('auto.organizationform.reference_externe')} />
      <input value={value.orgType || ''} onChange={(event) => update('orgType', event.target.value)} placeholder={t('auto.organizationform.type_d_organisation')} />
      <input value={value.nif || ''} onChange={(event) => update('nif', event.target.value)} placeholder={t('auto.organizationform.nif')} />
      <button type="submit"><T k="auto.organizationform.enregistrer" fallback="Enregistrer" /></button>
    </form>
  );
}