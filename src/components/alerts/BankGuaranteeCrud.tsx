import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useBankGuaranteesList,
  useCreateBankGuarantee,
  useUpdateBankGuarantee,
  useDeleteBankGuarantee,
  BankGuaranteeFormData,
  BankGuaranteeRow
} from '@/hooks/hexagonal/useBankGuaranteesHex';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';

const BankGuaranteeCrud = () => {
  const { t } = useLanguage();
  const { data: guarantees = [], isLoading } = useBankGuaranteesList();
  const createMutation = useCreateBankGuarantee();
  const updateMutation = useUpdateBankGuarantee();
  const deleteMutation = useDeleteBankGuarantee();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] = useState<BankGuaranteeRow | null>(null);
  const [formData, setFormData] = useState<BankGuaranteeFormData>({
    projectId: '',
    contractorId: '',
    bankName: '',
    guaranteeType: 'performance',
    guaranteeAmount: 0,
    issueDate: '',
    expiryDate: '',
    status: 'active',
  });

  const guaranteeTypes = [
    { value: 'performance', label: 'Garantie de bonne exécution' },
    { value: 'advance_payment', label: 'Garantie d\'avance' },
    { value: 'bid_bond', label: 'Garantie de soumission' },
    { value: 'retention', label: 'Garantie de retenue' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'expired', label: 'Expirée', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Annulée', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const resetForm = () => {
    setFormData({
      projectId: '',
      contractorId: '',
      bankName: '',
      guaranteeAmount: 0,
      guaranteeType: 'performance',
      issueDate: '',
      expiryDate: '',
      status: 'active',
    });
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
      guaranteeType: guarantee.guaranteeType || 'performance',
      issueDate: guarantee.issueDate || '',
      expiryDate: guarantee.expiryDate || '',
      status: guarantee.status || 'active',
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
      guaranteeType: guarantee.guaranteeType || 'performance',
      issueDate: guarantee.issueDate || '',
      expiryDate: guarantee.expiryDate || '',
      status: guarantee.status || 'active',
    });
    setSelectedGuarantee(guarantee);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.contractorId || !formData.bankName) {
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
      toast({
        title: t('common.error'),
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (guaranteeId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette garantie bancaire ?')) {
      try {
        await deleteMutation.mutateAsync(guaranteeId);
        toast({ title: t('common.success'), description: "Garantie bancaire supprimée avec succès" });
      } catch {
        toast({ title: t('common.error'), description: "Erreur lors de la suppression", variant: "destructive" });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🏦 Gestion des Garanties Bancaires</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Garantie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails de la Garantie' : isEditing ? 'Modifier la Garantie' : 'Nouvelle Garantie Bancaire'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProjectSelector
                  value={formData.projectId}
                  onChange={(projectId) => setFormData(prev => ({ ...prev, projectId: projectId || '' }))}
                  label="Projet"
                  required
                  disabled={isViewMode}
                />
                
                <div>
                  <SupplierSelector
                    value={{ id: formData.contractorId, name: '', contact: '', leadTime: 0 }}
                    onChange={(supplier) => setFormData(prev => ({ ...prev, contractorId: supplier.id || '' }))}
                    allowCustom={false}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Banque émettrice *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="guaranteeAmount">Montant (MRU) *</Label>
                  <Input
                    id="guaranteeAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.guaranteeAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, guaranteeAmount: parseFloat(e.target.value) || 0 }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Type de garantie *</Label>
                  <Select 
                    value={formData.guaranteeType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, guaranteeType: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {guaranteeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="issueDate">Date d'émission *</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Date d'expiration *</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <Label>Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={isViewMode}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!isViewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Garanties Bancaires</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead className="hidden sm:table-cell">Banque</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="hidden lg:table-cell">Expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guarantees.map((guarantee) => (
                <TableRow key={guarantee.id}>
                  <TableCell className="font-medium">{(guarantee.projectId || '').slice(0, 8)}...</TableCell>
                  <TableCell className="hidden sm:table-cell">{guarantee.bankName}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {guaranteeTypes.find(t => t.value === guarantee.guaranteeType)?.label}
                  </TableCell>
                  <TableCell>{(guarantee.guaranteeAmount || 0).toLocaleString()} MRU</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      {new Date(guarantee.expiryDate || '').toLocaleDateString('fr-FR')}
                      {isExpiringSoon(guarantee.expiryDate || '') && (
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
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openViewForm(guarantee)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEditForm(guarantee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(guarantee.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  );
};

export default BankGuaranteeCrud;
<<<<<<< HEAD
=======
=======
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, AlertTriangle, Calendar } from 'lucide-react';
import { toast, useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBankGuaranteesList, type BankGuaranteeFormData, type BankGuaranteeRow } from '@/hooks/hexagonal/useBankGuaranteesHex';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';

const BankGuaranteeCrud = () => {
  const { t } = useLanguage();
  const { createGuarantee, updateGuarantee, deleteGuarantee, data: guarantees = [] } = useBankGuaranteesHex();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] = useState<BankGuaranteeRow | null>(null);
  const [formData, setFormData] = useState<BankGuaranteeFormData>({
    projectId: '',
    contractorId: '',
    bankName: '',
    guaranteeAmount: 0,
    guaranteeType: '',
    issueDate: '',
    expiryDate: '',
    status: '',
    phaseId: '',
    notes: ''
  });

  const guaranteeTypes = [
    { value: 'performance', label: 'Garantie de bonne exécution' },
    { value: 'advance_payment', label: 'Garantie d\'avance' },
    { value: 'bid_bond', label: 'Garantie de soumission' },
    { value: 'retention', label: 'Garantie de retenue' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'expired', label: 'Expirée', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Annulée', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const resetForm = () => {
    setFormData({
      projectId: '',
      contractorId: '',
      bankName: '',
      guaranteeAmount: 0,
      guaranteeType: 'performance',
      issueDate: '',
      expiryDate: '',
      status: 'active'
    });
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (guarantee: BankGuaranteeRow) => {
    setFormData({
      projectId: guarantee.projectId || guarantee.project_id || '',
      contractorId: guarantee.contractorId || guarantee.contractor_id || '',
      bankName: guarantee.bankName || guarantee.bank_name || '',
      guaranteeAmount: guarantee.guaranteeAmount || guarantee.guarantee_amount || 0,
      guaranteeType: guarantee.guaranteeType || guarantee.guarantee_type || '',
      issueDate: guarantee.issueDate || guarantee.issue_date || '',
      expiryDate: guarantee.expiryDate || guarantee.expiry_date || '',
      status: guarantee.status
    });
    setSelectedGuarantee(guarantee);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (guarantee: BankGuaranteeRow) => {
    setFormData({
      projectId: guarantee.projectId || guarantee.project_id || '',
      contractorId: guarantee.contractorId || guarantee.contractor_id || '',
      bankName: guarantee.bankName || guarantee.bank_name || '',
      guaranteeAmount: guarantee.guaranteeAmount || guarantee.guarantee_amount || 0,
      guaranteeType: guarantee.guaranteeType || guarantee.guarantee_type || '',
      issueDate: guarantee.issueDate || guarantee.issue_date || '',
      expiryDate: guarantee.expiryDate || guarantee.expiry_date || '',
      status: guarantee.status
    });
    setSelectedGuarantee(guarantee);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.contractorId || !formData.bankName) {
      toast({
        title: t('common.error'),
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedGuarantee) {
        // Update guarantee using hexagonal hook
        await updateGuarantee.mutateAsync({
          id: selectedGuarantee.id,
          data: {
            bankName: formData.bankName,
            guaranteeType: formData.guaranteeType,
            guaranteeAmount: formData.guaranteeAmount,
            issueDate: formData.issueDate,
            expiryDate: formData.expiryDate,
            status: formData.status
          }
        });
        
        toast({
          title: t('common.success'),
          description: "Garantie bancaire mise à jour avec succès",
        });
      } else {
        // Create new guarantee using hexagonal hook
        await createGuarantee.mutateAsync({
          projectId: formData.projectId,
          contractorId: formData.contractorId,
          bankName: formData.bankName,
          guaranteeType: formData.guaranteeType,
          guaranteeAmount: formData.guaranteeAmount,
          issueDate: formData.issueDate,
          expiryDate: formData.expiryDate,
          status: formData.status || 'active'
        });
        
        toast({
          title: t('common.success'),
          description: "Garantie bancaire créée avec succès",
        });
      }
      
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (guaranteeId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette garantie bancaire ?')) {
      // Delete guarantee using hexagonal hook
      await deleteGuarantee.mutateAsync(guaranteeId);
      
      toast({
        title: t('common.success'),
        description: "Garantie bancaire supprimée avec succès",
      });
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

  const handleSupplierChange = (supplier: any) => {
    setFormData(prev => ({ ...prev, contractorId: supplier.id || '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🏦 Gestion des Garanties Bancaires</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Garantie
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails de la Garantie' : isEditing ? 'Modifier la Garantie' : 'Nouvelle Garantie Bancaire'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProjectSelector
                  value={formData.projectId}
                  onChange={handleProjectChange}
                  label="Projet"
                  required
                  disabled={isViewMode}
                />
                
                <div>
                  <SupplierSelector
                    value={{ 
                      id: formData.contractorId,
                      name: '',
                      contact: '',
                      leadTime: 0
                    }}
                    onChange={handleSupplierChange}
                    allowCustom={false}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_name">Banque émettrice *</Label>
                  <Input
                    id="bank_name"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="guarantee_amount">Montant (MRU) *</Label>
                  <Input
                    id="guarantee_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.guaranteeAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, guarantee_amount: parseFloat(e.target.value) || 0 }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="guarantee_type">Type de garantie *</Label>
                  <Select 
                    value={formData.guaranteeType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, guarantee_type: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  <Label htmlFor="issue_date">Date d'émission *</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiry_date">Date d'expiration *</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
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
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Garanties Bancaires</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="table-container-responsive">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead className="hidden sm:table-cell">Banque</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="hidden lg:table-cell">Expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {guarantees.map((guarantee) => (
                <TableRow key={guarantee.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col sm:table-cell">
                      <span className="font-medium">{guarantee.project_id}</span>
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {guarantee.bank_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{guarantee.bank_name}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {guaranteeTypes.find(t => t.value === guarantee.guarantee_type)?.label}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{guarantee.guarantee_amount.toLocaleString()} MRU</span>
                      <span className="text-xs text-muted-foreground sm:hidden">
                        {guaranteeTypes.find(t => t.value === guarantee.guarantee_type)?.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      {new Date(guarantee.expiry_date).toLocaleDateString('fr-FR')}
                      {isExpiringSoon(guarantee.expiry_date) && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge className={getStatusColor(guarantee.status)}>
                        {statusOptions.find(s => s.value === guarantee.status)?.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground lg:hidden">
                        {new Date(guarantee.expiry_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="table-actions-responsive">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openViewForm(guarantee)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditForm(guarantee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(guarantee.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {guarantees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Aucune garantie bancaire trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankGuaranteeCrud;
>>>>>>> b4aa55c (fix camelcase conv)
>>>>>>> 4ca2ffe ( fix alerts)
