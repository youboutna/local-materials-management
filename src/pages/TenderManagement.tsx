import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, FileText, Users, Calendar, Upload, Workflow } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TenderProjectFields from '@/components/projects/TenderProjectFields';
import ContractStatusDisplay from '@/components/projects/ContractStatusDisplay';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import PublicProcurementWorkflow from '@/components/tenders/PublicProcurementWorkflow';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Tender {
  id: string;
  title: string;
  description: string;
  project_id?: string;
  launch_date?: string;
  attribution_date?: string;
  selection_mode?: string;
  market_type?: string;
  financing_source?: string;
  project_reference?: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    title: string;
    status: string;
    location: string;
    start_date?: string;
    end_date?: string;
  };
  tender_suppliers?: {
    supplier: {
      id: string;
      name: string;
      contact_person?: string;
      email?: string;
    };
  }[];
}

const TenderManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    launch_date: '',
    attribution_date: '',
    selection_mode: '',
    market_type: '',
    financing_source: '',
    project_reference: '',
    status: 'draft' as 'draft' | 'published' | 'closed' | 'awarded'
  });
  const [selectedSuppliers, setSelectedSuppliers] = useState<any[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenders
  const { data: tenders, isLoading } = useQuery({
    queryKey: ['tenders'],
    queryFn: async (): Promise<Tender[]> => {
      const { data, error } = await supabase
        .from('tenders')
        .select(`
          *,
          project:projects(id, title, status, location, start_date, end_date),
          tender_suppliers(
            supplier:suppliers(id, name, contact_person, email)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Tender[] || [];
    },
  });

  // Fetch projects for selection
  const { data: projects } = useQuery({
    queryKey: ['projects-for-tender'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, status, location')
        .order('title');
      
      if (error) throw error;
      return data;
    },
  });

  // Create/Update tender mutation
  const tenderMutation = useMutation({
    mutationFn: async (tenderData: typeof formData) => {
      console.log('Submitting tender data:', tenderData);
      
      const dataToSubmit = {
        title: tenderData.title,
        description: tenderData.description,
        project_id: tenderData.project_id === 'new_project' ? null : (tenderData.project_id || null),
        launch_date: tenderData.launch_date || null,
        attribution_date: tenderData.attribution_date || null,
        selection_mode: tenderData.selection_mode || null,
        market_type: tenderData.market_type || null,
        financing_source: tenderData.financing_source || null,
        project_reference: tenderData.project_reference || null,
        status: tenderData.status
      };

      console.log('Data to submit:', dataToSubmit);

      if (editingTender) {
        const { data, error } = await supabase
          .from('tenders')
          .update(dataToSubmit)
          .eq('id', editingTender.id)
          .select()
          .single();
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        return data;
      } else {
        const { data, error } = await supabase
          .from('tenders')
          .insert([dataToSubmit])
          .select()
          .single();
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: (data) => {
      console.log('Tender operation successful:', data);
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast({
        title: editingTender ? 'Appel d\'offres modifié' : 'Appel d\'offres créé',
        description: 'L\'opération a été effectuée avec succès.',
      });
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Tender operation error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur s\'est produite lors de l\'opération.',
        variant: 'destructive',
      });
    },
  });

  // Delete tender mutation
  const deleteMutation = useMutation({
    mutationFn: async (tenderId: string) => {
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', tenderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      toast({
        title: 'Appel d\'offres supprimé',
        description: 'L\'appel d\'offres a été supprimé avec succès.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    // Basic validation
    if (!formData.title.trim()) {
      toast({
        title: 'Erreur de validation',
        description: 'Le titre est requis.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: 'Erreur de validation',
        description: 'La description est requise.',
        variant: 'destructive',
      });
      return;
    }

    tenderMutation.mutate(formData);
  };

  const handleEdit = (tender: Tender) => {
    setEditingTender(tender);
    setFormData({
      title: tender.title,
      description: tender.description,
      project_id: tender.project_id || '',
      launch_date: tender.launch_date || '',
      attribution_date: tender.attribution_date || '',
      selection_mode: tender.selection_mode || '',
      market_type: tender.market_type || '',
      financing_source: tender.financing_source || '',
      project_reference: tender.project_reference || '',
      status: tender.status
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTender(null);
    setFormData({
      title: '',
      description: '',
      project_id: '',
      launch_date: '',
      attribution_date: '',
      selection_mode: '',
      market_type: '',
      financing_source: '',
      project_reference: '',
      status: 'draft'
    });
    setSelectedSuppliers([]);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Brouillon', color: 'bg-gray-500' },
      published: { label: 'Publié', color: 'bg-blue-500' },
      closed: { label: 'Fermé', color: 'bg-orange-500' },
      awarded: { label: 'Attribué', color: 'bg-green-500' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>;
  };

  // Convert formData to TenderProjectFields format
  const getTenderProjectFieldsData = () => ({
    launchDate: formData.launch_date,
    attributionDate: formData.attribution_date,
    selectionMode: formData.selection_mode,
    marketType: formData.market_type,
    financingSource: formData.financing_source,
    projectReference: formData.project_reference,
  });

  const handleTenderProjectFieldsChange = (field: string, value: string) => {
    const fieldMapping: Record<string, string> = {
      launchDate: 'launch_date',
      attributionDate: 'attribution_date',
      selectionMode: 'selection_mode',
      marketType: 'market_type',
      financingSource: 'financing_source',
      projectReference: 'project_reference',
    };
    
    const mappedField = fieldMapping[field] || field;
    setFormData(prev => ({ ...prev, [mappedField]: value }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Appels d'Offres</h1>
          <p className="text-gray-600 mt-2">Gérer les appels d'offres, projets associés et soumissionnaires</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            asChild
          >
            <Link to="/tender-import">
              <Upload className="h-4 w-4 mr-2" />
              Importer Excel
            </Link>
          </Button>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            Nouvel Appel d'Offres
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tenders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tenders" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Appels d'Offres
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflow Officiel
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tenders" className="space-y-6">
          {/* Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTender ? 'Modifier l\'Appel d\'Offres' : 'Créer un Nouvel Appel d\'Offres'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de Base</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Titre de l'appel d'offres</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="project">Projet associé (optionnel)</Label>
                        <Select 
                          value={formData.project_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un projet existant ou créer un nouveau" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new_project">Nouveau projet (à créer)</SelectItem>
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.title} - {project.location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="status">Statut</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value: 'draft' | 'published' | 'closed' | 'awarded') => setFormData(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="published">Publié</SelectItem>
                            <SelectItem value="closed">Fermé</SelectItem>
                            <SelectItem value="awarded">Attribué</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tender Project Fields */}
                <TenderProjectFields
                  formData={getTenderProjectFieldsData()}
                  onChange={handleTenderProjectFieldsChange}
                />

                {/* Suppliers Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Soumissionnaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Les soumissionnaires seront gérés après la création de l'appel d'offres
                    </p>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={tenderMutation.isPending}>
                    {tenderMutation.isPending ? 'En cours...' : editingTender ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Tenders List */}
          <div className="grid gap-6">
            {tenders?.map((tender) => (
              <Card key={tender.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {tender.title}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{tender.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(tender.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(tender)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(tender.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>Créé le {format(new Date(tender.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                      </div>
                      
                      {tender.project && (
                        <div>
                          <h4 className="font-medium mb-2">Projet associé</h4>
                          <p className="text-sm text-gray-600">
                            {tender.project.title} - {tender.project.location}
                          </p>
                        </div>
                      )}
                      
                      {tender.launch_date && (
                        <div>
                          <h4 className="font-medium mb-1">Date de lancement</h4>
                          <p className="text-sm">{format(new Date(tender.launch_date), 'dd MMMM yyyy', { locale: fr })}</p>
                        </div>
                      )}
                    </div>
                    
                    {tender.project && (
                      <ContractStatusDisplay
                        project={{
                          launchDate: tender.launch_date,
                          attributionDate: tender.attribution_date,
                          startDate: tender.project.start_date || new Date().toISOString(),
                          endDate: tender.project.end_date,
                          status: tender.project.status,
                          marketType: tender.market_type,
                          selectionMode: tender.selection_mode,
                          financingSource: tender.financing_source,
                          projectReference: tender.project_reference
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tenders?.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun appel d'offres</h3>
                <p className="text-gray-600 mb-4">Commencez par créer votre premier appel d'offres.</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  Créer un Appel d'Offres
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="workflow">
          <PublicProcurementWorkflow />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenderManagement;
