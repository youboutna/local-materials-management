import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin, Camera, Upload, Plus, CheckCircle, AlertTriangle,
  FileText, Users, Ruler, Play, Square, Save, Clock, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { InspectionExecutionService } from '@/application/services/InspectionExecutionService';
import {
  InspectionExecutionData,
  InspectionObservation,
  ChecklistItem,
  InspectionMeasurement,
  InspectionParticipant,
  ConformityStatus,
  ObservationType,
  SeverityLevel,
  OBSERVATION_CATEGORIES,
  InspectionDocument as InspectionDocumentType,
} from '@/types/inspection-execution';

interface FieldInspectionExecutorProps {
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
  inspectionType?: string;
  onComplete?: (data: InspectionExecutionData) => void;
  onSave?: () => void;
}

const FieldInspectionExecutor: React.FC<FieldInspectionExecutorProps> = ({
  inspection,
  projectTitle,
  inspectionType = 'technical',
  onComplete,
  onSave,
}) => {
  const [isStarted, setIsStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('checklist');
  
  // Execution data
  const [executionData, setExecutionData] = useState<Partial<InspectionExecutionData>>({
    observations: [],
    documents: [],
    checklist: [],
    measurements: [],
    participants: [],
    summary: '',
    recommendations: [],
    progress_percentage: inspection.progress_at_inspection,
    overall_conformity: 'partial',
  });

  // Location
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  // Forms
  const [newObservation, setNewObservation] = useState<Partial<InspectionObservation>>({
    type: 'technical',
    conformity: 'conform',
    category: '',
    description: '',
  });
  const [newParticipant, setNewParticipant] = useState<Partial<InspectionParticipant>>({
    name: '',
    role: '',
    organization: '',
  });
  const [newMeasurement, setNewMeasurement] = useState<Partial<InspectionMeasurement>>({
    parameter: '',
    value: 0,
    unit: '',
  });

  // Load existing data or initialize
  useEffect(() => {
    const loadData = async () => {
      if (inspection.status === 'in_progress') {
        const data = await InspectionExecutionService.getExecutionData(inspection.id);
        if (data) {
          setExecutionData(data);
          setIsStarted(true);
          if (data.location) setLocation(data.location);
        }
      }
    };
    loadData();
  }, [inspection.id, inspection.status]);

  // Initialize checklist based on inspection type
  useEffect(() => {
    if (!executionData.checklist?.length && !isStarted) {
      const defaultChecklist = InspectionExecutionService.getDefaultChecklist(inspectionType);
      // Note: getDefaultChecklist returns ChecklistItem[] synchronously
      setExecutionData(prev => ({ ...prev, checklist: defaultChecklist }));
    }
  }, [inspectionType, isStarted, executionData.checklist?.length]);

  // Capture GPS location
  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée');
      return;
    }

    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        };
        setLocation(loc);
        setIsCapturingLocation(false);
        toast.success('Position GPS capturée');
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Impossible de capturer la position');
        setIsCapturingLocation(false);
      }
    );
  };

  // Start inspection
  const handleStart = async () => {
    if (!location) {
      toast.error('Veuillez d\'abord capturer la position GPS');
      return;
    }

    try {
      const inspectionService = new InspectionExecutionService();
      const success = await InspectionExecutionService.startInspectionStatic(inspection.id, location);
      if (success) {
        setIsStarted(true);
        toast.success('Inspection démarrée');
      } else {
        toast.error('Erreur lors du démarrage');
      }
    } catch (error) {
      console.error('Start inspection error:', error);
      toast.error('Erreur lors du démarrage');
    }
  };

  // Save progress
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const service = new InspectionExecutionService();
      // Use the completeInspection method to save progress
      const result = await service.completeInspection({
        inspectionId: inspection.id,
        finalData: {
          overallConformity: 'conform',
          notes: executionData?.notes || ''
        }
      });
      
      if (result.success) {
        toast.success('Progression sauvegardée');
        onSave?.();
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
    setIsSaving(false);
  };

  // Add observation
  const handleAddObservation = () => {
    if (!newObservation.category || !newObservation.description) {
      toast.error('Catégorie et description requises');
      return;
    }

    const obs: InspectionObservation = {
      id: crypto.randomUUID(),
      type: newObservation.type as ObservationType,
      category: newObservation.category,
      description: newObservation.description,
      location: newObservation.location,
      severity: newObservation.severity as SeverityLevel,
      conformity: newObservation.conformity as ConformityStatus,
      corrective_action: newObservation.corrective_action,
      created_at: new Date().toISOString(),
    };

    setExecutionData(prev => ({
      ...prev,
      observations: [...(prev.observations || []), obs],
    }));

    setNewObservation({
      type: 'technical',
      conformity: 'conform',
      category: '',
      description: '',
    });
    toast.success('Observation ajoutée');
  };

  // Update checklist item
  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setExecutionData(prev => ({
      ...prev,
      checklist: prev.checklist?.map(item =>
        item.id === itemId
          ? { ...item, checked, checked_at: checked ? new Date().toISOString() : undefined }
          : item
      ),
    }));
  };

  // Add participant
  const handleAddParticipant = () => {
    if (!newParticipant.name || !newParticipant.role) {
      toast.error('Nom et rôle requis');
      return;
    }

    const participant: InspectionParticipant = {
      id: crypto.randomUUID(),
      name: newParticipant.name,
      role: newParticipant.role,
      organization: newParticipant.organization,
    };

    setExecutionData(prev => ({
      ...prev,
      participants: [...(prev.participants || []), participant],
    }));

    setNewParticipant({ name: '', role: '', organization: '' });
    toast.success('Participant ajouté');
  };

  // Add measurement
  const handleAddMeasurement = () => {
    if (!newMeasurement.parameter || newMeasurement.value === undefined) {
      toast.error('Paramètre et valeur requis');
      return;
    }

    const measurement: InspectionMeasurement = {
      id: crypto.randomUUID(),
      parameter: newMeasurement.parameter,
      value: newMeasurement.value,
      unit: newMeasurement.unit || '',
      min_acceptable: newMeasurement.min_acceptable,
      max_acceptable: newMeasurement.max_acceptable,
      is_within_range: true,
    };

    // Check if within range
    if (measurement.min_acceptable !== undefined && measurement.value < measurement.min_acceptable) {
      measurement.is_within_range = false;
    }
    if (measurement.max_acceptable !== undefined && measurement.value > measurement.max_acceptable) {
      measurement.is_within_range = false;
    }

    setExecutionData(prev => ({
      ...prev,
      measurements: [...(prev.measurements || []), measurement],
    }));

    setNewMeasurement({ parameter: '', value: 0, unit: '' });
    toast.success('Mesure ajoutée');
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image`);
        continue;
      }

      try {
        const service = new InspectionExecutionService();
        const result = await service.addDocument({
          inspectionId: inspection.id,
          document: {
            title: file.name,
            name: file.name,
            type: 'photo',
            documentType: 'photo' as 'certificate' | 'checklist' | 'photo' | 'report' | 'scan',
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            projectId: inspection.projectId,
            paymentId: '',
            supplierId: '',
            phaseId: inspection.phaseId || '',
            inspectionId: inspection.id,
            description: '',
            fileUrl: '',
            status: 'draft',
            tags: [],
            isInternalOnly: false,
            isSharedWithSuppliers: false
          } as InspectionExecutionResult
        });

        if (result.success) {
          const doc: InspectionDocumentType = {
            id: crypto.randomUUID(),
            name: file.name,
            type: 'photo',
            url: URL.createObjectURL(file),
            size: file.size,
            mime_type: file.type,
            uploaded_at: new Date().toISOString(),
            metadata: location ? { latitude: location.latitude, longitude: location.longitude } : undefined
          };
          
          setExecutionData(prev => ({
            ...prev,
            documents: [...(prev.documents || []), doc],
          }));
          toast.success(`Photo ${file.name} uploadée`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Erreur lors de l'upload de ${file.name}`);
      }
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let score = 0;
    let total = 4;

    if ((executionData.checklist?.filter(c => c.checked).length || 0) > 0) score++;
    if ((executionData.observations?.length || 0) > 0) score++;
    if ((executionData.participants?.length || 0) > 0) score++;
    if ((executionData.documents?.length || 0) > 0) score++;

    return Math.round((score / total) * 100);
  };

  // Get observation categories based on type
  const getCategories = () => {
    const type = newObservation.type || 'technical';
    return OBSERVATION_CATEGORIES[type as keyof typeof OBSERVATION_CATEGORIES] || [];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{projectTitle}</CardTitle>
              <CardDescription>
                Inspecteur: {inspection.inspector} | Date: {new Date(inspection.date).toLocaleDateString('fr-FR')}
              </CardDescription>
            </div>
            <Badge variant={isStarted ? 'default' : 'outline'}>
              {isStarted ? 'En cours' : 'Non démarrée'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* GPS Location */}
            <div className="flex-1">
              <Button
                variant="outline"
                className="w-full"
                onClick={captureLocation}
                disabled={isCapturingLocation}
              >
                <MapPin className="h-4 w-4 mr-2" />
                {location
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : isCapturingLocation
                  ? 'Capture...'
                  : 'Capturer Position GPS'}
              </Button>
            </div>

            {/* Start/Save buttons */}
            {!isStarted ? (
              <Button onClick={handleStart} disabled={!location}>
                <Play className="h-4 w-4 mr-2" />
                Démarrer
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Progression de la saisie</span>
              <span>{getCompletionPercentage()}%</span>
            </div>
            <Progress value={getCompletionPercentage()} />
          </div>
        </CardContent>
      </Card>

      {/* Main content - only show when started */}
      {isStarted && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="checklist" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="observations" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Observations</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-1">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="measurements" className="flex items-center gap-1">
              <Ruler className="h-4 w-4" />
              <span className="hidden sm:inline">Mesures</span>
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Participants</span>
            </TabsTrigger>
          </TabsList>

          {/* Checklist Tab */}
          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Points de Contrôle</CardTitle>
                <CardDescription>
                  {executionData.checklist?.filter(c => c.checked).length || 0} / {executionData.checklist?.length || 0} vérifiés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {executionData.checklist?.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${
                          item.checked ? 'bg-green-50 border-green-200' : 'bg-background'
                        }`}
                      >
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          onCheckedChange={(checked) =>
                            handleChecklistChange(item.id, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={item.id}
                            className={`text-sm font-medium cursor-pointer ${
                              item.checked ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {item.label}
                            {item.required && <span className="text-destructive ml-1">*</span>}
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                        </div>
                        {item.checked && item.checked_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.checked_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Observations Tab */}
          <TabsContent value="observations">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observations</CardTitle>
                <CardDescription>
                  {executionData.observations?.length || 0} observation(s) enregistrée(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add observation form */}
                <div className="grid gap-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={newObservation.type}
                        onValueChange={(v) =>
                          setNewObservation({ ...newObservation, type: v as ObservationType, category: '' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technique</SelectItem>
                          <SelectItem value="safety">Sécurité</SelectItem>
                          <SelectItem value="quality">Qualité</SelectItem>
                          <SelectItem value="non_conformity">Non-conformité</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Catégorie</Label>
                      <Select
                        value={newObservation.category}
                        onValueChange={(v) => setNewObservation({ ...newObservation, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getCategories().map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newObservation.description}
                      onChange={(e) => setNewObservation({ ...newObservation, description: e.target.value })}
                      placeholder="Décrivez l'observation..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Conformité</Label>
                      <Select
                        value={newObservation.conformity}
                        onValueChange={(v) =>
                          setNewObservation({ ...newObservation, conformity: v as ConformityStatus })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conform">Conforme</SelectItem>
                          <SelectItem value="partial">Partiellement conforme</SelectItem>
                          <SelectItem value="non_conform">Non conforme</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newObservation.conformity !== 'conform' && (
                      <div>
                        <Label>Gravité</Label>
                        <Select
                          value={newObservation.severity}
                          onValueChange={(v) =>
                            setNewObservation({ ...newObservation, severity: v as SeverityLevel })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minor">Mineure</SelectItem>
                            <SelectItem value="major">Majeure</SelectItem>
                            <SelectItem value="critical">Critique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {newObservation.conformity !== 'conform' && (
                    <div>
                      <Label>Action corrective proposée</Label>
                      <Input
                        value={newObservation.corrective_action || ''}
                        onChange={(e) =>
                          setNewObservation({ ...newObservation, corrective_action: e.target.value })
                        }
                        placeholder="Action à entreprendre..."
                      />
                    </div>
                  )}

                  <Button onClick={handleAddObservation} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter observation
                  </Button>
                </div>

                {/* Observations list */}
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {executionData.observations?.map((obs) => (
                      <div
                        key={obs.id}
                        className={`p-3 rounded-lg border ${
                          obs.conformity === 'conform'
                            ? 'bg-green-50 border-green-200'
                            : obs.conformity === 'non_conform'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{obs.category}</Badge>
                              <Badge
                                variant={
                                  obs.conformity === 'conform'
                                    ? 'default'
                                    : obs.conformity === 'non_conform'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {obs.conformity === 'conform'
                                  ? 'Conforme'
                                  : obs.conformity === 'non_conform'
                                  ? 'Non conforme'
                                  : 'Partiel'}
                              </Badge>
                              {obs.severity && (
                                <Badge variant="outline">{obs.severity}</Badge>
                              )}
                            </div>
                            <p className="text-sm mt-2">{obs.description}</p>
                            {obs.corrective_action && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Action: {obs.corrective_action}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              setExecutionData((prev) => ({
                                ...prev,
                                observations: prev.observations?.filter((o) => o.id !== obs.id),
                              }))
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Photos & Documents</CardTitle>
                <CardDescription>
                  {executionData.documents?.length || 0} document(s) uploadé(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Upload area */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center mb-4">
                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Cliquez ou glissez pour ajouter des photos
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Sélectionner
                      </span>
                    </Button>
                  </label>
                </div>

                {/* Photos grid */}
                <div className="grid grid-cols-3 gap-2">
                  {executionData.documents?.filter(d => d.type === 'photo').map((doc) => (
                    <div key={doc.id} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img
                        src={doc.url}
                        alt={doc.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                        {doc.name}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Measurements Tab */}
          <TabsContent value="measurements">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mesures & Relevés</CardTitle>
                <CardDescription>
                  {executionData.measurements?.length || 0} mesure(s) enregistrée(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add measurement form */}
                <div className="grid gap-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Paramètre</Label>
                      <Input
                        value={newMeasurement.parameter}
                        onChange={(e) =>
                          setNewMeasurement({ ...newMeasurement, parameter: e.target.value })
                        }
                        placeholder="ex: Épaisseur dalle"
                      />
                    </div>
                    <div>
                      <Label>Valeur</Label>
                      <Input
                        type="number"
                        value={newMeasurement.value}
                        onChange={(e) =>
                          setNewMeasurement({ ...newMeasurement, value: parseFloat(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label>Unité</Label>
                      <Input
                        value={newMeasurement.unit}
                        onChange={(e) =>
                          setNewMeasurement({ ...newMeasurement, unit: e.target.value })
                        }
                        placeholder="cm, m, kg..."
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddMeasurement} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter mesure
                  </Button>
                </div>

                {/* Measurements list */}
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {executionData.measurements?.map((m) => (
                      <div
                        key={m.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          m.is_within_range ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{m.parameter}</p>
                          <p className="text-sm text-muted-foreground">
                            {m.value} {m.unit}
                          </p>
                        </div>
                        <Badge variant={m.is_within_range ? 'default' : 'destructive'}>
                          {m.is_within_range ? 'OK' : 'Hors norme'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Participants</CardTitle>
                <CardDescription>
                  {executionData.participants?.length || 0} participant(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add participant form */}
                <div className="grid gap-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Nom</Label>
                      <Input
                        value={newParticipant.name}
                        onChange={(e) =>
                          setNewParticipant({ ...newParticipant, name: e.target.value })
                        }
                        placeholder="Nom complet"
                      />
                    </div>
                    <div>
                      <Label>Rôle</Label>
                      <Input
                        value={newParticipant.role}
                        onChange={(e) =>
                          setNewParticipant({ ...newParticipant, role: e.target.value })
                        }
                        placeholder="ex: Ingénieur, Chef équipe..."
                      />
                    </div>
                    <div>
                      <Label>Organisation</Label>
                      <Input
                        value={newParticipant.organization}
                        onChange={(e) =>
                          setNewParticipant({ ...newParticipant, organization: e.target.value })
                        }
                        placeholder="Entreprise/Société"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddParticipant} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter participant
                  </Button>
                </div>

                {/* Participants list */}
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {executionData.participants?.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {p.role}{p.organization ? ` - ${p.organization}` : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setExecutionData((prev) => ({
                              ...prev,
                              participants: prev.participants?.filter((part) => part.id !== p.id),
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Summary section */}
      {isStarted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Résumé & Conclusions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Progression observée (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={executionData.progress_percentage || 0}
                  onChange={(e) =>
                    setExecutionData({
                      ...executionData,
                      progress_percentage: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>Conformité globale</Label>
                <Select
                  value={executionData.overall_conformity}
                  onValueChange={(v) =>
                    setExecutionData({
                      ...executionData,
                      overall_conformity: v as ConformityStatus,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conform">Conforme</SelectItem>
                    <SelectItem value="partial">Partiellement conforme</SelectItem>
                    <SelectItem value="non_conform">Non conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Résumé des observations</Label>
              <Textarea
                value={executionData.summary || ''}
                onChange={(e) =>
                  setExecutionData({ ...executionData, summary: e.target.value })
                }
                placeholder="Résumé général de l'inspection..."
                rows={3}
              />
            </div>

            <div>
              <Label>Recommandations</Label>
              <Textarea
                value={(executionData.recommendations || []).join('\n')}
                onChange={(e) =>
                  setExecutionData({
                    ...executionData,
                    recommendations: e.target.value.split('\n').filter(Boolean),
                  })
                }
                placeholder="Une recommandation par ligne..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FieldInspectionExecutor;
