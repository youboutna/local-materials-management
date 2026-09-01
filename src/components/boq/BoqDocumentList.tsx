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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Eye, FileSpreadsheet, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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

/** Statuts autorisant la réédition du document (codes canoniques minuscules côté DTO). */
const EDITABLE_STATUSES = new Set(['draft', 'reopen', 'reopened', 'rejected']);


type SortKey = 'reference' | 'title' | 'lineCount' | 'totalHt' | 'totalTtc' | 'status' | 'createdAt' | 'updatedAt';

const PAGE_SIZES = [20, 50, 100];

export const BoqDocumentList: React.FC<Props> = ({ source, contextId, projectId, title, docPrefix, onOpen, onCreate }) => {
  const { t, translateStatus, locale } = useI18n();
  const { toast } = useToast();
  const { documents, rawLines, isLoading, invalidate } = useBoqDocumentList({ source, contextId, projectId });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  /** Suppression optimiste : documents retirés visuellement avant la resynchro serveur. */
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  /** Documents en attente de confirmation de suppression (modale). */
  const [pendingDelete, setPendingDelete] = useState<BoqDocumentSummary[]>([]);


  const visibleDocuments = useMemo(
    () => documents.filter((d) => !removedIds.includes(d.documentId)),
    [documents, removedIds],
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const rows = visibleDocuments.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (fromDate && (d.createdAt ?? '').slice(0, 10) < fromDate) return false;
      if (toDate && (d.createdAt ?? '').slice(0, 10) > toDate) return false;
      if (!s) return true;
      return (
        d.reference.toLowerCase().includes(s) ||
        d.title.toLowerCase().includes(s)
      );
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va ?? '').localeCompare(String(vb ?? '')) * dir;
    });
  }, [visibleDocuments, search, statusFilter, fromDate, toDate, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = useMemo(
    () => filtered.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [filtered, safePage, pageSize],
  );

  const toggleSort = (key: SortKey) =>
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleDateString(locale) : '—');
  const fmtMoney = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 });

  /** Export CSV de la liste filtrée (séparateur `;`, compatible Excel FR). */
  const exportCsv = () => {
    const header = ['Référence', 'Intitulé', 'Lignes', 'Montant HT', 'TVA', 'Montant TTC', 'Statut', 'Créé le', 'Modifié le'];
    const rows = filtered.map((d) => [
      `${docPrefix.toUpperCase()}-${d.reference}`,
      d.title ?? '',
      d.lineCount,
      d.totalHt,
      d.totalVat,
      d.totalTtc,
      d.status,
      d.createdAt,
      d.updatedAt,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docPrefix}-liste-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  /** Ids des lignes appartenant aux documents ciblés (fallback legacy : document_id null). */
  const lineIdsOf = (documentIds: string[]) =>
    rawLines
      .filter((l) => documentIds.includes(l.documentId ?? l.contextId ?? ''))
      .map((l) => l.id)
      .filter((id): id is string => Boolean(id));

  const deleteLabel = (docs: BoqDocumentSummary[]) =>
    docs.length === 1
      ? `${docPrefix.toUpperCase()}-${docs[0].reference}`
      : `${docs.length} ${t('dqe.navigation.list')}`;

  const deleteDocuments = async (docs: BoqDocumentSummary[]) => {
    if (!docs.length || isDeleting) return;
    const ids = docs.map((d) => d.documentId);



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

  const handleDelete = (doc: BoqDocumentSummary) => setPendingDelete([doc]);

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
            <Button variant="destructive" size="sm" disabled={isDeleting} onClick={() => setPendingDelete(selectedDocs)}>
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
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Rechercher référence ou titre…" className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all"><T k="auto.boqdocumentlist.tous_les_statuts" fallback="Tous les statuts" /></SelectItem>
             {Object.keys(STATUS_VARIANT).map((code) => (
               <SelectItem key={code} value={code}>{code === 'mixed' ? t('dqe.status.mixed') : translateStatus(code)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
          className="w-[150px]"
          aria-label="Créé après le"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(0); }}
          className="w-[150px]"
          aria-label="Créé avant le"
        />
        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
          <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((n) => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full min-w-[1080px] text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left w-10">
                <Checkbox
                  checked={allChecked}
                  disabled={allSelectable.length === 0}
                  onCheckedChange={() => setSelected(allChecked ? [] : allSelectable)}
                  aria-label={t('common.select_all')}
                />
              </th>
              <th className="text-left p-3 cursor-pointer select-none" onClick={() => toggleSort('reference')}>
                <T k="auto.boqdocumentlist.reference" fallback="Référence" /> <ArrowUpDown className="inline h-3 w-3" />
              </th>
              <th className="text-left p-3 cursor-pointer select-none" onClick={() => toggleSort('title')}>
                <T k="auto.boqdocumentlist.intitule" fallback="Intitulé" /> <ArrowUpDown className="inline h-3 w-3" />
              </th>
              <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort('lineCount')}>
                <T k="auto.boqdocumentlist.lignes" fallback="Lignes" /> <ArrowUpDown className="inline h-3 w-3" />
              </th>
              <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort('totalHt')}>
                <T k="auto.boqdocumentlist.montant_ht" fallback="Montant HT" /> <ArrowUpDown className="inline h-3 w-3" />
              </th>
              <th className="text-right p-3"><T k="dqe.list.vat" fallback="TVA" /></th>
              <th className="text-right p-3 cursor-pointer select-none" onClick={() => toggleSort('totalTtc')}>
                <T k="dqe.list.total_ttc" fallback="Montant TTC" /> <ArrowUpDown className="inline h-3 w-3" />
              </th>
              <th className="text-left p-3 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                <T k="auto.boqdocumentlist.statut" fallback="Statut" /> <ArrowUpDown className="inline h-3 w-3" />
              </th>
              <th className="text-left p-3 cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                <T k="dqe.list.created_at" fallback="Créé le" /> <ArrowUpDown className="inline h-3 w-3" />
              </th>
              <th className="text-left p-3 cursor-pointer select-none" onClick={() => toggleSort('updatedAt')}>
                <T k="dqe.list.updated_at" fallback="Modifié le" /> <ArrowUpDown className="inline h-3 w-3" />
              </th>
              <th className="text-right p-3 w-[7rem]"><T k="auto.boqdocumentlist.actions" fallback="Actions" /></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={11} className="text-center p-6 text-muted-foreground">Chargement…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={11} className="text-center p-8 text-muted-foreground">
                {t('dqe.empty.create_hint')}
              </td></tr>
            ) : pageRows.map((d) => {
               const variant = STATUS_VARIANT[d.status] ?? STATUS_VARIANT.draft;
               const readOnly = d.readOnly;
               /** Édition possible uniquement sur un document rouvert / brouillon / rejeté. */
               const editable = !readOnly && EDITABLE_STATUSES.has(String(d.status).toLowerCase());

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
                  <td className="p-3 font-medium whitespace-nowrap">{docPrefix.toUpperCase()}-{d.reference}</td>
                  <td className="p-3 max-w-[260px] truncate">{resolveTitle(d)}</td>
                  <td className="p-3 text-right">{d.lineCount}</td>
                  <td className="p-3 text-right font-medium whitespace-nowrap">{fmtMoney(d.totalHt)} MRU</td>
                  <td className="p-3 text-right whitespace-nowrap">{fmtMoney(d.totalVat)}</td>
                  <td className="p-3 text-right font-semibold whitespace-nowrap">{fmtMoney(d.totalTtc)} MRU</td>
                  <td className="p-3"><Badge variant={variant}>{d.status === 'mixed' ? t('dqe.status.mixed') : translateStatus(d.status)}</Badge></td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(d.createdAt)}</td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{fmtDate(d.updatedAt)}</td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onOpen(d.documentId)}
                        title={t('dqe.action.view')}
                        aria-label={t('dqe.action.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {editable && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onOpen(d.documentId)}
                          title={t('dqe.action.edit')}
                          aria-label={t('dqe.action.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
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

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {safePage * pageSize + 1}–{Math.min(filtered.length, (safePage + 1) * pageSize)} / {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {safePage + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}


      <AlertDialog open={pendingDelete.length > 0} onOpenChange={(o) => { if (!o) setPendingDelete([]); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.confirm_delete_named', { name: deleteLabel(pendingDelete) })
                || `Êtes-vous sûr de vouloir supprimer ${deleteLabel(pendingDelete)} ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                const docs = pendingDelete;
                setPendingDelete([]);
                void deleteDocuments(docs);
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  );
};

export default BoqDocumentList;
