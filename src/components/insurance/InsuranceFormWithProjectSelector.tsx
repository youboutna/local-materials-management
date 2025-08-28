import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save, Shield } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import EnhancedProjectSelector from '@/components/selectors/EnhancedProjectSelector';
import { useToast } from '@/hooks/use-toast';

interface InsuranceFormData {
  projectId: string;
  tenderReference: string;
  contractorName: string;
  contractorId: string;
  insuranceCompany: string;
  policyNumber: string;
  coverageType: string;
  coverageAmount: number;
  validFrom: Date | undefined;
  validUntil: Date | undefined;
  certificateUrl: string;
  notes: string;
}

interface InsuranceFormWithProjectSelectorProps {
  onSubmit: (data: InsuranceFormData) => void;
  initialData?: Partial<InsuranceFormData>;
  isLoading?: boolean;
}

const InsuranceFormWithProjectSelector: React.FC<InsuranceFormWithProjectSelectorProps> = ({
  onSubmit,
  initialData,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InsuranceFormData>({
    projectId: initialData?.projectId || '',
    tenderReference: initialData?.tenderReference || '',
    contractorName: initialData?.contractorName || '',
    contractorId: initialData?.contractorId || '',
    insuranceCompany: initialData?.insuranceCompany || '',
    policyNumber: initialData?.policyNumber || '',
    coverageType: initialData?.coverageType || 'responsabilite_civile',
    coverageAmount: initialData?.coverageAmount || 0,
    validFrom: initialData?.validFrom || new Date(),
    validUntil: initialData?.validUntil || undefined,
    certificateUrl: initialData?.certificateUrl || '',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.contractorName || !formData.insuranceCompany || !formData.policyNumber) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    onSubmit(formData);
  };

  const updateFormData = (field: keyof InsuranceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Nouveau Certificat d'Assurance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EnhancedProjectSelector
            value={formData.projectId}
            onChange={(id) => updateFormData('projectId', id || '')}
            label="Projet"
            placeholder="Sélectionner un projet"
            required={true}
            showTenderReference={true}
            tenderReference={formData.tenderReference}
            onTenderReferenceChange={(ref) => updateFormData('tenderReference', ref)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contractorName">Nom de l'entrepreneur *</Label>
              <Input
                id="contractorName"
                value={formData.contractorName}
                onChange={(e) => updateFormData('contractorName', e.target.value)}
                placeholder="Nom de l'entreprise"
                required
              />
            </div>

            <div>
              <Label htmlFor="contractorId">ID Entrepreneur</Label>
              <Input
                id="contractorId"
                value={formData.contractorId}
                onChange={(e) => updateFormData('contractorId', e.target.value)}
                placeholder="Identifiant de l'entrepreneur"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insuranceCompany">Compagnie d'assurance *</Label>
              <Input
                id="insuranceCompany"
                value={formData.insuranceCompany}
                onChange={(e) => updateFormData('insuranceCompany', e.target.value)}
                placeholder="Nom de la compagnie"
                required
              />
            </div>

            <div>
              <Label htmlFor="policyNumber">Numéro de police *</Label>
              <Input
                id="policyNumber"
                value={formData.policyNumber}
                onChange={(e) => updateFormData('policyNumber', e.target.value)}
                placeholder="Numéro de police d'assurance"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coverageType">Type de couverture</Label>
              <Select value={formData.coverageType} onValueChange={(value) => updateFormData('coverageType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsabilite_civile">Responsabilité civile</SelectItem>
                  <SelectItem value="tous_risques_chantier">Tous risques chantier</SelectItem>
                  <SelectItem value="responsabilite_decennale">Responsabilité décennale</SelectItem>
                  <SelectItem value="assurance_materiel">Assurance matériel</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="coverageAmount">Montant de couverture (MRU)</Label>
              <Input
                id="coverageAmount"
                type="number"
                value={formData.coverageAmount}
                onChange={(e) => updateFormData('coverageAmount', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.validFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.validFrom ? format(formData.validFrom, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.validFrom}
                    onSelect={(date) => updateFormData('validFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Date de fin *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.validUntil && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.validUntil ? format(formData.validUntil, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.validUntil}
                    onSelect={(date) => updateFormData('validUntil', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="certificateUrl">URL du certificat</Label>
            <Input
              id="certificateUrl"
              value={formData.certificateUrl}
              onChange={(e) => updateFormData('certificateUrl', e.target.value)}
              placeholder="Lien vers le document PDF"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Notes additionnelles"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Enregistrement...' : 'Enregistrer le certificat'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InsuranceFormWithProjectSelector;