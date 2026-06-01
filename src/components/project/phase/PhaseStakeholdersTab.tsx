/**
 * PhaseStakeholdersTab
 * Onglet parties prenantes filtré par "concerns" (rôle) — chaque partie prenante
 * voit/atteint son périmètre métier propre via deep-links.
 *
 * - Fournisseur (vendor) → /supplier-portal/:stakeholderId
 * - Bureau de contrôle / Inspecteur (consultant/architect) → /inspections?phaseId=
 * - Entrepreneur (contractor) → /decompte?phaseId=
 * - Manager (project_manager) → /projects/:projectId
 *
 * Source des rôles : config/referentials/stakeholderRoles.ts + StakeholderDTO.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  HardHat,
  ShieldCheck,
  Truck,
  UserCog,
  ExternalLink,
  Users as UsersIcon,
} from 'lucide-react';
import { useStakeholdersHex } from '@/hooks/hexagonal';
import {
  StakeholderResponseDTO,
  StakeholderType,
  StakeholderRole,
} from '@/dtos/entities/StakeholderDTO';

interface PhaseStakeholdersTabProps {
  projectId: string;
  phaseId: string;
}

type Concern = 'suppliers' | 'inspectors' | 'contractors' | 'managers' | 'others';

interface ConcernGroup {
  key: Concern;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  matches: (s: StakeholderResponseDTO) => boolean;
  deepLink: (s: StakeholderResponseDTO, ctx: { projectId: string; phaseId: string }) => string;
  deepLinkLabel: string;
}

const CONCERN_GROUPS: ConcernGroup[] = [
  {
    key: 'suppliers',
    label: 'Fournisseurs',
    icon: Truck,
    description: 'Bons de commande, livraisons et factures.',
    matches: (s) =>
      s.stakeholderType === StakeholderType.VENDOR ||
      s.role === StakeholderRole.VENDOR,
    deepLink: (s) => `/supplier-portal/${s.id}`,
    deepLinkLabel: 'Portail fournisseur',
  },
  {
    key: 'inspectors',
    label: 'Bureaux de conseil / Inspecteurs',
    icon: ShieldCheck,
    description: 'Inspections planifiées, checkpoints et PV.',
    matches: (s) =>
      s.role === StakeholderRole.CONSULTANT ||
      s.role === StakeholderRole.ARCHITECT,
    deepLink: (_s, { phaseId }) => `/inspections?phaseId=${phaseId}`,
    deepLinkLabel: 'Inspections de la phase',
  },
  {
    key: 'contractors',
    label: 'Entrepreneurs / Contractants',
    icon: HardHat,
    description: 'Décomptes, situations et paiements.',
    matches: (s) =>
      s.role === StakeholderRole.CONTRACTOR ||
      s.stakeholderType === StakeholderType.PRINCIPAL_CONTRACTOR,
    deepLink: (_s, { projectId, phaseId }) =>
      `/projects/${projectId}/phases/${phaseId}?tab=workflow`,
    deepLinkLabel: 'Workflow & décomptes',
  },
  {
    key: 'managers',
    label: 'Équipe projet',
    icon: UserCog,
    description: 'Chef de projet et coordonnateurs internes.',
    matches: (s) =>
      s.role === StakeholderRole.PROJECT_MANAGER ||
      s.role === StakeholderRole.TEAM_LEAD,
    deepLink: (_s, { projectId }) => `/projects/${projectId}`,
    deepLinkLabel: 'Vue projet',
  },
];

const PhaseStakeholdersTab: React.FC<PhaseStakeholdersTabProps> = ({ projectId, phaseId }) => {
  const { stakeholders, isLoading } = useStakeholdersHex(projectId);

  const grouped = useMemo(() => {
    const out = new Map<Concern, StakeholderResponseDTO[]>();
    CONCERN_GROUPS.forEach((g) => out.set(g.key, []));
    const matchedIds = new Set<string>();

    for (const s of stakeholders) {
      for (const g of CONCERN_GROUPS) {
        if (g.matches(s)) {
          out.get(g.key)!.push(s);
          matchedIds.add(s.id);
          break;
        }
      }
    }
    const others = stakeholders.filter((s) => !matchedIds.has(s.id));
    out.set('others', others);
    return out;
  }, [stakeholders]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement des parties prenantes…
        </CardContent>
      </Card>
    );
  }

  if (!stakeholders.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <UsersIcon className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            Aucune partie prenante associée à ce projet.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to={`/projects/${projectId}?tab=stakeholders`}>
              Gérer les parties prenantes
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const othersGroup: ConcernGroup = {
    key: 'others',
    label: 'Autres',
    icon: Building2,
    description: 'Parties prenantes sans rôle métier mappé.',
    matches: () => false,
    deepLink: (_s, { projectId }) => `/projects/${projectId}?tab=stakeholders`,
    deepLinkLabel: 'Détails',
  };

  const allGroups = [...CONCERN_GROUPS, othersGroup];
  const visibleGroups = allGroups.filter((g) => (grouped.get(g.key) || []).length > 0);

  return (
    <Tabs defaultValue={visibleGroups[0]?.key || 'suppliers'} className="space-y-4">
      <TabsList className="flex-wrap h-auto">
        {visibleGroups.map((g) => {
          const Icon = g.icon;
          const count = grouped.get(g.key)?.length || 0;
          return (
            <TabsTrigger key={g.key} value={g.key} className="gap-2">
              <Icon className="h-4 w-4" />
              {g.label}
              <Badge variant="secondary" className="ml-1">
                {count}
              </Badge>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {visibleGroups.map((g) => {
        const items = grouped.get(g.key) || [];
        const Icon = g.icon;
        return (
          <TabsContent key={g.key} value={g.key} className="space-y-3">
            <p className="text-sm text-muted-foreground">{g.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((s) => (
                <Card key={s.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{s.name}</span>
                      </span>
                      {s.isPrimary && <Badge variant="default">Principal</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs text-muted-foreground space-y-1">
                      {s.role && <div>Rôle : {String(s.role)}</div>}
                      {s.organization && <div>Organisation : {s.organization}</div>}
                      {s.email && <div>Email : {s.email}</div>}
                      {s.phone && <div>Téléphone : {s.phone}</div>}
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to={g.deepLink(s, { projectId, phaseId })}>
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        {g.deepLinkLabel}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
};

export default PhaseStakeholdersTab;
