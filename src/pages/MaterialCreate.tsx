import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnhancedMaterialForm from "@/components/materials/EnhancedMaterialForm";
import { useLanguage } from "@/contexts/LanguageContext";

const MaterialCreate = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (materialData: any) => {
    if (!materialData.name || !materialData.category) {
      toast({
        title: "Erreur de validation",
        description: "Le nom et la catégorie sont requis.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("materials")
        .insert([
          {
            name: materialData.name,
            description: materialData.description || "",
            category: materialData.category,
            unit: materialData.unit || "kg",
            price_per_unit: materialData.pricePerUnit || 0,
            available_quantity: materialData.availableQuantity || 0,
            origin_location: materialData.adresse || null,
            workspace_id: materialData.workspaceId || null,
            image: materialData.image || null,
            adresse: materialData.adresse || null,
            forme: materialData.forme || null,
            coordinates_latitude: materialData.coordinatesLatitude || null,
            coordinates_longitude: materialData.coordinatesLongitude || null,
            localisation: materialData.localisation || null,
            // New identifier fields
            gtin: materialData.gtin || null,
            sku: materialData.sku || null,
            ean: materialData.ean || null,
            asin: materialData.asin || null,
            multilang_labels: materialData.multilangLabels || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Matériau créé",
        description: "Le matériau a été créé avec succès.",
      });

      navigate("/materials");
    } catch (error) {
      console.error("Error creating material:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le matériau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Section */}
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
                <Button
                  variant="outline"
                  onClick={() => navigate("/materials")}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    // Trigger form submission
                    const formElement = document.querySelector("form");
                    if (formElement) {
                      formElement.requestSubmit();
                    }
                  }}
                  disabled={loading}
                  className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white"
                >
                  {loading ? "Création..." : "Créer le matériau"}
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
