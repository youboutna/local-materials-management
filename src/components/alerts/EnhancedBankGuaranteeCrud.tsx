import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  FileText,
  Upload,
  ExternalLink,
  Download,
  Calendar,
  Building,
  User,
  FileCheck,
  Clock,
  Banknote,
} from "lucide-react";
import ProjectSelector from "@/components/selectors/ProjectSelector";
import DocumentSelector from "@/components/selectors/DocumentSelector";
import DocumentUpload from "@/components/documents/DocumentUpload";
import SupplierSelector from "@/components/suppliers/SupplierSelector";
import UserSelector from "@/components/selectors/UserSelector";
import DocumentViewer from "@/components/documents/DocumentViewer";
import DocumentSection from "@/components/common/DocumentSection";
import {
  format,
  differenceInDays,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";
import { fr } from "date-fns/locale";

interface BankGuarantee {
  id: string;
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  bank_name: string;
  guarantee_amount: number;
  guarantee_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  supporting_documents?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
  project?: {
    id: string;
    title: string;
    code: string;
  };
}

interface BankGuaranteeFormData {
  project_id: string;
  contractor_id: string;
  contractor_name: string;
  bank_name: string;
  guarantee_amount: number;
  guarantee_type: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  supporting_documents: string[];
  notes: string;
}

const EnhancedBankGuaranteeCrud = () => {
  const [guarantees, setGuarantees] = useState<BankGuarantee[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] =
    useState<BankGuarantee | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  const [formData, setFormData] = useState<BankGuaranteeFormData>({
    project_id: "",
    contractor_id: "",
    contractor_name: "",
    bank_name: "",
    guarantee_amount: 0,
    guarantee_type: "",
    issue_date: "",
    expiry_date: "",
    status: "active",
    supporting_documents: [],
    notes: "",
  });

  const { t } = useLanguage();

  const guaranteeTypes = [
    {
      value: "performance",
      label: "Garantie de Bonne Exécution",
      icon: <FileCheck className="h-4 w-4" />,
    },
    {
      value: "advance",
      label: "Garantie d'Avance",
      icon: <Banknote className="h-4 w-4" />,
    },
    {
      value: "retention",
      label: "Garantie de Retenue",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      value: "maintenance",
      label: "Garantie de Maintenance",
      icon: <Building className="h-4 w-4" />,
    },
    {
      value: "bid",
      label: "Garantie de Soumission",
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  const statusOptions = [
    {
      value: "active",
      label: "Active",
      color: "bg-green-100 text-green-800 border-green-200",
      icon: "✅",
    },
    {
      value: "expired",
      label: "Expirée",
      color: "bg-red-100 text-red-800 border-red-200",
      icon: "❌",
    },
    {
      value: "claimed",
      label: "Réclamée",
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: "⚠️",
    },
    {
      value: "released",
      label: "Libérée",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "📤",
    },
    {
      value: "suspended",
      label: "Suspendue",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: "⏸️",
    },
  ];

  useEffect(() => {
    loadGuarantees();
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, code")
        .order("title");

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadGuarantees = async () => {
    setIsLoading(true);
    try {
      console.log("Loading bank guarantees...");

      const { data, error } = await supabase
        .from("bank_guarantees")
        .select(
          `
          *,
          project:project_id (id, title, code)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Raw guarantees data:", data);

      const transformedGuarantees: BankGuarantee[] = (data || []).map(
        (guarantee) => ({
          ...guarantee,
          contractor_name: (guarantee as any).contractor_name || "N/A",
          project: (guarantee as any).project,
        })
      );

      console.log("Transformed guarantees:", transformedGuarantees);
      setGuarantees(transformedGuarantees);

      toast({
        title: t("common.success"),
        description: `${transformedGuarantees.length} garantie(s) chargée(s)`,
      });
    } catch (error: any) {
      console.error("Error loading bank guarantees:", error);
      toast({
        title: t("common.error"),
        description: `Impossible de charger les garanties bancaires: ${
          error?.message || "Erreur inconnue"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: "",
      contractor_id: "",
      contractor_name: "",
      bank_name: "",
      guarantee_amount: 0,
      guarantee_type: "",
      issue_date: "",
      expiry_date: "",
      status: "active",
      supporting_documents: [],
      notes: "",
    });
    setUploadedDocuments([]);
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (guarantee: BankGuarantee) => {
    setFormData({
      project_id: guarantee.project_id,
      contractor_id: guarantee.contractor_id,
      contractor_name: guarantee.contractor_name,
      bank_name: guarantee.bank_name,
      guarantee_amount: guarantee.guarantee_amount,
      guarantee_type: guarantee.guarantee_type,
      issue_date: guarantee.issue_date,
      expiry_date: guarantee.expiry_date,
      status: guarantee.status,
      supporting_documents: guarantee.supporting_documents || [],
      notes: guarantee.notes || "",
    });
    setSelectedGuarantee(guarantee);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (guarantee: BankGuarantee) => {
    setFormData({
      project_id: guarantee.project_id,
      contractor_id: guarantee.contractor_id,
      contractor_name: guarantee.contractor_name,
      bank_name: guarantee.bank_name,
      guarantee_amount: guarantee.guarantee_amount,
      guarantee_type: guarantee.guarantee_type,
      issue_date: guarantee.issue_date,
      expiry_date: guarantee.expiry_date,
      status: guarantee.status,
      supporting_documents: guarantee.supporting_documents || [],
      notes: guarantee.notes || "",
    });
    setSelectedGuarantee(guarantee);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    const errors: string[] = [];

    if (!formData.project_id) errors.push("Le projet est requis");
    if (!formData.contractor_name) errors.push("Le contracteur est requis");
    if (!formData.bank_name) errors.push("La banque est requise");
    if (!formData.guarantee_amount || formData.guarantee_amount <= 0)
      errors.push("Le montant doit être positif");
    if (!formData.guarantee_type) errors.push("Le type de garantie est requis");
    if (!formData.issue_date) errors.push("La date d'émission est requise");
    if (!formData.expiry_date) errors.push("La date d'expiration est requise");

    // Date validation
    if (formData.issue_date && formData.expiry_date) {
      const issueDate = new Date(formData.issue_date);
      const expiryDate = new Date(formData.expiry_date);

      if (isAfter(issueDate, expiryDate)) {
        errors.push("La date d'expiration doit être après la date d'émission");
      }

      if (isBefore(expiryDate, new Date())) {
        errors.push("La date d'expiration est déjà passée");
      }
    }

    if (errors.length > 0) {
      toast({
        title: "Erreur de validation",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedGuarantee) {
        const { error } = await supabase
          .from("bank_guarantees")
          .update({
            project_id: formData.project_id,
            contractor_id: formData.contractor_id,
            bank_name: formData.bank_name,
            guarantee_amount: formData.guarantee_amount,
            guarantee_type: formData.guarantee_type,
            issue_date: formData.issue_date,
            expiry_date: formData.expiry_date,
            status: formData.status,
            supporting_documents: uploadedDocuments.map((doc) => doc.id),
            notes: formData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedGuarantee.id);

        if (error) throw error;

        await loadGuarantees();
        toast({
          title: t("common.success"),
          description: "✅ Garantie bancaire mise à jour avec succès",
        });
      } else {
        const { error } = await supabase.from("bank_guarantees").insert({
          project_id: formData.project_id,
          contractor_id: formData.contractor_id,
          bank_name: formData.bank_name,
          guarantee_amount: formData.guarantee_amount,
          guarantee_type: formData.guarantee_type,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
          status: formData.status,
          supporting_documents: uploadedDocuments.map((doc) => doc.id),
          notes: formData.notes,
        });

        if (error) throw error;

        await loadGuarantees();
        toast({
          title: t("common.success"),
          description: "✅ Garantie bancaire créée avec succès",
        });
      }

      setIsFormOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving guarantee:", error);
      toast({
        title: t("common.error"),
        description: `Erreur: ${error.message || "Erreur inconnue"}`,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (guaranteeId: string) => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer cette garantie bancaire ? Cette action est irréversible."
      )
    ) {
      try {
        const { error } = await supabase
          .from("bank_guarantees")
          .delete()
          .eq("id", guaranteeId);

        if (error) throw error;

        await loadGuarantees();
        toast({
          title: t("common.success"),
          description: "✅ Garantie bancaire supprimée avec succès",
        });
      } catch (error) {
        console.error("Error deleting guarantee:", error);
        toast({
          title: t("common.error"),
          description: "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    return (
      statusOptions.find((option) => option.value === status)?.color ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getGuaranteeStatus = (guarantee: BankGuarantee) => {
    const expiryDate = parseISO(guarantee.expiry_date);
    const today = new Date();

    if (guarantee.status !== "active") return guarantee.status;

    if (isBefore(expiryDate, today)) return "expired";

    const daysUntilExpiry = differenceInDays(expiryDate, today);
    if (daysUntilExpiry <= 7) return "expiring_soon";
    if (daysUntilExpiry <= 30) return "expiring";

    return "active";
  };

  const getStatusBadge = (guarantee: BankGuarantee) => {
    const status = getGuaranteeStatus(guarantee);

    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            ✅ Active
          </Badge>
        );
      case "expiring":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            ⚠️ Expire bientôt
          </Badge>
        );
      case "expiring_soon":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            🔥 Expire cette semaine
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            ❌ Expirée
          </Badge>
        );
      case "claimed":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            ⚠️ Réclamée
          </Badge>
        );
      case "released":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            📤 Libérée
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            ⏸️ Suspendue
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? `${project.code} - ${project.title}` : projectId;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-MR", {
      style: "currency",
      currency: "MRU",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMM yyyy", { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Banknote className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Gestion des Garanties Bancaires
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Suivi et gestion des garanties bancaires des projets
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {guarantees.length} garantie(s) •
              {
                guarantees.filter(
                  (g) => getGuaranteeStatus(g) === "expiring_soon"
                ).length
              }{" "}
              à risque
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={openCreateForm}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle Garantie
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {isViewMode
                      ? "Détails de la Garantie"
                      : isEditing
                      ? "Modifier la Garantie"
                      : "Créer une Nouvelle Garantie Bancaire"}
                  </DialogTitle>
                  <DialogDescription>
                    {isViewMode
                      ? "Informations complètes de la garantie bancaire"
                      : "Remplissez les informations de la garantie bancaire"}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Section 1: Informations Générales */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      Informations Générales
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="project_id"
                          className="text-sm font-medium"
                        >
                          Projet <span className="text-red-500">*</span>
                        </Label>
                        <ProjectSelector
                          onChange={(projectId) =>
                            setFormData((prev) => ({
                              ...prev,
                              project_id: projectId || "",
                            }))
                          }
                          value={formData.project_id}
                          disabled={isViewMode}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Contracteur <span className="text-red-500">*</span>
                        </Label>
                        <SupplierSelector
                          value={{
                            id: formData.contractor_id,
                            name: formData.contractor_name,
                            contact: "",
                            leadTime: 0,
                          }}
                          onChange={(supplier) => {
                            setFormData((prev) => ({
                              ...prev,
                              contractor_id: supplier.id || "",
                              contractor_name: supplier.name,
                            }));
                          }}
                          disabled={isViewMode}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Détails Bancaires */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      Détails Bancaires
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="bank_name"
                          className="text-sm font-medium"
                        >
                          Nom de la Banque{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <Input
                            id="bank_name"
                            value={formData.bank_name}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                bank_name: e.target.value,
                              }))
                            }
                            disabled={isViewMode}
                            placeholder="Ex: Banque Centrale de Mauritanie"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="guarantee_type"
                          className="text-sm font-medium"
                        >
                          Type de Garantie{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.guarantee_type}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              guarantee_type: value,
                            }))
                          }
                          disabled={isViewMode}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent>
                            {guaranteeTypes.map((type) => (
                              <SelectItem
                                key={type.value}
                                value={type.value}
                                className="flex items-center gap-2"
                              >
                                <span className="flex items-center gap-2">
                                  {type.icon}
                                  {type.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Montant et Dates */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                      Montant et Dates
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="guarantee_amount"
                          className="text-sm font-medium"
                        >
                          Montant (MRU) <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-gray-400" />
                          <Input
                            id="guarantee_amount"
                            type="number"
                            min="0"
                            step="1000"
                            value={formData.guarantee_amount}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                guarantee_amount:
                                  parseFloat(e.target.value) || 0,
                              }))
                            }
                            disabled={isViewMode}
                            placeholder="0"
                            className="flex-1"
                          />
                        </div>
                        {formData.guarantee_amount > 0 && (
                          <p className="text-xs text-green-600">
                            {formatCurrency(formData.guarantee_amount)}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="issue_date"
                          className="text-sm font-medium"
                        >
                          Date d'Émission{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <Input
                            id="issue_date"
                            type="date"
                            value={formData.issue_date}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                issue_date: e.target.value,
                              }))
                            }
                            disabled={isViewMode}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="expiry_date"
                          className="text-sm font-medium"
                        >
                          Date d'Expiration{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <Input
                            id="expiry_date"
                            type="date"
                            value={formData.expiry_date}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                expiry_date: e.target.value,
                              }))
                            }
                            disabled={isViewMode}
                            className="flex-1"
                          />
                        </div>
                        {formData.issue_date && formData.expiry_date && (
                          <p className="text-xs text-gray-500">
                            Durée:{" "}
                            {differenceInDays(
                              parseISO(formData.expiry_date),
                              parseISO(formData.issue_date)
                            )}{" "}
                            jours
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Statut et Documents */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                      Statut et Documents
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium">
                          Statut
                        </Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, status: value }))
                          }
                          disabled={isViewMode}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner le statut" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem
                                key={status.value}
                                value={status.value}
                                className="flex items-center gap-2"
                              >
                                <span className="flex items-center gap-2">
                                  {status.icon}
                                  {status.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Documents Justificatifs
                        </Label>
                        {!isViewMode ? (
                          <div className="space-y-3">
                            <DocumentSelector
                              onChange={(documentId, document) => {
                                if (
                                  document &&
                                  !uploadedDocuments.some(
                                    (d) => d.id === document.id
                                  )
                                ) {
                                  setUploadedDocuments((prev) => [
                                    ...prev,
                                    document,
                                  ]);
                                }
                              }}
                              documentType="contract"
                              disabled={isViewMode}
                            />
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Glisser-déposer des fichiers ici ou cliquer pour
                                parcourir
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Formats supportés: PDF, DOC, JPG, PNG (max.
                                10MB)
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600">
                              Documents attachés:{" "}
                              {selectedGuarantee?.supporting_documents
                                ?.length || 0}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {uploadedDocuments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">
                          Documents ajoutés:
                        </p>
                        <div className="space-y-2">
                          {uploadedDocuments.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {doc.title || doc.file_name}
                                  </p>
                                  {doc.file_size && (
                                    <p className="text-xs text-gray-500">
                                      {(doc.file_size / 1024 / 1024).toFixed(2)}{" "}
                                      MB
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!isViewMode && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setUploadedDocuments((prev) =>
                                      prev.filter((_, i) => i !== index)
                                    )
                                  }
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 5: Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium">
                      Notes et Observations
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      disabled={isViewMode}
                      rows={3}
                      placeholder="Ajoutez des notes ou observations concernant cette garantie..."
                      className="resize-none"
                    />
                  </div>

                  {/* Document Visualization for View Mode */}
                  {isViewMode && selectedGuarantee && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-2 mb-4">
                        <FileCheck className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">
                          Documents de la Garantie
                        </h3>
                      </div>
                      <DocumentSection
                        relatedId={selectedGuarantee.id}
                        relatedType="bank_guarantee"
                        title=""
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isViewMode && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsFormOpen(false);
                          resetForm();
                        }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isEditing
                          ? "Mettre à jour la Garantie"
                          : "Créer la Garantie"}
                      </Button>
                    </div>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : guarantees.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">
              Aucune garantie bancaire
            </h3>
            <p className="text-gray-500 mt-2">
              Commencez par créer votre première garantie bancaire
            </p>
            <Button onClick={openCreateForm} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Créer une garantie
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden border rounded-lg">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Projet</TableHead>
                  <TableHead className="font-semibold">Banque</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold text-right">
                    Montant
                  </TableHead>
                  <TableHead className="font-semibold">Dates</TableHead>
                  <TableHead className="font-semibold">Statut</TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guarantees.map((guarantee) => {
                  const status = getGuaranteeStatus(guarantee);
                  const isCritical =
                    status === "expiring_soon" || status === "expired";

                  return (
                    <TableRow
                      key={guarantee.id}
                      className={
                        isCritical
                          ? "bg-red-50 hover:bg-red-100"
                          : "hover:bg-gray-50"
                      }
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">
                            {getProjectName(guarantee.project_id)}
                          </div>
                          {guarantee.project && (
                            <div className="text-xs text-gray-500">
                              {guarantee.project.code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          {guarantee.bank_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {
                            guaranteeTypes.find(
                              (t) => t.value === guarantee.guarantee_type
                            )?.icon
                          }
                          <span className="text-sm">
                            {
                              guaranteeTypes.find(
                                (t) => t.value === guarantee.guarantee_type
                              )?.label
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(guarantee.guarantee_amount)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="text-gray-500">Émission: </span>
                            {formatDate(guarantee.issue_date)}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Expire: </span>
                            <span
                              className={
                                status === "expired"
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              {formatDate(guarantee.expiry_date)}
                            </span>
                            {status === "expiring_soon" && (
                              <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(guarantee)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewForm(guarantee)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(guarantee)}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(guarantee.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedBankGuaranteeCrud;
