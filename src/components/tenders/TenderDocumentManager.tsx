import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Eye, CheckCircle, XCircle, Clock, AlertCircle, Plus, Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import TenderQuantitativeEstimate from './TenderQuantitativeEstimate';
import { parsePdf, calculateAdvancedQuantities } from '@/utils/btpCalculations';
import { TenderDocumentWithDetails } from '@/hooks/hexagonal/useTenderDocumentsHex';
import { TENDER_CATEGORY_LABELS, TENDER_DOCUMENT_LABELS, ADMINISTRATIVE_SUBCATEGORY_GROUPS } from '@/dtos';
import { TenderDocumentCategory, TenderDocumentSubcategory } from './PublicProcurementWorkflow';

interface TenderDocumentManagerProps {
  tenderId: string;
  projectId?: string;
  readonly?: boolean;
}

const TenderDocumentManager = ({ tenderId, projectId, readonly = false }: TenderDocumentManagerProps) => {
  const [activeCategory, setActiveCategory] = useState<TenderDocumentCategory>('administrative');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    category: 'administrative' as TenderDocumentCategory,
    subcategory: 'lettre_soumission' as TenderDocumentSubcategory,
    title: '',
    description: '',
    is_required: true
  });
  const [showQuantitativeEstimate, setShowQuantitativeEstimate] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useCurrentUserRoles();
  const { uploadFile, uploading } = useDocumentStorage();

  // Check if user is bidder/supplier
  const isBidder = hasRole('supplier') || hasRole('agent');

  // Fetch tender documents
  const { data: tenderDocuments, isLoading: isTenderDocsLoading } = useQuery({
    queryKey: ['tender-documents', tenderId],
    queryFn: async () => {
      // Query tender_documents with tender_id
      const { data, error } = await supabase
        .from('tender_documents')
        .select(`
          *,
          document:documents(
            id,
            title,
            description,
            file_url,
            file_name,
            mime_type,
            file_size
          )
        `)
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Query error:', error);
        return [] as TenderDocumentWithDetails[];
      }
      
      return (data || []) as TenderDocumentWithDetails[];
    },
    enabled: !!tenderId
  });

  // Fetch workflow step documents
  const { data: workflowStepDocuments, isLoading: isWorkflowDocsLoading } = useQuery({
    queryKey: ['workflow-step-documents', tenderId],
    queryFn: async () => {
      // First get all steps for this tender
      const { data: steps, error: stepsError } = await supabase
        .from('tender_steps')
        .select('id, title, step_number')
        .eq('tender_id', tenderId);
      
      if (stepsError) throw stepsError;
      if (!steps?.length) return [];

      // Get all documents for these steps
      const stepIds = steps.map(s => s.id);
      const { data: stepDocs, error: docsError } = await supabase
        .from('tender_step_documents')
        .select(`
          *,
          document:documents(*),
          step:tender_steps(title, step_number)
        `)
        .in('step_id', stepIds);

      if (docsError) throw docsError;

      // Transform to match TenderDocumentWithDetails format
      return (stepDocs || []).map(doc => ({
        id: doc.id,
        tender_id: tenderId,
        document_id: doc.document_id,
        category: doc.document_type as TenderDocumentCategory || 'administrative',
        subcategory: 'workflow_step' as any,
        is_required: doc.is_required,
        reviewer_notes: doc.reviewer_notes,
        status: doc.status as any,
        created_at: doc.created_at,
        updated_at: doc.created_at,
        document: doc.document,
        step_info: {
          step_title: doc.step?.title,
          step_number: doc.step?.step_number
        }
      }));
    },
    enabled: !!tenderId,
  });

  const isLoading = isTenderDocsLoading || isWorkflowDocsLoading;

  // Combine all documents
  const allDocuments = [
    ...(tenderDocuments || []),
    ...(workflowStepDocuments || [])
  ];

  // Updated upload document mutation to use tender_id
  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentData }: { file: File; documentData: any }) => {
      console.log('Starting document upload...', { fileName: file.name, documentData });
      
      // Upload file first
      const uploadResult = await uploadFile(file, `tender-documents/${tenderId}`);
      
      if (!uploadResult.success) {
        throw new Error('File upload failed');
      }

      console.log('File uploaded successfully:', uploadResult.url);

      // Create document record without any foreign key constraints
      const documentInsertData = {
        title: documentData.title,
        description: documentData.description,
        file_url: uploadResult.url,
        file_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        document_type: 'tender' as const
      };

      console.log('Creating document record:', documentInsertData);

      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert(documentInsertData)
        .select()
        .single();

      if (docError) {
        console.error('Document creation error:', docError);
        throw docError;
      }

      console.log('Document created:', document);

      // Create tender document record using tender_id
      const tenderDocData = {
        document_id: document.id,
        tender_id: tenderId,
        project_id: projectId || null, // Keep for legacy compatibility
        category: documentData.category,
        subcategory: documentData.subcategory,
        is_required: documentData.is_required,
        is_submitted: true,
        submission_date: new Date().toISOString(),
        status: 'pending'
      };

      console.log('Creating tender document record:', tenderDocData);

      const { data: tenderDoc, error: tenderDocError } = await supabase
        .from('tender_documents')
        .insert(tenderDocData)
        .select()
        .single();

      if (tenderDocError) {
        console.error('Tender document creation error:', tenderDocError);
        throw tenderDocError;
      }

      console.log('Tender document created:', tenderDoc);

      // Hook: if DQE PDF uploaded under financial category, parse and auto-add items
      let estimateId: string | null = null;
      let addedCount = 0;
      try {
         const isDqePdf =
           documentData.subcategory === 'devis_quantitatif_estimatif' &&
           file.type === 'application/pdf';

        if (isDqePdf) {
          // Find existing estimate or create one
          const { data: existingEstimates, error: findErr } = await supabase
            .from('tender_estimates')
            .select('id')
            .eq('tender_id', tenderId)
            .order('created_at', { ascending: false })
            .limit(1);
          if (findErr) console.warn('Failed to check existing estimates:', findErr);

          if (existingEstimates && existingEstimates.length > 0) {
            estimateId = existingEstimates[0].id as string;
          } else {
            const { data: newEst, error: createEstError } = await supabase
              .from('tender_estimates')
              .insert([
                {
                  tender_id: tenderId,
                  project_id: projectId || null,
                  estimate_type: 'quantitative',
                  total_materials_cost: 0,
                  total_labor_cost: 0,
                  total_equipment_cost: 0,
                  subtotal: 0,
                  tax_rate: 14,
                  tax_amount: 0,
                  total_with_tax: 0,
                  overhead_percentage: 15,
                  overhead_amount: 0,
                  profit_margin_percentage: 10,
                  profit_margin_amount: 0,
                  final_total: 0,
                  currency: 'MRU',
                  status: 'draft'
                }
              ])
              .select()
              .single();
            if (createEstError) throw createEstError;
            estimateId = newEst?.id || null;
          }

          if (estimateId) {
            const parsedResults = await parsePdf(file);

            // Normalize each line via calculateAdvancedQuantities when possible
            const normalized = parsedResults.map((r) => {
              try {
                return calculateAdvancedQuantities({
                  elementType: (r as any).elementType,
                  length: r.dimensions?.length ?? 0,
                  width: r.dimensions?.width,
                  height: r.dimensions?.height,
                  quantity:
                    (typeof (r.results as any)?.count === 'number' ? (r.results as any).count : undefined) ??
                    (typeof r.dimensions?.count === 'number' ? (r.dimensions as any).count : undefined) ??
                    1,
                  options: {}
                });
              } catch (_) {
                return r;
              }
            });

            const items = normalized
              .map((res) => {
                const results: any = res.results || {};
                const qty =
                  (typeof results.count === 'number' && results.count) ||
                  (typeof results.area === 'number' && results.area) ||
                  (typeof results.volume === 'number' && results.volume) ||
                  (res.dimensions?.count as number) ||
                  1;
                const unitPrice = typeof results.unitPrice === 'number' ? results.unitPrice : 0;
                const totalPrice = typeof results.totalPrice === 'number' ? results.totalPrice : unitPrice * qty;
                const description = res.originalLabel || res.metadata?.description || 'Ligne DQE';
                return {
                  estimate_id: estimateId!,
                  material_id: null,
                  quantity: Number.isFinite(qty) ? qty : 1,
                  unit_price: Number.isFinite(unitPrice) ? unitPrice : 0,
                  total_price: Number.isFinite(totalPrice) ? totalPrice : 0,
                  description,
                  item_type: 'material' as const
                };
              })
              .filter((it) => it.quantity > 0);

            if (items.length > 0) {
              const { error: addItemsError } = await supabase
                .from('tender_estimate_items')
                .insert(items);
              if (addItemsError) {
                console.warn('Failed to insert estimate items from DQE:', addItemsError);
              } else {
                addedCount = items.length;
              }
            }
          }
        }
      } catch (e) {
        console.warn('DQE PDF auto-parse failed:', e);
      }

      return { document, tenderDoc, estimateId, addedCount };
    },
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ['tender-documents', tenderId] });
       if (data?.estimateId) {
         queryClient.invalidateQueries({ queryKey: ['tender-estimates', tenderId] });
         queryClient.invalidateQueries({ queryKey: ['enhanced-tender-estimates', tenderId] });
         queryClient.invalidateQueries({ queryKey: ['estimate-items', data.estimateId] });
       }
       toast({
        title: 'Document ajouté',
        description: data?.addedCount && data.addedCount > 0
          ? `DQE analysé: ${data.addedCount} articles ajoutés au devis.`
          : 'Le document a été téléchargé avec succès.',
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadFormData({
        category: 'administrative',
        subcategory: 'lettre_soumission',
        title: '',
        description: '',
        is_required: true
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du téléchargement du document.',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadFormData.title) {
        setUploadFormData(prev => ({ ...prev, title: file.name }));
      }
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier.',
        variant: 'destructive',
      });
      return;
    }

    if (!uploadFormData.title.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un titre pour le document.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Starting upload mutation with:', { file: selectedFile, documentData: uploadFormData });
    uploadMutation.mutate({ 
      file: selectedFile, 
      documentData: uploadFormData 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'requires_revision': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'requires_revision': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterDocumentsByCategory = (category: TenderDocumentCategory) => {
    return allDocuments?.filter(doc => doc.category === category) || [];
  };

   const handleSubcategoryChange = (value: TenderDocumentSubcategory) => {
     setUploadFormData(prev => ({ 
       ...prev, 
       subcategory: value,
      category: (value as string) === 'devis_quantitatif_estimatif' ? 'financial' : prev.category,
     }));
     
     // Show quantitative estimate component for "devis_quantitatif_estimatif"
     if ((value as string) === 'devis_quantitatif_estimatif') {
       setShowQuantitativeEstimate(true);
     } else {
       setShowQuantitativeEstimate(false);
     }
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-terracotta-600" />
              Documents d'Appel d'Offres
              {projectId && (
                <Badge variant="outline" className="ml-2">
                  Projet: {projectId.slice(0, 8)}...
                </Badge>
              )}
            </CardTitle>
            {isBidder && !readonly && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter Document
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as TenderDocumentCategory)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="administrative">Administratifs</TabsTrigger>
              <TabsTrigger value="technical">Techniques</TabsTrigger>
              <TabsTrigger value="financial">Financières</TabsTrigger>
            </TabsList>

            {(['administrative', 'technical'] as TenderDocumentCategory[]).map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-adrar-800 mb-2">
                    {TENDER_CATEGORY_LABELS[category]}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filterDocumentsByCategory(category).map((tenderDoc) => (
                    <Card key={tenderDoc.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">
                              {tenderDoc.subcategory === 'workflow_step' ? (
                                tenderDoc.document?.title || 'Document workflow'
                              ) : (
                                TENDER_DOCUMENT_LABELS[tenderDoc.subcategory]
                              )}
                            </h4>
                            {tenderDoc.subcategory === 'workflow_step' ? (
                              <p className="text-xs text-gray-500 flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                Étape {(tenderDoc as any).step_info?.step_number}: {(tenderDoc as any).step_info?.step_title}
                              </p>
                            ) : (
                              tenderDoc.document?.title && (
                                <p className="text-xs text-gray-600 mb-2">
                                  {tenderDoc.document.title}
                                </p>
                              )
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {tenderDoc.is_required && (
                              <Badge variant="outline" className="text-xs">
                                Requis
                              </Badge>
                            )}
                            <Badge className={getStatusColor(tenderDoc.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(tenderDoc.status)}
                                {tenderDoc.status === 'approved' ? 'Approuvé' : 
                                 tenderDoc.status === 'rejected' ? 'Rejeté' : 
                                 tenderDoc.status === 'requires_revision' ? 'Révision' : 'En attente'}
                              </div>
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {tenderDoc.document?.file_name && (
                          <div className="text-xs text-gray-500 mb-3">
                            Fichier: {tenderDoc.document.file_name}
                          </div>
                        )}
                        
                        {tenderDoc.reviewer_notes && (
                          <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                            <strong>Notes:</strong> {tenderDoc.reviewer_notes}
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          {tenderDoc.document && (
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filterDocumentsByCategory(category).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p>Aucun document {TENDER_CATEGORY_LABELS[category].toLowerCase()} trouvé.</p>
                  </div>
                )}
              </TabsContent>
            ))}

            <TabsContent value="financial" className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-adrar-800 mb-2">
                  {TENDER_CATEGORY_LABELS['financial']}
                </h3>
              </div>
              
              <Tabs defaultValue="documents" className="w-full">
                <TabsList>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="dqe">Devis Quantitatif Estimatif</TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filterDocumentsByCategory('financial').map((tenderDoc) => (
                      <Card key={tenderDoc.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm mb-1">
                                {TENDER_DOCUMENT_LABELS[tenderDoc.subcategory]}
                              </h4>
                              {tenderDoc.document?.title && (
                                <p className="text-xs text-gray-600 mb-2">
                                  {tenderDoc.document.title}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {tenderDoc.is_required && (
                                <Badge variant="outline" className="text-xs">
                                  Requis
                                </Badge>
                              )}
                              <Badge className={getStatusColor(tenderDoc.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(tenderDoc.status)}
                                  {tenderDoc.status === 'approved' ? 'Approuvé' : 
                                   tenderDoc.status === 'rejected' ? 'Rejeté' : 
                                   tenderDoc.status === 'requires_revision' ? 'Révision' : 'En attente'}
                                </div>
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {tenderDoc.document?.description && (
                            <p className="text-xs text-gray-600 mb-3">
                              {tenderDoc.document.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <FileText className="h-3 w-3" />
                              {tenderDoc.document?.file_name}
                            </div>
                            
                            {tenderDoc.document?.file_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => tenderDoc.document?.file_url && window.open(tenderDoc.document.file_url, '_blank')}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Voir
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {filterDocumentsByCategory('financial').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p>Aucun document financier trouvé.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="dqe" className="space-y-4">
                  <TenderQuantitativeEstimate 
                    tenderId={tenderId}
                    projectId={projectId}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un Document d'Appel d'Offres</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label>Catégorie</Label>
              <Select 
                value={uploadFormData.category} 
                onValueChange={(value: TenderDocumentCategory) => setUploadFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrative">Administratifs</SelectItem>
                  <SelectItem value="technical">Techniques</SelectItem>
                  <SelectItem value="financial">Financières</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sous-catégorie</Label>
              <Select 
                value={uploadFormData.subcategory} 
                onValueChange={handleSubcategoryChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  {uploadFormData.category === 'administrative' ? (
                    Object.entries(ADMINISTRATIVE_SUBCATEGORY_GROUPS).map(([groupKey, group]) => (
                      <div key={groupKey}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b">
                          {group.label}
                        </div>
                        {group.subcategories
                          .filter(subcat => Object.keys(TENDER_DOCUMENT_LABELS).includes(subcat))
                          .map((subcat) => (
                            <SelectItem key={subcat} value={subcat as TenderDocumentSubcategory} className="pl-6">
                              {TENDER_DOCUMENT_LABELS[subcat as keyof typeof TENDER_DOCUMENT_LABELS]}
                            </SelectItem>
                          ))}
                      </div>
                    ))
                  ) : (
                    Object.entries(TENDER_DOCUMENT_LABELS)
                      .filter(([key]) => {
                        if (uploadFormData.category === 'technical') {
                          return ['preuves_capacites_techniques', 'experience_generale_marche', 'methodologie', 'personnel_cle', 'planning_travaux', 'calendrier_livraison', 'conformite_techniques', 'description_besoin', 'ddqe', 'termes_reference', 'pv_evaluation_technique'].includes(key);
                        } else {
                          return ['preuves_capacites_financieres', 'chiffre_affaires_annuel', 'devis_quantitatif_estimatif', 'garantie_bancaire', 'garantie_soumission', 'source_financement', 'montant_alloue', 'devis_comparatifs', 'factures_commandes', 'montant_marche'].includes(key);
                        }
                      })
                      .map(([key, label]) => (
                        <SelectItem key={key} value={key as TenderDocumentSubcategory}>
                          {label}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Show special message for quantitative estimate */}
            {uploadFormData.subcategory === 'devis_quantitatif_estimatif' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-start gap-2">
                  <Calculator className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Devis Quantitatif Estimatif</p>
                    <p>Vous pouvez créer un devis calculé à partir du référentiel matériaux ou télécharger une facture/bon de commande existant.</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Titre</Label>
              <Input
                value={uploadFormData.title}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre du document..."
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={uploadFormData.description}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du document (optionnel)..."
              />
            </div>

            <div>
              <Label>Fichier</Label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                required
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Fichier sélectionné: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={uploading || uploadMutation.isPending}>
                {uploading || uploadMutation.isPending ? 'Téléchargement...' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenderDocumentManager;
