import { ActionsDropdown } from '@/components/actions/ActionsDropdown';
import DocumentSection from '@/components/common/DocumentSection';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
    Ban,
    CreditCard,
    Edit,
    Eye,
    ExternalLink,
    FileText,
    Pencil,
    Plus,
    Trash2,
    Upload
} from 'lucide-react';
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePaymentCrud } from '@/hooks/hexagonal';
import { useProjects } from '@/hooks/hexagonal/useProjectsHex';
import type { PaymentDTO } from '@/dtos/entities/PaymentDTO';

interface PaymentCrudProps {
  projectId?: string;
  contractorId?: string;
}

const PaymentCrud = ({ projectId, contractorId }: PaymentCrudProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [searchParams] = useSearchParams();

  const { toast } = useToast();
  const { t } = useLanguage();

  // Use hexagonal hook
  const {
    payments,
    loading: paymentsLoading,
    validatePayment,
    createPayment,
    updatePayment,
    deletePayment,
    uploadReceipt,
    uploadInvoice
  } = usePaymentCrud();

  // Lookup map for human-readable project labels (hide raw UUIDs in the UI)
  const { projects: allProjects } = useProjects();
  const projectLabelMap = React.useMemo(() => {
    const map = new Map<string, { label: string; ref?: string }>();
    (allProjects || []).forEach((p: any) => {
      const ref = p.projectReference || p.projectReferenceNumber || p.reference;
      const label = p.title || p.name || ref || 'Projet';
      map.set(p.id, { label, ref });
    });
    return map;
  }, [allProjects]);

  const formatAmount = (n?: number) =>
    typeof n === 'number' && !Number.isNaN(n)
      ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)
      : '—';

  const [formData, setFormData] = useState({
    // ✅ CAMELCASE: Primary fields
    projectId: projectId || '',
    contractorId: contractorId || '',
    contractorName: '',
    contractorContact: '',
    amount: '',
    paymentDate: '',
    progressAtPayment: '',
    transactionId: '',
    paymentMethod: 'bank_transfer',
    inspectionId: '',
    phaseId: '',
    bankName: '',
    accountNumber: '',
    checkNumber: '',
    mobileNumber: '',
    mobileOperator: '',
    receiverName: '',
    supportingDocuments: [] as string[],
    notes: '',
    purchaseOrderUrl: '',
    quoteUrl: '',
    invoiceUrl: '',
    
    // Legacy snake_case for backward compatibility
    project_id: projectId || '',
    contractor_id: contractorId || '',
    contractor_name: '',
    contractor_contact: '',
    payment_date: '',
    progress_at_payment: '',
    transaction_id: '',
    payment_method: 'bank_transfer',
    inspection_id: '',
    phase_id: '',
    bank_name: '',
    account_number: '',
    check_number: '',
    mobile_number: '',
    mobile_operator: '',
    receiver_name: '',
    purchase_order_url: '',
    quote_url: '',
    invoice_url: ''
  });

  // Handle URL parameters for pre-filling
  React.useEffect(() => {
    const projectIdParam = searchParams.get('project_id');
    const contractorIdParam = searchParams.get('contractor_id');
    
    if (projectIdParam) {
      setFormData(prev => ({ ...prev, project_id: projectIdParam }));
    }
    if (contractorIdParam) {
      setFormData(prev => ({ ...prev, contractor_id: contractorIdParam }));
    }
  }, [searchParams]);

  const resetForm = () => {
    setFormData({
      projectId: projectId || '',
      contractorId: contractorId || '',
      contractorName: '',
      contractorContact: '',
      amount: '',
      paymentDate: '',
      progressAtPayment: '',
      transactionId: '',
      paymentMethod: 'bank_transfer',
      inspectionId: '',
      phaseId: '',
      bankName: '',
      accountNumber: '',
      checkNumber: '',
      mobileNumber: '',
      mobileOperator: '',
      receiverName: '',
      supportingDocuments: [],
      notes: '',
      purchaseOrderUrl: '',
      quoteUrl: '',
      invoiceUrl: '',
      // Legacy snake_case
      project_id: projectId || '',
      contractor_id: contractorId || '',
      contractor_name: '',
      contractor_contact: '',
      payment_date: '',
      progress_at_payment: '',
      transaction_id: '',
      payment_method: 'bank_transfer',
      inspection_id: '',
      phase_id: '',
      bank_name: '',
      account_number: '',
      check_number: '',
      mobile_number: '',
      mobile_operator: '',
      receiver_name: '',
      purchase_order_url: '',
      quote_url: '',
      invoice_url: ''
    });
    setUploadedDocuments([]);
    setReceiptFile(null);
    setInvoiceFile(null);
    setSelectedPayment(null);
    setIsEditing(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (payment: PaymentDTO) => {
    setSelectedPayment(payment);
    setFormData({
      projectId: payment.projectId || '',
      contractorId: payment.contractorId || '',
      contractorName: payment.contractorName || '',
      contractorContact: payment.contractorContact || '',
      amount: payment.amount?.toString() || '',
      paymentDate: payment.paymentDate || '',
      progressAtPayment: payment.progressAtPayment?.toString() || '',
      transactionId: payment.transactionId || '',
      paymentMethod: payment.paymentMethod || 'bank_transfer',
      inspectionId: payment.inspectionId || '',
      phaseId: payment.phaseId || '',
      bankName: payment.bankName || '',
      accountNumber: payment.accountNumber || '',
      checkNumber: payment.checkNumber || '',
      mobileNumber: payment.mobileNumber || '',
      mobileOperator: payment.mobileOperator || '',
      receiverName: payment.receiverName || '',
      supportingDocuments: [],
      notes: '',
      purchaseOrderUrl: '',
      quoteUrl: '',
      invoiceUrl: '',
      // Legacy snake_case
      project_id: payment.projectId || '',
      contractor_id: payment.contractorId || '',
      contractor_name: payment.contractorName || '',
      contractor_contact: payment.contractorContact || '',
      payment_date: payment.paymentDate || '',
      progress_at_payment: payment.progressAtPayment?.toString() || '',
      transaction_id: payment.transactionId || '',
      payment_method: payment.paymentMethod || 'bank_transfer',
      inspection_id: payment.inspectionId || '',
      phase_id: payment.phaseId || '',
      bank_name: payment.bankName || '',
      account_number: payment.accountNumber || '',
      check_number: payment.checkNumber || '',
      mobile_number: payment.mobileNumber || '',
      mobile_operator: payment.mobileOperator || '',
      receiver_name: payment.receiverName || '',
      purchase_order_url: '',
      quote_url: '',
      invoice_url: ''
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const validatePaymentForm = async () => {
    if (!formData.project_id || !formData.contractor_id) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un projet et un contractant",
        variant: "destructive",
      });
      return false;
    }

    const isValid = await validatePayment(formData.project_id, formData.contractor_id);
    if (!isValid) {
      toast({
        title: "Erreur",
        description: "Ce paiement est bloqué. Veuillez résoudre les blocages avant de continuer.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isValid = await validatePaymentForm();
      if (!isValid) {
        setLoading(false);
        return;
      }

      // Handle file uploads
      let receiptUrl = formData.invoice_url;
      let invoiceUrl = formData.invoice_url;

      if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile);
      }

      if (invoiceFile) {
        invoiceUrl = await uploadInvoice(invoiceFile);
      }

      const paymentData = {
        // ✅ PRIORITY: camelCase first, snake_case fallback
        projectId: formData.projectId || formData.project_id,
        contractorId: formData.contractorId || formData.contractor_id,
        contractorName: formData.contractorName || formData.contractor_name,
        contractorContact: formData.contractorContact || formData.contractor_contact,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate || formData.payment_date,
        progressAtPayment: parseFloat(formData.progressAtPayment || formData.progress_at_payment),
        transactionId: formData.transactionId || formData.transaction_id,
        paymentMethod: formData.paymentMethod || formData.payment_method,
        inspectionId: formData.inspectionId || formData.inspection_id || undefined,
        phaseId: formData.phaseId || formData.phase_id || undefined,
        bankName: formData.bankName || formData.bank_name || undefined,
        accountNumber: formData.accountNumber || formData.account_number || undefined,
        checkNumber: formData.checkNumber || formData.check_number || undefined,
        mobileNumber: formData.mobileNumber || formData.mobile_number || undefined,
        mobileOperator: formData.mobileOperator || formData.mobile_operator || undefined,
        receiverName: formData.receiverName || formData.receiver_name || undefined,
      };

      if (isEditing && selectedPayment) {
        await updatePayment(selectedPayment.id, paymentData);
        toast({
          title: "Succès",
          description: "Paiement mis à jour avec succès",
        });
      } else {
        await createPayment(paymentData);
        toast({
          title: "Succès",
          description: "Paiement créé avec succès",
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (payment: PaymentDTO) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        await deletePayment(payment.id);
        toast({
          title: "Succès",
          description: "Paiement supprimé avec succès",
        });
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la suppression",
          variant: "destructive",
        });
      }
    }
  };

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const handleInvoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setInvoiceFile(file);
    }
  };

  const handleDocumentSelect = (documents: string[]) => {
    setUploadedDocuments(documents);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="h-4 w-4" />;
      case 'cash':
        return <Ban className="h-4 w-4" />;
      case 'check':
        return <FileText className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Virement bancaire';
      case 'cash':
        return 'Espèces';
      case 'check':
        return 'Chèque';
      case 'mobile_payment':
        return 'Paiement mobile';
      default:
        return method;
    }
  };

  const isLoading = paymentsLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Gestion des Paiements
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Paiement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Modifier le Paiement' : 'Nouveau Paiement'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project_id">Projet *</Label>
                  <ProjectSelector
                    value={formData.project_id}
                    onChange={(value) => setFormData(prev => ({ ...prev, project_id: value || '' }))}
                    disabled={!!projectId}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contractor_id">Contractant *</Label>
                  <SupplierSelector
                    value={{ id: formData.contractor_id, name: formData.contractor_name, contact: formData.contractor_contact, leadTime: 0 }}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      contractor_id: value?.id || '',
                      contractor_name: value?.name || '',
                      contractor_contact: value?.contact || ''
                    }))}
                    disabled={!!contractorId}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contractor_name">Nom du contractant *</Label>
                  <Input
                    id="contractor_name"
                    value={formData.contractor_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractor_name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contractor_contact">Contact du contractant *</Label>
                  <Input
                    id="contractor_contact"
                    value={formData.contractor_contact}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractor_contact: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Montant *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="payment_date">Date de paiement *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    // ✅ PRIORITY: camelCase first, snake_case fallback
                    value={formData.paymentDate || formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      paymentDate: e.target.value || '', // ✅ CAMELCASE: Update primary field
                      payment_date: e.target.value || '' // ✅ LEGACY: Update fallback field
                    }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="progress_at_payment">Progression (%) *</Label>
                  <Input
                    id="progress_at_payment"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_at_payment}
                    onChange={(e) => setFormData(prev => ({ ...prev, progress_at_payment: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transaction_id">ID de transaction *</Label>
                  <Input
                    id="transaction_id"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="payment_method">Méthode de paiement *</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                      <SelectItem value="mobile_payment">Paiement mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Conditional fields based on payment method */}
              {formData.payment_method === 'bank_transfer' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank_name">Nom de la banque</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_number">Numéro de compte</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {formData.payment_method === 'check' && (
                <div>
                  <Label htmlFor="check_number">Numéro de chèque</Label>
                  <Input
                    id="check_number"
                    value={formData.check_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, check_number: e.target.value }))}
                  />
                </div>
              )}

              {formData.payment_method === 'mobile_payment' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="mobile_number">Numéro mobile</Label>
                    <Input
                      id="mobile_number"
                      value={formData.mobile_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mobile_operator">Opérateur mobile</Label>
                    <Select 
                      value={formData.mobile_operator} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, mobile_operator: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mauritel">Mauritel</SelectItem>
                        <SelectItem value="mattel">Mattel</SelectItem>
                        <SelectItem value="chinguitel">Chinguitel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="receiver_name">Nom du récepteur</Label>
                    <Input
                      id="receiver_name"
                      value={formData.receiver_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, receiver_name: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Contractant</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun paiement enregistré
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/projects/${payment.projectId}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {payment.projectId?.substring(0, 8)}...
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.contractorName}</div>
                        <div className="text-sm text-muted-foreground">{payment.contractorContact}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.amount?.toLocaleString('fr-FR')} MRU
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.paymentMethod || '')}
                        <span>{getPaymentMethodLabel(payment.paymentMethod || '')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.progressAtPayment}%</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(payment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(payment)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentCrud;
