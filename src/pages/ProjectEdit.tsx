import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProjects } from '@/hooks/projects/useProjects';
import { ProjectData } from '@/components/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ArrowLeft, Save, MapPin } from 'lucide-react';

// Form validation schema
const projectSchema = z.object({
  title: z.string().min(3, 'Le titre doit comporter au moins 3 caractères'),
  description: z.string().min(10, 'La description doit comporter au moins 10 caractères'),
  location: z.string().min(2, 'La localisation est requise'),
  status: z.enum(['en cours', 'terminé', 'en attente', 'payé', 'en inspection', 'suspendu', 'annulé']),
  progress: z.number().min(0).max(100),
  budget: z.number().positive('Le budget doit être positif'),
  startDate: z.string(),
  endDate: z.string().optional(),
  teamSize: z.number().int().positive('Le nombre de membres doit être positif'),
  // Use a more flexible coordinates schema that allows null values
  coordinates: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional()
  }).optional().nullable()
});

// Define the type for our form values
type ProjectFormValues = z.infer<typeof projectSchema>;

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { getProject, updateProject } = useProjects();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Set up form with validation
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      status: 'en cours',
      progress: 0,
      budget: 0,
      startDate: '',
      endDate: undefined,
      teamSize: 1,
      coordinates: null
    }
  });

  // Load project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      
      try {
        const projectData = await getProject(id);
        if (projectData) {
          // Set form values
          form.reset({
            title: projectData.title,
            description: projectData.description,
            location: projectData.location,
            status: projectData.status,
            progress: projectData.progress,
            budget: projectData.budget,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            teamSize: projectData.teamSize,
            coordinates: projectData.coordinates || null
          });
        } else {
          toast({
            title: "Erreur",
            description: "Projet non trouvé",
            variant: "destructive",
          });
          navigate('/projects');
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les détails du projet",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [id, getProject, navigate, form]);

  // Handle form submission
  const onSubmit = async (data: ProjectFormValues) => {
    if (!id) return;
    
    setSubmitting(true);
    try {
      // Convert the form data to ProjectData format
      const projectDataToUpdate: Partial<ProjectData> = {
        ...data,
        // Handle coordinates explicitly to ensure type compatibility
        coordinates: data.coordinates ? {
          latitude: data.coordinates.latitude ?? 0,
          longitude: data.coordinates.longitude ?? 0
        } : undefined
      };

      const updatedProject = await updateProject(id, projectDataToUpdate);
      if (updatedProject) {
        toast({
          title: "Modifications enregistrées",
          description: "Le projet a été mis à jour avec succès",
        });
        navigate(`/projects/${id}`);
      } else {
        throw new Error("Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-96">
          <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to={`/projects/${id}`} className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux détails du projet
          </Link>
        </Button>
      </div>
      
      {/* Form header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold text-adrar-800 mb-2">Modifier le projet</h1>
        <p className="text-adrar-600">Modifiez les détails du projet et enregistrez les changements</p>
      </div>
      
      {/* Edit form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre du projet</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre du projet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localisation</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Localisation" {...field} />
                        <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-adrar-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en cours">En cours</SelectItem>
                        <SelectItem value="terminé">Terminé</SelectItem>
                        <SelectItem value="en attente">En attente</SelectItem>
                        <SelectItem value="payé">Payé</SelectItem>
                        <SelectItem value="en inspection">En inspection</SelectItem>
                        <SelectItem value="suspendu">Suspendu</SelectItem>
                        <SelectItem value="annulé">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Progress */}
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progression (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Budget */}
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (MRU)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Team size */}
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taille de l'équipe</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Start date */}
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
              
              {/* End date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin (optionnelle)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description détaillée du projet" 
                      className="min-h-32" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Coordinates */}
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
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => {
                          const value = e.target.value ? Number(e.target.value) : undefined;
                          field.onChange(value);
                          
                          // Update the form's coordinates object
                          const currentCoords = form.getValues().coordinates;
                          if (!value && (!currentCoords || !currentCoords.longitude)) {
                            form.setValue('coordinates', null);
                          } else {
                            form.setValue('coordinates', {
                              latitude: value,
                              longitude: currentCoords?.longitude
                            });
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Coordonnée géographique pour la carte
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
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => {
                          const value = e.target.value ? Number(e.target.value) : undefined;
                          field.onChange(value);
                          
                          // Update the form's coordinates object
                          const currentCoords = form.getValues().coordinates;
                          if (!value && (!currentCoords || !currentCoords.latitude)) {
                            form.setValue('coordinates', null);
                          } else {
                            form.setValue('coordinates', {
                              latitude: currentCoords?.latitude,
                              longitude: value
                            });
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Coordonnée géographique pour la carte
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Submit button */}
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                className="bg-terracotta-500 hover:bg-terracotta-600"
                disabled={submitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProjectEdit;
