
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

interface TenderQuantitativeEstimateProps {
  tenderId: string;
  projectId?: string;
}

interface EstimateItem {
  id?: string;
  material_id?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string | null;
  item_type: string | null;
}

interface TenderEstimate {
  id?: string;
  tender_id: string;
  project_id?: string | null;
  estimate_type: string;
  total_materials_cost: number | null;
  total_labor_cost: number | null;
  total_equipment_cost: number | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total_with_tax: number | null;
  overhead_percentage: number | null;
  overhead_amount: number | null;
  profit_margin_percentage: number | null;
  profit_margin_amount: number | null;
  final_total: number | null;
  currency: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

const TenderQuantitativeEstimate = ({ tenderId, projectId }: TenderQuantitativeEstimateProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();
  const [activeTab, setActiveTab] = useState('quantitative');
  const [isCreateEstimateOpen, setIsCreateEstimateOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isUploadInvoiceOpen, setIsUploadInvoiceOpen] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [estimateData, setEstimateData] = useState<Omit<TenderEstimate, 'id'>>({
    tender_id: tenderId,
    project_id: projectId,
    estimate_type: 'quantitative',
    total_materials_cost: 0,
    total_labor_cost: 0,
    total_equipment_cost: 0,
    subtotal: 0,
    tax_rate: 14, // Default TVA rate
    tax_amount: 0,
    total_with_tax: 0,
    overhead_percentage: 15,
    overhead_amount: 0,
    profit_margin_percentage: 10,
    profit_margin_amount: 0,
    final_total: 0,
    currency: 'MRU',
    status: 'draft'
  });

  const [newItem, setNewItem] = useState<EstimateItem>({
    quantity: 0,
    unit_price: 0,
    total_price: 0,
    description: '',
    item_type: 'material'
  });

  // Fetch existing estimates
  const { data: estimates, isLoading } = useQuery({
    queryKey: ['tender-estimates', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_estimates')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch estimate items
  const { data: estimateItems } = useQuery({
    queryKey: ['estimate-items', selectedEstimateId],
    queryFn: async () => {
      if (!selectedEstimateId) return [];
      
      const { data, error } = await supabase
        .from('tender_estimate_items')
        .select(`
          *,
          material:materials(name, unit)
        `)
        .eq('estimate_id', selectedEstimateId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedEstimateId
  });

  // Fetch materials for selection
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('id, name, price_per_unit, unit')
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  // Fetch parsed invoices
  const { data: parsedInvoices } = useQuery({
    queryKey: ['parsed-invoices', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Create estimate mutation
  const createEstimateMutation = useMutation({
    mutationFn: async (estimate: Omit<TenderEstimate, 'id'>) => {
      const { data, error } = await supabase
        .from('tender_estimates')
        .insert([estimate])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tender-estimates', tenderId] });
      setSelectedEstimateId(data.id);
      setIsCreateEstimateOpen(false);
      toast({
        title: 'Devis créé',
        description: 'Le devis quantitatif estimatif a été créé avec succès.',
      });
    }
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: EstimateItem & { estimate_id: string }) => {
      const { data, error } = await supabase
        .from('tender_estimate_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-items', selectedEstimateId] });
      setIsAddItemOpen(false);
      setNewItem({
        quantity: 0,
        unit_price: 0,
        total_price: 0,
        description: '',
        item_type: 'material'
      });
      toast({
        title: 'Article ajouté',
        description: 'L\'article a été ajouté au devis.',
      });
    }
  });

  // Parse invoice mutation
  const parseInvoiceMutation = useMutation({
    mutationFn: async ({ file, tenderId }: { file: File; tenderId: string }) => {
      // Upload file first
      const uploadResult = await uploadFile(file, `invoices/${tenderId}`);
      
      if (!uploadResult.success) {
        throw new Error('File upload failed');
      }

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert([{
          title: file.name,
          file_url: uploadResult.url,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          document_type: 'tender'
        }])
        .select()
        .single();

      if (docError) throw docError;

      // Create parsed invoice record (basic parsing - can be enhanced with OCR)
      const { data: parsedInvoice, error: parseError } = await supabase
        .from('parsed_invoices')
        .insert([{
          tender_id: tenderId,
          document_id: document.id,
          file_name: file.name,
          parsing_status: 'completed',
          parsed_data: { file_name: file.name, uploaded_at: new Date().toISOString() }
        }])
        .select()
        .single();

      if (parseError) throw parseError;

      return { document, parsedInvoice };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parsed-invoices', tenderId] });
      setIsUploadInvoiceOpen(false);
      setSelectedFile(null);
      toast({
        title: 'Facture téléchargée',
        description: 'La facture a été téléchargée et sera analysée.',
      });
    }
  });

  const calculateTotals = () => {
    if (!estimateItems) return;

    const materialsCost = estimateItems
      .filter(item => item.item_type === 'material')
      .reduce((sum, item) => sum + item.total_price, 0);
    
    const laborCost = estimateItems
      .filter(item => item.item_type === 'labor')
      .reduce((sum, item) => sum + item.total_price, 0);
    
    const equipmentCost = estimateItems
      .filter(item => item.item_type === 'equipment')
      .reduce((sum, item) => sum + item.total_price, 0);

    const subtotal = materialsCost + laborCost + equipmentCost;
    const taxAmount = subtotal * (estimateData.tax_rate || 0) / 100;
    const totalWithTax = subtotal + taxAmount;
    const overheadAmount = totalWithTax * (estimateData.overhead_percentage || 0) / 100;
    const profitAmount = (totalWithTax + overheadAmount) * (estimateData.profit_margin_percentage || 0) / 100;
    const finalTotal = totalWithTax + overheadAmount + profitAmount;

    return {
      materialsCost,
      laborCost,
      equipmentCost,
      subtotal,
      taxAmount,
      totalWithTax,
      overheadAmount,
      profitAmount,
      finalTotal
    };
  };

  const handleMaterialSelect = (materialId: string) => {
    const material = materials?.find(m => m.id === materialId);
    if (material) {
      setNewItem(prev => ({
        ...prev,
        material_id: materialId,
        description: material.name,
        unit_price: material.price_per_unit
      }));
    }
  };

  const handleQuantityChange = (quantity: number) => {
    setNewItem(prev => ({
      ...prev,
      quantity,
      total_price: quantity * prev.unit_price
    }));
  };

  const handleUnitPriceChange = (unitPrice: number) => {
    setNewItem(prev => ({
      ...prev,
      unit_price: unitPrice,
      total_price: prev.quantity * unitPrice
    }));
  };

  const handleCreateEstimate = () => {
    createEstimateMutation.mutate(estimateData);
  };

  const handleAddItem = () => {
    if (!selectedEstimateId) return;
    
    addItemMutation.mutate({
      ...newItem,
      estimate_id: selectedEstimateId
    });
  };

  const handleUploadInvoice = () => {
    if (!selectedFile) return;
    parseInvoiceMutation.mutate({ file: selectedFile, tenderId });
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-terracotta-600" />
              Devis Quantitatif Estimatif
            </CardTitle>
            <Button onClick={() => setIsCreateEstimateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Devis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quantitative">Calcul Quantitatif</TabsTrigger>
              <TabsTrigger value="invoices">Factures Analysées</TabsTrigger>
            </TabsList>

            <TabsContent value="quantitative" className="space-y-4">
              {estimates?.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun devis créé pour cet appel d'offres.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Select value={selectedEstimateId || ''} onValueChange={setSelectedEstimateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un devis" />
                    </SelectTrigger>
                    <SelectContent>
                      {estimates?.map((estimate) => (
                        <SelectItem key={estimate.id} value={estimate.id}>
                          Devis du {new Date(estimate.created_at).toLocaleDateString('fr-FR')} - {estimate.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                      {selectedEstimateId && (
                        <>
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Articles du devis</h3>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setIsAddItemOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Ajouter Article
                              </Button>
                              {estimateItems && estimateItems.length > 0 && (
                                <QuantitativeEstimateExporter 
                  estimate={{
                    ...estimateData,
                    ...estimates?.find(e => e.id === selectedEstimateId),
                    status: estimates?.find(e => e.id === selectedEstimateId)?.status || 'draft'
                  } as TenderEstimate}
                                  estimateItems={estimateItems}
                                  tender={{ title: 'Appel d\'Offres', reference: tenderId }}
                                />
                              )}
                            </div>
                          </div>

                      <div className="space-y-2">
                        {estimateItems?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                            <div className="flex-1">
                              <div className="font-medium">{item.description}</div>
                              <div className="text-sm text-gray-600">
                                {item.quantity} x {item.unit_price} {estimateData.currency}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{item.total_price} {estimateData.currency}</div>
                              <Badge variant="outline">{item.item_type}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      {totals && (
                        <Card className="bg-gray-50">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Matériaux:</span>
                                <span>{totals.materialsCost.toFixed(2)} {estimateData.currency}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Main-d'œuvre:</span>
                                <span>{totals.laborCost.toFixed(2)} {estimateData.currency}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Équipement:</span>
                                <span>{totals.equipmentCost.toFixed(2)} {estimateData.currency}</span>
                              </div>
                              <hr />
                              <div className="flex justify-between">
                                <span>Sous-total:</span>
                                <span>{totals.subtotal.toFixed(2)} {estimateData.currency}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>TVA ({estimateData.tax_rate}%):</span>
                                <span>{totals.taxAmount.toFixed(2)} {estimateData.currency}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Frais généraux ({estimateData.overhead_percentage}%):</span>
                                <span>{totals.overheadAmount.toFixed(2)} {estimateData.currency}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Marge bénéficiaire ({estimateData.profit_margin_percentage}%):</span>
                                <span>{totals.profitAmount.toFixed(2)} {estimateData.currency}</span>
                              </div>
                              <hr />
                              <div className="flex justify-between font-bold text-lg">
                                <span>Total final:</span>
                                <span>{totals.finalTotal.toFixed(2)} {estimateData.currency}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Factures et Bons de Commande</h3>
                <Button onClick={() => setIsUploadInvoiceOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger Facture
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedInvoices?.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{invoice.file_name}</h4>
                          <p className="text-sm text-gray-600">
                            {invoice.invoice_number && `N° ${invoice.invoice_number}`}
                          </p>
                        </div>
                        <Badge className={
                          invoice.parsing_status === 'completed' ? 'bg-green-100 text-green-800' :
                          invoice.parsing_status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {invoice.parsing_status === 'completed' ? 'Analysé' :
                           invoice.parsing_status === 'failed' ? 'Échec' : 'En cours'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {invoice.total_amount && (
                        <div className="text-lg font-medium text-green-600">
                          {invoice.total_amount} {estimateData.currency}
                        </div>
                      )}
                      {invoice.invoice_date && (
                        <div className="text-sm text-gray-600">
                          Date: {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {parsedInvoices?.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune facture téléchargée pour cet appel d'offres.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Estimate Dialog */}
      <Dialog open={isCreateEstimateOpen} onOpenChange={setIsCreateEstimateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer un Nouveau Devis</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Taux de TVA (%)</Label>
              <Input
                type="number"
                value={estimateData.tax_rate || 14}
                onChange={(e) => setEstimateData(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Frais généraux (%)</Label>
              <Input
                type="number"
                value={estimateData.overhead_percentage || 15}
                onChange={(e) => setEstimateData(prev => ({ ...prev, overhead_percentage: Number(e.target.value) }))}
              />
            </div>

            <div>
              <Label>Marge bénéficiaire (%)</Label>
              <Input
                type="number"
                value={estimateData.profit_margin_percentage || 10}
                onChange={(e) => setEstimateData(prev => ({ ...prev, profit_margin_percentage: Number(e.target.value) }))}
              />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un Article</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Type d'article</Label>
              <Select 
                value={newItem.item_type || 'material'} 
                onValueChange={(value: string) => 
                  setNewItem(prev => ({ ...prev, item_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">Matériau</SelectItem>
                  <SelectItem value="labor">Main-d'œuvre</SelectItem>
                  <SelectItem value="equipment">Équipement</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newItem.item_type === 'material' && (
              <div>
                <Label>Matériau du référentiel</Label>
                <Select onValueChange={handleMaterialSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un matériau" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials?.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} - {material.price_per_unit} {estimateData.currency}/{material.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Description</Label>
              <Input
                value={newItem.description || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de l'article"
              />
            </div>

            <div>
              <Label>Quantité</Label>
              <Input
                type="number"
                value={newItem.quantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Prix unitaire</Label>
              <Input
                type="number"
                value={newItem.unit_price}
                onChange={(e) => handleUnitPriceChange(Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Prix total</Label>
              <Input
                type="number"
                value={newItem.total_price}
                readOnly
                className="bg-gray-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
                {addItemMutation.isPending ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Invoice Dialog */}
      <Dialog open={isUploadInvoiceOpen} onOpenChange={setIsUploadInvoiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Télécharger Facture/Bon de Commande</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Fichier</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-1">
                  Fichier sélectionné: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsUploadInvoiceOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleUploadInvoice} 
                disabled={!selectedFile || uploading || parseInvoiceMutation.isPending}
              >
                {uploading || parseInvoiceMutation.isPending ? 'Téléchargement...' : 'Télécharger'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenderQuantitativeEstimate;
