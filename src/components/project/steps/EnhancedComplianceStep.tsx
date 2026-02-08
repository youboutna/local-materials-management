import React, { useState, useEffect } from 'react';
import { FileCheck, Shield, AlertCircle, CheckCircle, Upload, Calendar, Users, Building, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { useToast } from '../../../hooks/use-toast';

// Import DTOs and services for hexagonal architecture
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { ComplianceService } from "@/application/services/ComplianceService";
import { BankGuaranteeService } from "@/application/services/BankGuaranteeService";
import { InsuranceService } from "@/application/services/InsuranceService";
import { DocumentService } from "@/application/services/DocumentService";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";

interface EnhancedComplianceStepProps {
  formData: ProjectDTO & { compliance?: EnhancedComplianceItem[] };
  onUpdate: (data: Partial<ProjectDTO>) => void;
  isEditing?: boolean;
}

interface EnhancedComplianceItem {
  id: string;
  type: 'regulatory' | 'insurance' | 'bank_guarantee' | 'technical' | 'environmental' | 'health_safety' | 'quality' | 'financial' | 'data_protection' | 'labor_law' | 'procurement';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'requires_action';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  responsible: string;
  documents: ComplianceDocument[];
  notes?: string;
  validationRules: ComplianceValidationRule[];
  auditTrail: ComplianceAuditEntry[];
  category: string;
  subcategory?: string;
  complianceLevel: 'partial' | 'full' | 'exceeded';
  lastReviewed: string;
  nextReview: string;
  externalReferences: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationRequired: boolean;
  mitigationPlan?: string;
}

interface ComplianceDocument {
  id: string;
  type: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiryDate?: string;
  validationRequired: boolean;
  validatedBy?: string;
  validatedAt?: string;
  fileUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface ComplianceValidationRule {
  id: string;
  name: string;
  description: string;
  required: boolean;
  validationType: 'document' | 'inspection' | 'certification' | 'review';
  frequency: 'once' | 'monthly' | 'quarterly' | 'annually';
  lastValidated?: string;
  nextDue: string;
  status: 'pending' | 'valid' | 'expired' | 'failed';
}

interface ComplianceAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
  previousStatus?: string;
  newStatus?: string;
  documents?: string[];
}

const EnhancedComplianceStep: React.FC<EnhancedComplianceStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  const { toast } = useToast();
  
  // Initialize services with hexagonal architecture
  const complianceService = new ComplianceService(RepositoryFactory.getComplianceRepository());
  const bankGuaranteeService = new BankGuaranteeService(RepositoryFactory.getBankGuaranteeRepository());
  const insuranceService = new InsuranceService(RepositoryFactory.getInsuranceRepository());
  const documentService = new DocumentService(RepositoryFactory.getDocumentRepository());
  
  const [complianceItems, setComplianceItems] = useState<EnhancedComplianceItem[]>(formData.compliance || []);
  const [bankGuarantees, setBankGuarantees] = useState<any[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newComplianceItem, setNewComplianceItem] = useState<Partial<EnhancedComplianceItem>>({
    type: 'regulatory',
    status: 'pending',
    priority: 'medium',
    complianceLevel: 'partial',
    riskLevel: 'medium',
    mitigationRequired: false
  });

  useEffect(() => {
    if (formData.id && formData.id !== 'new-project') {
      loadComplianceData();
    }
  }, [formData.id]);

  useEffect(() => {
    // Update form data when compliance items change
    onUpdate({
      compliance: complianceItems
    });
  }, [complianceItems, onUpdate]);

  const loadComplianceData = async () => {
    try {
      // Load bank guarantees using service
      const guaranteesData = await bankGuaranteeService.getBankGuaranteesByProject(formData.id || '');
      setBankGuarantees(guaranteesData);

      // Load insurance policies using service
      const policiesData = await insuranceService.getInsurancePoliciesByProject(formData.id || '');
      setInsurancePolicies(policiesData);

      // Load documents using service
      const documentsData = await documentService.getDocumentsByProject(formData.id || '');
      setDocuments(documentsData);

      // Load compliance items using service
      const complianceData = await complianceService.getComplianceByProject(formData.id || '');
      setComplianceItems(complianceData);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    }
  };

  const handleAddComplianceItem = async () => {
    if (!newComplianceItem.title || !newComplianceItem.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const complianceItem: EnhancedComplianceItem = {
      id: `compliance-${Date.now()}`,
      title: newComplianceItem.title!,
      description: newComplianceItem.description!,
      type: newComplianceItem.type!,
      status: newComplianceItem.status!,
      priority: newComplianceItem.priority!,
      deadline: newComplianceItem.deadline,
      responsible: newComplianceItem.responsible || '',
      documents: [],
      notes: newComplianceItem.notes,
      validationRules: [],
      auditTrail: [{
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'created',
        performedBy: 'system',
        details: 'Compliance item created'
      }],
      category: getCategoryName(newComplianceItem.type!),
      complianceLevel: newComplianceItem.complianceLevel!,
      lastReviewed: new Date().toISOString().split('T')[0],
      nextReview: calculateNextReview(newComplianceItem.type!),
      externalReferences: [],
      riskLevel: newComplianceItem.riskLevel!,
      mitigationRequired: newComplianceItem.mitigationRequired!,
      mitigationPlan: newComplianceItem.mitigationPlan
    };

    try {
      // Save to database using service
      await complianceService.createComplianceItem({
        projectId: formData.id || '',
        title: complianceItem.title,
        description: complianceItem.description,
        type: complianceItem.type,
        status: complianceItem.status,
        priority: complianceItem.priority,
        deadline: complianceItem.deadline,
        responsible: complianceItem.responsible,
        notes: complianceItem.notes,
        category: complianceItem.category,
        complianceLevel: complianceItem.complianceLevel,
        riskLevel: complianceItem.riskLevel,
        mitigationRequired: complianceItem.mitigationRequired,
        mitigationPlan: complianceItem.mitigationPlan
      });

      setComplianceItems([...complianceItems, complianceItem]);
      setNewComplianceItem({
        type: 'regulatory',
        status: 'pending',
        priority: 'medium',
        complianceLevel: 'partial',
        riskLevel: 'medium',
        mitigationRequired: false
      });
      setShowAddForm(false);

      toast({
        title: "Élément de Conformité Ajouté",
        description: "L'élément de conformité a été ajouté avec succès",
      });
    } catch (error) {
      console.error('Failed to create compliance item:', error);
      toast({
        title: "Erreur",
        description: "Échec de l'ajout de l'élément de conformité",
        variant: "destructive",
      });
    }
  };

  const handleUpdateComplianceItem = async (itemId: string, updates: Partial<EnhancedComplianceItem>) => {
    try {
      // Update in database using service
      await complianceService.updateComplianceItem(itemId, {
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        deadline: updates.deadline,
        responsible: updates.responsible,
        notes: updates.notes,
        complianceLevel: updates.complianceLevel,
        riskLevel: updates.riskLevel,
        mitigationRequired: updates.mitigationRequired,
        mitigationPlan: updates.mitigationPlan
      });

      setComplianceItems(complianceItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            ...updates,
            auditTrail: [
              ...item.auditTrail,
              {
                id: `audit-${Date.now()}`,
                timestamp: new Date().toISOString(),
                action: 'updated',
                performedBy: 'system',
                details: 'Compliance item updated'
              }
            ]
          };
        }
        return item;
      }));

      toast({
        title: "Élément de Conformité Mis à Jour",
        description: "L'élément de conformité a été mis à jour avec succès",
      });
    } catch (error) {
      console.error('Failed to update compliance item:', error);
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour de l'élément de conformité",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComplianceItem = async (itemId: string) => {
    try {
      // Delete from database using service
      await complianceService.deleteComplianceItem(itemId);
      
      setComplianceItems(complianceItems.filter(item => item.id !== itemId));
      toast({
        title: "Élément de Conformité Supprimé",
        description: "L'élément de conformité a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Failed to delete compliance item:', error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression de l'élément de conformité",
        variant: "destructive",
      });
    }
  };

  function getCategoryName(type: string): string {
    const categories: Record<string, string> = {
      'regulatory': 'Réglementaire',
      'insurance': 'Assurance',
      'bank_guarantee': 'Garantie Bancaire',
      'technical': 'Technique',
      'environmental': 'Environnemental',
      'health_safety': 'Santé et Sécurité',
      'quality': 'Qualité',
      'financial': 'Financier',
      'data_protection': 'Protection des Données',
      'labor_law': 'Droit du Travail',
      'procurement': 'Approvisionnement'
    };
    return categories[type] || type;
  }

  function calculateNextReview(type: string): string {
    const now = new Date();
    const frequencies: Record<string, number> = {
      'regulatory': 365, // 1 year
      'insurance': 365,
      'bank_guarantee': 180, // 6 months
      'technical': 90, // 3 months
      'environmental': 180,
      'health_safety': 90,
      'quality': 90,
      'financial': 90,
      'data_protection': 180,
      'labor_law': 365,
      'procurement': 180
    };
    
    const days = frequencies[type] || 365;
    const nextReview = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return nextReview.toISOString().split('T')[0];
  }

  // Calculate compliance statistics
  const totalItems = complianceItems.length;
  const approvedItems = complianceItems.filter(item => item.status === 'approved').length;
  const pendingItems = complianceItems.filter(item => item.status === 'pending').length;
  const criticalItems = complianceItems.filter(item => item.priority === 'critical').length;
  const overdueItems = complianceItems.filter(item => 
    item.deadline && new Date(item.deadline) < new Date() && item.status !== 'approved'
  ).length;

  const overallComplianceScore = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      case 'requires_action': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'regulatory': return <Building className="h-4 w-4" />;
      case 'insurance': return <Shield className="h-4 w-4" />;
      case 'bank_guarantee': return <FileText className="h-4 w-4" />;
      case 'technical': return <FileCheck className="h-4 w-4" />;
      default: return <FileCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Compliance Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Conformité Réglementaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{overallComplianceScore}%</div>
              <div className="text-sm text-gray-500">Score Global</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{approvedItems}</div>
              <div className="text-sm text-gray-500">Approuvés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{pendingItems}</div>
              <div className="text-sm text-gray-500">En Attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{criticalItems}</div>
              <div className="text-sm text-gray-500">Critiques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{overdueItems}</div>
              <div className="text-sm text-gray-500">En Retard</div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Éléments de Conformité</h3>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un Élément
            </Button>
          </div>

          {/* Add Compliance Item Form */}
          {showAddForm && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Nouvel Élément de Conformité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="compliance-title">Titre</Label>
                    <Input
                      id="compliance-title"
                      value={newComplianceItem.title || ''}
                      onChange={(e) => setNewComplianceItem({ ...newComplianceItem, title: e.target.value })}
                      placeholder="Titre de l'élément de conformité"
                    />
                  </div>
                  <div>
                    <Label htmlFor="compliance-type">Type</Label>
                    <Select value={newComplianceItem.type} onValueChange={(value) => setNewComplianceItem({ ...newComplianceItem, type: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regulatory">Réglementaire</SelectItem>
                        <SelectItem value="insurance">Assurance</SelectItem>
                        <SelectItem value="bank_guarantee">Garantie Bancaire</SelectItem>
                        <SelectItem value="technical">Technique</SelectItem>
                        <SelectItem value="environmental">Environnemental</SelectItem>
                        <SelectItem value="health_safety">Santé et Sécurité</SelectItem>
                        <SelectItem value="quality">Qualité</SelectItem>
                        <SelectItem value="financial">Financier</SelectItem>
                        <SelectItem value="data_protection">Protection des Données</SelectItem>
                        <SelectItem value="labor_law">Droit du Travail</SelectItem>
                        <SelectItem value="procurement">Approvisionnement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="compliance-description">Description</Label>
                  <Textarea
                    id="compliance-description"
                    value={newComplianceItem.description || ''}
                    onChange={(e) => setNewComplianceItem({ ...newComplianceItem, description: e.target.value })}
                    placeholder="Description détaillée de l'exigence de conformité"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="compliance-priority">Priorité</Label>
                    <Select value={newComplianceItem.priority} onValueChange={(value) => setNewComplianceItem({ ...newComplianceItem, priority: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une priorité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="compliance-deadline">Date Limite</Label>
                    <Input
                      id="compliance-deadline"
                      type="date"
                      value={newComplianceItem.deadline || ''}
                      onChange={(e) => setNewComplianceItem({ ...newComplianceItem, deadline: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="compliance-responsible">Responsable</Label>
                    <Input
                      id="compliance-responsible"
                      value={newComplianceItem.responsible || ''}
                      onChange={(e) => setNewComplianceItem({ ...newComplianceItem, responsible: e.target.value })}
                      placeholder="Nom du responsable"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddComplianceItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter l'Élément
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Items List */}
          <div className="space-y-4">
            {complianceItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(item.type)}
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                      </div>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteComplianceItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Niveau de Conformité</div>
                      <div className="flex items-center gap-2">
                        <Progress value={item.complianceLevel === 'full' ? 100 : item.complianceLevel === 'partial' ? 50 : 75} className="h-2 flex-1" />
                        <span>{item.complianceLevel}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Risque</div>
                      <Badge className={getPriorityColor(item.riskLevel)} variant="outline">
                        {item.riskLevel}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">Date Limite</div>
                      <div className={item.deadline && new Date(item.deadline) < new Date() ? 'text-red-500' : ''}>
                        {item.deadline || 'Non définie'}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Responsable</div>
                      <div>{item.responsible || 'Non assigné'}</div>
                    </div>
                  </div>

                  {item.notes && (
                    <div className="mt-4">
                      <div className="font-medium text-sm">Notes</div>
                      <p className="text-sm text-gray-600">{item.notes}</p>
                    </div>
                  )}

                  {item.mitigationRequired && item.mitigationPlan && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <div className="font-medium text-sm text-yellow-800">Plan de Mitigation Requis</div>
                      <p className="text-sm text-yellow-700">{item.mitigationPlan}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bank Guarantees and Insurance Tabs */}
      <Tabs defaultValue="guarantees" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guarantees">Garanties Bancaires</TabsTrigger>
          <TabsTrigger value="insurance">Assurances</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="guarantees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Garanties Bancaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bankGuarantees.length > 0 ? (
                <div className="space-y-2">
                  {bankGuarantees.map((guarantee) => (
                    <div key={guarantee.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{guarantee.type}</h4>
                        <p className="text-sm text-gray-500">Montant: {guarantee.amount}</p>
                      </div>
                      <Badge variant={guarantee.status === 'active' ? 'default' : 'secondary'}>
                        {guarantee.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune garantie bancaire enregistrée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Polices d'Assurance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insurancePolicies.length > 0 ? (
                <div className="space-y-2">
                  {insurancePolicies.map((policy) => (
                    <div key={policy.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{policy.type}</h4>
                        <p className="text-sm text-gray-500">Fournisseur: {policy.provider}</p>
                      </div>
                      <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                        {policy.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucune police d'assurance enregistrée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Documents de Conformité
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{doc.title}</h4>
                        <p className="text-sm text-gray-500">Type: {doc.type}</p>
                      </div>
                      <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Aucun document de conformité téléchargé</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedComplianceStep;
