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

  const eligible = stakeholders.filter((s) => !s.isConsultant);

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
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger aria-label="Sélectionner une partie prenante" className="sm:flex-1">
                <SelectValue placeholder="Sélectionner une partie prenante" />
              </SelectTrigger>
              <SelectContent>
                {eligible.length === 0 && (
                  <SelectItem value="__none" disabled>
                    Aucune partie prenante disponible
                  </SelectItem>
                )}
                {eligible.map((s) => (
                  <SelectItem key={s.stakeholderId} value={s.stakeholderId}>
                    {s.name} — {s.businessRole || s.entityType || 'partie prenante'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!selected || selected === '__none' || isPending || !projectId}
              onClick={async () => {
                const ok = await designateConsultant(selected);
                if (ok) setSelected('');
              }}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              {labels.designate}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{labels.unauthorized}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectConsultantDesignation;
