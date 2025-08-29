import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, AlertCircle, MessageSquare, FileText, User, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  TenderDocumentStatus, 
  TenderDocumentWithDetails,
  TENDER_DOCUMENT_LABELS,
  TENDER_CATEGORY_LABELS 
} from '@/types/tender';

interface TenderDocumentEvaluationPanelProps {
  tenderId: string;
  projectId?: string;
}

interface DocumentSubmission {
  id: string;
  tender_id: string;
  supplier_id: string;
  document_id: string;
  submission_date: string;
  status: TenderDocumentStatus;
  reviewer_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  supplier?: {
    name: string;
    contact_person?: string;
    email?: string;
  };
  document?: {
    id: string;
    title: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
  };
  tender_document?: {
    category: string;
    subcategory: string;
    is_required: boolean;
  };
}

const TenderDocumentEvaluationPanel = ({ tenderId, projectId }: TenderDocumentEvaluationPanelProps) => {
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<TenderDocumentStatus>('pending');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch document submissions for evaluation
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['tender-document-submissions', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_document_submissions')
        .select(`
          *,
          supplier:suppliers(name, contact_person, email),
          document:documents(id, title, file_url, file_name, file_size, mime_type),
          tender_document:tender_documents(category, subcategory, is_required)
        `)
        .eq('tender_id', tenderId)
        .order('submission_date', { ascending: false });

      if (error) throw error;
      return (data || []) as DocumentSubmission[];
    }
  });

  // Review submission mutation
  const reviewSubmissionMutation = useMutation({
    mutationFn: async ({ 
      submissionId, 
      status, 
      notes 
    }: { 
      submissionId: string; 
      status: TenderDocumentStatus; 
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('tender_document_submissions')
        .update({
          status,
          reviewer_notes: notes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      // Create notification for supplier
      if (status !== 'pending') {
        await supabase
          .from('notifications')
          .insert({
            title: `Document ${status === 'approved' ? 'approuvé' : 'rejeté'}`,
            message: `Votre document a été ${status === 'approved' ? 'approuvé' : 'rejeté'}: ${notes}`,
            type: 'document_review',
            recipient_id: data.supplier_id,
            metadata: {
              tender_id: tenderId,
              submission_id: submissionId,
              status
            }
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-document-submissions', tenderId] });
      setSelectedSubmission(null);
      setReviewNotes('');
      setReviewStatus('pending');
      toast({
        title: 'Évaluation enregistrée',
        description: 'L\'évaluation du document a été enregistrée avec succès.',
      });
    },
    onError: (error) => {
      console.error('Review submission error:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'enregistrement de l\'évaluation.',
        variant: 'destructive',
      });
    }
  });

  const getStatusIcon = (status: TenderDocumentStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'requires_revision':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: TenderDocumentStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'requires_revision':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReviewSubmission = () => {
    if (!selectedSubmission || !reviewStatus || reviewStatus === 'pending') {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un statut de révision.',
        variant: 'destructive',
      });
      return;
    }

    reviewSubmissionMutation.mutate({
      submissionId: selectedSubmission.id,
      status: reviewStatus,
      notes: reviewNotes
    });
  };

  const handleViewDocument = (submission: DocumentSubmission) => {
    if (submission.document?.file_url) {
      window.open(submission.document.file_url, '_blank');
    }
  };

  const filteredSubmissions = submissions?.filter(submission => {
    if (activeFilter === 'all') return true;
    return submission.status === activeFilter;
  }) || [];

  const pendingCount = submissions?.filter(s => s.status === 'pending').length || 0;
  const approvedCount = submissions?.filter(s => s.status === 'approved').length || 0;
  const rejectedCount = submissions?.filter(s => s.status === 'rejected').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{submissions?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approuvés</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejetés</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter buttons */}
      <div className="flex gap-2">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('all')}
        >
          Tous ({submissions?.length || 0})
        </Button>
        <Button
          variant={activeFilter === 'pending' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('pending')}
        >
          En attente ({pendingCount})
        </Button>
        <Button
          variant={activeFilter === 'approved' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('approved')}
        >
          Approuvés ({approvedCount})
        </Button>
        <Button
          variant={activeFilter === 'rejected' ? 'default' : 'outline'}
          onClick={() => setActiveFilter('rejected')}
        >
          Rejetés ({rejectedCount})
        </Button>
      </div>

      {/* Submissions list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Documents soumis</h3>
          {filteredSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Aucun document trouvé pour ce filtre.</p>
              </CardContent>
            </Card>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card 
                key={submission.id} 
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedSubmission?.id === submission.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedSubmission(submission)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      <Badge className={getStatusColor(submission.status)}>
                        {submission.status === 'pending' ? 'En attente' :
                         submission.status === 'approved' ? 'Approuvé' :
                         submission.status === 'rejected' ? 'Rejeté' : 'Révision requise'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(submission);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{submission.supplier?.name}</span>
                    </div>
                    
                    <div>
                      <p className="font-medium text-sm">{submission.document?.title}</p>
                      <p className="text-xs text-gray-600">
                        {TENDER_CATEGORY_LABELS[submission.tender_document?.category as keyof typeof TENDER_CATEGORY_LABELS]} - 
                        {TENDER_DOCUMENT_LABELS[submission.tender_document?.subcategory as keyof typeof TENDER_DOCUMENT_LABELS]}
                      </p>
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      Soumis le {new Date(submission.submission_date).toLocaleDateString()}
                    </p>
                    
                    {submission.reviewer_notes && (
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <p className="font-medium">Notes de révision:</p>
                        <p>{submission.reviewer_notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Review panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Panneau d'évaluation</h3>
          {selectedSubmission ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Évaluer le document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{selectedSubmission.document?.title}</p>
                  <p className="text-sm text-gray-600">
                    Fournisseur: {selectedSubmission.supplier?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: {selectedSubmission.supplier?.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Statut d'évaluation
                  </label>
                  <Select value={reviewStatus} onValueChange={(value) => setReviewStatus(value as TenderDocumentStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                      <SelectItem value="requires_revision">Révision requise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes de révision
                  </label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Ajoutez vos commentaires sur le document..."
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleReviewSubmission}
                  disabled={reviewSubmissionMutation.isPending}
                  className="w-full"
                >
                  {reviewSubmissionMutation.isPending ? 'Enregistrement...' : 'Enregistrer l\'évaluation'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Sélectionnez un document à évaluer
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenderDocumentEvaluationPanel;