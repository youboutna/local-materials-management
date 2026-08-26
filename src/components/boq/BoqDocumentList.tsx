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
import { Checkbox } from '@/components/ui/checkbox';
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

export const BoqDocumentList: React.FC<Props> = ({ source, contextId, projectId, title, docPrefix, onOpen, onCreate }) => {
  const { t, translateStatus, locale } = useI18n();
  const { toast } = useToast();
  const { documents, rawLines, isLoading, invalidate } = useBoqDocumentList({ source, contextId, projectId });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  /** Suppression optimiste : documents retirés visuellement avant la resynchro serveur. */
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const visibleDocuments = useMemo(
    () => documents.filter((d) => !removedIds.includes(d.documentId)),
    [documents, removedIds],
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return visibleDocuments.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (!s) return true;
      return (
        d.reference.toLowerCase().includes(s) ||
        d.title.toLowerCase().includes(s)
      );
    });
  }, [visibleDocuments, search, statusFilter]);

  /** Ids des lignes appartenant aux documents ciblés (fallback legacy : document_id null). */
  const lineIdsOf = (documentIds: string[]) =>
    rawLines
      .filter((l) => documentIds.includes(l.documentId ?? l.contextId ?? ''))
      .map((l) => l.id)
      .filter((id): id is string => Boolean(id));

  const deleteDocuments = async (docs: BoqDocumentSummary[]) => {
    if (!docs.length || isDeleting) return;
    const ids = docs.map((d) => d.documentId);
    const label = docs.length === 1
      ? `${docPrefix.toUpperCase()}-${docs[0].reference}`
      : `${docs.length} ${t('dqe.navigation.list')}`;
    if (!window.confirm(t('common.confirm_delete_named', { name: label }) || `Supprimer ${label} ?`)) return;

    setIsDeleting(true);
    // 1. Retrait optimiste immédiat de la liste.
    setRemovedIds((prev) => [...prev, ...ids]);
    try {
      let lineIds = lineIdsOf(ids);
      if (!lineIds.length) {
        // Filet de sécurité : relecture serveur si le cache local est vide.
        const fetched = await Promise.all(
          ids.map((documentId) => boqRepository.list({ source, contextId, projectId, documentId })),
        );
        lineIds = fetched.flat().map((l) => l.id).filter((id): id is string => Boolean(id));
      }
      const deleted = await boqRepository.deleteMany(lineIds, source);
      if (!deleted) throw new Error(t('common.delete_nothing_deleted') || 'Aucune ligne supprimée côté serveur.');

      window.dispatchEvent(new Event('boq-kpi-refresh'));
      // 2. Resynchronisation serveur AVANT le toast de succès.
      await invalidate();
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
      toast({
        title: docs.length === 1 ? 'Document supprimé' : 'Documents supprimés',
        description: docs.length === 1
          ? `1 document supprimé (${deleted} ligne(s)).`
          : `${docs.length} documents supprimés (${deleted} ligne(s)).`,
      });
    } catch (e) {
      // 3. Échec : on restaure la ligne dans l'interface.
      setRemovedIds((prev) => prev.filter((id) => !ids.includes(id)));
      toast({
        title: 'Suppression échouée',
        description: String(e instanceof Error ? e.message : e),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (doc: BoqDocumentSummary) => deleteDocuments([doc]);

  const selectedDocs = useMemo(
    () => filtered.filter((d) => selected.includes(d.documentId) && !d.readOnly),
    [filtered, selected],
  );

  const toggleSelect = (documentId: string) =>
    setSelected((prev) => (prev.includes(documentId) ? prev.filter((id) => id !== documentId) : [...prev, documentId]));

  const allSelectable = filtered.filter((d) => !d.readOnly).map((d) => d.documentId);
  const allChecked = allSelectable.length > 0 && allSelectable.every((id) => selected.includes(id));

  const handleNew = () => {
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `doc-${Date.now()}`;
    onCreate(id);
  };

  const resolveTitle = (doc: BoqDocumentSummary) => {
    if (doc.title?.trim()) return doc.title.trim();
    return `${docPrefix.toUpperCase()} ${doc.reference}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{title} · {t('dqe.navigation.list')}</h2>
          <Badge variant="outline">{filtered.length} / {visibleDocuments.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {selectedDocs.length > 0 && (
            <Button variant="destructive" size="sm" disabled={isDeleting} onClick={() => deleteDocuments(selectedDocs)}>
              <Trash2 className="h-4 w-4 mr-1" /> {t('common.delete')} ({selectedDocs.length})
            </Button>
          )}
          <Button onClick={handleNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> {t('dqe.navigation.new')}
          </Button>
        </div>
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

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <colgroup>
            <col className="w-10" />
            <col className="w-[18%]" />
            <col />
            <col className="w-[9%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[7rem]" />
          </colgroup>
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">
                <Checkbox
                  checked={allChecked}
                  disabled={allSelectable.length === 0}
                  onCheckedChange={() => setSelected(allChecked ? [] : allSelectable)}
                  aria-label={t('common.select_all')}
                />
              </th>
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
              <tr><td colSpan={7} className="text-center p-6 text-muted-foreground">Chargement…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">
                {t('dqe.empty.create_hint')}
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
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.includes(d.documentId)}
                      disabled={readOnly}
                      onCheckedChange={() => toggleSelect(d.documentId)}
                      aria-label={`${docPrefix.toUpperCase()}-${d.reference}`}
                    />
                  </td>
                  <td className="p-3 font-medium truncate">{docPrefix.toUpperCase()}-{d.reference}</td>
                  <td className="p-3 truncate">{resolveTitle(d)}</td>
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
                        disabled={readOnly || isDeleting}
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
