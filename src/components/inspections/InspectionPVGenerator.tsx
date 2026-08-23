import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Download, Send, CheckCircle, AlertTriangle, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getPVGeneratorService } from '@/application/services/PVGeneratorService';
import type { GeneratedPV, PVType } from '@/dtos/workflows/InspectionExecutionDTO';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
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
  const [readinessCheck, setReadinessCheck] = useState<{ isReady: boolean; missing: string[] } | null>(null);

  // Check readiness when component mounts
  React.useEffect(() => {
    const checkReadiness = async () => {
      try {
        // Simple readiness check based on inspection data
        if (inspection && inspection.id) {
          setReadinessCheck({ isReady: true, missing: [] });
        } else {
          setReadinessCheck({ isReady: false, missing: ['Données d\'inspection non trouvées'] });
        }
      } catch (error) {
        setReadinessCheck({ isReady: false, missing: ['Erreur lors de la vérification'] });
      }
    };
    checkReadiness();
  }, [inspection.id]);

  // Generate PV using service instance
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const pvService = getPVGeneratorService();
      const result = await pvService.generatePV({ inspectionId: inspection.id, pvType });
      if (result.success && result.pv) {
        setGeneratedPV(result.pv);
        toast.success('PV généré avec succès');
      } else {
        toast.error(result.error || 'Erreur lors de la génération du PV');
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
    if (!generatedPV || !generatedPV.pdfUrl) return;

    setIsDownloading(true);
    try {
      // Open PDF in new tab
      window.open(generatedPV.pdfUrl, '_blank');
      toast.success('PDF ouvert dans un nouvel onglet');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  // Save PV
  const handleSave = async () => {
    if (!generatedPV) return;

    setIsDownloading(true);
    try {
      // PV is already generated, just notify
      if (generatedPV.pdfUrl) {
        toast.success('PV sauvegardé dans les documents');
        onGenerated?.(generatedPV, generatedPV.pdfUrl);
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

  const pvTypeOptions = [
    { value: 'technical_inspection', label: 'Inspection Technique' },
    { value: 'safety_inspection', label: 'Inspection Sécurité' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <T k="auto.inspectionpvgenerator.generation_de_pv" fallback="Génération de PV" />
        </CardTitle>
        <CardDescription>
          Projet: {projectTitle} {phaseName && `- Phase: ${phaseName}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {readinessCheck && !readinessCheck.isReady && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium"><T k="auto.inspectionpvgenerator.verification_prealable_requise" fallback="Vérification préalable requise:" /></p>
              <ul className="list-disc list-inside mt-1">
                {readinessCheck.missing.map((item, i) => (
                  <li key={i} className="text-sm">{item}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label><T k="auto.inspectionpvgenerator.type_de_pv" fallback="Type de PV" /></Label>
          <Select value={pvType} onValueChange={(v) => setPvType(v as PVType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pvTypeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground"><T k="auto.inspectionpvgenerator.date_d_inspection" fallback="Date d'inspection" /></Label>
            <p>{format(new Date(inspection.date), 'dd MMMM yyyy', { locale: fr })}</p>
          </div>
          <div>
            <Label className="text-muted-foreground"><T k="auto.inspectionpvgenerator.inspecteur" fallback="Inspecteur" /></Label>
            <p>{inspection.inspector}</p>
          </div>
          <div>
            <Label className="text-muted-foreground"><T k="auto.inspectionpvgenerator.statut" fallback="Statut" /></Label>
            <Badge variant="outline"><TranslatedStatus code={inspection.status} /></Badge>
          </div>
          <div>
            <Label className="text-muted-foreground"><T k="auto.inspectionpvgenerator.progression" fallback="Progression" /></Label>
            <p>{inspection.progress_at_inspection}%</p>
          </div>
        </div>

        {generatedPV && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="font-medium">PV généré: {generatedPV.pvNumber}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Type: {pvTypeOptions.find(o => o.value === generatedPV.pvType)?.label}
              </p>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        {!generatedPV ? (
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <T k="auto.inspectionpvgenerator.generation" fallback="Génération..." />
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                <T k="auto.inspectionpvgenerator.generer_le_pv" fallback="Générer le PV" />
              </>
            )}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
              <Download className="h-4 w-4 mr-2" />
              <T k="auto.inspectionpvgenerator.telecharger" fallback="Télécharger" />
            </Button>
            <Button onClick={handleSave} disabled={isDownloading}>
              <Send className="h-4 w-4 mr-2" />
              <T k="auto.inspectionpvgenerator.sauvegarder" fallback="Sauvegarder" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default InspectionPVGenerator;
