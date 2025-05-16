import React, { useState, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import ProjectMap from '@/components/ProjectMap';
import { MapLocation } from '@/components/ProjectMap';
import { useAuth } from '@/contexts/AuthContext';
import { MainNavbar } from '@/components/MainNavbar';
import { Footer } from '@/components/Footer';

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
  price_per_unit: z.number().optional(),
  available_quantity: z.number().optional(),
  origin_location: z.string().optional(),
  coordinates_latitude: z.number().optional(),
  coordinates_longitude: z.number().optional(),
});

const MaterialCreate = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { user } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      unit: "",
      price_per_unit: 0,
      available_quantity: 0,
      origin_location: "",
      coordinates_latitude: null,
      coordinates_longitude: null,
    },
  });

  async function onSubmit(materialData: z.infer<typeof formSchema>) {
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
        description: materialData.description,
        category: materialData.category,
        unit: materialData.unit,
        price_per_unit: materialData.price_per_unit || 0, // Default to 0 if undefined
        available_quantity: materialData.available_quantity || 0, // Default to 0 if undefined
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

  const showMapLocation = (values: any) => {
    if (values.coordinates_latitude && values.coordinates_longitude) {
      return {
        latitude: values.coordinates_latitude,
        longitude: values.coordinates_longitude
      };
    }
    return null;
  };

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
                        <Input type="number" placeholder={t('materials.pricePerUnitPlaceholder')} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                        <Input type="number" placeholder={t('materials.availableQuantityPlaceholder')} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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

                {/* Map integration */}
                <div className="mb-4">
                  <Label>{t('materials.selectLocation')}</Label>
                  <ProjectMap
                    height="300px"
                    width="100%"
                    selectable={true}
                    onLocationSelect={handleSelectLocation}
                  />
                  {selectedLocation && (
                    <div className="mt-2 text-sm text-gray-600">
                      {t('materials.selectedLocation')}: {selectedLocation.lat}, {selectedLocation.lng}
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
