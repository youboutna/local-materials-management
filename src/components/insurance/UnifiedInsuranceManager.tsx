// ============================================================
// src/components/insurance/UnifiedInsuranceManager.tsx
// ============================================================
/**
 * Unified Insurance Manager
 * Gestion unifiée des assurances avec architecture hexagonale
 * - Utilise InsuranceService pour les opérations
 * - Utilise DocumentService pour les documents
 * - Utilise EnhancedActionService pour les actions
 */

import { createInsuranceAction } from '@/application/services/enhancedActionService';
import { getInsuranceService, InsuranceService } from '@/application/services/InsuranceService';
import { getDocumentService } from '@/application/services/DocumentService';
import { ActionsDropdown } from '@/components/actions/ActionsDropdown';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { CreateEnhancedActionRequestDTO } from '@/dtos/entities/ActionDTO';
import { InsuranceCertificateDTO, InsuranceCertificateStatus, InsuranceAlertDTO } from '@/dtos/entities/InsuranceDTO';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { useAuth } from '@/hooks/hexagonal';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { usePagination } from '@/hooks/usePagination';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { checkAndSendInsuranceAlerts } from '@/utils/insuranceAlertUtils';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Bell, Calendar, CheckCircle, Download, Edit, Eye, FileText, Mail, MessageSquare, Phone, Plus, Settings, Shield, Trash2, Upload, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// ============================================================
// Validation Schema
// ============================================================
const insuranceFormSchema = z.object({
  projectId: z.string().min(1, 'Projet requis'),
  contractorId: z.string().optional(),
  contractorName: z.string().min(1, 'Nom du contractant requis'),
  insuranceCompany: z.string().min(1, 'Compagnie d\'assurance requise'),
  policyNumber: z.string().min(1, 'Numéro de police requis'),
  coverageAmount: z.number().min(0, 'Montant de couverture requis'),
  coverageType: z.string().min(1, 'Type de couverture requis'),
  validFrom: z.string().min(1, 'Date de début requise'),
  validUntil: z.string().min(1, 'Date d\'expiration requise'),
  notes: z.string().optional()
});

type InsuranceFormValues = z.infer<typeof insuranceFormSchema>;

// ============================================================
// Types
// ============================================================
interface InsuranceStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  missing: number;
  coverageTotal: number;
}

// ============================================================
// Coverage Types Configuration
// ============================================================
const COVERAGE_TYPES = [
  { value: 'responsabilite_civile', label: 'Responsabilité Civile' },
  { value: 'decennale', label: 'Assurance Décennale' },
  { value: 'vehicules', label: 'Assurance Véhicules' },
  { value: 'materiel', label: 'Assurance Matériel' },
  { value: 'tous_risques', label: 'Tous Risques Chantier' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'expired', label: 'Expirée', color: 'bg-red-100 text-red-800' },
  { value: 'expiring_soon', label: 'Expire bientôt', color: 'bg-orange-100 text-orange-800' },
  { value: 'missing', label: 'Manquante', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' }
];

// ============================================================
// Main Component
// ============================================================
const UnifiedInsuranceManager = () => {
  const { toast } = useToast();
  const { uploadFile, downloading, deleteFile } = useDocumentStorage();
  const { getUser } = useAuth();
  
  // Services
  const insuranceService = useMemo(() => getInsuranceService(), []);
  const documentService = useMemo(() => getDocumentService(), []);
  
  // State
  const [alerts, setAlerts] = useState<InsuranceAlertDTO[]>([]);
  const [certificates, setCertificates] = useState<InsuranceCertificateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<InsuranceCertificateDTO | null>(null);
  const [activeTab, setActiveTab] = useState('alerts');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Pagination
  const {
    currentData: paginatedAlerts,
    currentPage: alertsPage,
    totalPages: alertsTotalPages,
    totalItems: alertsTotalItems,
    itemsPerPage: alertsItemsPerPage,
    goToPage: goToAlertsPage
  } = usePagination({
    data: alerts,
    itemsPerPage: 10
  });

  const {
    currentData: paginatedCertificates,
    currentPage: certificatesPage,
    totalPages: certificatesTotalPages,
    totalItems: certificatesTotalItems,
    itemsPerPage: certificatesItemsPerPage,
    goToPage: goToCertificatesPage
  } = usePagination({
    data: certificates,
    itemsPerPage: 10
  });

  // Form
  const form = useForm<InsuranceFormValues>({
    resolver: zodResolver(insuranceFormSchema),
    defaultValues: {
      projectId: '',
      contractorId: '',
      contractorName: '',
      insuranceCompany: '',
      policyNumber: '',
      coverageAmount: 0,
      coverageType: 'responsabilite_civile',
      validFrom: '',
      validUntil: '',
      notes: ''
    }
  });

  // ============================================================
  // Statistics
  // ============================================================
  const stats = useMemo((): InsuranceStats => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const active = certificates.filter(c => 
      c.status === InsuranceCertificateStatus.ACTIVE
    );
    const expiring = certificates.filter(c => 
      c.status === InsuranceCertificateStatus.ACTIVE &&
      c.validUntil &&
      new Date(c.validUntil) <= thirtyDaysFromNow &&
      new Date(c.validUntil) >= now
    );
    const expired = certificates.filter(c => 
      c.status === InsuranceCertificateStatus.EXPIRED ||
      (c.validUntil && new Date(c.validUntil) < now)
    );
    const missing = certificates.filter(c => 
      c.status === InsuranceCertificateStatus.MISSING
    );
    const coverageTotal = certificates.reduce((sum, c) => sum + (c.coverageAmount || 0), 0);

    return {
      total: certificates.length,
      active: active.length,
      expiring: expiring.length,
      expired: expired.length,
      missing: missing.length,
      coverageTotal
    };
  }, [certificates]);

  // ============================================================
  // Data Loading
  // ============================================================
  const loadInsuranceData = useCallback(async () => {
    setLoading(true);
    try {
      // Charger les alertes
      const expiringAlerts = await insuranceService.detectExpiringInsurance?.() || [];
      setAlerts(expiringAlerts);

      // Charger les certificats
      const certs = await insuranceService.getInsuranceCertificates();
      setCertificates(certs);

      toast({
        title: 'Succès',
        description: `${certs.length} certificat(s) chargé(s)`,
      });
    } catch (error) {
      console.error('Error loading insurance data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données d\'assurance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [insuranceService, toast]);

  useEffect(() => {
    loadInsuranceData();
  }, [loadInsuranceData]);

  // ============================================================
  // Handlers
  // ============================================================
  const handleSendAlerts = async () => {
    setLoading(true);
    try {
      await checkAndSendInsuranceAlerts();
      await loadInsuranceData();
      toast({
        title: 'Succès',
        description: 'Alertes envoyées avec succès',
      });
    } catch (error) {
      console.error('Error sending alerts:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi des alertes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, certificateId?: string) => {
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploadResult = await uploadFile(file, `insurance-certificates/${Date.now()}-${file.name}`);
      
      if (uploadResult.success && uploadResult.url) {
        const documentData = {
          title: `Certificat d'assurance - ${file.name}`,
          projectId: form.getValues('projectId'),
          description: `Document pour certificat d'assurance`,
          fileUrl: uploadResult.url,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          documentType: 'certificate'
        };

        await documentService.createDocument(documentData as any);

        toast({
          title: 'Succès',
          description: 'Document téléchargé avec succès'
        });

        await loadInsuranceData();
        return uploadResult;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du téléchargement du fichier',
        variant: 'destructive'
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmit = async (values: InsuranceFormValues) => {
    try {
      const user = await getUser();
      const currentUserId = user?.id;

      const certificateData: Partial<InsuranceCertificateDTO> = {
        projectId: values.projectId,
        contractorId: values.contractorId,
        contractorName: values.contractorName,
        insuranceCompany: values.insuranceCompany,
        policyNumber: values.policyNumber,
        coverageAmount: values.coverageAmount,
        coverageType: values.coverageType,
        validFrom: values.validFrom,
        validUntil: values.validUntil,
        status: InsuranceCertificateStatus.ACTIVE,
        lastVerified: new Date().toISOString(),
        verifiedBy: currentUserId,
        notes: values.notes
      };

      if (isEditing && selectedCertificate) {
        await insuranceService.updateInsuranceCertificate(selectedCertificate.id!, certificateData);
        toast({ title: 'Succès', description: 'Certificat mis à jour' });
      } else {
        await insuranceService.createInsuranceCertificate(certificateData as any);
        toast({ title: 'Succès', description: 'Certificat créé' });
      }

      setIsDialogOpen(false);
      form.reset();
      setIsEditing(false);
      setSelectedCertificate(null);
      await loadInsuranceData();
    } catch (error) {
      console.error('Error saving insurance certificate:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (certificateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce certificat ?')) return;

    try {
      await insuranceService.deleteInsuranceCertificate(certificateId);
      toast({ title: 'Succès', description: 'Certificat supprimé' });
      await loadInsuranceData();
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression',
        variant: 'destructive'
      });
    }
  };

  const handleRenewCertificate = (certificate: InsuranceCertificateDTO) => {
    const today = new Date();
    const currentExpiry = new Date(certificate.validUntil || '');
    const newValidFrom = new Date(currentExpiry);
    newValidFrom.setDate(newValidFrom.getDate() + 1);
    const newValidUntil = new Date(newValidFrom);
    newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);

    form.reset({
      projectId: certificate.projectId || '',
      contractorId: certificate.contractorId || '',
      contractorName: certificate.contractorName || '',
      insuranceCompany: certificate.insuranceCompany || '',
      policyNumber: `${certificate.policyNumber}-REN${new Date().getFullYear()}`,
      coverageAmount: certificate.coverageAmount || 0,
      coverageType: certificate.coverageType || 'responsabilite_civile',
      validFrom: newValidFrom.toISOString().split('T')[0],
      validUntil: newValidUntil.toISOString().split('T')[0],
      notes: `Renouvellement du certificat ${certificate.policyNumber}`
    });
    setSelectedCertificate(null);
    setIsEditing(false);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleInsuranceAction = async (certificateId: string, actionType: string) => {
    try {
      const certificate = certificates.find(c => c.id === certificateId);
      if (!certificate) {
        toast({ title: 'Erreur', description: 'Certificat introuvable', variant: 'destructive' });
        return;
      }

      const user = await getUser();
      const currentUserId = user?.id || 'system-user';

      const actionTitles: Record<string, string> = {
        task_assignment: 'Renouvellement assurance',
        hierarchy_notification: 'Alerte assurance',
        sms: 'SMS assurance',
        call: 'Appel assurance',
        email: 'Email assurance',
        mail: 'Courrier assurance'
      };

      const actionMessages: Record<string, string> = {
        task_assignment: `Veuillez traiter le renouvellement de l'assurance ${certificate.policyNumber}`,
        hierarchy_notification: `L'assurance ${certificate.policyNumber} nécessite une attention particulière`,
        sms: `SMS: Assurance ${certificate.policyNumber} - Action requise`,
        call: `Appel concernant l'assurance ${certificate.policyNumber}`,
        email: `Email concernant l'assurance ${certificate.policyNumber}`,
        mail: `Courrier concernant l'assurance ${certificate.policyNumber}`
      };

      await createInsuranceAction({
        insuranceId: certificateId,
        projectId: certificate.projectId || '',
        contractorId: certificate.contractorId || '',
        actionType: actionType as CreateEnhancedActionRequestDTO['actionType'],
        title: actionTitles[actionType] || 'Action assurance',
        message: actionMessages[actionType] || 'Action requise',
        priority: 'high',
        assigneeId: currentUserId,
        recipientIds: [currentUserId],
        metadata: { certificateData: certificate }
      });

      toast({ title: 'Action créée', description: `${actionTitles[actionType]} créée avec succès` });
    } catch (error) {
      console.error('Error creating insurance action:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de créer l'action: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: 'destructive'
      });
    }
  };

  // ============================================================
  // UI Helpers
  // ============================================================
  const getCoverageTypeLabel = (type: string) => {
    return COVERAGE_TYPES.find(t => t.value === type)?.label || type;
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  };

  const getAlertBadgeVariant = (alertLevel: string) => {
    switch (alertLevel) {
      case 'expired': return 'destructive';
      case 'critical': return 'secondary';
      case 'warning': return 'outline';
      default: return 'outline';
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  // ============================================================
  // Render
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Chargement des données d'assurance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gestion des Assurances
          </h2>
          <p className="text-muted-foreground">
            Surveillance automatique des expirations et gestion unifiée des certificats
          </p>
        </div>
        <div className="flex gap-2">
          {alerts.length > 0 && (
            <Button onClick={handleSendAlerts} variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Envoyer Alertes ({alerts.length})
            </Button>
          )}
          <Button onClick={() => {
            form.reset();
            setIsEditing(false);
            setIsViewMode(false);
            setSelectedCertificate(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Certificat
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-sm text-muted-foreground">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-500">{stats.expiring}</div>
            <p className="text-sm text-muted-foreground">Expire bientôt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-sm text-muted-foreground">Expirés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{stats.missing}</div>
            <p className="text-sm text-muted-foreground">Manquants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.coverageTotal.toLocaleString()} MRU
            </div>
            <p className="text-sm text-muted-foreground">Couverture totale</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">Alertes ({alerts.length})</TabsTrigger>
          <TabsTrigger value="active">Actifs ({stats.active})</TabsTrigger>
          <TabsTrigger value="expired">Expirés ({stats.expired})</TabsTrigger>
          <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune alerte d'expiration</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {paginatedAlerts.map((alert, index) => (
                <Card key={index} className={`
                  ${alert.alertLevel === 'expired' ? 'border-red-200' : 
                    alert.alertLevel === 'critical' ? 'border-orange-200' : 
                    'border-yellow-200'}
                `}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          {getCoverageTypeLabel(alert.insuranceType || '')} - {alert.contractorName || ''}
                        </CardTitle>
                        <CardDescription>
                          Police: {alert.policyNumber}
                        </CardDescription>
                      </div>
                      <Badge variant={getAlertBadgeVariant(alert.alertLevel || 'warning')}>
                        {alert.alertLevel === 'expired' ? 'Expirée' : 
                         alert.alertLevel === 'critical' ? 'Critique' : 'Attention'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          <strong>Expiration:</strong> {alert.expiryDate ? new Date(alert.expiryDate).toLocaleDateString('fr-FR') : 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Jours restants:</strong> {(alert.daysRemaining ?? 0) < 0 ? 'Expirée' : alert.daysRemaining ?? 'N/A'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          const cert = certificates.find(c => c.policyNumber === alert.policyNumber);
                          if (cert) {
                            setSelectedCertificate(cert);
                            setIsViewMode(true);
                            setIsDialogOpen(true);
                          }
                        }}>
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button size="sm" onClick={() => {
                          const cert = certificates.find(c => c.policyNumber === alert.policyNumber);
                          if (cert) handleRenewCertificate(cert);
                        }}>
                          Renouveler
                        </Button>
                        <ActionsDropdown
                          entityType="insurance"
                          entityId={alert.id || ''}
                          projectId={alert.projectId}
                          contractorId={alert.contractorId}
                          onActionComplete={loadInsuranceData}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {alerts.length > 10 && (
                <PaginationControls
                  currentPage={alertsPage}
                  totalPages={alertsTotalPages}
                  totalItems={alertsTotalItems}
                  itemsPerPage={alertsItemsPerPage}
                  onPageChange={goToAlertsPage}
                  showItemsPerPage={false}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Active Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Certificats Actifs ({stats.active})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet</TableHead>
                    <TableHead>Contractant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Police</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.filter(c => c.status === InsuranceCertificateStatus.ACTIVE).slice(0, 10).map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.projectId}</TableCell>
                      <TableCell>{cert.contractorName}</TableCell>
                      <TableCell>{getCoverageTypeLabel(cert.coverageType || '')}</TableCell>
                      <TableCell>{cert.policyNumber}</TableCell>
                      <TableCell>{(cert.coverageAmount || 0).toLocaleString()} MRU</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {cert.validUntil && new Date(cert.validUntil).toLocaleDateString('fr-FR')}
                          {isExpiringSoon(cert.validUntil || '') && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedCertificate(cert);
                            setIsViewMode(true);
                            setIsDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedCertificate(cert);
                            setIsEditing(true);
                            setIsViewMode(false);
                            form.reset({
                              projectId: cert.projectId || '',
                              contractorId: cert.contractorId || '',
                              contractorName: cert.contractorName || '',
                              insuranceCompany: cert.insuranceCompany || '',
                              policyNumber: cert.policyNumber || '',
                              coverageAmount: cert.coverageAmount || 0,
                              coverageType: cert.coverageType || 'responsabilite_civile',
                              validFrom: cert.validFrom || '',
                              validUntil: cert.validUntil || '',
                              notes: cert.notes || ''
                            });
                            setIsDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRenewCertificate(cert)}>
                            Renouveler
                          </Button>
                          <ActionsDropdown
                            entityType="insurance"
                            entityId={cert.id!}
                            projectId={cert.projectId}
                            contractorId={cert.contractorId}
                            onActionComplete={loadInsuranceData}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expired Tab */}
        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Certificats Expirés ({stats.expired})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet</TableHead>
                    <TableHead>Contractant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Police</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.filter(c => c.status === InsuranceCertificateStatus.EXPIRED).slice(0, 10).map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.projectId}</TableCell>
                      <TableCell>{cert.contractorName}</TableCell>
                      <TableCell>{getCoverageTypeLabel(cert.coverageType || '')}</TableCell>
                      <TableCell>{cert.policyNumber}</TableCell>
                      <TableCell>{(cert.coverageAmount || 0).toLocaleString()} MRU</TableCell>
                      <TableCell className="text-red-600">
                        {cert.validUntil && new Date(cert.validUntil).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedCertificate(cert);
                            setIsViewMode(true);
                            setIsDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleRenewCertificate(cert)}>
                            Renouveler
                          </Button>
                          <ActionsDropdown
                            entityType="insurance"
                            entityId={cert.id!}
                            projectId={cert.projectId}
                            contractorId={cert.contractorId}
                            onActionComplete={loadInsuranceData}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Tous les Certificats ({stats.total})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet</TableHead>
                    <TableHead>Contractant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Police</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.projectId}</TableCell>
                      <TableCell>{cert.contractorName}</TableCell>
                      <TableCell>{getCoverageTypeLabel(cert.coverageType || '')}</TableCell>
                      <TableCell>{cert.policyNumber}</TableCell>
                      <TableCell>{(cert.coverageAmount || 0).toLocaleString()} MRU</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {cert.validUntil && new Date(cert.validUntil).toLocaleDateString('fr-FR')}
                          {isExpiringSoon(cert.validUntil || '') && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(cert.status || '')}>
                          {getStatusLabel(cert.status || '')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedCertificate(cert);
                            setIsViewMode(true);
                            setIsDialogOpen(true);
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedCertificate(cert);
                            setIsEditing(true);
                            setIsViewMode(false);
                            form.reset({
                              projectId: cert.projectId || '',
                              contractorId: cert.contractorId || '',
                              contractorName: cert.contractorName || '',
                              insuranceCompany: cert.insuranceCompany || '',
                              policyNumber: cert.policyNumber || '',
                              coverageAmount: cert.coverageAmount || 0,
                              coverageType: cert.coverageType || 'responsabilite_civile',
                              validFrom: cert.validFrom || '',
                              validUntil: cert.validUntil || '',
                              notes: cert.notes || ''
                            });
                            setIsDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRenewCertificate(cert)}>
                            Renouveler
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(cert.id!)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ActionsDropdown
                            entityType="insurance"
                            entityId={cert.id!}
                            projectId={cert.projectId}
                            contractorId={cert.contractorId}
                            onActionComplete={loadInsuranceData}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {certificates.length > 10 && (
                <PaginationControls
                  currentPage={certificatesPage}
                  totalPages={certificatesTotalPages}
                  totalItems={certificatesTotalItems}
                  itemsPerPage={certificatesItemsPerPage}
                  onPageChange={goToCertificatesPage}
                  showItemsPerPage={false}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Create/Edit/View */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isViewMode ? 'Détails du Certificat' : 
               isEditing ? 'Modifier le Certificat' : 
               'Nouveau Certificat d\'Assurance'}
            </DialogTitle>
            <DialogDescription>
              {isViewMode ? 'Consulter les détails du certificat' : 
               isEditing ? 'Modifier les informations du certificat' : 
               'Ajouter un nouveau certificat d\'assurance'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projet</FormLabel>
                      <FormControl>
                        <ProjectSelector
                          value={field.value}
                          onChange={field.onChange}
                          label=""
                          required
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contractant</FormLabel>
                      <FormControl>
                        <SupplierSelector
                          value={{
                            id: form.watch('contractorId') || '',
                            name: field.value || '',
                            contact: '',
                            leadTime: 0
                          }}
                          onChange={(supplier) => {
                            form.setValue('contractorId', supplier.id || '');
                            field.onChange(supplier.name || '');
                          }}
                          allowCustom={true}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="insuranceCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compagnie d'Assurance</FormLabel>
                      <FormControl>
                        <Input placeholder="Assurances Générales..." {...field} disabled={isViewMode} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="policyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de Police</FormLabel>
                      <FormControl>
                        <Input placeholder="POL-789..." {...field} disabled={isViewMode} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="coverageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de Couverture</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isViewMode}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COVERAGE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="coverageAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant Couverture (MRU)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1000000" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={isViewMode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de Début</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isViewMode} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'Expiration</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isViewMode} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notes additionnelles..." {...field} disabled={isViewMode} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isViewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Mettre à jour' : 'Créer Certificat'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedInsuranceManager;