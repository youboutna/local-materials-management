// src/components/organizations/OrganizationForm.tsx
// Version générique alignée sur le schéma btp.organizations

import { useState } from 'react';
import type { CreateOrganizationDTO } from '@/dtos/entities/OrganizationDTO';
import { T } from '@/components/i18n/T';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

// ============================================================
// RÉFÉRENTIEL DES TYPES D'ORGANISATION
// ============================================================

interface OrgTypeOption {
  value: string;
  label: string;
  category: 'institutionnel' | 'commercial' | 'communautaire' | 'ong' | 'autre';
}

const ORG_TYPES: OrgTypeOption[] = [
  // Institutionnel
  { value: 'public',                    label: 'Public / État',                     category: 'institutionnel' },
  { value: 'prive',                     label: 'Privé / Entreprise',                category: 'institutionnel' },
  { value: 'administration',            label: 'Administration / Ministère',        category: 'institutionnel' },
  { value: 'autorite_regionale',        label: 'Autorité régionale (Wali)',         category: 'institutionnel' },
  { value: 'autorite_locale',           label: 'Autorité locale (Mairie, Commune)', category: 'institutionnel' },
  // Commercial
  { value: 'prestataire',               label: 'Prestataire / Contractant',         category: 'commercial' },
  { value: 'fournisseur',               label: 'Fournisseur',                       category: 'commercial' },
  { value: 'groupement',                label: 'Groupement / Consortium',           category: 'commercial' },
  { value: 'sous_traitant',             label: 'Sous-traitant',                     category: 'commercial' },
  // Communautaire
  { value: 'community',                 label: 'Communauté locale',                 category: 'communautaire' },
  { value: 'association',               label: 'Association',                       category: 'communautaire' },
  { value: 'cooperative',               label: 'Coopérative',                       category: 'communautaire' },
  { value: 'groupement_communautaire',  label: 'Groupement communautaire',          category: 'communautaire' },
  // ONG
  { value: 'ong',                       label: 'ONG / Organisation internationale', category: 'ong' },
  // Fallback
  { value: 'autre',                     label: 'Autre',                             category: 'autre' },
];

const ORG_TYPES_BY_CATEGORY = ORG_TYPES.reduce<Record<string, OrgTypeOption[]>>((acc, t) => {
  if (!acc[t.category]) acc[t.category] = [];
  acc[t.category].push(t);
  return acc;
}, {});

const CATEGORY_LABELS: Record<string, string> = {
  institutionnel: '🏛️ Institutionnel',
  commercial:     '💼 Commercial',
  communautaire:  '👥 Communautaire',
  ong:            '🌍 ONG',
  autre:          '📌 Autre',
};

const NONE = '__none__';

// ============================================================
// COMPOSANT
// ============================================================

interface OrganizationFormProps {
  initialValue?: Partial<CreateOrganizationDTO>;
  onSubmit: (value: CreateOrganizationDTO) => void | Promise<void>;
  organizations?: Array<{ id: string; name: string }>; // Pour le select "parent"
  isSubmitting?: boolean;
}

export function OrganizationForm({
  initialValue,
  onSubmit,
  organizations = [],
  isSubmitting = false,
}: OrganizationFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [value, setValue] = useState<CreateOrganizationDTO>({
    name: '',
    orgType: 'public',
    isActive: true,
    ...initialValue,
  });

  // ============================================================
  // HELPERS
  // ============================================================

  const update = <K extends keyof CreateOrganizationDTO>(
    key: K,
    next: CreateOrganizationDTO[K],
  ) => {
    setValue((current) => ({ ...current, [key]: next }));
  };

  const validate = (): boolean => {
    // Nom obligatoire
    if (!value.name?.trim()) {
      toast({
        title: 'Nom requis',
        description: 'Renseignez le nom de l\'organisation',
        variant: 'destructive',
      });
      return false;
    }

    // NIF : 8 à 12 chiffres (si fourni)
    if (value.nif && !/^[0-9]{8,12}$/.test(value.nif.replace(/\s/g, ''))) {
      toast({
        title: 'NIF invalide',
        description: 'Le NIF doit contenir entre 8 et 12 chiffres',
        variant: 'destructive',
      });
      return false;
    }

    // Email (si fourni)
    if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
      toast({
        title: 'Email invalide',
        description: 'Format attendu : nom@domaine.com',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    const payload: CreateOrganizationDTO = {
      ...value,
      name: value.name.trim(),
      nif: value.nif?.replace(/\s/g, '') || undefined,
    };

    await onSubmit(payload);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      {/* ----- Ligne 1 : Nom + NIF ----- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org-form-name">Nom *</Label>
          <Input
            id="org-form-name"
            required
            value={value.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={t('auto.organizationform.nom_de_l_organisation') ?? 'Nom de l\'organisation'}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-form-nif">
            <T k="auto.organizationform.nif" fallback="NIF" />
          </Label>
          <Input
            id="org-form-nif"
            value={value.nif ?? ''}
            onChange={(e) => update('nif', e.target.value)}
            placeholder="8 à 12 chiffres"
            maxLength={12}
          />
        </div>
      </div>

      {/* ----- Ligne 2 : Code + RC ----- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org-form-code">
            <T k="auto.organizationform.code" fallback="Code" />
          </Label>
          <Input
            id="org-form-code"
            value={value.code ?? ''}
            onChange={(e) => update('code', e.target.value)}
            placeholder="Ex: SOMELEC-DG"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-form-rc">RC (Registre de Commerce)</Label>
          <Input
            id="org-form-rc"
            value={(value as any).rc ?? ''}
            onChange={(e) => update('rc' as any, e.target.value)}
            placeholder="Ex: 108818/GU/29827/2737/"
          />
        </div>
      </div>

      {/* ----- Ligne 3 : CB + Secteur ----- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org-form-cb">CB (Compte Bancaire)</Label>
          <Input
            id="org-form-cb"
            value={(value as any).cb ?? ''}
            onChange={(e) => update('cb' as any, e.target.value)}
            placeholder="Ex: 300 73 96 /BPM"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-form-sector">Secteur d'activité</Label>
          <Input
            id="org-form-sector"
            value={(value as any).sector ?? ''}
            onChange={(e) => update('sector' as any, e.target.value)}
            placeholder="Ex: Énergie, BTP, Environnement…"
          />
        </div>
      </div>

      {/* ----- Ligne 4 : Type + Parent ----- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>
            <T k="auto.organizationform.type_d_organisation" fallback="Type d'organisation" />
          </Label>
          <Select
            value={value.orgType ?? 'public'}
            onValueChange={(v) => update('orgType', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORG_TYPES_BY_CATEGORY).map(([category, types]) => (
                <React.Fragment key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {CATEGORY_LABELS[category] ?? category}
                  </div>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Organisation parente</Label>
          <Select
            value={(value.parentOrganizationId as string | undefined) ?? NONE}
            onValueChange={(v) =>
              update('parentOrganizationId' as any, v === NONE ? undefined : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Aucune (racine)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Aucune (racine)</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ----- Ligne 5 : Email + Téléphone ----- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="org-form-email">Email</Label>
          <Input
            id="org-form-email"
            type="email"
            value={value.email ?? ''}
            onChange={(e) => update('email', e.target.value)}
            placeholder="contact@organisation.mr"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-form-phone">Téléphone</Label>
          <Input
            id="org-form-phone"
            value={value.phone ?? ''}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+222 XX XX XX XX"
          />
        </div>
      </div>

      {/* ----- Ligne 6 : Adresse ----- */}
      <div className="space-y-2">
        <Label htmlFor="org-form-address">Adresse</Label>
        <Input
          id="org-form-address"
          value={value.address ?? ''}
          onChange={(e) => update('address', e.target.value)}
          placeholder="Nouakchott, Mauritanie"
        />
      </div>

      {/* ----- Ligne 7 : Référence externe ----- */}
      <div className="space-y-2">
        <Label htmlFor="org-form-external-ref">
          <T k="auto.organizationform.reference_externe" fallback="Référence externe" />
        </Label>
        <Input
          id="org-form-external-ref"
          value={value.externalRef ?? ''}
          onChange={(e) => update('externalRef', e.target.value)}
          placeholder="Ex: EXT-ORG-0001"
        />
      </div>

      {/* ----- Ligne 8 : Description ----- */}
      <div className="space-y-2">
        <Label htmlFor="org-form-description">Description</Label>
        <Textarea
          id="org-form-description"
          value={value.description ?? ''}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
          placeholder="Description de l'organisation…"
        />
      </div>

      {/* ----- Cases à cocher ----- */}
      <div className="flex items-center gap-2">
        <input
          id="org-form-default"
          type="checkbox"
          className="h-4 w-4"
          checked={value.isDefault === true}
          onChange={(e) => update('isDefault', e.target.checked)}
        />
        <Label htmlFor="org-form-default" className="font-normal">
          Organisation propriétaire par défaut des projets
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="org-form-active"
          type="checkbox"
          className="h-4 w-4"
          checked={value.isActive !== false}
          onChange={(e) => update('isActive', e.target.checked)}
        />
        <Label htmlFor="org-form-active" className="font-normal">
          Organisation active
        </Label>
      </div>

      {/* ----- Bouton ----- */}
      <Button type="submit" disabled={isSubmitting}>
        <Check className="mr-2 h-4 w-4" />
        <T k="auto.organizationform.enregistrer" fallback="Enregistrer" />
      </Button>
    </form>
  );
}

export default OrganizationForm;