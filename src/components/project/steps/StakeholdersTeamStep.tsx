import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Users, Plus, X, User, Building2, UserCheck, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import EmployeeSelector from '../../selectors/EmployeeSelector';
import SimpleSupplierSelector from '../../selectors/SimpleSupplierSelector';

interface StakeholdersTeamStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  isEditing?: boolean;
}

interface Stakeholder {
  id: string;
  type: 'employee' | 'external';
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

const StakeholdersTeamStep: React.FC<StakeholdersTeamStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(formData.stakeholders || []);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(formData.teamMembers || []);
  const [newStakeholder, setNewStakeholder] = useState<Partial<Stakeholder>>({});
  const [newTeamMember, setNewTeamMember] = useState<Partial<TeamMember>>({});
  
  // Database data
  const [employees, setEmployees] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    loadEmployees();
    loadSuppliers();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  // Predefined roles and positions
  const stakeholderRoles = [
    'Maître d\'ouvrage',
    'Maître d\'œuvre',
    'Coordonnateur sécurité',
    'Bureau de contrôle',
    'Architecte',
    'Ingénieur structure',
    'Consultant spécialisé',
    'Représentant client',
    'Gestionnaire projet',
    'Responsable qualité'
  ];

  const teamPositions = [
    'Chef de projet',
    'Ingénieur principal',
    'Architecte projet',
    'Coordonnateur technique',
    'Responsable qualité',
    'Coordonnateur sécurité',
    'Gestionnaire contrats',
    'Superviseur travaux',
    'Technicien spécialisé',
    'Assistant projet'
  ];

  // CRUD Operations
  const addStakeholder = () => {
    if (!newStakeholder.type || !newStakeholder.entityId || !newStakeholder.role) return;
    
    const stakeholder: Stakeholder = {
      id: Date.now().toString(),
      type: newStakeholder.type,
      entityId: newStakeholder.entityId,
      role: newStakeholder.role,
      isPrimary: newStakeholder.isPrimary || false
    };
    
    const updatedStakeholders = [...stakeholders, stakeholder];
    setStakeholders(updatedStakeholders);
    setNewStakeholder({});
    onUpdate({ stakeholders: updatedStakeholders });
  };

  const removeStakeholder = (id: string) => {
    const updatedStakeholders = stakeholders.filter(s => s.id !== id);
    setStakeholders(updatedStakeholders);
    onUpdate({ stakeholders: updatedStakeholders });
  };

  const addTeamMember = () => {
    if (!newTeamMember.employeeId || !newTeamMember.position) return;
    
    const teamMember: TeamMember = {
      id: Date.now().toString(),
      employeeId: newTeamMember.employeeId,
      position: newTeamMember.position,
      responsibilities: newTeamMember.responsibilities || '',
      availability: newTeamMember.availability || 'full-time'
    };
    
    const updatedTeamMembers = [...teamMembers, teamMember];
    setTeamMembers(updatedTeamMembers);
    setNewTeamMember({});
    onUpdate({ teamMembers: updatedTeamMembers });
  };

  const removeTeamMember = (id: string) => {
    const updatedTeamMembers = teamMembers.filter(t => t.id !== id);
    setTeamMembers(updatedTeamMembers);
    onUpdate({ teamMembers: updatedTeamMembers });
  };

  const getEntityName = (stakeholder: Stakeholder) => {
    if (stakeholder.type === 'employee') {
      const employee = employees.find(e => e.id === stakeholder.entityId);
      return employee?.full_name || 'Employé inconnu';
    } else {
      const supplier = suppliers.find(s => s.id === stakeholder.entityId);
      return supplier?.name || 'Fournisseur inconnu';
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee?.full_name || 'Employé inconnu';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-500" />
          Parties Prenantes & Équipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stakeholders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stakeholders">Parties Prenantes</TabsTrigger>
            <TabsTrigger value="team">Équipe</TabsTrigger>
            <TabsTrigger value="contractors">Contractants</TabsTrigger>
          </TabsList>

          <TabsContent value="stakeholders" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Responsabilités principales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <EmployeeSelector
                    label="Chef de projet principal"
                    value={formData.delegation?.projectManager || ''}
                    onChange={(value) => {
                      const updatedDelegation = { ...formData.delegation, projectManager: value };
                      onUpdate({ delegation: updatedDelegation });
                    }}
                    placeholder="Sélectionner le chef de projet"
                    departmentFilter={['management', 'engineering']}
                  />
                </div>
                <div>
                  <SimpleSupplierSelector
                    label="Entrepreneur principal"
                    value={formData.contractors?.mainContractor || ''}
                    onChange={(value) => {
                      const updatedContractors = { ...formData.contractors, mainContractor: value };
                      onUpdate({ contractors: updatedContractors });
                    }}
                    placeholder="Sélectionner l'entrepreneur principal"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Ajouter une partie prenante</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Type</Label>
                      <Select 
                        value={newStakeholder.type || ''} 
                        onValueChange={(value: 'employee' | 'external') => setNewStakeholder({...newStakeholder, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type de partie prenante" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                          <SelectItem value="employee">Employé interne</SelectItem>
                          <SelectItem value="external">Fournisseur externe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Entité</Label>
                      {newStakeholder.type === 'employee' ? (
                        <EmployeeSelector
                          value={newStakeholder.entityId || ''}
                          onChange={(value) => setNewStakeholder({...newStakeholder, entityId: value})}
                          placeholder="Sélectionner un employé"
                        />
                      ) : newStakeholder.type === 'external' ? (
                        <SimpleSupplierSelector
                          value={newStakeholder.entityId || ''}
                          onChange={(value) => setNewStakeholder({...newStakeholder, entityId: value})}
                          placeholder="Sélectionner un fournisseur"
                        />
                      ) : (
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner d'abord le type" />
                          </SelectTrigger>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Rôle</Label>
                      <Select 
                        value={newStakeholder.role || ''} 
                        onValueChange={(value) => setNewStakeholder({...newStakeholder, role: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Rôle dans le projet" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50 max-h-60 overflow-y-auto">
                          {stakeholderRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={addStakeholder} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {stakeholders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Parties prenantes ajoutées</h4>
                  {stakeholders.map((stakeholder) => (
                    <div key={stakeholder.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {stakeholder.type === 'employee' ? (
                          <User className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Building2 className="h-4 w-4 text-orange-500" />
                        )}
                        <div>
                          <div className="font-medium">{getEntityName(stakeholder)}</div>
                          <div className="text-sm text-gray-500">{stakeholder.role}</div>
                        </div>
                        {stakeholder.isPrimary && (
                          <Badge variant="default" className="text-xs">Principal</Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStakeholder(stakeholder.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
                        value={newTeamMember.employeeId || ''}
                        onChange={(value) => setNewTeamMember({...newTeamMember, employeeId: value})}
                        placeholder="Sélectionner un employé"
                      />
                    </div>
                    <div>
                      <Label>Position dans le projet</Label>
                      <Select 
                        value={newTeamMember.position || ''} 
                        onValueChange={(value) => setNewTeamMember({...newTeamMember, position: value})}
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
                        value={newTeamMember.responsibilities || ''}
                        onChange={(e) => setNewTeamMember({...newTeamMember, responsibilities: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Disponibilité</Label>
                      <Select 
                        value={newTeamMember.availability || 'full-time'} 
                        onValueChange={(value) => setNewTeamMember({...newTeamMember, availability: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="full-time">Temps plein</SelectItem>
                          <SelectItem value="part-time">Temps partiel</SelectItem>
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
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="font-medium">{getEmployeeName(member.employeeId)}</div>
                          <div className="text-sm text-gray-500">{member.position}</div>
                          {member.responsibilities && (
                            <div className="text-xs text-gray-400">{member.responsibilities}</div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {member.availability === 'full-time' ? 'Temps plein' : 
                           member.availability === 'part-time' ? 'Temps partiel' : 'Sur demande'}
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
              <h3 className="text-lg font-semibold">Contractants et fournisseurs</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SimpleSupplierSelector
                    label="Bureau d'études"
                    value={formData.contractors?.engineeringConsultant || ''}
                    onChange={(value) => {
                      const updatedContractors = { ...formData.contractors, engineeringConsultant: value };
                      onUpdate({ contractors: updatedContractors });
                    }}
                    placeholder="Sélectionner le bureau d'études"
                  />
                </div>
                <div>
                  <SimpleSupplierSelector
                    label="Entrepreneur général"
                    value={formData.contractors?.generalContractor || ''}
                    onChange={(value) => {
                      const updatedContractors = { ...formData.contractors, generalContractor: value };
                      onUpdate({ contractors: updatedContractors });
                    }}
                    placeholder="Sélectionner l'entrepreneur général"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specializedSubcontractors">Sous-traitants spécialisés</Label>
                  <textarea 
                    id="specializedSubcontractors"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                    placeholder="Liste des sous-traitants spécialisés requis"
                    value={formData.contractors?.specializedSubcontractors || ''}
                    onChange={(e) => {
                      const updatedContractors = { ...formData.contractors, specializedSubcontractors: e.target.value };
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
                    value={formData.contractors?.mainSuppliers || ''}
                    onChange={(e) => {
                      const updatedContractors = { ...formData.contractors, mainSuppliers: e.target.value };
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
                      Les contractants sélectionnés seront automatiquement liés aux garanties bancaires, 
                      certificats d'assurance et autres documents contractuels du projet.
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