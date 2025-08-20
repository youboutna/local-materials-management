import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, CreditCard, AlertTriangle, Ban, FileText, Upload, ExternalLink, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import DocumentSelector from '@/components/selectors/DocumentSelector';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentViewer from '@/components/documents/DocumentViewer';
import DocumentSection from '@/components/common/DocumentSection';

interface Payment {
  id: string;
  project_id: string;
  contractor_id?: string;
  contractor_name: string;
  contractor_contact: string;
  amount: number;
  payment_date: string;
  progress_at_payment: number;
  transaction_id: string;
  payment_method: string;
  inspection_id?: string;
  phase_id?: string;
  // Payment documents
  supporting_documents?: string[];
  receipt_url?: string;
  invoice_url?: string;
  // Additional payment method fields
  bank_name?: string;
  account_number?: string;
  check_number?: string;
  mobile_number?: string;
  mobile_operator?: string;
  receiver_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface PaymentFormData {
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  contractor_contact: string;
  amount: number;
  payment_date: string;
  progress_at_payment: number;
  transaction_id: string;
  payment_method: string;
  inspection_id: string;
  phase_id: string;
  bank_name: string;
  account_number: string;
  check_number: string;
  mobile_number: string;
  mobile_operator: string;
  receiver_name: string;
  supporting_documents: string[];
  notes: string;
}

const PaymentCrud: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<PaymentFormData>({
    project_id: '',
    contractor_id: '',
    contractor_name: '',
    contractor_contact: '',
    amount: 0,
    payment_date: '',
    progress_at_payment: 0,
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
    supporting_documents: [],
    notes: ''
  });

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'check', label: 'Chèque' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cash', label: 'Espèces' },
    { value: 'card', label: 'Carte bancaire' }
  ];

  const mobileOperators = [
    { value: 'mauritel', label: 'Mauritel' },
    { value: 'mattel', label: 'Mattel' },
    { value: 'chinguitel', label: 'Chinguitel' }
  ];

  const resetForm = () => {
    setFormData({
      project_id: '',
      contractor_id: '',
      contractor_name: '',
      contractor_contact: '',
      amount: 0,
      payment_date: '',
      progress_at_payment: 0,
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
      supporting_documents: [],
      notes: ''
    });
    setPaymentBlocked(false);
    setUploadedDocuments([]);
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (payment: Payment) => {
    setFormData({
      project_id: payment.project_id,
      contractor_id: payment.contractor_id || '',
      contractor_name: payment.contractor_name,
      contractor_contact: payment.contractor_contact,
      amount: payment.amount,
      payment_date: payment.payment_date.split('T')[0],
      progress_at_payment: payment.progress_at_payment,
      transaction_id: payment.transaction_id,
      payment_method: payment.payment_method,
      inspection_id: payment.inspection_id || '',
      phase_id: payment.phase_id || '',
      bank_name: payment.bank_name || '',
      account_number: payment.account_number || '',
      check_number: payment.check_number || '',
      mobile_number: payment.mobile_number || '',
      mobile_operator: payment.mobile_operator || '',
      receiver_name: payment.receiver_name || '',
      supporting_documents: payment.supporting_documents || [],
      notes: ''
    });
    setSelectedPayment(payment);
    setUploadedDocuments(payment.supporting_documents || []);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (payment: Payment) => {
    setFormData({
      project_id: payment.project_id,
      contractor_id: payment.contractor_id || '',
      contractor_name: payment.contractor_name,
      contractor_contact: payment.contractor_contact,
      amount: payment.amount,
      payment_date: payment.payment_date.split('T')[0],
      progress_at_payment: payment.progress_at_payment,
      transaction_id: payment.transaction_id,
      payment_method: payment.payment_method,
      inspection_id: payment.inspection_id || '',
      phase_id: payment.phase_id || '',
      bank_name: payment.bank_name || '',
      account_number: payment.account_number || '',
      check_number: payment.check_number || '',
      mobile_number: payment.mobile_number || '',
      mobile_operator: payment.mobile_operator || '',
      receiver_name: payment.receiver_name || '',
      supporting_documents: payment.supporting_documents || [],
      notes: ''
    });
    setSelectedPayment(payment);
    setUploadedDocuments(payment.supporting_documents || []);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const validatePayment = async () => {
    // Mock payment validation - simulate checking against bank guarantees, insurance, etc.
    const mockBlocked = Math.random() > 0.7; // 30% chance of being blocked
    setPaymentBlocked(mockBlocked);
    
    if (mockBlocked) {
      toast({
        title: "Paiement bloqué",
        description: "Ce paiement est bloqué en raison de problèmes de conformité (assurance expirée, garanties manquantes, etc.)",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.contractor_name || !formData.amount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    // Validate payment before proceeding
    if (!isEditing && !await validatePayment()) {
      return;
    }

    try {
      if (isEditing && selectedPayment) {
        // Mock update
        const updatedPayment = { 
          ...selectedPayment, 
          ...formData,
          payment_date: new Date(formData.payment_date).toISOString(),
          supporting_documents: uploadedDocuments,
          updated_at: new Date().toISOString()
        };
        setPayments(prev => prev.map(p => p.id === selectedPayment.id ? updatedPayment : p));
        toast({
          title: "Succès",
          description: "Paiement mis à jour avec succès",
        });
      } else {
        // Mock create
        const newPayment: Payment = {
          id: `pay-${Date.now()}`,
          ...formData,
          payment_date: new Date(formData.payment_date).toISOString(),
          supporting_documents: uploadedDocuments,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setPayments(prev => [...prev, newPayment]);
        toast({
          title: "Succès",
          description: "Paiement créé avec succès",
        });
      }
      
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      setPayments(prev => prev.filter(p => p.id !== paymentId));
      toast({
        title: "Succès",
        description: "Paiement supprimé avec succès",
      });
    }
  };

  const handleProjectChange = (projectId: string | undefined) => {
    setFormData(prev => ({ ...prev, project_id: projectId || '' }));
  };

  const handleSupplierChange = (supplier: any) => {
    setFormData(prev => ({ 
      ...prev, 
      contractor_id: supplier.id || '',
      contractor_name: supplier.name || '',
      contractor_contact: supplier.contact || ''
    }));
  };

  const handleDocumentUpload = (documentId: string) => {
    setUploadedDocuments(prev => [...prev, documentId]);
    setFormData(prev => ({ 
      ...prev, 
      supporting_documents: [...prev.supporting_documents, documentId] 
    }));
    setIsUploadDialogOpen(false);
    toast({
      title: "Document ajouté",
      description: "Le document justificatif a été ajouté au paiement"
    });
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(id => id !== documentId));
    setFormData(prev => ({ 
      ...prev, 
      supporting_documents: prev.supporting_documents.filter(id => id !== documentId)
    }));
  };

  const renderPaymentMethodFields = () => {
    switch (formData.payment_method) {
      case 'bank_transfer':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Nom de la banque</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div>
              <Label htmlFor="account_number">Numéro de compte</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
          </div>
        );
      
      case 'check':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check_number">Numéro de chèque</Label>
              <Input
                id="check_number"
                value={formData.check_number}
                onChange={(e) => setFormData(prev => ({ ...prev, check_number: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
            <div>
              <Label htmlFor="bank_name">Banque émettrice</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                disabled={isViewMode}
              />
            </div>
          </div>
        );
      
      case 'mobile_money':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobile_operator">Opérateur</Label>
              <Select 
                value={formData.mobile_operator} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, mobile_operator: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un opérateur" />
                </SelectTrigger>
                <SelectContent>
                  {mobileOperators.map((operator) => (
                    <SelectItem key={operator.value} value={operator.value}>
                      {operator.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mobile_number">Numéro de téléphone</Label>
              <Input
                id="mobile_number"
                value={formData.mobile_number}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
                disabled={isViewMode}
                placeholder="+222 XX XX XX XX"
              />
            </div>
          </div>
        );
      
      case 'cash':
        return (
          <div>
            <Label htmlFor="receiver_name">Nom du bénéficiaire</Label>
            <Input
              id="receiver_name"
              value={formData.receiver_name}
              onChange={(e) => setFormData(prev => ({ ...prev, receiver_name: e.target.value }))}
              disabled={isViewMode}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">💰 Gestion des Paiements</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Paiement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails du Paiement' : isEditing ? 'Modifier le Paiement' : 'Nouveau Paiement'}
              </DialogTitle>
            </DialogHeader>
            
            {paymentBlocked && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
                <Ban className="h-5 w-5" />
                <div>
                  <p className="font-medium">Paiement bloqué</p>
                  <p className="text-sm">Ce paiement ne peut pas être traité en raison de problèmes de conformité.</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProjectSelector
                  value={formData.project_id}
                  onChange={handleProjectChange}
                  label="Projet"
                  required
                  disabled={isViewMode}
                />
                
                <div>
                  <SupplierSelector
                    value={{ 
                      id: formData.contractor_id,
                      name: formData.contractor_name,
                      contact: formData.contractor_contact,
                      leadTime: 0
                    }}
                    onChange={handleSupplierChange}
                    allowCustom={true}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">Montant (MRU) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="payment_date">Date de paiement *</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="progress_at_payment">Progression (%)</Label>
                  <Input
                    id="progress_at_payment"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_at_payment}
                    onChange={(e) => setFormData(prev => ({ ...prev, progress_at_payment: parseInt(e.target.value) || 0 }))}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Méthode de paiement *</Label>
                  <Select 
                    value={formData.payment_method} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="transaction_id">ID de transaction *</Label>
                  <Input
                    id="transaction_id"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                    required
                    disabled={isViewMode}
                    placeholder="TXN-123456"
                  />
                </div>
              </div>

              {renderPaymentMethodFields()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inspection_id">Inspection liée (optionnel)</Label>
                  <Input
                    id="inspection_id"
                    value={formData.inspection_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspection_id: e.target.value }))}
                    disabled={isViewMode}
                    placeholder="INSP-001"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phase_id">Phase liée (optionnel)</Label>
                  <Input
                    id="phase_id"
                    value={formData.phase_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, phase_id: e.target.value }))}
                    disabled={isViewMode}
                    placeholder="PHASE-001"
                  />
                </div>
              </div>

              {/* Documents Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Documents justificatifs</Label>
                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" disabled={isViewMode}>
                        <Upload className="h-4 w-4 mr-2" />
                        Ajouter Document
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter Document Justificatif</DialogTitle>
                      </DialogHeader>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Télécharger un document justificatif pour ce paiement (PDF, JPG, PNG acceptés, max 10MB)
                        </p>
                        {/* Placeholder for document upload functionality */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Glisser-déposer ou cliquer pour sélectionner</p>
                          <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {uploadedDocuments.length > 0 && (
                  <div className="border rounded-lg p-3 space-y-2">
                    {uploadedDocuments.map((docId, index) => (
                      <div key={docId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">Document {index + 1}</span>
                        </div>
                        {!isViewMode && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(docId)}
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  disabled={isViewMode}
                  placeholder="Notes et commentaires..."
                />
              </div>

              {/* Document Visualization Section for View Mode */}
              {isViewMode && selectedPayment && (
                <div className="mt-6 pt-6 border-t">
                  <DocumentSection 
                    relatedId={selectedPayment.id} 
                    relatedType="payment"
                    title="Documents du Paiement"
                  />
                </div>
              )}

              {!isViewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={paymentBlocked}>
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Contractant</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.project_id}
                  </TableCell>
                  <TableCell>{payment.contractor_name}</TableCell>
                  <TableCell>
                    {payment.amount.toLocaleString()} MRU
                  </TableCell>
                  <TableCell>
                    {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {paymentMethods.find(m => m.value === payment.payment_method)?.label}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${payment.progress_at_payment}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{payment.progress_at_payment}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{payment.supporting_documents?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openViewForm(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditForm(payment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(payment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Aucun paiement trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCrud;