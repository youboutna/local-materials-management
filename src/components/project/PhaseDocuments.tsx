import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Upload, Download, Eye, Trash2 } from 'lucide-react';

interface PhaseDocumentsProps {
  phaseId: string;
  projectId: string;
}

interface DocumentFormData {
  title: string;
  description: string;
  document_type: string;
  file_url: string;
  file_name: string;
}

const PhaseDocuments: React.FC<PhaseDocumentsProps> = ({ phaseId, projectId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    description: '',
    document_type: 'plan',
    file_url: '',
    file_name: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ['phase-documents', phaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (docData: DocumentFormData) => {
      const user = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: docData.title,
          description: docData.description,
          document_type: docData.document_type as any,
          file_url: docData.file_url,
          file_name: docData.file_name,
          project_id: projectId,
          phase_id: phaseId,
          uploaded_by: user.data.user?.id,
          status: 'draft' as any,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-documents', phaseId] });
      setIsAdding(false);
      resetForm();
      toast({ title: 'Document ajouté avec succès' });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-documents', phaseId] });
      toast({ title: 'Document supprimé avec succès' });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      document_type: 'plan',
      file_url: '',
      file_name: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDocumentMutation.mutate(formData);
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      plan: 'Plan',
      contract: 'Contrat',
      inspection_report: 'Rapport d\'inspection',
      invoice: 'Facture',
      permit: 'Permis',
      photo: 'Photo',
      other: 'Autre',
    };
    return types[type] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      plan: 'bg-blue-100 text-blue-800',
      contract: 'bg-green-100 text-green-800',
      inspection_report: 'bg-orange-100 text-orange-800',
      invoice: 'bg-purple-100 text-purple-800',
      permit: 'bg-yellow-100 text-yellow-800',
      photo: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement des documents...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents de la phase ({documents?.length || 0})
          </CardTitle>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un document à la phase</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titre du document *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="document_type">Type de document</Label>
                    <Select
                      value={formData.document_type}
                      onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plan">Plan</SelectItem>
                        <SelectItem value="contract">Contrat</SelectItem>
                        <SelectItem value="inspection_report">Rapport d'inspection</SelectItem>
                        <SelectItem value="invoice">Facture</SelectItem>
                        <SelectItem value="permit">Permis</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez le contenu du document..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="file_url">URL du fichier</Label>
                    <Input
                      id="file_url"
                      type="url"
                      value={formData.file_url}
                      onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="file_name">Nom du fichier</Label>
                    <Input
                      id="file_name"
                      value={formData.file_name}
                      onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
                      placeholder="document.pdf"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Ajouter</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {documents && documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                    )}
                    {doc.file_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fichier: {doc.file_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {doc.file_url && (
                      <>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={doc.file_url} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteDocumentMutation.mutate(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge className={getDocumentTypeColor(doc.document_type)}>
                    {getDocumentTypeLabel(doc.document_type)}
                  </Badge>
                  <Badge variant="outline">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Date inconnue'}
                  </Badge>
                  {doc.status && (
                    <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                      {doc.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun document assigné à cette phase.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseDocuments;