import { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import EnhancedMaterialForm from "@/components/materials/EnhancedMaterialForm";
import { useMaterialHex, useMaterialsHex } from "@/hooks/hexagonal";
import { MaterialFormDataDTO, UpdateMaterialRequestDto } from "@/dtos/transforms/shared";
import { MaterialDTO, MaterialUnit, MaterialStatus, MaterialCategory } from "@/dtos/entities/MaterialDTO";
import { MaterialTransformer } from "@/dtos/transforms/MaterialTransformer";
import { AppLayout } from "@/components/layout";

// Extend window interface for form ref access
declare global {
  interface Window {
    materialFormRef?: {
      submit: () => void;
      getFormData: () => Partial<MaterialFormDataDTO>;
    };
  }
}

const MaterialEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const safeId = id || '';

  const { material, isLoading, error, updateMaterial, isUpdating } = useMaterialHex(safeId);
  const { workspaces } = useMaterialsHex();

  // Transform DTO → Form data (material is already in DTO format)
  const formData = material || {};

  const handleSubmit = (updatedFormData: Partial<MaterialFormDataDTO>) => {
    // Form (transforms DTO) → Hook (transformation) → Service (entities DTO) → Entity
    // Pass the transforms DTO directly to the hook, let it handle transformation
    updateMaterial.mutate(
      { id: safeId, data: updatedFormData as UpdateMaterialRequestDto },
      {
        onSuccess: () => {
          toast({ title: t("materials.updated"), description: t("materials.updated_success") });
          navigate("/materials");
        },
        onError: (error) => {
          console.error("Error updating material:", error);
          toast({ title: t("materials.error"), description: t("materials.update_error"), variant: "destructive" });
        },
      }
    );
  };

  const transformedWorkspaces = (workspaces || []).map((w) => ({
    id: w.id,
    workspaceId: w.id, // Use id as workspaceId
    workspaceCode: w.id, // Use id as workspaceCode for now
    name: w.name,
    location: {
      code: 'default',
      name: typeof w.location === 'string' ? w.location : w.location?.name || '',
      nameAr: typeof w.location === 'string' ? w.location : w.location?.nameAr || w.location?.name || '',
      type: 'city' as const,
      coordinates: (typeof w.location === 'object' && w.location.coordinates) ? {
        latitude: w.location.coordinates.latitude,
        longitude: w.location.coordinates.longitude
      } : undefined,
      parentCode: undefined,
      population: undefined
    },
    description: undefined,
    capacity: undefined,
    contact: undefined,
    facilities: undefined,
    status: (w.status as 'active' | 'inactive' | 'closed') || 'active',
    createdAt: undefined,
    updatedAt: undefined
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-grow py-16 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-terracotta-500" />
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
            <Button onClick={() => navigate("/materials")}>{t("materials.back_to_list")}</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AppLayout
      pageTitle={`${t("materials.edit")} - ${material.name}`}
      actions={
        <Button variant="outline" onClick={() => navigate("/materials")} className="flex items-center gap-2">
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
            ref={(formRef) => { if (formRef) window.materialFormRef = formRef; }}
            onSubmit={handleSubmit}
            initialData={formData}
            workspaces={transformedWorkspaces}
            showSubmitButton={false}
            materialId={id}
          />

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={() => navigate("/materials")} disabled={isUpdating}>
              {t("materials.cancel")}
            </Button>
            <Button
              onClick={() => {
                const formRef = window.materialFormRef;
                if (formRef?.getFormData) {
                  handleSubmit(formRef.getFormData());
                }
              }}
              disabled={isUpdating}
              className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700"
            >
              {isUpdating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("materials.updating")}</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />{t("materials.save_changes")}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default MaterialEdit;
