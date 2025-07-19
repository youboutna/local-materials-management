import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { PhaseService, PhaseData } from '@/services/phaseService';
import ProjectDocuments from '@/components/project/ProjectDocuments';
import ProjectMaterials from '@/components/project/ProjectMaterials';
import TaskAssignments from '@/components/documents/TaskAssignments';
import { PaymentHistory } from '@/components/project/PaymentHistory';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Users, 
  Package, 
  FileText, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

const PhaseDetail: React.FC = () => {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [phase, setPhase] = useState<PhaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhase = async () => {
      if (!projectId || !phaseId) return;
      
      try {
        setLoading(true);
        const phases = await PhaseService.loadProjectPhases(projectId);
        const foundPhase = phases.find(p => p.id === phaseId);
        
        if (foundPhase) {
          setPhase(foundPhase);
        } else {
          toast({
            title: "Erreur",
            description: "Phase non trouvée",
            variant: "destructive",
          });
          navigate(`/projects/${projectId}`);
        }
      } catch (error) {
        console.error('Error loading phase:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la phase",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPhase();
  }, [projectId, phaseId, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'delayed': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!phase) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Phase non trouvée</h1>
          <Button onClick={() => navigate(`/projects/${projectId}`)}>
            Retour au projet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/projects/${projectId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au projet
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{phase.title}</h1>
            <p className="text-muted-foreground mt-1">{phase.description}</p>
          </div>
        </div>
        <Badge className={`${getStatusColor(phase.status)} flex items-center gap-1`}>
          {getStatusIcon(phase.status)}
          {phase.status === 'completed' ? 'Terminée' : 
           phase.status === 'in_progress' ? 'En cours' : 
           phase.status === 'delayed' ? 'En retard' : 'Non commencée'}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progression</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{phase.progress}%</div>
            <Progress value={phase.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget estimé</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {phase.budget.toLocaleString()} MRU
            </div>
            <p className="text-xs text-muted-foreground">
              Coût réel: {phase.actualCost.toLocaleString()} MRU
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durée</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{phase.estimatedDuration} jours</div>
            <p className="text-xs text-muted-foreground">
              {phase.startDate} → {phase.endDate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Localisation</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{phase.location || 'Non spécifiée'}</div>
            {phase.notes && (
              <p className="text-xs text-muted-foreground mt-1">{phase.notes}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="materials">Matériaux</TabsTrigger>
          <TabsTrigger value="team">Équipe</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="monitoring">Suivi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Materials Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Matériaux requis ({phase.materials.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phase.materials.slice(0, 3).map((material, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{material.name || `Matériau ${material.materialId}`}</span>
                      <Badge variant="outline">{material.quantity}</Badge>
                    </div>
                  ))}
                  {phase.materials.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{phase.materials.length - 3} autres matériaux
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Team Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ressources humaines ({phase.humanResources.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phase.humanResources.slice(0, 3).map((resource, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{resource.role || `Rôle ${resource.roleId}`}</span>
                      <Badge variant="outline">{resource.quantity}</Badge>
                    </div>
                  ))}
                  {phase.humanResources.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{phase.humanResources.length - 3} autres rôles
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suppliers */}
          {phase.suppliers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fournisseurs associés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {phase.suppliers.map((supplier, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{supplier.name || `Fournisseur ${supplier.supplierId}`}</h4>
                      {supplier.contact && (
                        <p className="text-sm text-muted-foreground">{supplier.contact}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des matériaux</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                La gestion des matériaux sera synchronisée avec le projet principal.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Équipe et fournisseurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Human Resources */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Ressources humaines</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phase.humanResources.map((resource, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{resource.role || `Rôle ${resource.roleId}`}</span>
                          <Badge>{resource.quantity} personnes</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suppliers */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Fournisseurs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phase.suppliers.map((supplier, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <h4 className="font-medium">{supplier.name || `Fournisseur ${supplier.supplierId}`}</h4>
                        {supplier.contact && (
                          <p className="text-sm text-muted-foreground mt-1">{supplier.contact}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents de la phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Les documents seront gérés au niveau du projet principal.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des tâches</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskAssignments />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historique des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentHistory payments={[]} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inspections</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Les inspections seront disponibles après la création du projet.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhaseDetail;