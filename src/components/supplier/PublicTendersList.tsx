/**
 * PublicTendersList
 * Liste publique des appels d'offres ouverts (portail fournisseur).
 * Accès anonyme via la policy RLS `Anonymous can read active public tenders`.
 * Filtres : recherche, statut. Cartes compactes avec badge deadline.
 *
 * @see .lovable/plan.md — Lot 2
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Calendar, MapPin, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { btpClient } from '@/integrations/supabase/schema-clients';

export interface PublicTendersListProps {
  onSelect?: (tenderId: string) => void;
}

interface PublicTender {
  id: string;
  title: string;
  description?: string;
  status: string;
  deadline_date?: string;
  publication_date?: string;
  market_type?: string;
  budget_max?: number;
  project_reference?: string;
}

export function PublicTendersList({ onSelect }: PublicTendersListProps) {
  const [search, setSearch] = useState('');

  const { data: tenders = [], isLoading, isError } = useQuery({
    queryKey: ['public-tenders-open'],
    queryFn: async (): Promise<PublicTender[]> => {
      // Accès anonyme autorisé par policy RLS (statut public + deadline valide).
      const { data, error } = await btpClient.from('tenders')
        .select('id, title, description, status, deadline_date, publication_date, market_type, budget_max, project_reference')
        .in('status', ['published', 'open'])
        .order('deadline_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      console.debug('[PublicTendersList] loaded tenders', { count: data?.length ?? 0 });
      return (data as PublicTender[]) ?? [];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!search) return tenders;
    const q = search.toLowerCase();
    return tenders.filter((t) =>
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.project_reference?.toLowerCase().includes(q)
    );
  }, [tenders, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un appel d'offres…"
            className="pl-8"
          />
        </div>
        <Badge variant="secondary">{filtered.length} AO ouvert{filtered.length > 1 ? 's' : ''}</Badge>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Chargement…</p>}
      {isError && <p className="text-sm text-destructive text-center py-8">Erreur lors du chargement.</p>}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Aucun appel d'offres ouvert actuellement.</p>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const daysLeft = t.deadline_date
            ? Math.ceil((new Date(t.deadline_date).getTime() - Date.now()) / 86400000)
            : null;
          const isUrgent = daysLeft !== null && daysLeft <= 7;
          return (
            <Card key={t.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardContent className="p-4 flex flex-col flex-1 gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">{t.title}</h3>
                  <Badge variant={t.status === 'open' ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
                    {t.status === 'open' ? 'Ouvert' : 'Publié'}
                  </Badge>
                </div>
                {t.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-[11px] mt-auto pt-2">
                  {t.market_type && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <FileText className="h-3 w-3" /> {t.market_type}
                    </span>
                  )}
                  {t.deadline_date && (
                    <span className={`inline-flex items-center gap-1 ${isUrgent ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      <Calendar className="h-3 w-3" />
                      {daysLeft !== null && daysLeft > 0 ? `${daysLeft} j restants` : 'Deadline dépassée'}
                    </span>
                  )}
                  {t.project_reference && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {t.project_reference}
                    </span>
                  )}
                </div>
                <Button size="sm" onClick={() => onSelect?.(t.id)} className="mt-2 w-full">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Consulter et soumissionner
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PublicTendersList;
