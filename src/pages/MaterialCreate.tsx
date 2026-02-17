import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useWorkspacesHex } from '@/hooks/hexagonal/useWorkspacesHex';
import { useMaterialsHex } from "@/hooks/hexagonal/useMaterialsHex";
import { useSuppliersHex } from '@/hooks/hexagonal/useSuppliersHex';
import { MaterialFormDataDTO, MaterialUnit } from "@/dtos/entities/MaterialDTO";
import EnhancedMaterialForm from "@/components/materials/EnhancedMaterialForm";
import { ArrowLeft, Package } from "lucide-react";
import { MaterialTransformer } from "@/dtos/transforms/MaterialTransformer";
import { CreateMaterialRequestDto } from "@/dtos/transforms";

const MaterialCreate = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hexagonal Architecture: Use the hexagonal hook for material operations
  const { createMaterial } = useMaterialsHex();

  // Fetch related data for selectors
  const { workspaces } = useWorkspacesHex();
  const { suppliers } = useSuppliersHex();

  // Transform workspaces to match WorkspaceDTO format
  const transformedWorkspaces = workspaces?.map((workspace) => ({
    id: workspace.id,
    workspaceId: workspace.id,
    workspaceCode: workspace.id,
    name: workspace.name,
    location: {
      code: 'default',
      name: workspace.location,
      nameAr: workspace.location,
      type: 'city' as const,
      coordinates: undefined,
      parentCode: undefined,
      population: undefined
    },
    description: workspace.description,
    capacity: workspace.capacity,
    contact: workspace.contact_manager || workspace.contact_phone ? {
      manager: workspace.contact_manager || '',
      phone: workspace.contact_phone || ''
    } : undefined,
    facilities: workspace.facilities,
    status: workspace.status as 'active' | 'inactive' | 'closed',
    createdAt: workspace.created_at ? new Date(workspace.created_at).toISOString() : undefined,
    updatedAt: workspace.updated_at ? new Date(workspace.updated_at).toISOString() : undefined
  })) || [];

  const handleSubmit = (formData: Partial<MaterialFormDataDTO>) => {
    // Validate required fields
    if (!formData.name || !formData.category) {
      toast({
        title: t('common.error'),
        description: "Le nom et la catégorie sont requis.",
        variant: "destructive",
      });
      return;
    }

    // Ensure we have complete data for the DTO conversion
    const completeFormData: MaterialFormDataDTO = {
      name: formData.name,
      description: formData.description || '', // Ensure description is never undefined
      category: formData.category,
      subcategory: formData.subcategory,
      unit: formData.unit as MaterialUnit || MaterialUnit.PIECES,
      quantity: formData.quantity || 0,
      minQuantity: formData.minQuantity || 0,
      pricePerUnit: formData.pricePerUnit || 0,
      availableQuantity: formData.availableQuantity || 0,
      workspaceId: formData.workspaceId || '',
      image: formData.image,
      adresse: formData.adresse,
      forme: formData.forme,
      localisation: formData.localisation,
      coordinatesLatitude: formData.coordinatesLatitude,
      coordinatesLongitude: formData.coordinatesLongitude,
      gtin: formData.gtin,
      sku: formData.sku,
      ean: formData.ean,
      asin: formData.asin,
      multilangLabels: formData.multilangLabels,
      timeline: formData.timeline,
      supplier: formData.supplier
    };

    // Hexagonal Architecture: Use MaterialTransformer to convert UI form data to service DTO
    const createDto: CreateMaterialRequestDto = {
      name: formData.name,
      description: completeFormData.description || '', // Ensure description is never undefined
      category: formData.category,
      subcategory: formData.subcategory,
      unit: formData.unit,
      pricePerUnit: formData.pricePerUnit,
      quantity: formData.quantity,
      availableQuantity: formData.availableQuantity,
      minQuantity: formData.minQuantity,
      workspaceId: formData.workspaceId,
      gtin: formData.gtin,
      sku: formData.sku,
      ean: formData.ean,
      asin: formData.asin,
      image: formData.image,
      coordinatesLatitude: formData.coordinatesLatitude,
      coordinatesLongitude: formData.coordinatesLongitude,
      adresse: formData.adresse,
      forme: formData.forme,
      localisation: formData.localisation,
      multilangLabels: formData.multilangLabels,
      timeline: formData.timeline ? {
        start: formData.timeline.start,
        end: formData.timeline.end,
        estimatedDuration: formData.timeline.estimatedDuration
      } : undefined,
      supplier: formData.supplier
    };

    // Add supplier ID if supplier info is provided (map from form supplier object)
    if (completeFormData.supplier?.name) {
      // In a real implementation, you'd look up supplier by name or create if not exists
      // For now, we'll use a placeholder approach
      createDto.supplierId = `supplier-${completeFormData.supplier.name.toLowerCase().replace(/\s+/g, '-')}`;
      createDto.supplierName = completeFormData.supplier.name;
    }

    // Add workspace ID (already provided by form)
    if (completeFormData.workspaceId) {
      createDto.workspaceId = completeFormData.workspaceId;
    }

    // Note: Document associations would be handled separately after material creation
    // The DocumentUpload component in embedded mode collects documents but association
    // happens after successful material creation

    setIsSubmitting(true);

    // Hexagonal Architecture: Use the mutation from the hexagonal hook
    createMaterial.mutate(createDto, {
      onSuccess: (createdMaterial) => {
        toast({
          title: t('common.success'),
          description: "Matériau créé avec succès!",
          variant: "default",
        });

        // Navigate to material details or list
        navigate(`/materials/${createdMaterial.id}`);
      },
      onError: (error) => {
        console.error('Material creation failed:', error);
        toast({
          title: t('common.error'),
          description: error instanceof Error ? error.message : "Erreur lors de la création du matériau.",
          variant: "destructive",
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/materials")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux matériaux
            </Button>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-terracotta-500" />
              Nouveau matériau
            </h1>
            <p className="text-gray-600 mt-2">
              Ajouter un nouveau matériau à votre inventaire
            </p>
          </div>
        </div>
      </div>

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Informations du matériau</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedMaterialForm
                onSubmit={handleSubmit}
                workspaces={transformedWorkspaces}
                suppliers={suppliers}
                showSubmitButton={false}
              />
              <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
                <Button variant="outline" onClick={() => navigate("/materials")} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    const formElement = document.querySelector("form");
                    if (formElement) formElement.requestSubmit();
                  }}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white"
                >
                  {isSubmitting ? "Création..." : "Créer le matériau"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MaterialCreate;
