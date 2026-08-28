import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Upload,
  Download,
  Eye,
  LogIn,
  LogOut,
  User,
  Key,
  CheckCircle,
  MessageCircle,
  Clock,
  Send,
  Share2,
  Plus,
  Bell,
  DollarSign,
  Package,
  TrendingUp,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  Search,
  Filter,
  Receipt,
  FileX,
  FileCheck,
  Building,
  CreditCard,
  MoreHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDocumentStorage } from "@/hooks/useDocumentStorage";
import { useParsedInvoicesHex, useInvoiceMutationsHex } from "@/hooks/hexagonal/useInvoicesHex";
import { parsePdf } from "@/utils/btpCalculations";
import type { BtpTables } from "@/integrations/supabase/btp-types";
import { T } from '@/components/i18n/T';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatReference } from '@/utils/entityLabels';

type SupplierNotificationRow = BtpTables<"supplier_notifications">;
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import SupplierPaymentRequest from "@/components/suppliers/SupplierPaymentRequest";
import EnhancedSupplierTenderPortal from "@/components/suppliers/EnhancedSupplierTenderPortal";
import { UnlockedView as SecretUnlockedView } from "@/components/tenders/SupplierSecureAccessPortal";
import { BoqWorkspace } from "@/components/boq";
import { DqeWorkspace } from "@/components/boq/DqeWorkspace";
import { SupplierInspectionsList } from "@/components/supplier/SupplierInspectionsList";
import { LocalFilePreviewButton, useDocumentViewer } from "@/components/documents/viewer";
import { useSupplierInspections } from "@/hooks/useSupplierInspections";
import { InspectionTransformer } from "@/dtos/transforms/InspectionTransformer";
import { formatAmount2, formatNumber2, formatPercent2 } from '@/utils/reportNumbers';
import {
  useSupplierPortalAuthHex,
  useFetchSupplierProfileHex,
  useSupplierLoginHex,
  useSupplierSignUpHex,
  useSupplierLogoutHex,
  useUploadSupplierDocumentHex,
  useMarkTaskCompletedHex,
  useSupplierPortalNotificationsHex,
  useSupplierPortalPaymentRequestsHex,
  useSupplierPortalDocumentsHex,
  useAddSupplierTaskCommentHex,
} from "@/hooks/hexagonal";

// ✅ Import du panneau réutilisable
import { AssociatedPaymentsPanel } from "@/components/common/AssociatedPaymentsPanel";

// ✅ Import du GED centralisé (DocumentHub)
import { DocumentHub } from "@/components/documents/hub/DocumentHub";
import { SupplierContractsPanel } from "@/components/suppliers/SupplierContractsPanel";
import { SupplierQuoteStatusPanel } from "@/components/suppliers/SupplierQuoteStatusPanel";

import type { DocumentHubContract, DocumentItem, UploadInput } from "@/components/documents/hub/types";

// ✅ Définition du contrat GED pour le fournisseur
function createSupplierDocumentHubContract(
  supplierId: string,
  documents: any[],
  refetch: () => void,
  uploadDocument: (data: any) => void,
  deleteDocument?: (id: string) => void
): DocumentHubContract {
  return {
    scopeLabel: "Documents fournisseur",
    canUpload: true,
    facets: [
      {
        key: "documentType",
        label: "Type",
        options: [
          { value: "inspection", label: "Inspection" },
          { value: "plan", label: "Plan" },
          { value: "photo", label: "Photo" },
          { value: "invoice", label: "Facture" },
          { value: "purchase_order", label: "Bon de commande" },
          { value: "inquiry", label: "Demande" },
          { value: "contract", label: "Contrat" },
          { value: "report", label: "Rapport" },
          { value: "certificate", label: "Certificat" },
          { value: "specification", label: "Spécification" },
          { value: "supplier_info", label: "Information fournisseur" },
        ],
      },
      {
        key: "status",
        label: "Statut",
        options: [
          { value: "draft", label: "Brouillon" },
          { value: "pending_review", label: "En révision" },
          { value: "approved", label: "Approuvé" },
          { value: "rejected", label: "Rejeté" },
        ],
      },
    ],
    categoryLabels: {
      inspection: "Inspection",
      plan: "Plan",
      photo: "Photo",
      invoice: "Facture",
      purchase_order: "Bon de commande",
      inquiry: "Demande",
      contract: "Contrat",
      report: "Rapport",
      certificate: "Certificat",
      specification: "Spécification",
      supplier_info: "Information fournisseur",
      draft: "Brouillon",
      pending_review: "En révision",
      approved: "Approuvé",
      rejected: "Rejeté",
    },
    useDocuments: () => {
      const items = documents.map((doc): DocumentItem => ({
        id: doc.id,
        title: doc.title,
        fileName: doc.fileName || doc.file_name || doc.title,
        fileUrl: doc.fileUrl || doc.file_url || doc.fileUrl,
        fileSize: doc.fileSize || doc.file_size || 0,
        mimeType: doc.mimeType || doc.mime_type || "application/octet-stream",
        createdAt: doc.createdAt || doc.created_at || new Date().toISOString(),
        updatedAt: doc.updatedAt || doc.updated_at || new Date().toISOString(),
        category: doc.documentType || doc.document_type || "other",
        status: doc.status || "draft",
        facets: {
          documentType: doc.documentType || doc.document_type || "other",
          status: doc.status || "draft",
        },
        raw: doc,
      }));
      return { data: items, isLoading: false, refetch };
    },
    onUpload: async (input: UploadInput) => {
      await uploadDocument({
        file: input.file,
        title: input.title || input.file.name,
        description: input.description || "",
        documentType: input.category || "other",
        supplierId,
      });
      refetch();
    },
    onDelete: deleteDocument
      ? async (item: DocumentItem) => {
          await deleteDocument(item.id);
          refetch();
        }
      : undefined,
  };
}

const UnifiedSupplierPortal = () => {
  const { t } = useLanguage();
  const { openDocument } = useDocumentViewer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [documentType, setDocumentType] = useState<string>("supplier_info");
  const [taskComment, setTaskComment] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "documents";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedBidTenderId, setSelectedBidTenderId] = useState<string | null>(
    searchParams.get("tenderId"),
  );

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== activeTab) setActiveTab(urlTab);
  }, [searchParams]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ tenderId?: string }>).detail;
      if (detail?.tenderId) {
        setSelectedBidTenderId(detail.tenderId);
        setActiveTab("devis");
        const next = new URLSearchParams(searchParams);
        next.set("tab", "devis");
        next.set("tenderId", detail.tenderId);
        setSearchParams(next, { replace: true });
      }
    };
    window.addEventListener("boq-create-quote", handler);
    return () => window.removeEventListener("boq-create-quote", handler);
  }, [searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  const [prefillPaymentData, setPrefillPaymentData] = useState<{
    projectId?: string;
    amount?: number;
    description?: string;
    initiationId?: string;
  } | null>(null);
  const { toast } = useToast();
  const { uploadFile: storageUpload, uploading } = useDocumentStorage();

  const { user, session, loading } = useSupplierPortalAuthHex();
  const { data: supplierProfile } = useFetchSupplierProfileHex(user);
  const { data: notificationsRaw } = useSupplierPortalNotificationsHex(supplierProfile?.id ?? "");
  const notifications = (notificationsRaw ?? []) as SupplierNotificationRow[];
  const { data: paymentRequests = [], refetch: refetchPaymentRequests } = useSupplierPortalPaymentRequestsHex(supplierProfile?.id ?? "");
  const { data: documents = [], refetch: refetchDocuments } = useSupplierPortalDocumentsHex(supplierProfile?.id ?? "");
  
  const loginMutation = useSupplierLoginHex();
  const signUpMutation = useSupplierSignUpHex();
  const logoutMutation = useSupplierLogoutHex();
  const uploadDocumentMutation = useUploadSupplierDocumentHex();
  const addTaskCommentMutation = useAddSupplierTaskCommentHex();
  const markTaskCompletedMutation = useMarkTaskCompletedHex();

  const { invoices: parsedInvoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useParsedInvoicesHex(supplierProfile?.id || "");
  const { createInvoice, isCreating: isParsingInvoice } = useInvoiceMutationsHex();
  const [invoiceParsing, setInvoiceParsing] = useState(false);

  const handleInvoiceUpload = async (file: File) => {
    if (!user || !file) return;
    setInvoiceParsing(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `invoices/${user.id}/${Date.now()}-${formatReference(crypto.randomUUID(), '')}-${safeName}`;
      const up = await storageUpload(file, path);
      if (!up.success) throw new Error("Upload échoué");

      const { unifiedBoqParser } = await import('@/application/services/boq/UnifiedBoqParser');
      const { BoqImportOrchestrator } = await import('@/application/services/boq/BoqImportOrchestrator');

      let parsed: Awaited<ReturnType<typeof unifiedBoqParser.parse>> | null = null;
      let dtos: ReturnType<typeof BoqImportOrchestrator.toDtos> = [];
      let parseError: string | null = null;
      try {
        parsed = await unifiedBoqParser.parse(file);
        dtos = BoqImportOrchestrator.toDtos(parsed.rows, parsed.autoMapping, {
          source: 'supplier_bid',
          contextId: supplierProfile?.id ?? user.id,
          detectedVatRate: parsed.detectedFiscal?.vatRate ?? null,
        });
      } catch (e) {
        parseError = e instanceof Error ? e.message : String(e);
      }

      const totalHt = dtos.reduce((s, d) => s + (Number(d.totalHt ?? (d.quantity * (d.unitPrice ?? 0))) || 0), 0);
      const vatRate = parsed?.detectedFiscal?.vatRate ?? 0;
      const totalTtc = parsed?.detectedFiscal?.totalTtc ?? (totalHt * (1 + vatRate));
      const amount = totalTtc > 0 ? totalTtc : (totalHt > 0 ? totalHt : null);

      await createInvoice({
        id: crypto.randomUUID(),
        fileName: safeName,
        originalFileName: file.name,
        filePath: up.url,
        fileSize: file.size,
        mimeType: file.type || 'application/pdf',
        supplierId: supplierProfile?.id ?? null,
        invoiceType: 'supplier_invoice',
        status: parseError ? 'rejected' : (dtos.length ? 'validated' : 'pending'),
        amount,
        currency: 'MRU',
        extractedData: parsed ? {
          items: dtos,
          columns: parsed.columns,
          detectedFiscal: parsed.detectedFiscal,
          warnings: parsed.warnings,
          totals: { ht: totalHt, tva: totalHt * vatRate, ttc: totalTtc, vatRate },
        } : null,
        parsingErrors: parseError ? [parseError] : null,
        uploadedBy: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
      toast({
        title: 'Facture analysée',
        description: parseError
          ? `Erreur d'analyse: ${parseError}`
          : `${dtos.length} lignes extraites — Total HT ${formatAmount2(totalHt)}${vatRate ? ` · TVA ${formatPercent2(vatRate * 100)}` : ''}`,
      });
      refetchInvoices();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message ?? 'Analyse impossible', variant: 'destructive' });
    } finally {
      setInvoiceParsing(false);
    }
  };

  const {
    inspections: supplierInspections = [],
    loading: inspectionsLoading,
    refetch: refetchInspections,
  } = useSupplierInspections(supplierProfile?.id || null);

  const handleLogin = async () => {
    loginMutation.mutate({ email, password });
  };

  const handleSignUp = async () => {
    signUpMutation.mutate({ email, password });
  };

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTitle.trim() || !user) return;

    const safeName = uploadFile.name.replace(/[^\w.\-]+/g, "_");
    const uniquePath = `supplier-uploads/${user.id}/${Date.now()}-${formatReference(crypto.randomUUID(), '')}-${safeName}`;
    const uploadResult = await storageUpload(uploadFile, uniquePath);

    if (!uploadResult.success) {
      return;
    }

    uploadDocumentMutation.mutate({
      file: uploadFile,
      userId: user.id,
      title: uploadTitle,
      description: uploadDescription,
      documentType: documentType,
      supplierId: supplierProfile?.id,
    });

    setUploadFile(null);
    setUploadTitle("");
    setUploadDescription("");
  };

  const handleTaskComment = async (taskId: string) => {
    if (!taskComment.trim() || !user || !supplierProfile?.id) return;

    addTaskCommentMutation.mutate({
      taskId,
      email: user.email || "",
      comment: taskComment,
    });

    setTaskComment("");
    setSelectedTaskId(null);
  };

  const handleTaskCompletion = async (taskId: string) => {
    if (!user || !supplierProfile?.id) return;

    markTaskCompletedMutation.mutate({
      taskId,
      projectManagerId: supplierProfile.id,
    });
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType =
      typeFilter === "all" || doc.documentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPayments = paymentRequests.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const pendingPayments = paymentRequests.filter(
    (p) => p.status === "pending"
  ).length;
  const unreadNotifications = notifications.filter((n) => !n.used_at).length;
  const paymentInitiationsCount = notifications.filter(
    (n) => n.notification_type === "payment_initiation" && !n.used_at
  ).length;

  const handlePaymentInitiationClick = (notification: SupplierNotificationRow) => {
    const metadata = notification.metadata as any;
    setPrefillPaymentData({
      projectId: metadata?.project_id,
      amount: metadata?.estimated_amount,
      description: metadata?.justification,
      initiationId: notification.id,
    });
    setActiveTab("payments");
  };

  const guestPayload = React.useMemo(() => {
    const tenderId = searchParams.get('tenderId');
    const secret = searchParams.get('secret');
    if (tenderId && secret) {
      return { tenderId, secretCode: secret, allowedDocuments: [] as string[] };
    }
    try {
      const raw = sessionStorage.getItem('supplier-tender-secret');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.tenderId && parsed?.secretCode) {
          return {
            tenderId: parsed.tenderId as string,
            secretCode: parsed.secretCode as string,
            allowedDocuments: (parsed.allowedDocuments ?? []) as string[],
          };
        }
      }
    } catch { /* noop */ }
    return null;
  }, [searchParams]);

  // ✅ Construction du contrat GED fournisseur
  const supplierDocumentHubContract = useMemo(() => {
    if (!supplierProfile?.id) return null;
    return createSupplierDocumentHubContract(
      supplierProfile.id,
      documents,
      refetchDocuments,
      uploadDocumentMutation.mutate,
      undefined // pas de suppression pour l'instant
    );
  }, [supplierProfile, documents, refetchDocuments, uploadDocumentMutation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && guestPayload) {
    const guestTab = searchParams.get("tab") === "documents" ? "documents" : "tenders";
    const setGuestTab = (v: string) => {
      const next = new URLSearchParams(searchParams);
      next.set("tab", v);
      setSearchParams(next, { replace: true });
    };
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-success" />
              <div>
                <h1 className="text-xl font-semibold"><T k="auto.unifiedsupplierportal.acces_securise_fournisseur" fallback="Accès sécurisé fournisseur" /></h1>
                <p className="text-sm text-muted-foreground">
                  <T k="auto.unifiedsupplierportal.consultez_l_appel_d_offres_et_les_documents_part" fallback="Consultez l'appel d'offres et les documents partagés." />
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                try { sessionStorage.removeItem('supplier-tender-secret'); } catch { /* noop */ }
                window.location.href = '/supplier-access';
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <T k="auto.unifiedsupplierportal.quitter" fallback="Quitter" />
            </Button>
          </div>

          <Tabs value={guestTab} onValueChange={setGuestTab} className="space-y-4">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-2">
              <TabsTrigger value="tenders"><T k="auto.unifiedsupplierportal.appel_d_offres" fallback="Appel d'offres" /></TabsTrigger>
              <TabsTrigger value="documents"><T k="auto.unifiedsupplierportal.documents_partages" fallback="Documents partagés" /></TabsTrigger>
            </TabsList>
            <TabsContent value="tenders">
              <EnhancedSupplierTenderPortal />
            </TabsContent>
            <TabsContent value="documents">
              <SecretUnlockedView
                payload={guestPayload}
                onReset={() => {
                  try { sessionStorage.removeItem('supplier-tender-secret'); } catch { /* noop */ }
                  window.location.href = '/supplier-access';
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <User className="h-6 w-6" />
              {isLoginMode
                ? "Connexion Fournisseur"
                : "Inscription Fournisseur"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email"><T k="auto.unifiedsupplierportal.email" fallback="Email" /></Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password"><T k="auto.unifiedsupplierportal.mot_de_passe" fallback="Mot de passe" /></Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button
              onClick={isLoginMode ? handleLogin : handleSignUp}
              className="w-full"
              disabled={loading}
            >
              {loading
                ? "Chargement..."
                : isLoginMode
                ? "Se connecter"
                : "S'inscrire"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="w-full"
            >
              {isLoginMode
                ? "Pas de compte ? S'inscrire"
                : "Déjà inscrit ? Se connecter"}
            </Button>

            {/* Voies d'accès alternatives : le portail ne doit jamais être un cul-de-sac */}
            <div className="border-t pt-3 space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/supplier-access')}
              >
                <T k="auto.unifiedsupplierportal.acces_par_code_securise" fallback="Accès par code sécurisé (appel d'offres)" />
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/tenders-public')}
              >
                <T k="auto.unifiedsupplierportal.consulter_les_appels_d_offres_publics" fallback="Consulter les appels d'offres publics" />
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 to-secondary/5">
      <main className="flex-grow py-6">
        <div className="container mx-auto px-4">
          {/* Header compact : titre + pastilles + déconnexion sur une seule ligne */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h1 className="truncate text-lg font-bold text-primary sm:text-xl">
                <T k="auto.unifiedsupplierportal.portail_fournisseur" fallback="Portail Fournisseur" />
              </h1>
              <span className="truncate text-xs text-muted-foreground">
                {supplierProfile?.name || user.email}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                <DollarSign className="h-3.5 w-3.5" />
                {formatAmount2(totalPayments)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5 text-warning" />
                {pendingPayments}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs">
                <Bell className="h-3.5 w-3.5 text-primary" />
                {unreadNotifications}
              </span>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              <T k="auto.unifiedsupplierportal.deconnexion" fallback="Déconnexion" />
            </Button>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="tenders" className="space-y-5" value={activeTab} onValueChange={handleTabChange}>

            <TabsList className="grid h-auto w-full grid-cols-5 p-1 lg:max-w-3xl">
              <TabsTrigger value="tenders">{t('supplier_experience.tenders_tab', undefined, "Appels d'Offres")}</TabsTrigger>
              <TabsTrigger value="devis"><T k="auto.unifiedsupplierportal.devis" fallback="Devis" /></TabsTrigger>
              <TabsTrigger value="documents">
                <T k="auto.unifiedsupplierportal.documents" fallback="Documents" /> ({documents.length})
              </TabsTrigger>
              <TabsTrigger value="notifications" className="relative">
                Notifications ({unreadNotifications})
                {paymentInitiationsCount > 0 && (
                  <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-xs">
                    {paymentInitiationsCount}
                  </Badge>
                )}
              </TabsTrigger>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 min-w-0 px-2 data-[state=open]:bg-background" aria-label={t('supplier_experience.more')}>
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('supplier_experience.more')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onSelect={() => handleTabChange('contracts')}><FileText className="mr-2 h-4 w-4" />{t('supplier.contracts.tab') || 'Contrats'}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleTabChange('upload')}><Upload className="mr-2 h-4 w-4" />{t('auto.unifiedsupplierportal.telecharger')}</DropdownMenuItem>

                  <DropdownMenuItem onSelect={() => handleTabChange('payments')}><CreditCard className="mr-2 h-4 w-4" />{t('auto.unifiedsupplierportal.paiements')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleTabChange('tasks')}><ClipboardCheck className="mr-2 h-4 w-4" />{t('auto.unifiedsupplierportal.taches')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleTabChange('inspections')}><FileCheck className="mr-2 h-4 w-4" />{t('auto.unifiedsupplierportal.inspections')}</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleTabChange('invoices')}><Receipt className="mr-2 h-4 w-4" />{t('auto.unifiedsupplierportal.factures')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsList>

            {/* ✅ ONGLET DOCUMENTS – Utilise le GED centralisé */}
            <TabsContent value="documents">
              {supplierDocumentHubContract ? (
                <DocumentHub
                  contract={supplierDocumentHubContract}
                  heading={
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <div>
                        <h2 className="text-sm font-semibold"><T k="auto.unifiedsupplierportal.ged_fournisseur" fallback="GED Fournisseur" /></h2>
                        <p className="text-xs text-muted-foreground">
                          <T k="auto.unifiedsupplierportal.tous_les_documents_lies_a_votre_compte_fournisse" fallback="Tous les documents liés à votre compte fournisseur" />
                        </p>
                      </div>
                    </div>
                  }
                />
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <T k="auto.unifiedsupplierportal.chargement_du_hub_documentaire" fallback="Chargement du hub documentaire..." />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tender Submissions Tab */}
            <TabsContent value="tenders">
              <EnhancedSupplierTenderPortal />
            </TabsContent>

            {/* Devis Tab */}
            <TabsContent value="devis" className="space-y-4">
              <SupplierQuoteStatusPanel supplierId={supplierProfile?.id} />
              {supplierProfile?.id ? (
                selectedBidTenderId ? (
                  <DqeWorkspace
                    routeContext="supplier-bid"
                    tenderId={selectedBidTenderId}
                    senderId={supplierProfile.id}
                    submissionId={supplierProfile.id}
                    recipientEmail={supplierProfile.email ?? undefined}
                  />
                ) : (
                  <Card><CardContent className="py-6"><p className="text-sm text-muted-foreground">Sélectionnez un appel d'offres dans l'onglet « Appels d'Offres » puis cliquez « Créer un devis » pour démarrer le chiffrage.</p></CardContent></Card>
                )
              ) : (
                <Card><CardContent className="py-6"><p className="text-sm text-muted-foreground"><T k="auto.unifiedsupplierportal.profil_fournisseur_requis" fallback="Profil fournisseur requis." /></p></CardContent></Card>
              )}
            </TabsContent>

            {/* Contracts Tab – contrats signés / bons de commande */}
            <TabsContent value="contracts">
              <SupplierContractsPanel supplierId={supplierProfile?.id} />
            </TabsContent>


            {/* Upload Tab – Conservé pour compatibilité / téléchargement rapide */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <T k="auto.unifiedsupplierportal.telecharger_un_document" fallback="Télécharger un Document" />
                  </CardTitle>
                  <CardDescription>
                    Les documents seront également visibles dans l'onglet "Documents" via le hub GED.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="upload-title"><T k="auto.unifiedsupplierportal.titre_du_document" fallback="Titre du document" /></Label>
                    <Input
                      id="upload-title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Entrez le titre..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="document-type"><T k="auto.unifiedsupplierportal.type_de_document" fallback="Type de document" /></Label>
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inspection"><T k="auto.unifiedsupplierportal.inspection" fallback="Inspection" /></SelectItem>
                        <SelectItem value="plan"><T k="auto.unifiedsupplierportal.plan" fallback="Plan" /></SelectItem>
                        <SelectItem value="photo"><T k="auto.unifiedsupplierportal.photo" fallback="Photo" /></SelectItem>
                        <SelectItem value="invoice"><T k="auto.unifiedsupplierportal.facture" fallback="Facture" /></SelectItem>
                        <SelectItem value="purchase_order">
                          <T k="auto.unifiedsupplierportal.bon_de_commande" fallback="Bon de commande" />
                        </SelectItem>
                        <SelectItem value="inquiry"><T k="auto.unifiedsupplierportal.demande" fallback="Demande" /></SelectItem>
                        <SelectItem value="contract"><T k="auto.unifiedsupplierportal.contrat" fallback="Contrat" /></SelectItem>
                        <SelectItem value="report"><T k="auto.unifiedsupplierportal.rapport" fallback="Rapport" /></SelectItem>
                        <SelectItem value="certificate"><T k="auto.unifiedsupplierportal.certificat" fallback="Certificat" /></SelectItem>
                        <SelectItem value="specification">
                          <T k="auto.unifiedsupplierportal.specification" fallback="Spécification" />
                        </SelectItem>
                        <SelectItem value="supplier_info">
                          <T k="auto.unifiedsupplierportal.informations_fournisseur" fallback="Informations fournisseur" />
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="upload-description"><T k="auto.unifiedsupplierportal.description" fallback="Description" /></Label>
                    <Textarea
                      id="upload-description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Description optionnelle..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="upload-file"><T k="auto.unifiedsupplierportal.fichier" fallback="Fichier" /></Label>
                    <Input
                      id="upload-file"
                      type="file"
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] || null)
                      }
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    {uploadFile && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate max-w-[220px]">{uploadFile.name}</span>
                        <LocalFilePreviewButton
                          file={uploadFile}
                          title={uploadTitle || uploadFile.name}
                          documentType={documentType}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleFileUpload}
                    disabled={uploading || !uploadFile || !uploadTitle.trim()}
                    className="w-full"
                  >
                    {uploading
                      ? "Téléchargement..."
                      : "Télécharger le document"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments">
              <div className="space-y-6">
                {supplierProfile && (
                  <SupplierPaymentRequest 
                    supplierId={supplierProfile.id} 
                    prefillData={prefillPaymentData}
                    onPrefillUsed={() => setPrefillPaymentData(null)}
                  />
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <T k="auto.unifiedsupplierportal.mes_demandes_de_paiement" fallback="Mes demandes de paiement" />
                    </CardTitle>
                    <CardDescription>
                      <T k="auto.unifiedsupplierportal.historique_et_suivi_de_vos_demandes_de_paiement" fallback="Historique et suivi de vos demandes de paiement" />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AssociatedPaymentsPanel
                      entityType="supplier"
                      entityId={supplierProfile?.id || ''}
                      showActions={false}
                      onPaymentCreated={() => {
                        refetchPaymentRequests();
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <T k="auto.unifiedsupplierportal.notifications" fallback="Notifications" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications
                      .filter((n) => n.notification_type === "payment_initiation")
                      .map((notification) => {
                        const metadata = notification.metadata as any;
                        return (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-lg border-2 ${
                              notification.used_at
                                ? "bg-muted/50 border-muted"
                                : "bg-success-soft border-success/30"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-5 w-5 text-success" />
                                  <h3 className="font-semibold text-success">
                                    <T k="auto.unifiedsupplierportal.demande_de_paiement_initiee" fallback="Demande de Paiement Initiée" />
                                  </h3>
                                  {!notification.used_at && (
                                    <Badge className="bg-success"><T k="auto.unifiedsupplierportal.action_requise" fallback="Action requise" /></Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                  {metadata?.justification || "Demande de paiement en attente de complétion"}
                                </p>
                                <div className="flex gap-4 mt-2 text-sm">
                                  <span className="font-medium">
                                    Montant estimé: {formatAmount2(metadata?.estimated_amount || 0)}
                                  </span>
                                  {metadata?.deadline && (
                                    <span className="text-warning">
                                      <Clock className="inline h-3 w-3 mr-1" />
                                      Délai: {new Date(metadata.deadline).toLocaleDateString("fr-FR")}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Reçu le {notification.sent_at
                                    ? new Date(notification.sent_at).toLocaleDateString("fr-FR")
                                    : "Date inconnue"}
                                </p>
                              </div>
                              {!notification.used_at && (
                                <Button 
                                  onClick={() => handlePaymentInitiationClick(notification)}
                                  className="bg-success hover:bg-success"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  <T k="auto.unifiedsupplierportal.completer_la_demande" fallback="Compléter la demande" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {notifications
                      .filter((n) => n.notification_type !== "payment_initiation")
                      .map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.used_at
                              ? "bg-muted/50"
                              : "bg-primary/10 border-primary/30"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">
                                {notification.notification_type}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {typeof notification.metadata === "object" &&
                                notification.metadata &&
                                "comment" in notification.metadata
                                  ? String(notification.metadata.comment)
                                  : ""}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {notification.sent_at
                                  ? new Date(
                                      notification.sent_at
                                    ).toLocaleDateString("fr-FR")
                                  : "Date inconnue"}
                              </p>
                            </div>
                            {!notification.used_at && (
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-primary"
                              >
                                <T k="auto.unifiedsupplierportal.nouveau" fallback="Nouveau" />
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}

                    {notifications.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        <T k="auto.unifiedsupplierportal.aucune_notification" fallback="Aucune notification" />
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    <T k="auto.unifiedsupplierportal.taches_assignees" fallback="Tâches Assignées" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.filter((n) =>
                      n.notification_type.includes("task")
                    ).length > 0 ? (
                      notifications
                        .filter((n) => n.notification_type.includes("task"))
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-4 rounded-lg border bg-card"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">
                                  {task.notification_type}
                                </h3>
                                <Badge variant="outline">
                                  {typeof task.metadata === "object" &&
                                  task.metadata &&
                                  "status" in task.metadata
                                    ? String(task.metadata.status)
                                    : "En cours"}
                                </Badge>
                              </div>

                              <p className="text-sm text-muted-foreground">
                                {typeof task.metadata === "object" &&
                                task.metadata &&
                                "comment" in task.metadata
                                  ? String(task.metadata.comment)
                                  : "Aucune description"}
                              </p>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setSelectedTaskId(
                                      selectedTaskId === task.id
                                        ? null
                                        : task.id
                                    )
                                  }
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  <T k="auto.unifiedsupplierportal.commenter" fallback="Commenter" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleTaskCompletion(task.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  <T k="auto.unifiedsupplierportal.marquer_termine" fallback="Marquer terminé" />
                                </Button>
                              </div>

                              {selectedTaskId === task.id && (
                                <div className="mt-3 space-y-2">
                                  <Textarea
                                    value={taskComment}
                                    onChange={(e) =>
                                      setTaskComment(e.target.value)
                                    }
                                    placeholder="Ajouter un commentaire..."
                                    rows={3}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleTaskComment(task.id)}
                                    disabled={!taskComment.trim()}
                                  >
                                    <Send className="h-4 w-4 mr-1" />
                                    <T k="auto.unifiedsupplierportal.envoyer" fallback="Envoyer" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        <T k="auto.unifiedsupplierportal.aucune_tache_assignee" fallback="Aucune tâche assignée" />
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inspections Tab */}
            <TabsContent value="inspections">
              <SupplierInspectionsList
                inspections={InspectionTransformer.manyToDTO(supplierInspections)}
                loading={inspectionsLoading}
                supplierId={supplierProfile?.id}
                onInspectionUpdated={refetchInspections}
              />
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              {supplierProfile?.id ? (
                <DqeWorkspace
                  routeContext="supplier-invoice"
                  senderId={supplierProfile.id}
                  submissionId={supplierProfile.id}
                  recipientEmail={supplierProfile.email ?? undefined}
                />
              ) : (
                <Card><CardContent className="py-6"><p className="text-sm text-muted-foreground"><T k="auto.unifiedsupplierportal.profil_fournisseur_requis" fallback="Profil fournisseur requis." /></p></CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default UnifiedSupplierPortal;