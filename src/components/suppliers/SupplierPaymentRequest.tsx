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
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/services/NotificationService';
import EnhancedProjectSelector from '@/components/selectors/EnhancedProjectSelector';
import { ProgressInvoiceForm } from '@/components/invoices/ProgressInvoiceForm';

interface PaymentRequest {
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
  approved_by?: string;
  approved_at?: string;
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
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [initiationId, setInitiationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form fields
  const [projectId, setProjectId] = useState('');
  const [tenderReference, setTenderReference] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentReason, setPaymentReason] = useState('');
  const [notes, setNotes] = useState('');

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
    fetchProjects();
  }, [supplierId]);

  const fetchPaymentRequests = async () => {
    try {
      // First try to get from supplier_payment_requests table
      const { data: directRequests, error: directError } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('requested_date', { ascending: false });

      if (directError) {
        console.error('Error fetching direct payment requests:', directError);
      }

      // Also get from notifications table for any legacy requests
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', supplierId)
        .eq('type', 'supplier_payment_request')
        .order('created_at', { ascending: false });

      if (notificationError) {
        console.error('Error fetching notification payment requests:', notificationError);
      }
      
      // Transform notifications to payment requests format for legacy support
      const transformedNotifications = (notificationData || []).map((notification: any) => ({
        id: notification.id,
        supplier_id: supplierId,
        project_id: notification.metadata?.project_id || null,
        amount: notification.metadata?.amount || 0,
        description: notification.metadata?.description || '',
        payment_reason: notification.metadata?.payment_reason || '',
        supporting_documents: notification.metadata?.supporting_documents || [],
        status: notification.metadata?.status || 'pending',
        requested_date: notification.created_at,
        notes: notification.metadata?.notes || '',
      }));

      // Combine both sources, prioritizing direct requests
      const allRequests = [
        ...(directRequests || []),
        ...transformedNotifications.filter(notif => 
          !(directRequests || []).some(direct => direct.id === notif.id)
        )
      ];
      
      setPaymentRequests(allRequests);
      console.log('Fetched payment requests:', allRequests);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les demandes de paiement',
        variant: 'destructive',
      });
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, status')
        .eq('status', 'en_cours');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Simple file upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `payment_requests/${fileName}`;

      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setUploadedDocuments(prev => [...prev, publicUrl]);
      toast({
        title: 'Document téléchargé',
        description: 'Le document a été ajouté à votre demande',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    }
  };

  const validatePaymentRequest = async (projectId: string): Promise<ValidationResult> => {
    // Check guarantees, insurance, and inspections
    const [guarantees, insurance, inspections] = await Promise.all([
      supabase
        .from('bank_guarantees')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .gte('expiry_date', new Date().toISOString().split('T')[0]),
      
      supabase
        .from('insurance_certificates')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'active')
        .gte('valid_until', new Date().toISOString().split('T')[0]),
      
      supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'validé')
        .order('date', { ascending: false })
        .limit(1)
    ]);

    return {
      hasValidGuarantee: guarantees.data ? guarantees.data.length > 0 : false,
      hasValidInsurance: insurance.data ? insurance.data.length > 0 : false,
      hasRecentInspection: inspections.data ? inspections.data.length > 0 : false,
    };
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

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
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

      // Create payment request using the database function
      const { data: paymentRequestData, error: requestError } = await supabase
        .rpc('create_supplier_payment_request', {
          supplier_id_param: supplierId,
          amount_param: parseFloat(amount),
          description_param: description,
          payment_reason_param: paymentReason,
          project_id_param: projectId || undefined,
          supporting_documents_param: uploadedDocuments,
          notes_param: notes || undefined
        });

      if (requestError) {
        console.error('Error creating payment request:', requestError);
        throw requestError;
      }

      console.log('Payment request created successfully:', paymentRequestData);

      // Also create a notification for the supplier
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          recipient_id: supplierId,
          title: 'Demande de paiement créée',
          message: `Demande de paiement de ${parseFloat(amount).toLocaleString()} MRU créée`,
          type: 'supplier_payment_request',
          related_id: paymentRequestData[0]?.id,
          metadata: {
            supplier_id: supplierId,
            project_id: projectId,
            amount: parseFloat(amount),
            payment_reason: paymentReason,
            description,
            supporting_documents: uploadedDocuments,
            notes,
            status: 'pending',
          }
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      // Get directors and managers for notifications
      const { data: managersData } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role_name', ['director', 'manager']);

      // Send notifications to directors and managers
      if (managersData && managersData.length > 0) {
        const notifications = managersData.map(manager => ({
          recipient_id: manager.user_id,
          title: 'Nouvelle demande de paiement fournisseur',
          message: `Une demande de paiement de ${parseFloat(amount).toLocaleString()} MRU a été soumise par un fournisseur`,
          type: 'supplier_payment_request',
          related_id: paymentRequestData[0]?.id,
          metadata: {
            supplier_id: supplierId,
            project_id: projectId,
            amount: parseFloat(amount),
            has_valid_guarantee: validationResult?.hasValidGuarantee || false,
            has_valid_insurance: validationResult?.hasValidInsurance || false,
            has_recent_inspection: validationResult?.hasRecentInspection || false,
            can_auto_approve: (validationResult?.hasValidGuarantee && validationResult?.hasValidInsurance && validationResult?.hasRecentInspection) || false
          },
        }));

        await NotificationService.createBatchNotifications(notifications);
      }

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
      approved: { color: 'bg-green-100 text-green-800', label: 'Approuvé' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejeté' },
      processed: { color: 'bg-blue-100 text-blue-800', label: 'Traité' },
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
                    placeholder="Sélectionner un projet"
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
                    <SelectValue placeholder="Sélectionner le motif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="materials">Fourniture de matériaux</SelectItem>
                    <SelectItem value="services">Prestation de services</SelectItem>
                    <SelectItem value="equipment">Location d'équipement</SelectItem>
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
                  placeholder="Décrivez en détail la prestation ou fourniture"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes additionnelles</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires"
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
                    Télécharger un document
                  </label>
                </div>
                {uploadedDocuments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center text-sm text-green-600">
                        <FileText className="mr-1 h-3 w-3" />
                        Document {index + 1} téléchargé
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
                    {new Date(request.requested_date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {request.project_id ? 
                      projects.find(p => String(p.id) === String(request.project_id))?.title || request.project_id 
                      : 'Non spécifié'
                    }
                  </TableCell>
                  <TableCell>{request.amount.toLocaleString()} MRU</TableCell>
                  <TableCell>{request.payment_reason}</TableCell>
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