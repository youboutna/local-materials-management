import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save, CreditCard } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import EnhancedProjectSelector from '@/components/selectors/EnhancedProjectSelector';
import { useToast } from '@/hooks/use-toast';

interface BankGuaranteeFormData {
  projectId: string;
  tenderReference: string;
  contractorId: string;
  bankName: string;
  guaranteeType: string;
  guaranteeAmount: number;
  issueDate: Date | undefined;
  expiryDate: Date | undefined;
  status: string;
}

interface BankGuaranteeFormWithProjectSelectorProps {
  onSubmit: (data: BankGuaranteeFormData) => void;
  initialData?: Partial<BankGuaranteeFormData>;
  isLoading?: boolean;
}

const BankGuaranteeFormWithProjectSelector: React.FC<BankGuaranteeFormWithProjectSelectorProps> = ({
  onSubmit,
  initialData,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BankGuaranteeFormData>({
    projectId: initialData?.projectId || '',
    tenderReference: initialData?.tenderReference || '',
    contractorId: initialData?.contractorId || '',
    bankName: initialData?.bankName || '',
    guaranteeType: initialData?.guaranteeType || 'soumission',
    guaranteeAmount: initialData?.guaranteeAmount || 0,
    issueDate: initialData?.issueDate || new Date(),
    expiryDate: initialData?.expiryDate || undefined,
    status: initialData?.status || 'active'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.bankName || !formData.guaranteeAmount || !formData.expiryDate) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    onSubmit(formData);
  };

  const updateFormData = (field: keyof BankGuaranteeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Nouvelle Garantie Bancaire
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
              <Label htmlFor="contractorId">ID Entrepreneur *</Label>
              <Input
                id="contractorId"
                value={formData.contractorId}
                onChange={(e) => updateFormData('contractorId', e.target.value)}
                placeholder="Identifiant de l'entrepreneur"
                required
              />
            </div>

            <div>
              <Label htmlFor="bankName">Banque émettrice *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => updateFormData('bankName', e.target.value)}
                placeholder="Nom de la banque"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guaranteeType">Type de garantie</Label>
              <Select value={formData.guaranteeType} onValueChange={(value) => updateFormData('guaranteeType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="soumission">Garantie de soumission</SelectItem>
                  <SelectItem value="bonne_execution">Garantie de bonne exécution</SelectItem>
                  <SelectItem value="avance">Garantie de remboursement d'avance</SelectItem>
                  <SelectItem value="retenue_garantie">Garantie de retenue</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="guaranteeAmount">Montant de la garantie (MRU) *</Label>
              <Input
                id="guaranteeAmount"
                type="number"
                value={formData.guaranteeAmount}
                onChange={(e) => updateFormData('guaranteeAmount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date d'émission *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.issueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.issueDate ? format(formData.issueDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.issueDate}
                    onSelect={(date) => updateFormData('issueDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Date d'expiration *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expiryDate ? format(formData.expiryDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expiryDate}
                    onSelect={(date) => updateFormData('expiryDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expirée</SelectItem>
                <SelectItem value="used">Utilisée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Enregistrement...' : 'Enregistrer la garantie'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BankGuaranteeFormWithProjectSelector;