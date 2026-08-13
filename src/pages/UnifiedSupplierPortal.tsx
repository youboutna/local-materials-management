// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDocumentStorage } from "@/hooks/useDocumentStorage";
import { useParsedInvoicesHex, useInvoiceMutationsHex } from "@/hooks/hexagonal/useInvoicesHex";
import { parsePdf } from "@/utils/btpCalculations";
import {
  Supplier,
  SupplierNotification,
  DocumentWithViewStatus,
} from "@/dtos/entities/SupplierDTO";
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
// Payment initiation data is now handled through notifications tab

const UnifiedSupplierPortal = () => {
  const { t } = useLanguage();
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
  // v3.2 : tender sélectionné pour créer un devis depuis l'onglet Appels d'Offres.
  const [selectedBidTenderId, setSelectedBidTenderId] = useState<string | null>(
    searchParams.get("tenderId"),
  );

  // Keep tab state in sync with URL (e.g. redirect from /supplier-access after code secret validation).
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && urlTab !== activeTab) setActiveTab(urlTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Event bridge : EnhancedSupplierTenderPortal fires `boq-create-quote` with tenderId
  // ⇒ on bascule vers l'onglet Devis avec le contexte pré-rempli.
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

  // Use hexagonal hooks
  const { user, session, loading } = useSupplierPortalAuthHex();
  const { data: supplierProfile } = useFetchSupplierProfileHex(user);
  const { data: notifications = [] } = useSupplierPortalNotificationsHex(supplierProfile?.id);
  const { data: paymentRequests = [], refetch: refetchPaymentRequests } = useSupplierPortalPaymentRequestsHex(supplierProfile?.id);
  const { data: documents = [] } = useSupplierPortalDocumentsHex(user?.id, supplierProfile?.id, supplierProfile?.name);
  
  // Mutations
  const loginMutation = useSupplierLoginHex();
  const signUpMutation = useSupplierSignUpHex();
  const logoutMutation = useSupplierLogoutHex();
  const uploadDocumentMutation = useUploadSupplierDocumentHex();
  const addTaskCommentMutation = useAddSupplierTaskCommentHex();
  const markTaskCompletedMutation = useMarkTaskCompletedHex();

  // Fetch parsed invoices using hexagonal hook
  // This replaces the direct Supabase "parsed_invoices" table call
  const { invoices: parsedInvoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useParsedInvoicesHex(supplierProfile?.id || "");
  const { createInvoice, isCreating: isParsingInvoice } = useInvoiceMutationsHex();
  const [invoiceParsing, setInvoiceParsing] = useState(false);

  const handleInvoiceUpload = async (file: File) => {
    if (!user || !file) return;
    setInvoiceParsing(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `invoices/${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;
      const up = await storageUpload(file, path);
      if (!up.success) throw new Error("Upload échoué");

      // Utilise le parseur DQE unifié (PDF/Excel/CSV) — mêmes règles que l'import DQE
      // avec détection TVA/taxes et alignement colonnes → BoqLineDTO.
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
          : `${dtos.length} lignes extraites — Total HT ${totalHt.toLocaleString('fr-FR')} MRU${vatRate ? ` · TVA ${(vatRate * 100).toFixed(0)}%` : ''}`,
      });
      refetchInvoices();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e?.message ?? 'Analyse impossible', variant: 'destructive' });
    } finally {
      setInvoiceParsing(false);
    }
  };

  // Fetch inspections with service layer (stakeholder-based)
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

    // Build a collision-free storage path: prefix + timestamp + random + original name.
    const safeName = uploadFile.name.replace(/[^\w.\-]+/g, "_");
    const uniquePath = `supplier-uploads/${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;
    const uploadResult = await storageUpload(uploadFile, uniquePath);

    if (!uploadResult.success) {
      return;
    }

    uploadDocumentMutation.mutate({
      userId: user.id,
      title: uploadTitle,
      description: uploadDescription,
      fileUrl: uploadResult.url,
      fileName: uploadFile.name,
      mimeType: uploadFile.type,
      fileSize: uploadFile.size,
      documentType: documentType,
    });

    // Reset form
    setUploadFile(null);
    setUploadTitle("");
    setUploadDescription("");
  };

  const handleTaskComment = async (taskId: string) => {
    if (!taskComment.trim() || !user || !supplierProfile?.id) return;

    addTaskCommentMutation.mutate({
      supplierId: supplierProfile.id,
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
      supplierId: supplierProfile.id,
      taskId,
      email: user.email || "",
    });
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType =
      typeFilter === "all" || doc.document_type === typeFilter;

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
  
  // Count payment initiation notifications
  const paymentInitiationsCount = notifications.filter(
    (n) => n.notification_type === "payment_initiation" && !n.used_at
  ).length;

  // Handle clicking on a payment initiation notification
  const handlePaymentInitiationClick = (notification: SupplierNotification) => {
    const metadata = notification.metadata as any;
    setPrefillPaymentData({
      projectId: metadata?.project_id,
      amount: metadata?.estimated_amount,
      description: metadata?.justification,
      initiationId: notification.id,
    });
    setActiveTab("payments");
  };

  // Guest access via secret code (from /supplier-access redirect).
  // MUST run before any early return to preserve hook order (React #310).
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && guestPayload) {
    // Guest via secret code — show a real tab shell (Appels d'offres + Documents partagés).
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
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h1 className="text-xl font-semibold">Accès sécurisé fournisseur</h1>
                <p className="text-sm text-muted-foreground">
                  Consultez l'appel d'offres et les documents partagés.
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
              Quitter
            </Button>
          </div>

          <Tabs value={guestTab} onValueChange={setGuestTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tenders">Appel d'offres</TabsTrigger>
              <TabsTrigger value="documents">Documents partagés</TabsTrigger>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 to-secondary/5">
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Portail Fournisseur
              </h1>
              <p className="text-muted-foreground">
                Bienvenue {supplierProfile?.name || user.email}
              </p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Paiements Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalPayments.toLocaleString()} MRU
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentRequests.length} demandes
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Paiements en Attente
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingPayments}
                </div>
                <p className="text-xs text-muted-foreground">En traitement</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Notifications
                </CardTitle>
                <Bell className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {unreadNotifications}
                </div>
                <p className="text-xs text-muted-foreground">Non lues</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {documents.length}
                </div>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="documents" className="space-y-6" value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-9 overflow-x-auto">
              <TabsTrigger value="tenders">Appels d'Offres</TabsTrigger>
              <TabsTrigger value="devis">Devis</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="upload">Télécharger</TabsTrigger>
              <TabsTrigger value="payments">Paiements</TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications
                {paymentInitiationsCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                    {paymentInitiationsCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks">Tâches</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="invoices">Factures</TabsTrigger>
            </TabsList>


            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents Partagés
                  </CardTitle>

                  {/* Filters */}
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Rechercher des documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="pending_review">
                          En révision
                        </SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="plan">Plan</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="invoice">Facture</SelectItem>
                        <SelectItem value="purchase_order">
                          Bon de commande
                        </SelectItem>
                        <SelectItem value="inquiry">Demande</SelectItem>
                        <SelectItem value="contract">Contrat</SelectItem>
                        <SelectItem value="report">Rapport</SelectItem>
                        <SelectItem value="certificate">Certificat</SelectItem>
                        <SelectItem value="specification">
                          Spécification
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((document) => (
                        <div
                          key={document.id}
                          className="p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <h3 className="font-medium">
                                  {document.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {document.description}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {document.document_type}
                                  </Badge>
                                  {document.projects && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {document.projects.title}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {document.created_at
                                    ? new Date(
                                        document.created_at
                                      ).toLocaleDateString("fr-FR")
                                    : "Date inconnue"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  document.status === "approved"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  document.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : document.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-orange-100 text-orange-800"
                                }
                              >
                                {document.status}
                              </Badge>
                              {document.file_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    openDocument(document, {
                                      proxyMode: true,
                                      allowStatusChange: false,
                                      context: { portail: "Fournisseur" },
                                    })
                                  }
                                  title="Consulter le document"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Aucun document trouvé
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tender Submissions Tab - New */}
            <TabsContent value="tenders">
              <EnhancedSupplierTenderPortal />
            </TabsContent>

            {/* Devis Tab — BoqWorkspace en mode bid pour chiffrer / générer PDF signé */}
            <TabsContent value="devis">
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
                <Card><CardContent className="py-6"><p className="text-sm text-muted-foreground">Profil fournisseur requis.</p></CardContent></Card>
              )}
            </TabsContent>


            {/* Upload Tab */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Télécharger un Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="upload-title">Titre du document</Label>
                    <Input
                      id="upload-title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Entrez le titre..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="document-type">Type de document</Label>
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="plan">Plan</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="invoice">Facture</SelectItem>
                        <SelectItem value="purchase_order">
                          Bon de commande
                        </SelectItem>
                        <SelectItem value="inquiry">Demande</SelectItem>
                        <SelectItem value="contract">Contrat</SelectItem>
                        <SelectItem value="report">Rapport</SelectItem>
                        <SelectItem value="certificate">Certificat</SelectItem>
                        <SelectItem value="specification">
                          Spécification
                        </SelectItem>
                        <SelectItem value="supplier_info">
                          Informations fournisseur
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="upload-description">Description</Label>
                    <Textarea
                      id="upload-description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Description optionnelle..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="upload-file">Fichier</Label>
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

            {/* Payment Requests Tab */}
            <TabsContent value="payments">
              <div className="space-y-6">
                {supplierProfile && (
                  <SupplierPaymentRequest 
                    supplierId={supplierProfile.id} 
                    prefillData={prefillPaymentData}
                    onPrefillUsed={() => setPrefillPaymentData(null)}
                  />
                )}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Payment Initiation Notifications - Highlighted */}
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
                                : "bg-green-50 border-green-300"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-5 w-5 text-green-600" />
                                  <h3 className="font-semibold text-green-800">
                                    Demande de Paiement Initiée
                                  </h3>
                                  {!notification.used_at && (
                                    <Badge className="bg-green-600">Action requise</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                  {metadata?.justification || "Demande de paiement en attente de complétion"}
                                </p>
                                <div className="flex gap-4 mt-2 text-sm">
                                  <span className="font-medium">
                                    Montant estimé: {(metadata?.estimated_amount || 0).toLocaleString()} MRU
                                  </span>
                                  {metadata?.deadline && (
                                    <span className="text-orange-600">
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
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Compléter la demande
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    {/* Other Notifications */}
                    {notifications
                      .filter((n) => n.notification_type !== "payment_initiation")
                      .map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.used_at
                              ? "bg-muted/50"
                              : "bg-blue-50 border-blue-200"
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
                                className="bg-blue-100 text-blue-800"
                              >
                                Nouveau
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}

                    {notifications.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">
                        Aucune notification
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
                    Tâches Assignées
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
                                  Commenter
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleTaskCompletion(task.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Marquer terminé
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
                                    Envoyer
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Aucune tâche assignée
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inspections Tab */}
            <TabsContent value="inspections">
              <SupplierInspectionsList
                inspections={supplierInspections}
                loading={inspectionsLoading}
                supplierId={supplierProfile?.id}
                onInspectionUpdated={refetchInspections}
              />
            </TabsContent>

            {/* Parsed Invoices Tab */}
            <TabsContent value="invoices">
              {supplierProfile?.id ? (
                <DqeWorkspace
                  routeContext="supplier-invoice"
                  senderId={supplierProfile.id}
                  submissionId={supplierProfile.id}
                  recipientEmail={supplierProfile.email ?? undefined}
                />
              ) : (
                <Card><CardContent className="py-6"><p className="text-sm text-muted-foreground">Profil fournisseur requis.</p></CardContent></Card>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default UnifiedSupplierPortal;
