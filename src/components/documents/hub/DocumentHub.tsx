import { useMemo, useState } from 'react';
import { DocumentHubContract, DocumentItem } from './types';
import { DocumentHubToolbar, SortKey, ViewMode } from './DocumentHubToolbar';
import { DocumentHubSidebar } from './DocumentHubSidebar';
import { DocumentHubGrid } from './DocumentHubGrid';
import { DocumentHubTable } from './DocumentHubTable';
import { DocumentHubPreview } from './DocumentHubPreview';
import { DocumentHubUpload } from './DocumentHubUpload';
import { DocumentHubEmpty } from './DocumentHubEmpty';
import { useToast } from '@/hooks/use-toast';

interface Props {
  contract: DocumentHubContract;
  /** Optional heading rendered above the toolbar. */
  heading?: React.ReactNode;
  /** Restrict height, defaults to auto (parent-driven). */
  className?: string;
}

export function DocumentHub({ contract, heading, className }: Props) {
  const { data: rawItems = [], isLoading } = contract.useDocuments();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('date_desc');
  const [view, setView] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<DocumentItem | null>(null);
  const { toast } = useToast();

  // Build facet options with live counts from rawItems (independent of current filters)
  const facets = useMemo(() => {
    return contract.facets.map((f) => {
      if (f.options.length > 0) {
        const counts = new Map<string, number>();
        for (const item of rawItems) {
          const v = item.facets[f.key];
          if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
        }
        return {
          ...f,
          options: f.options.map((opt) => ({ ...opt, count: counts.get(opt.value) ?? 0 })),
        };
      }
      // auto-derive options from data
      const map = new Map<string, number>();
      for (const item of rawItems) {
        const v = item.facets[f.key];
        if (v) map.set(v, (map.get(v) ?? 0) + 1);
      }
      return {
        ...f,
        options: Array.from(map.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([value, count]) => ({ value, label: value, count })),
      };
    });
  }, [contract.facets, rawItems]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = rawItems.filter((item) => {
      if (s) {
        const hay = `${item.title} ${item.fileName ?? ''}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      for (const [key, values] of Object.entries(selected)) {
        if (values.size === 0) continue;
        const v = item.facets[key];
        if (!v || !values.has(v)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'date_asc':
          return a.createdAt.localeCompare(b.createdAt);
        case 'date_desc':
          return b.createdAt.localeCompare(a.createdAt);
        case 'name_asc':
          return a.title.localeCompare(b.title);
        case 'name_desc':
          return b.title.localeCompare(a.title);
        case 'size_asc':
          return (a.fileSize ?? 0) - (b.fileSize ?? 0);
        case 'size_desc':
          return (b.fileSize ?? 0) - (a.fileSize ?? 0);
      }
    });
    return list;
  }, [rawItems, search, selected, sort]);

  const toggleFacet = (key: string, value: string, multi: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      const cur = new Set(next[key] ?? []);
      if (cur.has(value)) cur.delete(value);
      else {
        if (!multi) cur.clear();
        cur.add(value);
      }
      next[key] = cur;
      return next;
    });
  };

  const handleDelete = async (item: DocumentItem) => {
    if (!contract.onDelete) return;
    if (!window.confirm(`Supprimer « ${item.title} » ?`)) return;
    try {
      await contract.onDelete(item);
      toast({ title: 'Document supprimé' });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err?.message ?? 'Suppression impossible', variant: 'destructive' });
    }
  };

  const facetKeysForTable = facets
    .filter((f) => f.options.length > 0)
    .map((f) => ({ key: f.key, label: f.label }));

  return (
    <div className={`flex flex-col overflow-hidden rounded-lg border border-border bg-background ${className ?? ''}`}>
      {heading}
      <DocumentHubToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        view={view}
        onViewChange={setView}
        canUpload={contract.canUpload}
        onUploadClick={() => setUploadOpen(true)}
        totalCount={rawItems.length}
        filteredCount={filtered.length}
      />

      <div className="flex min-h-[400px] flex-1">
        <DocumentHubSidebar
          facets={facets}
          selected={selected}
          onToggle={toggleFacet}
          onClear={() => setSelected({})}
        />

        <main className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <DocumentHubEmpty
              title={rawItems.length === 0 ? 'Aucun document' : 'Aucun résultat'}
              description={
                rawItems.length === 0
                  ? `Ajoutez le premier document à ${contract.scopeLabel.toLowerCase()}.`
                  : 'Ajustez les filtres ou la recherche.'
              }
              canUpload={contract.canUpload && rawItems.length === 0}
              onUploadClick={() => setUploadOpen(true)}
            />
          ) : view === 'grid' ? (
            <DocumentHubGrid
              items={filtered}
              categoryLabels={contract.categoryLabels}
              onPreview={setPreview}
              onDelete={contract.onDelete ? handleDelete : undefined}
            />
          ) : (
            <DocumentHubTable
              items={filtered}
              facetKeys={facetKeysForTable}
              categoryLabels={contract.categoryLabels}
              onPreview={setPreview}
              onDelete={contract.onDelete ? handleDelete : undefined}
            />
          )}
        </main>
      </div>

      <DocumentHubPreview
        item={preview}
        contract={contract}
        onClose={() => setPreview(null)}
        onDelete={contract.onDelete ? handleDelete : undefined}
      />

      <DocumentHubUpload open={uploadOpen} onOpenChange={setUploadOpen} contract={contract} />
    </div>
  );
}
