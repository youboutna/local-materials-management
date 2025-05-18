
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { StatusColors, statusColors } from '@/components/ProjectMap';
import { Badge } from '@/components/ui/badge';

interface Material {
  id: string;
  created_at: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  origin_location: string | null;
  coordinates_latitude?: number | null;
  coordinates_longitude?: number | null;
  image?: string | null;
}

const Materials = () => {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const translateLabel = (key: string): string => {
    const translations: Record<string, string> = {
      'materials.title': 'Matériaux',
      'materials.create': 'Ajouter un matériau',
      'common.search': 'Recherche',
      'materials.searchPlaceholder': 'Rechercher par nom, description, catégorie...',
      'materials.name': 'Nom',
      'materials.category': 'Catégorie',
      'materials.quantity': 'Quantité',
      'materials.location': 'Emplacement',
      'materials.noLocation': 'Pas d\'emplacement',
      'common.actions': 'Actions',
      'common.loading': 'Chargement...',
      'common.confirmation': 'Êtes-vous sûr(e) ?',
      'materials.deleteConfirmation': 'Cette action ne peut pas être annulée. Êtes-vous sûr(e) de vouloir supprimer ce matériau ?',
      'common.cancel': 'Annuler',
      'common.deleting': 'Suppression...',
      'common.delete': 'Supprimer',
      'materials.locationMap': 'Carte des emplacements des matériaux',
      'materials.deleteSuccess': 'Matériau supprimé avec succès.',
      'materials.deleteError': 'Erreur lors de la suppression du matériau.'
    };

    return translations[key] || key;
  };

  // Helper function to translate text (t)
  const t = (key: string) => translateLabel(key);

  const { isLoading, error, data: materials } = useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data as Material[];
    }
  });

const deleteMaterialMutation = useMutation<void, Error, string>({
  mutationFn: async (id: string) => {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['materials']);
    toast({
      title: t('materials.deleteSuccess') || 'Material deleted successfully.',
    });
  },
  onError: (error) => {
    toast({
      title: t('materials.deleteError') || 'Error deleting material.',
      description: error.message,
      variant: 'destructive',
    });
  },
});


  const filteredMaterials = materials
    ? materials.filter(material =>
        material.name.toLowerCase().includes(search.toLowerCase()) ||
        material.description.toLowerCase().includes(search.toLowerCase()) ||
        material.category.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Make sure to handle the possibility that coordinates might not exist
  const mapLocations = materials ? materials.map(material => ({
    id: material.id,
    name: material.name,
    type: 'material' as const,
    latitude: material.coordinates_latitude || 0, // Default value if coordinates are missing
    longitude: material.coordinates_longitude || 0,
    region: material.origin_location || undefined
  })).filter(loc => loc.latitude !== 0 && loc.longitude !== 0) : []; // Filter out items without coordinates

  if (isLoading) return <div>{t('common.loading') || 'Loading...'}</div>;

  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('materials.title') || 'Materials'}</h1>
        <Link to="/materials/create">
          <Button><Plus className="mr-2 h-4 w-4" />{t('materials.create') || 'Add Material'}</Button>
        </Link>
      </div>

      <div className="mb-4">
        <Label htmlFor="search">{t('common.search') || 'Search'}:</Label>
        <Input
          type="text"
          id="search"
          placeholder={t('materials.searchPlaceholder') || 'Search by name, description, category...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Materials Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">{t('materials.name') || 'Name'}</TableHead>
                <TableHead>{t('materials.category') || 'Category'}</TableHead>
                <TableHead>{t('materials.quantity') || 'Quantity'}</TableHead>
                <TableHead>{t('materials.location') || 'Location'}</TableHead>
                <TableHead className="text-right">{t('common.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{material.category}</TableCell>
                  <TableCell>{material.available_quantity} {material.unit}</TableCell>
                  <TableCell>{material.origin_location || t('materials.noLocation') || 'No Location'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/materials/edit/${material.id}`}>
                        <Button variant="secondary" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('common.confirmation') || 'Are you absolutely sure?'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('materials.deleteConfirmation') || 'This action cannot be undone. Are you sure you want to delete this material?'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel') || 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMaterialMutation.mutate(material.id)}
                              disabled={deleteMaterialMutation.isLoading}
                            >
                              {deleteMaterialMutation.isLoading ? t('common.deleting') || 'Deleting...' : t('common.delete') || 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Material Location Map */}
        <div>
          <h2 className="text-lg font-semibold mb-2">{t('materials.locationMap') || 'Material Location Map'}</h2>
          {filteredMaterials.map((material) => (
            <div key={material.id} className="mb-4 p-4 border rounded-md">
              <h3 className="font-medium">{material.name}</h3>
              <p className="text-sm text-gray-600">{material.description}</p>
              <p className="text-sm">
                {t('materials.category')}: {material.category}
              </p>
              <p className="text-sm">
                {t('materials.quantity')}: {material.available_quantity} {material.unit}
              </p>
              <p className="text-sm">
                {t('materials.location')}: {material.origin_location || t('materials.noLocation') || 'No Location'}
              </p>
              {material.coordinates_latitude && material.coordinates_longitude ? (
                <MapContainer 
                  className="h-32 w-full rounded overflow-hidden"
                  center={[material.coordinates_latitude, material.coordinates_longitude]} 
                  zoom={13}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[material.coordinates_latitude, material.coordinates_longitude]}></Marker>
                </MapContainer>
              ) : (
                <div className="h-32 w-full bg-gray-100 rounded flex items-center justify-center text-gray-500">
                  Pas de localisation
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Materials;
