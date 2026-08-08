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
    if (!generatedPV || !generatedPV.pdf_url) return;

    setIsDownloading(true);
    try {
      // Open PDF in new tab
      window.open(generatedPV.pdf_url, '_blank');
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
      if (generatedPV.pdf_url) {
        toast.success('PV sauvegardé dans les documents');
        onGenerated?.(generatedPV, generatedPV.pdf_url);
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
          Génération de PV
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
              <p className="font-medium">Vérification préalable requise:</p>
              <ul className="list-disc list-inside mt-1">
                {readinessCheck.missing.map((item, i) => (
                  <li key={i} className="text-sm">{item}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div>
          <Label>Type de PV</Label>
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
            <Label className="text-muted-foreground">Date d'inspection</Label>
            <p>{format(new Date(inspection.date), 'dd MMMM yyyy', { locale: fr })}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Inspecteur</Label>
            <p>{inspection.inspector}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Statut</Label>
            <Badge variant="outline">{inspection.status}</Badge>
          </div>
          <div>
            <Label className="text-muted-foreground">Progression</Label>
            <p>{inspection.progress_at_inspection}%</p>
          </div>
        </div>

        {generatedPV && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">PV généré: {generatedPV.pv_number}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Type: {pvTypeOptions.find(o => o.value === generatedPV.pv_type)?.label}
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
                Génération...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Générer le PV
              </>
            )}
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleDownload} disabled={isDownloading}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            <Button onClick={handleSave} disabled={isDownloading}>
              <Send className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default InspectionPVGenerator;
