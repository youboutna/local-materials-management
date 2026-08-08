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
import { useInsuranceCertificatesHex } from '@/hooks/hexagonal';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { InsuranceCertificateDTO } from '@/dtos/entities/InsuranceDTO';
import { InsuranceService, getInsuranceService} from '@/application/services/InsuranceService';

// Local form data interface matching component needs (Rule #2: camelCase)
interface InsuranceFormData {
  projectId: string;
  contractorId: string;
  contractorName: string;
  coverageType: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
}

// Local certificate type for display
interface LocalInsuranceCertificate {
  id: string;
  projectId: string;
  contractorId: string;
  contractorName: string;
  coverageType: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  startDate: string;
  endDate: string;
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  coverage_type: string;
  insurance_company: string;
  policy_number: string;
  coverage_amount: number;
  valid_from: string;
  valid_until: string;
  status: string;
  notes?: string;
}

const InsuranceCrud: React.FC = () => {
  const [certificates, setCertificates] = useState<LocalInsuranceCertificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<LocalInsuranceCertificate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<InsuranceFormData>({
    projectId: '',
    contractorId: '',
    contractorName: '',
    coverageType: '',
    insuranceCompany: '',
    policyNumber: '',
    coverageAmount: 0,
    startDate: '',
    endDate: '',
    status: 'active',
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
      projectId: '',
      contractorId: '',
      contractorName: '',
      coverageType: '',
      insuranceCompany: '',
      policyNumber: '',
      coverageAmount: 0,
      startDate: '',
      endDate: '',
      status: 'active',
      notes: ''
    });
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (certificate: LocalInsuranceCertificate) => {
    setFormData({
      projectId: certificate.projectId,
      contractorId: certificate.contractorId,
      contractorName: certificate.contractorName,
      coverageType: certificate.coverageType,
      insuranceCompany: certificate.insuranceCompany,
      policyNumber: certificate.policyNumber,
      coverageAmount: certificate.coverageAmount,
      startDate: certificate.startDate,
      endDate: certificate.endDate,
      status: certificate.status,
      notes: certificate.notes || ''
    });
    setSelectedCertificate(certificate);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (certificate: LocalInsuranceCertificate) => {
    setFormData({
      projectId: certificate.projectId,
      contractorId: certificate.contractorId,
      contractorName: certificate.contractorName,
      coverageType: certificate.coverageType,
      insuranceCompany: certificate.insuranceCompany,
      policyNumber: certificate.policyNumber,
      coverageAmount: certificate.coverageAmount,
      startDate: certificate.startDate,
      endDate: certificate.endDate,
      status: certificate.status,
      notes: certificate.notes || ''
    });
    setSelectedCertificate(certificate);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const insuranceService = getInsuranceService();
      
      if (isEditing && selectedCertificate) {
        await insuranceService.updateInsuranceCertificate(selectedCertificate.id, {
          status: formData.status as any,
          notes: formData.notes
        });
      } else {
        await insuranceService.createInsuranceCertificate({
          projectId: formData.projectId,
          contractorId: formData.contractorId,
          contractorName: formData.contractorName,
          insuranceType: formData.coverageType,
          insuranceCompany: formData.insuranceCompany,
          policyNumber: formData.policyNumber,
          coverageAmount: formData.coverageAmount,
          validFrom: formData.startDate,
          validUntil: formData.endDate,
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
        const insuranceService = getInsuranceService();
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
    setFormData(prev => ({ ...prev, projectId: projectId || '' }));
  };

  const handleSupplierChange = (supplier: { id?: string; name: string; contact: string; leadTime: number }) => {
    setFormData(prev => ({ 
      ...prev, 
      contractorId: supplier.id || '',
      contractorName: supplier.name || ''
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
                      name: formData.contractorName,
                      contact: '',
                      leadTime: 0
                    }}
                    onChange={handleSupplierChange}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insuranceCompany">Compagnie d'assurance *</Label>
                  <Input
                    id="insuranceCompany"
                    value={formData.insuranceCompany}
                    onChange={(e) => setFormData(prev => ({ ...prev, insuranceCompany: e.target.value }))}
                    required
                    disabled={isViewMode}
                    placeholder="Nom de la compagnie"
                  />
                </div>
                
                <div>
                  <Label htmlFor="policyNumber">Numéro de police *</Label>
                  <Input
                    id="policyNumber"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, policyNumber: e.target.value }))}
                    required
                    disabled={isViewMode}
                    placeholder="Numéro de police d'assurance"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="coverageType">Type de couverture *</Label>
                  <Select 
                    value={formData.coverageType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, coverageType: value }))}
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
                  <Label htmlFor="coverageAmount">Montant couvert (MRU) *</Label>
                  <Input
                    id="coverageAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.coverageAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverageAmount: parseFloat(e.target.value) || 0 }))}
                    required
                    disabled={isViewMode}
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
                  <Label htmlFor="startDate">Date de début *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Date d'expiration *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                    disabled={isViewMode}
                  />
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
                    {certificate.projectId ? (
                      <a
                        href={`/projects/${certificate.projectId}`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                        title={certificate.projectId}
                      >
                        <Eye className="h-3 w-3" />
                        {certificate.projectId.slice(0, 8)}...
                      </a>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{certificate.contractorName || certificate.contractorId}</TableCell>
                  <TableCell>
                    {coverageTypes.find(t => t.value === certificate.coverageType)?.label || certificate.coverageType}
                  </TableCell>
                  <TableCell>{certificate.policyNumber}</TableCell>
                  <TableCell>
                    {certificate.coverageAmount.toLocaleString()} MRU
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {new Date(certificate.endDate).toLocaleDateString('fr-FR')}
                      {isExpiringSoon(certificate.endDate) && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(certificate.status)}>
                      {statusOptions.find(s => s.value === certificate.status)?.label || certificate.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openViewForm(certificate)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(certificate)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(certificate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {certificates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun certificat d'assurance enregistré
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
