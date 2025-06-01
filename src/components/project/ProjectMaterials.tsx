
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, MapPin, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
      const { data, error } = await supabase
        .from('project_materials')
        .select(`
          id,
          quantity,
          material:materials(
            id,
            name,
            description,
            category,
            unit,
            price_per_unit,
            origin_location,
            image
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      setMaterials(data || []);
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

  useEffect(() => {
    fetchProjectMaterials();
  }, [projectId]);

  const handleAddMaterials = async () => {
    if (selectedMaterials.length === 0) return;

    try {
      const materialsToAdd = selectedMaterials.map(material => ({
        project_id: projectId,
        material_id: material.materialId,
        quantity: material.quantity
      }));

      const { error } = await supabase
        .from('project_materials')
        .insert(materialsToAdd);

      if (error) throw error;

      toast({
        title: "Matériaux ajoutés",
        description: `${selectedMaterials.length} matériau(x) ajouté(s) au projet.`,
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
      const { error } = await supabase
        .from('project_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

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
              Commencez par ajouter des matériaux à ce projet.
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
