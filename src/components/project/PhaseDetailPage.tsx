import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, DollarSign, Users, Package, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';

interface PhaseDetail {
  id: string;
  phase_name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  estimated_cost: number;
  progress: number;
  project_id: string;
}

interface PhaseMaterial {
  id: string;
  material_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

interface PhaseTask {
  id: string;
  title: string;
  description: string;
  status: string;
  assigned_to: string;
  due_date: string;
}

const PhaseDetailPage: React.FC = () => {
  const { phaseId } = useParams<{ phaseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [phase, setPhase] = useState<PhaseDetail | null>(null);
  const [materials, setMaterials] = useState<PhaseMaterial[]>([]);
  const [tasks, setTasks] = useState<PhaseTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (phaseId) {
      loadPhaseDetails();
    }
  }, [phaseId]);

  const loadPhaseDetails = async () => {
    try {
      setIsLoading(true);
      
      // Load phase details
      const { data: phaseData, error: phaseError } = await supabase
        .from('project_phases')
        .select('*')
        .eq('id', phaseId)
        .single();

      if (phaseError) {
        throw phaseError;
      }

      setPhase(phaseData);

      // Load related materials and tasks
      await Promise.all([
        loadPhaseMaterials(),
        loadPhaseTasks()
      ]);

    } catch (error) {
      console.error('Error loading phase details:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des détails de la phase',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPhaseMaterials = async () => {
    // Mock data for materials - replace with actual Supabase query
    setMaterials([
      { id: '1', material_name: 'Béton C25/30', quantity: 150, unit: 'm³', unit_price: 120 },
      { id: '2', material_name: 'Acier de construction', quantity: 5000, unit: 'kg', unit_price: 1.2 },
    ]);
  };

  const loadPhaseTasks = async () => {
    // Mock data for tasks - replace with actual Supabase query
    setTasks([
      { id: '1', title: 'Coulage des fondations', description: 'Préparation et coulage du béton', status: 'completed', assigned_to: 'Jean Dupont', due_date: '2025-01-15' },
      { id: '2', title: 'Installation armatures', description: 'Pose des armatures métalliques', status: 'in_progress', assigned_to: 'Marie Martin', due_date: '2025-01-20' },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'in_progress': return 'En cours';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!phase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Phase non trouvée</h2>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au projet
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{phase.phase_name}</h1>
            <p className="text-muted-foreground">{phase.description}</p>
          </div>
        </div>
        <Badge className={getStatusColor(phase.status)}>
          {getStatusLabel(phase.status)}
        </Badge>
      </div>

      {/* Phase Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Durée</p>
                <p className="text-lg font-semibold">
                  {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget</p>
                <p className="text-lg font-semibold">{phase.estimated_cost?.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-indigo-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progression</p>
                <p className="text-lg font-semibold">{phase.progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matériaux</p>
                <p className="text-lg font-semibold">{materials.length} items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression de la phase</span>
              <span className="font-medium">{phase.progress}%</span>
            </div>
            <Progress value={phase.progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Tâches
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Matériaux
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Équipe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Description détaillée</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{phase.description}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tâches de la phase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Assigné à: {task.assigned_to}</span>
                          <span>Échéance: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matériaux nécessaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materials.map((material) => (
                  <div key={material.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{material.material_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {material.quantity} {material.unit} × {material.unit_price}€
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {(material.quantity * material.unit_price).toLocaleString()}€
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Équipe assignée</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fonctionnalité à venir - gestion de l'équipe par phase
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhaseDetailPage;