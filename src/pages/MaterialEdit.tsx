import React, { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import EnhancedMaterialForm from "@/components/materials/EnhancedMaterialForm";
import { useMaterialHex, useMaterialsHex } from "@/hooks/hexagonal";
import { AppLayout } from "@/components/layout";

interface MaterialFormData {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  availableQuantity: number;
  workspaceId: string;
  image?: string;
  adresse?: string;
  forme?: string;
  localisation?: any[];
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  // New identifier fields
  gtin?: string;
  sku?: string;
  ean?: string;
  asin?: string;
  multilangLabels?: Record<string, string>;
  timeline?: {
    start: Date;
    end: Date;
    estimatedDuration: number;
  };
  supplier?: {
    name: string;
    contact: string;
    leadTime: number;
  };
}

const MaterialEdit = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<MaterialFormData>>({});

  if (!id) {
    return <Navigate to="/materials" replace />;
  }

  // Use hexagonal hooks
  const { material, isLoading, error } = useMaterialHex(id);
  const { workspaces, updateMaterial } = useMaterialsHex();

  // Transform material data to form format
  useEffect(() => {
    if (material) {
      const transformedData: Partial<MaterialFormData> = {
        name: material.name,
        description: material.description,
        category: material.category,
        unit: material.unit,
        quantity: Number(material.availableQuantity),
        minQuantity: 0,
        pricePerUnit: Number(material.pricePerUnit),
        availableQuantity: Number(material.availableQuantity),
        workspaceId: material.workspaceId || "",
        image: material.image || "",
        adresse:
          typeof material.adresse === "string"
            ? material.adresse
            : (material.adresse as any)?.address || "",
        forme: material.forme as string | undefined,
        localisation: Array.isArray(material.localisation)
          ? (material.localisation as any[])
          : [],
        coordinatesLatitude: material.coordinatesLatitude
          ? Number(material.coordinatesLatitude)
          : undefined,
        coordinatesLongitude: material.coordinatesLongitude
          ? Number(material.coordinatesLongitude)
          : undefined,
        gtin: material.gtin || "",
        sku: material.sku || "",
        ean: material.ean || "",
        asin: material.asin || "",
        multilangLabels: {},
        timeline: {
          start: new Date(),
          end: new Date(),
          estimatedDuration: 7,
        },
        supplier: {
          name: material.originLocation || "",
          contact: "",
          leadTime: 7,
        },
      };
      setFormData(transformedData);
    }
  }, [material]);

  const handleSubmit = (updatedData: Partial<MaterialFormData>) => {
    const currentFormData = formData;
    const mergedData = { ...currentFormData, ...updatedData };
    
    const materialUpdate = {
      name: mergedData.name,
      description: mergedData.description,
      category: mergedData.category || mergedData.name,
      unit: mergedData.unit,
      price_per_unit: mergedData.pricePerUnit,
      available_quantity: mergedData.availableQuantity,
      workspace_id: mergedData.workspaceId,
      origin_location: mergedData.supplier?.name,
      image: mergedData.image,
      adresse: mergedData.adresse,
      forme: mergedData.forme || null,
      localisation: mergedData.localisation,
      coordinates_latitude: mergedData.coordinatesLatitude,
      coordinates_longitude: mergedData.coordinatesLongitude,
      gtin: mergedData.gtin || null,
      sku: mergedData.sku || null,
      ean: mergedData.ean || null,
      asin: mergedData.asin || null,
      multilang_labels: mergedData.multilangLabels || null,
    };

    updateMaterial.mutate(
      { id, data: materialUpdate as any },
      {
        onSuccess: () => {
          toast({
            title: t("materials.updated"),
            description: t("materials.updated_success"),
          });
          navigate("/materials");
        },
        onError: (error) => {
          console.error("Error updating material:", error);
          toast({
            title: t("materials.error"),
            description: t("materials.update_error"),
            variant: "destructive",
          });
        },
      }
    );
  };

  // Transform workspaces to match the expected interface
  const transformedWorkspaces = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    location: workspace.location || "",
    status: workspace.status || "",
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-grow py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 border-4 border-terracotta-500 animate-spin mx-auto mb-4" />
            <p className="text-adrar-600">{t("materials.loading")}</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-grow py-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{t("materials.error_loading")}</p>
            <Button onClick={() => navigate("/materials")}>
              {t("materials.back_to_list")}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AppLayout
      pageTitle={`${t("materials.edit")} - ${material.name}`}
      actions={
        <Button
          variant="outline"
          onClick={() => navigate("/materials")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("materials.back_to_list")}
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            {t("materials.edit_details")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedMaterialForm
            ref={(formRef) => {
              if (formRef) {
                (window as any).materialFormRef = formRef;
              }
            }}
            onSubmit={handleSubmit}
            initialData={formData}
            workspaces={transformedWorkspaces}
            showSubmitButton={false}
            materialId={id}
          />

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => navigate("/materials")}
              disabled={updateMaterial.isPending}
            >
              {t("materials.cancel")}
            </Button>
            <Button
              onClick={() => {
                const formRef = (window as any).materialFormRef;
                if (formRef && formRef.getFormData) {
                  const latestFormData = formRef.getFormData();
                  handleSubmit(latestFormData);
                } else {
                  handleSubmit(formData);
                }
              }}
              disabled={updateMaterial.isPending}
              className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700"
            >
              {updateMaterial.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("materials.updating")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("materials.save_changes")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default MaterialEdit;
