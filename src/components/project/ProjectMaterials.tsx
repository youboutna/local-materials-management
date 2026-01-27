
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, MapPin, Edit2, Trash2, Calculator } from 'lucide-react';
import { MaterialService } from '@/application/services/MaterialService';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MaterialSelector from '@/components/MaterialSelector';

interface ProjectMaterial {
  id: string;
  quantity: number;
  material: {
    id: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    price_per_unit: number;
    origin_location?: string;
    image?: string;
  };
}

interface SelectedMaterial {
  materialId: string;
  quantity: number;
}

interface ProjectMaterialsProps {
  projectId: string;
  onUpdate?: () => void;
}

const ProjectMaterials = ({ projectId, onUpdate }: ProjectMaterialsProps) => {
  const [materials, setMaterials] = useState<ProjectMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchProjectMaterials = async () => {
    try {
      const projectMaterials = await MaterialService.getProjectMaterials(projectId);
      
      // Transform the data to match our interface
      const transformedMaterials: ProjectMaterial[] = projectMaterials.map(item => ({
        id: item.id,
        quantity: item.quantity,
        material: {
          id: item.materials.id,
          name: item.materials.name,
          description: item.materials.description || '',
          category: item.materials.category || '',
          unit: item.materials.unit || '',
          price_per_unit: item.materials.unit_price || 0,
          origin_location: undefined,
          image: undefined
        }
      }));
      
      setMaterials(transformedMaterials);
    } catch (error) {
      console.error('Error fetching project materials:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les matériaux du projet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const createQuantityTakeoffs = async (materials: SelectedMaterial[]) => {
    try {
      console.log('Creating quantity takeoffs for materials:', materials);
      
      const { supabase } = await import('@/integrations/supabase/client');
      
      const takeoffsToCreate = materials.map(material => ({
        project_id: projectId,
        material_id: material.materialId,
        element_type: 'Standard Element',
        unit: 'unité',
        length: material.quantity,
        width: null,
        height: null,
        note: 'Auto-généré lors de l\'ajout du matériau'
      }));

      const { error } = await supabase
        .from('quantity_takeoffs')
        .insert(takeoffsToCreate);

      if (error) throw error;
      
      console.log('Quantity takeoffs created successfully');
      
      toast({
        title: "Métrés créés",
        description: `${materials.length} métré(s) automatiquement créé(s).`,
      });
    } catch (error) {
      console.error('Error creating quantity takeoffs:', error);
      toast({
        title: "Avertissement",
        description: "Matériaux ajoutés mais métrés non créés automatiquement.",
        variant: "destructive",
      });
    }
  };

  const handleAddMaterials = async () => {
    if (selectedMaterials.length === 0) return;

    try {
      // Add materials using the service
      for (const material of selectedMaterials) {
        await MaterialService.addMaterialToProject(
          projectId,
          material.materialId,
          material.quantity
        );
      }

      // Automatically create quantity takeoffs for the new materials
      await createQuantityTakeoffs(selectedMaterials);

      toast({
        title: "Matériaux ajoutés",
        description: `${selectedMaterials.length} matériau(x) ajouté(s) au projet avec métrés automatiques.`,
      });

      setIsAddDialogOpen(false);
      setSelectedMaterials([]);
      fetchProjectMaterials();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding materials:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les matériaux au projet.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    try {
      await MaterialService.removeMaterialFromProject(materialId);

      toast({
        title: "Matériau supprimé",
        description: "Le matériau a été supprimé du projet.",
      });

      fetchProjectMaterials();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing material:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le matériau.",
        variant: "destructive",
      });
    }
  };

  const calculateTotalValue = () => {
    return materials.reduce((total, item) => {
      return total + (item.quantity * item.material.price_per_unit);
    }, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adrar-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Matériaux du projet
              <Badge variant="outline" className="ml-2">
                <Calculator className="h-3 w-3 mr-1" />
                Métrés auto
              </Badge>
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter des matériaux
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter des matériaux au projet</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Les métrés seront automatiquement calculés pour chaque matériau ajouté.
                  </p>
                </DialogHeader>
                <div className="space-y-4">
                  <MaterialSelector
                    selectedMaterials={selectedMaterials}
                    onChange={setSelectedMaterials}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleAddMaterials} disabled={selectedMaterials.length === 0}>
                      Ajouter {selectedMaterials.length} matériau(x)
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-adrar-600">{materials.length}</p>
              <p className="text-sm text-gray-600">Types de matériaux</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-terracotta-600">
                {calculateTotalValue().toLocaleString('fr-FR')} MRU
              </p>
              <p className="text-sm text-gray-600">Valeur totale</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {materials.reduce((total, item) => total + item.quantity, 0)}
              </p>
              <p className="text-sm text-gray-600">Quantité totale</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      {materials.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun matériau assigné</h3>
            <p className="text-gray-600 mb-4">
              Commencez par ajouter des matériaux à ce projet. Les métrés seront calculés automatiquement.
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter des matériaux
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.material.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.material.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMaterial(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{item.material.category}</Badge>
                    <Badge variant="outline">
                      {item.quantity} {item.material.unit}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Prix unitaire:</span>
                      <span className="font-medium">
                        {item.material.price_per_unit.toLocaleString('fr-FR')} MRU/{item.material.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valeur totale:</span>
                      <span className="font-medium text-terracotta-600">
                        {(item.quantity * item.material.price_per_unit).toLocaleString('fr-FR')} MRU
                      </span>
                    </div>
                  </div>

                  {item.material.origin_location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>{item.material.origin_location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectMaterials;
