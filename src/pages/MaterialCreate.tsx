import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
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
import { useToast } from "@/hooks/use-toast";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectMap, { MapLocation } from '@/components/ProjectMap'; 
import { supabase } from '@/integrations/supabase/client';

// Form schema using Zod
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Le nom doit contenir au moins 3 caractères.",
  }),
  description: z.string().min(10, {
    message: "La description doit contenir au moins 10 caractères.",
  }),
  category: z.string().min(2, {
    message: "Veuillez indiquer une catégorie valide.",
  }),
  unit: z.string().min(1, {
    message: "Veuillez indiquer une unité de mesure.",
  }),
  price_per_unit: z.coerce.number().optional(),
  available_quantity: z.coerce.number().optional(),
  origin_location: z.string().optional(),
  coordinates: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

const MaterialCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();
  
  // Map location state
  const [mapLocation, setMapLocation] = useState<MapLocation | null>(null);
  
  // Form definition using react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      unit: "m²",
      price_per_unit: undefined,
      available_quantity: undefined,
      origin_location: "",
      coordinates: undefined,
    },
  });
  
  // Handle location selection from map
  const handleLocationSelect = (latitude: number, longitude: number) => {
    form.setValue("coordinates", { 
      latitude, 
      longitude 
    });
    
    setMapLocation({
      id: "new-material",
      name: form.getValues("name") || "Nouveau matériau",
      type: "material",
      latitude,
      longitude
    });
  };
  
  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // Prepare material data
      const materialData = {
        name: values.name,
        description: values.description,
        category: values.category,
        unit: values.unit,
        price_per_unit: values.price_per_unit,
        available_quantity: values.available_quantity,
        origin_location: values.origin_location,
        // Handle coordinates
        coordinates_latitude: values.coordinates?.latitude,
        coordinates_longitude: values.coordinates?.longitude
      };
      
      // Insert into database
      const { data, error } = await supabase
        .from('materials')
        .insert([materialData])
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Matériau créé",
        description: `Le matériau "${values.name}" a été créé avec succès.`
      });
      
      // Navigate back to materials list
      navigate('/materials');
    } catch (error: any) {
      console.error("Error creating material:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du matériau.",
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
          <Link to="/materials">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux matériaux
            </Button>
          </Link>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-elegant p-6 mb-8">
              <h1 className="text-2xl font-serif font-bold text-adrar-800 mb-6">Ajouter un nouveau matériau</h1>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="basic">Informations</TabsTrigger>
                  <TabsTrigger value="pricing">Prix & Stock</TabsTrigger>
                  <TabsTrigger value="location">Origine</TabsTrigger>
                </TabsList>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <TabsContent value="basic" className="space-y-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom du matériau</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Ciment Portland" {...field} />
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
                                placeholder="Description du matériau et ses caractéristiques..." 
                                className="min-h-[100px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Catégorie</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une catégorie" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Ciment">Ciment</SelectItem>
                                <SelectItem value="Bois">Bois</SelectItem>
                                <SelectItem value="Métal">Métal</SelectItem>
                                <SelectItem value="Pierre">Pierre</SelectItem>
                                <SelectItem value="Sable">Sable</SelectItem>
                                <SelectItem value="Peinture">Peinture</SelectItem>
                                <SelectItem value="Verre">Verre</SelectItem>
                                <SelectItem value="Plomberie">Plomberie</SelectItem>
                                <SelectItem value="Électricité">Électricité</SelectItem>
                                <SelectItem value="Autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-4 flex justify-end">
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab("pricing")}
                          className="bg-terracotta-500 hover:bg-terracotta-600"
                        >
                          Suivant
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="pricing" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="price_per_unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prix unitaire (MRU)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Ex: 1000" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Prix en Ouguiya mauritanien
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="available_quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantité disponible</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Ex: 100" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unité de mesure</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une unité" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="m²">m² (mètre carré)</SelectItem>
                                <SelectItem value="m³">m³ (mètre cube)</SelectItem>
                                <SelectItem value="kg">kg (kilogramme)</SelectItem>
                                <SelectItem value="tonne">tonne</SelectItem>
                                <SelectItem value="litre">litre</SelectItem>
                                <SelectItem value="unité">unité</SelectItem>
                                <SelectItem value="sac">sac</SelectItem>
                                <SelectItem value="palette">palette</SelectItem>
                                <SelectItem value="rouleau">rouleau</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-4 flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab("basic")}
                        >
                          Précédent
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab("location")}
                          className="bg-terracotta-500 hover:bg-terracotta-600"
                        >
                          Suivant
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="location">
                      <FormField
                        control={form.control}
                        name="origin_location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lieu d'origine</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input placeholder="Ex: Nouakchott" {...field} />
                                <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Ville, région ou pays d'origine du matériau
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="mt-6">
                        <p className="text-sm text-gray-600 mb-4">
                          Vous pouvez également sélectionner l'emplacement d'origine sur la carte ci-dessous (optionnel).
                        </p>
                        
                        <div className="h-[300px] mb-4">
                          <ProjectMap 
                            locations={mapLocation ? [mapLocation] : []}
                            selectable={true}
                            onLocationSelect={handleLocationSelect}
                            interactive={true}
                          />
                        </div>
                        
                        {form.getValues("coordinates")?.latitude && form.getValues("coordinates")?.longitude && (
                          <div className="bg-gray-100 p-3 rounded-lg mb-4">
                            <p className="text-sm font-medium">Position sélectionnée:</p>
                            <p className="text-sm">
                              Latitude: {form.getValues("coordinates")?.latitude.toFixed(6)}, 
                              Longitude: {form.getValues("coordinates")?.longitude.toFixed(6)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab("pricing")}
                        >
                          Précédent
                        </Button>
                        
                        <Button 
                          type="submit" 
                          className="bg-terracotta-500 hover:bg-terracotta-600"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Création en cours..." : "Créer le matériau"}
                        </Button>
                      </div>
                    </TabsContent>
                  </form>
                </Form>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MaterialCreate;
