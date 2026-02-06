import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Send, FileText, Upload, Eye, Clock, CheckCircle, AlertTriangle, DollarSign, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PaymentRequestService } from '@/application/services/PaymentRequestService';
import { PaymentRequestDTO, CreatePaymentRequestDTO } from '@/dtos/entities/PaymentDTO';
import { AuthService } from '@/application/services/AuthService';
import { DocumentService } from '@/application/services/DocumentService';
import { NotificationService } from '@/application/services/NotificationService';
import { useProjectsHex } from '@/hooks/hexagonal';
import { useAuth } from '@/hooks/hexagonal';
import EnhancedProjectSelector from '@/components/selectors/EnhancedProjectSelector';
import { ProgressInvoiceForm } from '@/components/invoices/ProgressInvoiceForm';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

interface LocalPaymentRequest {
  id: string;
  supplier_id: string;
  project_id?: string;
  amount: number;
  description: string;
  payment_reason: string;
  supporting_documents: string[];
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requested_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  rejection_reason?: string;
}

interface ValidationResult {
  hasValidGuarantee: boolean;
  hasValidInsurance: boolean;
  hasRecentInspection: boolean;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

interface PrefillData {
  projectId?: string;
  amount?: number;
  description?: string;
  initiationId?: string;
}

interface SupplierPaymentRequestProps {
  supplierId: string;
  prefillData?: PrefillData | null;
  onPrefillUsed?: () => void;
}

const SupplierPaymentRequest: React.FC<SupplierPaymentRequestProps> = ({ 
  supplierId, 
  prefillData,
  onPrefillUsed 
}) => {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestDTO[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [initiationId, setInitiationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Use hexagonal hooks
  const { projects, isLoading: projectsLoading } = useProjectsHex();
  const { user } = useAuth();

  // Form fields
  const [projectId, setProjectId] = useState('');
  const [tenderReference, setTenderReference] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentReason, setPaymentReason] = useState('');
  const [notes, setNotes] = useState('');

  // Services - initialized with proper repositories
  const paymentRepository = RepositoryFactory.getPaymentRepository();
  const paymentRequestService = new PaymentRequestService(paymentRepository);
  const documentService = new DocumentService();

  // Handle prefill data from payment initiation
  useEffect(() => {
    if (prefillData) {
      if (prefillData.projectId) setProjectId(prefillData.projectId);
      if (prefillData.amount) setAmount(prefillData.amount.toString());
      if (prefillData.description) setDescription(prefillData.description);
      if (prefillData.initiationId) setInitiationId(prefillData.initiationId);
      setIsDialogOpen(true);
      onPrefillUsed?.();
    }
  }, [prefillData, onPrefillUsed]);

  useEffect(() => {
    fetchPaymentRequests();
  }, [supplierId]);

  const fetchPaymentRequests = async () => {
    try {
      // Use PaymentRequestService instead of direct Supabase calls
      const requests = await paymentRequestService.getPaymentRequestsByProject(supplierId);
      setPaymentRequests(requests);
      console.log('Fetched payment requests:', requests);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les demandes de paiement',
        variant: 'destructive',
      });
    }
  };


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Use DocumentService uploadDocument method
      const uploadedDocument = await documentService.uploadDocument({
        title: file.name,
        file: file,
        type: 'supporting_document' as any,
        projectId: projectId || undefined,
        description: 'Document support pour demande de paiement',
      }, user?.id || 'anonymous');
      
      setUploadedDocuments(prev => [...prev, uploadedDocument.url || '']);
      toast({
        title: 'Document tÃ©lÃ©chargÃ©',
        description: 'Le document a Ã©tÃ© ajoutÃ© Ã  votre demande',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de tÃ©lÃ©charger le document',
        variant: 'destructive',
      });
    }
  };

  const validatePaymentRequest = async (projectIdToValidate: string): Promise<ValidationResult> => {
    try {
      // Use PaymentRequestService for validation
      const validation = await paymentRequestService.validateProjectRequirements(projectIdToValidate);
      return {
        hasValidGuarantee: validation.hasValidGuarantee,
        hasValidInsurance: validation.hasValidInsurance,
        hasRecentInspection: validation.hasRecentInspection,
      };
    } catch (error) {
      console.error('Error validating payment request:', error);
      return {
        hasValidGuarantee: false,
        hasValidInsurance: false,
        hasRecentInspection: false,
      };
    }
  };


  const submitPaymentRequest = async () => {
    if (!amount || !description || !paymentReason) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    // Check authentication using user from hook
    if (!user?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer une demande de paiement',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Validate requirements if project selected
      let validationResult: ValidationResult | null = null;
      if (projectId) {
        validationResult = await validatePaymentRequest(projectId);
      }

      // Create payment request using PaymentRequestService
      const paymentRequestData: CreatePaymentRequestDTO = {
        supplierId,
        amount: parseFloat(amount),
        description,
        paymentReason,
        projectId: projectId || undefined,
      };

      const createdRequest = await paymentRequestService.createPaymentRequest(paymentRequestData);
      console.log('Payment request created successfully:', createdRequest);

      // Create notification for managers using NotificationService
      const notificationData = {
        recipient_id: supplierId,
        title: 'Demande de paiement créée',
        message: `Demande de paiement de ${parseFloat(amount).toLocaleString()} MRU créée`,
        type: 'info' as const,
        metadata: {
          supplier_id: supplierId,
          project_id: projectId,
          amount: parseFloat(amount),
          payment_reason: paymentReason,
          description,
          supporting_documents: uploadedDocuments,
          notes,
          status: 'pending',
          has_valid_guarantee: validationResult?.hasValidGuarantee || false,
          has_valid_insurance: validationResult?.hasValidInsurance || false,
          has_recent_inspection: validationResult?.hasRecentInspection || false,
          can_auto_approve: (validationResult?.hasValidGuarantee && validationResult?.hasValidInsurance && validationResult?.hasRecentInspection) || false
        }
      };

      await NotificationService.createNotification(notificationData);

      toast({
        title: 'Demande envoyée',
        description: 'Votre demande de paiement a été soumise avec succès',
      });

      // Reset form
      setProjectId('');
      setTenderReference('');
      setAmount('');
      setDescription('');
      setPaymentReason('');
      setNotes('');
      setUploadedDocuments([]);
      setIsDialogOpen(false);
      
      fetchPaymentRequests();
    } catch (error) {
      console.error('Error submitting payment request:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de soumettre la demande de paiement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      approved: { color: 'bg-green-100 text-green-800', label: 'ApprouvÃ©' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'RejetÃ©' },
      processed: { color: 'bg-blue-100 text-blue-800', label: 'TraitÃ©' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Demandes de Paiement</h2>
      </div>

      <Tabs defaultValue="simple" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simple">Demande Simple</TabsTrigger>
          <TabsTrigger value="progress">Facture d'Avancement</TabsTrigger>
        </TabsList>

        <TabsContent value="simple">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle Demande
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouvelle Demande de Paiement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <EnhancedProjectSelector
                    value={projectId}
                    onChange={(id) => setProjectId(id || '')}
                    label="Projet (optionnel)"
                    placeholder="SÃ©lectionner un projet"
                    secureMode={true}
                    showTenderReference={true}
                    tenderReference={tenderReference}
                    onTenderReferenceChange={setTenderReference}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Montant (MRU) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="paymentReason">Motif du paiement *</Label>
                <Select value={paymentReason} onValueChange={setPaymentReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="SÃ©lectionner le motif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materials">Fourniture de matÃ©riaux</SelectItem>
                    <SelectItem value="services">Prestation de services</SelectItem>
                    <SelectItem value="equipment">Location d'Ã©quipement</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="DÃ©crivez en dÃ©tail la prestation ou fourniture"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes additionnelles</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complÃ©mentaires"
                  rows={2}
                />
              </div>

              <div>
                <Label>Documents justificatifs</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    id="document-upload"
                  />
                  <label
                    htmlFor="document-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    TÃ©lÃ©charger un document
                  </label>
                </div>
                {uploadedDocuments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center text-sm text-green-600">
                        <FileText className="mr-1 h-3 w-3" />
                        Document {index + 1} tÃ©lÃ©chargÃ©
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={submitPaymentRequest} disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? 'Envoi...' : 'Envoyer la demande'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Historique des Demandes de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {new Date(request.createdAt || '').toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {request.projectId ? 
                      projects.find(p => String(p.id) === String(request.projectId))?.title || request.projectId 
                      : 'Non spécifié'
                    }
                  </TableCell>
                  <TableCell>{request.amount.toLocaleString()} MRU</TableCell>
                  <TableCell>{request.paymentReason}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                     <Button variant="outline" size="sm" asChild>
                       <Link to={`/supplier-portal?tab=payments&id=${request.id}`}>
                         <Eye className="h-4 w-4" />
                       </Link>
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paymentRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Aucune demande de paiement
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
        </TabsContent>

        <TabsContent value="progress">
          <ProgressInvoiceForm 
            supplierId={supplierId}
            onSuccess={() => fetchPaymentRequests()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplierPaymentRequest;
