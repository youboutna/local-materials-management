import { useStakeholdersHex } from "@/hooks/hexagonal/useStakeholdersHex";
import { useActiveEmployeesHex } from "@/hooks/hexagonal/useActiveEmployeesHex";
import { useSuppliersHex } from "@/hooks/hexagonal/useSuppliersHex";

import {
  Briefcase,
  Building2,
  FileText,
  Plus,
  Upload,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import EmployeeSelector from "../../selectors/EmployeeSelector";
import SimpleSupplierSelector from "../../selectors/SimpleSupplierSelector";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";

// Import entity DTOs (following PROMPTS.md Rule #4: No type redefinition)
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { ProjectWorkflowData } from "@/dtos/workflows/ProjectWorkflowDTOs";
import { StakeholderDTO, CreateStakeholderDTO, UpdateStakeholderDTO, StakeholderType, StakeholderEntityType, StakeholderRole } from "@/dtos/entities/StakeholderDTO";
import { StakeholderUITransformer, type StakeholderFormData } from "@/dtos/transforms/StakeholderUITransformer";
import { EmployeeDTO, CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeDepartment, EmployeeType, EmployeeStatus } from "@/dtos/entities/EmployeeDTO";
import { EmployeeRole } from "@/dtos/entities/EmployeeDTO";
import { SupplierDTO } from "@/dtos/entities/SupplierDTO";

// Import role referentials from config (following PROMPTS.md Rule #3: Proper file structure)
import { 
  internalStakeholderRoles, 
  externalStakeholderRoles, 
  teamPositions,
  getRoleOptions,
  getTeamPositionOptions
} from "@/config/referentials/stakeholderRoles";

interface StakeholdersTeamStepProps {
  workflowData: ProjectWorkflowData | null;
  onStepComplete: (stepData: { stakeholders: EmployeeDTO[] }) => void;
  isEditing?: boolean;
  mode?: "create" | "edit";
}

const StakeholdersTeamStep: React.FC<StakeholdersTeamStepProps> = ({
  workflowData,
  onStepComplete,
  isEditing = false,
  mode = isEditing ? "edit" : "create",
}) => {
  const projectData = workflowData?.projectData || {} as ProjectDTO;
  const existingStakeholders = workflowData?.relatedData?.stakeholders || [];
  // Use hexagonal hooks for proper architecture
  const { stakeholders: hexStakeholders, isLoading: stakeholdersLoading } = useStakeholdersHex(
    projectData.id
  );
  const { data: employees = [], isLoading: employeesLoading } = useActiveEmployeesHex();
  const { suppliers, isLoading: suppliersLoading } = useSuppliersHex();

  const [localStakeholders, setLocalStakeholders] = useState<StakeholderDTO[]>(
    (projectData as any).stakeholders || []
  );
  const [teamMembers, setTeamMembers] = useState<EmployeeDTO[]>([]);
  const [newStakeholder, setNewStakeholder] = useState<Partial<StakeholderDTO>>(
    {}
  );
  const [newTeamMember, setNewTeamMember] = useState<Partial<EmployeeDTO>>({});

  // Helper to update via onStepComplete
  const notifyUpdate = (stakeholders: StakeholderDTO[]) => {
    onStepComplete({ stakeholders: stakeholders as any });
  };

  // Enhanced handlers for both create and edit workflows
  const handleStakeholderUpdate = (updates: Partial<StakeholderDTO>) => {
    const updatedStakeholders = localStakeholders.map((s) =>
      s.id === updates.id ? { ...s, ...updates } : s
    );
    setLocalStakeholders(updatedStakeholders);
    notifyUpdate(updatedStakeholders as any);
  };

  const handleStakeholderCreate = (stakeholderData: CreateStakeholderDTO) => {
    const newStakeholderItem: StakeholderDTO = {
      id: Date.now().toString(),
      ...stakeholderData,
      isPrimary: stakeholderData.isPrimary || false,
      isInternal: stakeholderData.isInternal || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    const updatedStakeholders = [...localStakeholders, newStakeholderItem];
    setLocalStakeholders(updatedStakeholders);
    notifyUpdate(updatedStakeholders as any);
  };

  const handleStakeholderDelete = (stakeholderId: string) => {
    const updatedStakeholders = localStakeholders.filter((s) => s.id !== stakeholderId);
    setLocalStakeholders(updatedStakeholders);
    notifyUpdate(updatedStakeholders as any);
  };

  // Enhanced team member handlers
  const handleTeamMemberCreate = (teamMemberData: CreateEmployeeDTO) => {
    const newTeamMemberItem: EmployeeDTO = {
      id: Date.now().toString(),
      ...teamMemberData,
      startDate: new Date().toISOString(),
      department: EmployeeDepartment.ENGINEERING,
      salary: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTeamMembers = [...teamMembers, newTeamMemberItem];
    setTeamMembers(updatedTeamMembers);
    notifyUpdate(localStakeholders as any);
  };

  const handleTeamMemberUpdate = (teamMemberId: string, updates: UpdateEmployeeDTO) => {
    const updatedTeamMembers = teamMembers.map((t) =>
      t.id === teamMemberId ? { ...t, ...updates } : t
    );
    setTeamMembers(updatedTeamMembers);
    notifyUpdate(localStakeholders as any);
  };

  const handleTeamMemberDelete = (teamMemberId: string) => {
    const updatedTeamMembers = teamMembers.filter((t) => t.id !== teamMemberId);
    setTeamMembers(updatedTeamMembers);
    notifyUpdate(localStakeholders as any);
  };

  // Helper functions using service layer validation
  const getStakeholdersByType = (type: StakeholderType) => {
    return localStakeholders.filter((s) => s.stakeholderType === type);
  };

  const getTeamMembers = () => {
    return employees.filter((e) => e.department === "project_team");
  };

  const getEntityName = (stakeholder: StakeholderDTO) => {
    if (stakeholder.stakeholderType === StakeholderType.EMPLOYEE) {
      const employee = employees.find((e) => e.id === stakeholder.employeeId);
      return employee?.full_name || "Employé inconnu";
    } else {
      // ✅ Use organizationId for suppliers/external entities
      const supplier = suppliers.find((s) => s.id === stakeholder.organizationId);
      return supplier?.name || stakeholder.organization || "Entité inconnue";
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.full_name || "Employé inconnu";
  };

  // UI → Transformer → DTO (PROMPTS.md Rule #4 + Core memory: UI Data Mapping)
  const addStakeholder = () => {
    const formData: StakeholderFormData = {
      name:
        newStakeholder.name ||
        newStakeholder.organization ||
        (newStakeholder.employeeId
          ? getEmployeeName(newStakeholder.employeeId)
          : ""),
      stakeholderType: newStakeholder.stakeholderType as StakeholderType,
      role: (newStakeholder.role as string) || "",
      email: newStakeholder.email,
      phone: newStakeholder.phone,
      employeeId: newStakeholder.employeeId,
      organizationId: newStakeholder.organizationId,
      organization: newStakeholder.organization,
      position: newStakeholder.position,
      responsibilities: newStakeholder.responsibilities,
      accessLevel: newStakeholder.accessLevel as 'read' | 'write' | 'admin' | undefined,
      startDate: newStakeholder.startDate,
      endDate: newStakeholder.endDate,
      hourlyRate: newStakeholder.hourlyRate,
      contractType: newStakeholder.contractType,
      notes: newStakeholder.notes,
      isActive: newStakeholder.isActive !== false,
    };

    const validation = StakeholderUITransformer.validateStakeholderForm(formData);
    if (!validation.isValid) {
      console.error("Validation errors:", validation.errors);
      return;
    }

    const dto: CreateStakeholderDTO = {
      ...StakeholderUITransformer.formToCreateRequest(formData),
      projectId: projectData.id,
      isPrimary: newStakeholder.isPrimary || false,
    };

    handleStakeholderCreate(dto);
    setNewStakeholder({});
  };

  const removeStakeholder = (id: string) => {
    handleStakeholderDelete(id);
  };

  const addTeamMember = () => {
    if (!newTeamMember.employeeId || !newTeamMember.position) return;

    const teamMemberData: CreateEmployeeDTO = {
      firstName: newTeamMember.firstName || "Team",
      lastName: newTeamMember.lastName || "Member",
      type: EmployeeType.FULL_TIME, // ✅ Required enum
      role: "specialist" as EmployeeRole.SPECIALIST, // ✅ Required enum using string literal
      department: EmployeeDepartment.PROJECT_MANAGEMENT, // ✅ Required enum
      status: EmployeeStatus.ACTIVE, // ✅ Required enum
      employeeId: newTeamMember.employeeId,
      position: newTeamMember.position,
      startDate: new Date().toISOString(), // ✅ Correct property name
      salary: 0,
      // Note: id and isActive are not part of CreateEmployeeDTO interface
    };

    const updatedTeamMembers = [...teamMembers, {
      ...teamMemberData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    } as EmployeeDTO];
    setTeamMembers(updatedTeamMembers);
    setNewTeamMember({});
    notifyUpdate(localStakeholders as any);
  };

  const removeTeamMember = (id: string) => {
    handleTeamMemberDelete(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-500" />
          Parties Prenantes du Projet
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configuration des acteurs: Organigramme, RH, Liste acteurs selon le
          workflow CONFIGCOMPANY
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stakeholders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stakeholders">Parties Prenantes</TabsTrigger>
            <TabsTrigger value="team">Équipe</TabsTrigger>
            <TabsTrigger value="contractors">Contractants</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="stakeholders" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">
                  Autres Parties Prenantes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Configuration des acteurs internes CONFIGCOMPANY et parties
                  externes (fournisseurs, ministères, banques, etc.)
                </p>
              </div>

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
                          // reset entity selection when type changes
                          employeeId: undefined,
                          organizationId: undefined,
                        })
                      }
                    >
                      <SelectTrigger className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="start">
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
                        setNewStakeholder({ ...newStakeholder, role: value as StakeholderRole })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(StakeholderRole).map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional autocomplete by stakeholder type */}
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
                            name: emp?.full_name || newStakeholder.name,
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
                              organization: sup?.name || newStakeholder.organization,
                              name: sup?.name || newStakeholder.name,
                            });
                          }}
                        />
                      </div>
                    )}

                  <div className="flex justify-end mt-4 md:col-span-2">
                    <Button
                      onClick={addStakeholder}
                      disabled={
                        stakeholdersLoading ||
                        !newStakeholder?.stakeholderType ||
                        !newStakeholder?.role ||
                        (newStakeholder.stakeholderType === StakeholderType.EMPLOYEE
                          ? !newStakeholder.employeeId
                          : !newStakeholder.organizationId)
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stakeholders List */}
              <div className="space-y-4">
                {localStakeholders.map((stakeholder) => (
                  <div key={stakeholder.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{stakeholder.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {stakeholder.role} • {getEntityName(stakeholder)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={stakeholder.isActive ? "default" : "secondary"}>
                          {stakeholder.isActive ? "Actif" : "Inactif"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeStakeholder(stakeholder.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Équipe Projet</h3>
                <p className="text-sm text-muted-foreground">
                  Configuration des membres de l'équipe projet et rôles associés
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-4">Ajouter un membre d'équipe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <EmployeeSelector
                      value={newTeamMember.employeeId || ""}
                      onChange={(value) =>
                        setNewTeamMember({ ...newTeamMember, employeeId: value })
                      }
                      placeholder="Sélectionner un employé"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Position/Rôle"
                      value={newTeamMember.position || ""}
                      onChange={(e) =>
                        setNewTeamMember({ ...newTeamMember, position: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={addTeamMember} disabled={employeesLoading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </div>

              {/* Team Members List */}
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{member.fullName || (member as any).full_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {member.position}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contractors" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Contractants</h3>
                <p className="text-sm text-muted-foreground">
                  Gestion des contractants et sous-traitants
                </p>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-4">Ajouter un contractant</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SimpleSupplierSelector
                    label="Contractant"
                    value=""
                    onChange={() => {}}
                    placeholder="Sélectionner un contractant"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Documents</h3>
                <p className="text-sm text-muted-foreground">
                  Documents requis pour les parties prenantes
                </p>
              </div>
              
              <div className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">
                      Documents requis
                    </h4>
                    <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
                      <li>Contrat avec entrepreneur principal</li>
                      <li>Convention avec ingénieur conseil</li>
                      <li>Accords avec fournisseurs clés</li>
                      <li>Conventions avec ministères (si applicable)</li>
                      <li>Accords de financement (banques/bailleurs)</li>
                      <li>Protocoles inter-organisationnels</li>
                    </ul>
                    <p className="text-xs text-amber-600 mt-3">
                      Ces documents seront également accessibles dans la section
                      Documents du projet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StakeholdersTeamStep;
