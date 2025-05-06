
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import ProjectMap from '@/components/ProjectMap';

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
  pricePerUnit: z.coerce.number().min(0, {
    message: "Le prix par unité doit être un nombre positif.",
  }),
  availableQuantity: z.coerce.number().min(0, {
    message: "La quantité disponible doit être un nombre positif.",
  }),
  originLocation: z.string().optional(),
  coordinates: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
});

const MaterialCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form definition using react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      unit: "",
      pricePerUnit: 0,
      availableQuantity: 0,
      originLocation: "",
      coordinates: undefined,
    },
  });

  // Map location state
  const [mapLocation, setMapLocation] = useState<any | null>(null);

  // Handle location selection from map
  const handleLocationSelect = (latitude: number, longitude: number) => {
    // Update form values with selected coordinates
    form.setValue("coordinates", { 
      latitude: latitude,
      longitude: longitude
    });
    
    // Update the map marker
    setMapLocation({
      id: "new-material",
      name: form.getValues("name") || "Nouvelle source de matériau",
      type: "material",
      latitude: latitude,
      longitude: longitude
    });
  };

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // Prepare the material data for Supabase
      const materialData = {
        name: values.name,
        description: values.description,
        category: values.category,
        unit: values.unit,
        price_per_unit: values.pricePerUnit,
        available_quantity: values.availableQuantity,
        origin_location: values.originLocation,
        // Add coordinates to the origin_location if provided
        coordinates_latitude: values.coordinates?.latitude,
        coordinates_longitude: values.coordinates?.longitude,
      };
      
      // Insert the material into the database
      const { data, error } = await supabase
        .from('materials')
        .insert(materialData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Matériau créé",
        description: `Le matériau ${values.name} a été créé avec succès.`,
      });
      
      // Redirect to materials page
      navigate('/materials');
    } catch (error: any) {
      console.error('Error creating material:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de la création du matériau.",
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
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-xl shadow-elegant p-6 mb-8">
              <h1 className="text-2xl font-serif text-adrar-800 mb-6">Ajouter un nouveau matériau</h1>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du matériau</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Pierre d'Atar" {...field} />
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
                            placeholder="Décrivez le matériau et ses caractéristiques..." 
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
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une catégorie" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pierre">Pierre</SelectItem>
                                <SelectItem value="Sable">Sable</SelectItem>
                                <SelectItem value="Argile">Argile</SelectItem>
                                <SelectItem value="Bois">Bois</SelectItem>
                                <SelectItem value="Métal">Métal</SelectItem>
                                <SelectItem value="Autre">Autre</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unité de mesure</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez une unité" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">Kilogramme (kg)</SelectItem>
                                <SelectItem value="t">Tonne (t)</SelectItem>
                                <SelectItem value="m3">Mètre cube (m³)</SelectItem>
                                <SelectItem value="m2">Mètre carré (m²)</SelectItem>
                                <SelectItem value="m">Mètre (m)</SelectItem>
                                <SelectItem value="unité">Unité</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="pricePerUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix par unité (MRU)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              placeholder="Ex: 5000" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Prix en Ouguiya mauritanien</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="availableQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantité disponible</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              placeholder="Ex: 1000" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="originLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lieu d'origine</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Carrière d'Atar" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Emplacement sur la carte</h3>
                    <p className="text-sm text-adrar-600">
                      Cliquez sur la carte pour indiquer l'emplacement de cette source de matériau.
                    </p>
                    
                    <div className="h-[300px] border border-gray-200 rounded-lg overflow-hidden">
                      <ProjectMap
                        locations={mapLocation ? [mapLocation] : []}
                        selectable={true}
                        onLocationSelect={handleLocationSelect}
                      />
                    </div>
                    
                    {form.getValues("coordinates")?.latitude && form.getValues("coordinates")?.longitude && (
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <p className="text-sm font-medium">Position sélectionnée:</p>
                        <p className="text-sm">
                          Latitude: {form.getValues("coordinates")?.latitude?.toFixed(6)}, 
                          Longitude: {form.getValues("coordinates")?.longitude?.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      className="bg-terracotta-500 hover:bg-terracotta-600"
                      disabled={isSubmitting}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Création en cours...' : 'Créer le matériau'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MaterialCreate;
