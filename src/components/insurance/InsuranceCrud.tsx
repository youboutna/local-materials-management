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
import { Plus, Edit, Trash2, Eye, Shield, AlertTriangle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InsuranceService, InsuranceCertificate, CreateInsuranceData, UpdateInsuranceData } from '@/application/services/InsuranceService';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';

const InsuranceCrud: React.FC = () => {
  const [certificates, setCertificates] = useState<InsuranceCertificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<InsuranceCertificate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateInsuranceData>({
    project_id: '',
    contractor_id: '',
    insurance_type: '',
    provider: '',
    policy_number: '',
    coverage_amount: 0,
    start_date: '',
    valid_until: '',
    status: 'active',
    documents: [],
    notes: ''
  });

  const coverageTypes = [
    { value: 'responsabilite_civile', label: 'Responsabilité civile' },
    { value: 'decennale', label: 'Assurance décennale' },
    { value: 'vehicules', label: 'Assurance véhicules' },
    { value: 'materiel', label: 'Assurance matériel' },
    { value: 'tous_risques', label: 'Tous risques chantier' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'expired', label: 'Expirée', color: 'bg-red-100 text-red-800' },
    { value: 'expiring_soon', label: 'Expire bientôt', color: 'bg-orange-100 text-orange-800' },
    { value: 'missing', label: 'Manquante', color: 'bg-gray-100 text-gray-800' }
  ];

  const resetForm = () => {
    setFormData({
      project_id: '',
      contractor_id: '',
      insurance_type: '',
      provider: '',
      policy_number: '',
      coverage_amount: 0,
      start_date: '',
      valid_until: '',
      status: 'active',
      documents: [],
      notes: ''
    });
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (certificate: InsuranceCertificate) => {
    setFormData({
      project_id: certificate.project_id,
      contractor_id: certificate.contractor_id,
      insurance_type: certificate.insurance_type,
      provider: certificate.provider,
      policy_number: certificate.policy_number,
      coverage_amount: certificate.coverage_amount,
      start_date: certificate.start_date,
      valid_until: certificate.valid_until,
      status: certificate.status,
      documents: certificate.documents,
      notes: '' // notes field doesn't exist in InsuranceCertificate interface
    });
    setSelectedCertificate(certificate);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (certificate: InsuranceCertificate) => {
    setFormData({
      project_id: certificate.project_id,
      contractor_id: certificate.contractor_id,
      insurance_type: certificate.insurance_type,
      provider: certificate.provider,
      policy_number: certificate.policy_number,
      coverage_amount: certificate.coverage_amount,
      start_date: certificate.start_date,
      valid_until: certificate.valid_until,
      status: certificate.status,
      documents: certificate.documents,
      notes: '' // notes field doesn't exist in InsuranceCertificate interface
    });
    setSelectedCertificate(certificate);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const insuranceService = new InsuranceService();
      
      if (isEditing && selectedCertificate) {
        // Update insurance certificate using InsuranceService
        await insuranceService.updateInsuranceCertificate(selectedCertificate.id, {
          status: formData.status,
          notes: formData.notes
        });
      } else {
        // Create new insurance certificate using InsuranceService
        await insuranceService.createInsuranceCertificate({
          project_id: formData.project_id,
          contractor_id: formData.contractor_id,
          insurance_type: formData.insurance_type,
          provider: formData.provider,
          policy_number: formData.policy_number,
          coverage_amount: formData.coverage_amount,
          start_date: formData.start_date,
          valid_until: formData.valid_until,
          status: formData.status,
          documents: formData.documents,
          notes: formData.notes
        });
      }
      
      setIsFormOpen(false);
      resetForm();
      
      toast({
        title: isEditing ? "Certificat d'assurance mis à jour" : "Certificat d'assurance créé avec succès",
        description: `Le certificat d'assurance a été ${isEditing ? 'mis à jour' : 'créé'} avec succès`,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (certificateId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce certificat d\'assurance ?')) {
      setCertificates(prev => prev.filter(c => c.id !== certificateId));
      
      try {
        const insuranceService = new InsuranceService();
        await insuranceService.deleteInsuranceCertificate(certificateId);
        
        toast({
          title: "Succès",
          description: "Certificat d'assurance supprimé avec succès",
        });
      } catch (error) {
        console.error('Error deleting certificate:', error);
        toast({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Une erreur est survenue",
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

  const handleSupplierChange = (supplier: { id?: string; name: string; contact: string; leadTime: number }) => {
    setFormData(prev => ({ 
      ...prev, 
      contractor_id: supplier.id || '',
      contractor_name: supplier.name || ''
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🛡️ Gestion des Assurances</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouveau Certificat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails du Certificat' : isEditing ? 'Modifier le Certificat' : 'Nouveau Certificat d\'Assurance'}
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
                      name: '', // contractor_name doesn't exist in CreateInsuranceData
                      contact: '',
                      leadTime: 0
                    }}
                    onChange={handleSupplierChange}
                    allowCustom={true}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">Compagnie d'assurance *</Label>
                  <Input
                    id="provider"
                    value={formData.provider}
                    onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                    required
                    disabled={isViewMode}
                    placeholder="Nom de la compagnie"
                  />
                </div>
                
                <div>
                  <Label htmlFor="policy_number">Numéro de police *</Label>
                  <Input
                    id="policy_number"
                    value={formData.policy_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, policy_number: e.target.value }))}
                    required
                    disabled={isViewMode}
                    placeholder="Numéro de police d'assurance"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="insurance_type">Type de couverture *</Label>
                  <Select 
                    value={formData.insurance_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, insurance_type: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {coverageTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="coverage_amount">Montant couvert (MRU) *</Label>
                  <Input
                    id="coverage_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.coverage_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverage_amount: parseFloat(e.target.value) || 0 }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'expired' | 'pending' }))}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="valid_until">Date d'expiration *</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div>
                <Label>Documents</Label>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Les documents seront gérés via le système de gestion des documents
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  disabled={isViewMode}
                  placeholder="Notes et commentaires..."
                />
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
          <CardTitle>Liste des Certificats d'Assurance</CardTitle>
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
                    {certificate.project_id}
                  </TableCell>
                  <TableCell>{certificate.contractor_id}</TableCell>
                  <TableCell>
                    {coverageTypes.find(t => t.value === certificate.insurance_type)?.label}
                  </TableCell>
                  <TableCell>{certificate.policy_number}</TableCell>
                  <TableCell>
                    {certificate.coverage_amount.toLocaleString()} MRU
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {new Date(certificate.valid_until).toLocaleDateString('fr-FR')}
                      {isExpiringSoon(certificate.valid_until) && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(certificate.status)}>
                      {statusOptions.find(s => s.value === certificate.status)?.label}
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
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {certificates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Aucun certificat d'assurance trouvé
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

export default InsuranceCrud;