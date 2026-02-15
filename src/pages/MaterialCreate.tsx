import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { useMaterialsHex } from "@/hooks/hexagonal";
import { MaterialTransformer } from "@/dtos/transforms/MaterialTransformer";
import EnhancedMaterialForm from "@/components/materials/EnhancedMaterialForm";
import { ArrowLeft, Package } from "lucide-react";

const MaterialCreate = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { createMaterial, isCreating } = useMaterialsHex();

  const handleSubmit = async (formData: any) => {
    if (!formData.name || !formData.category) {
      toast({
        title: t('common.error'),
        description: "Le nom et la catégorie sont requis.",
        variant: "destructive",
      });
      return;
    }

    // Form → DTO via Transformer (Rule #4)
    const createDto = MaterialTransformer.formToCreateRequest(formData);
    createMaterial(createDto);
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
                showSubmitButton={false}
              />
              <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
                <Button variant="outline" onClick={() => navigate("/materials")} disabled={isCreating}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    const formElement = document.querySelector("form");
                    if (formElement) formElement.requestSubmit();
                  }}
                  disabled={isCreating}
                  className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white"
                >
                  {isCreating ? "Création..." : "Créer le matériau"}
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
