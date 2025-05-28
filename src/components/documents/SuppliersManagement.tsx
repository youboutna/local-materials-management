
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Edit, Trash2, Search, Star } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];

const SuppliersManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    rating: 5,
    is_active: true
  });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Supplier[]) || [];
    },
  });

  const seedSuppliers = async () => {
    const sampleSuppliers = [
      { name: 'Matériaux Sahel', contact_person: 'Ahmed Ould Mohamed', email: 'contact@materiaux-sahel.mr', phone: '+222 45 67 89 01', address: 'Nouakchott, Mauritanie', category: 'Construction', rating: 4 },
      { name: 'Électronique Moderne', contact_person: 'Fatima Mint Ali', email: 'info@electronique-moderne.mr', phone: '+222 45 67 89 02', address: 'Nouakchott, Mauritanie', category: 'Électronique', rating: 5 },
      { name: 'Fournitures Générales', contact_person: 'Mohamed Ould Brahim', email: 'contact@fournitures-gen.mr', phone: '+222 45 67 89 03', address: 'Nouakchott, Mauritanie', category: 'Fournitures', rating: 3 }
    ];

    const { data, error } = await supabase
      .from('suppliers')
      .insert(sampleSuppliers as any)
      .select();

    if (error) throw error;
    return data;
  };

  const createMutation = useMutation({
    mutationFn: async (supplierData: typeof formData) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(supplierData as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: "Fournisseur créé avec succès" });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: "Fournisseur supprimé avec succès" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const seedMutation = useMutation({
    mutationFn: seedSuppliers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: "Données d'exemple ajoutées avec succès" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      rating: 5,
      is_active: true
    });
    setEditingSupplier(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      category: supplier.category || '',
      rating: supplier.rating || 5,
      is_active: supplier.is_active || true
    });
    setShowCreateDialog(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return <div className="flex justify-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Gestion des Fournisseurs
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                Ajouter des exemples
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Fournisseur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Personne de contact</Label>
                        <Input
                          value={formData.contact_person}
                          onChange={(e) => setFormData(prev => ({...prev, contact_person: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Adresse</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Input
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Note (1-5)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={formData.rating}
                          onChange={(e) => setFormData(prev => ({...prev, rating: Number(e.target.value)}))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingSupplier ? 'Modifier' : 'Créer'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers?.map((supplier) => (
              <Card key={supplier.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{supplier.name}</h3>
                      <Badge variant={supplier.is_active ? "default" : "secondary"}>
                        {supplier.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    
                    {supplier.contact_person && (
                      <p className="text-sm text-gray-600 mb-1">Contact: {supplier.contact_person}</p>
                    )}
                    
                    {supplier.email && (
                      <p className="text-sm text-gray-600 mb-1">Email: {supplier.email}</p>
                    )}
                    
                    {supplier.phone && (
                      <p className="text-sm text-gray-600 mb-1">Tel: {supplier.phone}</p>
                    )}
                    
                    {supplier.category && (
                      <Badge variant="outline" className="mb-2">
                        {supplier.category}
                      </Badge>
                    )}
                    
                    {supplier.rating && (
                      <div className="flex items-center space-x-1">
                        {renderStars(supplier.rating)}
                        <span className="text-sm text-gray-500">({supplier.rating}/5)</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(supplier)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(supplier.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {suppliers?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Aucun fournisseur trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuppliersManagement;
