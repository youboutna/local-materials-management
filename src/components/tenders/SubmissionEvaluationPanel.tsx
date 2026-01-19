/**
 * SubmissionEvaluationPanel - Evaluate tender submissions
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SubmissionSecretService } from '@/application/services/SubmissionSecretService';
import {
  FileText,
  Download,
  Star,
  CheckCircle,
  AlertCircle,
  Eye,
  Save,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useTenderSubmission, 
  useSubmissionDocuments, 
  useSaveSubmissionEvaluation 
} from '@/hooks/hexagonal';

interface SubmissionEvaluationPanelProps {
  submissionId: string;
  tenderId: string;
}

interface EvaluationScores {
  administrative_score: number;
  technical_score: number;
  financial_score: number;
  notes: string;
  recommendations: string;
}

export const SubmissionEvaluationPanel: React.FC<SubmissionEvaluationPanelProps> = ({
  submissionId,
  tenderId
}) => {
  const { toast } = useToast();
  
  const [scores, setScores] = useState<EvaluationScores>({
    administrative_score: 0,
    technical_score: 0,
    financial_score: 0,
    notes: '',
    recommendations: ''
  });

  // Use hexagonal hooks
  const { data: submission, isLoading: submissionLoading } = useTenderSubmission(submissionId);
  const { data: documents, isLoading: documentsLoading } = useSubmissionDocuments(submissionId);
  const saveEvaluationMutation = useSaveSubmissionEvaluation(submissionId);

  // Initialize scores when submission loads
  useEffect(() => {
    if (submission) {
      setScores(prev => ({
        ...prev,
        administrative_score: submission.administrative_score || 0,
        technical_score: submission.technical_score || 0,
        financial_score: submission.financial_score || 0,
      }));
    }
  }, [submission]);

  const handleSaveEvaluation = async (finalSubmit: boolean = false) => {
    try {
      await saveEvaluationMutation.mutateAsync({
        scores: {
          administrative_score: scores.administrative_score,
          technical_score: scores.technical_score,
          financial_score: scores.financial_score
        },
        finalSubmit,
        currentStatus: submission?.status
      });

      // Log the evaluation action
      try {
        await SubmissionSecretService.logAccess({
          submission_id: submissionId,
          action_type: finalSubmit ? 'evaluate' : 'comment',
          accessed_sections: ['evaluation'],
          metadata: {
            scores,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Error logging access:', logError);
      }

      toast({
        title: finalSubmit ? "Évaluation soumise" : "Évaluation sauvegardée",
        description: finalSubmit 
          ? "L'évaluation a été soumise avec succès."
          : "Vos modifications ont été sauvegardées.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'évaluation.",
        variant: "destructive",
      });
    }
  };

  const groupedDocuments = documents?.reduce((acc: any, doc: any) => {
    const category = doc.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {});

  const calculateTotalScore = () => {
    return (
      scores.administrative_score * 0.3 +
      scores.technical_score * 0.4 +
      scores.financial_score * 0.3
    ).toFixed(2);
  };

  if (submissionLoading || documentsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Évaluation de la Soumission</CardTitle>
              <CardDescription className="mt-2">
                Soumissionnaire: <span className="font-medium">{submission?.supplier_name}</span>
                <br />
                Email: <span className="font-medium">{submission?.supplier_email}</span>
                <br />
                Date de soumission: {new Date(submission?.submission_date || '').toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={submission?.status === 'submitted' ? 'default' : 'secondary'}>
              {submission?.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Documents and Evaluation */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
          <TabsTrigger value="summary">Résumé</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {Object.entries(groupedDocuments || {}).map(([category, docs]: [string, any]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">
                  Documents {category === 'administrative' ? 'Administratifs' : 
                            category === 'technical' ? 'Techniques' : 
                            category === 'financial' ? 'Financiers' : category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {docs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{doc.document?.title || 'Document'}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.subcategory} • {doc.document?.file_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.document?.file_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.document?.file_url;
                            link.download = doc.document?.file_name || 'document';
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {(!groupedDocuments || Object.keys(groupedDocuments).length === 0) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Aucun document disponible pour cette soumission.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Evaluation Tab */}
        <TabsContent value="evaluation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grille d'Évaluation</CardTitle>
              <CardDescription>
                Attribuez des scores pour chaque catégorie (0-100 points)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Administrative Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="admin-score" className="text-base font-medium">
                    Score Administratif (30%)
                  </Label>
                  <Badge variant="outline">{scores.administrative_score}/100</Badge>
                </div>
                <Input
                  id="admin-score"
                  type="number"
                  min="0"
                  max="100"
                  value={scores.administrative_score}
                  onChange={(e) => setScores({
                    ...scores,
                    administrative_score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  })}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Évaluation de la conformité administrative et des documents requis
                </p>
              </div>

              {/* Technical Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tech-score" className="text-base font-medium">
                    Score Technique (40%)
                  </Label>
                  <Badge variant="outline">{scores.technical_score}/100</Badge>
                </div>
                <Input
                  id="tech-score"
                  type="number"
                  min="0"
                  max="100"
                  value={scores.technical_score}
                  onChange={(e) => setScores({
                    ...scores,
                    technical_score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  })}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Évaluation des compétences techniques et de la méthodologie proposée
                </p>
              </div>

              {/* Financial Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fin-score" className="text-base font-medium">
                    Score Financier (30%)
                  </Label>
                  <Badge variant="outline">{scores.financial_score}/100</Badge>
                </div>
                <Input
                  id="fin-score"
                  type="number"
                  min="0"
                  max="100"
                  value={scores.financial_score}
                  onChange={(e) => setScores({
                    ...scores,
                    financial_score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  })}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Évaluation de l'offre financière et du rapport qualité-prix
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes d'Évaluation</Label>
                <Textarea
                  id="notes"
                  value={scores.notes}
                  onChange={(e) => setScores({ ...scores, notes: e.target.value })}
                  placeholder="Observations et commentaires détaillés..."
                  rows={4}
                />
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <Label htmlFor="recommendations">Recommandations</Label>
                <Textarea
                  id="recommendations"
                  value={scores.recommendations}
                  onChange={(e) => setScores({ ...scores, recommendations: e.target.value })}
                  placeholder="Recommandations pour la suite du processus..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleSaveEvaluation(false)}
                  disabled={saveEvaluationMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button
                  onClick={() => handleSaveEvaluation(true)}
                  disabled={saveEvaluationMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Soumettre l'Évaluation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Résumé de l'Évaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span className="font-medium">Score Administratif (30%)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{scores.administrative_score}</span>
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span className="font-medium">Score Technique (40%)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{scores.technical_score}</span>
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span className="font-medium">Score Financier (30%)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{scores.financial_score}</span>
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-primary/10 border-2 border-primary/20 rounded-lg">
                  <span className="text-lg font-bold">Score Total</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{calculateTotalScore()}</span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>

              {/* Recommendation Badge */}
              <div className="flex items-center justify-center p-4 border rounded-lg">
                {parseFloat(calculateTotalScore()) >= 70 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-medium text-lg">Recommandé pour attribution</span>
                  </div>
                ) : parseFloat(calculateTotalScore()) >= 50 ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-medium text-lg">Évaluation supplémentaire requise</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                    <span className="font-medium text-lg">Non recommandé</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubmissionEvaluationPanel;
