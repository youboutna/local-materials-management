/**
 * ContractList — tableau de contrats réutilisable (liste globale ou onglet projet).
 * Données via hooks hexagonaux uniquement.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, FileSignature, Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ContractStatusBadge } from './ContractStatusBadge';
import ContractFormDialog from './ContractFormDialog';
import { useContractsHex, useProjectContractsHex, useContractMutations } from '@/hooks/hexagonal/useContractsHex';
import type { ContractRecordDTO } from '@/dtos/entities/ContractRecordDTO';

interface ContractListProps {
  projectId?: string;
  title?: string;
  /** Masque les actions d'écriture (lecture seule, ex. portail fournisseur). */
  readOnly?: boolean;
}

const formatAmount = (value: number, currency: string) =>
  `${new Intl.NumberFormat('fr-FR').format(value || 0)} ${currency}`;

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR') : '—';

export default function ContractList({ projectId, title = 'Contrats', readOnly = false }: ContractListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContractRecordDTO | null>(null);
  const [toDelete, setToDelete] = useState<ContractRecordDTO | null>(null);
  const { deleteContract, isPending } = useContractMutations();

  const globalQuery = useContractsHex();
  const projectQuery = useProjectContractsHex(projectId);
  const query = projectId ? projectQuery : globalQuery;

  const rows = useMemo<ContractRecordDTO[]>(() => {
    const list = query.data ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (c) =>
        c.title?.toLowerCase().includes(needle) ||
        c.contractNumber?.toLowerCase().includes(needle),
    );
  }, [query.data, search]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteContract(toDelete.id);
      toast.success('Contrat supprimé');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Suppression impossible');
    } finally {
      setToDelete(null);
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="h-4 w-4" />
          {title}
          <span className="text-xs font-normal text-muted-foreground">({rows.length})</span>
        </CardTitle>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Numéro ou intitulé"
            className="pl-8"
            aria-label="Rechercher un contrat"
          />
        </div>
      </CardHeader>

      <CardContent>
        {query.isLoading && (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement des contrats…
          </div>
        )}

        {query.error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {(query.error as Error).message}
          </p>
        )}

        {!query.isLoading && rows.length === 0 && (
          <p className="py-8 text-sm text-muted-foreground">Aucun contrat enregistré.</p>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Intitulé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-mono text-xs">{contract.contractNumber}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{contract.title}</TableCell>
                    <TableCell>
                      <ContractStatusBadge status={contract.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(contract.totalAmount, contract.currency)}
                    </TableCell>
                    <TableCell>{formatDate(contract.startDate)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                      >
                        Ouvrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
