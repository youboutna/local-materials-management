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
import ProjectMap, { MapLocation, ProjectStatus } from '@/components/ProjectMap';
import MaterialFormSection from '@/components/MaterialFormSection'; 
import { supabase } from '@/integrations/supabase/client';
import ProgressIndicator from '@/components/ProgressIndicator';
import { useLanguage } from '@/contexts/LanguageContext';

// Interface for selected materials
interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

const ProjectCreate = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("form");
  const { createProject } = useProjects();
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  
  // Form schema using Zod
  const formSchema = z.object({
    title: z.string().min(3, {
      message: t("project_create.validation.title"),
    }),
    description: z.string().min(10, {
      message: t("project_create.validation.description"),
    }),
    location: z.string().min(2, {
      message: t("project_create.validation.location"),
    }),
    status: z.enum(["en cours", "terminé", "en attente", "suspendu", "annulé"], {
      required_error: t("project_create.validation.status"),
    }),
    progress: z.coerce.number().min(0).max(100, {
      message: t("project_create.validation.progress"),
    }),
    budget: z.coerce.number().min(1, {
      message: t("project_create.validation.budget"),
    }),
    teamSize: z.coerce.number().min(1, {
      message: t("project_create.validation.team_size"),
    }),
    startDate: z.string().min(1, {
      message: t("project_create.validation.start_date"),
    }),
    coordinates: z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).optional(),
  });

  // Form definition using react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      status: "en attente",
      progress: 0,
      budget: 0,
      teamSize: 1,
      startDate: new Date().toISOString().split('T')[0],
      coordinates: undefined,
    },
  });

  // Map location state
  const [mapLocation, setMapLocation] = useState<MapLocation | null>(null);

  // Handle location selection from map
  const handleLocationSelect = (latitude: number, longitude: number) => {
    form.setValue("coordinates", { 
      latitude: latitude,
      longitude: longitude
    });
    
    setMapLocation({
      id: "new-project",
      name: form.getValues("title") || t("project_create.default_project_name"),
      type: "project",
      latitude: latitude,
      longitude: longitude,
      status: form.getValues("status") as ProjectStatus,
      region: form.getValues("location") || "",
      startDate: form.getValues("startDate") || new Date().toISOString().split('T')[0]
    });

    toast({
      title: t("project_create.toast.position_selected"),
      description: `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`,
    });
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleLocationSelect(latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: t("project_create.toast.geolocation_error"),
            description: t("project_create.toast.geolocation_unavailable"),
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: t("project_create.toast.geolocation_not_supported"),
        description: t("project_create.toast.geolocation_not_supported_desc"),
        variant: "destructive",
      });
    }
  };

  // Handle materials selection change
  const handleMaterialsChange = (materials: SelectedMaterial[]) => {
    setSelectedMaterials(materials);
    console.log("Materials updated:", materials);
  };

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // Prepare coordinates for the API
      const projectCoordinates = values.coordinates && 
        values.coordinates.latitude !== undefined && 
        values.coordinates.longitude !== undefined ? {
        latitude: values.coordinates.latitude,
        longitude: values.coordinates.longitude
      } : undefined;
      
      // Create the new project
      const projectResult = await createProject({
        title: values.title,
        description: values.description,
        location: values.location,
        status: values.status as 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé',
        progress: values.progress,
        budget: values.budget,
        startDate: values.startDate,
        thumbnail: '/img/project-placeholder.jpg',
        teamSize: values.teamSize,
        coordinates: projectCoordinates
      });
      
      // If project creation was successful and we have materials
      if (projectResult && selectedMaterials.length > 0) {
        console.log("Adding materials to project:", selectedMaterials);
        
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
            title: t("project_create.toast.materials_error"),
            description: t("project_create.toast.materials_error_desc"),
            variant: "destructive",
          });
        } else {
          console.log("Materials successfully added to project");
        }
      }
      
      toast({
        title: t("project_create.toast.created"),
        description: t("project_create.toast.created_desc", { title: values.title }),
      });
      
      navigate('/projects');
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: t("project_create.toast.error"),
        description: t("project_create.toast.error_desc"),
        variant: "destructive",
      });
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
              {t("project_create.back_to_projects")}
            </Button>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-xl shadow-elegant p-6 mb-8">
              <h1 className="text-2xl font-serif text-adrar-800 mb-6">{t("project_create.title")}</h1>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="form">{t("project_create.tabs.form")}</TabsTrigger>
                  <TabsTrigger value="materials">{t("project_create.tabs.materials")}</TabsTrigger>
                  <TabsTrigger value="map">{t("project_create.tabs.map")}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="form">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("project_create.form.title")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("project_create.form.title_placeholder")} {...field} />
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
                            <FormLabel>{t("project_create.form.description")}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t("project_create.form.description_placeholder")} 
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
                              <FormLabel>{t("project_create.form.location")}</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input placeholder={t("project_create.form.location_placeholder")} {...field} />
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
                              <FormLabel>{t("project_create.form.status")}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t("project_create.form.status_placeholder")} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="en attente">{t("project_create.status.pending")}</SelectItem>
                                  <SelectItem value="en cours">{t("project_create.status.ongoing")}</SelectItem>
                                  <SelectItem value="terminé">{t("project_create.status.completed")}</SelectItem>
                                  <SelectItem value="suspendu">{t("project_create.status.suspended")}</SelectItem>
                                  <SelectItem value="annulé">{t("project_create.status.cancelled")}</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="progress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("project_create.form.progress")}</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                placeholder={t("project_create.form.progress_placeholder")} 
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t("project_create.form.progress_desc")}
                            </FormDescription>
                            {field.value && (
                              <div className="mt-2">
                                <ProgressIndicator value={Number(field.value)} />
                                <p className="text-sm text-gray-600 mt-1">
                                  {t("project_create.form.progress_current", { value: field.value })}
                                </p>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("project_create.form.budget")}</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" step="1000" placeholder={t("project_create.form.budget_placeholder")} {...field} />
                              </FormControl>
                              <FormDescription>{t("project_create.form.budget_desc")}</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="teamSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("project_create.form.team_size")}</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" placeholder={t("project_create.form.team_size_placeholder")} {...field} />
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
                            <FormLabel>{t("project_create.form.start_date")}</FormLabel>
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
                              <FormLabel>{t("project_create.form.latitude")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.000001"
                                  placeholder={t("project_create.form.latitude_placeholder")} 
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
                                  {t("project_create.form.select_on_map")}
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
                              <FormLabel>{t("project_create.form.longitude")}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.000001"
                                  placeholder={t("project_create.form.longitude_placeholder")} 
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
                          {t("project_create.form.add_materials")}
                        </Button>
                        
                        <Button 
                          type="submit" 
                          className="bg-terracotta-500 hover:bg-terracotta-600"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? t("project_create.form.creating") : t("project_create.form.create")}
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
                      projectBudget={form.getValues("budget")}
                    />
                    
                    <div className="flex justify-between mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("form")}
                      >
                        {t("project_create.materials.back_to_form")}
                      </Button>
                      
                      <Button 
                        type="button" 
                        className="bg-terracotta-500 hover:bg-terracotta-600"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? t("project_create.form.creating") : t("project_create.form.create")}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="map">
                  <div className="mb-4">
                    <p className="text-adrar-600 mb-4">
                      {t("project_create.map.click_hint")}
                    </p>
                    
                    <div className="flex gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleGetCurrentLocation}
                        className="flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        {t("project_create.map.my_position")}
                      </Button>
                    </div>
                    
                    <div className="h-[500px] mb-4">
                      <ProjectMap 
                        locations={mapLocation ? [mapLocation] : []}
                        selectable={true}
                        onLocationSelect={handleLocationSelect}
                        interactive={true}
                        height="500px"
                        defaultCenter={[18.079052, -15.965634]}
                        defaultZoom={6}
                      />
                    </div>
                    
                    {form.getValues("coordinates")?.latitude && form.getValues("coordinates")?.longitude && (
                      <div className="bg-gray-100 p-3 rounded-lg mb-4">
                        <p className="text-sm font-medium">{t("project_create.map.selected_position")}</p>
                        <p className="text-sm">
                          {t("project_create.map.latitude")}: {form.getValues("coordinates")?.latitude?.toFixed(6)}, 
                          {t("project_create.map.longitude")}: {form.getValues("coordinates")?.longitude?.toFixed(6)}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("form")}
                      >
                        {t("project_create.map.back_to_form")}
                      </Button>
                      
                      <Button 
                        type="button" 
                        className="bg-terracotta-500 hover:bg-terracotta-600"
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? t("project_create.form.creating") : t("project_create.form.create")}
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
