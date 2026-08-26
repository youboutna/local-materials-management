import React, { useState } from 'react';
import { useDocumentViewer } from "@/components/documents/viewer";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Eye, CheckCircle, XCircle, Clock, AlertCircle, Plus, Calculator, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { BoqLineTable, BoqImportDialog, useBoqDocument } from '@/components/boq';
import TenderLotDocumentsManager, { LotOption } from './TenderLotDocumentsManager';
import { useTenderLots } from '@/hooks/hexagonal/useTenderLotsHex';
import { useTenderLotDocuments } from '@/hooks/hexagonal/useTenderLotDocumentsHex';
import {
  useTenderDocumentsList,
  useWorkflowStepDocumentsList,
  useUploadTenderDocument,
} from '@/hooks/hexagonal/useTenderDocumentsHex';
import { TenderEstimateService } from '@/application/services/TenderEstimateService';
import { parsePdf, calculateAdvancedQuantities } from '@/utils/btpCalculations';
import { TenderDocumentWithDetails } from '@/hooks/hexagonal/useTenderDocumentsHex';
import { TENDER_CATEGORY_LABELS, TENDER_DOCUMENT_LABELS, ADMINISTRATIVE_SUBCATEGORY_GROUPS } from '@/dtos';
import { TenderDocumentCategory, TenderDocumentSubcategory } from './PublicProcurementWorkflow';
import { TranslatedCategory } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';

// ✅ IMPORT entityLabels
import { getEntityLabel } from '@/utils/entityLabels';
import { useProjectsHex } from '@/hooks/hexagonal/useProjectsHex';

/**
 * TenderEstimateBoq — remplace le legacy TenderQuantitativeEstimate.
 * Utilise le noyau BOQ composable (source = 'tender_estimate') via hooks hex.
 */
const TenderEstimateBoq: React.FC<{ tenderId: string }> = ({ tenderId }) => {
  const boq = useBoqDocument({ source: 'tender_estimate', contextId: tenderId });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <BoqImportDialog
          source="tender_estimate"
          contextId={tenderId}
          title="Importer un DQE prévisionnel"
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" /> <T k="auto.tenderdocumentmanager.importer_dqe" fallback="Importer DQE" />
            </Button>
          }
          onImported={() => boq.refetch()}
        />
      </div>
      {boq.isLoading ? (
        <div className="text-sm text-muted-foreground">Chargement…</div>
      ) : (
        <BoqLineTable
          lines={boq.lines}
          emptyLabel="Aucune ligne d'estimation. Importez un DQE pour démarrer."
        />
      )}
    </div>
  );
};

interface TenderDocumentManagerProps {
  tenderId: string;
  projectId?: string;
  readonly?: boolean;
}

const TenderDocumentManager = ({ tenderId, projectId, readonly = false }: TenderDocumentManagerProps) => {
  const { openDocument } = useDocumentViewer();
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
  const { data: tenderLots = [] } = useTenderLots(tenderId);
  
  // ✅ Récupérer les projets pour les labels
  const { projects = [] } = useProjectsHex();
  
  const lotOptions: LotOption[] = (tenderLots as any[]).map((l) => ({
    id: l.id,
    number: l.number ?? 1,
    title: l.title ?? '',
  }));

  // Check if user is bidder/supplier
  const isBidder = hasRole('supplier') || hasRole('agent');

  // Fetch tender documents (joined with document metadata via hexagonal hook)
  const { data: tenderDocuments, isLoading: isTenderDocsLoading } = useTenderDocumentsList(tenderId);

  // Fetch workflow step documents (via hexagonal hook)
  const { data: workflowStepDocuments, isLoading: isWorkflowDocsLoading } = useWorkflowStepDocumentsList(tenderId);

  const { data: lotDocsRaw = [] } = useTenderLotDocuments(tenderId);

  const isLoading = isTenderDocsLoading || isWorkflowDocsLoading;

  // Normalize lot document category (may be French label or key) to canonical category
  const normalizeCategory = (cat: string | null | undefined): TenderDocumentCategory | null => {
    if (!cat) return null;
    const c = cat.toLowerCase().trim();
    if (c.startsWith('admin')) return 'administrative';
    if (c.startsWith('tech')) return 'technical';
    if (c.startsWith('fin')) return 'financial';
    if (c === 'administrative' || c === 'technical' || c === 'financial') return c as TenderDocumentCategory;
    return null;
  };

  const lotDocumentsAsTenderDocs = (lotDocsRaw as any[]).map((d) => {
    const lotLabel = d.lotId
      ? (() => {
          const lot = lotOptions.find((l) => l.id === d.lotId);
          return lot ? `Lot ${lot.number} — ${lot.title}` : 'Lot';
        })()
      : 'Communs à tous les lots';
    return {
      id: `lot-${d.id}`,
      tender_id: d.tenderId,
      document_id: d.id,
      category: (normalizeCategory(d.category) ?? 'administrative') as TenderDocumentCategory,
      subcategory: 'workflow_step' as any,
      is_required: false,
      reviewer_notes: null,
      status: 'pending' as any,
      created_at: d.createdAt,
      updated_at: d.updatedAt,
      document: {
        id: d.id,
        title: d.title,
        description: d.description,
        file_url: d.fileUrl,
        file_name: d.fileName,
        mime_type: d.mimeType,
        file_size: d.fileSize,
      },
      step_info: {
        step_title: lotLabel,
        step_number: '',
      },
    } as unknown as TenderDocumentWithDetails;
  });

  // Combine all documents (tender-level + workflow steps + lot documents)
  const allDocuments = [
    ...(tenderDocuments || []),
    ...(workflowStepDocuments || []),
    ...lotDocumentsAsTenderDocs,
  ];

  const uploadTenderDocument = useUploadTenderDocument(tenderId, projectId);
  const tenderEstimateService = new TenderEstimateService();

  // Updated upload document mutation to use tender_id
  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentData }: { file: File; documentData: any }) => {
      // Upload file first
      const uploadResult = await uploadFile(file, `tender-documents/${tenderId}`);

      if (!uploadResult.success) {
        throw new Error('File upload failed');
      }

      // Create document + tender document records via the hexagonal hook
      const { document, tenderDoc } = await uploadTenderDocument.mutateAsync({
        fileUrl: uploadResult.url!,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        documentData: {
          category: documentData.category,
          subcategory: documentData.subcategory,
          title: documentData.title,
          description: documentData.description,
          is_required: documentData.is_required,
        }
      });

      // Hook: if DQE PDF uploaded under financial category, parse and auto-add items
      let estimateId: string | null = null;
      let addedCount = 0;
      try {
        const isDqePdf =
          documentData.subcategory === 'devis_quantitatif_estimatif' &&
          file.type === 'application/pdf';

        if (isDqePdf) {
          const estimate = await tenderEstimateService.findOrCreateDraftEstimateForTender(tenderId, projectId || null);
          estimateId = estimate.id;

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
              try {
                const created = await tenderEstimateService.addRawEstimateItems(items);
                addedCount = created.length;
              } catch (addItemsError) {
                console.warn('Failed to insert estimate items from DQE:', addItemsError);
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
      case 'approved': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'requires_revision': return <AlertCircle className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success-soft text-success';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      case 'requires_revision': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-foreground';
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

  // ✅ RÉSOLUTION DU LABEL DU PROJET POUR LE BADGE
  const projectLabel = projectId 
    ? getEntityLabel(projectId, projects, 'project')
    : '';

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
                  {/* ✅ AFFICHAGE DU LABEL AU LIEU DE projectId.slice(0, 8) */}
                  Projet: {projectLabel || projectId.slice(0, 8)}
                </Badge>
              )}
            </CardTitle>
            {isBidder && !readonly && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                <T k="auto.tenderdocumentmanager.ajouter_document" fallback="Ajouter Document" />
              </Button>
            )}
          </div>
        </CardHeader>
        {/* ... reste du composant inchangé ... */}
      </Card>
    </div>
  );
};

export default TenderDocumentManager;