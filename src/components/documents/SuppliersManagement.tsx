/**
 * SuppliersManagement - CRUD for suppliers
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Edit, Trash2, Star } from 'lucide-react';
import { TranslatedCategory } from '@/components/i18n/TranslatedBadges';
import { 
import { T } from '@/components/i18n/T';
  useSuppliersHex, 
  useCreateSupplier, 
  useUpdateSupplier, 
  useDeleteSupplier,
  SupplierMgmtFormData
} from '@/hooks/hexagonal';

const SuppliersManagement = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierMgmtFormData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    rating: 0
  });
  const { toast } = useToast();

  // Hexagonal hooks
  const { suppliers, isLoading } = useSuppliersHex();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      rating: 0
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: formData });
        toast({ title: "Succès", description: "Fournisseur mis à jour avec succès." });
      } else {
        await createMutation.mutateAsync(formData);
        toast({ title: "Succès", description: "Fournisseur créé avec succès." });
      }
      resetForm();
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (supplier: { 
  id: string; 
  name: string; 
  email?: string; 
  phone?: string; 
  address?: string;
  category?: string;
  contacts?: Array<{ name: string }>; 
  rating?: { overall: number } 
}) => {
    setFormData({
      name: supplier.name || '',
      contactPerson: (supplier as { contactPerson?: string }).contactPerson || supplier.contacts?.[0]?.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      category: supplier.category || '',
      rating: typeof supplier.rating === 'object' ? supplier.rating.overall : supplier.rating || 0
    });
    setEditingId(supplier.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Succès", description: "Fournisseur supprimé avec succès." });
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    }
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
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold"><T k="auto.suppliersmanagement.gestion_des_fournisseurs" fallback="Gestion des Fournisseurs" /></h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          <T k="auto.suppliersmanagement.nouveau_fournisseur" fallback="Nouveau Fournisseur" />
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium"><T k="auto.suppliersmanagement.personne_de_contact" fallback="Personne de contact" /></label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium"><T k="auto.suppliersmanagement.email" fallback="Email" /></label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium"><T k="auto.suppliersmanagement.telephone" fallback="Téléphone" /></label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium"><T k="auto.suppliersmanagement.categorie" fallback="Catégorie" /></label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction"><T k="auto.suppliersmanagement.construction" fallback="Construction" /></SelectItem>
                      <SelectItem value="equipment"><T k="auto.suppliersmanagement.equipement" fallback="Équipement" /></SelectItem>
                      <SelectItem value="materials"><T k="auto.suppliersmanagement.materiaux" fallback="Matériaux" /></SelectItem>
                      <SelectItem value="services"><T k="auto.suppliersmanagement.services" fallback="Services" /></SelectItem>
                      <SelectItem value="transport"><T k="auto.suppliersmanagement.transport" fallback="Transport" /></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium"><T k="auto.suppliersmanagement.note_1_5" fallback="Note (1-5)" /></label>
                  <Select
                    value={(formData.rating ?? 0).toString()}
                    onValueChange={(value) => setFormData({ ...formData, rating: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une note" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} étoile{rating > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium"><T k="auto.suppliersmanagement.adresse" fallback="Adresse" /></label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Mettre à jour' : 'Créer'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <T k="auto.suppliersmanagement.annuler" fallback="Annuler" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers?.map((supplier) => (
          <Card key={supplier.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">{supplier.name}</h3>
                    {supplier.category && (
                      <Badge variant="outline" className="mt-1">
                        <TranslatedCategory code={supplier.category} />
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant={supplier.isActive ? "default" : "secondary"}>
                  {supplier.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {supplier.contacts?.[0]?.name && (
                  <div>Contact: {supplier.contacts[0].name}</div>
                )}
                {supplier.email && (
                  <div>Email: {supplier.email}</div>
                )}
                {supplier.phone && (
                  <div>Tél: {supplier.phone}</div>
                )}
                {supplier.rating && (
                  <div className="flex items-center space-x-1">
                    <span><T k="auto.suppliersmanagement.note" fallback="Note:" /></span>
                    <div className="flex">
                      {renderStars(supplier.rating.overall || 0)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-4">
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
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(supplier.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {suppliers?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground"><T k="auto.suppliersmanagement.aucun_fournisseur_trouve" fallback="Aucun fournisseur trouvé" /></p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuppliersManagement;
