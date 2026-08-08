import { AuthService } from '@/application/services/AuthService';
import { NotificationService } from '@/application/services/NotificationService';
import { StorageService } from '@/application/services/StorageService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Eye, FileText, Upload, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProgressInvoice {
  id: string;
  invoiceNumber: string; // ✅ CAMELCASE: Instead of invoice_number
  invoiceType: string; // ✅ CAMELCASE: Instead of invoice_type
  progressPercentage: number; // ✅ CAMELCASE: Instead of progress_percentage
  previousProgress: number; // ✅ CAMELCASE: Instead of previous_progress
  totalContractAmount: number; // ✅ CAMELCASE: Instead of total_contract_amount
  invoiceAmount: number; // ✅ CAMELCASE: Instead of invoice_amount
  workDescription: string; // ✅ CAMELCASE: Instead of work_description
  status: string;
  submittedAt: string; // ✅ CAMELCASE: Instead of submitted_at
  projectId: string; // ✅ CAMELCASE: Instead of project_id
  inspectionId: string; // ✅ CAMELCASE: Instead of inspection_id
  supportingDocuments: string[]; // ✅ CAMELCASE: Instead of supporting_documents
  projects?: {
    title: string;
    projectType: string; // ✅ CAMELCASE: Instead of project_type
    fundingSource: string; // ✅ CAMELCASE: Instead of funding_source
  };
  
  // Legacy snake_case for backward compatibility
  invoice_number?: string; // Legacy snake_case for backward compatibility
  invoice_type?: string; // Legacy snake_case for backward compatibility
  progress_percentage?: number; // Legacy snake_case for backward compatibility
  previous_progress?: number; // Legacy snake_case for backward compatibility
  total_contract_amount?: number; // Legacy snake_case for backward compatibility
  invoice_amount?: number; // Legacy snake_case for backward compatibility
  work_description?: string; // Legacy snake_case for backward compatibility
  submitted_at?: string; // Legacy snake_case for backward compatibility
  project_id?: string; // Legacy snake_case for backward compatibility
  inspection_id?: string; // Legacy snake_case for backward compatibility
  supporting_documents?: string[]; // Legacy snake_case for backward compatibility
}

export function ConsultantValidationPanel() {
  const [invoices, setInvoices] = useState<ProgressInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ProgressInvoice | null>(null);
  const [comments, setComments] = useState('');
  const [serviceFaitFile, setServiceFaitFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const { hasAnyRole, hasRole } = useCurrentUserRoles();
  
  // Initialize services
  const authService = getAuthService();
  const storageService = new StorageService(RepositoryFactory.getStorageRepository());

  // Check consultant permissions
  const isConsultant = hasAnyRole(['admin', 'consultant', 'manager']);
  const canValidateInfrastructure = hasRole('admin') || hasRole('consultant');

  useEffect(() => {
    loadPendingInvoices();
  }, []);

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      // Load invoices pending consultant validation
      const { data, error } = await supabase
        .from('progress_invoices')
        .select('*')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match ProgressInvoice interface
      const transformedData = data.map((invoice: any) => ({
        id: invoice.id,
        // Use snake_case from database, map to camelCase
        invoiceNumber: invoice.invoice_number || '',
        invoice_number: invoice.invoice_number || '',
        invoiceType: invoice.invoice_type || 'progress',
        invoice_type: invoice.invoice_type || 'progress',
        progressPercentage: invoice.progress_percentage || 0,
        progress_percentage: invoice.progress_percentage || 0,
        previousProgress: invoice.previous_progress || 0,
        previous_progress: invoice.previous_progress || 0,
        totalContractAmount: invoice.total_contract_amount || 0,
        total_contract_amount: invoice.total_contract_amount || 0,
        invoiceAmount: invoice.invoice_amount || 0,
        invoice_amount: invoice.invoice_amount || 0,
        workDescription: invoice.work_description || '',
        work_description: invoice.work_description || '',
        status: invoice.status || 'draft',
        submittedAt: invoice.submitted_at || '',
        submitted_at: invoice.submitted_at || '',
        projectId: invoice.project_id || '',
        project_id: invoice.project_id || '',
        inspectionId: invoice.inspection_id || '',
        inspection_id: invoice.inspection_id || '',
        supportingDocuments: invoice.supporting_documents || [],
        supporting_documents: invoice.supporting_documents || [],
        submitted_by: invoice.submitted_by || '',
        created_at: invoice.created_at || '',
        updated_at: invoice.updated_at || '',
        projects: invoice.projects ? {
          title: invoice.projects.title || '',
          projectType: invoice.projects.project_type || '',
          fundingSource: invoice.projects.funding_source || ''
        } : undefined
      } as ProgressInvoice));
      
      setInvoices(transformedData);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les factures',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (invoiceId: string, approved: boolean) => {
    if (approved && !serviceFaitFile) {
      toast({
        title: 'Document requis',
        description: 'Le document "service fait" signé est obligatoire pour approuver la facture',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Non authentifié');
      
      // Create employee object from user
      const employee = {
        id: user.id,
        name: user.email || 'Unknown',
        email: user.email || ''
      };

      let serviceFaitDocumentId: string | null = null;

      if (approved && serviceFaitFile) {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (!invoice) throw new Error('Facture non trouvée');

        const fileExt = serviceFaitFile.name.split('.').pop();
        const fileName = `service-fait-${invoiceId}-${Date.now()}.${fileExt}`;
        const filePath = `progress-invoices/${fileName}`;

        const uploadResult = await storageService.uploadFile({
          bucket: 'documents',
          path: filePath,
          file: serviceFaitFile
        });
        // StorageService throws exceptions on error, so if we get here it succeeded

        serviceFaitDocumentId = `doc-${Date.now()}`;
      }

      // Get current workflow history
      const { data: currentInvoice } = await (supabase as any)
        .from('progress_invoices')
        .select('workflow_history')
        .eq('id', invoiceId)
        .single();
      
      const workflowHistory = currentInvoice?.workflow_history as any[] || [];
      const newWorkflowEntry = {
        action: approved ? 'consultant_approved' : 'consultant_rejected',
        timestamp: new Date().toISOString(),
        user_id: user.id,
        employee_id: employee.id,
        comments: comments,
        status: approved ? 'consultant_approved' : 'consultant_rejected',
      };
      
      // Update invoice status and consultant validation
      const newStatus = approved ? 'consultant_approved' : 'consultant_rejected';
      
      const updateData: any = {
        status: newStatus,
        consultant_id: employee.id,
        consultant_validated_at: new Date().toISOString(),
        consultant_comments: comments,
        consultant_approval_status: approved ? 'approved' : 'rejected',
        workflow_history: [...workflowHistory, newWorkflowEntry],
      };

      // Add service fait document ID if available
      if (serviceFaitDocumentId) {
        updateData.service_fait_document_id = serviceFaitDocumentId;
      }

      const { error: updateError } = await (supabase as any)
        .from('progress_invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      // Create notification for supplier
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());
        await notificationService.createNotification({
          recipient_id: invoice.id, // Should be supplier user ID
          title: approved ? 'Facture approuvée par le consultant' : 'Facture rejetée par le consultant',
          message: `Facture ${invoice.invoice_number}: ${approved ? 'Approuvée' : 'Rejetée'} par l'ingénieur conseil`,
          type: approved ? 'success' : 'warning',
          read: false
        });
      }

      toast({
        title: approved ? 'Facture approuvée' : 'Facture rejetée',
        description: approved 
          ? 'La facture a été approuvée et suit le workflow du projet'
          : 'La facture a été rejetée et retournée au fournisseur',
      });

      setSelectedInvoice(null);
      setComments('');
      setServiceFaitFile(null);
      loadPendingInvoices();
    } catch (error: any) {
      console.error('Error validating invoice:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de valider la facture',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      supplier_submitted: { color: 'bg-yellow-100 text-yellow-800', label: 'Soumis' },
      consultant_reviewing: { color: 'bg-blue-100 text-blue-800', label: 'En cours' },
      consultant_approved: { color: 'bg-green-100 text-green-800', label: 'Approuvé' },
      consultant_rejected: { color: 'bg-red-100 text-red-800', label: 'Rejeté' },
    };
    
    const cfg = config[status] || config.supplier_submitted;
    return <Badge className={cfg.color}>{cfg.label}</Badge>;
  };

  if (!isConsultant) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Accès restreint. Seuls les ingénieurs conseils peuvent valider les factures d'avancement.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Validation des Factures d'Avancement
          {invoices.filter(i => i.status === 'supplier_submitted').length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {invoices.filter(i => i.status === 'supplier_submitted').length} en attente
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune facture en attente de validation</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Avancement</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber || invoice.invoice_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.projects?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.projects?.projectType}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{invoice.invoiceType || invoice.invoice_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.progressPercentage || invoice.progress_percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        Précédent: {invoice.previousProgress || invoice.previous_progress}%
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{((invoice.invoiceAmount || invoice.invoice_amount) ?? 0).toLocaleString('fr-FR')} MRU</p>
                      <p className="text-xs text-muted-foreground">
                        Total: {((invoice.totalContractAmount || invoice.total_contract_amount) ?? 0).toLocaleString('fr-FR')} MRU
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{new Date(invoice.submittedAt || invoice.submitted_at || '').toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.invoiceNumber || invoice.invoice_number}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    {invoice.projects?.projectType === 'infrastructure' && !canValidateInfrastructure ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        Accès limité
                      </Badge>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setComments('');
                              setServiceFaitFile(null);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Valider
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Validation de la facture {invoice.invoice_number}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Type de projet: <strong>{invoice.projects?.projectType}</strong>
                              {invoice.projects?.fundingSource && (
                                <> • Financement: {invoice.projects.fundingSource}</>
                              )}
                            </AlertDescription>
                          </Alert>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Avancement</p>
                              <p className="text-2xl font-bold">{invoice.progress_percentage}%</p>
                              <p className="text-xs text-muted-foreground">
                                Précédent: {invoice.previous_progress}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Montant</p>
                              <p className="text-2xl font-bold">
                                {(invoice.invoice_amount ?? 0).toLocaleString('fr-FR')} MRU
                              </p>
                              <p className="text-xs text-muted-foreground">
                                / {(invoice.total_contract_amount ?? 0).toLocaleString('fr-FR')} MRU
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Description des travaux</p>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                              {invoice.work_description}
                            </p>
                          </div>

                          {(invoice.supporting_documents?.length ?? 0) > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Documents justificatifs</p>
                              <div className="space-y-1">
                                {(invoice.supporting_documents ?? []).map((doc, index) => (
                                  <a
                                    key={index}
                                    href={doc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-sm text-primary hover:underline"
                                  >
                                    <FileText className="h-3 w-3 mr-1" />
                                    Document {index + 1}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                           <div>
                            <p className="text-sm font-medium mb-2">Commentaires</p>
                            <Textarea
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              placeholder="Ajoutez vos commentaires sur cette facture..."
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="service-fait" className="flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Document "Service Fait" signé <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="service-fait"
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setServiceFaitFile(file);
                                }
                              }}
                              className="cursor-pointer"
                            />
                            {serviceFaitFile && (
                              <p className="text-sm text-muted-foreground">
                                Fichier sélectionné: {serviceFaitFile.name}
                              </p>
                            )}
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Le document "service fait" signé est obligatoire pour approuver la facture
                              </AlertDescription>
                            </Alert>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="destructive"
                              onClick={() => handleValidate(invoice.id, false)}
                              disabled={actionLoading}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Rejeter
                            </Button>
                            <Button
                              onClick={() => handleValidate(invoice.id, true)}
                              disabled={actionLoading || !serviceFaitFile}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approuver
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
