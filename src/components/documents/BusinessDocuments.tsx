import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Receipt, FileCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUploadBusinessDocument, BusinessDocumentFormData } from '@/hooks/hexagonal/useBusinessDocumentsHex';
import { parseInvoiceFromPdf } from '@/utils/btpCalculations';
import { InvoiceLine } from '@/utils/types';

interface BusinessDocumentsProps {
  projectId?: string;
  supplierId?: string;
}

const BusinessDocuments: React.FC<BusinessDocumentsProps> = ({ projectId, supplierId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [formData, setFormData] = useState<BusinessDocumentFormData>({
    title: '',
    description: '',
    amount: undefined,
    supplier: '',
    invoice_date: '',
    due_date: '',
    reference: '',
    file: undefined,
  });
  const [parsedInvoice, setParsedInvoice] = useState<InvoiceLine[]>([]);
  
  const uploadMutation = useUploadBusinessDocument();
  
  const handleInputChange = (field: keyof BusinessDocumentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormData(prev => ({ ...prev, file }));
    
    // Auto-analyze PDF invoices
    if (file && file.type === 'application/pdf') {
      analyzePDF(file);
    }
  };

  const analyzePDF = async (file: File) => {
    setAnalyzing(true);
    try {
      const fileUrl = URL.createObjectURL(file);
      const result = await parseInvoiceFromPdf(fileUrl);
      URL.revokeObjectURL(fileUrl);
      
      setParsedInvoice(result);
      
      // Auto-fill form with parsed data
      if (result.length > 0) {
        const totalAmount = result.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        setFormData(prev => ({
          ...prev,
          amount: totalAmount,
          title: `Facture analysée - ${new Date().toLocaleDateString()}`
        }));
      }
      
      toast({
        title: "Analyse réussie",
        description: `${result.length} lignes de facture détectées`,
      });
    } catch (error) {
      console.error('PDF analysis failed:', error);
      toast({
        title: "Erreur d'analyse",
        description: "Impossible d'analyser le PDF automatiquement",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.title) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Use hexagonal hook for upload
      await uploadMutation.mutateAsync({
        ...formData,
        projectId,
      });
      
      toast({
        title: "Succès",
        description: "Document uploadé avec succès",
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        amount: undefined,
        supplier: '',
        invoice_date: '',
        due_date: '',
        reference: '',
        file: undefined,
      });
      setParsedInvoice([]);

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (tabValue: string) => {
    switch (tabValue) {
      case 'contract': return <FileCheck className="h-4 w-4" />;
      case 'supplier_info': return <FileText className="h-4 w-4" />;
      case 'tender': return <Receipt className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTabTitle = (tabValue: string) => {
    switch (tabValue) {
      case 'contract': return 'Bon de Commande';
      case 'supplier_info': return 'Devis';
      case 'tender': return 'Facture';
      default: return 'Document';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents Justificatifs et Factures
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(tab) => {
          setActiveTab(tab);
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contract" className="flex items-center gap-2">
              {getTabIcon('contract')}
              Bon de Commande
            </TabsTrigger>
            <TabsTrigger value="supplier_info" className="flex items-center gap-2">
              {getTabIcon('supplier_info')}
              Devis
            </TabsTrigger>
            <TabsTrigger value="tender" className="flex items-center gap-2">
              {getTabIcon('tender')}
              Facture
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <TabsContent value="contract" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Titre du bon de commande *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: BC-2024-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reference">Référence</Label>
                  <Input
                    id="reference"
                    value={formData.reference || ''}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    placeholder="Numéro de référence"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="supplier_info" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Titre du devis *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Devis construction phase 1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Montant (MRU)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tender" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Titre de la facture *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Facture matériaux janvier"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Fournisseur</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Nom du fournisseur"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="amount">Montant (MRU)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Date d'échéance</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                </div>
              </div>
              
              {parsedInvoice.length > 0 && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-green-600" />
                    Analyse automatique de la facture
                  </h4>
                  <div className="text-sm text-muted-foreground mb-2">
                    {parsedInvoice.length} lignes détectées
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {parsedInvoice.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-xs bg-background p-2 rounded">
                        {item.designation} - {item.totalPrice?.toLocaleString()} MRU
                      </div>
                    ))}
                    {parsedInvoice.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{parsedInvoice.length - 3} autres lignes...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description détaillée du document..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="file">Fichier du document *</Label>
              <div className="mt-1">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  required
                />
                {analyzing && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyse automatique en cours...
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || analyzing}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Ajouter {getTabTitle(activeTab)}
                </>
              )}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BusinessDocuments;
