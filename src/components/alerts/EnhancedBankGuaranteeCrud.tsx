/**
 * EnhancedBankGuaranteeCrud - MIGRATED TO HEXAGONAL ARCHITECTURE
 * Uses camelCase formData aligned with BankGuaranteeFormData from hooks
 * Uses entityLabels for display, keeps IDs for CRUD operations
 */

import React, { useMemo, useState } from 'react';
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
import ListToolbar from '@/components/common/ListToolbar';
import ExpiryCountdown from '@/components/common/ExpiryCountdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExpiryFilter, matchesExpiryFilter } from '@/lib/expiryUx';
import {
  useBankGuaranteesList,
  useCreateBankGuarantee,
  useUpdateBankGuarantee,
  useDeleteBankGuarantee,
  BankGuaranteeFormData,
  BankGuaranteeRow
} from '@/hooks/hexagonal';
import { BankGuaranteeType, BankGuaranteeStatus } from '@/dtos/entities/BankGuaranteeDTO';
import { T } from '@/components/i18n/T';

// ✅ IMPORT entityLabels
import { getEntityLabel, createEntityOptions } from '@/utils/entityLabels';
import { useProjectsHex } from '@/hooks/hexagonal/useProjectsHex';

const EnhancedBankGuaranteeCrud = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] = useState<BankGuaranteeRow | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [expiryFilter, setExpiryFilter] = useState<ExpiryFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [formData, setFormData] = useState<BankGuaranteeFormData>({
    projectId: '',
    contractorId: '',
    bankName: '',
    guaranteeAmount: 0,
    guaranteeType: 'performance' as BankGuaranteeType,
    issueDate: '',
    expiryDate: '',
    status: 'active' as BankGuaranteeStatus,
    contractorName: '',
    supportingDocuments: [],
    notes: ''
  });
  
  const { t } = useLanguage();

  // Hexagonal hooks
  const { data: guarantees = [], isLoading, refetch } = useBankGuaranteesList();
  const { data: projects = [] } = useProjectsHex(); // ✅ Pour les labels
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
    { value: 'active', label: 'Active', color: 'bg-success-soft text-success' },
    { value: 'expired', label: 'Expirée', color: 'bg-destructive/10 text-destructive' },
    { value: 'claimed', label: 'Réclamée', color: 'bg-warning/10 text-warning' },
    { value: 'released', label: 'Libérée', color: 'bg-primary/10 text-primary' },
    { value: 'suspended', label: 'Suspendue', color: 'bg-muted text-foreground' }
  ];

  const resetForm = () => {
    setFormData({
      projectId: '',
      contractorId: '',
      bankName: '',
      guaranteeAmount: 0,
      guaranteeType: 'performance' as BankGuaranteeType,
      issueDate: '',
      expiryDate: '',
      status: 'active' as BankGuaranteeStatus,
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
      guaranteeType: (guarantee.guaranteeType || 'performance') as BankGuaranteeType,
      issueDate: guarantee.issueDate || '',
      expiryDate: guarantee.expiryDate || '',
      status: (guarantee.status || 'active') as BankGuaranteeStatus,
      contractorName: guarantee.contractorName || '',
      supportingDocuments: guarantee.supportingDocuments || [],
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
      guaranteeType: (guarantee.guaranteeType || 'performance') as BankGuaranteeType,
      issueDate: guarantee.issueDate || '',
      expiryDate: guarantee.expiryDate || '',
      status: (guarantee.status || 'active') as BankGuaranteeStatus,
      contractorName: guarantee.contractorName || '',
      supportingDocuments: guarantee.supportingDocuments || [],
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

  // ✅ Filtrage avec recherche sur le label du projet
  const filteredGuarantees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guarantees.filter((g) => {
      if (typeFilter !== 'all' && g.guaranteeType !== typeFilter) return false;
      if (!matchesExpiryFilter(g.expiryDate, expiryFilter)) return false;
      if (!q) return true;
      
      // ✅ Récupérer le label du projet pour la recherche
      const projectLabel = g.projectId 
        ? getEntityLabel(g.projectId, projects, 'project')
        : '';
      
      return [projectLabel, g.bankName, g.guaranteeType, g.contractorName, g.status, g.notes]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [guarantees, projects, search, expiryFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    return statusOptions.find(option => option.value === status)?.color || 'bg-muted text-foreground';
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
    <TooltipProvider delayDuration={200}>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <T k="auto.enhancedbankguaranteecrud.gestion_des_garanties_bancaires" fallback="Gestion des Garanties Bancaires" />
        </CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <T k="auto.enhancedbankguaranteecrud.nouvelle_garantie" fallback="Nouvelle Garantie" />
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
                        contractorId: supplier.id || '',
                        contractorName: supplier.name
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, guaranteeType: value as BankGuaranteeType }))}
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
                  <Label htmlFor="status"><T k="auto.enhancedbankguaranteecrud.statut" fallback="Statut" /></Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as BankGuaranteeStatus }))}
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
                <Label><T k="auto.enhancedbankguaranteecrud.documents_justificatifs" fallback="Documents Justificatifs" /></Label>
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
                <Label htmlFor="notes"><T k="auto.enhancedbankguaranteecrud.notes" fallback="Notes" /></Label>
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
                    <T k="auto.enhancedbankguaranteecrud.annuler" fallback="Annuler" />
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
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher (projet, banque, type, contractant…)"
          expiryFilter={expiryFilter}
          onExpiryFilterChange={setExpiryFilter}
          resultCount={filteredGuarantees.length}
        >
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[15rem]">
              <SelectValue placeholder="Type de garantie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all"><T k="auto.enhancedbankguaranteecrud.tous_les_types" fallback="Tous les types" /></SelectItem>
              {guaranteeTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ListToolbar>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><T k="auto.enhancedbankguaranteecrud.projet" fallback="Projet" /></TableHead>
              <TableHead><T k="auto.enhancedbankguaranteecrud.banque" fallback="Banque" /></TableHead>
              <TableHead><T k="auto.enhancedbankguaranteecrud.type" fallback="Type" /></TableHead>
              <TableHead><T k="auto.enhancedbankguaranteecrud.montant" fallback="Montant" /></TableHead>
              <TableHead><T k="auto.enhancedbankguaranteecrud.expiration" fallback="Expiration" /></TableHead>
              <TableHead><T k="auto.enhancedbankguaranteecrud.jours_restants" fallback="Jours restants" /></TableHead>
              <TableHead><T k="auto.enhancedbankguaranteecrud.statut" fallback="Statut" /></TableHead>
              <TableHead><T k="auto.enhancedbankguaranteecrud.actions" fallback="Actions" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuarantees.map((guarantee) => {
              // ✅ RÉSOLUTION DU LABEL DU PROJET
              const projectLabel = guarantee.projectId 
                ? getEntityLabel(guarantee.projectId, projects, 'project')
                : '—';
              
              return (
                <TableRow key={guarantee.id}>
                  <TableCell className="font-medium">
                    {guarantee.projectId ? (
                      <a
                        href={`/projects/${guarantee.projectId}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                        title={guarantee.projectId}
                      >
                        <Eye className="h-3 w-3" />
                        {/* ✅ AFFICHAGE DU LABEL AU LIEU DE L'UUID */}
                        {projectLabel}
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{guarantee.bankName}</TableCell>
                  <TableCell>
                    {guaranteeTypes.find(t => t.value === guarantee.guaranteeType)?.label || guarantee.guaranteeType}
                  </TableCell>
                  <TableCell>{formatCurrency(guarantee.guaranteeAmount || 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {new Date(guarantee.expiryDate || '').toLocaleDateString('fr-FR')}
                      {isExpiringSoon(guarantee.expiryDate || '') && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ExpiryCountdown expiryDate={guarantee.expiryDate} />
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(guarantee.status)}>
                      {statusOptions.find(s => s.value === guarantee.status)?.label || guarantee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => openViewForm(guarantee)} aria-label="Consulter">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><T k="auto.enhancedbankguaranteecrud.consulter_la_garantie" fallback="Consulter la garantie" /></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => openEditForm(guarantee)} aria-label="Modifier">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><T k="auto.enhancedbankguaranteecrud.modifier_la_garantie" fallback="Modifier la garantie" /></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(guarantee.id)}
                            className="text-destructive hover:text-destructive"
                            disabled={deleteMutation.isPending}
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><T k="auto.enhancedbankguaranteecrud.supprimer_la_garantie" fallback="Supprimer la garantie" /></TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredGuarantees.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <T k="auto.enhancedbankguaranteecrud.aucune_garantie_bancaire_ne_correspond_aux_filtr" fallback="Aucune garantie bancaire ne correspond aux filtres" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};

export default EnhancedBankGuaranteeCrud;