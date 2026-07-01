import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Upload, Plus, Trash2, FileText, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { QuantitativeEstimateExporter } from '@/components/reports/QuantitativeEstimateExporter';
import DqeResourcePicker, { type DqeResourceValue, validateDqeResource } from '@/components/tenders/DqeResourcePicker';
import { 
  useTenderQuantitativeEstimateHex,
  type EstimateItem,
} from '@/hooks/hexagonal'

interface TenderQuantitativeEstimateProps {
  tenderId: string;
  projectId?: string;
}

const TenderQuantitativeEstimate = ({ tenderId, projectId }: TenderQuantitativeEstimateProps) => {
  const { toast } = useToast();
  const { uploadFile } = useDocumentStorage();
  
  // Use hexagonal hook
  const { 
    estimates, 
    estimateItems, 
    materials, 
    isLoading, 
    error,
    createEstimateMutation,
    addItemMutation,
    refetch
  } = useTenderQuantitativeEstimateHex(tenderId, projectId);

  // State management
  const [activeTab, setActiveTab] = useState('quantitative');
  const [isCreateEstimateOpen, setIsCreateEstimateOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showInvoiceActions, setShowInvoiceActions] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState<Record<string, any>>({
    quantity: 0,
    unit_price: 0,
    total_price: 0,
    description: '',
    item_type: 'material',
    material_id: ''
  });

  const [estimateData, setEstimateData] = useState<Record<string, any>>({
    tenderId: tenderId,
    projectId: projectId,
    estimateType: 'quantitative',
    totalMaterialsCost: 0,
    totalLaborCost: 0,
    totalEquipmentCost: 0,
    subtotal: 0,
    taxRate: 14,
    taxAmount: 0,
    totalWithTax: 0,
    overheadPercentage: 15,
    overheadAmount: 0,
    profitMarginPercentage: 10,
    profitMarginAmount: 0,
    finalTotal: 0,
    currency: 'MRU',
    status: 'draft'
  });

  // Create estimate
  const handleCreateEstimate = async () => {
    try {
      await createEstimateMutation.mutateAsync(estimateData as any);
      setSelectedEstimateId(null);
      setIsCreateEstimateOpen(false);
    } catch (error) {
      console.error('Error creating estimate:', error);
    }
  };

  // Add item
  const handleAddItem = async () => {
    if (!selectedEstimateId) return;
    
    try {
      await addItemMutation.mutateAsync({
        ...newItem as any,
        estimate_id: selectedEstimateId
      } as any);
      setNewItem({
        quantity: 0,
        unit_price: 0,
        total_price: 0,
        description: '',
        item_type: 'material'
      });
      setIsAddItemOpen(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file);
      // Store file reference but keep selectedFile as File | null type
      if (result.fileName) {
        // Create a placeholder to track upload success
        toast({
          title: "Fichier téléchargé",
          description: `${file.name} a été téléchargé avec succès`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Erreur: {error instanceof Error ? error.message : 'Erreur inconnue'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Devis Quantitatif</h1>
          <p className="text-muted-foreground">
            Gestion des devis quantitatifs pour l'appel d'offre
          </p>
        </div>
        <Button onClick={() => setIsCreateEstimateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Devis
        </Button>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Devis Quantitatif</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="quantitative">Quantitatif</TabsTrigger>
              <TabsTrigger value="materials">Matériaux</TabsTrigger>
            </TabsList>

            <TabsContent value="quantitative" className="space-y-6">
              {/* Estimates List */}
              <div className="space-y-4">
                {estimates.map((estimate) => (
                  <Card key={estimate.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">Devis #{estimate.id?.slice(-8)}</h3>
                          <Badge variant={estimate.status === 'draft' ? 'secondary' : 'default'}>
                            {estimate.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedEstimateId(estimate.id || '')}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Détails
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total matériaux:</span>
                          <span className="font-medium">{estimate.totalMaterialsCost?.toLocaleString()} MRU</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total main d'œuvre:</span>
                          <span className="font-medium">{estimate.totalLaborCost?.toLocaleString()} MRU</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total équipement:</span>
                          <span className="font-medium">{estimate.totalEquipmentCost?.toLocaleString()} MRU</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sous-total:</span>
                          <span className="font-medium">{estimate.subtotal?.toLocaleString()} MRU</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Create Estimate Button */}
              <div className="flex justify-center">
                <Button onClick={() => setIsCreateEstimateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un nouveau devis
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="materials" className="space-y-6">
              {/* Materials List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {materials.map((material) => (
                  <Card key={material.id}>
                    <CardContent className="p-4">
                      <h4 className="font-medium">{material.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {material.pricePerUnit} {material.unit} / unité
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Estimate Dialog */}
      <Dialog open={isCreateEstimateOpen} onOpenChange={setIsCreateEstimateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau devis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxRate">Taux TVA (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={estimateData.taxRate}
                  onChange={(e) => setEstimateData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="overheadPercentage">Pourcentage frais généraux (%)</Label>
                <Input
                  id="overheadPercentage"
                  type="number"
                  value={estimateData.overheadPercentage}
                  onChange={(e) => setEstimateData(prev => ({ ...prev, overheadPercentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profitMarginPercentage">Marge bénéficiaire (%)</Label>
                <Input
                  id="profitMarginPercentage"
                  type="number"
                  value={estimateData.profitMarginPercentage}
                  onChange={(e) => setEstimateData(prev => ({ ...prev, profitMarginPercentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="currency">Devise</Label>
                <Select value={estimateData.currency} onValueChange={(value) => setEstimateData(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MRU">MRU</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateEstimateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateEstimate} disabled={createEstimateMutation.isPending}>
                {createEstimateMutation.isPending ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un article</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material">Matériau</Label>
                <Select value={newItem.material_id} onValueChange={(value) => setNewItem(prev => ({ ...prev, material_id: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit_price">Prix unitaire</Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <DqeResourcePicker
                value={{
                  resource_kind: newItem.resource_kind,
                  employee_qualification_id: newItem.employee_qualification_id,
                  supplier_id: newItem.supplier_id,
                  supplier_contract_ref: newItem.supplier_contract_ref,
                  estimated_hours: newItem.estimated_hours,
                } as DqeResourceValue}
                onChange={(v) => setNewItem(prev => ({ ...prev, ...v }))}
                compact
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={addItemMutation.isPending || !!validateDqeResource({
                  resource_kind: newItem.resource_kind,
                  employee_qualification_id: newItem.employee_qualification_id,
                  supplier_id: newItem.supplier_id,
                  supplier_contract_ref: newItem.supplier_contract_ref,
                  estimated_hours: newItem.estimated_hours,
                } as DqeResourceValue)}
              >
                {addItemMutation.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenderQuantitativeEstimate;
