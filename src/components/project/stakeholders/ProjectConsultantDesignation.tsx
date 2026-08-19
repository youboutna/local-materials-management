/**
 * ProjectConsultantDesignation
 * Permet au chef de projet / directeur de désigner une partie prenante
 * (employé, organisation, fournisseur) comme consultant du projet.
 */
import React, { useMemo, useState } from 'react';
import { UserCheck, ShieldCheck, X, ChevronsUpDown, Check, Building2, Truck, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useProjectConsultantHex } from '@/hooks/hexagonal/useProjectConsultantHex';
import type { ProjectConsultantDTO } from '@/application/services/ProjectConsultantService';

interface ProjectConsultantDesignationProps {
  projectId?: string;
  className?: string;
}

type EntityKind = 'organization' | 'supplier' | 'employee';

const KIND_META: Record<EntityKind, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  organization: { label: 'Organisations', icon: Building2 },
  supplier: { label: 'Fournisseurs', icon: Truck },
  employee: { label: 'Employés', icon: User },
};

/** Classe une partie prenante selon son type d'entité (référentiel métier stakeholders). */
const classify = (s: ProjectConsultantDTO): EntityKind => {
  const hay = `${s.entityType} ${s.businessRole}`.toLowerCase();
  if (s.employeeId || hay.includes('employee') || hay.includes('employé') || hay.includes('agent')) {
    return 'employee';
  }
  if (hay.includes('supplier') || hay.includes('vendor') || hay.includes('fournisseur') || hay.includes('contractor')) {
    return 'supplier';
  }
  if (s.supplierId) return 'supplier';
  return 'organization';
};

const ProjectConsultantDesignation: React.FC<ProjectConsultantDesignationProps> = ({
  projectId,
  className,
}) => {
  const {
    stakeholders,
    consultants,
    isLoading,
    canDesignate,
    labels,
    designateConsultant,
    revokeConsultant,
    isPending,
  } = useProjectConsultantHex(projectId);

  const [selected, setSelected] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [kindFilter, setKindFilter] = useState<'all' | EntityKind>('all');

  const eligible = useMemo(() => stakeholders.filter((s) => !s.isConsultant), [stakeholders]);

  /** Regroupement par type d'entité, filtré par l'onglet actif. */
  const groups = useMemo(() => {
    const base: Record<EntityKind, ProjectConsultantDTO[]> = {
      organization: [],
      supplier: [],
      employee: [],
    };
    for (const s of eligible) base[classify(s)].push(s);
    (Object.keys(base) as EntityKind[]).forEach((k) =>
      base[k].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    );
    if (kindFilter === 'all') return base;
    return { organization: [], supplier: [], employee: [], [kindFilter]: base[kindFilter] } as Record<
      EntityKind,
      ProjectConsultantDTO[]
    >;
  }, [eligible, kindFilter]);

  const selectedLabel = eligible.find((s) => s.stakeholderId === selected)?.name ?? '';
  const visibleCount = (Object.values(groups) as ProjectConsultantDTO[][]).reduce((n, g) => n + g.length, 0);

  return (
    <Card className={className}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {labels.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Consultants désignés */}
        <div className="space-y-2">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Chargement des parties prenantes…</p>
          )}
          {!isLoading && consultants.length === 0 && (
            <p className="text-sm text-muted-foreground">{labels.none}</p>
          )}
          {consultants.map((c) => (
            <div
              key={c.stakeholderId}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.entityType || 'partie prenante'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge>{labels.badge}</Badge>
                {canDesignate && (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={labels.revoke}
                    title={labels.revoke}
                    disabled={isPending}
                    onClick={() => revokeConsultant(c.stakeholderId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Désignation */}
        {canDesignate ? (
          <div className="space-y-2">
            <Tabs value={kindFilter} onValueChange={(v) => setKindFilter(v as 'all' | EntityKind)}>
              <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto sm:grid sm:grid-cols-4">
                <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
                <TabsTrigger value="organization" className="text-xs">Organisations</TabsTrigger>
                <TabsTrigger value="supplier" className="text-xs">Fournisseurs</TabsTrigger>
                <TabsTrigger value="employee" className="text-xs">Employés</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col sm:flex-row gap-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Rechercher une partie prenante"
                    className="sm:flex-1 justify-between font-normal"
                  >
                    <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
                      {selectedLabel || 'Rechercher une organisation, un fournisseur, un employé…'}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[min(28rem,90vw)]" align="start">
                  <Command>
                    <CommandInput placeholder="Saisir un nom…" />
                    <CommandList>
                      <CommandEmpty>
                        {visibleCount === 0
                          ? 'Aucune partie prenante disponible pour ce type.'
                          : 'Aucun résultat.'}
                      </CommandEmpty>
                      {(Object.keys(KIND_META) as EntityKind[]).map((kind) => {
                        const items = groups[kind];
                        if (!items.length) return null;
                        const Icon = KIND_META[kind].icon;
                        return (
                          <CommandGroup key={kind} heading={KIND_META[kind].label}>
                            {items.map((s) => (
                              <CommandItem
                                key={s.stakeholderId}
                                value={`${s.name} ${s.businessRole} ${s.entityType}`}
                                onSelect={() => {
                                  setSelected(s.stakeholderId);
                                  setOpen(false);
                                }}
                              >
                                <Icon className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm truncate">{s.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {s.businessRole || s.entityType || 'partie prenante'}
                                  </p>
                                </div>
                                {selected === s.stakeholderId && (
                                  <Check className="h-4 w-4 text-primary shrink-0" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        );
                      })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                disabled={!selected || isPending || !projectId}
                onClick={async () => {
                  const ok = await designateConsultant(selected);
                  if (ok) setSelected('');
                }}
              >
                <UserCheck className="h-4 w-4 mr-1" />
                {labels.designate}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{labels.unauthorized}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectConsultantDesignation;
