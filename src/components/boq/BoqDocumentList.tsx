/**
 * BoqDocumentList — Vue Liste des documents BOQ pour un contexte donné
 * (Projet DQE, Estimation tender, Devis fournisseur, Facture fournisseur).
 * Agrège btp.boq_lines par `document_id` via useBoqDocumentList.
 *
 * Aucune requête directe Supabase : uniquement le repository hexagonal.
 */
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Download, Plus, Search, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBoqDocumentList } from '@/hooks/hexagonal/useBoqDocumentList';
import { boqRepository } from '@/infrastructure/supabase/adapters/SupabaseBoqRepository';
import type { BoqSource } from '@/domain/boq/BoqLine';
import type { BoqDocumentSummary } from '@/dtos/boq/BoqLineDTO';

interface Props {
  source: BoqSource;
  contextId: string;
  projectId?: string;
  title: string;
  docPrefix: string; // dqe | devis | facture | estimation
  onOpen: (documentId: string) => void;
  onCreate: (newDocumentId: string) => void;
}

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  submitted: { label: 'En cours', variant: 'default' },
  validated: { label: 'Validé', variant: 'default' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
  invoiced: { label: 'Facturé', variant: 'default' },
  paid: { label: 'Payé', variant: 'default' },
  archived: { label: 'Archivé', variant: 'outline' },
  mixed: { label: 'Mixte', variant: 'outline' },
};

const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

export const BoqDocumentList: React.FC<Props> = ({ source, contextId, projectId, title, docPrefix, onOpen, onCreate }) => {
  const { toast } = useToast();
  const { documents, isLoading, invalidate } = useBoqDocumentList({ source, contextId, projectId });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!s) return true;
      return (
        d.reference.toLowerCase().includes(s) ||
        d.title.toLowerCase().includes(s)
      );
    });
  }, [documents, search, statusFilter]);

  const handleDelete = async (doc: BoqDocumentSummary) => {
    if (!window.confirm(`Supprimer ${docPrefix.toUpperCase()}-${doc.reference} et ses ${doc.lineCount} ligne(s) ?`)) return;
    try {
      // Récupérer les IDs des lignes du document et les supprimer une par une (repo hexagonal).
      const lines = await boqRepository.list({ source, contextId, projectId, documentId: doc.documentId });
      for (const l of lines) if (l.id) await boqRepository.delete(l.id, source);
      toast({ title: 'Document supprimé' });
      invalidate();
    } catch (e) {
      toast({ title: 'Suppression échouée', description: String(e instanceof Error ? e.message : e), variant: 'destructive' });
    }
  };

  const handleNew = () => {
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `doc-${Date.now()}`;
    onCreate(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{title} · Liste</h2>
          <Badge variant="outline">{filtered.length} / {documents.length}</Badge>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nouveau {docPrefix.toUpperCase()}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher référence ou titre…" className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Référence</th>
              <th className="text-left p-3">Intitulé</th>
              <th className="text-right p-3">Lignes</th>
              <th className="text-right p-3">Montant HT</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center p-6 text-muted-foreground">Chargement…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center p-8 text-muted-foreground">
                Aucun document. Cliquez « Nouveau {docPrefix.toUpperCase()} » pour commencer.
              </td></tr>
            ) : filtered.map((d) => {
              const st = STATUS_LABEL[d.status] ?? STATUS_LABEL.draft;
              return (
                <tr
                  key={d.documentId}
                  className="border-t hover:bg-muted/30 cursor-pointer"
                  onClick={() => onOpen(d.documentId)}
                >
                  <td className="p-3 font-mono text-xs">{docPrefix.toUpperCase()}-{d.reference}</td>
                  <td className="p-3">{d.title || <span className="text-muted-foreground italic">Sans titre</span>}</td>
                  <td className="p-3 text-right">{d.lineCount}</td>
                  <td className="p-3 text-right font-medium">{fmt(d.totalHt)} MRU</td>
                  <td className="p-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => onOpen(d.documentId)} title="Ouvrir">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(d)} title="Supprimer">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BoqDocumentList;
