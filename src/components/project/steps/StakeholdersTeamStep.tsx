import { useStakeholdersHex } from "@/hooks/hexagonal";
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

// Import entity DTOs (following "similitude des voisins le plus proche")
import { ProjectDTO } from "@/dtos/entities/ProjectDTO";
import { StakeholderDTO } from "@/dtos/entities/StakeholderDTO";

interface Stakeholder {
  id: string;
  type: "employee" | "external";
  entityId: string;
  role: string;
  isPrimary: boolean;
}

interface TeamMember {
  id: string;
  employeeId: string;
  position: string;
  responsibilities: string;
  availability: string;
}

interface ExtendedProjectData extends ProjectDTO {
  compliance?: any[];
  engineeringConsultant?: string;
  generalContractor?: string;
  specializedSubcontractors?: string[];
  mainSuppliers?: string[];
}

interface StakeholdersTeamStepProps {
  projectData: ExtendedProjectData;
  onUpdate: (data: Partial<ExtendedProjectData>) => void;
  isEditing?: boolean;
  baseData?: Partial<ExtendedProjectData>;
}

const StakeholdersTeamStep: React.FC<StakeholdersTeamStepProps> = ({
  projectData,
  onUpdate,
  isEditing = false,
  baseData = {},
}) => {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(
    []
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    []
  );
  const [newStakeholder, setNewStakeholder] = useState<Partial<Stakeholder>>(
    {}
  );
  const [newTeamMember, setNewTeamMember] = useState<Partial<TeamMember>>({});

  // Use hexagonal hook for stakeholders
  const { stakeholders: hexStakeholders, isLoading: stakeholdersLoading } = useStakeholdersHex();

  // Use database data from baseData or hexagonal hooks
  const dbEmployees = baseData?.employees || [];
  const dbSuppliers = baseData?.suppliers || [];

  const [employees, setEmployees] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    position: string;
  }>>([]);

  const [suppliers, setSuppliers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    specialty: string;
  }>>([]);

  // Predefined roles and positions
  const internalStakeholderRoles = [
    "Responsable financier",
    "Responsable achats",
    "Responsable logistique",
    "Responsable HSE",
    "Coordonnateur sécurité",
    "Gestionnaire contrats",
    "Contrôleur de gestion",
    "Autres",
  ];

  const externalStakeholderRoles = [
    "Ingénieur conseil",
    "Fournisseur matériaux",
    "Entrepreneur / Contractant",
    "Bureau de contrôle",
    "Architecte",
    "Bureau d'études",
    "Ministère (tutelle)",
    "Banque / Bailleur de fonds",
    "Assureur",
    "Organisme certification",
    "Autres",
  ];

  const teamPositions = [
    "Chef de projet",
    "Ingénieur principal",
    "Architecte projet",
    "Coordonnateur technique",
    "Responsable qualité",
    "Coordonnateur sécurité",
    "Gestionnaire contrats",
    "Superviseur travaux",
    "Technicien spécialisé",
    "Assistant projet",
  ];

  // CRUD Operations
  const addStakeholder = () => {
    if (
      !newStakeholder.type ||
      !newStakeholder.entityId ||
      !newStakeholder.role
    )
      return;

    const stakeholder: Stakeholder = {
      id: Date.now().toString(),
      type: newStakeholder.type,
      entityId: newStakeholder.entityId,
      role: newStakeholder.role,
      isPrimary: newStakeholder.isPrimary || false,
    };

    const updatedStakeholders = [...stakeholders, stakeholder];
    setStakeholders(updatedStakeholders);
    setNewStakeholder({});
    // TODO: Update parent component when type issues are resolved
  };

  const removeStakeholder = (id: string) => {
    const updatedStakeholders = stakeholders.filter((s) => s.id !== id);
    setStakeholders(updatedStakeholders);
    // TODO: Update parent component when type issues are resolved
  };

  const addTeamMember = () => {
    if (!newTeamMember.employeeId || !newTeamMember.position) return;

    const teamMember: TeamMember = {
      id: Date.now().toString(),
      employeeId: newTeamMember.employeeId,
      position: newTeamMember.position,
      responsibilities: newTeamMember.responsibilities || "",
      availability: newTeamMember.availability || "full-time",
    };

    const updatedTeamMembers = [...teamMembers, teamMember];
    setTeamMembers(updatedTeamMembers);
    setNewTeamMember({});
    // TODO: Update parent component when type issues are resolved
  };

  const removeTeamMember = (id: string) => {
    const updatedTeamMembers = teamMembers.filter((t) => t.id !== id);
    setTeamMembers(updatedTeamMembers);
    // TODO: Update parent component when type issues are resolved
  };

  const getEntityName = (stakeholder: Stakeholder) => {
    if (stakeholder.type === "employee") {
      const employee = employees.find((e) => e.id === stakeholder.entityId);
      return employee?.name || "Employé inconnu";
    } else {
      const supplier = suppliers.find((s) => s.id === stakeholder.entityId);
      return supplier?.name || "Fournisseur inconnu";
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.name || "Employé inconnu";
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

              <Tabs defaultValue="internal" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="internal">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Parties Internes
                  </TabsTrigger>
                  <TabsTrigger value="external">
                    <Building2 className="h-4 w-4 mr-2" />
                    Parties Externes
                  </TabsTrigger>
                </TabsList>

                {/* Internal Stakeholders */}
                <TabsContent value="internal" className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Ajouter un employé CONFIGCOMPANY
                    </h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Chef de projet */}
                        <div>
                          <EmployeeSelector
                            label="Chef de projet *"
                            value={
                              projectData.project_manager_id ?? ""
                            }
                            onChange={(value) => {
                              onUpdate({ project_manager_id: value });
                            }}
                            placeholder="Sélectionner le chef de projet"
                            departmentFilter={["management", "engineering"]}
                          />
                        </div>

                        {/* Responsable technique */}
                        <div>
                          <EmployeeSelector
                            label="Responsable technique *"
                            value={
                              projectData.technical_manager_id ?? ""
                            }
                            onChange={(value) => {
                              onUpdate({ technical_manager_id: value });
                            }}
                            placeholder="Sélectionner le responsable technique"
                            departmentFilter={["engineering", "technical"]}
                          />
                        </div>

                        <div>
                          <EmployeeSelector
                            label="Employé"
                            value={newStakeholder.entityId ?? ""}
                            onChange={(value) =>
                              setNewStakeholder({
                                ...newStakeholder,
                                type: "employee",
                                entityId: value,
                              })
                            }
                            placeholder="Sélectionner un employé"
                          />
                        </div>
                        <div>
                          <Label>Rôle / Responsabilité</Label>
                          <Select
                            value={newStakeholder.role || ""}
                            onValueChange={(value) =>
                              setNewStakeholder({
                                ...newStakeholder,
                                role: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le rôle" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                              {internalStakeholderRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        onClick={addStakeholder}
                        className="w-full"
                        disabled={
                          !newStakeholder.entityId || !newStakeholder.role
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter l'employé comme partie prenante
                      </Button>
                    </div>
                  </div>

                  {/* List of internal stakeholders */}
                  {stakeholders.filter((s) => s.type === "employee").length >
                    0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">
                        Employés CONFIGCOMPANY (
                        {
                          stakeholders.filter((s) => s.type === "employee")
                            .length
                        }
                        )
                      </h5>
                      {stakeholders
                        .filter((s) => s.type === "employee")
                        .map((stakeholder) => (
                          <div
                            key={stakeholder.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <User className="h-4 w-4 text-blue-500" />
                              <div>
                                <div className="font-medium">
                                  {getEntityName(stakeholder)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {stakeholder.role}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStakeholder(stakeholder.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>

                {/* External Stakeholders */}
                <TabsContent value="external" className="space-y-4">
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Ajouter une organisation externe
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Ingénieur conseil, fournisseurs, contractants, ministères,
                      banques, bailleurs de fonds
                    </p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <SimpleSupplierSelector
                            label="Organisation / Fournisseur"
                            value={newStakeholder.entityId || ""}
                            onChange={(value) =>
                              setNewStakeholder({
                                ...newStakeholder,
                                type: "external",
                                entityId: value,
                              })
                            }
                            placeholder="Sélectionner une organisation"
                          />
                        </div>
                        <div>
                          <Label>Rôle / Type</Label>
                          <Select
                            value={newStakeholder.role || ""}
                            onValueChange={(value) =>
                              setNewStakeholder({
                                ...newStakeholder,
                                role: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le rôle" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                              {externalStakeholderRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        onClick={addStakeholder}
                        className="w-full"
                        disabled={
                          !newStakeholder.entityId || !newStakeholder.role
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter l'organisation comme partie prenante
                      </Button>
                    </div>
                  </div>

                  {/* List of external stakeholders */}
                  {stakeholders.filter((s) => s.type === "external").length >
                    0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">
                        Organisations externes (
                        {
                          stakeholders.filter((s) => s.type === "external")
                            .length
                        }
                        )
                      </h5>
                      {stakeholders
                        .filter((s) => s.type === "external")
                        .map((stakeholder) => (
                          <div
                            key={stakeholder.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Building2 className="h-4 w-4 text-orange-500" />
                              <div>
                                <div className="font-medium">
                                  {getEntityName(stakeholder)}
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs mt-1"
                                >
                                  {stakeholder.role}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStakeholder(stakeholder.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Équipe du projet</h3>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Ajouter un membre d'équipe</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <EmployeeSelector
                        label="Employé"
                        value={newTeamMember.employeeId ?? ""}
                        onChange={(value) =>
                          setNewTeamMember({
                            ...newTeamMember,
                            employeeId: value,
                          })
                        }
                        placeholder="Sélectionner un employé"
                      />
                    </div>
                    <div>
                      <Label>Position dans le projet</Label>
                      <Select
                        value={newTeamMember.position || ""}
                        onValueChange={(value) =>
                          setNewTeamMember({
                            ...newTeamMember,
                            position: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Position" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                          {teamPositions.map((position) => (
                            <SelectItem key={position} value={position}>
                              {position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Responsabilités</Label>
                      <Input
                        placeholder="Responsabilités spécifiques"
                        value={newTeamMember.responsibilities || ""}
                        onChange={(e) =>
                          setNewTeamMember({
                            ...newTeamMember,
                            responsibilities: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Disponibilité</Label>
                      <Select
                        value={newTeamMember.availability || "full-time"}
                        onValueChange={(value) =>
                          setNewTeamMember({
                            ...newTeamMember,
                            availability: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="full-time">Temps plein</SelectItem>
                          <SelectItem value="part-time">
                            Temps partiel
                          </SelectItem>
                          <SelectItem value="on-demand">Sur demande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={addTeamMember}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter à l'équipe
                    </Button>
                  </div>
                </div>
              </div>

              {teamMembers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Membres de l'équipe</h4>
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="font-medium">
                            {getEmployeeName(member.employeeId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.position}
                          </div>
                          {member.responsibilities && (
                            <div className="text-xs text-gray-400">
                              {member.responsibilities}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {member.availability === "full-time"
                            ? "Temps plein"
                            : member.availability === "part-time"
                            ? "Temps partiel"
                            : "Sur demande"}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contractors" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Contractants et fournisseurs
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SimpleSupplierSelector
                    label="Bureau d'études"
                    value={projectData.contractors?.engineeringConsultant || ""}
                    onChange={(value) => {
                      const updatedContractors = {
                        ...projectData.contractors,
                        engineeringConsultant: value,
                      };
                      onUpdate({ contractors: updatedContractors });
                    }}
                    placeholder="Sélectionner le bureau d'études"
                  />
                </div>
                <div>
                  <SimpleSupplierSelector
                    label="Entrepreneur général"
                    value={projectData.contractors?.generalContractor || ""}
                    onChange={(value) => {
                      const updatedContractors = {
                        ...projectData.contractors,
                        generalContractor: value,
                      };
                      onUpdate({ contractors: updatedContractors });
                    }}
                    placeholder="Sélectionner l'entrepreneur général"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specializedSubcontractors">
                    Sous-traitants spécialisés
                  </Label>
                  <textarea
                    id="specializedSubcontractors"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                    placeholder="Liste des sous-traitants spécialisés requis"
                    value={
                      projectData.contractors?.specializedSubcontractors || ""
                    }
                    onChange={(e) => {
                      const updatedContractors = {
                        ...projectData.contractors,
                        specializedSubcontractors: e.target.value,
                      };
                      onUpdate({ contractors: updatedContractors });
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="mainSuppliers">Fournisseurs principaux</Label>
                  <textarea
                    id="mainSuppliers"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                    placeholder="Liste des fournisseurs de matériaux principaux"
                    value={projectData.contractors?.mainSuppliers || ""}
                    onChange={(e) => {
                      const updatedContractors = {
                        ...projectData.contractors,
                        mainSuppliers: e.target.value,
                      };
                      onUpdate({ contractors: updatedContractors });
                    }}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">Information</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Les contractants sélectionnés seront automatiquement liés
                      aux garanties bancaires, certificats d'assurance et autres
                      documents contractuels du projet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Documents des Parties Prenantes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Conventions, contrats, documents de référence associés aux
                  acteurs du projet
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 border-dashed">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Conventions & Contrats</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contrats entrepreneurs, conventions ingénieur conseil
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Joindre documents
                    </Button>
                  </div>
                </Card>

                <Card className="p-4 border-dashed">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Documents de référence</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Accords cadres, protocoles, notes de service
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Joindre documents
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
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
