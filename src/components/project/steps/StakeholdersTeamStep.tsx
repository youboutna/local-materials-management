import { useActiveEmployeesHex } from "@/hooks/hexagonal/useActiveEmployeesHex";
import { useStakeholdersHex } from "@/hooks/hexagonal/useStakeholdersHex";
import { useSuppliersHex } from "@/hooks/hexagonal/useSuppliersHex";

import {
  FileText,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import React, { useMemo, useState } from "react";
import EmployeeSelector from "../../selectors/EmployeeSelector";
import SimpleSupplierSelector from "../../selectors/SimpleSupplierSelector";
import { Alert, AlertDescription } from "../../ui/alert";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import StakeholderDocumentUpload from "../stakeholders/StakeholderDocumentUpload";
import { useCurrentUserRoles } from "@/hooks/useUserRoles";
import {
  CONSULTANT_DESIGNATION_REFERENTIAL,
  canDesignateConsultant,
  isConsultantBusinessCode,
} from "@/config/referentials/consultant-designation.referential";


// Import entity DTOs (PROMPTS.md Rule #4: No type redefinition)
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import {
  CreateStakeholderDTO,
  StakeholderDTO,
  StakeholderEntityType,
  StakeholderRole,
  StakeholderType,
} from "@/dtos/entities/StakeholderDTO";
import {
  StakeholderUITransformer,
  type StakeholderFormData,
} from "@/dtos/transforms/StakeholderUITransformer";
import { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";

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

  // Hexagonal hooks
  useStakeholdersHex(projectId);
  const { data: employees = [] } = useActiveEmployeesHex();
  const { suppliers = [] } = useSuppliersHex();

  const initial: StakeholderDTO[] =
    ((workflowData?.relatedData?.stakeholders as unknown) as StakeholderDTO[]) || [];

  const [localStakeholders, setLocalStakeholders] =
    useState<StakeholderDTO[]>(initial);
  const [newStakeholder, setNewStakeholder] = useState<Partial<StakeholderDTO>>(
    {}
  );
  const [segment, setSegment] = useState<Segment>("all");
  const [docsFor, setDocsFor] = useState<StakeholderDTO | null>(null);

  /**
   * Hydratation (mode édition)
   */
  const hydratedKey = React.useRef<string>("");
  React.useEffect(() => {
    const persisted =
      ((workflowData?.relatedData?.stakeholders as unknown) as StakeholderDTO[]) || [];
    const key = `${projectId ?? ""}:${persisted.map((s) => s?.id).join(",")}`;
    if (persisted.length === 0 || key === hydratedKey.current) return;
    hydratedKey.current = key;
    setLocalStakeholders(persisted);
  }, [workflowData, projectId]);

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

  const addStakeholder = () => {
    // ✅ On cherche le nom du fournisseur directement dans la liste `suppliers`
    const foundSupplier = suppliers.find(s => s.id === newStakeholder.organizationId);
    const finalOrganization = foundSupplier?.name || newStakeholder.organization || "";
    const finalName = newStakeholder.name || finalOrganization || getEmployeeName(newStakeholder.employeeId);

    const formData: StakeholderFormData = {
      name: finalName,
      stakeholderType: newStakeholder.stakeholderType as StakeholderType,
      role: (newStakeholder.role as string) || "",
      email: newStakeholder.email,
      phone: newStakeholder.phone,
      employeeId: newStakeholder.employeeId,
      organizationId: newStakeholder.organizationId,
      organization: finalOrganization,
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

    // ✅ Construction explicite du DTO local, avec tous les champs requis par l'interface
    const created: StakeholderDTO = {
      id: Date.now().toString(),
      projectId: projectId!, // ✅ Champ requis ajouté
      entityType: formData.stakeholderType === StakeholderType.EMPLOYEE 
        ? StakeholderEntityType.PERSON 
        : StakeholderEntityType.ORGANIZATION, // ✅ Champ requis ajouté
      name: formData.name,
      organization: formData.organization,
      stakeholderType: formData.stakeholderType,
      role: formData.role as StakeholderRole,
      email: formData.email,
      phone: formData.phone,
      employeeId: formData.employeeId,
      organizationId: formData.organizationId,
      position: formData.position,
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
        {/* Aide documents requis */}
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
                      const sup = suppliers?.find((s) => s.id === organizationId);
                      setNewStakeholder({
                        ...newStakeholder,
                        organizationId,
                        organization: sup?.name,
                        name: sup?.name,
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
                  {isConsultantStakeholder(stakeholder) && (
                    <Badge className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {CONSULTANT_DESIGNATION_REFERENTIAL.labels.fr.badge}
                    </Badge>
                  )}
                  <Badge
                    variant={stakeholder.isActive ? "default" : "secondary"}
                  >
                    {stakeholder.isActive ? "Actif" : "Inactif"}
                  </Badge>
                  <Button
                    variant={isConsultantStakeholder(stakeholder) ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleConsultant(stakeholder)}
                    disabled={!canDesignate}
                    title={
                      canDesignate
                        ? isConsultantStakeholder(stakeholder)
                          ? CONSULTANT_DESIGNATION_REFERENTIAL.labels.fr.revoke
                          : CONSULTANT_DESIGNATION_REFERENTIAL.labels.fr.designate
                        : CONSULTANT_DESIGNATION_REFERENTIAL.labels.fr.unauthorized
                    }
                  >
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    {isConsultantStakeholder(stakeholder) ? "Retirer consultant" : "Consultant"}
                  </Button>
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
          <DialogContent className="max-w-2xl max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0">
            <DialogHeader className="px-6 pt-6">
              <DialogTitle>
                Documents — {docsFor?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 overflow-y-auto overscroll-contain px-6 pb-6">
              {docsFor && projectId && (
                <StakeholderDocumentUpload
                  projectId={projectId}
                  stakeholderId={docsFor.id}
                  stakeholderName={docsFor.name}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default StakeholdersTeamStep;