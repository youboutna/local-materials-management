<<<<<<< HEAD
/**
 * EnhancedBankGuaranteeCrud - MIGRATED TO HEXAGONAL ARCHITECTURE
 * Uses camelCase formData aligned with BankGuaranteeFormData from hooks
 */
import React, { useState } from 'react';
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
import { Plus, Eye, Edit, Trash2, AlertTriangle, FileText } from 'lucide-react';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import DocumentSelector from '@/components/selectors/DocumentSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { format } from 'date-fns';
import {
  useBankGuaranteesList,
  useCreateBankGuarantee,
  useUpdateBankGuarantee,
  useDeleteBankGuarantee,
  BankGuaranteeFormData,
  BankGuaranteeRow
} from '@/hooks/hexagonal';

const EnhancedBankGuaranteeCrud = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] = useState<BankGuaranteeRow | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [contractorName, setContractorName] = useState('');

  const [formData, setFormData] = useState<BankGuaranteeFormData>({
    projectId: '',
    contractorId: '',
    bankName: '',
    guaranteeAmount: 0,
    guaranteeType: '',
    issueDate: '',
    expiryDate: '',
    status: 'active',
  });
  
  const { t } = useLanguage();

  // Hexagonal hooks
  const { data: guarantees = [], isLoading, refetch } = useBankGuaranteesList();
  const createMutation = useCreateBankGuarantee();
  const updateMutation = useUpdateBankGuarantee();
  const deleteMutation = useDeleteBankGuarantee();

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

  const resetForm = () => {
    setFormData({
      projectId: '',
      contractorId: '',
      bankName: '',
      guaranteeAmount: 0,
      guaranteeType: '',
      issueDate: '',
      expiryDate: '',
      status: 'active',
    });
    setContractorName('');
    setUploadedDocuments([]);
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (guarantee: BankGuaranteeRow) => {
    setFormData({
      projectId: guarantee.projectId || '',
      contractorId: guarantee.contractorId || '',
      bankName: guarantee.bankName || '',
      guaranteeAmount: guarantee.guaranteeAmount || 0,
      guaranteeType: guarantee.guaranteeType || '',
      issueDate: guarantee.issueDate || '',
      expiryDate: guarantee.expiryDate || '',
      status: guarantee.status,
      notes: guarantee.notes || '',
    });
    setContractorName('');
    setSelectedGuarantee(guarantee);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (guarantee: BankGuaranteeRow) => {
    setFormData({
      projectId: guarantee.projectId || '',
      contractorId: guarantee.contractorId || '',
      bankName: guarantee.bankName || '',
      guaranteeAmount: guarantee.guaranteeAmount || 0,
      guaranteeType: guarantee.guaranteeType || '',
      issueDate: guarantee.issueDate || '',
      expiryDate: guarantee.expiryDate || '',
      status: guarantee.status,
      notes: guarantee.notes || '',
    });
    setContractorName('');
    setSelectedGuarantee(guarantee);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.contractorId || !formData.bankName || !formData.guaranteeAmount) {
      toast({
        title: t('common.error'),
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedGuarantee) {
        await updateMutation.mutateAsync({ id: selectedGuarantee.id, data: formData });
        toast({ title: t('common.success'), description: "Garantie bancaire mise à jour avec succès" });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: t('common.success'), description: "Garantie bancaire créée avec succès" });
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
        await deleteMutation.mutateAsync(guaranteeId);
        toast({ title: t('common.success'), description: "Garantie bancaire supprimée avec succès" });
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
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const handleProjectChange = (projectId: string | undefined) => {
    setFormData(prev => ({ ...prev, projectId: projectId || '' }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                    value={formData.projectId}
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label>Contracteur *</Label>
                  <SupplierSelector
                    value={{
                      id: formData.contractorId,
                      name: contractorName,
                      contact: '',
                      leadTime: 0
                    }}
                    onChange={(supplier) => {
                      setFormData(prev => ({
                        ...prev,
                        contractorId: supplier.id || '',
                      }));
                      setContractorName(supplier.name);
                    }}
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="bankName">Banque *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="guaranteeType">Type de Garantie *</Label>
                  <Select 
                    value={formData.guaranteeType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, guaranteeType: value }))}
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
                  <Label htmlFor="guaranteeAmount">Montant (MRU) *</Label>
                  <Input
                    id="guaranteeAmount"
                    type="number"
                    value={formData.guaranteeAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, guaranteeAmount: parseFloat(e.target.value) || 0 }))}
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
                  <Label htmlFor="issueDate">Date d'Émission *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiryDate">Date d'Expiration *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
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
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={isViewMode}
                  rows={3}
                />
              </div>
              
              {!isViewMode && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
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
                <TableCell className="font-medium">{(guarantee.projectId || '').slice(0, 8)}...</TableCell>
                <TableCell>{guarantee.bankName}</TableCell>
                <TableCell>
                  {guaranteeTypes.find(t => t.value === guarantee.guaranteeType)?.label || guarantee.guaranteeType}
                </TableCell>
                <TableCell>{formatCurrency(guarantee.guaranteeAmount || 0)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {new Date(guarantee.expiryDate || '').toLocaleDateString('fr-FR')}
                    {isExpiringSoon(guarantee.expiryDate || '') && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(guarantee.status)}>
                    {statusOptions.find(s => s.value === guarantee.status)?.label || guarantee.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openViewForm(guarantee)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditForm(guarantee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(guarantee.id)}
                      className="text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {guarantees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucune garantie bancaire enregistrée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EnhancedBankGuaranteeCrud;
=======
/**
 * EnhancedBankGuaranteeCrud - MIGRATED TO HEXAGONAL ARCHITECTURE
 */
import React, { useState } from 'react';
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
import { Plus, Eye, Edit, Trash2, AlertTriangle, FileText } from 'lucide-react';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import DocumentSelector from '@/components/selectors/DocumentSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { format } from 'date-fns';
import {
  useBankGuaranteesList,
  useCreateBankGuarantee,
  useUpdateBankGuarantee,
  useDeleteBankGuarantee,
  BankGuaranteeFormData,
  BankGuaranteeRow
} from '@/hooks/hexagonal';

const EnhancedBankGuaranteeCrud = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] = useState<BankGuaranteeRow | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);

  const [formData, setFormData] = useState<BankGuaranteeFormData>({
    projectId: '',
    contractorId: '',
    bankName: '',
    guaranteeAmount: 0,
    guaranteeType: '',
    issueDate: '',
    expiryDate: '',
    status: 'active',
    contractor_name: '',
    supporting_documents: [],
    notes: ''
  });
  
  const { t } = useLanguage();

  // Hexagonal hooks
  const { data: guarantees = [], isLoading, refetch } = useBankGuaranteesList();
  const createMutation = useCreateBankGuarantee();
  const updateMutation = useUpdateBankGuarantee();
  const deleteMutation = useDeleteBankGuarantee();

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

  const resetForm = () => {
    setFormData({
      projectId: '',
      contractorId: '',
      bankName: '',
      guaranteeAmount: 0,
      guaranteeType: '',
      issueDate: '',
      expiryDate: '',
      status: 'active',
      contractorName: '',
      supportingDocuments: [],
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

  const openEditForm = (guarantee: BankGuaranteeRow) => {
    setFormData({
      projectId: guarantee.projectId || '',
      contractorId: guarantee.contractorId || '',
      bankName: guarantee.bankName || '',
      guaranteeAmount: guarantee.guaranteeAmount || 0,
      guaranteeType: guarantee.guaranteeType || '',
      issueDate: guarantee.issueDate || '',
      expiryDate: guarantee.expiryDate || '',
      status: guarantee.status,
      contractorName: guarantee.contractorName || '',
      supporting_documents: guarantee.supportingDocuments || [],
      notes: guarantee.notes || ''
    });
    setSelectedGuarantee(guarantee);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (guarantee: BankGuaranteeRow) => {
    setFormData({
      projectId: guarantee.projectId || '',
      contractorId: guarantee.contractorId || '',
      bankName: guarantee.bankName || '',
      guaranteeAmount: guarantee.guaranteeAmount || 0,
      guaranteeType: guarantee.guaranteeType || '',
      issueDate: guarantee.issueDate || '',
      expiryDate: guarantee.expiryDate || '',
      status: guarantee.status,
      contractorName: guarantee.contractorName || '',
      supporting_documents: guarantee.supportingDocuments || [],
      notes: guarantee.notes || ''
    });
    setSelectedGuarantee(guarantee);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.contractorId || !formData.bankName || !formData.guaranteeAmount) {
      toast({
        title: t('common.error'),
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedGuarantee) {
        await updateMutation.mutateAsync({ id: selectedGuarantee.id, data: formData });
        toast({ title: t('common.success'), description: "Garantie bancaire mise à jour avec succès" });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: t('common.success'), description: "Garantie bancaire créée avec succès" });
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
        await deleteMutation.mutateAsync(guaranteeId);
        toast({ title: t('common.success'), description: "Garantie bancaire supprimée avec succès" });
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
    setFormData(prev => ({ ...prev, projectId: projectId || '' }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MRU',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                    value={formData.projectId}
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label>Contracteur *</Label>
                  <SupplierSelector
                    value={{
                      id: formData.contractorId,
                      name: formData.contractorName,
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
                  <Label htmlFor="bankName">Banque *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="guaranteeType">Type de Garantie *</Label>
                  <Select 
                    value={formData.guaranteeType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, guaranteeType: value }))}
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
                  <Label htmlFor="guaranteeAmount">Montant (MRU) *</Label>
                  <Input
                    id="guaranteeAmount"
                    type="number"
                    value={formData.guaranteeAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, guaranteeAmount: parseFloat(e.target.value) || 0 }))}
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
                  <Label htmlFor="issueDate">Date d'Émission *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                    disabled={isViewMode}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiryDate">Date d'Expiration *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
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
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={isViewMode}
                  rows={3}
                />
              </div>
              
              {!isViewMode && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
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
                <TableCell className="font-medium">{(guarantee.projectId || '').slice(0, 8)}...</TableCell>
                <TableCell>{guarantee.bankName}</TableCell>
                <TableCell>
                  {guaranteeTypes.find(t => t.value === guarantee.guaranteeType)?.label || guarantee.guaranteeType}
                </TableCell>
                <TableCell>{formatCurrency(guarantee.guaranteeAmount || 0)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {new Date(guarantee.expiryDate || '').toLocaleDateString('fr-FR')}
                    {isExpiringSoon(guarantee.expiryDate || '') && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(guarantee.status)}>
                    {statusOptions.find(s => s.value === guarantee.status)?.label || guarantee.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openViewForm(guarantee)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditForm(guarantee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDelete(guarantee.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {guarantees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Aucune garantie bancaire trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EnhancedBankGuaranteeCrud;
>>>>>>> b4aa55c (fix camelcase conv)
