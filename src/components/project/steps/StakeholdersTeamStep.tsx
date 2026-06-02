import { useStakeholdersHex } from "@/hooks/hexagonal/useStakeholdersHex";
import { useActiveEmployeesHex } from "@/hooks/hexagonal/useActiveEmployeesHex";
import { useSuppliersHex } from "@/hooks/hexagonal/useSuppliersHex";

import {
  FileText,
  Plus,
  Users,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import EmployeeSelector from "../../selectors/EmployeeSelector";
import SimpleSupplierSelector from "../../selectors/SimpleSupplierSelector";
import StakeholderDocumentUpload from "../stakeholders/StakeholderDocumentUpload";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Alert, AlertDescription } from "../../ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

// Import entity DTOs (PROMPTS.md Rule #4: No type redefinition)
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";
import {
  StakeholderDTO,
  CreateStakeholderDTO,
  StakeholderType,
  StakeholderRole,
} from "@/dtos/entities/StakeholderDTO";
import {
  StakeholderUITransformer,
  type StakeholderFormData,
} from "@/dtos/transforms/StakeholderUITransformer";

type Segment = "all" | "team" | "external" | "contractors";

interface StakeholdersTeamStepProps {
  workflowData: ProjectWorkflowData | null;
  onStepComplete: (stepData: { stakeholders: StakeholderDTO[] }) => void;
  isEditing?: boolean;
  mode?: "create" | "edit";
}

const StakeholdersTeamStep: React.FC<StakeholdersTeamStepProps> = ({
  workflowData,
  onStepComplete,
}) => {
  const projectData = workflowData?.projectData || ({} as ProjectDTO);
  const projectId = projectData.id;

  // Hexagonal hooks (Core memory: no direct Supabase in UI)
  useStakeholdersHex(projectId);
  const { data: employees = [] } = useActiveEmployeesHex();
  const { suppliers = [] } = useSuppliersHex();

  // Initialize from workflow data if present (edit mode)
  const initial: StakeholderDTO[] =
    (workflowData?.relatedData?.stakeholders as StakeholderDTO[]) || [];

  const [localStakeholders, setLocalStakeholders] =
    useState<StakeholderDTO[]>(initial);
  const [newStakeholder, setNewStakeholder] = useState<Partial<StakeholderDTO>>(
    {}
  );
  const [segment, setSegment] = useState<Segment>("all");
  const [docsFor, setDocsFor] = useState<StakeholderDTO | null>(null);

  const notifyUpdate = (next: StakeholderDTO[]) => {
    onStepComplete({ stakeholders: next });
  };

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId) return "";
    const e = employees.find((x) => x.id === employeeId);
    return (e as any)?.full_name || (e as any)?.fullName || "";
  };

  const getEntityName = (s: StakeholderDTO) => {
    if (s.stakeholderType === StakeholderType.EMPLOYEE) {
      return getEmployeeName(s.employeeId) || "Employé";
    }
    const sup = suppliers.find((x) => x.id === s.organizationId);
    return sup?.name || s.organization || "Entité";
  };

  // UI → Transformer → DTO (Core memory: UI Data Mapping)
  const addStakeholder = () => {
    const formData: StakeholderFormData = {
      name:
        newStakeholder.name ||
        newStakeholder.organization ||
        getEmployeeName(newStakeholder.employeeId),
      stakeholderType: newStakeholder.stakeholderType as StakeholderType,
      role: (newStakeholder.role as string) || "",
      email: newStakeholder.email,
      phone: newStakeholder.phone,
      employeeId: newStakeholder.employeeId,
      organizationId: newStakeholder.organizationId,
      organization: newStakeholder.organization,
      position: newStakeholder.position,
      isActive: true,
    };

    const validation =
      StakeholderUITransformer.validateStakeholderForm(formData);
    if (!validation.isValid) {
      console.error("Stakeholder validation:", validation.errors);
      return;
    }

    const dto: CreateStakeholderDTO = {
      ...StakeholderUITransformer.formToCreateRequest(formData),
      projectId,
      isPrimary: newStakeholder.isPrimary || false,
    };

    const created: StakeholderDTO = {
      id: Date.now().toString(),
      ...dto,
      isPrimary: dto.isPrimary || false,
      isInternal: dto.isInternal || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    const next = [...localStakeholders, created];
    setLocalStakeholders(next);
    notifyUpdate(next);
    setNewStakeholder({});
  };

  const removeStakeholder = (id: string) => {
    const next = localStakeholders.filter((s) => s.id !== id);
    setLocalStakeholders(next);
    notifyUpdate(next);
  };

  const isContractor = (s: StakeholderDTO) =>
    String(s.role).toUpperCase().includes("CONTRACTOR") ||
    String(s.stakeholderType).toUpperCase().includes("CONTRACTOR");

  const filtered = useMemo(() => {
    switch (segment) {
      case "team":
        return localStakeholders.filter(
          (s) => s.stakeholderType === StakeholderType.EMPLOYEE
        );
      case "contractors":
        return localStakeholders.filter(isContractor);
      case "external":
        return localStakeholders.filter(
          (s) =>
            s.stakeholderType !== StakeholderType.EMPLOYEE && !isContractor(s)
        );
      default:
        return localStakeholders;
    }
  }, [localStakeholders, segment]);

  const counts = useMemo(
    () => ({
      all: localStakeholders.length,
      team: localStakeholders.filter(
        (s) => s.stakeholderType === StakeholderType.EMPLOYEE
      ).length,
      contractors: localStakeholders.filter(isContractor).length,
      external: localStakeholders.filter(
        (s) =>
          s.stakeholderType !== StakeholderType.EMPLOYEE && !isContractor(s)
      ).length,
    }),
    [localStakeholders]
  );

  const segments: Array<{ key: Segment; label: string }> = [
    { key: "all", label: `Tous (${counts.all})` },
    { key: "team", label: `Équipe (${counts.team})` },
    { key: "external", label: `Externes (${counts.external})` },
    { key: "contractors", label: `Contractants (${counts.contractors})` },
  ];

  const canAdd =
    !!newStakeholder?.stakeholderType &&
    !!newStakeholder?.role &&
    (newStakeholder.stakeholderType === StakeholderType.EMPLOYEE
      ? !!newStakeholder.employeeId
      : !!newStakeholder.organizationId);

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-5 w-5 text-primary" />
          Parties prenantes du projet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Aide documents requis (statique, condensée) */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Documents requis par partie prenante : contrats, conventions
            ingénieur conseil, accords fournisseurs, conventions ministérielles,
            accords de financement. Cliquez sur « Documents » sur une carte
            pour téléverser.
          </AlertDescription>
        </Alert>

        {/* Add form */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-medium mb-4">Ajouter une partie prenante</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium mb-2">
                Type de partie prenante
              </Label>
              <Select
                value={newStakeholder?.stakeholderType || ""}
                onValueChange={(value) =>
                  setNewStakeholder({
                    ...newStakeholder,
                    stakeholderType: value as StakeholderType,
                    employeeId: undefined,
                    organizationId: undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StakeholderType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Rôle</Label>
              <Select
                value={(newStakeholder?.role as string) || ""}
                onValueChange={(value) =>
                  setNewStakeholder({
                    ...newStakeholder,
                    role: value as StakeholderRole,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le rôle" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StakeholderRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newStakeholder?.stakeholderType === StakeholderType.EMPLOYEE && (
              <div className="md:col-span-2">
                <EmployeeSelector
                  label="Employé"
                  value={newStakeholder.employeeId}
                  onChange={(employeeId) => {
                    const emp = employees.find((e) => e.id === employeeId);
                    setNewStakeholder({
                      ...newStakeholder,
                      employeeId,
                      name: (emp as any)?.full_name || newStakeholder.name,
                      email: (emp as any)?.email || newStakeholder.email,
                    });
                  }}
                />
              </div>
            )}

            {newStakeholder?.stakeholderType &&
              newStakeholder.stakeholderType !== StakeholderType.EMPLOYEE && (
                <div className="md:col-span-2">
                  <SimpleSupplierSelector
                    label={
                      newStakeholder.role === StakeholderRole.CONSULTANT
                        ? "Indépendant / Consultant"
                        : "Fournisseur / Organisation"
                    }
                    value={newStakeholder.organizationId}
                    onChange={(organizationId) => {
                      const sup = suppliers?.find(
                        (s) => s.id === organizationId
                      );
                      setNewStakeholder({
                        ...newStakeholder,
                        organizationId,
                        organization:
                          sup?.name || newStakeholder.organization,
                        name: sup?.name || newStakeholder.name,
                      });
                    }}
                  />
                </div>
              )}

            <div className="flex justify-end mt-2 md:col-span-2">
              <Button onClick={addStakeholder} disabled={!canAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>

        {/* Segmented filter */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtres parties prenantes">
          {segments.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={segment === s.key}
              onClick={() => setSegment(s.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                segment === s.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Stakeholders List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucune partie prenante dans ce segment.
            </p>
          )}
          {filtered.map((stakeholder) => (
            <div
              key={stakeholder.id}
              className="border rounded-lg p-4 bg-card"
              data-testid={`stakeholder-card-${stakeholder.id}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium truncate">{stakeholder.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {stakeholder.role} • {getEntityName(stakeholder)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={stakeholder.isActive ? "default" : "secondary"}
                  >
                    {stakeholder.isActive ? "Actif" : "Inactif"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDocsFor(stakeholder)}
                    disabled={!projectId}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Documents
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeStakeholder(stakeholder.id)}
                    aria-label="Retirer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Documents dialog */}
        <Dialog open={!!docsFor} onOpenChange={(o) => !o && setDocsFor(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Documents — {docsFor?.name}
              </DialogTitle>
            </DialogHeader>
            {docsFor && projectId && (
              <StakeholderDocumentUpload
                projectId={projectId}
                stakeholderId={docsFor.id}
                stakeholderName={docsFor.name}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default StakeholdersTeamStep;
