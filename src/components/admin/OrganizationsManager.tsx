// src/components/organizations/OrganizationsManager.tsx
// Version générique alignée sur le schéma btp.organizations

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CreateOrganizationDTO, OrganizationDTO } from '@/dtos/entities/OrganizationDTO';
import { useToast } from '@/hooks/use-toast';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Building2, Check, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { T } from '@/components/i18n/T';
import { useLanguage } from '@/contexts/LanguageContext';

const NONE = '__none__';

// ============================================================
// RÉFÉRENTIEL GÉNÉRIQUE DES TYPES D'ORGANISATION
// Aligné sur la contrainte CHECK de btp.organizations.org_type
// ============================================================

interface OrgTypeOption {
  value: string;
  label: string;
  category: 'institutionnel' | 'commercial' | 'communautaire' | 'ong' | 'autre';
  icon?: string;
}

const ORG_TYPES: OrgTypeOption[] = [
  // Institutionnel
  { value: 'public',           label: 'Public / État',                     category: 'institutionnel' },
  { value: 'prive',            label: 'Privé / Entreprise',                category: 'institutionnel' },
  { value: 'administration',   label: 'Administration / Ministère',        category: 'institutionnel' },
  { value: 'autorite_regionale', label: 'Autorité régionale (Wali)',       category: 'institutionnel' },
  { value: 'autorite_locale',  label: 'Autorité locale (Mairie, Commune)', category: 'institutionnel' },

  // Commercial
  { value: 'prestataire',      label: 'Prestataire / Contractant',         category: 'commercial' },
  { value: 'fournisseur',      label: 'Fournisseur',                       category: 'commercial' },
  { value: 'groupement',       label: 'Groupement / Consortium',           category: 'commercial' },
  { value: 'sous_traitant',    label: 'Sous-traitant',                     category: 'commercial' },

  // Communautaire
  { value: 'community',        label: 'Communauté locale',                 category: 'communautaire' },
  { value: 'association',      label: 'Association',                       category: 'communautaire' },
  { value: 'cooperative',      label: 'Coopérative',                       category: 'communautaire' },
  { value: 'groupement_communautaire', label: 'Groupement communautaire', category: 'communautaire' },

  // ONG
  { value: 'ong',              label: 'ONG / Organisation internationale', category: 'ong' },

  // Fallback
  { value: 'autre',            label: 'Autre',                             category: 'autre' },
];

// Regroupement par catégorie pour le Select
const ORG_TYPES_BY_CATEGORY = ORG_TYPES.reduce<Record<string, OrgTypeOption[]>>((acc, type) => {
  if (!acc[type.category]) acc[type.category] = [];
  acc[type.category].push(type);
  return acc;
}, {});

const CATEGORY_LABELS: Record<string, string> = {
  institutionnel: '🏛️ Institutionnel',
  commercial: '💼 Commercial',
  communautaire: '👥 Communautaire',
  ong: '🌍 ONG',
  autre: '📌 Autre',
};

// ============================================================
// FORMULAIRE VIDE
// ============================================================

const emptyForm: CreateOrganizationDTO = {
  name: '',
  code: '',
  orgType: 'public',
  description: '',
  address: '',
  phone: '',
  email: '',
  nif: '',
  rc: '',
  cb: '',
  sector: '',
  externalRef: '',
  parentOrganizationId: undefined,
  isDefault: false,
  isActive: true,
};

// ============================================================
// COMPOSANT
// ============================================================

