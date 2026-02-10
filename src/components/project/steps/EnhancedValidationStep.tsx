import React, { useState, useEffect } from 'react';
import { CheckCircle, FileCheck, AlertTriangle, Upload, Calendar, Users, Shield, Award } from 'lucide-react';
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

// Import DTOs
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { ReceptionDTO, ReceptionType, ReceptionStatus, ReceptionValidationDTO } from "@/dtos/entities/ReceptionDTO";
import { RiskDTO } from "@/dtos/entities/RiskDTO";
import { ComplianceItemDTO } from "@/dtos/entities/ComplianceDTO";

interface EnhancedValidationStepProps {
  formData: ProjectDTO & { 
    compliance?: ComplianceItemDTO[];
    receptions?: ReceptionDTO[];
    risks?: RiskDTO[];
  };
  onUpdate: (data: Partial<ProjectDTO>) => void;
  isEditing?: boolean;
}

interface ValidationField {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  required: boolean;
  lastUpdated?: string;
  assignedTo?: string;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    uploadedAt: string;
  }>;
}

const EnhancedValidationStep: React.FC<EnhancedValidationStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  const { toast } = useToast();
  
  // State for validation fields
  const [validationFields, setValidationFields] = useState<ValidationField[]>([
    {
      id: 'provisional-reception',
      name: 'Réception Provisoire',
      status: formData?.receptions?.find(r => r.type === 'provisional')?.status === 'approved' ? 'completed' : 'pending',
      description: 'Réception provisoire du projet',
      required: false,
      lastUpdated: formData?.receptions?.find(r => r.type === 'provisional')?.updatedAt
    },
    {
      id: 'definitive-reception',
      name: 'Réception Définitive',
      status: formData?.receptions?.find(r => r.type === 'definitive')?.status === 'approved' ? 'completed' : 'pending',
      description: 'Réception définitive et validation finale',
      required: true,
      lastUpdated: formData?.receptions?.find(r => r.type === 'definitive')?.updatedAt
    },
    {
      id: 'risk-assessment',
      name: 'Évaluation des Risques',
      status: formData?.risks && formData.risks.length > 0 ? 'completed' : 'pending',
      description: 'Analyse complète des risques du projet',
      required: true,
      lastUpdated: undefined
    },
    {
      id: 'compliance-check',
      name: 'Vérification Conformité',
      status: formData?.compliance && formData.compliance.length > 0 ? 'completed' : 'pending',
      description: 'Vérification de la conformité réglementaire',
      required: true,
      lastUpdated: undefined
    },
    {
      id: 'technical-validation',
      name: 'Validation Technique',
      status: 'pending',
      description: 'Validation des aspects techniques du projet',
      required: true,
      lastUpdated: undefined
    },
    {
      id: 'financial-validation',
      name: 'Validation Financière',
      status: 'pending',
      description: 'Validation des aspects financiers et budgétaires',
      required: true,
      lastUpdated: undefined
    }
  ]);

  // State for reception management
  const [selectedReceptionType, setSelectedReceptionType] = useState<ReceptionType | ''>('');
  const [receptionDate, setReceptionDate] = useState('');
  const [committeeMembers, setCommitteeMembers] = useState<string[]>([]);
  const [chairman, setChairman] = useState('');
  const [receptionNotes, setReceptionNotes] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // State for validation results
  const [validationResults, setValidationResults] = useState<Record<string, {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    message?: string;
    details?: Record<string, unknown>;
  }>>({});

  // Calculate overall progress
  const completedFields = validationFields.filter(field => field.status === 'completed').length;
  const overallProgress = (completedFields / validationFields.length) * 100;

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  // Handle reception creation
  const handleCreateReception = async () => {
    if (!selectedReceptionType || !receptionDate || !chairman) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      // In real implementation, this would call ReceptionService
      // For now, we'll create a mock reception following hexagonal patterns
      const newReception: Partial<ReceptionDTO> = {
        type: selectedReceptionType,
        scheduledDate: receptionDate,
        receptionCommittee: committeeMembers,
        chairmanId: chairman,
        notes: receptionNotes,
        status: ReceptionStatus.PENDING,
        projectId: formData.id || '',
        documents: uploadedFiles.map(file => ({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type as 'certificate' | 'checklist' | 'photo' | 'report' | 'scan',
          url: `mock-url/${file.name}`,
          size: file.size,
          uploadedAt: new Date().toISOString()
        }))
      };

      // Mock service call - in real implementation, use ReceptionService
      const savedReception = {
        id: 'mock-id',
        ...newReception,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update validation results
      setValidationResults(prev => ({
        ...prev,
        reception: {
          status: 'completed',
          message: 'Réception créée avec succès'
        }
      }));

      toast({
        title: "Succès",
        description: "Réception créée avec succès",
      });

      // In real implementation, this would call ReceptionService.createReception(newReception)
      console.log('Mock reception created:', savedReception);
    } catch (error: unknown) {
      console.error('Failed to create reception:', error);
      
      setSelectedReceptionType('');
      setReceptionDate('');
      setCommitteeMembers([]);
      setChairman('');
      setReceptionNotes('');
      setUploadedFiles([]);
      
      setValidationResults(prev => ({
        ...prev,
        reception: {
          status: 'failed',
          message: error instanceof Error ? error.message : String(error)
        }
      }));

      toast({
        title: "Erreur",
        description: "Échec de la création de la réception",
        variant: "destructive",
      });
    }
  };

  // Handle validation
  const handleValidation = async (fieldId: string) => {
    try {
      // Mock validation - in real implementation, this would call validation services
      const validationResult: any = {
        isValid: true,
        errors: [],
        warnings: [],
        recommendations: []
      };

      setValidationResults(prev => ({
        ...prev,
        [fieldId]: validationResult
      }));

      // Update field status
      setValidationFields(prev => prev.map(field => 
        field.id === fieldId 
          ? { ...field, status: validationResult.isValid ? 'completed' : 'failed', lastUpdated: new Date().toISOString() }
          : field
      ));

      toast({
        title: "Validation terminée",
        description: `Le champ ${fieldId} a été validé avec succès`,
      });
    } catch (error) {
      console.error('Validation failed:', error);
      toast({
        title: "Erreur de validation",
        description: "Échec de la validation",
        variant: "destructive",
      });
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Calendar className="h-4 w-4" />;
      case 'failed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-teal-500" />
            Validation et Conformité Finale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progression globale</span>
              <span className="text-sm text-gray-500">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
              {validationFields.map((field) => (
                <div key={field.id} className="text-center">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getStatusBadgeColor(field.status)} text-white mb-1`}>
                    {getStatusIcon(field.status)}
                  </div>
                  <p className="font-medium text-xs">{field.name}</p>
                  <p className="text-xs text-gray-500">{field.status}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="reception">Réceptions</TabsTrigger>
          <TabsTrigger value="compliance">Conformité</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statut du Projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project-status">Statut du Projet</Label>
                <Select value={formData.status || ""} onValueChange={(value) => onUpdate({ status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="en cours">En cours</SelectItem>
                    <SelectItem value="en attente">En attente</SelectItem>
                    <SelectItem value="terminé">Terminé</SelectItem>
                    <SelectItem value="suspendu">Suspendu</SelectItem>
                    <SelectItem value="annulé">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="closure-notes">Notes de Clôture</Label>
                <Textarea
                  id="closure-notes"
                  placeholder="Notes finales, observations, recommandations..."
                  value={formData.closureNotes || ""}
                  onChange={(e) => onUpdate({ closureNotes: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="certificate-number">Numéro de Certificat</Label>
                <Input
                  id="certificate-number"
                  placeholder="Numéro de certificat de réception"
                  value={(formData as any).certificateNumber || ""}
                  onChange={(e) => onUpdate({ certificateNumber: e.target.value } as any)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reception" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Gestion des Réceptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create New Reception */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Créer une nouvelle réception</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reception-type">Type de Réception</Label>
                    <Select value={selectedReceptionType} onValueChange={setSelectedReceptionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReceptionType.PROVISIONAL}>Réception Provisoire</SelectItem>
                        <SelectItem value={ReceptionType.DEFINITIVE}>Réception Définitive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="reception-date">Date de Réception</Label>
                    <Input
                      id="reception-date"
                      type="date"
                      value={receptionDate}
                      onChange={(e) => setReceptionDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="chairman">Président du Comité</Label>
                  <Input
                    id="chairman"
                    placeholder="Nom du président"
                    value={chairman}
                    onChange={(e) => setChairman(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="committee-members">Membres du Comité</Label>
                  <Input
                    id="committee-members"
                    placeholder="Noms des membres (séparés par des virgules)"
                    value={committeeMembers.join(', ')}
                    onChange={(e) => setCommitteeMembers(e.target.value.split(',').map(m => m.trim()))}
                  />
                </div>

                <div>
                  <Label htmlFor="reception-notes">Notes de Réception</Label>
                  <Textarea
                    id="reception-notes"
                    placeholder="Notes et observations de la réception..."
                    value={receptionNotes}
                    onChange={(e) => setReceptionNotes(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="documents">Documents</Label>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="file:mr-2 file:py-2 file:px-4"
                  />
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{file.name}</span>
                          <Badge variant="outline">{file.type}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleCreateReception} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Créer la Réception
                </Button>
              </div>

              {/* Existing Receptions */}
              {formData?.receptions && formData.receptions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Réceptions existantes</h3>
                  {formData.receptions.map((reception) => (
                    <Card key={reception.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{reception.type === 'provisional' ? 'Réception Provisoire' : 'Réception Définitive'}</h4>
                          <p className="text-sm text-gray-500">Date: {reception.scheduledDate}</p>
                          <p className="text-sm text-gray-500">Président: {reception.chairmanName}</p>
                        </div>
                        <Badge variant={reception.status === 'approved' ? 'default' : 'secondary'}>
                          {reception.status}
                        </Badge>
                      </div>
                      {reception.notes && (
                        <p className="text-sm text-gray-600 mt-2">{reception.notes}</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Conformité Réglementaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                La conformité réglementaire est gérée à travers l'étape 6 du workflow.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Validation des Champs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {validationFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{field.name}</h4>
                    <p className="text-sm text-gray-500">{field.description}</p>
                    {field.required && (
                      <Badge variant="outline" className="text-red-500">
                        Obligatoire
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadgeColor(field.status)}>
                      {field.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidation(field.id)}
                      disabled={field.status === 'in_progress'}
                    >
                      Valider
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedValidationStep;
