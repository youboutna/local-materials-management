import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from '@/integrations/supabase/client';
import ProjectMap from '@/components/ProjectMap';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MapPin } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit comporter au moins 2 caractères.",
  }),
  description: z.string().optional(),
  category: z.string().min(1, {
    message: "Veuillez sélectionner une catégorie.",
  }),
  unit: z.string().min(1, {
    message: "Veuillez sélectionner une unité.",
  }),
  price_per_unit: z.coerce.number().nonnegative().default(0),
  available_quantity: z.coerce.number().nonnegative().default(0),
  origin_location: z.string().optional(),
  coordinates_latitude: z.number().nullable().optional(),
  coordinates_longitude: z.number().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const MaterialCreate = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      unit: "",
      price_per_unit: 0,
      available_quantity: 0,
      origin_location: "",
      coordinates_latitude: undefined,
      coordinates_longitude: undefined,
    },
  });

  async function onSubmit(materialData: FormValues) {
    setIsSubmitting(true);
    try {
      if (!user) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être connecté pour créer un matériau.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.from('materials').insert({
        name: materialData.name,
        description: materialData.description || "",
        category: materialData.category,
        unit: materialData.unit,
        price_per_unit: materialData.price_per_unit,
        available_quantity: materialData.available_quantity,
        origin_location: materialData.origin_location || null,
        coordinates_latitude: materialData.coordinates_latitude || null,
        coordinates_longitude: materialData.coordinates_longitude || null
      } as any);

      if (error) {
        console.error('Error creating material:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la création du matériau.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Succès",
          description: "Matériau créé avec succès.",
        });
        navigate('/materials');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSelectLocation = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    form.setValue('coordinates_latitude', lat);
    form.setValue('coordinates_longitude', lng);
    toast({
      title: "Position sélectionnée",
      description: `Coordonnées: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  };

  const translateLabel = (key: string): string => {
    const translations: Record<string, string> = {
      'materials.create.title': 'Créer un nouveau matériau',
      'materials.create.description': 'Ajoutez les détails du nouveau matériau',
      'materials.name': 'Nom',
      'materials.namePlaceholder': 'Nom du matériau',
      'materials.description': 'Description',
      'materials.descriptionPlaceholder': 'Description du matériau',
      'materials.category': 'Catégorie',
      'materials.selectCategory': 'Sélectionner une catégorie',
      'materials.building': 'Construction',
      'materials.electricity': 'Électricité',
      'materials.plumbing': 'Plomberie',
      'materials.furniture': 'Mobilier',
      'materials.unit': 'Unité',
      'materials.selectUnit': 'Sélectionner une unité',
      'materials.kg': 'Kilogramme (kg)',
      'materials.m': 'Mètre (m)',
      'materials.piece': 'Pièce',
      'materials.l': 'Litre (l)',
      'materials.pricePerUnit': 'Prix par unité',
      'materials.pricePerUnitPlaceholder': 'Prix par unité',
      'materials.availableQuantity': 'Quantité disponible',
      'materials.availableQuantityPlaceholder': 'Quantité disponible',
      'materials.originLocation': 'Lieu d\'origine',
      'materials.originLocationPlaceholder': 'Lieu d\'origine',
      'materials.selectLocation': 'Sélectionner un emplacement sur la carte',
      'materials.selectedLocation': 'Emplacement sélectionné',
      'common.submitting': 'Envoi en cours...',
      'common.submit': 'Enregistrer',
    };

    return translations[key] || key;
  };

  const t = (key: string) => translateLabel(key);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto py-12 flex-grow pt-24">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{t('materials.create.title')}</CardTitle>
            <CardDescription>{t('materials.create.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('materials.name')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('materials.namePlaceholder')} {...field} />
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
                        <FormLabel>{t('materials.category')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('materials.selectCategory')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="building">{t('materials.building')}</SelectItem>
                            <SelectItem value="electricity">{t('materials.electricity')}</SelectItem>
                            <SelectItem value="plumbing">{t('materials.plumbing')}</SelectItem>
                            <SelectItem value="furniture">{t('materials.furniture')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('materials.description')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('materials.descriptionPlaceholder')}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Pricing and Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('materials.unit')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('materials.selectUnit')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">{t('materials.kg')}</SelectItem>
                            <SelectItem value="m">{t('materials.m')}</SelectItem>
                            <SelectItem value="piece">{t('materials.piece')}</SelectItem>
                            <SelectItem value="l">{t('materials.l')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price_per_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('materials.pricePerUnit')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder={t('materials.pricePerUnitPlaceholder')} 
                            {...field} 
                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="available_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('materials.availableQuantity')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder={t('materials.availableQuantityPlaceholder')} 
                            {...field} 
                            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location Section */}
                <Card className="border-dashed border-2 border-terracotta-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-terracotta-500" />
                      Localisation du matériau
                    </CardTitle>
                    <CardDescription>
                      Spécifiez l'emplacement géographique où se trouve ce matériau
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="origin_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('materials.originLocation')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('materials.originLocationPlaceholder')} {...field} />
                          </FormControl>
                          <FormDescription>
                            Nom de la ville, région ou description du lieu
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="coordinates_latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="coordinates_longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
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

                    <div className="space-y-2">
                      <FormLabel className="text-base font-medium">
                        Sélectionner la position sur la carte
                      </FormLabel>
                      <FormDescription>
                        Cliquez sur la carte pour sélectionner l'emplacement exact du matériau
                      </FormDescription>
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                        <ProjectMap
                          height="400px"
                          width="100%"
                          selectable={true}
                          onLocationSelect={handleSelectLocation}
                          interactive={true}
                          defaultCenter={[18.079052, -15.965634]}
                          defaultZoom={6}
                          locations={selectedLocation ? [{
                            id: "selected-location",
                            name: form.getValues("name") || "Matériau sélectionné",
                            type: "material" as const,
                            latitude: selectedLocation.lat,
                            longitude: selectedLocation.lng
                          }] : []}
                        />
                      </div>
                      {selectedLocation && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center gap-2 text-sm text-green-800">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Position sélectionnée:</span>
                            <span>
                              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-terracotta-500 hover:bg-terracotta-600">
                  {isSubmitting ? t('common.submitting') : t('common.submit')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default MaterialCreate;
