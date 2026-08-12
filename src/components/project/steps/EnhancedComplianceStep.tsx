// ============================================================
// src/components/project/steps/EnhancedComplianceStep.tsx
// ============================================================
/**
 * Enhanced Compliance Step
 * Étape 6 du workflow - Conformité
 * Vue agrégée des données de conformité avec navigation vers les interfaces spécialisées
 * 
 * ⚠️ Utilise WorkflowContext pour gérer l'état
 * ⚠️ canManageSubObjects = false en mode CREATE (projet non persisté)
 * ⚠️ canManageSubObjects = true en mode EDIT (projet persisté)
 */

import { Building, Calendar, FileCheck, FileText, Plus, Shield, Upload, Users, ExternalLink, AlertCircle, Info } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Services
import { getBankGuaranteeService } from "@/application/services/BankGuaranteeService";
import { getComplianceService } from "@/application/services/ComplianceService";
import { getDocumentService } from "@/application/services/DocumentService";
import { getInsuranceService } from "@/application/services/InsuranceService";

// Context
import { useWorkflowContext } from '@/contexts/ProjectWorkflowContext';

// DTOs
import { BankGuaranteeDTO } from "@/dtos/entities/BankGuaranteeDTO";
import { ComplianceItemDTO } from "@/dtos/entities/ComplianceDTO";
import { DocumentDTO } from "@/dtos/entities/DocumentDTO";
import { InsuranceCertificateDTO } from "@/dtos/entities/InsuranceDTO";
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { ComplianceDataDTO, ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";

// Composants intégrés
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentsListPaginated from '@/components/documents/DocumentsListPaginated';

// ============================================================
// Types
// ============================================================

interface EnhancedComplianceStepProps {
  workflowData: ProjectWorkflowData | null;
  onStepComplete: (stepData: { compliance: ComplianceDataDTO }) => void;
  isEditing?: boolean;
  mode?: 'create' | 'edit';
}

// ============================================================
// Composant principal
// ============================================================

const EnhancedComplianceStep: React.FC<EnhancedComplianceStepProps> = ({
  workflowData,
  onStepComplete,
  isEditing = false,
  mode = 'create'
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ✅ Utilisation du contexte pour l'état
  const { 
    state,
    isPersistedEffective,
    canManageSubObjects,
    addDocument,
    addInsurance,
    addBankGuarantee,
    removeDocument,
    removeInsurance,
    removeBankGuarantee,
    setRelatedData,
    setDirty
  } = useWorkflowContext();
  
  const projectData = workflowData?.projectData || {} as ProjectDTO;
  const projectId = projectData.id || state.projectId;
  const isNewProject = !projectId || projectId === 'new-project' || projectId === '';
  // ✅ En mode EDIT sur un projet existant, la persistance est acquise même si le
  // contexte n'a pas encore reçu setPersisted(true) (hydratation asynchrone).
  const isEditable = mode === 'edit' && !isNewProject;
  const canPersistSubObjects = canManageSubObjects || isEditable;
  const isPersistedEffective = isPersisted || isEditable;
  
  // Données du contexte
  const contextDocuments = state.relatedData.documents || [];
  const contextInsurancePolicies = state.relatedData.insurancePolicies || [];
  const contextBankGuarantees = state.relatedData.bankGuarantees || [];
  const contextComplianceItems = state.relatedData.compliance?.regulations || [];
  
  // Services
  const complianceService = useMemo(() => getComplianceService(), []);
  const bankGuaranteeService = useMemo(() => getBankGuaranteeService(), []);
  const insuranceService = useMemo(() => getInsuranceService(), []);
  const documentService = useMemo(() => getDocumentService(), []);
  
  // State local (pour l'affichage)
  const [complianceItems, setComplianceItems] = useState<ComplianceItemDTO[]>(contextComplianceItems);
  const [bankGuarantees, setBankGuarantees] = useState<BankGuaranteeDTO[]>(contextBankGuarantees);
  const [insurancePolicies, setInsurancePolicies] = useState<InsuranceCertificateDTO[]>(contextInsurancePolicies);
  const [documents, setDocuments] = useState<DocumentDTO[]>(contextDocuments);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Dialog states
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isInsuranceDialogOpen, setIsInsuranceDialogOpen] = useState(false);
  const [isBankGuaranteeDialogOpen, setIsBankGuaranteeDialogOpen] = useState(false);

  // ============================================================
  // Synchronisation avec le contexte
  // ============================================================
  
  useEffect(() => {
    setDocuments(contextDocuments);
  }, [contextDocuments]);
  
  useEffect(() => {
    setInsurancePolicies(contextInsurancePolicies);
  }, [contextInsurancePolicies]);
  
  useEffect(() => {
    setBankGuarantees(contextBankGuarantees);
  }, [contextBankGuarantees]);
  
  useEffect(() => {
    setComplianceItems(contextComplianceItems);
  }, [contextComplianceItems]);

  // ============================================================
  // Load compliance data (uniquement en mode EDIT)
  // ============================================================
  const loadComplianceData = useCallback(async () => {
    // ⚠️ En mode CREATE ou si c'est un nouveau projet, ne pas charger depuis la DB
    if (isNewProject || mode === 'create' || !isPersistedEffective) {
      // Utiliser les données du contexte
      setComplianceItems(contextComplianceItems);
      setBankGuarantees(contextBankGuarantees);
      setInsurancePolicies(contextInsurancePolicies);
      setDocuments(contextDocuments);
      setIsLoading(false);
      return;
    }
    
    // ✅ Mode EDIT: charger les données depuis la DB
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const [guaranteesData, policiesData, documentsData, complianceData] = await Promise.all([
        bankGuaranteeService.getByProjectId(projectId).catch(() => []),
        insuranceService.getInsuranceCertificates(projectId).catch(() => []),
        documentService.getProjectDocuments(projectId).catch(() => []),
        complianceService.getComplianceByProject(projectId).catch(() => [])
      ]);
      
      // Mettre à jour le contexte
      setRelatedData({
        bankGuarantees: guaranteesData,
        insurancePolicies: policiesData,
        documents: documentsData,
        compliance: {
          ...state.relatedData.compliance,
          regulations: complianceData,
          documents: documentsData
        }
      });
      
      setBankGuarantees(guaranteesData);
      setInsurancePolicies(policiesData);
      setDocuments(documentsData);
      setComplianceItems(complianceData);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
      setLoadError('Impossible de charger les données de conformité');
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de conformité",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    projectId, 
    isNewProject, 
    mode, 
    isPersistedEffective,
    contextComplianceItems,
    contextBankGuarantees,
    contextInsurancePolicies,
    contextDocuments,
    bankGuaranteeService, 
    insuranceService, 
    documentService, 
    complianceService, 
    toast,
    setRelatedData,
    state.relatedData.compliance
  ]);

  // ============================================================
  // Effets
  // ============================================================
  
  // Chargement initial
  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  // Mise à jour du parent quand les données changent
  useEffect(() => {
    if (onStepComplete && !isLoading) {
      const complianceData: ComplianceDataDTO = {
        regulations: complianceItems,
        certifications: insurancePolicies,
        standards: bankGuarantees,
        status: 'pending' as const,
        documents: documents
      };
      onStepComplete({ compliance: complianceData });
    }
  }, [complianceItems, insurancePolicies, bankGuarantees, documents, onStepComplete, isLoading]);

  // ============================================================
  // Handlers d'ajout (avec vérification canManageSubObjects)
  // ============================================================

  const handleAddDocument = useCallback((doc: DocumentDTO) => {
    if (!canPersistSubObjects) {
      toast({
        title: "Information",
        description: "Veuillez d'abord sauvegarder le projet pour ajouter des documents",
      });
      return;
    }
    addDocument(doc);
    setDocuments(prev => [...prev, doc]);
    setDirty(true);
    toast({
      title: "Succès",
      description: "Document ajouté avec succès",
    });
  }, [canPersistSubObjects, addDocument, setDirty, toast]);

  const handleAddInsurance = useCallback((policy: InsuranceCertificateDTO) => {
    if (!canPersistSubObjects) {
      toast({
        title: "Information",
        description: "Veuillez d'abord sauvegarder le projet pour ajouter des assurances",
      });
      return;
    }
    addInsurance(policy);
    setInsurancePolicies(prev => [...prev, policy]);
    setDirty(true);
    toast({
      title: "Succès",
      description: "Assurance ajoutée avec succès",
    });
  }, [canPersistSubObjects, addInsurance, setDirty, toast]);

  const handleAddBankGuarantee = useCallback((guarantee: BankGuaranteeDTO) => {
    if (!canPersistSubObjects) {
      toast({
        title: "Information",
        description: "Veuillez d'abord sauvegarder le projet pour ajouter des garanties",
      });
      return;
    }
    addBankGuarantee(guarantee);
    setBankGuarantees(prev => [...prev, guarantee]);
    setDirty(true);
    toast({
      title: "Succès",
      description: "Garantie ajoutée avec succès",
    });
  }, [canPersistSubObjects, addBankGuarantee, setDirty, toast]);

  const handleRemoveDocument = useCallback((id: string) => {
    if (!canPersistSubObjects) return;
    removeDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    setDirty(true);
    toast({
      title: "Succès",
      description: "Document supprimé",
    });
  }, [canPersistSubObjects, removeDocument, setDirty, toast]);

  const handleRemoveInsurance = useCallback((id: string) => {
    if (!canPersistSubObjects) return;
    removeInsurance(id);
    setInsurancePolicies(prev => prev.filter(p => p.id !== id));
    setDirty(true);
    toast({
      title: "Succès",
      description: "Assurance supprimée",
    });
  }, [canPersistSubObjects, removeInsurance, setDirty, toast]);

  const handleRemoveBankGuarantee = useCallback((id: string) => {
    if (!canPersistSubObjects) return;
    removeBankGuarantee(id);
    setBankGuarantees(prev => prev.filter(g => g.id !== id));
    setDirty(true);
    toast({
      title: "Succès",
      description: "Garantie supprimée",
    });
  }, [canPersistSubObjects, removeBankGuarantee, setDirty, toast]);

  // ============================================================
  // Navigation Handlers
  // ============================================================

  const navigateToDocumentPage = useCallback(() => {
    if (!canPersistSubObjects) {
      toast({
        title: "Information",
        description: "Veuillez d'abord sauvegarder le projet pour accéder à la gestion des documents",
      });
      return;
    }
    navigate(`/projects/${projectId}/documents`);
  }, [navigate, projectId, canManageSubObjects, toast]);

  const navigateToInsurancePage = useCallback(() => {
    if (!canPersistSubObjects) {
      toast({
        title: "Information",
        description: "Veuillez d'abord sauvegarder le projet pour accéder à la gestion des assurances",
      });
      return;
    }
    navigate(`/projects/${projectId}/insurance`);
  }, [navigate, projectId, canManageSubObjects, toast]);

  const navigateToBankGuaranteePage = useCallback(() => {
    if (!canPersistSubObjects) {
      toast({
        title: "Information",
        description: "Veuillez d'abord sauvegarder le projet pour accéder à la gestion des garanties",
      });
      return;
    }
    navigate(`/projects/${projectId}/bank-guarantees`);
  }, [navigate, projectId, canManageSubObjects, toast]);

  // ============================================================
  // Helpers
  // ============================================================

  const getCategoryName = (type: string): string => {
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
      'contractual': 'Contractuel',
      'operational': 'Opérationnel'
    };
    return categories[type] || type;
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'in_review': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateComplianceProgress = () => {
    if (complianceItems.length === 0) return 0;
    const completed = complianceItems.filter(item => item.status === 'approved').length;
    return (completed / complianceItems.length) * 100;
  };

  // Calculate stats
  const stats = useMemo(() => ({
    total: complianceItems.length,
    approved: complianceItems.filter(i => i.status === 'approved').length,
    pending: complianceItems.filter(i => String(i.status) === 'pending' || String(i.status) === 'in_review').length,
    rejected: complianceItems.filter(i => i.status === 'rejected').length,
  }), [complianceItems]);

  // ============================================================
  // Render
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">
          {mode === 'create' ? 'Initialisation...' : 'Chargement des données de conformité...'}
        </span>
      </div>
    );
  }

  if (loadError && !isNewProject && isPersistedEffective) {
    return (
      <div className="py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
        <Button onClick={loadComplianceData} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  // ============================================================
  // Mode CREATE - Aperçu uniquement
  // ============================================================
  
  if (isNewProject || mode === 'create' || !isPersistedEffective) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Configuration de la Conformité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Mode Création - Aperçu</AlertTitle>
              <AlertDescription className="text-blue-700">
                Les éléments de conformité (documents, assurances, garanties bancaires) 
                seront disponibles <strong>après la sauvegarde du projet</strong>.
                Vous pourrez ensuite les gérer via les interfaces dédiées.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Documents */}
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Documents</p>
                  <p className="text-sm text-muted-foreground">{documents.length} document(s)</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">À compléter après création</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 opacity-50 cursor-not-allowed" disabled>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter (désactivé)
                  </Button>
                </CardContent>
              </Card>
              
              {/* Assurances */}
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Assurances</p>
                  <p className="text-sm text-muted-foreground">{insurancePolicies.length} police(s)</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">À compléter après création</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 opacity-50 cursor-not-allowed" disabled>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter (désactivé)
                  </Button>
                </CardContent>
              </Card>
              
              {/* Garanties */}
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <Building className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Garanties Bancaires</p>
                  <p className="text-sm text-muted-foreground">{bankGuarantees.length} garantie(s)</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">À compléter après création</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 opacity-50 cursor-not-allowed" disabled>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter (désactivé)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // Mode EDIT - Affichage complet avec toutes les actions
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Vue d'Ensemble de la Conformité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progression Générale</span>
              <span className="text-2xl font-bold">{calculateComplianceProgress().toFixed(0)}%</span>
            </div>
            <Progress value={calculateComplianceProgress()} className="h-2" />
            
            <div className="grid grid-cols-4 gap-2 mt-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-green-600">{stats.approved}</div>
                <div className="text-xs text-muted-foreground">Approuvés</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">En attente</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-red-600">{stats.rejected}</div>
                <div className="text-xs text-muted-foreground">Rejetés</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="insurance">Assurances ({insurancePolicies.length})</TabsTrigger>
          <TabsTrigger value="bank-guarantees">Garanties ({bankGuarantees.length})</TabsTrigger>
          <TabsTrigger value="regulatory">Réglementaire ({complianceItems.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Documents Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-sm text-muted-foreground">Documents chargés</p>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => setIsDocumentDialogOpen(true)} variant="outline" size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                  <Button onClick={navigateToDocumentPage} variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Assurances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insurancePolicies.length}</div>
                <p className="text-sm text-muted-foreground">Polices actives</p>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => setIsInsuranceDialogOpen(true)} variant="outline" size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                  <Button onClick={navigateToInsurancePage} variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bank Guarantees Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Garanties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bankGuarantees.length}</div>
                <p className="text-sm text-muted-foreground">Garanties actives</p>
                <div className="flex gap-2 mt-3">
                  <Button onClick={() => setIsBankGuaranteeDialogOpen(true)} variant="outline" size="sm" className="flex-1">
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                  <Button onClick={navigateToBankGuaranteePage} variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Regulatory Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Réglementaire
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{complianceItems.length}</div>
                <p className="text-sm text-muted-foreground">Exigences réglementaires</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5" />
                  Gestion des Documents ({documents.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setIsDocumentDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                  <Button onClick={navigateToDocumentPage} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Voir tout
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <DocumentsListPaginated
                documents={documents.map(doc => ({
                  ...doc,
                  document_type: doc.documentType,
                  file_name: doc.fileName,
                  uploaded_by: doc.uploadedBy,
                  file_size: doc.fileSize
                }))}
                currentPage={1}
                totalPages={1}
                totalItems={documents.length}
                onPageChange={() => {}}
                onDocumentSelect={() => {}}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5" />
                  Assurances du Projet ({insurancePolicies.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setIsInsuranceDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                  <Button onClick={navigateToInsurancePage} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gérer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {insurancePolicies.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune assurance trouvée</p>
                  <Button onClick={() => setIsInsuranceDialogOpen(true)} className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une assurance
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {insurancePolicies.slice(0, 5).map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{policy.insuranceCompany || 'Compagnie'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {policy.insuranceType || 'Type inconnu'} - {policy.policyNumber || 'N° inconnu'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valide jusqu'au: {new Date(policy.validUntil || new Date()).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(policy.status || 'unknown')}>
                        {policy.status || 'Inconnu'}
                      </Badge>
                    </div>
                  ))}
                  {insurancePolicies.length > 5 && (
                    <Button onClick={navigateToInsurancePage} variant="ghost" className="w-full">
                      Voir les {insurancePolicies.length - 5} autres assurances
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Guarantees Tab */}
        <TabsContent value="bank-guarantees" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="h-5 w-5" />
                  Garanties Bancaires ({bankGuarantees.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => setIsBankGuaranteeDialogOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                  <Button onClick={navigateToBankGuaranteePage} variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gérer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {bankGuarantees.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune garantie bancaire trouvée</p>
                  <Button onClick={() => setIsBankGuaranteeDialogOpen(true)} className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une garantie
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankGuarantees.slice(0, 5).map((guarantee) => (
                    <div key={guarantee.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{guarantee.issuingBank || 'Banque'}</h4>
                        <p className="text-sm text-muted-foreground">
                          {guarantee.guaranteeType || guarantee.type || 'Type inconnu'} - {(guarantee.guaranteeAmount || guarantee.amount || 0)?.toLocaleString()} MRU
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Valide jusqu'au: {new Date(guarantee.expiryDate || new Date()).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(guarantee.status || 'unknown')}>
                        {guarantee.status || 'Inconnu'}
                      </Badge>
                    </div>
                  ))}
                  {bankGuarantees.length > 5 && (
                    <Button onClick={navigateToBankGuaranteePage} variant="ghost" className="w-full">
                      Voir les {bankGuarantees.length - 5} autres garanties
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regulatory Tab */}
        <TabsContent value="regulatory" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileCheck className="h-5 w-5" />
                Conformité Réglementaire ({complianceItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {complianceItems.length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun élément réglementaire</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Les éléments réglementaires sont gérés via les interfaces spécialisées
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complianceItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <Badge className={`${getPriorityColor(item.priority)} ml-2`}>
                            {item.priority}
                          </Badge>
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      {item.deadline && (
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Échéance: {new Date(item.deadline).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      {item.responsible && (
                        <p className="text-xs text-muted-foreground">
                          <Users className="h-3 w-3 inline mr-1" />
                          Responsable: {item.responsible}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============================================================
          DIALOGS
          ============================================================ */}

      {/* Document Dialog */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un Document</DialogTitle>
            <DialogDescription>
              Téléchargez un nouveau document pour le projet
            </DialogDescription>
          </DialogHeader>
          <DocumentUpload 
            embedded 
            projectId={projectId}
            onSuccess={(doc) => {
              setIsDocumentDialogOpen(false);
              if (doc) {
                handleAddDocument(doc);
              }
              loadComplianceData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Insurance Dialog */}
      <Dialog open={isInsuranceDialogOpen} onOpenChange={setIsInsuranceDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestion des Assurances</DialogTitle>
            <DialogDescription>
              Gérez les polices d'assurance du projet
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground mb-4">
              Pour ajouter ou gérer les assurances, veuillez utiliser l'interface dédiée.
            </p>
            <Button onClick={() => {
              setIsInsuranceDialogOpen(false);
              navigateToInsurancePage();
            }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir la Gestion des Assurances
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Guarantee Dialog */}
      <Dialog open={isBankGuaranteeDialogOpen} onOpenChange={setIsBankGuaranteeDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestion des Garanties Bancaires</DialogTitle>
            <DialogDescription>
              Gérez les garanties bancaires du projet
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <Building className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-muted-foreground mb-4">
              Pour ajouter ou gérer les garanties bancaires, veuillez utiliser l'interface dédiée.
            </p>
            <Button onClick={() => {
              setIsBankGuaranteeDialogOpen(false);
              navigateToBankGuaranteePage();
            }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir la Gestion des Garanties
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedComplianceStep;