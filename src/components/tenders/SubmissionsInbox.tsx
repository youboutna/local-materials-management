/**
 * SubmissionsInbox
 * Vue centralisée de réception des soumissions pour un appel d'offres.
 * Filtres statut/fournisseur, badges deadline, actions (voir, évaluer, log).
 *
 * @see .lovable/plan.md — Lot 1
 */

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ClipboardCheck, Eye, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TenderService } from '@/application/services/TenderService';

export interface SubmissionsInboxProps {
  tenderId: string;
  tenderDeadline?: string | null;
  onOpenSubmission?: (submissionId: string) => void;
  onEvaluate?: (submissionId: string) => void;
}

export function SubmissionsInbox({ tenderId, tenderDeadline, onOpenSubmission, onEvaluate }: SubmissionsInboxProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: submissions = [], isLoading, isError } = useQuery({
    queryKey: ['tender-submissions', tenderId],
    queryFn: () => TenderService.getTenderSubmissions(tenderId),
    enabled: !!tenderId,
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(submissions) ? submissions : [];
    return list.filter((s: any) => {
      const matchSearch = !search ||
        s.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.supplier_email?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [submissions, search, statusFilter]);

  const stats = useMemo(() => {
    const list = Array.isArray(submissions) ? submissions : [];
    return {
      total: list.length,
      submitted: list.filter((s: any) => s.status === 'submitted').length,
      review: list.filter((s: any) => s.status === 'under_review').length,
      approved: list.filter((s: any) => s.status === 'approved').length,
    };
  }, [submissions]);

  const isDeadlinePassed = tenderDeadline ? new Date(tenderDeadline) < new Date() : false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-4 w-4" />
            Boîte de réception des soumissions
            <Badge variant="secondary">{stats.total}</Badge>
          </CardTitle>
          {isDeadlinePassed && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Deadline dépassée
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 pt-2 text-xs">
          <StatChip label="Total" value={stats.total} />
          <StatChip label="Soumises" value={stats.submitted} tone="blue" />
          <StatChip label="En revue" value={stats.review} tone="amber" />
          <StatChip label="Approuvées" value={stats.approved} tone="emerald" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher fournisseur ou email…"
              className="pl-8 h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="submitted">Soumises</SelectItem>
              <SelectItem value="under_review">En revue</SelectItem>
              <SelectItem value="approved">Approuvées</SelectItem>
              <SelectItem value="rejected">Rejetées</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground py-6 text-center">Chargement…</p>}
        {isError && <p className="text-sm text-destructive py-6 text-center">Erreur de chargement.</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Aucune soumission.</p>
        )}

        <ul className="divide-y">
          {filtered.map((s: any) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{s.supplier_name || 'Fournisseur inconnu'}</p>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="truncate">{s.supplier_email}</span>
                  {s.submission_date && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(s.submission_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => onOpenSubmission?.(s.id)}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Voir
                </Button>
                <Button size="sm" onClick={() => onEvaluate?.(s.id)}>
                  Évaluer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function StatChip({ label, value, tone }: { label: string; value: number; tone?: 'blue' | 'amber' | 'emerald' }) {
  const toneClass =
    tone === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200'
    : tone === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : tone === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-muted text-foreground';
  return (
    <div className={`rounded border px-2 py-1 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-base font-semibold leading-none">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    submitted: { label: 'Soumise', variant: 'default' },
    under_review: { label: 'En revue', variant: 'secondary' },
    approved: { label: 'Approuvée', variant: 'default' },
    rejected: { label: 'Rejetée', variant: 'destructive' },
    draft: { label: 'Brouillon', variant: 'outline' },
  };
  const cfg = map[status || ''] ?? { label: status || 'Inconnu', variant: 'outline' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default SubmissionsInbox;
