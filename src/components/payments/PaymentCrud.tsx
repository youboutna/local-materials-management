import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Shield, 
  Calendar,
  DollarSign,
  Settings,
  Users,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Upload,
  Ban,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { createPaymentControlAction } from '@/services/paymentControlActionService';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import DocumentSelector from '@/components/selectors/DocumentSelector';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentViewer from '@/components/documents/DocumentViewer';
import DocumentSection from '@/components/common/DocumentSection';

interface Payment {
  id: string;
  project_id: string;
  contractor_id?: string | null;
  contractor_name: string;
  contractor_contact: string;
  amount: number;
  payment_date: string;
  progress_at_payment: number;
  transaction_id: string;
  payment_method: string;
  inspection_id?: string | null;
  phase_id?: string | null;
  // Payment documents
  supporting_documents?: string[];
  receipt_url?: string;
  invoice_url?: string;
  // Additional payment method fields
  bank_name?: string | null;
  account_number?: string | null;
  check_number?: string | null;
  mobile_number?: string | null;
  mobile_operator?: string | null;
  receiver_name?: string | null;
  created_at?: string;
  updated_at?: string;
  // We'll fetch project data separately if needed
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
  purchase_order_url?: string;
  quote_url?: string;
  invoice_url?: string;
}

const PaymentCrud: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [parsedInvoiceData, setParsedInvoiceData] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
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
    notes: '',
    purchase_order_url: '',
    quote_url: '',
    invoice_url: ''
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

  // Fetch payments from database
  React.useEffect(() => {
    fetchPayments();
    // Set up real-time listener
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePaymentAction = async (paymentId: string, actionType: string) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      let title = '';
      let message = '';
      
      switch (actionType) {
        case 'task_assignment':
          title = 'Résolution problème de paiement';
          message = `Veuillez résoudre les problèmes liés au paiement ${payment.transaction_id} pour le projet ${payment.project_id}`;
          break;
        case 'hierarchy_notification':
          title = 'Alerte paiement critique';
          message = `Le paiement ${payment.transaction_id} nécessite une attention immédiate`;
          break;
        case 'sms':
          title = 'Notification SMS';
          message = `SMS: Paiement ${payment.transaction_id} en attente de traitement`;
          break;
        case 'call':
          title = 'Appel téléphonique';
          message = `Appel concernant le paiement ${payment.transaction_id}`;
          break;
        case 'email':
          title = 'Notification email';
          message = `Email concernant le paiement ${payment.transaction_id}`;
          break;
        case 'mail':
          title = 'Courrier postal';
          message = `Courrier concernant le paiement ${payment.transaction_id}`;
          break;
      }

      await createPaymentControlAction({
        paymentId,
        projectId: payment.project_id,
        contractorId: payment.contractor_id || 'unknown',
        actionType: actionType as any,
        title,
        message,
        priority: 'high',
        recipientIds: ['demo-user-001'], // In real app, this would be dynamic
        metadata: { paymentData: payment }
      });

      toast({
        title: 'Action créée',
        description: `${title} créée avec succès`,
      });
    } catch (error) {
      console.error('Error creating payment action:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'action',
        variant: 'destructive'
      });
    }
  };

  const handleExportReceipt = (paymentId: string) => {
    toast({
      title: 'Export en cours',
      description: 'Le reçu de paiement est en cours d\'export...',
    });
  };

  const handleBlockchainVerify = (paymentId: string) => {
    toast({
      title: 'Vérification blockchain',
      description: 'Vérification de l\'intégrité sur la blockchain...',
    });
  };
  
  // Filter payments based on search and filters
  React.useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.contractor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.contractor_contact.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.payment_method === paymentMethodFilter);
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, paymentMethodFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        contractor_id: item.contractor_id || undefined,
        inspection_id: item.inspection_id || undefined,
        phase_id: item.phase_id || undefined,
        bank_name: item.bank_name || undefined,
        account_number: item.account_number || undefined,
        check_number: item.check_number || undefined,
        mobile_number: item.mobile_number || undefined,
        mobile_operator: item.mobile_operator || undefined,
        receiver_name: item.receiver_name || undefined,
      }));
      
      setPayments(transformedData as Payment[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paiements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      notes: '',
      purchase_order_url: '',
      quote_url: '',
      invoice_url: ''
    });
    setPaymentBlocked(false);
    setUploadedDocuments([]);
    setParsedInvoiceData([]);
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
        // Update payment in database
        const { error } = await supabase
          .from('payments')
          .update({
            contractor_name: formData.contractor_name,
            contractor_contact: formData.contractor_contact,
            amount: formData.amount,
            payment_date: formData.payment_date,
            progress_at_payment: formData.progress_at_payment,
            transaction_id: formData.transaction_id,
            payment_method: formData.payment_method,
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            check_number: formData.check_number,
            mobile_number: formData.mobile_number,
            mobile_operator: formData.mobile_operator,
            receiver_name: formData.receiver_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPayment.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Paiement mis à jour avec succès",
        });
      } else {
        // Create new payment in database
        const { error } = await supabase
          .from('payments')
          .insert({
            project_id: formData.project_id,
            contractor_id: formData.contractor_id || null,
            contractor_name: formData.contractor_name,
            contractor_contact: formData.contractor_contact,
            amount: formData.amount,
            payment_date: formData.payment_date,
            progress_at_payment: formData.progress_at_payment,
            transaction_id: formData.transaction_id,
            payment_method: formData.payment_method,
            inspection_id: formData.inspection_id || null,
            phase_id: formData.phase_id || null,
            bank_name: formData.bank_name,
            account_number: formData.account_number,
            check_number: formData.check_number,
            mobile_number: formData.mobile_number,
            mobile_operator: formData.mobile_operator,
            receiver_name: formData.receiver_name
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Paiement créé avec succès",
        });
      }
      
      setIsFormOpen(false);
      resetForm();
      fetchPayments(); // Refresh the list
    } catch (error) {
      console.error('Database error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        const { error } = await supabase
          .from('payments')
          .delete()
          .eq('id', paymentId);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Paiement supprimé avec succès",
        });
        fetchPayments(); // Refresh the list
      } catch (error) {
        console.error('Delete error:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `payments/${fileName}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Update form data with the uploaded file URL
      setFormData(prev => ({
        ...prev,
        [`${type}_url`]: publicUrl
      }));

      toast({
        title: "Document téléchargé",
        description: `${type === 'purchase_order' ? 'Bon de commande' : type === 'quote' ? 'Devis' : 'Facture'} téléchargé avec succès`
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement du document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // First upload the file
      const fileExt = file.name.split('.').pop();
      const fileName = `invoice_${Date.now()}.${fileExt}`;
      const filePath = `payments/${fileName}`;

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Parse invoice if it's a PDF
      if (file.type === 'application/pdf') {
        try {
          const fileUrl = URL.createObjectURL(file);
          // Parse invoice if it's a PDF (temporarily disabled)
          // const invoiceData = await parseInvoiceFromPdf(fileUrl);
          // URL.revokeObjectURL(fileUrl);
          
          // if (invoiceData && invoiceData.length > 0) {
          //   setParsedInvoiceData(invoiceData);
          //   
          //   // Calculate total amount from invoice lines
          //   const totalAmount = invoiceData.reduce((sum, line) => {
          //     return sum + (line.totalPrice || (line.quantity * (line.unitPrice || 0)));
          //   }, 0);
          //   
          //   if (totalAmount > 0) {
          //     setFormData(prev => ({
          //       ...prev,
          //       amount: totalAmount
          //     }));
          //   }
          // }
        } catch (parseError) {
          console.error('Invoice parsing error:', parseError);
          toast({
            title: "Attention",
            description: "Le document a été téléchargé mais l'analyse automatique a échoué",
            variant: "destructive"
          });
        }
      }

      // Update form data with the uploaded file URL
      setFormData(prev => ({
        ...prev,
        invoice_url: publicUrl
      }));

      toast({
        title: "Facture téléchargée",
        description: "Facture téléchargée et analysée avec succès"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement de la facture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const viewDocument = (url: string) => {
    window.open(url, '_blank');
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

              <div>
                <Label>Documents Justificatifs et Factures</Label>
                {!isViewMode && (
                  <div className="space-y-3">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       {/* Purchase Order Upload */}
                       <div className="space-y-2">
                         <Label className="text-sm">Bon de Commande</Label>
                         <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                           <input
                             type="file"
                             id="purchase-order"
                             accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                             className="hidden"
                             disabled={isViewMode || uploading}
                             onChange={(e) => handleFileUpload(e, 'purchase_order')}
                           />
                           <label 
                             htmlFor="purchase-order" 
                             className={`cursor-pointer flex flex-col items-center gap-2 ${isViewMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                             <Upload className="h-6 w-6 text-muted-foreground" />
                             <span className="text-xs text-muted-foreground">
                               {uploading ? 'Téléchargement...' : 'Cliquer pour ajouter'}
                             </span>
                           </label>
                         </div>
                         {formData.purchase_order_url && (
                           <div className="flex items-center gap-2 text-sm text-green-600">
                             <FileText className="h-4 w-4" />
                             <span>Bon de commande ajouté</span>
                             <Button 
                               type="button" 
                               variant="ghost" 
                               size="sm"
                               onClick={() => viewDocument(formData.purchase_order_url!)}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                           </div>
                         )}
                       </div>

                       {/* Quote Upload */}
                       <div className="space-y-2">
                         <Label className="text-sm">Devis</Label>
                         <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                           <input
                             type="file"
                             id="quote"
                             accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                             className="hidden"
                             disabled={isViewMode || uploading}
                             onChange={(e) => handleFileUpload(e, 'quote')}
                           />
                           <label 
                             htmlFor="quote" 
                             className={`cursor-pointer flex flex-col items-center gap-2 ${isViewMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                             <Upload className="h-6 w-6 text-muted-foreground" />
                             <span className="text-xs text-muted-foreground">
                               {uploading ? 'Téléchargement...' : 'Cliquer pour ajouter'}
                             </span>
                           </label>
                         </div>
                         {formData.quote_url && (
                           <div className="flex items-center gap-2 text-sm text-green-600">
                             <FileText className="h-4 w-4" />
                             <span>Devis ajouté</span>
                             <Button 
                               type="button" 
                               variant="ghost" 
                               size="sm"
                               onClick={() => viewDocument(formData.quote_url!)}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                           </div>
                         )}
                       </div>

                       {/* Invoice PDF Upload with Analysis */}
                       <div className="space-y-2">
                         <Label className="text-sm">Facture PDF</Label>
                         <div className="border-2 border-dashed border-muted rounded-lg p-4 text-center">
                           <input
                             type="file"
                             id="invoice"
                             accept=".pdf"
                             className="hidden"
                             disabled={isViewMode || uploading}
                             onChange={handleInvoiceUpload}
                           />
                           <label 
                             htmlFor="invoice" 
                             className={`cursor-pointer flex flex-col items-center gap-2 ${isViewMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                           >
                             <Upload className="h-6 w-6 text-muted-foreground" />
                             <span className="text-xs text-muted-foreground">
                               {uploading ? 'Analyse...' : 'PDF avec analyse automatique'}
                             </span>
                           </label>
                         </div>
                         {formData.invoice_url && (
                           <div className="flex items-center gap-2 text-sm text-green-600">
                             <FileText className="h-4 w-4" />
                             <span>Facture analysée</span>
                             <Button 
                               type="button" 
                               variant="ghost" 
                               size="sm"
                               onClick={() => viewDocument(formData.invoice_url!)}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                           </div>
                         )}
                       </div>
                     </div>

                     {/* Display parsed invoice data if available */}
                     {parsedInvoiceData && parsedInvoiceData.length > 0 && (
                       <div className="p-4 bg-muted rounded-lg space-y-2">
                         <Label className="text-sm font-medium">Données extraites de la facture :</Label>
                         <div className="text-sm space-y-2">
                           <div>
                             <span className="font-medium">Nombre d'articles : </span>
                             <span>{parsedInvoiceData.length}</span>
                           </div>
                           <div>
                             <span className="font-medium">Montant total calculé : </span>
                             <span>
                               {parsedInvoiceData.reduce((sum, line) => {
                                 return sum + (line.totalPrice || (line.quantity * (line.unitPrice || 0)));
                               }, 0).toLocaleString()} MRU
                             </span>
                           </div>
                           {parsedInvoiceData.length <= 3 && (
                             <div className="space-y-1">
                               <span className="font-medium">Articles détectés :</span>
                               {parsedInvoiceData.map((line, index) => (
                                 <div key={index} className="text-xs bg-background p-2 rounded">
                                   {line.designation} - {line.quantity} {line.unit} - {(line.totalPrice || (line.quantity * (line.unitPrice || 0))).toLocaleString()} MRU
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                    
                    <DocumentSelector
                      onChange={(documentId, document) => {
                        if (document && documentId) {
                          handleDocumentUpload(documentId);
                        }
                      }}
                      documentType="contract"
                      disabled={isViewMode}
                    />
                  </div>
                )}
                
                {uploadedDocuments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Documents téléchargés:</p>
                    <div className="space-y-1">
                      {uploadedDocuments.map((docId, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span>Document {index + 1}</span>
                          <div className="flex gap-1">
                            {!isViewMode && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDocument(docId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Paiements</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les méthodes</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead>Contractant</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="text-sm">ID: {payment.project_id.substring(0, 8)}...</div>
                        <div className="text-xs text-muted-foreground">Projet</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.contractor_name}</div>
                        <div className="text-xs text-muted-foreground">{payment.contractor_contact}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {payment.amount.toLocaleString()} MRU
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(payment.payment_date).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {paymentMethods.find(m => m.value === payment.payment_method)?.label || payment.payment_method}
                      </Badge>
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
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {payment.transaction_id}
                      </code>
                    </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="ghost" title="Voir les détails">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Modifier">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Supprimer">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" className="gap-2">
                                    <Settings className="h-4 w-4" />
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem onClick={() => handlePaymentAction(payment.id, 'task_assignment')}>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Assigner une tâche
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePaymentAction(payment.id, 'hierarchy_notification')}>
                                    <Users className="h-4 w-4 mr-2" />
                                    Notifier la hiérarchie
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handlePaymentAction(payment.id, 'sms')}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Envoyer SMS
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePaymentAction(payment.id, 'call')}>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Programmer appel
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePaymentAction(payment.id, 'email')}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Envoyer email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePaymentAction(payment.id, 'mail')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Courrier postal
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleExportReceipt(payment.id)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Exporter reçu
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleBlockchainVerify(payment.id)}>
                                    <Shield className="h-4 w-4 mr-2" />
                                    Vérification blockchain
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                  </TableRow>
                ))}
                {filteredPayments.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <CreditCard className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm || paymentMethodFilter !== 'all' 
                            ? 'Aucun paiement trouvé avec ces filtres' 
                            : 'Aucun paiement trouvé'}
                        </p>
                        {(searchTerm || paymentMethodFilter !== 'all') && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSearchTerm('');
                              setPaymentMethodFilter('all');
                            }}
                          >
                            Réinitialiser les filtres
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCrud;