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
  InspectionDocumentEntity,
  ConformityStatus,
  OBSERVATION_CATEGORIES,
} from '@/dtos/entities/InspectionDTO';

// Local types for UI-specific fields not in DTOs
interface LocalMeasurement {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  minAcceptable?: number;
  maxAcceptable?: number;
  isWithinRange: boolean;
}

interface LocalParticipant {
  id: string;
  name: string;
  role: string;
  organization?: string;
}

interface LocalObservation {
  type: string;
  conformity: string;
  category: string;
  description: string;
  severity?: string;
  correctiveAction?: string;
}

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
  onComplete?: (data: any) => void;
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
  
  const [executionData, setExecutionData] = useState<{
    observations: InspectionObservation[];
    documents: InspectionDocumentEntity[];
    checklist: (ChecklistItem & { label?: string; checkedAt?: string })[];
    measurements: LocalMeasurement[];
    participants: LocalParticipant[];
    summary: string;
    recommendations: string[];
    progressPercentage: number;
    overallConformity: string;
    location?: { latitude: number; longitude: number; address?: string; captured_at?: string };
  }>({
    observations: [],
    documents: [],
    checklist: [],
    measurements: [],
    participants: [],
    summary: '',
    recommendations: [],
    progressPercentage: inspection.progress_at_inspection,
    overallConformity: 'conforme',
  });

  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  const [newObservation, setNewObservation] = useState<LocalObservation>({
    type: 'technical',
    conformity: 'conforme',
    category: '',
    description: '',
  });
  const [newParticipant, setNewParticipant] = useState<Partial<LocalParticipant>>({
    name: '',
    role: '',
    organization: '',
  });
  const [newMeasurement, setNewMeasurement] = useState<Partial<LocalMeasurement>>({
    parameter: '',
    value: 0,
    unit: '',
  });

  useEffect(() => {
    const loadData = async () => {
      if (inspection.status === 'in_progress') {
        try {
          const service = new InspectionExecutionService();
          // Try to load existing data
          setIsStarted(true);
        } catch (e) {
          console.error('Failed to load execution data:', e);
        }
      }
    };
    loadData();
  }, [inspection.id, inspection.status]);

  useEffect(() => {
    if (!executionData.checklist?.length && !isStarted) {
      const defaultChecklist: (ChecklistItem & { label?: string })[] = [
        { id: '1', title: 'Vérification des plans', label: 'Vérification des plans', required: true, completed: false, category: 'Préparation' },
        { id: '2', title: 'Contrôle des matériaux', label: 'Contrôle des matériaux', required: true, completed: false, category: 'Matériaux' },
        { id: '3', title: 'Sécurité du chantier', label: 'Sécurité du chantier', required: true, completed: false, category: 'Sécurité' },
        { id: '4', title: 'Conformité structurelle', label: 'Conformité structurelle', required: true, completed: false, category: 'Structure' },
        { id: '5', title: 'Installations électriques', label: 'Installations électriques', required: false, completed: false, category: 'Électricité' },
      ];
      setExecutionData(prev => ({ ...prev, checklist: defaultChecklist }));
    }
  }, [inspectionType, isStarted, executionData.checklist?.length]);

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

  const handleStart = async () => {
    if (!location) {
      toast.error('Veuillez d\'abord capturer la position GPS');
      return;
    }
    try {
      setIsStarted(true);
      toast.success('Inspection démarrée');
    } catch (error) {
      console.error('Start inspection error:', error);
      toast.error('Erreur lors du démarrage');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const service = new InspectionExecutionService();
      const result = await service.completeInspection({
        inspectionId: inspection.id,
        finalData: {
          overallConformity: 'conforme' as ConformityStatus,
          notes: executionData.summary || ''
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

  const handleAddObservation = () => {
    if (!newObservation.category || !newObservation.description) {
      toast.error('Catégorie et description requises');
      return;
    }

    const obs: InspectionObservation = {
      id: crypto.randomUUID(),
      description: newObservation.description,
      severity: newObservation.severity === 'major' ? 'high' : (newObservation.severity as 'low' | 'medium' | 'high' | 'critical') || 'low',
      status: 'open',
      type: newObservation.type,
      category: newObservation.category,
      conformity: newObservation.conformity,
      createdAt: new Date().toISOString(),
    };

    setExecutionData(prev => ({
      ...prev,
      observations: [...(prev.observations || []), obs],
    }));

    setNewObservation({
      type: 'technical',
      conformity: 'conforme',
      category: '',
      description: '',
    });
    toast.success('Observation ajoutée');
  };

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setExecutionData(prev => ({
      ...prev,
      checklist: prev.checklist?.map(item =>
        item.id === itemId
          ? { ...item, checked, completed: checked, checkedAt: checked ? new Date().toISOString() : undefined }
          : item
      ),
    }));
  };

  const handleAddParticipant = () => {
    if (!newParticipant.name || !newParticipant.role) {
      toast.error('Nom et rôle requis');
      return;
    }

    const participant: LocalParticipant = {
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

  const handleAddMeasurement = () => {
    if (!newMeasurement.parameter || newMeasurement.value === undefined) {
      toast.error('Paramètre et valeur requis');
      return;
    }

    const measurement: LocalMeasurement = {
      id: crypto.randomUUID(),
      parameter: newMeasurement.parameter!,
      value: newMeasurement.value!,
      unit: newMeasurement.unit || '',
      minAcceptable: newMeasurement.minAcceptable,
      maxAcceptable: newMeasurement.maxAcceptable,
      isWithinRange: true,
    };

    if (measurement.minAcceptable !== undefined && measurement.value < measurement.minAcceptable) {
      measurement.isWithinRange = false;
    }
    if (measurement.maxAcceptable !== undefined && measurement.value > measurement.maxAcceptable) {
      measurement.isWithinRange = false;
    }

    setExecutionData(prev => ({
      ...prev,
      measurements: [...(prev.measurements || []), measurement],
    }));

    setNewMeasurement({ parameter: '', value: 0, unit: '' });
    toast.success('Mesure ajoutée');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image`);
        continue;
      }

      const doc: InspectionDocumentEntity = {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'photo',
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        size: file.size,
        mime_type: file.type,
      };
      
      setExecutionData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), doc],
      }));
      toast.success(`Photo ${file.name} ajoutée`);
    }
  };

  const getCompletionPercentage = () => {
    let score = 0;
    let total = 4;
    if ((executionData.checklist?.filter(c => c.checked || c.completed).length || 0) > 0) score++;
    if ((executionData.observations?.length || 0) > 0) score++;
    if ((executionData.participants?.length || 0) > 0) score++;
    if ((executionData.documents?.length || 0) > 0) score++;
    return Math.round((score / total) * 100);
  };

  const getCategories = () => {
    const type = newObservation.type || 'technical';
    return OBSERVATION_CATEGORIES[type as keyof typeof OBSERVATION_CATEGORIES] || [];
  };

  return (
    <div className="space-y-4">
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
            <div className="flex-1">
              <Button variant="outline" className="w-full" onClick={captureLocation} disabled={isCapturingLocation}>
                <MapPin className="h-4 w-4 mr-2" />
                {location
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : isCapturingLocation ? 'Capture...' : 'Capturer Position GPS'}
              </Button>
            </div>
            {!isStarted ? (
              <Button onClick={handleStart} disabled={!location}>
                <Play className="h-4 w-4 mr-2" />Démarrer
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Progression de la saisie</span>
              <span>{getCompletionPercentage()}%</span>
            </div>
            <Progress value={getCompletionPercentage()} />
          </div>
        </CardContent>
      </Card>

      {isStarted && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="checklist" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /><span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="observations" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /><span className="hidden sm:inline">Observations</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-1">
              <Camera className="h-4 w-4" /><span className="hidden sm:inline">Photos</span>
            </TabsTrigger>
            <TabsTrigger value="measurements" className="flex items-center gap-1">
              <Ruler className="h-4 w-4" /><span className="hidden sm:inline">Mesures</span>
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-1">
              <Users className="h-4 w-4" /><span className="hidden sm:inline">Participants</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Points de Contrôle</CardTitle>
                <CardDescription>
                  {executionData.checklist?.filter(c => c.checked || c.completed).length || 0} / {executionData.checklist?.length || 0} vérifiés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {executionData.checklist?.map((item) => (
                      <div key={item.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${(item.checked || item.completed) ? 'bg-green-50 border-green-200' : 'bg-background'}`}>
                        <Checkbox
                          id={item.id}
                          checked={item.checked || item.completed}
                          onCheckedChange={(checked) => handleChecklistChange(item.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <label htmlFor={item.id} className={`text-sm font-medium cursor-pointer ${(item.checked || item.completed) ? 'line-through text-muted-foreground' : ''}`}>
                            {item.label || item.title}
                            {item.required && <span className="text-destructive ml-1">*</span>}
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                        </div>
                        {(item.checked || item.completed) && item.checkedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.checkedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="observations">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observations</CardTitle>
                <CardDescription>{executionData.observations?.length || 0} observation(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select value={newObservation.type} onValueChange={(v) => setNewObservation({ ...newObservation, type: v, category: '' })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Select value={newObservation.category} onValueChange={(v) => setNewObservation({ ...newObservation, category: v })}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          {getCategories().map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={newObservation.description} onChange={(e) => setNewObservation({ ...newObservation, description: e.target.value })} placeholder="Décrivez l'observation..." rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Conformité</Label>
                      <Select value={newObservation.conformity} onValueChange={(v) => setNewObservation({ ...newObservation, conformity: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conforme">Conforme</SelectItem>
                          <SelectItem value="en_attente">Partiellement conforme</SelectItem>
                          <SelectItem value="non_conforme">Non conforme</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newObservation.conformity !== 'conforme' && (
                      <div>
                        <Label>Gravité</Label>
                        <Select value={newObservation.severity} onValueChange={(v) => setNewObservation({ ...newObservation, severity: v })}>
                          <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Mineure</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Majeure</SelectItem>
                            <SelectItem value="critical">Critique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  {newObservation.conformity !== 'conforme' && (
                    <div>
                      <Label>Action corrective proposée</Label>
                      <Input value={newObservation.correctiveAction || ''} onChange={(e) => setNewObservation({ ...newObservation, correctiveAction: e.target.value })} placeholder="Action à entreprendre..." />
                    </div>
                  )}
                  <Button onClick={handleAddObservation} className="w-full"><Plus className="h-4 w-4 mr-2" />Ajouter observation</Button>
                </div>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {executionData.observations?.map((obs) => (
                      <div key={obs.id} className={`p-3 rounded-lg border ${obs.conformity === 'conforme' ? 'bg-green-50 border-green-200' : obs.conformity === 'non_conforme' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{obs.category}</Badge>
                              <Badge variant={obs.conformity === 'conforme' ? 'default' : obs.conformity === 'non_conforme' ? 'destructive' : 'secondary'}>
                                {obs.conformity === 'conforme' ? 'Conforme' : obs.conformity === 'non_conforme' ? 'Non conforme' : 'Partiel'}
                              </Badge>
                              {obs.severity && <Badge variant="outline">{obs.severity}</Badge>}
                            </div>
                            <p className="text-sm mt-2">{obs.description}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExecutionData(prev => ({ ...prev, observations: prev.observations?.filter(o => o.id !== obs.id) }))}>
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

          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Photos & Documents</CardTitle>
                <CardDescription>{executionData.documents?.length || 0} document(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-6 text-center mb-4">
                  <input type="file" id="photo-upload" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Cliquez pour ajouter des photos</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild><span><Upload className="h-4 w-4 mr-2" />Sélectionner</span></Button>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {executionData.documents?.filter(d => d.type === 'photo').map((doc) => (
                    <div key={doc.id} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">{doc.name}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="measurements">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mesures & Relevés</CardTitle>
                <CardDescription>{executionData.measurements?.length || 0} mesure(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Paramètre</Label><Input value={newMeasurement.parameter} onChange={(e) => setNewMeasurement({ ...newMeasurement, parameter: e.target.value })} placeholder="ex: Épaisseur dalle" /></div>
                    <div><Label>Valeur</Label><Input type="number" value={newMeasurement.value} onChange={(e) => setNewMeasurement({ ...newMeasurement, value: parseFloat(e.target.value) })} /></div>
                    <div><Label>Unité</Label><Input value={newMeasurement.unit} onChange={(e) => setNewMeasurement({ ...newMeasurement, unit: e.target.value })} placeholder="cm, m, kg..." /></div>
                  </div>
                  <Button onClick={handleAddMeasurement} className="w-full"><Plus className="h-4 w-4 mr-2" />Ajouter mesure</Button>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {executionData.measurements?.map((m) => (
                      <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${m.isWithinRange ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div><p className="font-medium">{m.parameter}</p><p className="text-sm text-muted-foreground">{m.value} {m.unit}</p></div>
                        <Badge variant={m.isWithinRange ? 'default' : 'destructive'}>{m.isWithinRange ? 'OK' : 'Hors norme'}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Participants</CardTitle>
                <CardDescription>{executionData.participants?.length || 0} participant(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Nom</Label><Input value={newParticipant.name} onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })} placeholder="Nom complet" /></div>
                    <div><Label>Rôle</Label><Input value={newParticipant.role} onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value })} placeholder="ex: Ingénieur" /></div>
                    <div><Label>Organisation</Label><Input value={newParticipant.organization} onChange={(e) => setNewParticipant({ ...newParticipant, organization: e.target.value })} placeholder="Entreprise" /></div>
                  </div>
                  <Button onClick={handleAddParticipant} className="w-full"><Plus className="h-4 w-4 mr-2" />Ajouter participant</Button>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {executionData.participants?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
                          <div><p className="font-medium">{p.name}</p><p className="text-sm text-muted-foreground">{p.role}{p.organization ? ` - ${p.organization}` : ''}</p></div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setExecutionData(prev => ({ ...prev, participants: prev.participants?.filter(part => part.id !== p.id) }))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {isStarted && (
        <Card>
          <CardHeader><CardTitle className="text-base">Résumé & Conclusions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Progression observée (%)</Label>
                <Input type="number" min={0} max={100} value={executionData.progressPercentage || 0} onChange={(e) => setExecutionData({ ...executionData, progressPercentage: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>Conformité globale</Label>
                <Select value={executionData.overallConformity} onValueChange={(v) => setExecutionData({ ...executionData, overallConformity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conforme">Conforme</SelectItem>
                    <SelectItem value="en_attente">Partiellement conforme</SelectItem>
                    <SelectItem value="non_conforme">Non conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Résumé des observations</Label>
              <Textarea value={executionData.summary || ''} onChange={(e) => setExecutionData({ ...executionData, summary: e.target.value })} placeholder="Résumé général de l'inspection..." rows={3} />
            </div>
            <div>
              <Label>Recommandations</Label>
              <Textarea value={(executionData.recommendations || []).join('\n')} onChange={(e) => setExecutionData({ ...executionData, recommendations: e.target.value.split('\n').filter(Boolean) })} placeholder="Une recommandation par ligne..." rows={3} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FieldInspectionExecutor;
