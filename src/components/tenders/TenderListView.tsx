/**
 * TenderListView — Liste dense d'AO avec recherche/tri, badges, actions détail/édit/suppr.
 */
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Eye, Search, Calendar, FolderKanban, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TenderRow {
  id: string;
  tender_number?: string | null;
  title: string;
  description?: string | null;
  project_id?: string | null;
  status: string;
  procurement_type?: string | null;
  market_type?: string | null;
  selection_mode?: string | null;
  launch_date?: string | null;
  submission_deadline?: string | null;
  deadline_date?: string | null;
  attribution_date?: string | null;
  estimated_value?: number | null;
}

interface Props {
  tenders: TenderRow[];
  projects: Array<{ id: string; title: string }>;
  selectedTenderId?: string;
  onSelect: (t: TenderRow) => void;
  onEdit: (t: TenderRow) => void;
  onDelete: (id: string) => void;
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  open: 'bg-emerald-100 text-emerald-800',
  under_evaluation: 'bg-amber-100 text-amber-800',
  awarded: 'bg-blue-100 text-blue-800',
  contracted: 'bg-indigo-100 text-indigo-800',
  closed: 'bg-red-100 text-red-800',
  cancelled: 'bg-neutral-200 text-neutral-700',
};

const fmt = (d?: string | null) =>
  d ? format(new Date(d), 'dd MMM yyyy', { locale: fr }) : '—';

export function TenderListView({ tenders, projects, selectedTenderId, onSelect, onEdit, onDelete }: Props) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'title' | 'status' | 'deadline'>('deadline');
  const projectById = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.title])),
    [projects]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const list = tenders.filter(
      (t) =>
        !qq ||
        t.title?.toLowerCase().includes(qq) ||
        t.tender_number?.toLowerCase().includes(qq) ||
        t.description?.toLowerCase().includes(qq)
    );
    list.sort((a, b) => {
      if (sort === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'status') return (a.status || '').localeCompare(b.status || '');
      const da = a.submission_deadline || a.deadline_date || '';
      const db = b.submission_deadline || b.deadline_date || '';
      return db.localeCompare(da);
    });
    return list;
  }, [tenders, q, sort]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Rechercher (titre, N°, description)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={sort} onValueChange={(v: any) => setSort(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Deadline ↓</SelectItem>
            <SelectItem value="title">Titre A→Z</SelectItem>
            <SelectItem value="status">Statut</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-8">
          Aucun appel d'offres.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const isSelected = t.id === selectedTenderId;
            const projectTitle = t.project_id ? projectById[t.project_id] : null;
            const deadline = t.submission_deadline || t.deadline_date;
            return (
              <div
                key={t.id}
                className={`border rounded-lg p-3 space-y-2 transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {t.tender_number && (
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {t.tender_number}
                        </code>
                      )}
                      <h3 className="font-semibold truncate">{t.title}</h3>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" title="Sélectionner" onClick={() => onSelect(t)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Voir détail" asChild>
                      <Link to={`/tenders/${t.id}`}>
                        <FolderKanban className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" title="Modifier" onClick={() => onEdit(t)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" title="Supprimer" onClick={() => onDelete(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className={STATUS_STYLE[t.status] || STATUS_STYLE.draft}>{t.status}</Badge>
                  {t.selection_mode && <Badge variant="outline">{t.selection_mode}</Badge>}
                  {t.market_type && <Badge variant="outline">{t.market_type}</Badge>}
                  {t.procurement_type && <Badge variant="outline">{t.procurement_type}</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {projectTitle && (
                    <div className="col-span-2 truncate">
                      <span className="font-medium">Projet:</span> {projectTitle}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Lanc: {fmt(t.launch_date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Limite: {fmt(deadline)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Attrib: {fmt(t.attribution_date)}
                  </div>
                  <div>
                    {t.estimated_value != null && (
                      <span className="font-medium">
                        Valeur: {Number(t.estimated_value).toLocaleString('fr-FR')} MRU
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TenderListView;
