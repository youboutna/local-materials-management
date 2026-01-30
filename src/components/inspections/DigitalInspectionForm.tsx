import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, MapPin, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import { createDigitalInspection, MANDATORY_INSPECTION_FIELDS } from '@/application/services/InspectionMonitoringService';
import { toast } from '@/hooks/use-toast';

interface DigitalInspectionFormProps {
  projectId: string;
  inspectorId: string;
  onSubmitted?: (inspectionId: string) => void;
}

const DigitalInspectionForm: React.FC<DigitalInspectionFormProps> = ({
  projectId,
  inspectorId,
  onSubmitted
}) => {
  const [inspectionType, setInspectionType] = useState<string>('');
  const [location, setLocation] = useState({ latitude: 0, longitude: 0, address: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [defects, setDefects] = useState<any[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const mandatoryFields = inspectionType ? MANDATORY_INSPECTION_FIELDS[inspectionType as keyof typeof MANDATORY_INSPECTION_FIELDS] || [] : [];

  const handleLocationCapture = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          });
          toast({
            title: 'Localisation capturée',
            description: 'Position GPS enregistrée avec succès'
          });
        },
        (error) => {
          toast({
            title: 'Erreur de géolocalisation',
            description: 'Impossible de capturer la position GPS',
            variant: 'destructive'
          });
        }
      );
    }
  };

  const addDefect = () => {
    setDefects([...defects, {
      category: '',
      severity: 'medium',
      description: '',
      correctionRequired: false
    }]);
  };

  const updateDefect = (index: number, field: string, value: any) => {
    const updatedDefects = [...defects];
    updatedDefects[index] = { ...updatedDefects[index], [field]: value };
    setDefects(updatedDefects);
  };

  const addComplianceCheck = (standard: string) => {
    if (!complianceChecks.find(check => check.standard === standard)) {
      setComplianceChecks([...complianceChecks, {
        standard,
        passed: false,
        notes: ''
      }]);
    }
  };

  const updateComplianceCheck = (index: number, field: string, value: any) => {
    const updatedChecks = [...complianceChecks];
    updatedChecks[index] = { ...updatedChecks[index], [field]: value };
    setComplianceChecks(updatedChecks);
  };

  const handleSubmit = async () => {
    if (!inspectionType) {
      toast({
        title: 'Type d\'inspection requis',
        description: 'Veuillez sélectionner un type d\'inspection',
        variant: 'destructive'
      });
      return;
    }

    if (location.latitude === 0 || location.longitude === 0) {
      toast({
        title: 'Localisation requise',
        description: 'Veuillez capturer la localisation GPS',
        variant: 'destructive'
      });
      return;
    }

    // Check mandatory fields completion
    const missingFields = mandatoryFields.filter(field => 
      !complianceChecks.some(check => check.standard === field)
    );

    if (missingFields.length > 0) {
      toast({
        title: 'Contrôles obligatoires manquants',
        description: `Veuillez compléter: ${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const inspectionData = {
        projectId,
        inspectorId,
        inspectionType: inspectionType as any,
        status: 'completed' as any,
        scheduledDate: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        location,
        findings: {
          photos,
          notes,
          defects,
          complianceChecks
        }
      };

      const inspectionId = await createDigitalInspection(inspectionData);
      
      toast({
        title: 'Inspection soumise',
        description: 'Inspection numérique créée avec succès'
      });

      onSubmitted?.(inspectionId);
    } catch (error) {
      console.error('Error submitting inspection:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de la soumission de l\'inspection',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Inspection Numérique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type d'inspection */}
          <div className="space-y-2">
            <Label htmlFor="inspection-type">Type d'inspection *</Label>
            <Select value={inspectionType} onValueChange={setInspectionType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Inspection quotidienne</SelectItem>
                <SelectItem value="weekly">Inspection hebdomadaire</SelectItem>
                <SelectItem value="milestone">Inspection jalon</SelectItem>
                <SelectItem value="safety">Inspection sécurité</SelectItem>
                <SelectItem value="quality">Inspection qualité</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Localisation GPS */}
          <div className="space-y-2">
            <Label>Localisation GPS *</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleLocationCapture}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                Capturer Position
              </Button>
              {location.latitude !== 0 && (
                <Badge variant="secondary">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Badge>
              )}
            </div>
          </div>

          {/* Contrôles obligatoires */}
          {mandatoryFields.length > 0 && (
            <div className="space-y-3">
              <Label>Contrôles obligatoires ({inspectionType})</Label>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Ces contrôles sont obligatoires pour ce type d'inspection
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-3">
                {mandatoryFields.map((field) => (
                  <div key={field} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{field.replace(/_/g, ' ').toUpperCase()}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addComplianceCheck(field)}
                        disabled={complianceChecks.some(check => check.standard === field)}
                      >
                        Ajouter Contrôle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contrôles de conformité */}
          {complianceChecks.length > 0 && (
            <div className="space-y-3">
              <Label>Contrôles de Conformité</Label>
              {complianceChecks.map((check, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{check.standard}</span>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={check.passed}
                          onCheckedChange={(checked) => 
                            updateComplianceCheck(index, 'passed', checked)
                          }
                        />
                        <Label>Conforme</Label>
                      </div>
                    </div>
                    <Textarea
                      placeholder="Notes sur le contrôle..."
                      value={check.notes}
                      onChange={(e) => updateComplianceCheck(index, 'notes', e.target.value)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Défauts détectés */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Défauts détectés</Label>
              <Button type="button" variant="outline" size="sm" onClick={addDefect}>
                Ajouter Défaut
              </Button>
            </div>
            
            {defects.map((defect, index) => (
              <Card key={index} className="p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Input
                      value={defect.category}
                      onChange={(e) => updateDefect(index, 'category', e.target.value)}
                      placeholder="ex: Structure, Électricité..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sévérité</Label>
                    <Select
                      value={defect.severity}
                      onValueChange={(value) => updateDefect(index, 'severity', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="high">Élevé</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={defect.description}
                      onChange={(e) => updateDefect(index, 'description', e.target.value)}
                      placeholder="Description détaillée du défaut..."
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={defect.correctionRequired}
                        onCheckedChange={(checked) => 
                          updateDefect(index, 'correctionRequired', checked)
                        }
                      />
                      <Label>Correction requise</Label>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Notes générales */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes générales</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations générales, recommandations..."
              rows={4}
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos d'inspection</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Ajouter des photos d'inspection
              </p>
              <Button type="button" variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Télécharger Photos
              </Button>
            </div>
          </div>

          {/* Bouton de soumission */}
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="w-full"
          >
            {submitting ? 'Soumission...' : 'Soumettre Inspection'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalInspectionForm;