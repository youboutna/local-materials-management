/**
 * BoqDocumentList — Vue Liste des documents BOQ pour un contexte donné
 * (Projet DQE, Estimation tender, Devis fournisseur, Facture fournisseur).
 * Agrège btp.boq_lines par `document_id` via useBoqDocumentList.
 *
 * Aucune requête directe Supabase : uniquement le repository hexagonal.
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import type { BoqDocumentSummary } from '@/dtos/boq/BoqLineDTO';
import { useBoqDocumentList } from '@/hooks/hexagonal/useBoqDocumentList';
import { useToast } from '@/hooks/use-toast';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { Eye, FileSpreadsheet, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { T } from '@/components/i18n/T';
import { useI18n } from '@/hooks/useI18n';

interface Props {
  source: BoqSource;
  contextId: string;
  projectId?: string;
  title: string;
  docPrefix: string; // dqe | devis | facture | estimation
  onOpen: (documentId: string) => void;
  onCreate: (newDocumentId: string) => void;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary', submitted: 'default', validated: 'default', rejected: 'destructive',
  invoiced: 'default', paid: 'default', archived: 'outline', mixed: 'outline',
};

const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

export const BoqDocumentList: React.FC<Props> = ({ source, contextId, projectId, title, docPrefix, onOpen, onCreate }) => {
  const { t, translateStatus, locale } = useI18n();
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
      window.dispatchEvent(new Event('boq-kpi-refresh'));
      await invalidate();
      toast({ title: 'Document supprimé', description: `${lines.length} ligne(s) supprimée(s).` });
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
            <SelectItem value="all"><T k="auto.boqdocumentlist.tous_les_statuts" fallback="Tous les statuts" /></SelectItem>
             {Object.keys(STATUS_VARIANT).map((code) => (
               <SelectItem key={code} value={code}>{code === 'mixed' ? t('dqe.status.mixed') : translateStatus(code)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3"><T k="auto.boqdocumentlist.reference" fallback="Référence" /></th>
              <th className="text-left p-3"><T k="auto.boqdocumentlist.intitule" fallback="Intitulé" /></th>
              <th className="text-right p-3"><T k="auto.boqdocumentlist.lignes" fallback="Lignes" /></th>
              <th className="text-right p-3"><T k="auto.boqdocumentlist.montant_ht" fallback="Montant HT" /></th>
              <th className="text-left p-3"><T k="auto.boqdocumentlist.statut" fallback="Statut" /></th>
              <th className="text-right p-3"><T k="auto.boqdocumentlist.actions" fallback="Actions" /></th>
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
               const variant = STATUS_VARIANT[d.status] ?? STATUS_VARIANT.draft;
               const readOnly = d.readOnly;
              return (
                <tr
                  key={d.documentId}
                  className="border-t hover:bg-muted/30 cursor-pointer"
                  onClick={() => onOpen(d.documentId)}
                >
                  <td className="p-3 font-mono text-xs">{docPrefix.toUpperCase()}-{d.reference}</td>
                  <td className="p-3">{d.title || <span className="text-muted-foreground italic"><T k="auto.boqdocumentlist.sans_titre" fallback="Sans titre" /></span>}</td>
                  <td className="p-3 text-right">{d.lineCount}</td>
                   <td className="p-3 text-right font-medium">{d.totalHt.toLocaleString(locale, { maximumFractionDigits: 2 })} MRU</td>
                   <td className="p-3"><Badge variant={variant}>{d.status === 'mixed' ? t('dqe.status.mixed') : translateStatus(d.status)}</Badge></td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onOpen(d.documentId)}
                        title={readOnly ? t('dqe.action.view') : t('dqe.action.edit')}
                      >
                        {readOnly ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(d)}
                        disabled={readOnly}
                        title={readOnly ? t('dqe.locked_transmitted') : t('common.delete')}
                      >
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
