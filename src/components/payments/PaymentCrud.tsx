// ============================================================
// src/components/payments/PaymentCrud.tsx
// ============================================================
import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import CompactFilterBar from '@/components/common/CompactFilterBar';
import { Input } from '@/components/ui/input';
import { Download, Edit, Lock, Unlock, FileText, Check, X, Trash2 } from 'lucide-react';
import { PaymentDTO } from '@/dtos/entities/PaymentDTO';
import { PaymentOriginKey, PAYMENT_ORIGINS } from '@/config/referentials/payment-origin.referential';
import { exportToCSV } from '@/lib/export';
import { useToast } from '@/hooks/use-toast';
import { usePaymentCrud, useProjects } from '@/hooks/hexagonal';
import { useDocumentViewer } from '@/components/documents/viewer';
import { UnifiedPaymentFormDialog } from '@/components/payments/UnifiedPaymentFormDialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toDateInput } from '@/lib/utils';
import { getDocumentService } from '@/application/services/DocumentService';
import { T } from '@/components/i18n/T';

interface PaymentCrudProps {
  onCreatePayment?: () => void;
}

export const PaymentCrud = ({ onCreatePayment }: PaymentCrudProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openDocument } = useDocumentViewer();
  const getDocumentsByIds = useMemo(() => {
    const documentService = getDocumentService();
    return async (ids: string[]) => {
      const docs = await Promise.all(ids.map(id => documentService.getDocumentById(id)));
      return docs.filter((d): d is NonNullable<typeof d> => Boolean(d));
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingPayment, setEditingPayment] = useState<PaymentDTO | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { payments, loading, deletePayment, updatePayment } = usePaymentCrud();
  const { projects, isLoading: projectsLoading } = useProjects();

  // Map projet pour afficher le titre et la référence
  const projectLabelMap = useMemo(() => {
    const map = new Map<string, { label: string; ref?: string }>();
    (projects || []).forEach((p: any) => {
      const label = p.title || p.name || p.projectReference || p.reference || 'Projet';
      const ref = p.projectReference || p.reference || '';
      map.set(p.id, { label, ref });
    });
    return map;
  }, [projects]);

  const filteredData = useMemo(() => {
    if (!payments) return [];
    let filtered = payments;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.contractorName?.toLowerCase().includes(term) ||
        p.projectId?.toLowerCase().includes(term) ||
        p.amount?.toString().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => (p.status || 'pending') === statusFilter);
    }
    return filtered;
  }, [payments, searchTerm, statusFilter]);

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast({ title: 'Aucune donnée', description: 'Il n\'y a pas de paiements à exporter.', variant: 'destructive' });
      return;
    }
    exportToCSV(filteredData);
    toast({ title: 'Export lancé', description: 'Le fichier CSV a été téléchargé.' });
  };

  const handleEdit = (payment: PaymentDTO) => {
    setEditingPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleToggleBlock = async (payment: PaymentDTO) => {
    try {
      const newStatus = payment.status === 'blocked' ? 'pending' : 'blocked';
      await updatePayment(payment.id, { status: newStatus });
      toast({ title: newStatus === 'blocked' ? 'Paiement bloqué' : 'Paiement débloqué' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de modifier le statut.', variant: 'destructive' });
    }
  };

  const handleApprove = async (payment: PaymentDTO) => {
    try {
      await updatePayment(payment.id, { status: 'approved' });
      toast({ title: 'Paiement approuvé' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'approuver.', variant: 'destructive' });
    }
  };

  const handleReject = async (payment: PaymentDTO) => {
    if (!confirm('Confirmer le rejet ?')) return;
    try {
      await updatePayment(payment.id, { status: 'rejected' });
      toast({ title: 'Paiement rejeté' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de rejeter.', variant: 'destructive' });
    }
  };

  const handleDelete = async (payment: PaymentDTO) => {
    if (!confirm('Supprimer définitivement ?')) return;
    try {
      await deletePayment(payment.id);
      toast({ title: 'Paiement supprimé' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de supprimer.', variant: 'destructive' });
    }
  };

  const handleViewDocuments = async (payment: PaymentDTO) => {
    const docIds = payment.documentIds || [];
    if (docIds.length === 0) {
      toast({ title: 'Aucun document', description: 'Ce paiement n\'a pas de documents joints.' });
      return;
    }
    try {
      const docs = await getDocumentsByIds(docIds);
      if (docs.length === 0) {
        toast({ title: 'Aucun document trouvé' });
        return;
      }
      openDocument(docs[0], { allowStatusChange: false });
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger les documents.', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try { return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr }); } catch { return dateStr; }
  };

  const getPaymentMethodLabel = (method?: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Virement bancaire',
      check: 'Chèque',
      mobile_money: 'Mobile Money',
      cash: 'Espèces',
      card: 'Carte bancaire',
    };
    return labels[method || ''] || method || '—';
  };

  const getProgressColor = (progress?: number) => {
    if (!progress) return 'bg-gray-300';
    if (progress >= 80) return 'bg-success';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading || projectsLoading) return <div className="py-8 text-center"><T k="auto.paymentcrud.chargement_des_paiements" fallback="Chargement des paiements..." /></div>;
  if (!payments) return <div className="py-8 text-center text-destructive"><T k="auto.paymentcrud.erreur_de_chargement" fallback="Erreur de chargement" /></div>;

  return (
    <div>
      <CompactFilterBar
        className="mb-4"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Rechercher (date, projet, contractant, montant...)"
        filters={[
          {
            key: 'status',
            label: 'Statut',
            placeholder: 'Tous',
            value: statusFilter,
            onChange: (v) => setStatusFilter(v || 'all'),
            options: [
              { value: 'pending', label: 'En attente' },
              { value: 'approved', label: 'Validés' },
              { value: 'blocked', label: 'Bloqués' },
              { value: 'rejected', label: 'Rejetés' },
            ],
          },
        ]}
        onReset={() => { setSearchTerm(''); setStatusFilter('all'); }}
        trailing={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            {onCreatePayment && (
              <Button size="sm" onClick={onCreatePayment}>+ Nouveau Paiement</Button>
            )}
          </div>
        }
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><T k="auto.paymentcrud.date" fallback="Date" /></TableHead>
            <TableHead><T k="auto.paymentcrud.projet" fallback="Projet" /></TableHead>
            <TableHead><T k="auto.paymentcrud.contractant" fallback="Contractant" /></TableHead>
            <TableHead><T k="auto.paymentcrud.montant" fallback="Montant" /></TableHead>
            <TableHead><T k="auto.paymentcrud.methode" fallback="Méthode" /></TableHead>
            <TableHead><T k="auto.paymentcrud.delai_jours" fallback="Délai (jours)" /></TableHead>
            <TableHead><T k="auto.paymentcrud.progression" fallback="Progression" /></TableHead>
            <TableHead><T k="auto.paymentcrud.statut" fallback="Statut" /></TableHead>
            <TableHead><T k="auto.paymentcrud.origine" fallback="Origine" /></TableHead>
            <TableHead><T k="auto.paymentcrud.actions" fallback="Actions" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow><TableCell colSpan={10} className="text-center"><T k="auto.paymentcrud.aucun_paiement_enregistre" fallback="Aucun paiement enregistré" /></TableCell></TableRow>
          ) : (
            filteredData.map((payment) => {
              const projectInfo = payment.projectId ? projectLabelMap.get(payment.projectId) : null;
              const projectDisplay = projectInfo?.label || payment.projectId || '—';
              const isBlocked = payment.status === 'blocked';
              const isPending = payment.status === 'pending';
              const isApproved = payment.status === 'approved';
              const isRejected = payment.status === 'rejected';
              const isEditable = !isApproved && !isRejected && !isBlocked;
              const hasDocs = (payment.documentIds?.length || 0) > 0;

              const daysOverdue = payment.paymentDate
                ? Math.max(0, Math.floor((Date.now() - new Date(payment.paymentDate).getTime()) / (1000 * 60 * 60 * 24)))
                : null;

              return (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell>{projectDisplay}</TableCell>
                  <TableCell>{payment.contractorName || '—'}</TableCell>
                  <TableCell className="font-medium">{payment.amount?.toLocaleString('fr-FR')} MRU</TableCell>
                  <TableCell>{getPaymentMethodLabel(payment.paymentMethod)}</TableCell>
                  <TableCell>{daysOverdue !== null ? `${daysOverdue} j` : '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(payment.progressAtPayment)}`}
                          style={{ width: `${Math.min(payment.progressAtPayment || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{payment.progressAtPayment || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'approved' ? 'default' : 'secondary'}>
                      {payment.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {PAYMENT_ORIGINS[payment.origin as PaymentOriginKey]?.shortLabel || payment.origin || 'manuel'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {isEditable && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(payment)} title="Modifier">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleToggleBlock(payment)} title={isBlocked ? 'Débloquer' : 'Bloquer'}>
                        {isBlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </Button>
                      {isPending && (
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(payment)} title="Valider" className="text-success hover:text-success">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {isPending && (
                        <Button variant="ghost" size="sm" onClick={() => handleReject(payment)} title="Rejeter" className="text-destructive hover:text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleViewDocuments(payment)} title={hasDocs ? 'Voir les documents' : 'Aucun document'} disabled={!hasDocs}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(payment)} title="Supprimer" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {editingPayment && (
        <UnifiedPaymentFormDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          origin="manual"
          isEdit={true}
          defaults={{
            id: editingPayment.id,
            projectId: editingPayment.projectId,
            projectTitle: editingPayment.projectId ? projectLabelMap.get(editingPayment.projectId)?.label : undefined,
            contractorId: editingPayment.contractorId,
            contractorName: editingPayment.contractorName,
            contractorContact: editingPayment.contractorContact,
            amount: editingPayment.amount,
            paymentMethod: editingPayment.paymentMethod,
            paymentDate: editingPayment.paymentDate ? toDateInput(editingPayment.paymentDate) : undefined,
            transactionId: editingPayment.transactionId,
            progressAtPayment: editingPayment.progressAtPayment,
            bankName: editingPayment.bankName,
            accountNumber: editingPayment.accountNumber,
            checkNumber: editingPayment.checkNumber,
            mobileNumber: editingPayment.mobileNumber,
            mobileOperator: editingPayment.mobileOperator,
            receiverName: editingPayment.receiverName,
            documentIds: editingPayment.documentIds,
            notes: editingPayment.notes,
            contextLabel: `Édition du paiement ${editingPayment.id.slice(0, 8)}`,
          }}
          lockProject={false}
          lockContractor={false}
          onUpdated={() => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            setIsEditDialogOpen(false);
            setEditingPayment(null);
          }}
        />
      )}
    </div>
  );
};

export default PaymentCrud;