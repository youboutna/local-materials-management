import React, { useState } from 'react';
import { Users, UserCheck, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface StakeholdersTeamStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  isEditing?: boolean;
}

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  organization: string;
  contact: string;
  responsibility: string;
  decisionLevel: string;
}

interface TeamMember {
  id: string;
  name: string;
  position: string;
  skills: string[];
  contactInfo: string;
  availability: string;
  hourlyRate?: number;
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

  const stakeholderRoles = [
    'Maître d\'ouvrage',
    'Maître d\'œuvre', 
    'Architecte',
    'Bureau d\'études',
    'Contrôleur technique',
    'Coordinateur SPS',
    'Autorité réglementaire',
    'Collectivité locale',
    'Représentant usagers'
  ];

  const teamPositions = [
    'Chef de projet',
    'Ingénieur structure',
    'Ingénieur géotechnique',
    'Conducteur de travaux',
    'Chef d\'équipe',
    'Ouvrier spécialisé',
    'Technicien',
    'Responsable qualité',
    'Responsable sécurité'
  ];

  const addStakeholder = () => {
    if (newStakeholder.name && newStakeholder.role) {
      const stakeholder: Stakeholder = {
        id: Date.now().toString(),
        name: newStakeholder.name || '',
        role: newStakeholder.role || '',
        organization: newStakeholder.organization || '',
        contact: newStakeholder.contact || '',
        responsibility: newStakeholder.responsibility || '',
        decisionLevel: newStakeholder.decisionLevel || 'consultation'
      };
      
      const updatedStakeholders = [...stakeholders, stakeholder];
      setStakeholders(updatedStakeholders);
      onUpdate({ stakeholders: updatedStakeholders });
      setNewStakeholder({});
    }
  };

  const removeStakeholder = (id: string) => {
    const updatedStakeholders = stakeholders.filter(s => s.id !== id);
    setStakeholders(updatedStakeholders);
    onUpdate({ stakeholders: updatedStakeholders });
  };

  const addTeamMember = () => {
    if (newTeamMember.name && newTeamMember.position) {
      const member: TeamMember = {
        id: Date.now().toString(),
        name: newTeamMember.name || '',
        position: newTeamMember.position || '',
        skills: newTeamMember.skills || [],
        contactInfo: newTeamMember.contactInfo || '',
        availability: newTeamMember.availability || 'full-time',
        hourlyRate: newTeamMember.hourlyRate
      };
      
      const updatedTeamMembers = [...teamMembers, member];
      setTeamMembers(updatedTeamMembers);
      onUpdate({ teamMembers: updatedTeamMembers });
      setNewTeamMember({});
    }
  };

