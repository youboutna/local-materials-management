import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { NotificationService } from '@/services/NotificationService';
import { CheckCircle, XCircle, Eye, FileText, AlertTriangle, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';

interface ProgressInvoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  progress_percentage: number;
  previous_progress: number;
  total_contract_amount: number;
  invoice_amount: number;
  work_description: string;
  status: string;
  submitted_at: string;
  project_id: string;
  inspection_id: string;
  supporting_documents: string[];
  projects?: {
    title: string;
    project_type: string;
    funding_source: string;
  };
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

  // Check consultant permissions
  const isConsultant = hasAnyRole(['admin', 'consultant', 'manager']);
  const canValidateInfrastructure = hasRole('admin') || hasRole('consultant');

  useEffect(() => {
    loadPendingInvoices();

    // Real-time listener for new invoices
    const channel = supabase
      .channel('invoice-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'progress_invoices',
        },
        () => {
          loadPendingInvoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPendingInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('progress_invoices')
        .select('*')
        .in('status', ['supplier_submitted', 'consultant_reviewing'])
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      // Load project details separately
      const invoicesWithProjects = await Promise.all(
        (data || []).map(async (invoice: any) => {
          const { data: project } = await supabase
            .from('projects')
            .select('title, project_type, funding_source')
            .eq('id', invoice.project_id)
            .single();
          
          return {
            ...invoice,
            projects: project
          };
        })
      );
      
      setInvoices(invoicesWithProjects as any);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les factures',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (invoiceId: string, approved: boolean) => {
    // Validation: document "service fait" required for approval
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get employee ID from user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) throw new Error('Employé non trouvé');

      let serviceFaitDocumentId: string | null = null;

      // Upload "service fait" document if approving
      if (approved && serviceFaitFile) {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (!invoice) throw new Error('Facture non trouvée');

        // Upload file to storage
        const fileExt = serviceFaitFile.name.split('.').pop();
        const fileName = `service-fait-${invoiceId}-${Date.now()}.${fileExt}`;
        const filePath = `progress-invoices/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, serviceFaitFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        // Create document record
        const { data: documentData, error: docError } = await supabase
          .from('documents')
          .insert([{
            title: `Service Fait - ${invoice.invoice_number}`,
            description: 'Document service fait signé par le consultant',
            document_type: 'administrative' as any,
            file_url: publicUrl,
            file_name: serviceFaitFile.name,
            file_size: serviceFaitFile.size,
            mime_type: serviceFaitFile.type,
            project_id: invoice.project_id,
            uploaded_by: user.id,
            metadata: {
              invoice_id: invoiceId,
              invoice_number: invoice.invoice_number,
              document_category: 'service_fait',
            },
          }] as any)
          .select()
          .single();

        if (docError) throw docError;
        serviceFaitDocumentId = documentData.id;
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
        await NotificationService.createNotification({
          recipient_id: invoice.id, // Should be supplier user ID
          title: approved ? 'Facture approuvée par le consultant' : 'Facture rejetée par le consultant',
          message: `Facture ${invoice.invoice_number}: ${approved ? 'Approuvée' : 'Rejetée'} par l'ingénieur conseil`,
          type: 'progress_invoice_validation',
          metadata: {
            invoice_id: invoiceId,
            approved,
            comments,
          },
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
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.projects?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.projects?.project_type}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{invoice.invoice_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.progress_percentage}%</p>
                      <p className="text-xs text-muted-foreground">
                        +{(invoice.progress_percentage - invoice.previous_progress).toFixed(2)}%
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.invoice_amount.toLocaleString('fr-FR')} MRU
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.submitted_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    {invoice.projects?.project_type === 'infrastructure' && !canValidateInfrastructure ? (
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
                              Type de projet: <strong>{invoice.projects?.project_type}</strong>
                              {invoice.projects?.funding_source && (
                                <> • Financement: {invoice.projects.funding_source}</>
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
                                {invoice.invoice_amount.toLocaleString('fr-FR')} MRU
                              </p>
                              <p className="text-xs text-muted-foreground">
                                / {invoice.total_contract_amount.toLocaleString('fr-FR')} MRU
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Description des travaux</p>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                              {invoice.work_description}
                            </p>
                          </div>

                          {invoice.supporting_documents?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Documents justificatifs</p>
                              <div className="space-y-1">
                                {invoice.supporting_documents.map((doc, index) => (
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
