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

const NONE = '__none__';

const emptyForm: CreateOrganizationDTO = {
  name: '',
  code: '',
  orgType: 'owner',
  description: '',
  address: '',
  phone: '',
  email: '',
  parentId: undefined,
  isDefault: false,
  isActive: true,
};

const ORG_TYPES = [
  { value: 'owner', label: 'Maître d’ouvrage (propriétaire)' },
  { value: 'delegate', label: 'Maître d’ouvrage délégué' },
  { value: 'contractor', label: 'Entreprise / Contractant' },
  { value: 'consultant', label: 'Bureau d’études / Consultant' },
  { value: 'donor', label: 'Bailleur / Financeur' },
  { value: 'other', label: 'Autre' },
];

const OrganizationsManager: React.FC = () => {
  const { data, isLoading, create, update, remove, setDefault, isMutating } = useOrganizations();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateOrganizationDTO>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const organizations = useMemo<OrganizationDTO[]>(() => data ?? [], [data]);
  const parentOptions = useMemo(
    () => organizations.filter((o) => o.id !== editingId),
    [organizations, editingId]
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name?.trim()) {
      toast({ title: 'Nom requis', description: 'Renseignez le nom de l’organisation', variant: 'destructive' });
      return;
    }
    try {
      if (editingId) {
        await update({ id: editingId, data: form });
        toast({ title: 'Organisation mise à jour', description: form.name });
      } else {
        await create(form);
        toast({ title: 'Organisation créée', description: form.name });
      }
      resetForm();
    } catch (error) {
      toast({
        title: 'Erreur',
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
      orgType: organization.orgType ?? 'owner',
      description: organization.description ?? '',
      address: organization.address ?? '',
      phone: organization.phone ?? '',
      email: organization.email ?? '',
      externalRef: organization.externalRef,
      parentId: organization.parentId,
      isDefault: organization.isDefault ?? false,
      isActive: organization.isActive,
    });
  };

  const handleDelete = async (organization: OrganizationDTO) => {
    try {
      await remove(organization.id);
      if (editingId === organization.id) resetForm();
      toast({ title: 'Organisation supprimée', description: organization.name });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Suppression impossible',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (organization: OrganizationDTO) => {
    try {
      await setDefault(organization.id);
      toast({
        title: 'Organisation par défaut',
        description: `${organization.name} sera propriétaire des nouveaux projets`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Mise à jour impossible',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingId ? 'Modifier l’organisation' : 'Nouvelle organisation'}
          </CardTitle>
          <CardDescription>
            Définissez les organisations et leur hiérarchie. L’organisation par défaut est rattachée
            automatiquement aux nouveaux projets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Nom *</Label>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex : SOMELEC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-code">Code</Label>
                <Input
                  id="org-code"
                  value={form.code ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex : SOMELEC_DG"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.orgType ?? 'owner'}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, orgType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type d’organisation" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Organisation parente</Label>
                <Select
                  value={form.parentId ?? NONE}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, parentId: value === NONE ? undefined : value }))
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-email">Email</Label>
                <Input
                  id="org-email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-phone">Téléphone</Label>
                <Input
                  id="org-phone"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-address">Adresse</Label>
              <Input
                id="org-address"
                value={form.address ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">Description</Label>
              <Textarea
                id="org-description"
                value={form.description ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

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

            <div className="flex gap-2">
              <Button type="submit" disabled={isMutating}>
                {editingId ? <Check className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? 'Enregistrer' : 'Ajouter l’organisation'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organisations
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Chargement…' : `${organizations.length} organisation(s) enregistrée(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
          {organizations.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">Aucune organisation enregistrée.</p>
          )}
          {organizations.map((organization) => {
            const parent = organizations.find((o) => o.id === organization.parentId);
            return (
              <div key={organization.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{organization.name}</span>
                      {organization.isDefault && <Badge>Par défaut</Badge>}
                      {organization.orgType && <Badge variant="secondary">{organization.orgType}</Badge>}
                      {!organization.isActive && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[organization.code, parent ? `Parent : ${parent.name}` : null, organization.email]
                        .filter(Boolean)
                        .join(' • ') || '—'}
                    </p>
                  </div>
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
                    <Button variant="ghost" size="icon" title="Modifier" onClick={() => handleEdit(organization)}>
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
