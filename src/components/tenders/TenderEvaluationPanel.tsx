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
import { useAuth } from '@/hooks/hexagonal';
import { useTenderEvaluationHex, TenderSubmission } from '@/hooks/hexagonal/useTenderEvaluationHex';
import { DEFAULT_EVALUATION_CRITERIA } from '@/config/referentials/tender/evaluation-criteria.referential';
import { TENDER_REQUIRED_ADMINISTRATIVE_DOCUMENTS } from '@/config/referentials/tender/document-categories.referential';
import { T } from '@/components/i18n/T';

interface TenderEvaluationPanelProps {
  tenderId: string;
  onEvaluationUpdate?: () => void;
  verifiedSubmissions?: string[];
}

type Submission = TenderSubmission;

const TenderEvaluationPanel: React.FC<TenderEvaluationPanelProps> = ({ 
  tenderId, 
  onEvaluationUpdate, 
  verifiedSubmissions 
}) => {
  const { getUser } = useAuth();
  const [activeTab, setActiveTab] = useState('administrative');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  // Fetch tender submissions grouped by bidder via hexagonal hook
  const { submissions, isLoading, updateEvaluation: updateEvaluationHex } = useTenderEvaluationHex(tenderId);

  const updateEvaluation = async (
    submissionId: string,
    field: string,
    value: any
  ) => {
    try {
      await updateEvaluationHex({ submissionId, field, value });
      onEvaluationUpdate?.();
    } catch (error) {
      console.error('Error updating evaluation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-primary/10 text-primary';
      case 'under_review': return 'bg-warning/10 text-warning';
      case 'approved': return 'bg-success-soft text-success';
      case 'rejected': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-foreground';
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
            <p className="text-muted-foreground"><T k="auto.tenderevaluationpanel.chargement_des_soumissions" fallback="Chargement des soumissions..." /></p>
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
          <h3 className="text-lg font-medium mb-2"><T k="auto.tenderevaluationpanel.aucune_soumission" fallback="Aucune soumission" /></h3>
          <p className="text-muted-foreground">
            <T k="auto.tenderevaluationpanel.aucune_soumission_n_a_encore_ete_recue_pour_cet_" fallback="Aucune soumission n'a encore été reçue pour cet appel d'offres." />
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
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-3 mb-4">
                  <TabsTrigger value="administrative"><T k="auto.tenderevaluationpanel.administrative" fallback="Administrative" /></TabsTrigger>
                  <TabsTrigger value="technical"><T k="auto.tenderevaluationpanel.technique" fallback="Technique" /></TabsTrigger>
                  <TabsTrigger value="financial"><T k="auto.tenderevaluationpanel.financiere" fallback="Financière" /></TabsTrigger>
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
              <h3 className="text-lg font-medium mb-2"><T k="auto.tenderevaluationpanel.selectionnez_une_soumission" fallback="Sélectionnez une soumission" /></h3>
              <p className="text-muted-foreground max-w-md">
                <T k="auto.tenderevaluationpanel.choisissez_une_soumission_dans_la_liste_de_gauch" fallback="Choisissez une soumission dans la liste de gauche pour commencer l'évaluation." />
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
  const requiredDocs = TENDER_REQUIRED_ADMINISTRATIVE_DOCUMENTS.map(d => d.label);

  const completionRate = Math.min((adminDocuments.length / requiredDocs.length) * 100, 100);
  const isComplete = adminDocuments.length >= requiredDocs.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium"><T k="auto.tenderevaluationpanel.verification_administrative" fallback="Vérification Administrative" /></h3>
        <Badge className={isComplete ? 'bg-success-soft text-success' : 'bg-destructive/10 text-destructive'}>
          {isComplete ? 'Recevable' : 'Non Recevable'}
        </Badge>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3"><T k="auto.tenderevaluationpanel.documents_requis" fallback="Documents Requis" /></h4>
          <div className="space-y-2">
            {requiredDocs.map((doc, index) => {
              const hasDoc = index < adminDocuments.length;
              return (
                <div key={index} className="flex items-center justify-between">
                  <span>{doc}</span>
                  {hasDoc ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              );
            })}
            
            {adminDocuments.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="font-medium mb-2"><T k="auto.tenderevaluationpanel.documents_soumis" fallback="Documents soumis:" /></h5>
                {adminDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm">{doc.document.title}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.document.file_url, '_blank')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      <T k="auto.tenderevaluationpanel.voir" fallback="Voir" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium"><T k="auto.tenderevaluationpanel.taux_de_completude" fallback="Taux de Complétude" /></span>
              <span className="font-bold">{completionRate.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Label htmlFor="admin-notes"><T k="auto.tenderevaluationpanel.notes_d_evaluation" fallback="Notes d'Évaluation" /></Label>
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
            <T k="auto.tenderevaluationpanel.sauvegarder_les_notes" fallback="Sauvegarder les Notes" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onUpdate(submission.id, 'status', 'approved')}
            className="flex-1"
            variant={submission.status === 'approved' ? 'default' : 'outline'}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            <T k="auto.tenderevaluationpanel.declarer_recevable" fallback="Déclarer Recevable" />
          </Button>
          <Button
            onClick={() => onUpdate(submission.id, 'status', 'rejected')}
            className="flex-1"
            variant={submission.status === 'rejected' ? 'destructive' : 'outline'}
          >
            <XCircle className="h-4 w-4 mr-2" />
            <T k="auto.tenderevaluationpanel.declarer_non_recevable" fallback="Déclarer Non Recevable" />
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

  const criteria = DEFAULT_EVALUATION_CRITERIA
    .filter(c => c.category === 'technical')
    .map(c => ({ name: c.label, weight: c.weight }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium"><T k="auto.tenderevaluationpanel.evaluation_technique" fallback="Évaluation Technique" /></h3>
        <Badge variant="outline">
          Score: {score}/100
        </Badge>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3"><T k="auto.tenderevaluationpanel.criteres_d_evaluation" fallback="Critères d'Évaluation" /></h4>
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
                  <span className="text-sm"><T k="auto.tenderevaluationpanel.score" fallback="Score:" /></span>
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
          <Label htmlFor="tech-score"><T k="auto.tenderevaluationpanel.score_technique_total" fallback="Score Technique Total" /></Label>
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
              <T k="auto.tenderevaluationpanel.sauvegarder" fallback="Sauvegarder" />
            </Button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Label htmlFor="tech-notes"><T k="auto.tenderevaluationpanel.commentaires_techniques" fallback="Commentaires Techniques" /></Label>
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
            <T k="auto.tenderevaluationpanel.sauvegarder_les_commentaires" fallback="Sauvegarder les Commentaires" />
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
        <h3 className="text-lg font-medium"><T k="auto.tenderevaluationpanel.evaluation_financiere" fallback="Évaluation Financière" /></h3>
        <Badge variant="outline">
          <Calculator className="h-4 w-4 mr-1" />
          Score: {score}/100
        </Badge>
      </div>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3"><T k="auto.tenderevaluationpanel.documents_financiers" fallback="Documents Financiers" /></h4>
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
                  <T k="auto.tenderevaluationpanel.telecharger" fallback="Télécharger" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3"><T k="auto.tenderevaluationpanel.analyse_financiere" fallback="Analyse Financière" /></h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label><T k="auto.tenderevaluationpanel.montant_total_propose" fallback="Montant Total Proposé" /></Label>
              <input
                type="number"
                className="w-full mt-1 px-3 py-2 border rounded"
                placeholder="0"
              />
            </div>
            <div>
              <Label><T k="auto.tenderevaluationpanel.delai_de_paiement" fallback="Délai de Paiement" /></Label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded"
                placeholder="Ex: 30 jours"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Label htmlFor="financial-score"><T k="auto.tenderevaluationpanel.note_financiere" fallback="Note Financière" /></Label>
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
              <T k="auto.tenderevaluationpanel.sauvegarder" fallback="Sauvegarder" />
            </Button>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <Label htmlFor="financial-notes"><T k="auto.tenderevaluationpanel.commentaires_financiers" fallback="Commentaires Financiers" /></Label>
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
            <T k="auto.tenderevaluationpanel.sauvegarder_les_commentaires" fallback="Sauvegarder les Commentaires" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TenderEvaluationPanel;