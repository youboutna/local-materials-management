import { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import EnhancedMaterialForm from "@/components/materials/EnhancedMaterialForm";
import { useMaterialHex, useMaterialsHex } from "@/hooks/hexagonal";
import { MaterialTransformer } from "@/dtos/transforms/MaterialTransformer";
import { AppLayout } from "@/components/layout";

const MaterialEdit = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const safeId = id || '';

  const { material, isLoading, error } = useMaterialHex(safeId);
  const { updateMaterial, workspaces } = useMaterialsHex();

  const { material, isLoading, error } = useMaterialHex(id);
  const { updateMaterial, workspaces } = useMaterialsHex();

  // Transform DTO → Form data via Transformer (Rule #4)
  const formData = material ? MaterialTransformer.toFormData(material) : {};

  const handleSubmit = (updatedFormData: any) => {
    // Form → UpdateDTO via Transformer (Rule #4)
    const updateDto = MaterialTransformer.formToUpdateRequest(updatedFormData);
    
    updateMaterial.mutate(
      { id, data: updateDto },
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

  const transformedWorkspaces = (workspaces || []).map((w: any) => ({
    id: w.id,
    name: w.name,
    location: w.location || "",
    status: w.status || "",
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
            ref={(formRef) => { if (formRef) (window as any).materialFormRef = formRef; }}
            onSubmit={handleSubmit}
            initialData={formData}
            workspaces={transformedWorkspaces}
            showSubmitButton={false}
            materialId={id}
          />

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={() => navigate("/materials")} disabled={updateMaterial.isPending}>
              {t("materials.cancel")}
            </Button>
            <Button
              onClick={() => {
                const formRef = (window as any).materialFormRef;
                if (formRef?.getFormData) {
                  handleSubmit(formRef.getFormData());
                }
              }}
              disabled={updateMaterial.isPending}
              className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700"
            >
              {updateMaterial.isPending ? (
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
