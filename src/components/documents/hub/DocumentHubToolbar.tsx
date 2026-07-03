import { Search, LayoutGrid, List, Plus, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc';
export type ViewMode = 'grid' | 'table';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  canUpload: boolean;
  onUploadClick: () => void;
  totalCount: number;
  filteredCount: number;
}

export function DocumentHubToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  canUpload,
  onUploadClick,
  totalCount,
  filteredCount,
}: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-card/40 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un document…"
            className="pl-9"
          />
        </div>
        <span className="hidden text-xs text-muted-foreground md:inline">
          {filteredCount} / {totalCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">Plus récent</SelectItem>
            <SelectItem value="date_asc">Plus ancien</SelectItem>
            <SelectItem value="name_asc">Nom (A→Z)</SelectItem>
            <SelectItem value="name_desc">Nom (Z→A)</SelectItem>
            <SelectItem value="size_desc">Taille ↓</SelectItem>
            <SelectItem value="size_asc">Taille ↑</SelectItem>
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && onViewChange(v as ViewMode)}
          className="border border-border rounded-md"
        >
          <ToggleGroupItem value="grid" aria-label="Vue grille" className="px-2">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Vue tableau" className="px-2">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        {canUpload && (
          <Button onClick={onUploadClick} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>
    </div>
  );
}