  const removeTeamMember = (id: string) => {
    const updatedTeamMembers = teamMembers.filter(m => m.id !== id);
    setTeamMembers(updatedTeamMembers);
    onUpdate({ teamMembers: updatedTeamMembers });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-green-500" />
          Parties Prenantes & Équipe Projet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stakeholders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stakeholders" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Parties Prenantes
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Équipe Interne
            </TabsTrigger>
            <TabsTrigger value="contractors" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Contractants
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stakeholders" className="space-y-6">
            {/* Project Manager Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Responsable de projet *</label>
                <Select 
                  value={formData.project_responsable_id || ''} 
                  onValueChange={(value) => onUpdate({ project_responsable_id: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner le responsable" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="user1">Jean Dupont</SelectItem>
                    <SelectItem value="user2">Marie Martin</SelectItem>
                    <SelectItem value="user3">Pierre Durand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maître d'œuvre principal</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nom de l'entreprise ou personne"
                  value={formData.main_contractor || ''}
                  onChange={(e) => onUpdate({ main_contractor: e.target.value })}
                />
              </div>
            </div>

            {/* Add New Stakeholder */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Ajouter une partie prenante</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nom complet"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newStakeholder.name || ''}
                  onChange={(e) => setNewStakeholder({...newStakeholder, name: e.target.value})}
                />
                <Select 
                  value={newStakeholder.role || ''} 
                  onValueChange={(value) => setNewStakeholder({...newStakeholder, role: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Rôle dans le projet" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {stakeholderRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  placeholder="Organisation"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newStakeholder.organization || ''}
                  onChange={(e) => setNewStakeholder({...newStakeholder, organization: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Contact (email/téléphone)"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newStakeholder.contact || ''}
                  onChange={(e) => setNewStakeholder({...newStakeholder, contact: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea
                  placeholder="Responsabilités principales"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newStakeholder.responsibility || ''}
                  onChange={(e) => setNewStakeholder({...newStakeholder, responsibility: e.target.value})}
                />
                <Select 
                  value={newStakeholder.decisionLevel || ''} 
                  onValueChange={(value) => setNewStakeholder({...newStakeholder, decisionLevel: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Niveau de décision" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="decision">Décisionnaire</SelectItem>
                    <SelectItem value="approval">Approbation</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="information">Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addStakeholder} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter la partie prenante
              </Button>
            </div>

            {/* Stakeholders List */}
            <div className="space-y-3">
              {stakeholders.map((stakeholder) => (
                <div key={stakeholder.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium">{stakeholder.name}</h5>
                      <p className="text-sm text-muted-foreground">{stakeholder.role} - {stakeholder.organization}</p>
                      <p className="text-sm text-muted-foreground">Contact: {stakeholder.contact}</p>
                      <p className="text-sm">{stakeholder.responsibility}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeStakeholder(stakeholder.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            {/* Add New Team Member */}
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Ajouter un membre d'équipe</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nom complet"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newTeamMember.name || ''}
                  onChange={(e) => setNewTeamMember({...newTeamMember, name: e.target.value})}
                />
                <Select 
                  value={newTeamMember.position || ''} 
                  onValueChange={(value) => setNewTeamMember({...newTeamMember, position: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Poste/Fonction" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {teamPositions.map(position => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  placeholder="Contact (email/téléphone)"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newTeamMember.contactInfo || ''}
                  onChange={(e) => setNewTeamMember({...newTeamMember, contactInfo: e.target.value})}
                />
                <Select 
                  value={newTeamMember.availability || ''} 
                  onValueChange={(value) => setNewTeamMember({...newTeamMember, availability: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Disponibilité" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="full-time">Temps plein</SelectItem>
                    <SelectItem value="part-time">Temps partiel</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="seasonal">Saisonnier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Compétences (séparées par virgules)"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={Array.isArray(newTeamMember.skills) ? newTeamMember.skills.join(', ') : ''}
                  onChange={(e) => setNewTeamMember({
                    ...newTeamMember, 
                    skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                />
                <input
                  type="number"
                  placeholder="Taux horaire (€/h) - optionnel"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newTeamMember.hourlyRate || ''}
                  onChange={(e) => setNewTeamMember({...newTeamMember, hourlyRate: parseFloat(e.target.value)})}
                />
              </div>
              <Button onClick={addTeamMember} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter le membre d'équipe
              </Button>
            </div>

            {/* Team Members List */}
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium">{member.name}</h5>
                      <p className="text-sm text-muted-foreground">{member.position}</p>
                      <p className="text-sm text-muted-foreground">Contact: {member.contactInfo}</p>
                      <p className="text-sm">Compétences: {member.skills.join(', ')}</p>
                      <p className="text-sm">Disponibilité: {member.availability}</p>
                      {member.hourlyRate && <p className="text-sm font-medium">{member.hourlyRate}€/h</p>}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeTeamMember(member.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="contractors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bureau d'études / Ingénierie</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nom du bureau d'études"
                  value={formData.engineering_consultant || ''}
                  onChange={(e) => onUpdate({ engineering_consultant: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Entreprise générale</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nom de l'entreprise principale"
                  value={formData.general_contractor || ''}
                  onChange={(e) => onUpdate({ general_contractor: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sous-traitants spécialisés</label>
                <textarea 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                  placeholder="Liste des sous-traitants par spécialité"
                  value={formData.subcontractors || ''}
                  onChange={(e) => onUpdate({ subcontractors: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fournisseurs principaux</label>
                <textarea 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                  placeholder="Fournisseurs de matériaux et équipements"
                  value={formData.main_suppliers || ''}
                  onChange={(e) => onUpdate({ main_suppliers: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">Information contractuelle</h4>
              <p className="text-sm text-orange-700">
                Les informations sur les contractants seront utilisées pour la gestion des contrats, 
                des paiements et du suivi des performances. Assurez-vous de maintenir ces données à jour.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StakeholdersTeamStep;