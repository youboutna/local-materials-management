import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useProjects } from '@/hooks/projects/useProjects';
import ProjectMap from '@/components/ProjectMap';
import { MapLocation } from '@/components/ProjectMap';
import MaterialFormSection from '@/components/MaterialFormSection';
import { supabase } from '@/integrations/supabase/client';

// Interface for selected materials
interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

// Form schema using Zod
const formSchema = z.object({
  title: z.string().min(3, {
    message: "Le titre doit contenir au moins 3 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères.",
  }),
  location: z.string().min(2, {
    message: "Veuillez indiquer un lieu valide.",
  }),
  status: z.enum(["en cours", "terminé", "en attente", "suspendu", "annulé"], {
    required_error: "Veuillez sélectionner un statut.",
  }),
  budget: z.coerce.number().min(1, {
    message: "Le budget doit être un nombre positif.",
  }),
  teamSize: z.coerce.number().min(1, {
    message: "L'équipe doit comporter au moins une personne.",
  }),
  startDate: z.string().min(1, {
    message: "Veuillez sélectionner une date de début.",
  }),
  coordinates: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

const ProjectCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("form");
  const { createProject } = useProjects();
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  
  // Form definition using react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      status: "en attente",
      budget: undefined,
      teamSize: undefined,
      startDate: new Date().toISOString().split('T')[0],
      coordinates: undefined,
    },
  });

  // Map location state
  const [mapLocation, setMapLocation] = useState<MapLocation | null>(null);

  // Handle location selection from map
  const handleLocationSelect = (latitude: number, longitude: number) => {
    // Make sure we're setting coordinates with non-optional values
    form.setValue("coordinates", { 
      latitude: latitude,
      longitude: longitude
    });
    
    setMapLocation({
      id: "new-project",
      name: form.getValues("title") || "Nouveau projet",
      type: "project",
      latitude: latitude,
      longitude: longitude,
      status: form.getValues("status") as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
    });
  };

  // Handle materials selection change
  const handleMaterialsChange = (materials: SelectedMaterial[]) => {
    setSelectedMaterials(materials);
  };

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // Calculate progress based on status
      const progress = values.status === 'terminé' ? 100 : 
                       values.status === 'en cours' ? 25 : 0;
      
      // Prepare coordinates for the API
      const projectCoordinates = values.coordinates ? {
        latitude: values.coordinates.latitude as number,
        longitude: values.coordinates.longitude as number
      } : undefined;
      
      // Create the new project
      const projectResult = await createProject({
        title: values.title,
        description: values.description,
        location: values.location,
        status: values.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: progress,
        budget: values.budget,
        startDate: values.startDate,
        thumbnail: '/img/project-placeholder.jpg',
        teamSize: values.teamSize,
        coordinates: projectCoordinates
      });
      
      // If project creation was successful and we have materials
      if (projectResult && selectedMaterials.length > 0) {
        // Prepare materials for batch insert
        const projectMaterials = selectedMaterials.map(material => ({
          project_id: projectResult.id,
          material_id: material.materialId,
          quantity: material.quantity
        }));
        
        // Insert project materials
        const { error: materialsError } = await supabase
          .from('project_materials')
          .insert(projectMaterials);
        
        if (materialsError) {
          console.error('Error adding materials to project:', materialsError);
          toast({
            title: "Attention",
            description: "Le projet a été créé mais certains matériaux n'ont pas pu être associés.",
            variant: "destructive",
          });
        }
      }
      
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      // Toast notification is already handled in the createProject function
    } finally {
      setIsSubmitting(false);
    }
  }

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
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-xl shadow-elegant p-6 mb-8">
              <h1 className="text-2xl font-serif text-adrar-800 mb-6">Créer un nouveau projet</h1>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="form">Formulaire</TabsTrigger>
                  <TabsTrigger value="materials">Matériaux</TabsTrigger>
                  <TabsTrigger value="map">Carte</TabsTrigger>
                </TabsList>
                
                <TabsContent value="form">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titre du projet</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Restauration du Fort d'Atar" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Décrivez le projet et ses objectifs..." 
                                className="min-h-[100px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lieu</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input placeholder="Ex: Nouakchott" {...field} />
                                  <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Statut</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un statut" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="en attente">En attente</SelectItem>
                                  <SelectItem value="en cours">En cours</SelectItem>
                                  <SelectItem value="terminé">Terminé</SelectItem>
                                  <SelectItem value="suspendu">Suspendu</SelectItem>
                                  <SelectItem value="annulé">Annulé</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget (MRU)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="1000" placeholder="Ex: 5000000" {...field} />
                              </FormControl>
                              <FormDescription>Montant en Ouguiya mauritanien</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="teamSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Taille de l'équipe</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" placeholder="Ex: 12" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de début</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="coordinates.latitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Latitude (optionnelle)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.000001"
                                  placeholder="Ex: 18.079052" 
                                  value={field.value?.toString() || ''}
                                  onChange={(e) => {
                                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                <Button 
                                  variant="link" 
                                  type="button" 
                                  className="h-auto p-0 text-xs"
                                  onClick={() => setActiveTab("map")}
                                >
                                  Sélectionner sur la carte
                                </Button>
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="coordinates.longitude"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Longitude (optionnelle)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.000001"
                                  placeholder="Ex: -15.965634" 
                                  value={field.value?.toString() || ''}
                                  onChange={(e) => {
                                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="flex justify-between pt-4">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab("materials")}
                        >
                          Ajouter des matériaux
                        </Button>
                        
                        <Button 
                          type="submit" 
                          className="bg-terracotta-500 hover:bg-terracotta-600"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="materials">
                  <div className="mb-4">
                    <MaterialFormSection 
                      selectedMaterials={selectedMaterials}
                      onChange={handleMaterialsChange}
                    />
                    
                    <div className="flex justify-between mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("form")}
                      >
                        Retour au formulaire
                      </Button>
                      
                      <Button 
                        type="button" 
                        className="bg-terracotta-500 hover:bg-terracotta-600"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="map">
                  <div className="mb-4">
                    <p className="text-adrar-600 mb-4">
                      Cliquez sur la carte pour sélectionner l'emplacement du projet.
                      Utilisez le bouton <span className="inline-flex items-center mx-1"><Navigation className="h-3 w-3 mr-1" />Position</span> pour utiliser votre position actuelle.
                    </p>
                    
                    <div className="h-[500px] mb-4">
                      <ProjectMap 
                        locations={mapLocation ? [mapLocation] : []}
                        selectable={true}
                        onLocationSelect={handleLocationSelect}
                      />
                    </div>
                    
                    {form.getValues("coordinates")?.latitude && form.getValues("coordinates")?.longitude && (
                      <div className="bg-gray-100 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium">Position sélectionnée:</p>
                        <p className="text-sm">
                          Latitude: {form.getValues("coordinates")?.latitude?.toFixed(6)}, 
                          Longitude: {form.getValues("coordinates")?.longitude?.toFixed(6)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("form")}
                      >
                        Retour au formulaire
                      </Button>
                      
                      <Button 
                        type="button" 
                        className="bg-terracotta-500 hover:bg-terracotta-600"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProjectCreate;
