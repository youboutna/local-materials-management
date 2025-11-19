import React, { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import EnhancedMaterialForm from "@/components/materials/EnhancedMaterialForm";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Database } from "@/integrations/supabase/types";

type Material = Database["public"]["Tables"]["materials"]["Row"];
type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

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
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<MaterialFormData>>({});

  if (!id) {
    return <Navigate to="/materials" replace />;
  }

  // Fetch material data
  const {
    data: material,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["material", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select(
          `
          *,
          workspace:workspaces(
            id,
            name,
            location,
            status,
            contact_manager,
            contact_phone
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch workspaces for the form
  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const { data, error } = await supabase.from("workspaces").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Update material mutation
  const updateMaterial = useMutation({
    mutationFn: async (updatedData: Partial<MaterialFormData>) => {
      const materialUpdate = {
        name: updatedData.name,
        description: updatedData.description,
        category: updatedData.category || updatedData.name,
        unit: updatedData.unit,
        price_per_unit: updatedData.pricePerUnit,
        available_quantity: updatedData.availableQuantity,
        workspace_id: updatedData.workspaceId,
        origin_location: updatedData.supplier?.name,
        image: updatedData.image,
        adresse: updatedData.adresse,
        forme: updatedData.forme || null,
        localisation: updatedData.localisation,
        coordinates_latitude: updatedData.coordinatesLatitude,
        coordinates_longitude: updatedData.coordinatesLongitude,
        // New identifier fields
        gtin: updatedData.gtin || null,
        sku: updatedData.sku || null,
        ean: updatedData.ean || null,
        asin: updatedData.asin || null,
        multilang_labels: updatedData.multilangLabels || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("materials")
        .update(materialUpdate)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["material", id] });
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
  });

  // Transform material data to form format
  useEffect(() => {
    if (material) {
      const transformedData: Partial<MaterialFormData> = {
        name: material.name,
        description: material.description,
        category: material.category,
        unit: material.unit,
        quantity: Number(material.available_quantity),
        minQuantity: 0,
        pricePerUnit: Number(material.price_per_unit),
        availableQuantity: Number(material.available_quantity),
        workspaceId: material.workspace_id || "",
        image: material.image || "",
        adresse:
          typeof material.adresse === "string"
            ? material.adresse
            : (material.adresse as any)?.address || "",
        forme: material.forme as string | undefined,
        localisation: Array.isArray(material.localisation)
          ? (material.localisation as any[])
          : [],
        coordinatesLatitude: material.coordinates_latitude
          ? Number(material.coordinates_latitude)
          : undefined,
        coordinatesLongitude: material.coordinates_longitude
          ? Number(material.coordinates_longitude)
          : undefined,
        // New identifier fields
        gtin: (material as any).gtin || "",
        sku: (material as any).sku || "",
        ean: (material as any).ean || "",
        asin: (material as any).asin || "",
        multilangLabels: (material as any).multilang_labels || {},
        timeline: {
          start: new Date(),
          end: new Date(),
          estimatedDuration: 7,
        },
        supplier: {
          name: material.origin_location || "",
          contact: "",
          leadTime: 7,
        },
      };
      setFormData(transformedData);
    }
  }, [material]);

  const handleSubmit = (updatedData: Partial<MaterialFormData>) => {
    // Get the current form data from the form component
    const currentFormData = formData;
    const mergedData = { ...currentFormData, ...updatedData };
    updateMaterial.mutate(mergedData);
  };

  // Transform workspaces to match the expected interface
  const transformedWorkspaces = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    location: workspace.location,
    status: workspace.status,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
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
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/materials")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("materials.back_to_list")}
              </Button>
              <h1 className="text-3xl font-bold text-adrar-900 font-serif">
                {t("materials.edit")} - {material.name}
              </h1>
            </div>
          </div>

          {/* Edit Form */}
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
                    // Get the latest form data from the form component
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
        </div>
      </main>
    </div>
  );
};

export default MaterialEdit;
