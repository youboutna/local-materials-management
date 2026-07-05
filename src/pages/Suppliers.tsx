// @ts-nocheck
import EnhancedDocumentSharing from '@/components/suppliers/EnhancedDocumentSharing';
import { SupplierDocumentsPanel } from '@/components/documents/panels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSuppliersHex } from '@/hooks/hexagonal';
import type { SupplierFormData } from '@/hooks/hexagonal/useSuppliersManagementHex';
import { generateSupplierPasswordReset, sendSupplierNotification } from '@/application/services/SupplierNotificationService';
import { Building2, Edit, FileText, Mail, Plus, Send, Share2, Star, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout';

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type SupplierCategory = 'materials' | 'services' | 'equipment' | 'subcontractor' | 'consultant' | 'other';

const Suppliers = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRow | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [enhancedDocumentSharingOpen, setEnhancedDocumentSharingOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    category: "",
    rating: 0,
    nif: "",
    commerce_register_ref: "",
  });
  const { toast } = useToast();
  const { t } = useLanguage();

  // Hook hexagonal pour les fournisseurs
  const { 
    suppliers, 
    loading: isLoading, 
    createSupplier, 
    updateSupplier, 
    deleteSupplier,
    isCreating: isCreatingSupplier,
    isUpdating,
    isDeleting
  } = useSuppliersHex();

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      category: "",
      rating: 0,
      nif: "",
      commerce_register_ref: "",
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const success = await updateSupplier({ id: editingId, data: formData });
        if (success) {
          toast({ title: t('common.success'), description: "Fournisseur mis à jour avec succès." });
          resetForm();
        }
      } else {
        await createSupplier({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          category: formData.category,
          rating: formData.rating,
          contact_person: formData.contact_person,
          nif: formData.nif,
          commerce_register_ref: formData.commerce_register_ref,
        });
        toast({ title: t('common.success'), description: "Fournisseur créé avec succès." });
        resetForm();
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : "Erreur lors de l'opération",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier(id);
      toast({ title: t('common.success'), description: "Fournisseur supprimé avec succès." });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (supplier: SupplierRow) => {
    setFormData({
      name: supplier.name || "",
      contact_person: supplier.contactPerson || supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      category: supplier.category || "",
      rating: typeof supplier.rating === 'number' ? supplier.rating : 0,
      nif: supplier.nif || "",
      commerce_register_ref: supplier.commerceRegisterRef || supplier.commerce_register_ref || "",
    });
    setEditingId(supplier.id);
    setIsCreating(true);
  };

  const handleNotifySupplier = async (
    supplier: SupplierRow,
    taskTitle: string,
    taskId?: string
  ) => {
    if (!supplier.email) {
      toast({
        title: "Erreur",
        description: "Ce fournisseur n'a pas d'adresse email.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendSupplierNotification({
        type: "task_assignment",
        email: supplier.email,
        supplier_name: supplier.name,
        supplier_id: supplier.id,
        task_id: taskId,
        task_title: taskTitle,
      });
      setNotificationOpen(false);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const handlePasswordReset = async (supplier: SupplierRow) => {
    if (!supplier.email) {
      toast({
        title: "Erreur",
        description: "Ce fournisseur n'a pas d'adresse email.",
        variant: "destructive",
      });
      return;
    }

    try {
      await generateSupplierPasswordReset(
        supplier.email,
        supplier.name,
        supplier.id
      );
    } catch (error) {
      console.error("Error generating password reset:", error);
    }
  };

  const handleOpenEnhancedDocumentSharing = (supplier: SupplierRow) => {
    setSelectedSupplier(supplier);
    setEnhancedDocumentSharingOpen(true);
  };

  const handleOpenDocuments = (supplier: SupplierRow) => {
    setSelectedSupplier(supplier);
    setDocumentsOpen(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
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
    <AppLayout
      pageTitle="Gestion des Fournisseurs"
      actions={
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Fournisseur
        </Button>
      }
    >
      <div className="space-y-6">
        {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Modifier le Fournisseur" : "Nouveau Fournisseur"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Personne de contact
                  </label>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_person: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Catégorie</label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="equipment">Équipement</SelectItem>
                      <SelectItem value="materials">Matériaux</SelectItem>
                      <SelectItem value="services">Services</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Note (1-5)</label>
                  <Select
                    value={(formData.rating || 0).toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, rating: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une note" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} étoile{rating > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Adresse</label>
                <Textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    NIF (Numéro d'Identification Fiscale)
                  </label>
                  <Input
                    value={formData.nif}
                    onChange={(e) =>
                      setFormData({ ...formData, nif: e.target.value })
                    }
                    placeholder="Ex: 123456789"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Référence Registre de Commerce
                  </label>
                  <Input
                    value={formData.commerce_register_ref}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commerce_register_ref: e.target.value,
                      })
                    }
                    placeholder="Ex: RC-2024-001"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={isCreatingSupplier || isUpdating}
                >
                  {editingId ? "Mettre à jour" : "Créer"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
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
                  <Building2 className="h-5 w-5 text-blue-500" />
                  <div>
                    <h3 className="font-medium">{supplier.name}</h3>
                    {supplier.category && (
                      <Badge variant="outline" className="mt-1">
                        {supplier.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant={supplier.isActive() ? "default" : "secondary"}>
                  {supplier.isActive() ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {supplier.getPrimaryContact() && (
                  <div>Contact: {supplier.getPrimaryContact()?.name}</div>
                )}
                {supplier.email && <div>Email: {supplier.email}</div>}
                {supplier.phone && <div>Tél: {supplier.phone}</div>}
                {supplier.rating && (
                  <div className="flex items-center space-x-1">
                    <span>Note:</span>
                    <div className="flex">{renderStars(supplier.getOverallRating())}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
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
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(supplier.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Dialog
                  open={
                    notificationOpen && selectedSupplier?.id === supplier.id
                  }
                  onOpenChange={setNotificationOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setNotificationOpen(true);
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Notifier {supplier.name}</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="notification" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="notification">
                          Notification
                        </TabsTrigger>
                        <TabsTrigger value="password">Mot de passe</TabsTrigger>
                      </TabsList>
                      <TabsContent value="notification" className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">
                            Titre de la tâche
                          </label>
                          <Input placeholder="Entrez le titre de la tâche..." />
                        </div>
                        <Button
                          onClick={() =>
                            handleNotifySupplier(
                              supplier,
                              "Nouvelle tâche assignée"
                            )
                          }
                          className="w-full"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Envoyer la notification
                        </Button>
                      </TabsContent>
                      <TabsContent value="password" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Envoyer un email de réinitialisation de mot de passe à
                          ce fournisseur.
                        </p>
                        <Button
                          onClick={() => handlePasswordReset(supplier)}
                          className="w-full"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Envoyer le lien de réinitialisation
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEnhancedDocumentSharing(supplier)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenDocuments(supplier)}
                  title="Documents"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Document Sharing Dialog */}
      {selectedSupplier && (
        <EnhancedDocumentSharing
          supplier={selectedSupplier}
          isOpen={enhancedDocumentSharingOpen}
          onOpenChange={setEnhancedDocumentSharingOpen}
        />
      )}

      {/* Supplier Documents Dialog */}
      {selectedSupplier && (
        <Dialog open={documentsOpen} onOpenChange={setDocumentsOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Documents — {selectedSupplier.name}</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6">
              <SupplierDocumentsPanel supplierId={selectedSupplier.id} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {suppliers?.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun fournisseur trouvé</p>
          </CardContent>
        </Card>
      )}
      </div>
    </AppLayout>
  );
};

export default Suppliers;
