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
import { supabase } from '@/integrations/supabase/client';
import PhaseTasks from '@/components/project/PhaseTasks';
import PhaseMaterials from '@/components/project/PhaseMaterials';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import PhaseDocuments from '@/components/project/PhaseDocuments';
import PhasePayments from '@/components/project/PhasePayments';
import PhaseInspections from '@/components/project/PhaseInspections';
import PhaseMilestones from '@/components/project/PhaseMilestones';
import { GanttChart, PERTDiagram, CriticalPathView } from '@/components/planning';
import { AppLayout } from '@/components/layout/AppLayout';
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
  TrendingUp,
  BarChart3,
  Target,
  Layers
} from 'lucide-react';

const PhaseDetail: React.FC = () => {
  const { projectId, phaseId } = useParams<{ projectId: string; phaseId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [phase, setPhase] = useState<PhaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actualCost, setActualCost] = useState<number>(0);
  const [materialsCount, setMaterialsCount] = useState<number>(0);
  const [employeesCount, setEmployeesCount] = useState<number>(0);

  // Function to calculate actual costs and counts from database
  const calculatePhaseMetrics = async (phaseId: string) => {
    try {
      // Calculate actual cost from materials
      const { data: materialData, error: materialError } = await supabase
        .from('project_materials')
        .select(`
          quantity,
          material:materials(price_per_unit)
        `)
        .eq('phase_id', phaseId);

      if (materialError) throw materialError;

      const materialCost = materialData?.reduce((sum, pm) => 
        sum + (pm.quantity * (pm.material?.price_per_unit || 0)), 0
      ) || 0;

      // Calculate cost from employees
      const { data: employeeData, error: employeeError } = await supabase
        .from('phase_employees')
        .select('*')
        .eq('phase_id', phaseId);

      if (employeeError) throw employeeError;

      const employeeCost = employeeData?.reduce((sum, emp) => {
        const dailyRate = emp.daily_rate || 0;
        const startDate = emp.start_date ? new Date(emp.start_date) : null;
        const endDate = emp.end_date ? new Date(emp.end_date) : null;
        
        if (startDate && endDate) {
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return sum + (dailyRate * diffDays);
        }
        return sum;
      }, 0) || 0;

      setActualCost(materialCost + employeeCost);
      setMaterialsCount(materialData?.length || 0);
      setEmployeesCount(employeeData?.length || 0);

    } catch (error) {
      console.error('Error calculating phase metrics:', error);
    }
  };

  useEffect(() => {
    const loadPhase = async () => {
      if (!projectId || !phaseId) return;
      
      try {
        setLoading(true);
        const phases = await PhaseService.loadProjectPhases(projectId);
        const foundPhase = phases.find(p => p.id === phaseId);
        
        if (foundPhase) {
          setPhase(foundPhase);
          // Calculate actual metrics from database
          await calculatePhaseMetrics(phaseId);
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
              Coût réel: {actualCost.toLocaleString()} MRU
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="planning" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span className="hidden sm:inline">Planning</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-1">
            <Target className="h-3 w-3" />
            <span className="hidden sm:inline">Jalons</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span className="hidden sm:inline">Matériaux</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="hidden sm:inline">Équipe</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            <span className="hidden sm:inline">Tâches</span>
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span className="hidden sm:inline">Suivi</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
            {/* Phase Status Integration */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Statut Phase Actuelle</h4>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(phase.status)}>{getStatusIcon(phase.status)} {phase.status}</Badge>
                    <span className="text-sm">Progression: {phase.progress}%</span>
                    <span className="text-sm">Étape CPMP: 3/5</span>
                  </div>
            </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Materials Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Matériaux requis ({materialsCount})
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
                  Ressources humaines ({employeesCount})
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

        {/* Planning Tab with PERT/GANTT Integration */}
        <TabsContent value="planning" className="space-y-6">
          <Tabs defaultValue="gantt" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gantt">Diagramme Gantt</TabsTrigger>
              <TabsTrigger value="pert">Analyse PERT</TabsTrigger>
              <TabsTrigger value="critical">Chemin Critique</TabsTrigger>
            </TabsList>

            <TabsContent value="gantt">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Gantt - Phase {phase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GanttChart projectId={projectId!} phaseId={phaseId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pert">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Analyse PERT - Estimation des durées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PERTDiagram projectId={projectId!} phaseId={phaseId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="critical">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Chemin Critique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CriticalPathView projectId={projectId!} phaseId={phaseId} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <PhaseMilestones phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="materials">
          <PhaseMaterials phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="team">
          <PhaseEmployees phaseId={phaseId!} />
        </TabsContent>

        <TabsContent value="documents">
          <PhaseDocuments phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="tasks">
          <PhaseTasks phaseId={phaseId!} projectId={projectId!} />
        </TabsContent>

        <TabsContent value="monitoring">
          <div className="space-y-6">
            <PhasePayments phaseId={phaseId!} projectId={projectId!} />
            <PhaseInspections phaseId={phaseId!} projectId={projectId!} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhaseDetail;