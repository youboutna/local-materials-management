import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, User, Percent, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProjects } from '@/hooks/projects/useProjects';
import ProjectMap from '@/components/ProjectMap';
import { ProjectStatusCard } from '@/components/project/ProjectStatusCard';
import { PaymentDialog } from '@/components/project/PaymentDialog';
import { PaymentHistory } from '@/components/project/PaymentHistory';
import { InspectionReportCard } from '@/components/project/InspectionReportCard';
import { InspectionsList } from '@/components/project/InspectionsList';
import { InspectionDialog } from '@/components/project/InspectionDialog';
import { useProjectPayments } from '@/hooks/useProjectPayments';
import { supabase } from '@/integrations/supabase/client';
import { ProjectWithPayments, Payment, Inspection } from '@/types/project';
import StatusBadge from '@/components/StatusBadge';

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getProject, deleteProject } = useProjects();
  const [project, setProject] = useState<ProjectWithPayments | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const { fetchPayments } = useProjectPayments(id || "");
  const [projectMaterials, setProjectMaterials] = useState<any[]>([]);
  
  // Add a refreshProjectData function to update the data after creating an inspection
  const refreshProjectData = async () => {
    if (!id) return;
    
    try {
      const projectData = await getProject(id);
      
      if (!projectData) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails du projet.",
          variant: "destructive",
        });
        return;
      }
      
      let payments: Payment[] = [];
      try {
        const fetchedPayments = await fetchPayments();
        payments = fetchedPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          payment_date: p.payment_date,
          payment_method: p.payment_method,
          progress_at_payment: p.progress_at_payment,
          transaction_id: p.transaction_id
        }));
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
      
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', id)
        .order('date', { ascending: false });
      
      if (inspectionsError) {
        console.error("Error fetching inspections:", inspectionsError);
      }
      
      const inspections = inspectionsData ? inspectionsData.map((item: any) => ({
        id: item.id,
        date: item.date,
        status: item.status,
        inspector: item.inspector,
        progress_at_inspection: item.progress_at_inspection,
        comments: item.comments,
        documents: item.documents
      })) : [];
      
      const { data: materials, error: materialsError } = await supabase
        .from('project_materials')
        .select(`
          id, quantity,
          material:material_id (id, name, unit, price_per_unit, available_quantity, category)
        `)
        .eq('project_id', id);
      
      if (materialsError) {
        console.error("Error fetching project materials:", materialsError);
      }
      
      setProject({
        ...projectData,
        payments,
        inspections
      });
      
      if (materials) {
        setProjectMaterials(materials);
      }
    } catch (error) {
      console.error("Error loading project data:", error);
    }
  };
  
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        toast({
          title: "Erreur",
          description: "ID du projet non trouvé",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const projectData = await getProject(id);
        
        if (!projectData) {
          toast({
            title: "Erreur",
            description: "Impossible de charger les détails du projet.",
            variant: "destructive",
          });
          return;
        }
        
        let payments: Payment[] = [];
        try {
          const fetchedPayments = await fetchPayments();
          payments = fetchedPayments.map(p => ({
            id: p.id,
            amount: p.amount,
            payment_date: p.payment_date,
            payment_method: p.payment_method,
            progress_at_payment: p.progress_at_payment,
            transaction_id: p.transaction_id
          }));
        } catch (error) {
          console.error("Error fetching payments:", error);
        }
        
        const { data: inspectionsData, error: inspectionsError } = await supabase
          .from('inspections')
          .select('*')
          .eq('project_id', id)
          .order('date', { ascending: false });
        
        if (inspectionsError) {
          console.error("Error fetching inspections:", inspectionsError);
        }
        
        const inspections = inspectionsData ? inspectionsData.map((item: any) => ({
          id: item.id,
          date: item.date,
          status: item.status,
          inspector: item.inspector,
          progress_at_inspection: item.progress_at_inspection,
          comments: item.comments,
          documents: item.documents
        })) : [];
        
        const { data: materials, error: materialsError } = await supabase
          .from('project_materials')
          .select(`
            id, quantity,
            material:material_id (id, name, unit, price_per_unit, available_quantity, category)
          `)
          .eq('project_id', id);
        
        if (materialsError) {
          console.error("Error fetching project materials:", materialsError);
        }
        
        setProject({
          ...projectData,
          payments,
          inspections
        });
        
        if (materials) {
          setProjectMaterials(materials);
        }
      } catch (error) {
        console.error("Error loading project data:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des données du projet.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [id, getProject, toast, fetchPayments]);
  
  const handleDelete = async () => {
    if (!project || !window.confirm("Êtes-vous sûr de vouloir supprimer ce projet?")) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteProject(project.id);
      if (success) {
        window.location.href = "/projects";
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le projet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du projet.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="h-screen flex items-center justify-center">
              <div className="animate-pulse text-xl text-gray-500">Chargement du projet...</div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="h-screen flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold mb-4">Projet non trouvé</h1>
              <p className="mb-6 text-gray-600">Le projet que vous recherchez n'existe pas ou a été supprimé.</p>
              <Link to="/projects">
                <Button>Retour à la liste des projets</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  const totalMaterialsCost = projectMaterials.reduce((total, item) => {
    return total + (item.quantity * (item.material?.price_per_unit || 0));
  }, 0);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Back button */}
          <Link to="/projects">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux projets
            </Button>
          </Link>
          
          {/* Project header */}
          <div className="bg-white rounded-xl shadow-elegant p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-serif font-bold text-adrar-900">{project?.title}</h1>
                <p className="text-lg text-muted-foreground mt-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {project?.location}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Link to={`/projects/edit/${project?.id}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  className="flex items-center gap-2"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
                
                {project && <PaymentDialog project={project} />}
                {project && <InspectionDialog project={project} onInspectionCreated={refreshProjectData} />}
              </div>
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="inspections">Inspections</TabsTrigger>
                <TabsTrigger value="payments">Paiements</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Card className="mb-6">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Description du projet</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-line">{project?.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Date de début</div>
                              <div className="font-medium">{project?.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Équipe</div>
                              <div className="font-medium">{project?.teamSize} personnes</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <Percent className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Progression</div>
                              <div className="font-medium">{project?.progress}%</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-500">Budget</div>
                              <div className="font-medium">{project?.budget.toLocaleString()} MRU</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {project && <ProjectStatusCard project={project} />}
                    {project && (
                      <div className="mt-6">
                        <InspectionReportCard project={project} />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {project?.coordinates && (
                      <Card className="mb-6">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Localisation</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] rounded-md overflow-hidden">
                            <ProjectMap 
                              locations={[{
                                id: project.id,
                                name: project.title,
                                latitude: project.coordinates.latitude,
                                longitude: project.coordinates.longitude,
                                type: 'project',
                                status: project.status,
                                region: project.location,
                                startDate: project.startDate
                              }]} 
                              interactive={true} 
                            />
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            Coordonnées: {project.coordinates.latitude.toFixed(6)}, {project.coordinates.longitude.toFixed(6)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Matériaux du projet</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {projectMaterials.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            Aucun matériau associé à ce projet
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {projectMaterials.map((item) => (
                              <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded-md border">
                                <div>
                                  <div className="font-medium">{item.material?.name}</div>
                                  <div className="text-sm text-gray-500">
                                    {item.quantity} {item.material?.unit} × {item.material?.price_per_unit.toLocaleString()} MRU
                                  </div>
                                </div>
                                <div className="font-medium">
                                  {(item.quantity * item.material?.price_per_unit).toLocaleString()} MRU
                                </div>
                              </div>
                            ))}
                            
                            <div className="flex justify-between pt-3 border-t mt-4">
                              <div className="font-medium">Coût total des matériaux</div>
                              <div className="font-bold text-lg">{totalMaterialsCost.toLocaleString()} MRU</div>
                            </div>
                            
                            <div className="mt-1 text-sm text-gray-500 text-right">
                              {project?.budget > 0 && (
                                <>
                                  {((totalMaterialsCost / project.budget) * 100).toFixed(1)}% du budget total
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Details Tab */}
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Implement more detailed views here */}
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle>Détails du projet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p>{project?.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* New Inspections Tab */}
              <TabsContent value="inspections" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <InspectionsList projectId={project.id} />
                  </div>
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Informations sur les inspections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium">Processus d'inspection</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Les inspections sont effectuées pour vérifier la qualité et la conformité du projet aux normes établies.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Statuts possibles</h4>
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <StatusBadge status="approuvée" className="w-24" />
                                <span className="text-sm">Le projet répond aux exigences</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status="modifications requises" className="w-24" />
                                <span className="text-sm">Des corrections sont nécessaires</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status="rejetée" className="w-24" />
                                <span className="text-sm">Le projet ne répond pas aux exigences</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusBadge status="en attente" className="w-24" />
                                <span className="text-sm">L'inspection est en attente de révision</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <h4 className="font-medium">Conseils</h4>
                            <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
                              <li>Préparez tous les documents nécessaires avant l'inspection</li>
                              <li>Assurez-vous que le site est accessible et sécurisé</li>
                              <li>Corrigez rapidement les problèmes signalés lors des inspections</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              {/* Payments Tab */}
              <TabsContent value="payments" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <PaymentHistory payments={project.payments} />
                  </div>
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Statistiques financières</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Budget total:</span>
                            <span className="font-medium">{project?.budget.toLocaleString()} MRU</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Coût des matériaux:</span>
                            <span className="font-medium">{totalMaterialsCost.toLocaleString()} MRU</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Total payé:</span>
                            <span className="font-medium">
                              {project.payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} MRU
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="font-medium">Reste à payer:</span>
                            <span className="font-bold text-lg">
                              {(project.budget - project.payments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()} MRU
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectDetail;
