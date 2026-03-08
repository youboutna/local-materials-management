import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FileCheck, Shield, AlertCircle, CheckCircle, Upload, Calendar, Users, Building, FileText, Plus, ExternalLink } from 'lucide-react';
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
import { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";
import { ComplianceItemDTO, ComplianceDocumentDTO, ComplianceNoteDTO, ComplianceAuditEntryDTO, ComplianceType, ComplianceStatus, CompliancePriority, ComplianceLevel, ComplianceRiskLevel } from "@/dtos/entities/ComplianceDTO";
import { ComplianceDataDTO } from "@/dtos/workflows/ProjectWorkflowDTOs";
import { ComplianceService } from "@/application/services/ComplianceService";
import { BankGuaranteeService } from "@/application/services/BankGuaranteeService";
import { InsuranceService } from "@/application/services/InsuranceService";
import { DocumentService } from "@/application/services/DocumentService";
import { RepositoryFactory } from "@/infrastructure/supabase/RepositoryFactory";
import { BankGuaranteeDTO } from "@/dtos/entities/BankGuaranteeDTO";
import { InsuranceCertificateDTO } from "@/dtos/entities/InsuranceDTO";
import { DocumentDTO } from "@/dtos/entities/DocumentDTO";
import { PhaseDTO } from "@/dtos/entities/PhaseDTO";
import { RiskDTO } from "@/dtos/entities/RiskDTO";
import { MaterialDTO } from "@/dtos/entities/MaterialDTO";

interface EnhancedComplianceStepProps {
  workflowData: ProjectWorkflowData | null;
  onStepComplete: (stepData: { compliance: ComplianceDataDTO }) => void;
  isEditing?: boolean;
  mode?: 'create' | 'edit';
}

const EnhancedComplianceStep: React.FC<EnhancedComplianceStepProps> = ({
  workflowData,
  onStepComplete,
  isEditing = false,
  mode = 'create'
}) => {
  const projectData = workflowData?.projectData || {} as ProjectDTO;
  const existingCompliance = workflowData?.relatedData?.compliance || {
    regulations: [],
    certifications: [],
    standards: [],
    status: 'pending' as const,
    documents: []
  };
  const { toast } = useToast();
  
  // Initialize services with proper hexagonal architecture
  const complianceService = useMemo(() => new ComplianceService(RepositoryFactory.getComplianceRepository()), []);
  const bankGuaranteeService = useMemo(() => new BankGuaranteeService(RepositoryFactory.getBankGuaranteeRepository()), []);
  const insuranceService = useMemo(() => new InsuranceService(RepositoryFactory.getInsuranceRepository()), []);
  const documentService = useMemo(() => new DocumentService(RepositoryFactory.getDocumentRepository()), []);
  
  // State for aggregated compliance data (READ-ONLY VIEW)
  const [complianceItems, setComplianceItems] = useState<ComplianceItemDTO[]>(existingCompliance.regulations || []);
  const [bankGuarantees, setBankGuarantees] = useState<BankGuaranteeDTO[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsuranceCertificateDTO[]>([]);
  const [documents, setDocuments] = useState<DocumentDTO[]>([]);

  // Load compliance data from various sources (aggregation view)
  const loadComplianceData = useCallback(async () => {
    try {
      // Load bank guarantees using service - Correct method name
      const guaranteesData = await bankGuaranteeService.getByProjectId(projectData.id || '');
      setBankGuarantees(guaranteesData);

      // Load insurance policies using service - Correct method name
      const policiesData = await insuranceService.getInsuranceCertificates(projectData.id || '');
      setInsurancePolicies(policiesData);

      // Load documents using service
      const documentsData = await documentService.getDocumentsByPhase(projectData.id);
      setDocuments(documentsData);

      // Load compliance items using service
      const complianceData = await complianceService.getComplianceByProject(projectData.id || '');
      setComplianceItems(complianceData);
    } catch (error) {
      console.error('Failed to load compliance data:', error instanceof Error ? error.message : String(error));
    }
  }, [projectData.id, bankGuaranteeService, insuranceService, documentService, complianceService]);

  useEffect(() => {
    if (projectData.id && projectData.id !== 'new-project') {
      loadComplianceData();
    }
  }, [projectData.id, loadComplianceData]);

  useEffect(() => {
    // Update form data when compliance items change
    if (onStepComplete) {
      onStepComplete({
        compliance: {
          regulations: complianceItems,
          certifications: insurancePolicies,
          standards: bankGuarantees,
          status: 'pending' as const,
          documents: documents
        }
      });
    }
  }, [complianceItems, insurancePolicies, bankGuarantees, documents, onStepComplete]);

  // Memoized filtered compliance items to avoid repeated filtering
  const regulatoryItems = useMemo(() => 
    complianceItems.filter(item => item.type === 'regulatory'),
    [complianceItems]
  );

  const completedItems = useMemo(() => 
    complianceItems.filter(item => item.status === 'approved'),
    [complianceItems]
  );

  // Helper functions for display
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
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'in_review': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateComplianceProgress = () => {
    if (complianceItems.length === 0) return 0;
    return (completedItems.length / complianceItems.length) * 100;
  };

  const getSafeAttribute = (obj: Record<string, unknown>, camelKey: string, snakeKey: string, fallback: unknown = ''): unknown => {
    return obj?.[camelKey] ?? obj?.[snakeKey] ?? fallback;
  };

  // Navigation to specialized UIs for adding items (as per requirement)
  const navigateToDocumentUI = () => {
    // This would navigate to document upload UI
    toast({
      title: "Navigation",
      description: "Redirection vers l'interface de gestion des documents",
    });
  };

  const navigateToInsuranceUI = () => {
    // This would navigate to insurance certificate UI
    toast({
      title: "Navigation", 
      description: "Redirection vers l'interface de gestion des assurances",
    });
  };

  const navigateToBankGuaranteeUI = () => {
    // This would navigate to bank guarantee UI
    toast({
      title: "Navigation",
      description: "Redirection vers l'interface de gestion des garanties bancaires",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with progress overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vue d'Ensemble de la Conformité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progression Générale</span>
              <span className="text-2xl font-bold">{calculateComplianceProgress().toFixed(1)}%</span>
            </div>
            <Progress value={calculateComplianceProgress()} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Aggregated Data Display */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="insurance">Assurances</TabsTrigger>
          <TabsTrigger value="bank-guarantees">Garanties</TabsTrigger>
          <TabsTrigger value="regulatory">Réglementaire</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Stats Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documents.length}</div>
                <p className="text-sm text-gray-600">Documents chargés</p>
                <Button onClick={navigateToDocumentUI} className="mt-2 w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter des Documents
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assurances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insurancePolicies.length}</div>
                <p className="text-sm text-gray-600">Polices d'assurance</p>
                <Button onClick={navigateToInsuranceUI} className="mt-2 w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter des Assurances
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Garanties Bancaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bankGuarantees.length}</div>
                <p className="text-sm text-gray-600">Garanties actives</p>
                <Button onClick={navigateToBankGuaranteeUI} className="mt-2 w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter des Garanties
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Éléments Réglementaires</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regulatoryItems.length}</div>
                <p className="text-sm text-gray-600">Exigences réglementaires</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents du Projet ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucun document trouvé</p>
                  <Button onClick={navigateToDocumentUI} className="mt-4">
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter des Documents
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{getSafeAttribute(doc, 'name', 'name', 'Sans nom') as string}</h4>
                        <p className="text-sm text-gray-600">
                          {getSafeAttribute(doc, 'description', 'description', 'Sans description') as string}
                        </p>
                      </div>
                      <Badge className={getStatusColor(getSafeAttribute(doc, 'status', 'status', 'unknown') as string)}>
                        {getSafeAttribute(doc, 'status', 'status', 'Inconnu') as string}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Assurances ({insurancePolicies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insurancePolicies.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucune assurance trouvée</p>
                  <Button onClick={navigateToInsuranceUI} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter des Assurances
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {insurancePolicies.map((policy) => (
                    <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{policy.insuranceCompany || policy.insurance_company || 'Compagnie inconnue'}</h4>
                        <p className="text-sm text-gray-600">
                          {policy.insuranceType || policy.insurance_type || 'Type inconnu'} - {policy.policyNumber || policy.policy_number || 'N° inconnu'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Valide jusqu'au: {new Date(policy.validUntil || policy.valid_until || new Date().toISOString()).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(policy.status || policy.status || 'unknown')}>
                        {policy.status || policy.status || 'Inconnu'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Guarantees Tab */}
        <TabsContent value="bank-guarantees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Garanties Bancaires ({bankGuarantees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bankGuarantees.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucune garantie bancaire trouvée</p>
                  <Button onClick={navigateToBankGuaranteeUI} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter des Garanties
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bankGuarantees.map((guarantee) => (
                    <div key={guarantee.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{guarantee.guarantor || guarantee.guarantor || 'Garant inconnu'}</h4>
                        <p className="text-sm text-gray-600">
                          {guarantee.guaranteeType || guarantee.guarantee_type || 'Type inconnu'} - {guarantee.coverageAmount || guarantee.coverage_amount || 0?.toLocaleString()}€
                        </p>
                        <p className="text-xs text-gray-500">
                          Valide jusqu'au: {new Date(guarantee.validUntil || guarantee.valid_until || new Date().toISOString()).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(guarantee.status || guarantee.status || 'unknown')}>
                        {guarantee.status || guarantee.status || 'Inconnu'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regulatory Compliance Tab */}
        <TabsContent value="regulatory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Conformité Réglementaire ({regulatoryItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {regulatoryItems.length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucun élément réglementaire trouvé</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Les éléments réglementaires sont gérés via leurs interfaces spécialisées respectives.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {regulatoryItems.map((item) => (
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
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      {item.deadline && (
                        <p className="text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Échéance: {new Date(item.deadline).toLocaleDateString()}
                        </p>
                      )}
                      {item.responsible && (
                        <p className="text-xs text-gray-500">
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
    </div>
  );
};

export default EnhancedComplianceStep;