const OrganizationsManager: React.FC = () => {
  const { t } = useLanguage();
  const { data, isLoading, create, update, remove, setDefault, isMutating } = useOrganizations();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateOrganizationDTO>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const organizations = useMemo<OrganizationDTO[]>(() => data ?? [], [data]);

  // Filtrer les parents possibles (éviter les cycles hiérarchiques)
  const parentOptions = useMemo(() => {
    if (!editingId) return organizations;
    const descendants = new Set<string>([editingId]);
    let changed = true;
    while (changed) {
      changed = false;
      organizations.forEach((o) => {
        const parentId = o.parentOrganizationId ?? (o as any).parentId;
        if (parentId && descendants.has(parentId) && !descendants.has(o.id)) {
          descendants.add(o.id);
          changed = true;
        }
      });
    }
    return organizations.filter((o) => !descendants.has(o.id));
  }, [organizations, editingId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name?.trim()) {
      toast({
        title: t('auto.organizationsmanager.nom_requis') ?? 'Nom requis',
        description: t('auto.organizationsmanager.renseignez_le_nom_de_l_organisation')
          ?? 'Renseignez le nom de l\'organisation',
        variant: 'destructive',
      });
      return;
    }

    // Validation NIF (8-12 chiffres si fourni)
    if (form.nif && !/^[0-9]{8,12}$/.test(form.nif.replace(/\s/g, ''))) {
      toast({
        title: 'NIF invalide',
        description: 'Le NIF doit contenir entre 8 et 12 chiffres',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload: CreateOrganizationDTO = {
        ...form,
        nif: form.nif?.replace(/\s/g, '') || undefined,
      };

      if (editingId) {
        await update({ id: editingId, data: payload });
        toast({
          title: t('auto.organizationsmanager.organisation_mise_a_jour') ?? 'Organisation mise à jour',
          description: form.name,
        });
      } else {
        await create(payload);
        toast({
          title: t('auto.organizationsmanager.organisation_creee') ?? 'Organisation créée',
          description: form.name,
        });
      }
      resetForm();
    } catch (error) {
      toast({
        title: t('auto.organizationsmanager.erreur') ?? 'Erreur',
        description: error instanceof Error ? error.message : 'Enregistrement impossible',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (organization: OrganizationDTO) => {
    setEditingId(organization.id);
    setForm({
      name: organization.name,
      code: organization.code ?? '',
      orgType: organization.orgType ?? 'public',
      description: organization.description ?? '',
      address: organization.address ?? '',
      phone: organization.phone ?? '',
      email: organization.email ?? '',
      nif: organization.nif ?? '',
      rc: (organization as any).rc ?? '',
      cb: (organization as any).cb ?? '',
      sector: (organization as any).sector ?? '',
      externalRef: organization.externalRef,
      parentOrganizationId: organization.parentOrganizationId ?? (organization as any).parentId,
      isDefault: organization.isDefault ?? false,
      isActive: organization.isActive,
    });
  };

  const handleDelete = async (organization: OrganizationDTO) => {
    try {
      await remove(organization.id);
      if (editingId === organization.id) resetForm();
      toast({
        title: t('auto.organizationsmanager.organisation_supprimee') ?? 'Organisation supprimée',
        description: organization.name,
      });
    } catch (error) {
      toast({
        title: t('auto.organizationsmanager.erreur') ?? 'Erreur',
        description: error instanceof Error ? error.message : 'Suppression impossible',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (organization: OrganizationDTO) => {
    try {
      await setDefault(organization.id);
      toast({
        title: t('auto.organizationsmanager.organisation_par_defaut') ?? 'Organisation par défaut',
        description: `${organization.name} sera propriétaire des nouveaux projets`,
      });
    } catch (error) {
      toast({
        title: t('auto.organizationsmanager.erreur') ?? 'Erreur',
        description: error instanceof Error ? error.message : 'Mise à jour impossible',
        variant: 'destructive',
      });
    }
  };

  // Helper : récupérer le libellé d'un type
  const getOrgTypeLabel = (value?: string | null): string => {
    if (!value) return '—';
    return ORG_TYPES.find((t) => t.value === value)?.label ?? value;
  };

  // Helper : récupérer la catégorie d'un type
  const getOrgTypeCategory = (value?: string | null): string | null => {
    if (!value) return null;
    return ORG_TYPES.find((t) => t.value === value)?.category ?? null;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ============================================================
          FORMULAIRE
          ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingId ? 'Modifier l\'organisation' : 'Nouvelle organisation'}
          </CardTitle>
          <CardDescription>
            Définissez les organisations et leur hiérarchie. L'organisation par défaut est rattachée
            automatiquement aux nouveaux projets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* ----- Ligne 1 : Nom + NIF ----- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Nom *</Label>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: SOMELEC"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-nif">
                  <T k="auto.organizationsmanager.nif" fallback="NIF" />
                </Label>
                <Input
                  id="org-nif"
                  value={form.nif ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, nif: e.target.value }))}
                  placeholder="8 à 12 chiffres"
                  maxLength={12}
                />
              </div>
            </div>

            {/* ----- Ligne 2 : Code + RC ----- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-code">
                  <T k="auto.organizationsmanager.code" fallback="Code" />
                </Label>
                <Input
                  id="org-code"
                  value={form.code ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: SOMELEC-DG"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-rc">RC (Registre de Commerce)</Label>
                <Input
                  id="org-rc"
                  value={(form as any).rc ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, rc: e.target.value } as any))}
                  placeholder="Ex: 108818/GU/29827/2737/"
                />
              </div>
            </div>

            {/* ----- Ligne 3 : CB + Secteur ----- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-cb">CB (Compte Bancaire)</Label>
                <Input
                  id="org-cb"
                  value={(form as any).cb ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, cb: e.target.value } as any))}
                  placeholder="Ex: 300 73 96 /BPM"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-sector">Secteur d'activité</Label>
                <Input
                  id="org-sector"
                  value={(form as any).sector ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, sector: e.target.value } as any))}
                  placeholder="Ex: Énergie, BTP, Environnement…"
                />
              </div>
            </div>

            {/* ----- Ligne 4 : Type + Parent (groupés par catégorie) ----- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  <T k="auto.organizationsmanager.type" fallback="Type" />
                </Label>
                <Select
                  value={form.orgType ?? 'public'}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, orgType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'organisation" />
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
                  value={(form.parentOrganizationId ?? (form as any).parentId) ?? NONE}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      parentOrganizationId: value === NONE ? undefined : value,
                    } as any))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune (racine)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucune (racine)</SelectItem>
                    {parentOptions.map((organization) => (
                      <SelectItem key={organization.id} value={organization.id}>
                        {organization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ----- Ligne 5 : Email + Téléphone ----- */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-email">
                  <T k="auto.organizationsmanager.email" fallback="Email" />
                </Label>
                <Input
                  id="org-email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-phone">
                  <T k="auto.organizationsmanager.telephone" fallback="Téléphone" />
                </Label>
                <Input
                  id="org-phone"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            {/* ----- Ligne 6 : Adresse ----- */}
            <div className="space-y-2">
              <Label htmlFor="org-address">
                <T k="auto.organizationsmanager.adresse" fallback="Adresse" />
              </Label>
              <Input
                id="org-address"
                value={form.address ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            {/* ----- Ligne 7 : Description ----- */}
            <div className="space-y-2">
              <Label htmlFor="org-description">
                <T k="auto.organizationsmanager.description" fallback="Description" />
              </Label>
              <Textarea
                id="org-description"
                value={form.description ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* ----- Ligne 8 : External Ref (optionnel) ----- */}
            <div className="space-y-2">
              <Label htmlFor="org-external-ref">Référence externe (optionnel)</Label>
              <Input
                id="org-external-ref"
                value={form.externalRef ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, externalRef: e.target.value }))}
                placeholder="Ex: EXT-ORG-0001"
              />
            </div>

            {/* ----- Cases à cocher ----- */}
            <div className="flex items-center gap-2">
              <input
                id="org-default"
                type="checkbox"
                className="h-4 w-4"
                checked={form.isDefault === true}
                onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              />
              <Label htmlFor="org-default" className="font-normal">
                Organisation propriétaire par défaut des projets
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="org-active"
                type="checkbox"
                className="h-4 w-4"
                checked={form.isActive !== false}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              <Label htmlFor="org-active" className="font-normal">
                Organisation active
              </Label>
            </div>

            {/* ----- Boutons ----- */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isMutating}>
                {editingId ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? 'Enregistrer' : 'Ajouter l\'organisation'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" />
                  <T k="auto.organizationsmanager.annuler" fallback="Annuler" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ============================================================
          LISTE
          ============================================================ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <T k="auto.organizationsmanager.organisations" fallback="Organisations" />
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Chargement…' : `${organizations.length} organisation(s) enregistrée(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
          {organizations.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              Aucune organisation enregistrée.
            </p>
          )}
          {organizations.map((organization) => {
            const parentId = organization.parentOrganizationId ?? (organization as any).parentId;
            const parent = organizations.find((o) => o.id === parentId);
            const typeLabel = getOrgTypeLabel(organization.orgType);
            const typeCategory = getOrgTypeCategory(organization.orgType);
            const nif = organization.nif;

            return (
              <div key={organization.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    {/* Nom + badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{organization.name}</span>
                      {organization.isDefault && (
                        <Badge>Par défaut</Badge>
                      )}
                      {typeCategory && (
                        <Badge variant="secondary">
                          {typeCategory === 'communautaire' && '👥 '}
                          {typeCategory === 'institutionnel' && '🏛️ '}
                          {typeCategory === 'commercial' && '💼 '}
                          {typeCategory === 'ong' && '🌍 '}
                          {typeLabel}
                        </Badge>
                      )}
                      {!organization.isActive && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>

                    {/* Ligne secondaire */}
                    <p className="text-xs text-muted-foreground">
                      {[
                        organization.code,
                        nif ? `NIF: ${nif}` : null,
                        parent ? `Parent : ${parent.name}` : null,
                        organization.email,
                      ]
                        .filter(Boolean)
                        .join(' • ') || '—'}
                    </p>

                    {/* RC / CB si présents */}
                    {((organization as any).rc || (organization as any).cb) && (
                      <p className="text-xs text-muted-foreground">
                        {[
                          (organization as any).rc ? `RC: ${(organization as any).rc}` : null,
                          (organization as any).cb ? `CB: ${(organization as any).cb}` : null,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!organization.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Définir par défaut"
                        disabled={isMutating}
                        onClick={() => handleSetDefault(organization)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Modifier"
                      onClick={() => handleEdit(organization)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Supprimer"
                      disabled={isMutating}
                      onClick={() => handleDelete(organization)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationsManager;