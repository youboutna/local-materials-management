import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  Users, 
  UserCheck, 
  Shield, 
  MapPin,
  AlertTriangle,
  FileCheck,
  Layers,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import ProjectFormWithMap from './ProjectFormWithMap';
import MaterialFormSection from '../MaterialFormSection';
import OrganizationalHierarchyManager from '../admin/OrganizationalHierarchyManager';

interface ProjectCreationWorkflowProps {
  onSubmit: (data: any) => void;
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (materials: Array<{ materialId: string; quantity: number }>) => void;
  initialData?: any;
}

const ProjectCreationWorkflow: React.FC<ProjectCreationWorkflowProps> = ({
  onSubmit,
  selectedMaterials,
  onMaterialsChange,
  initialData
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [delegation, setDelegation] = useState<any>({});
  const [risks, setRisks] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);

  const workflowSteps = [
    {
      id: 'basic',
      title: 'Données Générales & GIS',
      icon: Building,
      description: 'Informations de base du projet et géolocalisation',
      color: 'bg-blue-500'
    },
    {
      id: 'stakeholders',
      title: 'Parties Prenantes',
      icon: Users,
      description: 'Identification et configuration des acteurs',
      color: 'bg-green-500'
    },
    {
      id: 'delegation',
      title: 'Délégation & Responsabilités',
      icon: UserCheck,
      description: 'Attribution des rôles et responsabilités',
      color: 'bg-orange-500'
    },
    {
      id: 'resources',
      title: 'Ressources & Organisation',
      icon: Shield,
      description: 'Matériaux, équipes et hiérarchie',
      color: 'bg-purple-500'
    },
    {
      id: 'phases',
      title: 'Phases & Étapes',
      icon: Layers,
      description: 'Planification des phases de réalisation',
      color: 'bg-indigo-500'
    },
    {
      id: 'geolocation',
      title: 'Géolocalisation Avancée',
      icon: MapPin,
      description: 'Cartographie détaillée et zones d\'intervention',
      color: 'bg-cyan-500'
    },
    {
      id: 'risks',
      title: 'Analyse des Risques',
      icon: AlertTriangle,
      description: 'Identification et mitigation des risques',
      color: 'bg-red-500'
    },
    {
      id: 'compliance',
      title: 'Conformités & Réglementation',
      icon: FileCheck,
      description: 'Respect des normes et réglementations',
      color: 'bg-teal-500'
    }
  ];

  const getStepProgress = () => {
    return (completedSteps.length / workflowSteps.length) * 100;
  };

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-serif text-primary">
              Processus de Création de Projet
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {completedSteps.length}/{workflowSteps.length} étapes
            </Badge>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </CardHeader>
      </Card>

      {/* Workflow Steps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {workflowSteps.map((step) => {
          const Icon = step.icon;
          const isCompleted = isStepCompleted(step.id);
          const isActive = activeTab === step.id;
          
          return (
            <motion.div
              key={step.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                } ${isCompleted ? 'border-green-500 bg-green-50' : ''}`}
                onClick={() => setActiveTab(step.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-full ${step.color} text-white relative`}>
                      <Icon className="h-5 w-5" />
                      {isCompleted && (
                        <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white rounded-full" />
                      )}
                    </div>
                    <h3 className="font-medium text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden" />

        {/* Basic Project Data & GIS */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                Données Générales & Géolocalisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectFormWithMap 
                onSubmit={(data) => {
                  handleStepComplete('basic');
                  onSubmit(data);
                }}
                initialData={initialData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stakeholders */}
        <TabsContent value="stakeholders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Configuration des Parties Prenantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                    <h4 className="font-semibold mb-2 text-blue-800">Maître d'Ouvrage</h4>
                    <p className="text-sm text-blue-600 mb-3">
                      Entité commanditaire du projet
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Configurer
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                    <h4 className="font-semibold mb-2 text-green-800">Maître d'Œuvre</h4>
                    <p className="text-sm text-green-600 mb-3">
                      Responsable de la réalisation technique
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Configurer
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                    <h4 className="font-semibold mb-2 text-purple-800">Entrepreneurs</h4>
                    <p className="text-sm text-purple-600 mb-3">
                      Entreprises de construction et fournisseurs
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Configurer
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('stakeholders')}>
                    Valider les Parties Prenantes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delegation */}
        <TabsContent value="delegation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-orange-500" />
                Délégation et Responsabilités
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <h4 className="font-semibold">Personnel Interne</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Employés responsables du suivi et de l'inspection
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline">Chef de Projet</Badge>
                      <Badge variant="outline">Inspecteur Qualité</Badge>
                      <Badge variant="outline">Coordinateur HSE</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-green-500" />
                      <h4 className="font-semibold">Bureaux d'Études</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Conseil technique et études spécialisées
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline">Étude Géotechnique</Badge>
                      <Badge variant="outline">Contrôle Technique</Badge>
                      <Badge variant="outline">Assistance Maîtrise d'Œuvre</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      <h4 className="font-semibold">Entreprises</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Réalisation des travaux de construction
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline">Gros Œuvre</Badge>
                      <Badge variant="outline">Corps d'État</Badge>
                      <Badge variant="outline">Finitions</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('delegation')}>
                    Valider la Délégation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources & Organization */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Ressources & Organisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Hiérarchie Organisationnelle</h3>
                  <OrganizationalHierarchyManager />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sélection des Matériaux</h3>
                  <MaterialFormSection
                    selectedMaterials={selectedMaterials}
                    onChange={onMaterialsChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleStepComplete('resources')}>
                  Valider les Ressources
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phases & Steps */}
        <TabsContent value="phases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                Phases & Étapes de Réalisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Cette section sera automatiquement renseignée une fois le projet créé. 
                  Vous pourrez ensuite définir les phases détaillées dans l'onglet "Phases" du projet.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <Clock className="h-8 w-8 text-blue-500 mb-2" />
                    <h4 className="font-semibold text-blue-800">Planification</h4>
                    <p className="text-sm text-blue-600">Définition des étapes</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-green-50">
                    <Building className="h-8 w-8 text-green-500 mb-2" />
                    <h4 className="font-semibold text-green-800">Préparation</h4>
                    <p className="text-sm text-green-600">Mise en place du site</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-orange-50">
                    <Shield className="h-8 w-8 text-orange-500 mb-2" />
                    <h4 className="font-semibold text-orange-800">Réalisation</h4>
                    <p className="text-sm text-orange-600">Travaux de construction</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg bg-purple-50">
                    <CheckCircle className="h-8 w-8 text-purple-500 mb-2" />
                    <h4 className="font-semibold text-purple-800">Livraison</h4>
                    <p className="text-sm text-purple-600">Finalisation et remise</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('phases')}>
                    Confirmer la Structure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Geolocation */}
        <TabsContent value="geolocation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-500" />
                Géolocalisation Avancée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                La géolocalisation de base est configurée dans les données générales. 
                Cette section permet d'affiner la cartographie et les zones d'intervention.
              </p>
              
              <div className="flex justify-end">
                <Button onClick={() => handleStepComplete('geolocation')}>
                  Valider la Géolocalisation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Analysis */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Analyse des Risques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                L'analyse des risques sera disponible une fois le projet créé via la section "Risques" du projet.
              </p>
              
              <div className="flex justify-end">
                <Button onClick={() => handleStepComplete('risks')}>
                  Confirmer l'Analyse
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-teal-500" />
                Conformités & Réglementation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                La gestion des conformités sera disponible une fois le projet créé.
              </p>
              
              <div className="flex justify-end">
                <Button onClick={() => handleStepComplete('compliance')}>
                  Valider les Conformités
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <Button 
          variant="outline" 
          onClick={() => {
            const currentIndex = workflowSteps.findIndex(step => step.id === activeTab);
            if (currentIndex > 0) {
              setActiveTab(workflowSteps[currentIndex - 1].id);
            }
          }}
          disabled={workflowSteps.findIndex(step => step.id === activeTab) === 0}
        >
          Précédent
        </Button>
        
        <div className="text-sm text-gray-500">
          Étape {workflowSteps.findIndex(step => step.id === activeTab) + 1} sur {workflowSteps.length}
        </div>
        
        <Button 
          onClick={() => {
            const currentIndex = workflowSteps.findIndex(step => step.id === activeTab);
            if (currentIndex < workflowSteps.length - 1) {
              setActiveTab(workflowSteps[currentIndex + 1].id);
            }
          }}
          disabled={workflowSteps.findIndex(step => step.id === activeTab) === workflowSteps.length - 1}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
};

export default ProjectCreationWorkflow;