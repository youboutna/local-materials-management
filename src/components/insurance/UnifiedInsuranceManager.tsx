import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Shield, AlertTriangle, CheckCircle, Calendar, FileText, Plus, Edit, Trash2, Eye, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  detectExpiringInsurance, 
  sendInsuranceExpiryAlerts, 
  createInsuranceCertificate,
  InsuranceAlert,
  InsuranceCertificate 
} from '@/services/insuranceCertificateService';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';

const insuranceFormSchema = z.object({
  projectId: z.string().min(1, 'ID projet requis'),
  contractorId: z.string().min(1, 'ID entrepreneur requis'),
  contractorName: z.string().min(1, 'Nom entrepreneur requis'),
  insuranceCompany: z.string().min(1, 'Compagnie d\'assurance requise'),
  policyNumber: z.string().min(1, 'Numéro de police requis'),
  coverageAmount: z.number().min(1, 'Montant de couverture requis'),
  coverageType: z.enum(['responsabilite_civile', 'decennale', 'vehicules', 'materiel', 'tous_risques']),
  validFrom: z.string().min(1, 'Date de début requise'),
  validUntil: z.string().min(1, 'Date de fin requise'),
  certificateUrl: z.string().optional(),
  notes: z.string().optional()
});

interface LocalInsuranceCertificate extends Omit<InsuranceCertificate, 'status'> {
  id: string;
  project_id?: string;
  contractor_id?: string;
  contractor_name?: string;
  insurance_company?: string;
  policy_number?: string;
  coverage_amount?: number;
  coverage_type?: string;
  valid_from?: string;
  valid_until?: string;
  certificate_url?: string;
  status?: 'active' | 'expired' | 'expiring_soon' | 'missing';
  created_at?: string;
  updated_at?: string;
}

const UnifiedInsuranceManager = () => {
  const [alerts, setAlerts] = useState<InsuranceAlert[]>([]);
  const [certificates, setCertificates] = useState<LocalInsuranceCertificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<LocalInsuranceCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insuranceFormSchema>>({
    resolver: zodResolver(insuranceFormSchema),
    defaultValues: {
      coverageType: 'responsabilite_civile',
      coverageAmount: 0
    }
  });

  const coverageTypes = [
    { value: 'responsabilite_civile', label: 'Responsabilité Civile' },
    { value: 'decennale', label: 'Assurance Décennale' },
    { value: 'vehicules', label: 'Assurance Véhicules' },
    { value: 'materiel', label: 'Assurance Matériel' },
    { value: 'tous_risques', label: 'Tous Risques Chantier' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'expired', label: 'Expirée', color: 'bg-red-100 text-red-800' },
    { value: 'expiring_soon', label: 'Expire bientôt', color: 'bg-orange-100 text-orange-800' },
    { value: 'missing', label: 'Manquante', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    loadInsuranceData();
    loadCertificates();
  }, []);

  const loadInsuranceData = async () => {
    try {
      setLoading(true);
      const expiringAlerts = await detectExpiringInsurance();
      setAlerts(expiringAlerts);
    } catch (error) {
      console.error('Error loading insurance data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données d'assurance",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = () => {
    // Mock data for demonstration - will be replaced with actual database calls
    const mockCertificates: LocalInsuranceCertificate[] = [
      {
        id: 'cert-1',
        projectId: 'proj-axe-idini',
        project_id: 'proj-axe-idini',
        contractorId: 'cont-sahel-btp',
        contractor_id: 'cont-sahel-btp',
        contractorName: 'Sahel BTP',
        contractor_name: 'Sahel BTP',
        insuranceCompany: 'Assurances Générales Mauritaniennes',
        insurance_company: 'Assurances Générales Mauritaniennes',
        policyNumber: 'RC-2024-001',
        policy_number: 'RC-2024-001',
        coverageType: 'responsabilite_civile',
        coverage_type: 'responsabilite_civile',
        coverageAmount: 5000000,
        coverage_amount: 5000000,
        validFrom: '2024-01-01',
        valid_from: '2024-01-01',
        validUntil: '2025-08-25',
        valid_until: '2025-08-25',
        status: 'expiring_soon',
        created_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'cert-2',
        projectId: 'proj-electrification',
        project_id: 'proj-electrification',
        contractorId: 'cont-moderne-sarl',
        contractor_id: 'cont-moderne-sarl',
        contractorName: 'Construction Moderne SARL',
        contractor_name: 'Construction Moderne SARL',
        insuranceCompany: 'SUNU Assurances',
        insurance_company: 'SUNU Assurances',
        policyNumber: 'DEC-2024-015',
        policy_number: 'DEC-2024-015',
        coverageType: 'decennale',
        coverage_type: 'decennale',
        coverageAmount: 10000000,
        coverage_amount: 10000000,
        validFrom: '2024-03-01',
        valid_from: '2024-03-01',
        validUntil: '2025-09-10',
        valid_until: '2025-09-10',
        status: 'active',
        created_at: '2024-03-01T00:00:00.000Z'
      }
    ];
    setCertificates(mockCertificates);
  };

  const handleSendAlerts = async () => {
    try {
      const result = await sendInsuranceExpiryAlerts(alerts);
      toast({
        title: "Alertes envoyées",
        description: `${result.notificationsSent} notifications envoyées avec succès`
      });
    } catch (error) {
      console.error('Error sending alerts:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi des alertes",
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof insuranceFormSchema>) => {
    try {
      if (isEditing && selectedCertificate) {
        // Update existing certificate
        const updatedCertificate: LocalInsuranceCertificate = {
          ...selectedCertificate,
          projectId: values.projectId,
          project_id: values.projectId,
          contractorId: values.contractorId,
          contractor_id: values.contractorId,
          contractorName: values.contractorName,
          contractor_name: values.contractorName,
          insuranceCompany: values.insuranceCompany,
          insurance_company: values.insuranceCompany,
          policyNumber: values.policyNumber,
          policy_number: values.policyNumber,
          coverageAmount: values.coverageAmount,
          coverage_amount: values.coverageAmount,
          coverageType: values.coverageType,
          coverage_type: values.coverageType,
          validFrom: values.validFrom,
          valid_from: values.validFrom,
          validUntil: values.validUntil,
          valid_until: values.validUntil,
          certificateUrl: values.certificateUrl,
          certificate_url: values.certificateUrl,
          notes: values.notes,
          updated_at: new Date().toISOString()
        };
        
        setCertificates(prev => prev.map(c => c.id === selectedCertificate.id ? updatedCertificate : c));
        toast({
          title: "Succès",
          description: "Certificat d'assurance mis à jour avec succès"
        });
      } else {
        // Create new certificate
        await createInsuranceCertificate({
          ...values,
          status: 'active'
        });
        
        const newCertificate: LocalInsuranceCertificate = {
          id: `cert-${Date.now()}`,
          ...values,
          project_id: values.projectId,
          contractor_id: values.contractorId,
          contractor_name: values.contractorName,
          insurance_company: values.insuranceCompany,
          policy_number: values.policyNumber,
          coverage_amount: values.coverageAmount,
          coverage_type: values.coverageType,
          valid_from: values.validFrom,
          valid_until: values.validUntil,
          certificate_url: values.certificateUrl,
          status: 'active',
          created_at: new Date().toISOString()
        };
        
        setCertificates(prev => [...prev, newCertificate]);
        toast({
          title: "Succès",
          description: "Certificat d'assurance créé avec succès"
        });
      }
      
      form.reset();
      setIsDialogOpen(false);
      setIsEditing(false);
      setSelectedCertificate(null);
      loadInsuranceData();
    } catch (error) {
      console.error('Error processing certificate:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement du certificat",
        variant: "destructive"
      });
    }
  };

  const openCreateForm = () => {
    form.reset();
    setIsEditing(false);
    setIsViewMode(false);
    setSelectedCertificate(null);
    setIsDialogOpen(true);
  };

  const openEditForm = (certificate: LocalInsuranceCertificate) => {
    form.reset({
      projectId: certificate.projectId || certificate.project_id || '',
      contractorId: certificate.contractorId || certificate.contractor_id || '',
      contractorName: certificate.contractorName || certificate.contractor_name || '',
      insuranceCompany: certificate.insuranceCompany || certificate.insurance_company || '',
      policyNumber: certificate.policyNumber || certificate.policy_number || '',
      coverageAmount: certificate.coverageAmount || certificate.coverage_amount || 0,
      coverageType: (certificate.coverageType || certificate.coverage_type || 'responsabilite_civile') as any,
      validFrom: certificate.validFrom || certificate.valid_from || '',
      validUntil: certificate.validUntil || certificate.valid_until || '',
      certificateUrl: certificate.certificateUrl || certificate.certificate_url || '',
      notes: certificate.notes || ''
    });
    setSelectedCertificate(certificate);
    setIsEditing(true);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const openViewForm = (certificate: LocalInsuranceCertificate) => {
    form.reset({
      projectId: certificate.projectId || certificate.project_id || '',
      contractorId: certificate.contractorId || certificate.contractor_id || '',
      contractorName: certificate.contractorName || certificate.contractor_name || '',
      insuranceCompany: certificate.insuranceCompany || certificate.insurance_company || '',
      policyNumber: certificate.policyNumber || certificate.policy_number || '',
      coverageAmount: certificate.coverageAmount || certificate.coverage_amount || 0,
      coverageType: (certificate.coverageType || certificate.coverage_type || 'responsabilite_civile') as any,
      validFrom: certificate.validFrom || certificate.valid_from || '',
      validUntil: certificate.validUntil || certificate.valid_until || '',
      certificateUrl: certificate.certificateUrl || certificate.certificate_url || '',
      notes: certificate.notes || ''
    });
    setSelectedCertificate(certificate);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (certificateId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce certificat d\'assurance ?')) {
      setCertificates(prev => prev.filter(c => c.id !== certificateId));
      toast({
        title: "Succès",
        description: "Certificat d'assurance supprimé avec succès"
      });
    }
  };

  const getAlertBadgeVariant = (alertLevel: string) => {
    switch (alertLevel) {
      case 'expired': return 'destructive';
      case 'critical': return 'secondary';
      case 'warning': return 'outline';
      default: return 'outline';
    }
  };

  const getCoverageTypeLabel = (type: string) => {
    return coverageTypes.find(t => t.value === type)?.label || type;
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(option => option.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const isExpiringSoon = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const getActiveCertificates = () => certificates.filter(c => c.status === 'active' || c.status === 'expiring_soon');
  const getExpiredCertificates = () => certificates.filter(c => c.status === 'expired');

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">🛡️ Gestion des Assurances</h2>
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Certificat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isViewMode ? 'Détails du Certificat' : isEditing ? 'Modifier le Certificat' : 'Nouveau Certificat d\'Assurance'}
                </DialogTitle>
                <DialogDescription>
                  {isViewMode ? 'Consulter les détails' : isEditing ? 'Modifier les informations' : 'Ajouter un nouveau certificat d\'assurance'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                          <FormLabel>Entrepreneur</FormLabel>
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
                  
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
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
                              {coverageTypes.map((type) => (
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

                  <div className="grid grid-cols-2 gap-4">
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
                    name="certificateUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL du Certificat (optionnel)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} disabled={isViewMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">
            Alertes ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Actifs ({getActiveCertificates().length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expirés ({getExpiredCertificates().length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Tous ({certificates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune alerte d'expiration d'assurance</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {alerts.map((alert, index) => (
                <Card key={index} className={`${alert.alertLevel === 'expired' ? 'border-red-200' : alert.alertLevel === 'critical' ? 'border-orange-200' : 'border-yellow-200'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          {getCoverageTypeLabel(alert.insuranceType)} - {alert.contractorName}
                        </CardTitle>
                        <CardDescription>
                          Police: {alert.policyNumber}
                        </CardDescription>
                      </div>
                      <Badge variant={getAlertBadgeVariant(alert.alertLevel)}>
                        {alert.alertLevel === 'expired' ? 'Expirée' : 
                         alert.alertLevel === 'critical' ? 'Critique' : 'Attention'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <strong>Expiration:</strong> {new Date(alert.expiryDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Jours restants:</strong> {alert.daysRemaining < 0 ? 'Expirée' : alert.daysRemaining}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          Voir Certificat
                        </Button>
                        <Button size="sm">
                          Renouveler
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificats Actifs</CardTitle>
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
                  {getActiveCertificates().map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell className="font-medium">
                        {certificate.projectId || certificate.project_id}
                      </TableCell>
                      <TableCell>{certificate.contractorName || certificate.contractor_name}</TableCell>
                      <TableCell>
                        {getCoverageTypeLabel(certificate.coverageType || certificate.coverage_type || '')}
                      </TableCell>
                      <TableCell>{certificate.policyNumber || certificate.policy_number}</TableCell>
                      <TableCell>
                        {((certificate.coverageAmount || certificate.coverage_amount || 0)).toLocaleString()} MRU
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {new Date(certificate.validUntil || certificate.valid_until || '').toLocaleDateString('fr-FR')}
                          {isExpiringSoon(certificate.validUntil || certificate.valid_until || '') && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(certificate.status || 'active')}>
                          {statusOptions.find(s => s.value === certificate.status)?.label || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewForm(certificate)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditForm(certificate)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(certificate.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {getActiveCertificates().length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun certificat actif</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Certificats Expirés</CardTitle>
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
                  {getExpiredCertificates().map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell className="font-medium">
                        {certificate.projectId || certificate.project_id}
                      </TableCell>
                      <TableCell>{certificate.contractorName || certificate.contractor_name}</TableCell>
                      <TableCell>
                        {getCoverageTypeLabel(certificate.coverageType || certificate.coverage_type || '')}
                      </TableCell>
                      <TableCell>{certificate.policyNumber || certificate.policy_number}</TableCell>
                      <TableCell>
                        {((certificate.coverageAmount || certificate.coverage_amount || 0)).toLocaleString()} MRU
                      </TableCell>
                      <TableCell className="text-red-600">
                        {new Date(certificate.validUntil || certificate.valid_until || '').toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewForm(certificate)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm">
                            Renouveler
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {getExpiredCertificates().length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun certificat expiré</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tous les Certificats</CardTitle>
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
                  {certificates.map((certificate) => (
                    <TableRow key={certificate.id}>
                      <TableCell className="font-medium">
                        {certificate.projectId || certificate.project_id}
                      </TableCell>
                      <TableCell>{certificate.contractorName || certificate.contractor_name}</TableCell>
                      <TableCell>
                        {getCoverageTypeLabel(certificate.coverageType || certificate.coverage_type || '')}
                      </TableCell>
                      <TableCell>{certificate.policyNumber || certificate.policy_number}</TableCell>
                      <TableCell>
                        {((certificate.coverageAmount || certificate.coverage_amount || 0)).toLocaleString()} MRU
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {new Date(certificate.validUntil || certificate.valid_until || '').toLocaleDateString('fr-FR')}
                          {isExpiringSoon(certificate.validUntil || certificate.valid_until || '') && (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(certificate.status || 'active')}>
                          {statusOptions.find(s => s.value === certificate.status)?.label || 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewForm(certificate)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditForm(certificate)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(certificate.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {certificates.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun certificat d'assurance</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedInsuranceManager;