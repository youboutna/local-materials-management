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

  // Enhanced handlers for both create and edit workflows
  const handleStakeholderUpdate = (updates: Partial<StakeholderDTO>) => {
    if (mode === "edit" && onStakeholderUpdate) {
      // For edit mode, build UpdateStakeholderDTO
      const updateData: UpdateStakeholderDTO = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        stakeholderType: updates.stakeholderType,
        role: updates.role,
        organizationId: updates.organizationId,
        employeeId: updates.employeeId,
        isPrimary: updates.isPrimary,
        contact: updates.contact,
        organization: updates.organization,
        responsibilities: updates.responsibilities,
        accessLevel: updates.accessLevel,
        startDate: updates.startDate,
        endDate: updates.endDate,
        hourlyRate: updates.hourlyRate,
        contractType: updates.contractType,
        notes: updates.notes,
        isActive: updates.isActive,
        position: updates.position, // Added missing field
      };

      onStakeholderUpdate(updates.id || "", updateData);
    } else {
      // Fallback to local state management
      const updatedStakeholders = localStakeholders.map((s) =>
        s.id === updates.id ? { ...s, ...updates } : s
      );
      setLocalStakeholders(updatedStakeholders);
      onUpdate({ stakeholders: updatedStakeholders });
    }
  };

  const handleStakeholderCreate = (stakeholderData: CreateStakeholderDTO) => {
    if (mode === "create" && onStakeholderCreate) {
      onStakeholderCreate(stakeholderData);
    } else {
      // Fallback to local state management
      const newStakeholder: StakeholderDTO = {
        id: Date.now().toString(),
        ...stakeholderData,
        isPrimary: stakeholderData.isPrimary || false, // ✅ Ensure boolean type
        isInternal: stakeholderData.isInternal || false, // ✅ Ensure boolean type
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true, // Add missing required property
      };

      const updatedStakeholders = [...localStakeholders, newStakeholder];
      setLocalStakeholders(updatedStakeholders);
      onUpdate({ stakeholders: updatedStakeholders });
    }
  };

  const handleStakeholderDelete = (stakeholderId: string) => {
    if (mode === "edit" && onStakeholderDelete) {
      onStakeholderDelete(stakeholderId);
    } else {
      // Fallback to local state management
      const updatedStakeholders = localStakeholders.filter((s) => s.id !== stakeholderId);
      setLocalStakeholders(updatedStakeholders);
      onUpdate({ stakeholders: updatedStakeholders });
    }
  };

  // Enhanced team member handlers
  const handleTeamMemberCreate = (teamMemberData: CreateEmployeeDTO) => {
    if (mode === "create" && onTeamMemberCreate) {
      onTeamMemberCreate(teamMemberData);
    } else {
      // Fallback to local state management
      const newTeamMember: EmployeeDTO = {
        id: Date.now().toString(),
        ...teamMemberData,
        startDate: new Date().toISOString(), // Use correct field name
        department: EmployeeDepartment.ENGINEERING, // Use existing enum value
        salary: 0,
        isActive: true, // This is valid since isActive is optional in EmployeeDTO
        createdAt: new Date().toISOString(), // Required by EmployeeDTO
        updatedAt: new Date().toISOString(), // Required by EmployeeDTO
      };

      const updatedTeamMembers = [...teamMembers, newTeamMember];
      setTeamMembers(updatedTeamMembers);
      onUpdate({ teamMembers: updatedTeamMembers });
    }
  };

  const handleTeamMemberUpdate = (teamMemberId: string, updates: UpdateEmployeeDTO) => {
    if (mode === "edit" && onTeamMemberUpdate) {
      onTeamMemberUpdate(teamMemberId, updates);
    } else {
      // Fallback to local state management
      const updatedTeamMembers = teamMembers.map((t) =>
        t.id === teamMemberId ? { ...t, ...updates } : t
      );
      setTeamMembers(updatedTeamMembers);
      onUpdate({ teamMembers: updatedTeamMembers });
    }
  };

  const handleTeamMemberDelete = (teamMemberId: string) => {
    if (mode === "edit" && onTeamMemberDelete) {
      onTeamMemberDelete(teamMemberId);
    } else {
      // Fallback to local state management
      const updatedTeamMembers = teamMembers.filter((t) => t.id !== teamMemberId);
      setTeamMembers(updatedTeamMembers);
      onUpdate({ teamMembers: updatedTeamMembers });
    }
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

  // Enhanced stakeholder creation with proper validation and type safety
  const addStakeholder = () => {
    // ✅ Enhanced validation with clear error messages
    const validationErrors: string[] = [];
    
    if (!newStakeholder.stakeholderType) {
      validationErrors.push("Le type de partie prenante est requis");
    }
    
    if (!newStakeholder.employeeId && !newStakeholder.organizationId) {
      validationErrors.push("L'ID de l'entité est requis");
    }
    
    if (!newStakeholder.role) {
      validationErrors.push("Le rôle est requis");
    }

    if (validationErrors.length > 0) {
      console.error("Validation errors:", validationErrors);
      return;
    }

    const stakeholderData: CreateStakeholderDTO = {
      name: newStakeholder.name || "",
      stakeholderType: newStakeholder.stakeholderType as StakeholderType,
      entityType: newStakeholder.stakeholderType === StakeholderType.EMPLOYEE 
        ? StakeholderEntityType.PERSON 
        : StakeholderEntityType.ORGANIZATION, // ✅ Proper enum usage
      role: newStakeholder.role as StakeholderRole, // ✅ Proper enum casting
      projectId: projectData.id,
      organizationId: newStakeholder.organizationId,
      employeeId: newStakeholder.employeeId,
      isPrimary: newStakeholder.isPrimary || false,
      contact: {
        name: newStakeholder.name || "",
        email: newStakeholder.email || "",
        phone: newStakeholder.phone,
        position: newStakeholder.position,
      },
      organization: newStakeholder.organization,
      responsibilities: newStakeholder.responsibilities || [],
      accessLevel: newStakeholder.accessLevel as 'read' | 'write' | 'admin' || "read",
      startDate: newStakeholder.startDate,
      endDate: newStakeholder.endDate,
      hourlyRate: newStakeholder.hourlyRate,
      contractType: newStakeholder.contractType,
      notes: newStakeholder.notes,
      isActive: newStakeholder.isActive !== false,
    };

    handleStakeholderCreate(stakeholderData);
    setNewStakeholder({});
    onUpdate({ stakeholders: [...localStakeholders, stakeholderData] });
  };

  const removeStakeholder = (id: string) => {
    const updatedStakeholders = localStakeholders.filter((s) => s.id !== id);
    setLocalStakeholders(updatedStakeholders);
    onUpdate({ stakeholders: updatedStakeholders });
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
      id: Date.now().toString(), // Generate temporary ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true, // Add missing required property
    } as EmployeeDTO];
    setTeamMembers(updatedTeamMembers);
    setNewTeamMember({});
    onUpdate({ teamMembers: updatedTeamMembers });
  };

  const removeTeamMember = (id: string) => {
    const updatedTeamMembers = teamMembers.filter((t) => t.id !== id);
    setTeamMembers(updatedTeamMembers);
    onUpdate({ teamMembers: updatedTeamMembers });
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
                        setNewStakeholder({ ...newStakeholder, stakeholderType: value as StakeholderType })
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
                  
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={addStakeholder}
                      disabled={stakeholdersLoading}
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
                          <h4 className="font-medium">{member.full_name}</h4>
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
