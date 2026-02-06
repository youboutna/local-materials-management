import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Calculator, 
  Users,
  Download,
  Eye
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/hexagonal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TenderEvaluationPanelProps {
  tenderId: string;
  onEvaluationUpdate?: () => void;
  verifiedSubmissions?: string[];
}

interface Submission {
  id: string;
  user_id: string;
  tender_id: string;
  supplier_name: string;
  supplier_email: string;
  submission_date: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  administrative_score?: number;
  technical_score?: number;
  financial_score?: number;
  total_score?: number;
  evaluator_notes?: string;
  reviewer_id?: string;
  reviewed_at?: string;
  submission_documents?: {
    id: string;
    category: 'administrative' | 'technical' | 'financial';
    subcategory?: string;
    document: {
      id: string;
      title: string;
      file_url: string;
      file_name: string;
    };
  }[];
}

const TenderEvaluationPanel: React.FC<TenderEvaluationPanelProps> = ({ 
  tenderId, 
  onEvaluationUpdate, 
  verifiedSubmissions 
}) => {
  const { toast } = useToast();
  const { getUser } = useAuth();
  const [activeTab, setActiveTab] = useState('administrative');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  // Fetch tender submissions grouped by bidder
  const { data: submissions, isLoading, refetch } = useQuery({
    queryKey: ['tender-submissions', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_submissions')
        .select(`
          *,
          submission_documents:tender_submission_documents(
            *,
            document:documents(*)
          )
        `)
        .eq('tender_id', tenderId)
        .order('submission_date', { ascending: false });

      if (error) throw error;
      return data as Submission[];
    },
    enabled: !!tenderId
  });

  const updateEvaluation = async (
    submissionId: string, 
    field: string, 
    value: any
  ) => {
    try {
      const updateData: any = { [field]: value };
      
      if (field === 'status' && value !== 'submitted') {
        const currentUser = await supabase.auth.getUser();
        if (currentUser.data?.user?.id) {
          updateData.reviewer_id = currentUser.data.user.id;
        }
        updateData.reviewed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tender_submissions')
        .update(updateData)
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Évaluation mise à jour",
        description: "Les modifications ont été sauvegardées avec succès."
      });

      refetch();
      onEvaluationUpdate?.();
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'under_review': return <Eye className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des soumissions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune soumission</h3>
          <p className="text-muted-foreground">
            Aucune soumission n'a encore été reçue pour cet appel d'offres.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Sidebar - Submissions List */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Soumissions ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full overflow-y-auto">
            <div className="space-y-3">
              {submissions
                .filter(sub => !verifiedSubmissions || verifiedSubmissions.length === 0 || verifiedSubmissions.includes(sub.id))
                .map((submission) => (
                <div
                  key={submission.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedSubmission === submission.id 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedSubmission(submission.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{submission.supplier_name}</h4>
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusIcon(submission.status)}
                        <span className="ml-1 text-xs">
                          {submission.status === 'submitted' && 'Soumise'}
                          {submission.status === 'under_review' && 'En cours'}
                          {submission.status === 'approved' && 'Approuvée'}
                          {submission.status === 'rejected' && 'Rejetée'}
                        </span>
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{submission.supplier_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(submission.submission_date).toLocaleDateString('fr-FR')}
                    </p>
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        {submission.submission_documents?.length || 0} docs
                      </span>
                      {submission.total_score && (
                        <Badge variant="outline">
                          {submission.total_score}/100
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Evaluation Panel */}
      <div className="lg:col-span-2">
        {selectedSubmission ? (
          <Card className="h-full">
            <CardHeader className="border-b">
              <CardTitle>
                Évaluation - {submissions.find(s => s.id === selectedSubmission)?.supplier_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="administrative">Administrative</TabsTrigger>
                  <TabsTrigger value="technical">Technique</TabsTrigger>
                  <TabsTrigger value="financial">Financière</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="administrative" className="h-full">
                    <AdministrativeEvaluation
                      submission={submissions.find(s => s.id === selectedSubmission)!}
                      onUpdate={updateEvaluation}
                    />
                  </TabsContent>

                  <TabsContent value="technical" className="h-full">
                    <TechnicalEvaluation
                      submission={submissions.find(s => s.id === selectedSubmission)!}
                      onUpdate={updateEvaluation}
                    />
                  </TabsContent>

                  <TabsContent value="financial" className="h-full">
                    <FinancialEvaluation
                      submission={submissions.find(s => s.id === selectedSubmission)!}
                      onUpdate={updateEvaluation}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full">
            <CardContent className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Sélectionnez une soumission</h3>
              <p className="text-muted-foreground max-w-md">
                Choisissez une soumission dans la liste de gauche pour commencer l'évaluation.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Administrative Evaluation Component
const AdministrativeEvaluation: React.FC<{
  submission: Submission;
  onUpdate: (id: string, field: string, value: any) => void;
}> = ({ submission, onUpdate }) => {
  const [notes, setNotes] = useState(submission.evaluator_notes || '');

  console.log("submission.submission_documents");
  console.log(submission.submission_documents);

  const adminDocuments = submission.submission_documents?.filter(doc => (doc.category === 'administrative'||doc.category === 'financial' )) || [];
  const requiredDocs = [
    'Garantie de soumission',
    'Attestation fiscale',
    'Attestation de régularité sociale',
    'Copie du registre de commerce',
    'Pouvoir du signataire',
    'Devis quantitatif estimatif'
  ];

  const completionRate = Math.min((adminDocuments.length / requiredDocs.length) * 100, 100);
  const isComplete = adminDocuments.length >= requiredDocs.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Vérification Administrative</h3>
        <Badge className={isComplete ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {isComplete ? 'Recevable' : 'Non Recevable'}
        </Badge>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Documents Requis</h4>
          <div className="space-y-2">
            {requiredDocs.map((doc, index) => {
              const hasDoc = index < adminDocuments.length;
              return (
                <div key={index} className="flex items-center justify-between">
                  <span>{doc}</span>
                  {hasDoc ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              );
            })}
            
            {adminDocuments.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="font-medium mb-2">Documents soumis:</h5>
                {adminDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm">{doc.document.title}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.document.file_url, '_blank')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Taux de Complétude</span>
              <span className="font-bold">{completionRate.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Label htmlFor="admin-notes">Notes d'Évaluation</Label>
          <Textarea
            id="admin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2"
            rows={4}
            placeholder="Ajouter des commentaires sur la recevabilité administrative..."
          />
          <Button
            onClick={() => onUpdate(submission.id, 'evaluator_notes', notes)}
            className="mt-2"
            size="sm"
          >
            Sauvegarder les Notes
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onUpdate(submission.id, 'status', 'approved')}
            className="flex-1"
            variant={submission.status === 'approved' ? 'default' : 'outline'}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Déclarer Recevable
          </Button>
          <Button
            onClick={() => onUpdate(submission.id, 'status', 'rejected')}
            className="flex-1"
            variant={submission.status === 'rejected' ? 'destructive' : 'outline'}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Déclarer Non Recevable
          </Button>
        </div>
      </div>
    </div>
  );
};

// Technical Evaluation Component
const TechnicalEvaluation: React.FC<{
  submission: Submission;
  onUpdate: (id: string, field: string, value: any) => void;
}> = ({ submission, onUpdate }) => {
  const [score, setScore] = useState(submission.technical_score || 0);
  const [notes, setNotes] = useState(submission.evaluator_notes || '');

  const criteria = [
    { name: 'Expérience et références', weight: 30 },
    { name: 'Qualification du personnel', weight: 25 },
    { name: 'Méthodologie proposée', weight: 25 },
    { name: 'Planning et organisation', weight: 20 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Évaluation Technique</h3>
        <Badge variant="outline">
          Score: {score}/100
        </Badge>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Critères d'Évaluation</h4>
          <div className="space-y-3">
            {criteria.map((criterion, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded">
                <div>
                  <span className="font-medium">{criterion.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    (Poids: {criterion.weight}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Score:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-16 px-2 py-1 border rounded text-center"
                    placeholder="0"
                  />
                  <span className="text-sm">/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Label htmlFor="tech-score">Score Technique Total</Label>
          <div className="flex items-center gap-2 mt-2">
            <input
              id="tech-score"
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="flex-1 px-3 py-2 border rounded"
            />
            <span>/100</span>
            <Button
              onClick={() => onUpdate(submission.id, 'technical_score', score)}
              size="sm"
            >
              Sauvegarder
            </Button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Label htmlFor="tech-notes">Commentaires Techniques</Label>
          <Textarea
            id="tech-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2"
            rows={4}
            placeholder="Évaluation détaillée des aspects techniques..."
          />
          <Button
            onClick={() => onUpdate(submission.id, 'evaluator_notes', notes)}
            className="mt-2"
            size="sm"
          >
            Sauvegarder les Commentaires
          </Button>
        </div>
      </div>
    </div>
  );
};

// Financial Evaluation Component
const FinancialEvaluation: React.FC<{
  submission: Submission;
  onUpdate: (id: string, field: string, value: any) => void;
}> = ({ submission, onUpdate }) => {
  const [score, setScore] = useState(submission.financial_score || 0);
  const [notes, setNotes] = useState(submission.evaluator_notes || '');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Évaluation Financière</h3>
        <Badge variant="outline">
          <Calculator className="h-4 w-4 mr-1" />
          Score: {score}/100
        </Badge>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Documents Financiers</h4>
          <div className="space-y-2">
            {(submission.submission_documents?.filter(doc => doc.category === 'financial') || []).map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span>{doc.document.title}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(doc.document.file_url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Analyse Financière</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Montant Total Proposé</Label>
              <input
                type="number"
                className="w-full mt-1 px-3 py-2 border rounded"
                placeholder="0"
              />
            </div>
            <div>
              <Label>Délai de Paiement</Label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded"
                placeholder="Ex: 30 jours"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Label htmlFor="financial-score">Note Financière</Label>
          <div className="flex items-center gap-2 mt-2">
            <input
              id="financial-score"
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="flex-1 px-3 py-2 border rounded"
            />
            <span>/100</span>
            <Button
              onClick={() => onUpdate(submission.id, 'financial_score', score)}
              size="sm"
            >
              Sauvegarder
            </Button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Label htmlFor="financial-notes">Commentaires Financiers</Label>
          <Textarea
            id="financial-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2"
            rows={4}
            placeholder="Analyse de l'offre financière..."
          />
          <Button
            onClick={() => onUpdate(submission.id, 'evaluator_notes', notes)}
            className="mt-2"
            size="sm"
          >
            Sauvegarder les Commentaires
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TenderEvaluationPanel;