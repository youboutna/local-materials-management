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
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';

interface BankGuarantee {
  id: string;
  project_id: string;
  contractor_id: string;
  bank_name: string;
  guarantee_amount: number;
  guarantee_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface BankGuaranteeFormData {
  project_id: string;
  contractor_id: string;
  bank_name: string;
  guarantee_amount: number;
  guarantee_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
}

const BankGuaranteeCrud: React.FC = () => {
  const [guarantees, setGuarantees] = useState<BankGuarantee[]>([]);
  const [selectedGuarantee, setSelectedGuarantee] = useState<BankGuarantee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<BankGuaranteeFormData>({
    project_id: '',
    contractor_id: '',
    bank_name: '',
    guarantee_amount: 0,
    guarantee_type: 'performance',
    issue_date: '',
    expiry_date: '',
    status: 'active'
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
      project_id: '',
      contractor_id: '',
      bank_name: '',
      guarantee_amount: 0,
      guarantee_type: 'performance',
      issue_date: '',
      expiry_date: '',
      status: 'active'
    });
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
      bank_name: guarantee.bank_name,
      guarantee_amount: guarantee.guarantee_amount,
      guarantee_type: guarantee.guarantee_type,
      issue_date: guarantee.issue_date,
      expiry_date: guarantee.expiry_date,
      status: guarantee.status
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
      bank_name: guarantee.bank_name,
      guarantee_amount: guarantee.guarantee_amount,
      guarantee_type: guarantee.guarantee_type,
      issue_date: guarantee.issue_date,
      expiry_date: guarantee.expiry_date,
      status: guarantee.status
    });
    setSelectedGuarantee(guarantee);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.contractor_id || !formData.bank_name) {
      toast({
        title: t('common.error'),
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedGuarantee) {
        // Update guarantee in database
        const { error } = await supabase
          .from('bank_guarantees')
          .update({
            bank_name: formData.bank_name,
            guarantee_type: formData.guarantee_type,
            guarantee_amount: formData.guarantee_amount,
            issue_date: formData.issue_date,
            expiry_date: formData.expiry_date,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedGuarantee.id);

        if (error) throw error;

        // Update local state
        const updatedGuarantee = { ...selectedGuarantee, ...formData };
        setGuarantees(prev => prev.map(g => g.id === selectedGuarantee.id ? updatedGuarantee : g));
        
        toast({
          title: t('common.success'),
          description: "Garantie bancaire mise à jour avec succès",
        });
      } else {
        // Create new guarantee in database
        const { data, error } = await supabase
          .from('bank_guarantees')
          .insert({
            project_id: formData.project_id,
            contractor_id: formData.contractor_id,
            bank_name: formData.bank_name,
            guarantee_type: formData.guarantee_type,
            guarantee_amount: formData.guarantee_amount,
            issue_date: formData.issue_date,
            expiry_date: formData.expiry_date,
            status: formData.status || 'active'
          })
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        setGuarantees(prev => [...prev, data]);
        
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
      setGuarantees(prev => prev.filter(g => g.id !== guaranteeId));
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
    setFormData(prev => ({ ...prev, project_id: projectId || '' }));
  };

  const handleSupplierChange = (supplier: any) => {
    setFormData(prev => ({ ...prev, contractor_id: supplier.id || '' }));
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
                  value={formData.project_id}
                  onChange={handleProjectChange}
                  label="Projet"
                  required
                  disabled={isViewMode}
                />
                
                <div>
                  <SupplierSelector
                    value={{ 
                      id: formData.contractor_id,
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
                    value={formData.bank_name}
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
                    value={formData.guarantee_amount}
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
                    value={formData.guarantee_type} 
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
                    value={formData.issue_date}
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
                    value={formData.expiry_date}
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