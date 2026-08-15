import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Edit, Trash2, Plus, ExternalLink, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePaymentCrud, useProjects } from '@/hooks/hexagonal';
import ListToolbar from '@/components/common/ListToolbar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAYMENT_CONTROL_THRESHOLDS } from '@/config/referentials/payment-tolerance.referential';
import { PAYMENT_ORIGINS } from '@/config/referentials/payment-origin.referential';
import { useToast } from '@/hooks/use-toast';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { exportToCSV } from '@/lib/export';

interface PaymentCrudProps {
  projectId?: string;
  contractorId?: string;
  onCreatePayment?: () => void;
}

const DELAY_WARNING_DAYS = PAYMENT_CONTROL_THRESHOLDS.find(t => t.key === 'payment_delay')?.days ?? 30;
const AUTO_BLOCK_DAYS = PAYMENT_CONTROL_THRESHOLDS.find(t => t.key === 'auto_block')?.days ?? 45;

const getPaymentDelayDays = (payment: PaymentDTO): number | null => {
  if (!payment.paymentDate) return null;
  const status = (payment.status || '').toLowerCase();
  if (['validated', 'completed', 'paid', 'approved'].includes(status)) return null;
  const start = new Date(payment.paymentDate).getTime();
  if (Number.isNaN(start)) return null;
  const days = Math.floor((Date.now() - start) / 86400000);
  return days > 0 ? days : 0;
};

const getStatusMeta = (payment: PaymentDTO) => {
  const status = (payment.status || 'pending').toLowerCase();
  if (['validated', 'completed', 'paid', 'approved'].includes(status))
    return { label: 'Validé', variant: 'default' as const };
  if (status === 'blocked') return { label: 'Bloqué', variant: 'destructive' as const };
  if (status === 'rejected') return { label: 'Rejeté', variant: 'outline' as const };
  return { label: 'En attente', variant: 'secondary' as const };
};

export const PaymentCrud = ({ projectId, contractorId, onCreatePayment }: PaymentCrudProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  const { payments, loading, deletePayment } = usePaymentCrud();
  const { projects: allProjects } = useProjects();

  const projectLabelMap = useMemo(() => {
    const map = new Map();
    (allProjects || []).forEach((p: any) => {
      const ref = p.projectReference || p.reference;
      const label = p.title || p.name || ref || 'Projet';
      map.set(p.id, { label, ref });
    });
    return map;
  }, [allProjects]);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (payments || []).filter(p => {
      if (statusFilter !== 'all') {
        const statusMap: Record<string, string> = {
          pending: 'En attente',
          validated: 'Validé',
          blocked: 'Bloqué',
          rejected: 'Rejeté',
        };
        if (getStatusMeta(p).label !== statusMap[statusFilter]) return false;
      }
      if (methodFilter !== 'all' && (p.paymentMethod || '') !== methodFilter) return false;
      if (!term) return true;
      const proj = p.projectId ? projectLabelMap.get(p.projectId) : undefined;
      const haystack = [
        p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('fr-FR') : '',
        proj?.label, proj?.ref, p.contractorName, p.contractorContact,
        String(p.amount ?? ''), p.paymentMethod, p.transactionId
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [payments, search, statusFilter, methodFilter, projectLabelMap]);

  const formatAmount = (n?: number) =>
    typeof n === 'number' && !Number.isNaN(n)
      ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)
      : '—';

  const handleDelete = async (payment: PaymentDTO) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) return;
    try {
      await deletePayment(payment.id);
      toast({ title: 'Succès', description: 'Paiement supprimé' });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Échec de la suppression', variant: 'destructive' });
    }
  };

  const handleExport = () => {
    if (filteredPayments.length === 0) {
      toast({ title: 'Aucune donnée', description: 'Aucun paiement à exporter.', variant: 'destructive' });
      return;
    }
    exportToCSV(filteredPayments);
    toast({ title: 'Export lancé', description: 'Le fichier CSV a été téléchargé.' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Gestion des Paiements
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Exporter CSV
          </Button>
          <Button onClick={onCreatePayment} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Paiement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher (date, projet, contractant, montant…)"
          resultCount={filteredPayments.length}
        >
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="validated">Validés</SelectItem>
              <SelectItem value="blocked">Bloqués</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[190px]">
              <SelectValue placeholder="Méthode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les méthodes</SelectItem>
              <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
              <SelectItem value="cash">Espèces</SelectItem>
              <SelectItem value="check">Chèque</SelectItem>
              <SelectItem value="mobile_payment">Paiement mobile</SelectItem>
            </SelectContent>
          </Select>
        </ListToolbar>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Contractant</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Délai (jours)</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Origine</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Aucun paiement enregistré</TableCell></TableRow>
              ) : (
                filteredPayments.map(p => {
                  const proj = p.projectId ? projectLabelMap.get(p.projectId) : null;
                  const delay = getPaymentDelayDays(p);
                  const status = getStatusMeta(p);
                  const progress = typeof p.progressAtPayment === 'number' ? Math.min(100, Math.max(0, p.progressAtPayment)) : null;
                  const originLabel = PAYMENT_ORIGINS[p.origin as keyof typeof PAYMENT_ORIGINS]?.shortLabel || p.origin || 'manuel';
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('fr-FR') : '—'}</TableCell>
                      <TableCell>
                        {p.projectId ? (
                          <Link to={`/projects/${p.projectId}`} className="text-primary hover:underline inline-flex items-center gap-1">
                            <span className="truncate max-w-[180px]">{proj?.ref || proj?.label || 'Projet'}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </Link>
                        ) : '—'}
                      </TableCell>
                      <TableCell><div className="font-medium">{p.contractorName || '—'}</div></TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{formatAmount(p.amount)} MRU</TableCell>
                      <TableCell>{p.paymentMethod || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {delay === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className={delay >= AUTO_BLOCK_DAYS ? 'text-destructive font-medium' : delay >= DELAY_WARNING_DAYS ? 'text-warning font-medium' : 'text-muted-foreground'}>
                            {delay} j
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        {progress === null ? '—' : (
                          <div className="space-y-1">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div className={`h-full rounded-full ${progress > 80 ? 'bg-success' : progress >= 50 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{originLabel}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { /* éditer */ }}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(p)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCrud;