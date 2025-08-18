
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
import { parseInvoiceFromPdf } from '@/utils/integrations';

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

interface ParsedInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
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
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showInvoiceActions, setShowInvoiceActions] = useState(false);
  
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

  // Create new invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .insert([{
          tender_id: tenderId,
          file_name: 'Nouvelle facture',
          parsing_status: 'manual',
          total_amount: 0,
          invoice_date: new Date().toISOString().split('T')[0],
          items: [],
          parsed_data: { 
            manual_creation: true,
            created_at: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parsed-invoices', tenderId] });
      setSelectedInvoiceId(data.id);
      setShowInvoiceActions(true);
      toast({
        title: 'Facture créée',
        description: 'Nouvelle facture créée. Vous pouvez maintenant ajouter des articles.',
      });
    }
  });

  // Parse PDF mutation
  const parsePdfMutation = useMutation({
    mutationFn: async ({ file, invoiceId }: { file: File; invoiceId: string }) => {
      // Parse PDF to extract invoice data
      let parsedRawData;
      try {
        parsedRawData = await parseInvoiceFromPdf(file);
        console.log('PDF parsed successfully:', parsedRawData);
      } catch (parseError) {
        console.warn('PDF parsing failed, using empty array:', parseError);
        parsedRawData = [];
      }

      // Enhanced parsing with line-by-line detection
      const transformedItems: ParsedInvoiceItem[] = [];
      
      // Advanced parsing function to detect and parse invoice lines
      const parseInvoiceLines = (rawData: any): ParsedInvoiceItem[] => {
        const items: ParsedInvoiceItem[] = [];
        
        if (typeof rawData === 'string') {
          console.log('Raw PDF text:', rawData);
          
          // Split into lines and clean each line
          const lines = rawData
            .split(/\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
          
          console.log('All lines:', lines);

          let itemIndex = 0;
          let currentLot = '';

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            console.log(`Processing line ${i}:`, line);
            
            // Track current LOT
            const lotMatch = line.match(/^LOT\s+(\d+)\s*:\s*(.+)/i);
            if (lotMatch) {
              currentLot = lotMatch[1];
              console.log('Found lot:', currentLot);
              continue;
            }

            // Skip headers and titles
            if (line.toLowerCase().includes('quantitatif') && line.toLowerCase().includes('estimatif')) continue;
            if (line.toLowerCase().includes('article') && line.toLowerCase().includes('désignation')) continue;
            if (line.toLowerCase().includes('unité') && line.toLowerCase().includes('quantité')) continue;
            if (line.toLowerCase().includes('px') && line.toLowerCase().includes('unit')) continue;

            // Look for numbered items with specific patterns
            // Pattern 1: "1.01 Description pm" or "1.02 Description 0,20m m3 25,816 16,75 432,42"
            const itemWithNumbersPattern = /^(\d+\.\d+)\s+(.+?)\s+(m[23]|ml|pm|ens|u|kg|t|l)\s+([\d,\.]+)\s+([\d,\.]+)\s+([\d,\.]+)$/;
            const itemWithNumbersMatch = line.match(itemWithNumbersPattern);
            
            if (itemWithNumbersMatch) {
              const [, code, description, unit, quantity, unitPrice, total] = itemWithNumbersMatch;
              console.log(`Parsed numbered item: ${code} - ${description}`);
              
              const item: ParsedInvoiceItem = {
                id: `item_${Date.now()}_${itemIndex++}`,
                description: `${code} ${description.trim()}`,
                quantity: parseFloat(quantity.replace(',', '.')),
                unit_price: parseFloat(unitPrice.replace(',', '.')),
                total_price: parseFloat(total.replace(',', '.')),
                unit: unit
              };

              items.push(item);
              continue;
            }

            // Pattern 2: "1.01 Description pm" (without numbers)
            const itemWithoutNumbersPattern = /^(\d+\.\d+)\s+(.+?)\s+(pm|ens)\s*$/;
            const itemWithoutNumbersMatch = line.match(itemWithoutNumbersPattern);
            
            if (itemWithoutNumbersMatch) {
              const [, code, description, unit] = itemWithoutNumbersMatch;
              console.log(`Parsed item without numbers: ${code} - ${description}`);
              
              const item: ParsedInvoiceItem = {
                id: `item_${Date.now()}_${itemIndex++}`,
                description: `${code} ${description.trim()}`,
                quantity: 1,
                unit_price: 0,
                total_price: 0,
                unit: unit
              };

              items.push(item);
              continue;
            }

            // Pattern 3: Basic numbered item pattern (fallback)
            const basicItemPattern = /^(\d+\.\d+)\s+(.+)/;
            const basicItemMatch = line.match(basicItemPattern);
            
            if (basicItemMatch) {
              const [, code, restOfLine] = basicItemMatch;
              console.log(`Found basic item: ${code}`);
              
              // Try to extract unit and numbers from the rest of the line
              const extractedData = extractItemData(restOfLine);
              
              const item: ParsedInvoiceItem = {
                id: `item_${Date.now()}_${itemIndex++}`,
                description: `${code} ${extractedData.description}`,
                quantity: extractedData.quantity,
                unit_price: extractedData.unitPrice,
                total_price: extractedData.totalPrice,
                unit: extractedData.unit
              };

              items.push(item);
            }
          }
        }
        
        console.log('Final parsed items count:', items.length);
        console.log('Final parsed items:', items);
        return items;
      };

      // Helper function to extract data from line
      const extractItemData = (line: string) => {
        // Default values
        let description = line.trim();
        let quantity = 1;
        let unitPrice = 0;
        let totalPrice = 0;
        let unit = 'unité';

        // Try to find unit pattern
        const unitPattern = /(.*?)\s+(m[23]|ml|pm|ens|u|kg|t|l)\s+(.*)/;
        const unitMatch = line.match(unitPattern);
        
        if (unitMatch) {
          description = unitMatch[1].trim();
          unit = unitMatch[2];
          const afterUnit = unitMatch[3];
          
          // Extract numbers from after unit
          const numbers = afterUnit.match(/([\d,\.]+)/g);
          if (numbers && numbers.length >= 2) {
            quantity = parseFloat(numbers[0].replace(',', '.'));
            unitPrice = parseFloat(numbers[1].replace(',', '.'));
            totalPrice = numbers[2] ? parseFloat(numbers[2].replace(',', '.')) : quantity * unitPrice;
          }
        } else {
          // Look for any numbers in the line
          const numbers = line.match(/([\d,\.]+)/g);
          if (numbers && numbers.length >= 2) {
            // Remove numbers from description
            description = line.replace(/([\d,\.]+)/g, '').trim();
            quantity = parseFloat(numbers[0].replace(',', '.'));
            unitPrice = parseFloat(numbers[1].replace(',', '.'));
            totalPrice = numbers[2] ? parseFloat(numbers[2].replace(',', '.')) : quantity * unitPrice;
          }
        }

        return { description, quantity, unitPrice, totalPrice, unit };
      };
      
      // Process different data formats
      if (Array.isArray(parsedRawData)) {
        // If already an array of items
        parsedRawData.forEach((rawItem: any, index: number) => {
          const item: ParsedInvoiceItem = {
            id: `item_${Date.now()}_${index}`,
            description: rawItem.designation || rawItem.description || rawItem.article || rawItem.item || `Article ${index + 1}`,
            quantity: parseFloat(rawItem.quantity || rawItem.qty || rawItem.qte || 1),
            unit_price: parseFloat(rawItem.unitPrice || rawItem.unit_price || rawItem.prix_unitaire || rawItem.price || 0),
            total_price: parseFloat(rawItem.totalPrice || rawItem.total_price || rawItem.total || rawItem.montant || 0),
            unit: rawItem.unit || rawItem.unite || rawItem.u || 'unité'
          };
          
          // Calculate total if not provided
          if (!item.total_price && item.quantity && item.unit_price) {
            item.total_price = item.quantity * item.unit_price;
          }
          
          if (item.description && item.quantity > 0) {
            transformedItems.push(item);
          }
        });
      } else if (parsedRawData && typeof parsedRawData === 'object') {
        // If it's an object with items property
        const items = parsedRawData.items || parsedRawData.lignes || parsedRawData.lines || [];
        if (Array.isArray(items) && items.length > 0) {
          items.forEach((rawItem: any, index: number) => {
            const item: ParsedInvoiceItem = {
              id: `item_${Date.now()}_${index}`,
              description: rawItem.designation || rawItem.description || rawItem.article || `Article ${index + 1}`,
              quantity: parseFloat(rawItem.quantity || rawItem.qty || 1),
              unit_price: parseFloat(rawItem.unitPrice || rawItem.unit_price || rawItem.prix_unitaire || 0),
              total_price: parseFloat(rawItem.totalPrice || rawItem.total_price || rawItem.total || 0),
              unit: rawItem.unit || rawItem.unite || 'unité'
            };
            
            if (!item.total_price && item.quantity && item.unit_price) {
              item.total_price = item.quantity * item.unit_price;
            }
            
            if (item.description && item.quantity > 0) {
              transformedItems.push(item);
            }
          });
        } else {
          // Try to parse raw text content
          const textContent = parsedRawData.text || parsedRawData.content || JSON.stringify(parsedRawData);
          const lineItems = parseInvoiceLines(textContent);
          transformedItems.push(...lineItems);
        }
      } else if (typeof parsedRawData === 'string') {
        // Direct text parsing
        const lineItems = parseInvoiceLines(parsedRawData);
        transformedItems.push(...lineItems);
      }

      // Calculate total from transformed items
      const totalAmount = transformedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);

      // Extract supplier info if available
      const supplierInfo = {
        name: parsedRawData?.supplier?.name || parsedRawData?.fournisseur?.nom || 'Fournisseur non spécifié',
        address: parsedRawData?.supplier?.address || parsedRawData?.fournisseur?.adresse || '',
        phone: parsedRawData?.supplier?.phone || parsedRawData?.fournisseur?.telephone || '',
        email: parsedRawData?.supplier?.email || parsedRawData?.fournisseur?.email || ''
      };

      // Update existing invoice with enhanced data
      const { data, error } = await supabase
        .from('parsed_invoices')
        .update({
          file_name: file.name,
          parsing_status: transformedItems.length > 0 ? 'completed' : 'failed',
          total_amount: totalAmount,
          items: transformedItems as any,
          supplier_info: supplierInfo,
          invoice_number: parsedRawData?.invoice_number || parsedRawData?.numero_facture || null,
          invoice_date: parsedRawData?.invoice_date || parsedRawData?.date_facture || new Date().toISOString().split('T')[0],
          parsed_data: { 
            file_name: file.name, 
            uploaded_at: new Date().toISOString(),
            item_count: transformedItems.length,
            source: 'enhanced_pdf_analysis',
            raw_data_available: true
          }
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parsed-invoices', tenderId] });
      setSelectedFile(null);
      toast({
        title: 'PDF analysé',
        description: 'Le PDF a été analysé et les articles extraits.',
      });
    }
  });

  // Add manual item to invoice mutation
  const addInvoiceItemMutation = useMutation({
    mutationFn: async ({ invoiceId, item }: { invoiceId: string; item: any }) => {
      const { data: invoice, error: fetchError } = await supabase
        .from('parsed_invoices')
        .select('items, total_amount')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      const currentItems = Array.isArray(invoice.items) ? invoice.items : [];
      const newItems = [...currentItems, item];
      const newTotal = newItems.reduce((sum, i) => sum + (i.total_price || 0), 0);

      const { data, error } = await supabase
        .from('parsed_invoices')
        .update({
          items: newItems,
          total_amount: newTotal
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parsed-invoices', tenderId] });
      setNewItem({
        quantity: 0,
        unit_price: 0,
        total_price: 0,
        description: '',
        item_type: 'material'
      });
      toast({
        title: 'Article ajouté',
        description: 'L\'article a été ajouté à la facture.',
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

  const handleCreateInvoice = () => {
    createInvoiceMutation.mutate();
  };

  const handleParsePdf = () => {
    if (!selectedFile || !selectedInvoiceId) return;
    parsePdfMutation.mutate({ file: selectedFile, invoiceId: selectedInvoiceId });
  };

  const handleAddInvoiceItem = () => {
    if (!selectedInvoiceId) return;
    
    const item = {
      description: newItem.description,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total_price: newItem.total_price,
      unit: 'unit'
    };

    addInvoiceItemMutation.mutate({ invoiceId: selectedInvoiceId, item });
  };

  const handleImportInvoiceItems = async (invoice: any) => {
    if (!selectedEstimateId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez d\'abord sélectionner ou créer un devis.',
        variant: 'destructive'
      });
      return;
    }

    const items = invoice.items || [];
    if (items.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: 'Aucune ligne d\'article trouvée dans cette facture.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Import each item into the estimate
      for (const item of items) {
        const estimateItem = {
          estimate_id: selectedEstimateId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          item_type: item.description?.toLowerCase().includes('main') ? 'labor' : 'material'
        };

        await supabase
          .from('tender_estimate_items')
          .insert([estimateItem]);
      }

      queryClient.invalidateQueries({ queryKey: ['estimate-items', selectedEstimateId] });
      toast({
        title: 'Import réussi',
        description: `${items.length} lignes importées dans le devis.`,
      });
      
      // Switch to quantitative tab to see the imported items
      setActiveTab('quantitative');
    } catch (error) {
      console.error('Error importing items:', error);
      toast({
        title: 'Erreur d\'import',
        description: 'Impossible d\'importer les lignes de la facture.',
        variant: 'destructive'
      });
    }
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
                <h3 className="text-lg font-medium">Gestion des Factures</h3>
                <div className="flex gap-2">
                  <Button onClick={handleCreateInvoice} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Facture
                  </Button>
                </div>
              </div>

              {parsedInvoices?.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune facture créée.</p>
                  <Button onClick={handleCreateInvoice} className="mt-4">
                    Créer une première facture
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Invoice Selection */}
                  <Select value={selectedInvoiceId || ''} onValueChange={(value) => {
                    setSelectedInvoiceId(value);
                    setShowInvoiceActions(!!value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une facture" />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedInvoices?.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.file_name} - {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('fr-FR') : 'Pas de date'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Invoice Actions */}
                  {showInvoiceActions && selectedInvoiceId && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Actions sur la facture</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2">
                          <Button onClick={() => setIsAddItemOpen(true)} variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter Article
                          </Button>
                          <Button onClick={() => setIsUploadInvoiceOpen(true)} variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Analyser PDF
                          </Button>
                          {selectedEstimateId && (
                            <Button 
                              onClick={() => {
                                const invoice = parsedInvoices?.find(i => i.id === selectedInvoiceId);
                                if (invoice) handleImportInvoiceItems(invoice);
                              }}
                              variant="default"
                            >
                              Importer dans le devis
                            </Button>
                          )}
                        </div>

                        {/* Current Invoice Items with Editing */}
                        {(() => {
                          const currentInvoice = parsedInvoices?.find(i => i.id === selectedInvoiceId);
                          return currentInvoice?.items && Array.isArray(currentInvoice.items) && currentInvoice.items.length > 0 ? (
                            <div>
                              <h5 className="text-sm font-medium mb-3">Articles de la facture:</h5>
                              <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted">
                                    <tr>
                                      <th className="text-left p-3 font-medium">Article</th>
                                      <th className="text-left p-3 font-medium">Quantité</th>
                                      <th className="text-left p-3 font-medium">Prix unitaire</th>
                                      <th className="text-left p-3 font-medium">Total</th>
                                      <th className="text-left p-3 font-medium">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {currentInvoice.items.map((item: any, index: number) => (
                                      <tr key={item.id || index} className="border-t hover:bg-muted/50">
                                        <td className="p-3">
                                          <div className="font-medium">{item.description}</div>
                                          {item.unit && (
                                            <div className="text-xs text-muted-foreground">
                                              Unité: {item.unit}
                                            </div>
                                          )}
                                        </td>
                                        <td className="p-3">{item.quantity?.toLocaleString('fr-FR')}</td>
                                        <td className="p-3">
                                          {item.unit_price?.toLocaleString('fr-FR')} {estimateData.currency}
                                        </td>
                                        <td className="p-3 font-medium">
                                          {item.total_price?.toLocaleString('fr-FR')} {estimateData.currency}
                                        </td>
                                        <td className="p-3">
                                          <div className="flex gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setNewItem({
                                                  description: item.description,
                                                  quantity: item.quantity,
                                                  unit_price: item.unit_price,
                                                  total_price: item.total_price,
                                                  item_type: 'material'
                                                });
                                                setIsAddItemOpen(true);
                                              }}
                                            >
                                              Modifier
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="text-red-600 hover:text-red-700"
                                               onClick={async () => {
                                                 const items = Array.isArray(currentInvoice.items) ? currentInvoice.items : [];
                                                 const updatedItems = items.filter((_: any, i: number) => i !== index);
                                                 const newTotal = updatedItems.reduce((sum: number, i: any) => sum + (i.total_price || 0), 0);
                                                
                                                await supabase
                                                  .from('parsed_invoices')
                                                  .update({
                                                    items: updatedItems,
                                                    total_amount: newTotal
                                                  })
                                                  .eq('id', selectedInvoiceId);
                                                
                                                queryClient.invalidateQueries({ queryKey: ['parsed-invoices', tenderId] });
                                                toast({
                                                  title: 'Article supprimé',
                                                  description: 'L\'article a été supprimé de la facture.',
                                                });
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="mt-4 p-3 bg-muted rounded-lg">
                                <div className="flex justify-between items-center font-medium">
                                  <span>Total de la facture:</span>
                                  <span>{currentInvoice.total_amount?.toLocaleString('fr-FR')} {estimateData.currency}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Aucun article dans cette facture</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAddItemOpen(true)}
                                className="mt-2"
                              >
                                Ajouter le premier article
                              </Button>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
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

      {/* Add Item Dialog - works for both estimate and invoice items */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoiceId && showInvoiceActions ? 'Ajouter un article à la facture' : 'Ajouter un article au devis'}
            </DialogTitle>
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
              <Button 
                onClick={selectedInvoiceId && showInvoiceActions ? handleAddInvoiceItem : handleAddItem} 
                disabled={!newItem.description || newItem.quantity <= 0 || 
                  (selectedInvoiceId && showInvoiceActions ? addInvoiceItemMutation.isPending : addItemMutation.isPending)}
              >
                {(selectedInvoiceId && showInvoiceActions ? addInvoiceItemMutation.isPending : addItemMutation.isPending) 
                  ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Invoice Dialog - for PDF parsing */}
      <Dialog open={isUploadInvoiceOpen} onOpenChange={setIsUploadInvoiceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Analyser un PDF</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoice-file">Fichier PDF à analyser</Label>
              <Input
                id="invoice-file"
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-gray-600 mt-2">
                Le PDF sera analysé et les articles extraits seront ajoutés à la facture sélectionnée.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsUploadInvoiceOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleParsePdf} 
                disabled={!selectedFile || !selectedInvoiceId || parsePdfMutation.isPending}
              >
                {parsePdfMutation.isPending ? 'Analyse en cours...' : 'Analyser PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenderQuantitativeEstimate;
