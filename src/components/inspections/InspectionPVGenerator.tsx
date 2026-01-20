import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText, Download, Send, CheckCircle, AlertTriangle, Eye, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PVGeneratorService } from '@/application/services/PVGeneratorService';
import { InspectionExecutionService } from '@/application/services/InspectionExecutionService';
import { GeneratedPV, PVType, InspectionExecutionData } from '@/types/inspection-execution';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InspectionPVGeneratorProps {
  inspection: {
    id: string;
    project_id: string;
    phase_id?: string | null;
    date: string;
    inspector: string;
    status: string;
    progress_at_inspection: number;
    comments?: string | null;
  };
  projectTitle: string;
  phaseName?: string;
  onGenerated?: (pv: GeneratedPV, pdfUrl: string) => void;
}

const InspectionPVGenerator: React.FC<InspectionPVGeneratorProps> = ({
  inspection,
  projectTitle,
  phaseName,
  onGenerated,
}) => {
  const [pvType, setPvType] = useState<PVType>('technical_inspection');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedPV, setGeneratedPV] = useState<GeneratedPV | null>(null);
  const [executionData, setExecutionData] = useState<InspectionExecutionData | null>(null);
  const [readinessCheck, setReadinessCheck] = useState<{ isReady: boolean; missing: string[] } | null>(null);

  // Check readiness when component mounts
  React.useEffect(() => {
    const checkReadiness = async () => {
      const data = await InspectionExecutionService.getExecutionData(inspection.id);
      if (data) {
        setExecutionData(data);
        const check = InspectionExecutionService.validateReadiness(data);
        setReadinessCheck(check);
      } else {
        setReadinessCheck({ isReady: false, missing: ['Données d\'exécution non trouvées'] });
      }
    };
    checkReadiness();
  }, [inspection.id]);

  // Generate PV
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const pv = await PVGeneratorService.generatePV(inspection.id, pvType);
      if (pv) {
        setGeneratedPV(pv);
        toast.success('PV généré avec succès');
      } else {
        toast.error('Erreur lors de la génération du PV');
      }
    } catch (error) {
      console.error('Error generating PV:', error);
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download PDF
  const handleDownload = async () => {
    if (!generatedPV) return;

    setIsDownloading(true);
    try {
      const { blob, fileName } = await PVGeneratorService.generatePDF(generatedPV);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF téléchargé');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  // Save PV to storage
  const handleSave = async () => {
    if (!generatedPV) return;

    setIsDownloading(true);
    try {
      const url = await PVGeneratorService.savePV(
        generatedPV,
        inspection.project_id,
        inspection.id
      );

      if (url) {
        toast.success('PV sauvegardé dans les documents');
        onGenerated?.(generatedPV, url);
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving PV:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsDownloading(false);
    }
  };

  const getPVTypeLabel = (type: PVType): string => {
    const labels: Record<PVType, string> = {
      technical_inspection: 'Inspection Technique',
      provisional_reception: 'Réception Provisoire',
      final_reception: 'Réception Définitive',
      safety_inspection: 'Inspection Sécurité',
      quality_control: 'Contrôle Qualité',
    };
    return labels[type];
  };

  const getConformityBadge = (status: string) => {
    switch (status) {
      case 'conform':
        return <Badge className="bg-green-100 text-green-800">Conforme</Badge>;
      case 'non_conform':
        return <Badge className="bg-red-100 text-red-800">Non conforme</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Partiellement conforme</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Génération de Procès-Verbal
          </CardTitle>
          <CardDescription>
            {projectTitle}{phaseName ? ` - ${phaseName}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Readiness check */}
          {readinessCheck && !readinessCheck.isReady && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Données manquantes pour générer le PV :</strong>
                <ul className="mt-2 list-disc list-inside text-sm">
                  {readinessCheck.missing.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* PV Type selection */}
          <div>
            <Label>Type de PV</Label>
            <Select value={pvType} onValueChange={(v) => setPvType(v as PVType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical_inspection">PV Inspection Technique</SelectItem>
                <SelectItem value="quality_control">PV Contrôle Qualité</SelectItem>
                <SelectItem value="safety_inspection">PV Inspection Sécurité</SelectItem>
                <SelectItem value="provisional_reception">PV Réception Provisoire</SelectItem>
                <SelectItem value="final_reception">PV Réception Définitive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Execution data summary */}
          {executionData && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold">{executionData.observations?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Observations</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{executionData.documents?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{executionData.participants?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Participants</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{executionData.quality_score || '-'}%</p>
                <p className="text-xs text-muted-foreground">Score Qualité</p>
              </div>
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !readinessCheck?.isReady}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Générer le PV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated PV Preview */}
      {generatedPV && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{generatedPV.title}</CardTitle>
                <CardDescription>N° {generatedPV.pv_number}</CardDescription>
              </div>
              <Badge variant="outline">{getPVTypeLabel(generatedPV.pv_type)}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {/* Header info */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Informations</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Projet:</span>{' '}
                      {generatedPV.header.project_title}
                    </div>
                    {generatedPV.header.phase_name && (
                      <div>
                        <span className="text-muted-foreground">Phase:</span>{' '}
                        {generatedPV.header.phase_name}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Date:</span>{' '}
                      {format(new Date(generatedPV.header.inspection_date), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>{' '}
                      {generatedPV.header.inspection_type}
                    </div>
                  </div>
                </div>

                {/* Object */}
                <div>
                  <h4 className="font-semibold mb-2">Objet</h4>
                  <p className="text-sm text-muted-foreground">{generatedPV.object}</p>
                </div>

                {/* Participants */}
                {generatedPV.participants.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Participants</h4>
                    <div className="flex flex-wrap gap-2">
                      {generatedPV.participants.map((p) => (
                        <Badge key={p.id} variant="secondary">
                          {p.name} ({p.role})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observations summary */}
                {generatedPV.observations_summary && (
                  <div>
                    <h4 className="font-semibold mb-2">Observations</h4>
                    <p className="text-sm">{generatedPV.observations_summary}</p>
                  </div>
                )}

                {/* Observations table */}
                {generatedPV.observations_table.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tableau des observations</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="p-2 text-left">Catégorie</th>
                            <th className="p-2 text-left">Observation</th>
                            <th className="p-2 text-left">Conformité</th>
                          </tr>
                        </thead>
                        <tbody>
                          {generatedPV.observations_table.slice(0, 5).map((obs, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{obs.category}</td>
                              <td className="p-2">{obs.observation.substring(0, 50)}...</td>
                              <td className="p-2">{getConformityBadge(obs.conformity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {generatedPV.observations_table.length > 5 && (
                        <div className="p-2 text-center text-sm text-muted-foreground bg-muted/50">
                          + {generatedPV.observations_table.length - 5} autres observations
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conclusions */}
                <div>
                  <h4 className="font-semibold mb-2">Conclusions</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">Statut global:</span>
                    {getConformityBadge(generatedPV.conclusions.overall_status)}
                  </div>
                  <p className="text-sm">{generatedPV.conclusions.summary}</p>
                </div>

                {/* Recommendations */}
                {generatedPV.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Recommandations</h4>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {generatedPV.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reserves */}
                {generatedPV.reserves && generatedPV.reserves.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Réserves</h4>
                    <div className="space-y-2">
                      {generatedPV.reserves.map((res, i) => (
                        <div key={i} className="p-2 border rounded bg-yellow-50">
                          <p className="text-sm">{res.description}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{res.severity}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Délai: {res.deadline}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signatures */}
                <div>
                  <h4 className="font-semibold mb-2">Signatures requises</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {generatedPV.signatures.map((sig) => (
                      <div key={sig.order} className="p-3 border rounded-lg text-center">
                        <p className="text-sm font-medium">{sig.role}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {sig.name || '(À signer)'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button onClick={handleSave} disabled={isDownloading}>
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Sauvegarder & Envoyer
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default InspectionPVGenerator;
