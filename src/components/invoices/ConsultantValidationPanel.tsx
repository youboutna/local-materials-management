import { getNotificationService } from '@/application/services/NotificationService';
import { getStorageService } from '@/application/services/StorageService';
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
import { useConsultantInvoiceValidationHex } from '@/hooks/hexagonal/useConsultantInvoiceValidationHex';
import { AlertTriangle, CheckCircle, Eye, FileText, Upload, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { T } from '@/components/i18n/T';

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
  const { invoices, loading, loadPendingInvoices, validateInvoice } = useConsultantInvoiceValidationHex();
  const [selectedInvoice, setSelectedInvoice] = useState<ProgressInvoice | null>(null);
  const [comments, setComments] = useState('');
  const [serviceFaitFile, setServiceFaitFile] = useState<File | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const { hasAnyRole, hasRole } = useCurrentUserRoles();
  
  // Initialize services
  const storageService = getStorageService();

  // Check consultant permissions
  const isConsultant = hasAnyRole(['admin', 'consultant', 'manager']);
  const canValidateInfrastructure = hasRole('admin') || hasRole('consultant');

  useEffect(() => {
    loadPendingInvoices();
  }, []);

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
      let serviceFaitDocumentId: string | null = null;

      if (approved && serviceFaitFile) {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (!invoice) throw new Error('Facture non trouvée');

        const fileExt = serviceFaitFile.name.split('.').pop();
        const fileName = `service-fait-${invoiceId}-${Date.now()}.${fileExt}`;
        const filePath = `progress-invoices/${fileName}`;

        await storageService.uploadFile({
          bucket: 'documents',
          path: filePath,
          file: serviceFaitFile
        });

        serviceFaitDocumentId = `doc-${Date.now()}`;
      }

      const { employee } = await validateInvoice({
        invoiceId,
        approved,
        comments,
        serviceFaitDocumentId,
      });

      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        const notificationService = getNotificationService();
        await notificationService.createNotification({
          recipientId: invoice.id, // Should be supplier user ID
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
      supplier_submitted: { color: 'bg-warning/10 text-warning', label: 'Soumis' },
      consultant_reviewing: { color: 'bg-primary/10 text-primary', label: 'En cours' },
      consultant_approved: { color: 'bg-success-soft text-success', label: 'Approuvé' },
      consultant_rejected: { color: 'bg-destructive/10 text-destructive', label: 'Rejeté' },
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
            <p><T k="auto.consultantvalidationpanel.aucune_facture_en_attente_de_validation" fallback="Aucune facture en attente de validation" /></p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><T k="auto.consultantvalidationpanel.numero" fallback="Numéro" /></TableHead>
                <TableHead><T k="auto.consultantvalidationpanel.projet" fallback="Projet" /></TableHead>
                <TableHead><T k="auto.consultantvalidationpanel.type" fallback="Type" /></TableHead>
                <TableHead><T k="auto.consultantvalidationpanel.avancement" fallback="Avancement" /></TableHead>
                <TableHead><T k="auto.consultantvalidationpanel.montant" fallback="Montant" /></TableHead>
                <TableHead><T k="auto.consultantvalidationpanel.date" fallback="Date" /></TableHead>
                <TableHead><T k="auto.consultantvalidationpanel.statut" fallback="Statut" /></TableHead>
                <TableHead><T k="auto.consultantvalidationpanel.actions" fallback="Actions" /></TableHead>
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
                        <T k="auto.consultantvalidationpanel.acces_limite" fallback="Accès limité" />
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
                            <T k="auto.consultantvalidationpanel.valider" fallback="Valider" />
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
                              <T k="auto.consultantvalidationpanel.type_de_projet" fallback="Type de projet:" /> <strong>{invoice.projects?.projectType}</strong>
                              {invoice.projects?.fundingSource && (
                                <> • Financement: {invoice.projects.fundingSource}</>
                              )}
                            </AlertDescription>
                          </Alert>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium"><T k="auto.consultantvalidationpanel.avancement" fallback="Avancement" /></p>
                              <p className="text-2xl font-bold">{invoice.progress_percentage}%</p>
                              <p className="text-xs text-muted-foreground">
                                Précédent: {invoice.previous_progress}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium"><T k="auto.consultantvalidationpanel.montant" fallback="Montant" /></p>
                              <p className="text-2xl font-bold">
                                {(invoice.invoice_amount ?? 0).toLocaleString('fr-FR')} MRU
                              </p>
                              <p className="text-xs text-muted-foreground">
                                / {(invoice.total_contract_amount ?? 0).toLocaleString('fr-FR')} MRU
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2"><T k="auto.consultantvalidationpanel.description_des_travaux" fallback="Description des travaux" /></p>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                              {invoice.work_description}
                            </p>
                          </div>

                          {(invoice.supporting_documents?.length ?? 0) > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2"><T k="auto.consultantvalidationpanel.documents_justificatifs" fallback="Documents justificatifs" /></p>
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
                            <p className="text-sm font-medium mb-2"><T k="auto.consultantvalidationpanel.commentaires" fallback="Commentaires" /></p>
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
                              <T k="auto.consultantvalidationpanel.rejeter" fallback="Rejeter" />
                            </Button>
                            <Button
                              onClick={() => handleValidate(invoice.id, true)}
                              disabled={actionLoading || !serviceFaitFile}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              <T k="auto.consultantvalidationpanel.approuver" fallback="Approuver" />
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
