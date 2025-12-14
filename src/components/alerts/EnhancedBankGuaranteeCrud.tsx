import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, Eye, Edit, Trash2, AlertTriangle, FileText, Upload, ExternalLink, Download } from 'lucide-react';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import DocumentSelector from '@/components/selectors/DocumentSelector';
import DocumentUpload from '@/components/documents/DocumentUpload';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import UserSelector from '@/components/selectors/UserSelector';
import DocumentViewer from '@/components/documents/DocumentViewer';
import DocumentSection from '@/components/common/DocumentSection';
import { format } from 'date-fns';

interface BankGuarantee {
  id: string;
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  bank_name: string;
  guarantee_amount: number;
  guarantee_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  supporting_documents?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface BankGuaranteeFormData {
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  bank_name: string;
  guarantee_amount: number;
  guarantee_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  supporting_documents: string[];
  notes: string;
}

const EnhancedBankGuaranteeCrud = () => {
  const [guarantees, setGuarantees] = useState<BankGuarantee[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] = useState<BankGuarantee | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  const [formData, setFormData] = useState<BankGuaranteeFormData>({
    project_id: '',
    contractor_id: '',
    contractor_name: '',
    bank_name: '',
    guarantee_amount: 0,
    guarantee_type: '',
    issue_date: '',
    expiry_date: '',
    status: 'active',
    supporting_documents: [],
    notes: ''
  });
  
  const { t } = useLanguage();

  const guaranteeTypes = [
    { value: 'performance', label: 'Garantie de Bonne Exécution' },
    { value: 'advance', label: 'Garantie d\'Avance' },
    { value: 'retention', label: 'Garantie de Retenue' },
    { value: 'maintenance', label: 'Garantie de Maintenance' },
    { value: 'bid', label: 'Garantie de Soumission' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'expired', label: 'Expirée', color: 'bg-red-100 text-red-800' },
    { value: 'claimed', label: 'Réclamée', color: 'bg-orange-100 text-orange-800' },
    { value: 'released', label: 'Libérée', color: 'bg-blue-100 text-blue-800' },
    { value: 'suspended', label: 'Suspendue', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    loadGuarantees();
  }, []);

  const loadGuarantees = async () => {
    try {
      console.log('Loading bank guarantees...');
      
      const { data, error } = await supabase
        .from('bank_guarantees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Raw guarantees data:', data);
      
      const transformedGuarantees: BankGuarantee[] = (data || []).map(guarantee => ({
        ...guarantee,
        contractor_name: (guarantee as any).contractor_name || 'N/A'
      }));
      
      console.log('Transformed guarantees:', transformedGuarantees);
      setGuarantees(transformedGuarantees);
      
      toast({
        title: t('common.success'),
        description: `${transformedGuarantees.length} garantie(s) chargée(s)`,
      });
      
    } catch (error: any) {
      console.error('Error loading bank guarantees:', error);
      toast({
        title: t('common.error'),
        description: `Impossible de charger les garanties bancaires: ${error?.message || 'Erreur inconnue'}`,
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      contractor_id: '',
      contractor_name: '',
      bank_name: '',
      guarantee_amount: 0,
      guarantee_type: '',
      issue_date: '',
      expiry_date: '',
      status: 'active',
      supporting_documents: [],
      notes: ''
    });
    setUploadedDocuments([]);
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (guarantee: BankGuarantee) => {
    setFormData({
      project_id: guarantee.project_id,
      contractor_id: guarantee.contractor_id,
      contractor_name: guarantee.contractor_name,
      bank_name: guarantee.bank_name,
      guarantee_amount: guarantee.guarantee_amount,
      guarantee_type: guarantee.guarantee_type,
      issue_date: guarantee.issue_date,
      expiry_date: guarantee.expiry_date,
      status: guarantee.status,
      supporting_documents: guarantee.supporting_documents || [],
      notes: guarantee.notes || ''
    });
    setSelectedGuarantee(guarantee);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (guarantee: BankGuarantee) => {
    setFormData({
      project_id: guarantee.project_id,
      contractor_id: guarantee.contractor_id,
      contractor_name: guarantee.contractor_name,
      bank_name: guarantee.bank_name,
      guarantee_amount: guarantee.guarantee_amount,
      guarantee_type: guarantee.guarantee_type,
      issue_date: guarantee.issue_date,
      expiry_date: guarantee.expiry_date,
      status: guarantee.status,
      supporting_documents: guarantee.supporting_documents || [],
      notes: guarantee.notes || ''
    });
    setSelectedGuarantee(guarantee);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.contractor_name || !formData.bank_name || !formData.guarantee_amount) {
      toast({
        title: t('common.error'),
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedGuarantee) {
        // Update in Supabase
        const { error } = await supabase
          .from('bank_guarantees')
          .update({
            project_id: formData.project_id,
            contractor_id: formData.contractor_id,
            bank_name: formData.bank_name,
            guarantee_amount: formData.guarantee_amount,
            guarantee_type: formData.guarantee_type,
            issue_date: formData.issue_date,
            expiry_date: formData.expiry_date,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedGuarantee.id);

        if (error) throw error;

        await loadGuarantees();
        toast({
          title: t('common.success'),
          description: "Garantie bancaire mise à jour avec succès",
        });
      } else {
        // Insert in Supabase
        const { error } = await supabase
          .from('bank_guarantees')
          .insert({
            project_id: formData.project_id,
            contractor_id: formData.contractor_id,
            bank_name: formData.bank_name,
            guarantee_amount: formData.guarantee_amount,
            guarantee_type: formData.guarantee_type,
            issue_date: formData.issue_date,
            expiry_date: formData.expiry_date,
            status: formData.status
          });

        if (error) throw error;

        await loadGuarantees();
        toast({
          title: t('common.success'),
          description: "Garantie bancaire créée avec succès",
        });
      }
      
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving guarantee:', error);
      toast({
        title: t('common.error'),
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (guaranteeId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette garantie bancaire ?')) {
      try {
        const { error } = await supabase
          .from('bank_guarantees')
          .delete()
          .eq('id', guaranteeId);

        if (error) throw error;

        await loadGuarantees();
        toast({
          title: t('common.success'),
          description: "Garantie bancaire supprimée avec succès",
        });
      } catch (error) {
        console.error('Error deleting guarantee:', error);
        toast({
          title: t('common.error'),
          description: "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
    }
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

  const handleProjectChange = (projectId: string | undefined) => {
    setFormData(prev => ({ ...prev, project_id: projectId || '' }));
  };

  const handleDocumentSelect = (documents: any[]) => {
    setUploadedDocuments(documents);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gestion des Garanties Bancaires
        </CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Garantie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails de la Garantie' : 
                 isEditing ? 'Modifier la Garantie' : 'Nouvelle Garantie Bancaire'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Projet *</Label>
                  <ProjectSelector
                    onChange={(projectId) => handleProjectChange(projectId)}
                    value={formData.project_id}
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label>Contracteur *</Label>
                  <SupplierSelector
                    value={{
                      id: formData.contractor_id,
                      name: formData.contractor_name,
                      contact: '',
                      leadTime: 0
                    }}
                    onChange={(supplier) => {
                      setFormData(prev => ({
                        ...prev,
                        contractor_id: supplier.id || '',
                        contractor_name: supplier.name
                      }));
                    }}
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bank_name">Banque *</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="guarantee_type">Type de Garantie *</Label>
                  <Select 
                    value={formData.guarantee_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, guarantee_type: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      {guaranteeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="guarantee_amount">Montant (MRU) *</Label>
                  <Input
                    id="guarantee_amount"
                    type="number"
                    value={formData.guarantee_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, guarantee_amount: parseFloat(e.target.value) || 0 }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="issue_date">Date d'Émission *</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiry_date">Date d'Expiration *</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label>Documents Justificatifs</Label>
                {!isViewMode && (
                  <div className="space-y-2">
                    <DocumentSelector
                      onChange={(documentId, document) => {
                        if (document) {
                          setUploadedDocuments(prev => [...prev, document]);
                        }
                      }}
                      documentType="contract"
                      disabled={isViewMode}
                    />
                    <div className="mt-2 p-3 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground text-center">
                        Glisser-déposer un fichier ici ou utiliser le sélecteur ci-dessus
                      </p>
                    </div>
                  </div>
                )}
                {uploadedDocuments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-2">Documents ajoutés:</p>
                    <div className="space-y-1">
                      {uploadedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span>{doc.title || doc.file_name}</span>
                          {!isViewMode && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setUploadedDocuments(prev => prev.filter((_, i) => i !== index))}
                            >
                              ×
                            </Button>
                          )}
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
                  disabled={isViewMode}
                  rows={3}
                />
              </div>
              
              {/* Document Visualization Section for View Mode */}
              {isViewMode && selectedGuarantee && (
                <div className="mt-6 pt-6 border-t">
                  <DocumentSection 
                    relatedId={selectedGuarantee.id} 
                    relatedType="bank_guarantee"
                    title="Documents de la Garantie Bancaire"
                  />
                </div>
              )}
              
              {!isViewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {guarantees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune garantie bancaire trouvée
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Banque</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guarantees.map((guarantee) => (
                <TableRow key={guarantee.id}>
                  <TableCell className="font-medium">{guarantee.project_id}</TableCell>
                  <TableCell>{guarantee.bank_name}</TableCell>
                  <TableCell>
                    {guaranteeTypes.find(t => t.value === guarantee.guarantee_type)?.label}
                  </TableCell>
                  <TableCell>{formatCurrency(guarantee.guarantee_amount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {format(new Date(guarantee.expiry_date), 'dd/MM/yyyy')}
                      {isExpiringSoon(guarantee.expiry_date) && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(guarantee.status)}>
                      {statusOptions.find(s => s.value === guarantee.status)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewForm(guarantee)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(guarantee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(guarantee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedBankGuaranteeCrud;