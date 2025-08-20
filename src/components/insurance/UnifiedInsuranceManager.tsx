import React, { useState, useEffect } from 'react';
import { Plus, Shield, AlertTriangle, Eye, Edit, Trash2, Bell, CheckCircle, FileText, Upload, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  detectExpiringInsurance, 
  sendInsuranceExpiryAlerts, 
  createInsuranceCertificate,
  InsuranceCertificate,
  InsuranceAlert
} from '@/services/insuranceCertificateService';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { supabase } from '@/integrations/supabase/client';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import UserSelector from '@/components/selectors/UserSelector';

const insuranceFormSchema = z.object({
  projectId: z.string().min(1, 'Project ID requis'),
  contractorId: z.string().min(1, 'Contractor ID requis'),
  contractorName: z.string().min(1, 'Nom du contractant requis'),
  insuranceCompany: z.string().min(1, 'Compagnie d\'assurance requise'),
  policyNumber: z.string().min(1, 'Numéro de police requis'),
  coverageAmount: z.number().min(0, 'Montant de couverture requis'),
  coverageType: z.string().min(1, 'Type de couverture requis'),
  validFrom: z.string().min(1, 'Date de début requise'),
  validUntil: z.string().min(1, 'Date d\'expiration requise'),
  notes: z.string().optional()
});

interface LocalInsuranceCertificate {
  id?: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  coverageType: 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques';
  validFrom: string;
  validUntil: string;
  certificateUrl?: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'missing';
  lastVerified?: string;
  verifiedBy?: string;
  notes?: string;
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
  documents?: Array<{
    id: string;
    title: string;
    file_url?: string;
    file_name?: string;
    mime_type?: string;
  }>;
}

const UnifiedInsuranceManager = () => {
  const { toast } = useToast();
  const { uploadFile, downloading, deleteFile } = useDocumentStorage();
  const [alerts, setAlerts] = useState<InsuranceAlert[]>([]);
  const [certificates, setCertificates] = useState<LocalInsuranceCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<LocalInsuranceCertificate | null>(null);
  const [activeTab, setActiveTab] = useState('alerts');
  const [uploadingFile, setUploadingFile] = useState(false);

  const form = useForm<z.infer<typeof insuranceFormSchema>>({
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

  const loadCertificates = async () => {
    setLoading(true);
    try {
      console.log('Loading insurance certificates...');
      
      // Simple query first without JOIN to avoid complex relation issues
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Raw certificates data:', data);

      const transformedCertificates: LocalInsuranceCertificate[] = (data || []).map(cert => ({
        id: cert.id,
        projectId: cert.project_id,
        contractorId: cert.contractor_id,
        contractorName: cert.contractor_name,
        insuranceCompany: cert.insurance_company,
        policyNumber: cert.policy_number,
        coverageAmount: cert.coverage_amount,
        coverageType: cert.coverage_type as 'responsabilite_civile' | 'decennale' | 'vehicules' | 'materiel' | 'tous_risques',
        validFrom: cert.valid_from,
        validUntil: cert.valid_until,
        status: cert.status as 'active' | 'expired' | 'expiring_soon' | 'missing',
        lastVerified: cert.last_verified || undefined,
        verifiedBy: cert.verified_by || undefined,
        notes: cert.notes || undefined,
        certificateUrl: cert.certificate_url || undefined,
        documents: [] // We'll load documents separately if needed
      }));

      console.log('Transformed certificates:', transformedCertificates);
      setCertificates(transformedCertificates);
      
      toast({
        title: 'Succès',
        description: `${transformedCertificates.length} certificat(s) chargé(s)`,
      });
      
    } catch (error: any) {
      console.error('Error loading certificates:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de charger les certificats: ${error?.message || 'Erreur inconnue'}`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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

  const handleFileUpload = async (file: File, certificateId?: string) => {
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploadResult = await uploadFile(file, `insurance-certificates/${Date.now()}-${file.name}`);
      
      if (uploadResult.success && uploadResult.url) {
        // Create document record
        const { data: document, error } = await supabase
          .from('documents')
          .insert({
            title: `Certificat d'assurance - ${file.name}`,
            description: `Document pour certificat d'assurance`,
            file_url: uploadResult.url,
            file_name: file.name,
            mime_type: file.type,
            file_size: file.size,
            document_type: 'contract',
            project_id: form.getValues('projectId'),
            metadata: {
              certificate_id: certificateId || 'new',
              contractor_name: form.getValues('contractorName'),
              policy_number: form.getValues('policyNumber')
            }
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Document téléchargé avec succès"
        });

        return document;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement du fichier",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof insuranceFormSchema>) => {
    try {
      console.log('Creating/updating insurance certificate:', values);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      
      if (isEditing && selectedCertificate) {
        // Update existing certificate in Supabase
        const { error } = await supabase
          .from('insurance_certificates')
          .update({
            project_id: values.projectId,
            contractor_id: values.contractorId,
            contractor_name: values.contractorName,
            insurance_company: values.insuranceCompany,
            policy_number: values.policyNumber,
            coverage_amount: values.coverageAmount,
            coverage_type: values.coverageType,
            valid_from: values.validFrom,
            valid_until: values.validUntil,
            last_verified: new Date().toISOString(),
            verified_by: currentUserId,
            notes: values.notes
          })
          .eq('id', selectedCertificate.id || '');

        if (error) throw error;

        await loadCertificates();
        
        toast({
          title: "Succès",
          description: "Certificat d'assurance mis à jour avec succès"
        });
      } else {
        // Create new certificate in Supabase
        const { data, error } = await supabase
          .from('insurance_certificates')
          .insert({
            project_id: values.projectId,
            contractor_id: values.contractorId,
            contractor_name: values.contractorName,
            insurance_company: values.insuranceCompany,
            policy_number: values.policyNumber,
            coverage_amount: values.coverageAmount,
            coverage_type: values.coverageType,
            valid_from: values.validFrom,
            valid_until: values.validUntil,
            status: 'active',
            last_verified: new Date().toISOString(),
            verified_by: currentUserId,
            notes: values.notes
          })
          .select()
          .single();

        if (error) throw error;

        await loadCertificates();
        
        toast({
          title: "Succès",
          description: "Certificat d'assurance créé avec succès"
        });
      }
      
      setIsDialogOpen(false);
      form.reset();
      setIsEditing(false);
      setSelectedCertificate(null);
      
    } catch (error) {
      console.error('Error creating insurance certificate:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création du certificat",
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
      notes: certificate.notes || ''
    });
    setSelectedCertificate(certificate);
    setIsViewMode(true);
    setIsDialogOpen(true);
  };

  const handleRenewCertificate = (certificate: LocalInsuranceCertificate) => {
    const today = new Date();
    const currentExpiry = new Date(certificate.validUntil || certificate.valid_until || '');
    const newValidFrom = new Date(currentExpiry);
    newValidFrom.setDate(newValidFrom.getDate() + 1);
    const newValidUntil = new Date(newValidFrom);
    newValidUntil.setFullYear(newValidUntil.getFullYear() + 1);

    form.reset({
      projectId: certificate.projectId || certificate.project_id || '',
      contractorId: certificate.contractorId || certificate.contractor_id || '',
      contractorName: certificate.contractorName || certificate.contractor_name || '',
      insuranceCompany: certificate.insuranceCompany || certificate.insurance_company || '',
      policyNumber: `${certificate.policyNumber || certificate.policy_number}-REN${new Date().getFullYear()}`,
      coverageAmount: certificate.coverageAmount || certificate.coverage_amount || 0,
      coverageType: (certificate.coverageType || certificate.coverage_type || 'responsabilite_civile') as any,
      validFrom: newValidFrom.toISOString().split('T')[0],
      validUntil: newValidUntil.toISOString().split('T')[0],
      notes: `Renouvellement du certificat ${certificate.policyNumber || certificate.policy_number}`
    });
    setSelectedCertificate(null);
    setIsEditing(false);
    setIsViewMode(false);
    setIsDialogOpen(true);
  };

  const handleDelete = async (certificateId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce certificat d\'assurance ?')) {
      try {
        const { error } = await supabase
          .from('insurance_certificates')
          .delete()
          .eq('id', certificateId);

        if (error) throw error;

        await loadCertificates();
        toast({
          title: "Succès",
          description: "Certificat d'assurance supprimé avec succès"
        });
      } catch (error) {
        console.error('Error deleting certificate:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression",
          variant: "destructive"
        });
      }
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
                          <FormLabel>Contracteur</FormLabel>
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

                  <div className="space-y-4">
                    <Label>Documents du Certificat</Label>
                    {!isViewMode && (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, selectedCertificate?.id);
                            }
                          }}
                          className="hidden"
                          id="certificate-upload"
                        />
                        <label 
                          htmlFor="certificate-upload" 
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">
                            {uploadingFile ? 'Téléchargement...' : 'Cliquez pour télécharger un document'}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            PDF, Images, Documents acceptés
                          </span>
                        </label>
                      </div>
                    )}
                    
                    {selectedCertificate?.documents && selectedCertificate.documents.length > 0 && (
                      <div className="space-y-2">
                        <Label>Documents attachés:</Label>
                        {selectedCertificate.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{doc.title}</span>
                            </div>
                            <div className="flex gap-2">
                              {doc.file_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(doc.file_url, '_blank')}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              {!isViewMode && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (doc.file_url) {
                                      deleteFile(doc.file_url);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                        <Button size="sm" variant="outline" onClick={() => {
                          const certificate = certificates.find(c => 
                            (c.policyNumber || c.policy_number) === alert.policyNumber
                          );
                          if (certificate) openViewForm(certificate);
                        }}>
                          <FileText className="h-4 w-4 mr-1" />
                          Voir Certificat
                        </Button>
                        <Button size="sm" onClick={() => {
                          const certificate = certificates.find(c => 
                            (c.policyNumber || c.policy_number) === alert.policyNumber
                          );
                          if (certificate) handleRenewCertificate(certificate);
                        }}>
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
                          <Button size="sm" variant="outline" onClick={() => openViewForm(certificate)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditForm(certificate)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRenewCertificate(certificate)}>
                            Renouveler
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(certificate.id!)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                          <Button size="sm" variant="outline" onClick={() => openViewForm(certificate)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleRenewCertificate(certificate)}>
                            Renouveler
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                          <Button size="sm" variant="outline" onClick={() => openViewForm(certificate)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditForm(certificate)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRenewCertificate(certificate)}>
                            Renouveler
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(certificate.id!)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedInsuranceManager;