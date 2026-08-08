import { OrganizationHierarchyService } from '@/application/services/OrganizationHierarchyService';
import { OrganizationService } from '@/application/services/OrganizationService';
import { ProjectService } from '@/application/services/ProjectService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateOrganizationHierarchyDTO } from '@/dtos/entities/OrganizationHierarchyDTO';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { Building2, Plus, Trash2, Users } from 'lucide-react';
import React, { useState } from 'react';

interface OrganizationTemplate {
  id: string;
  name: string;
  positions: {
    title: string;
    department: string;
    category: string;
    level: number;
    parent?: string;
    permissions: {
      can_approve_projects: boolean;
      can_approve_payments: boolean;
      can_escalate_to_director: boolean;
    };
  }[];
}

const defaultOrganizationTemplate: OrganizationTemplate = {
  id: 'default',
  name: 'Organisation Standard BTP',
  positions: [
    {
      title: 'Directeur Général',
      department: 'Direction Générale',
      category: 'décisionnel',
      level: 1,
      permissions: { can_approve_projects: true, can_approve_payments: true, can_escalate_to_director: false }
    },
    {
      title: 'Conseiller chargé du Suivi des Activités et Performance',
      department: 'Conseillers',
      category: 'performance',
      level: 2,
      parent: 'Directeur Général',
      permissions: { can_approve_projects: false, can_approve_payments: false, can_escalate_to_director: true }
    },
    {
      title: 'Conseiller chargé de la Communication et Coopération',
      department: 'Conseillers',
      category: 'communication',
      level: 2,
      parent: 'Directeur Général',
      permissions: { can_approve_projects: false, can_approve_payments: false, can_escalate_to_director: true }
    },
    {
      title: 'Conseiller Juridique',
      department: 'Conseillers',
      category: 'contractuel',
      level: 2,
      parent: 'Directeur Général',
      permissions: { can_approve_projects: false, can_approve_payments: false, can_escalate_to_director: true }
    },
    {
      title: 'Directeur de la Production et de la Commercialisation',
      department: 'Production et Commercialisation',
      category: 'opérationnel',
      level: 2,
      parent: 'Directeur Général',
      permissions: { can_approve_projects: true, can_approve_payments: true, can_escalate_to_director: true }
    },
    {
      title: 'Directeur des Études et des Travaux',
      department: 'Études et Travaux',
      category: 'technique',
      level: 2,
      parent: 'Directeur Général',
      permissions: { can_approve_projects: true, can_approve_payments: true, can_escalate_to_director: true }
    },
    {
      title: 'Directeur Financier',
      department: 'Finance',
      category: 'budgétaire',
      level: 2,
      parent: 'Directeur Général',
      permissions: { can_approve_projects: true, can_approve_payments: true, can_escalate_to_director: true }
    },
    {
      title: 'Chef de projet',
      department: 'Études et Travaux',
      category: 'technique',
      level: 3,
      parent: 'Directeur des Études et des Travaux',
      permissions: { can_approve_projects: false, can_approve_payments: false, can_escalate_to_director: false }
    },
    {
      title: 'Chef chantier',
      department: 'Études et Travaux',
      category: 'opérationnel',
      level: 3,
      parent: 'Directeur des Études et des Travaux',
      permissions: { can_approve_projects: false, can_approve_payments: false, can_escalate_to_director: false }
    },
    {
      title: 'Comptable',
      department: 'Finance',
      category: 'comptable',
      level: 3,
      parent: 'Directeur Financier',
      permissions: { can_approve_projects: false, can_approve_payments: false, can_escalate_to_director: false }
    },
    {
      title: 'Ingénieur Études',
      department: 'Études et Travaux',
      category: 'technique',
      level: 3,
      parent: 'Directeur des Études et des Travaux',
      permissions: { can_approve_projects: false, can_approve_payments: false, can_escalate_to_director: false }
    }
  ]
};

const categories = [
  'communication', 'décisionnel', 'technique', 'juridique', 'contractuel',
  'opérationnel', 'budgétaire', 'comptable', 'reporting', 'dossier personnel',
  'présence', 'performance', 'compétences', 'institutionnel', 'commercial',
  'contentieux', 'réglementaire', 'sauvegarde', 'infrastructure'
];

const OrganizationalHierarchyManager: React.FC = () => {
  const [template, setTemplate] = useState<OrganizationTemplate>(defaultOrganizationTemplate);
  const [newPosition, setNewPosition] = useState({
    title: '',
    department: '',
    category: '',
    level: 3,
    parent: '',
    permissions: { can_approve_projects: false, can_approve_payments: false, can_escalate_to_director: false }
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleAddPosition = () => {
    if (!newPosition.title || !newPosition.department || !newPosition.category) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setTemplate(prev => ({
      ...prev,
      positions: [...prev.positions, { ...newPosition }]
    }));

    setNewPosition({
      title: '',
      department: '',
      category: '',
      level: 3,
      parent: '',
      permissions: { can_approve_projects: false, can_approve_payments: false, can_escalate_to_director: false }
    });

    toast({
      title: "Position ajoutée",
      description: `${newPosition.title} a été ajouté à l'organigramme`
    });
  };

  const handleRemovePosition = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index)
    }));
    
    toast({
      title: "Position supprimée",
      description: "La position a été supprimée de l'organigramme"
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'décisionnel': 'bg-red-100 text-red-800',
      'technique': 'bg-blue-100 text-blue-800',
      'opérationnel': 'bg-green-100 text-green-800',
      'budgétaire': 'bg-purple-100 text-purple-800',
      'communication': 'bg-orange-100 text-orange-800',
      'contractuel': 'bg-indigo-100 text-indigo-800',
      'comptable': 'bg-pink-100 text-pink-800',
      'performance': 'bg-teal-100 text-teal-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleSaveTemplate = async () => {
    if (template.positions.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez au moins une position avant d'enregistrer", variant: "destructive" });
      return;
    }

    const positionTitles = new Set<string>();
    for (const position of template.positions) {
      const normalizedTitle = position.title.trim().toLocaleLowerCase();
      if (!normalizedTitle) {
        toast({ title: "Erreur", description: "Chaque position doit avoir un titre", variant: "destructive" });
        return;
      }
      if (positionTitles.has(normalizedTitle)) {
        toast({ title: "Erreur", description: `Le titre « ${position.title} » est utilisé plusieurs fois`, variant: "destructive" });
        return;
      }
      positionTitles.add(normalizedTitle);
      if (position.parent && !positionTitles.has(position.parent.trim().toLocaleLowerCase()) &&
        !template.positions.some((candidate) => candidate.title.trim().toLocaleLowerCase() === position.parent?.trim().toLocaleLowerCase())) {
        toast({ title: "Erreur", description: `Supérieur hiérarchique introuvable : ${position.parent}`, variant: "destructive" });
        return;
      }
      if (position.parent?.trim().toLocaleLowerCase() === normalizedTitle) {
        toast({ title: "Erreur", description: `Une position ne peut pas être son propre supérieur : ${position.title}`, variant: "destructive" });
        return;
      }
    }

    setIsSaving(true);
    try {
      const organizationService = getOrganizationService();
      const hierarchyService = getOrganizationHierarchyService();
      const projectService = getProjectService();
      const organization = await organizationService.upsert({
        name: template.name,
        code: 'DEFAULT_BTP',
        externalRef: 'ORG-DEFAULT-BTP',
        orgType: 'owner',
        description: 'Organisation propriétaire par défaut des projets',
        isActive: true,
      });

      const positionIds = new Map<string, string>();
      const pending = [...template.positions];
      const hierarchyNodes: CreateOrganizationHierarchyDTO[] = [];

      while (pending.length > 0) {
        const position = pending.shift();
        if (!position) break;
        const positionKey = position.title.trim().toLocaleLowerCase();
        const parentKey = position.parent?.trim().toLocaleLowerCase();
        if (parentKey && !positionIds.has(parentKey)) {
          pending.push(position);
          if (pending.every((candidate) => {
            const candidateParentKey = candidate.parent?.trim().toLocaleLowerCase();
            return !!candidateParentKey && !positionIds.has(candidateParentKey);
          })) {
            throw new Error(`Supérieur hiérarchique introuvable : ${position.parent}`);
          }
          continue;
        }

        const nodeId = crypto.randomUUID();
        positionIds.set(positionKey, nodeId);
        hierarchyNodes.push({
          id: nodeId,
          organizationId: organization.id,
          parentId: parentKey ? positionIds.get(parentKey) : undefined,
          department: position.department,
          positionTitle: position.title,
          level: position.level,
          canApproveProjects: position.permissions.can_approve_projects,
          canApprovePayments: position.permissions.can_approve_payments,
          canEscalateToDirector: position.permissions.can_escalate_to_director,
          directReportsCount: 0,
        });
      }

      hierarchyNodes.forEach((node) => {
        if (node.parentId) {
          const parent = hierarchyNodes.find((candidate) => candidate.id === node.parentId);
          if (parent) parent.directReportsCount = (parent.directReportsCount ?? 0) + 1;
        }
      });

      await hierarchyService.replaceForOrganization(organization.id, hierarchyNodes);
      const projectsUpdated = await projectService.assignOrganizationToAll(organization.id);

      toast({
        title: "Organigramme sauvegardé",
        description: `${hierarchyNodes.length} positions enregistrées et ${projectsUpdated} projets rattachés à ${organization.name}`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la sauvegarde de l'organigramme",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion de l'Organigramme</h2>
          <p className="text-muted-foreground">
            Configurez la structure organisationnelle de votre entreprise
          </p>
        </div>
        <Button onClick={handleSaveTemplate} disabled={isSaving} className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {isSaving ? 'Sauvegarde...' : "Sauvegarder l'Organigramme"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New Position */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Ajouter une Position
            </CardTitle>
            <CardDescription>
              Définissez un nouveau poste dans l'organigramme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre du poste *</Label>
                <Input
                  id="title"
                  value={newPosition.title}
                  onChange={(e) => setNewPosition(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Chef de projet"
                />
              </div>
              <div>
                <Label htmlFor="department">Département *</Label>
                <Input
                  id="department"
                  value={newPosition.department}
                  onChange={(e) => setNewPosition(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Ex: Études et Travaux"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={newPosition.category}
                  onValueChange={(value) => setNewPosition(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="level">Niveau hiérarchique</Label>
                <Select
                  value={newPosition.level.toString()}
                  onValueChange={(value) => setNewPosition(prev => ({ ...prev, level: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Direction</SelectItem>
                    <SelectItem value="2">2 - Management</SelectItem>
                    <SelectItem value="3">3 - Opérationnel</SelectItem>
                    <SelectItem value="4">4 - Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="parent">Supérieur hiérarchique</Label>
              <Select
                value={newPosition.parent}
                onValueChange={(value) => setNewPosition(prev => ({ ...prev, parent: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un supérieur" />
                </SelectTrigger>
                <SelectContent>
                  {template.positions.map((pos, index) => (
                    <SelectItem key={index} value={pos.title}>{pos.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Autorisations</Label>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newPosition.permissions.can_approve_projects}
                    onChange={(e) => setNewPosition(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, can_approve_projects: e.target.checked }
                    }))}
                  />
                  <span>Approuver projets</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newPosition.permissions.can_approve_payments}
                    onChange={(e) => setNewPosition(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, can_approve_payments: e.target.checked }
                    }))}
                  />
                  <span>Approuver paiements</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newPosition.permissions.can_escalate_to_director}
                    onChange={(e) => setNewPosition(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, can_escalate_to_director: e.target.checked }
                    }))}
                  />
                  <span>Escalader au directeur</span>
                </label>
              </div>
            </div>

            <Button onClick={handleAddPosition} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la Position
            </Button>
          </CardContent>
        </Card>

        {/* Current Organization Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Structure Actuelle
            </CardTitle>
            <CardDescription>
              {template.positions.length} positions définies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {template.positions.map((position, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{position.title}</span>
                      <Badge className={`text-xs ${getCategoryColor(position.category)}`}>
                        {position.category}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {position.department} • Niveau {position.level}
                      {position.parent && ` • Sous ${position.parent}`}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {position.permissions.can_approve_projects && (
                        <Badge variant="outline" className="text-xs">Projets</Badge>
                      )}
                      {position.permissions.can_approve_payments && (
                        <Badge variant="outline" className="text-xs">Paiements</Badge>
                      )}
                      {position.permissions.can_escalate_to_director && (
                        <Badge variant="outline" className="text-xs">Escalade</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePosition(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationalHierarchyManager;