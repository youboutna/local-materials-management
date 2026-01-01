import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Users,
  Clock,
  DollarSign,
  Settings,
  User,
  Wrench,
  Package,
  AlertCircle,
  Mail,
  Phone,
  Briefcase,
  Hash,
  Truck,
  FileText,
} from "lucide-react";

interface TeamOverviewProps {
  resources?: any[];
  setResources?: (resources: any[]) => void;
  projectId: string;
  phases?: any[];
}

interface ProjectResource {
  id: string;
  project_id: string;
  name: string;
  type: string;
  allocation_date: string | null;
  cost_per_unit: number | null;
  quantity: number | null;
  total_cost: number | null;
  unit: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectPhase {
  id: string;
  phase_name: string;
  status: string;
  construction_phase?: string;
}

// Données pour les options des formulaires spécifiques
const POSITION_OPTIONS = [
  { value: "engineer", label: "Ingénieur" },
  { value: "technician", label: "Technicien" },
  { value: "supervisor", label: "Superviseur" },
  { value: "foreman", label: "Chef de chantier" },
  { value: "laborer", label: "Ouvrier" },
  { value: "administrator", label: "Administratif" },
];

const EQUIPMENT_TYPES = [
  { value: "excavator", label: "Excavatrice" },
  { value: "crane", label: "Grue" },
  { value: "bulldozer", label: "Bulldozer" },
  { value: "concrete_mixer", label: "Bétonnière" },
  { value: "truck", label: "Camion" },
  { value: "compactor", label: "Compacteur" },
  { value: "generator", label: "Générateur" },
];

const MATERIAL_TYPES = [
  { value: "cement", label: "Ciment" },
  { value: "steel", label: "Acier" },
  { value: "wood", label: "Bois" },
  { value: "aggregate", label: "Granulat" },
  { value: "sand", label: "Sable" },
  { value: "bricks", label: "Briques" },
  { value: "pipes", label: "Tuyaux" },
];

const TeamOverview: React.FC<TeamOverviewProps> = ({
  resources: propResources,
  setResources: propSetResources,
  projectId,
  phases: propPhases,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    name: "",
    type: "",
    notes: "",
    costPerUnit: "",
    quantity: "1",
    unit: "",
    phaseId: "",
    applyToAllPhases: false,
    selectedPhases: [],
    // Champs spécifiques qui seront stockés dans les notes
    position: "",
    email: "",
    phone: "",
    equipmentType: "",
    serialNumber: "",
    materialType: "",
    supplier: "",
  });

  const queryClient = useQueryClient();

  // Use provided resources or fetch from database
  const { data: fetchedResources, isLoading } = useQuery({
    queryKey: ["project-resources", projectId],
    queryFn: async (): Promise<ProjectResource[]> => {
      const { data, error } = await supabase
        .from("project_resources")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !propResources,
  });

  // Use props or fallback to fetched data
  const currentResources = propResources || fetchedResources || [];

  // Fetch project phases (required for resource creation)
  const { data: phases = [] } = useQuery({
    queryKey: ["project-phases", projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      console.log("🔍 Fetching phases for project (TeamOverview):", projectId);
      const { data, error } = await supabase
        .from("project_phases")
        .select(
          "id, phase_name, status, construction_phase, description, start_date, end_date"
        )
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("❌ Error fetching phases (TeamOverview):", error);
        throw error;
      }

      console.log("✅ Phases fetched (TeamOverview):", data);
      return (
        data?.map((phase) => ({
          ...phase,
          construction_phase: phase.construction_phase || undefined,
        })) || []
      );
    },
    enabled: !!projectId && !propPhases,
  });

  // Use props or fallback to fetched data
  const currentPhases = propPhases || phases || [];
  console.log("📋 Current phases in TeamOverview:", currentPhases);

  // Helper function to build notes from form data
  const buildNotes = () => {
    let notes = formData.notes || "";

    // Add type-specific information to notes
    if (formData.type === "human") {
      const additionalInfo: string[] = [];
      if (formData.position) additionalInfo.push(`Poste: ${formData.position}`);
      if (formData.email) additionalInfo.push(`Email: ${formData.email}`);
      if (formData.phone) additionalInfo.push(`Téléphone: ${formData.phone}`);

      if (additionalInfo.length > 0) {
        notes = notes
          ? `${notes}\n\n---\n${additionalInfo.join("\n")}`
          : additionalInfo.join("\n");
      }
    } else if (formData.type === "equipment") {
      const additionalInfo: string[] = [];
      if (formData.equipmentType) {
        const equipmentTypeLabel =
          EQUIPMENT_TYPES.find((e) => e.value === formData.equipmentType)
            ?.label || formData.equipmentType;
        additionalInfo.push(`Type: ${equipmentTypeLabel}`);
      }
      if (formData.serialNumber)
        additionalInfo.push(`N° série: ${formData.serialNumber}`);

      if (additionalInfo.length > 0) {
        notes = notes
          ? `${notes}\n\n---\n${additionalInfo.join("\n")}`
          : additionalInfo.join("\n");
      }
    } else if (formData.type === "material") {
      const additionalInfo: string[] = [];
      if (formData.materialType) {
        const materialTypeLabel =
          MATERIAL_TYPES.find((m) => m.value === formData.materialType)
            ?.label || formData.materialType;
        additionalInfo.push(`Type: ${materialTypeLabel}`);
      }
      if (formData.supplier)
        additionalInfo.push(`Fournisseur: ${formData.supplier}`);

      if (additionalInfo.length > 0) {
        notes = notes
          ? `${notes}\n\n---\n${additionalInfo.join("\n")}`
          : additionalInfo.join("\n");
      }
    }

    return notes;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      notes: "",
      costPerUnit: "",
      quantity: "1",
      unit: "",
      phaseId: "",
      applyToAllPhases: false,
      selectedPhases: [],
      position: "",
      email: "",
      phone: "",
      equipmentType: "",
      serialNumber: "",
      materialType: "",
      supplier: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la ressource est requis.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.applyToAllPhases && !formData.phaseId) {
      toast({
        title: "Erreur",
        description:
          "Vous devez sélectionner une phase ou appliquer à toutes les phases.",
        variant: "destructive",
      });
      return;
    }

    try {
      const resourcesToCreate: any[] = [];
      const notes = buildNotes();

      if (formData.applyToAllPhases) {
        // Create resource for each phase
        currentPhases.forEach((phase) => {
          resourcesToCreate.push({
            project_id: projectId,
            name: `${formData.name} - ${phase.phase_name}`,
            type: formData.type,
            notes: notes,
            cost_per_unit: formData.costPerUnit
              ? parseFloat(formData.costPerUnit)
              : null,
            quantity: formData.quantity ? parseInt(formData.quantity) : 1,
            unit:
              formData.unit ||
              (formData.type === "human"
                ? "mois"
                : formData.type === "equipment"
                ? "jour"
                : "unité"),
          });
        });
      } else {
        // Create single resource for selected phase
        resourcesToCreate.push({
          project_id: projectId,
          name: formData.name,
          type: formData.type,
          notes: notes,
          cost_per_unit: formData.costPerUnit
            ? parseFloat(formData.costPerUnit)
            : null,
          quantity: formData.quantity ? parseInt(formData.quantity) : 1,
          unit:
            formData.unit ||
            (formData.type === "human"
              ? "mois"
              : formData.type === "equipment"
              ? "jour"
              : "unité"),
        });
      }

      if (resourcesToCreate.length > 0) {
        const { data, error } = await supabase
          .from("project_resources")
          .insert(resourcesToCreate)
          .select();

        if (error) throw error;

        // Refresh resources
        queryClient.invalidateQueries({ queryKey: ["project-resources"] });
        setIsCreating(false);
        resetForm();

        toast({
          title: "Ressource créée",
          description: `${resourcesToCreate.length} ressource(s) créée(s) avec succès.`,
        });
      }
    } catch (error) {
      console.error("Error creating resource:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la ressource.",
        variant: "destructive",
      });
    }
  };

  // Handle edit resource
  const handleEditResource = (resource: any) => {
    // Parse notes to extract specific information
    const notes = resource.notes || "";
    let position = "";
    let email = "";
    let phone = "";
    let equipmentType = "";
    let serialNumber = "";
    let materialType = "";
    let supplier = "";

    if (notes) {
      // Try to parse specific information from notes
      const lines = notes.split("\n");
      lines.forEach((line) => {
        if (line.includes("Poste:"))
          position = line.replace("Poste:", "").trim();
        if (line.includes("Email:")) email = line.replace("Email:", "").trim();
        if (line.includes("Téléphone:"))
          phone = line.replace("Téléphone:", "").trim();
        if (line.includes("Type:")) {
          const typeValue = line.replace("Type:", "").trim();
          // Try to find matching equipment type
          const eqMatch = EQUIPMENT_TYPES.find((e) => e.label === typeValue);
          if (eqMatch) equipmentType = eqMatch.value;
          // Try to find matching material type
          const matMatch = MATERIAL_TYPES.find((m) => m.label === typeValue);
          if (matMatch) materialType = matMatch.value;
        }
        if (line.includes("N° série:"))
          serialNumber = line.replace("N° série:", "").trim();
        if (line.includes("Fournisseur:"))
          supplier = line.replace("Fournisseur:", "").trim();
      });
    }

    setFormData({
      name: resource.name,
      type: resource.type as "human" | "equipment" | "material",
      notes: resource.notes || "",
      costPerUnit: resource.cost_per_unit?.toString() || "",
      quantity: resource.quantity?.toString() || "1",
      unit: resource.unit || "",
      phaseId: "",
      applyToAllPhases: false,
      selectedPhases: [],
      position,
      email,
      phone,
      equipmentType,
      serialNumber,
      materialType,
      supplier,
    });

    setEditingId(resource.id);
    setIsCreating(true);
  };

  // Render specific form based on resource type

  const renderSpecificForm = () => {
    switch (formData.type) {
      case "human":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position" className="text-sm">
                  Poste
                </Label>
                <Select
                  value={formData.position}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, position: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un poste" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemple.com"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm">
                Téléphone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+222 XX XX XX XX"
                className="mt-1"
              />
            </div>
          </div>
        );

      case "equipment":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipmentType" className="text-sm">
                  Type d'équipement
                </Label>
                <Select
                  value={formData.equipmentType}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, equipmentType: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="serialNumber" className="text-sm">
                  Numéro de série
                </Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, serialNumber: e.target.value })
                  }
                  placeholder="SN-XXXX-XXXX"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case "material":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="materialType" className="text-sm">
                  Type de matériau
                </Label>
                <Select
                  value={formData.materialType}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, materialType: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="supplier" className="text-sm">
                  Fournisseur
                </Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) =>
                    setFormData({ ...formData, supplier: e.target.value })
                  }
                  placeholder="Nom du fournisseur"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center p-4 text-gray-500">
            <p>
              Sélectionnez un type de ressource pour voir les champs spécifiques
            </p>
          </div>
        );
    }
  };

  // Group resources by type
  const humanResources = currentResources.filter((r) => r.type === "human");
  const equipmentResources = currentResources.filter(
    (r) => r.type === "equipment"
  );
  const materialResources = currentResources.filter(
    (r) => r.type === "material"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (currentPhases.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              Aucune phase trouvée
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous devez d'abord créer des phases pour ce projet avant de
              pouvoir ajouter des ressources.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            Équipe et ressources (délégation publique)
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {humanResources.length} Employés
            </span>
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              {equipmentResources.length} Équipements
            </span>
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {materialResources.length} Matériaux
            </span>
          </div>
        </div>

        <Dialog
          open={isCreating}
          onOpenChange={(open) => {
            if (!open) resetForm();
            setIsCreating(open);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle ressource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-6">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl">
                {editingId
                  ? "Modifier la ressource"
                  : "Créer une nouvelle ressource"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Colonne 1 : Informations de base */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-sm mb-3 text-gray-700">
                      Informations de base
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="resourceName" className="text-sm">
                          Nom de la ressource *
                        </Label>
                        <Input
                          id="resourceName"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Ex: Ahmed Mohamed, Bétonnière, Ciment 32.5"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="resourceType" className="text-sm">
                          Type *
                        </Label>
                        <Select
                          value={formData.type}
                          onValueChange={(
                            value: "human" | "equipment" | "material"
                          ) =>
                            setFormData({
                              ...formData,
                              type: value,
                              position: "",
                              email: "",
                              phone: "",
                              equipmentType: "",
                              serialNumber: "",
                              materialType: "",
                              supplier: "",
                              unit:
                                value === "human"
                                  ? "mois"
                                  : value === "equipment"
                                  ? "jour"
                                  : "unité",
                            })
                          }
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="human"
                              className="flex items-center gap-2"
                            >
                              <User className="h-4 w-4" /> Employé
                            </SelectItem>
                            <SelectItem
                              value="equipment"
                              className="flex items-center gap-2"
                            >
                              <Wrench className="h-4 w-4" /> Équipement
                            </SelectItem>
                            <SelectItem
                              value="material"
                              className="flex items-center gap-2"
                            >
                              <Package className="h-4 w-4" /> Matériau
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Formulaire spécifique selon le type */}
                  {formData.type && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-sm mb-3 text-gray-700 flex items-center gap-2">
                        {formData.type === "human" && (
                          <User className="h-4 w-4" />
                        )}
                        {formData.type === "equipment" && (
                          <Wrench className="h-4 w-4" />
                        )}
                        {formData.type === "material" && (
                          <Package className="h-4 w-4" />
                        )}
                        Informations spécifiques -{" "}
                        {formData.type === "human"
                          ? "Employé"
                          : formData.type === "equipment"
                          ? "Équipement"
                          : "Matériau"}
                      </h3>
                      {renderSpecificForm()}
                    </div>
                  )}

                  {/* Sélection des phases */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-sm mb-3 text-gray-700">
                      Affectation aux phases
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="applyToAllPhases"
                          checked={formData.applyToAllPhases}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              applyToAllPhases: checked as boolean,
                            })
                          }
                        />
                        <Label
                          htmlFor="applyToAllPhases"
                          className="text-sm cursor-pointer"
                        >
                          Appliquer à toutes les phases
                        </Label>
                      </div>

                      {!formData.applyToAllPhases && (
                        <div>
                          <Label className="text-sm mb-2 block">
                            Sélectionner les phases concernées
                          </Label>
                          <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto bg-white">
                            {currentPhases.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-2">
                                Aucune phase disponible
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {currentPhases.map((phase) => (
                                  <div
                                    key={phase.id}
                                    className="flex items-center space-x-2"
                                  >
                                    <input
                                      type="checkbox"
                                      id={`phase-${phase.id}`}
                                      checked={
                                        formData.selectedPhases?.includes(
                                          phase.id
                                        ) || false
                                      }
                                      onChange={(e) => {
                                        const selectedPhases =
                                          formData.selectedPhases || [];
                                        if (e.target.checked) {
                                          setFormData({
                                            ...formData,
                                            selectedPhases: [
                                              ...selectedPhases,
                                              phase.id,
                                            ],
                                            phaseId: phase.id,
                                          });
                                        } else {
                                          setFormData({
                                            ...formData,
                                            selectedPhases:
                                              selectedPhases.filter(
                                                (id) => id !== phase.id
                                              ),
                                            phaseId:
                                              selectedPhases.filter(
                                                (id) => id !== phase.id
                                              )[0] || "",
                                          });
                                        }
                                      }}
                                      className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <label
                                      htmlFor={`phase-${phase.id}`}
                                      className="text-sm cursor-pointer flex-1 hover:bg-gray-100 p-1 rounded"
                                    >
                                      <span className="text-gray-900">
                                        {phase.phase_name ||
                                          `Phase ${phase.id}`}
                                      </span>
                                      {phase.status && (
                                        <span
                                          className={`text-xs ml-2 px-1 rounded ${
                                            phase.status === "completed"
                                              ? "bg-green-100 text-green-800"
                                              : phase.status === "in_progress"
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {phase.status}
                                        </span>
                                      )}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Colonne 2 : Coût et notes */}
                <div className="space-y-6">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-medium text-sm mb-3 text-gray-700">
                      Coût et quantité
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="costPerUnit" className="text-sm">
                          {formData.type === "human"
                            ? "Salaire mensuel (MRU)"
                            : formData.type === "equipment"
                            ? "Coût journalier (MRU)"
                            : "Coût unitaire (MRU)"}{" "}
                          *
                        </Label>
                        <Input
                          id="costPerUnit"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.costPerUnit}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              costPerUnit: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="quantity" className="text-sm">
                          Quantité *
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantity: e.target.value,
                            })
                          }
                          placeholder="1"
                          className="mt-1"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="unit" className="text-sm">
                          Unité
                        </Label>
                        <Input
                          id="unit"
                          value={formData.unit}
                          onChange={(e) =>
                            setFormData({ ...formData, unit: e.target.value })
                          }
                          placeholder={
                            formData.type === "human"
                              ? "mois"
                              : formData.type === "equipment"
                              ? "jour"
                              : "kg, m3, unité..."
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-sm mb-3 text-gray-700">
                      Notes et observations
                    </h3>
                    <div>
                      <Label htmlFor="notes" className="text-sm">
                        Notes générales
                      </Label>
                      <textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md mt-1 text-sm"
                        placeholder="Description détaillée, observations, spécifications techniques..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="min-w-[100px]"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="min-w-[100px] bg-primary hover:bg-primary/90"
                >
                  {editingId ? "Mettre à jour" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Human Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employés ({humanResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {humanResources.map((resource, index) => {
              // Parse notes to extract specific information
              let position = "";
              let email = "";
              let phone = "";

              if (resource.notes) {
                const lines = resource.notes.split("\n");
                lines.forEach((line) => {
                  if (line.includes("Poste:"))
                    position = line.replace("Poste:", "").trim();
                  if (line.includes("Email:"))
                    email = line.replace("Email:", "").trim();
                  if (line.includes("Téléphone:"))
                    phone = line.replace("Téléphone:", "").trim();
                });
              }

              return (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEditResource(resource)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{resource.name}</h4>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                  {position && (
                    <div className="flex items-center gap-1 mt-1">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {position}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 mt-2">
                    {email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {email}
                        </span>
                      </div>
                    )}
                    {phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {phone}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline">
                      {resource.cost_per_unit || 0} MRU/
                      {resource.unit || "mois"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Qté: {resource.quantity || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {humanResources.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Aucun employé assigné
            </p>
          )}
        </CardContent>
      </Card>

      {/* Equipment Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Équipements ({equipmentResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipmentResources.map((resource, index) => {
              // Parse notes to extract specific information
              let equipmentType = "";
              let serialNumber = "";

              if (resource.notes) {
                const lines = resource.notes.split("\n");
                lines.forEach((line) => {
                  if (line.includes("Type:")) {
                    const typeValue = line.replace("Type:", "").trim();
                    equipmentType = typeValue;
                  }
                  if (line.includes("N° série:"))
                    serialNumber = line.replace("N° série:", "").trim();
                });
              }

              return (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEditResource(resource)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{resource.name}</h4>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                  {equipmentType && (
                    <div className="flex items-center gap-1 mt-1">
                      <Wrench className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {equipmentType}
                      </span>
                    </div>
                  )}
                  {serialNumber && (
                    <div className="flex items-center gap-1 mt-1">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {serialNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline">
                      {resource.cost_per_unit || 0} MRU/
                      {resource.unit || "jour"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Qté: {resource.quantity || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {equipmentResources.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Aucun équipement assigné
            </p>
          )}
        </CardContent>
      </Card>

      {/* Material Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Matériaux ({materialResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materialResources.map((resource, index) => {
              // Parse notes to extract specific information
              let materialType = "";
              let supplier = "";

              if (resource.notes) {
                const lines = resource.notes.split("\n");
                lines.forEach((line) => {
                  if (line.includes("Type:")) {
                    const typeValue = line.replace("Type:", "").trim();
                    materialType = typeValue;
                  }
                  if (line.includes("Fournisseur:"))
                    supplier = line.replace("Fournisseur:", "").trim();
                });
              }

              return (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEditResource(resource)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{resource.name}</h4>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                  {materialType && (
                    <div className="flex items-center gap-1 mt-1">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {materialType}
                      </span>
                    </div>
                  )}
                  {supplier && (
                    <div className="flex items-center gap-1 mt-1">
                      <Truck className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {supplier}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline">
                      {resource.cost_per_unit || 0} MRU/
                      {resource.unit || "unité"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Qté: {resource.quantity || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {materialResources.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Aucun matériau assigné
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamOverview;
