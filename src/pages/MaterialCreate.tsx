
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import MainNavbar from '@/components/MainNavbar';
import Footer from '@/components/Footer';

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
  price_per_unit: z.number().nonnegative().default(0),
  available_quantity: z.number().nonnegative().default(0),
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
      });

      if (error) {
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

  // Helper function to translate text (t)
  const t = (key: string) => translateLabel(key);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MainNavbar />
      <div className="container mx-auto py-12 flex-grow">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('materials.create.title')}</CardTitle>
            <CardDescription>{t('materials.create.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          placeholder={t('materials.availableQuantityPlaceholder')} 
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
                  name="origin_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('materials.originLocation')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('materials.originLocationPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Latitude and Longitude fields */}
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

                {/* Map integration */}
                <div className="mb-4">
                  <Label>{t('materials.selectLocation')}</Label>
                  <div className="mt-2">
                    <ProjectMap
                      height="300px"
                      width="100%"
                      selectable={true}
                      onLocationSelect={handleSelectLocation}
                      interactive={true}
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
                    <div className="mt-2 text-sm text-gray-600">
                      {t('materials.selectedLocation')}: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting}>
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
