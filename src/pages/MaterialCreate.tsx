
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EnhancedMaterialForm from '@/components/materials/EnhancedMaterialForm';
import { EnhancedMaterial, Location, OperationalStatus } from '@/types/mauritania';

const MaterialCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Mock workspaces data - in real app, this would come from your API
  const mockWorkspaces = [
    {
      id: '1',
      name: 'Entrepôt Principal Nouakchott',
      location: Location.Nouakchott,
      status: OperationalStatus.active
    },
    {
      id: '2',
      name: 'Site Nouadhibou',
      location: Location.Nouadhibou,
      status: OperationalStatus.active
    },
    {
      id: '3',
      name: 'Dépôt Adrar',
      location: Location.Adrar,
      status: OperationalStatus.inactive
    }
  ];

  const handleSubmit = async (materialData: Partial<EnhancedMaterial>) => {
    setLoading(true);
    
    try {
      // Transform enhanced material data to match current database schema
      const dbData = {
        name: materialData.name,
        description: materialData.description || '',
        category: 'Construction', // Default category
        unit: materialData.unit || 'kg',
        price_per_unit: materialData.pricePerUnit || 0,
        available_quantity: materialData.availableQuantity || 0,
        origin_location: materialData.location || Location.Nouakchott,
        image: '/img/material-placeholder.jpg'
      };

      const { data, error } = await supabase
        .from('materials')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Matériau créé",
        description: `Le matériau "${materialData.name}" a été créé avec succès.`,
      });

      navigate('/materials');
    } catch (error) {
      console.error('Error creating material:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le matériau. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-adrar-900">
                Créer un nouveau matériau
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedMaterialForm
                onSubmit={handleSubmit}
                workspaces={mockWorkspaces}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MaterialCreate;
