/**
 * ProjectInsuranceForm
 * Formulaire de police / certificat d'assurance rattaché à un projet.
 * Le `projectId` est imposé par le contexte (jamais saisi ni omis) : c'est la
 * cause de la non-persistance constatée en recette.
 *
 * Hexagonal : UI → DTO → InsuranceService → Repository → DB.
 */

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Shield, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getInsuranceService } from '@/application/services/InsuranceService';
import { getInsuranceCertificatesService } from '@/application/services/InsuranceCertificatesService';
import { InsuranceType, type InsuranceCertificateDTO, getInsuranceTypeLabel } from '@/dtos/entities/InsuranceDTO';
import { T } from '@/components/i18n/T';

interface ProjectInsuranceFormProps {
  projectId: string;
  /** Appelé après persistance réussie avec le certificat créé. */
  onCreated?: (certificate: InsuranceCertificateDTO) => void;
  onCancel?: () => void;
}

const INSURANCE_TYPE_OPTIONS = Object.values(InsuranceType);

export function ProjectInsuranceForm({ projectId, onCreated, onCancel }: ProjectInsuranceFormProps) {
  const { toast } = useToast();
  const insuranceService = useMemo(() => getInsuranceService(), []);
  const certificatesService = useMemo(() => getInsuranceCertificatesService(), []);

  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    insuranceCompany: '',
    policyNumber: '',
    insuranceType: InsuranceType.RESPONSABILITE_CIVILE as string,
    coverageAmount: '',
    contractorName: '',
    contractorId: '',
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: '',
    notes: '',
  });

  const set = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!projectId) {
      toast({ title: 'Projet manquant', description: 'Enregistrez le projet avant d\'ajouter une police.', variant: 'destructive' });
      return;
    }
    if (!form.insuranceCompany || !form.policyNumber || !form.validUntil) {
      toast({
        title: 'Champs obligatoires',
        description: 'Assureur, numéro de police et date de fin de validité sont requis.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await insuranceService.createInsuranceCertificate({
        projectId,
        contractorId: form.contractorId || projectId,
        contractorName: form.contractorName || form.insuranceCompany,
        insuranceType: form.insuranceType,
        coverageType: form.insuranceType,
        insuranceCompany: form.insuranceCompany,
        policyNumber: form.policyNumber,
        coverageAmount: Number(form.coverageAmount) || 0,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        notes: form.notes || undefined,
      });

      let result = created;
      if (file && created?.id) {
        const url = await certificatesService.uploadCertificateFile(created.id, file);
        await certificatesService.updateCertificate(created.id, { certificateUrl: url } as any);
        result = { ...created, certificateUrl: url, certificate_url: url } as InsuranceCertificateDTO;
      }

      toast({ title: 'Police enregistrée', description: `Police ${form.policyNumber} rattachée au projet.` });
      onCreated?.(result);
      setForm(prev => ({ ...prev, insuranceCompany: '', policyNumber: '', coverageAmount: '', validUntil: '', notes: '' }));
      setFile(null);
    } catch (error: any) {
      console.error('[ProjectInsuranceForm] create failed', error);
      toast({
        title: 'Enregistrement impossible',
        description: error?.message || 'La police d\'assurance n\'a pas pu être enregistrée.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <T k="auto.projectinsuranceform.police_rattachee_au_projet_courant" fallback="Police rattachée au projet courant" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="insuranceCompany">Assureur *</Label>
          <Input id="insuranceCompany" value={form.insuranceCompany} onChange={e => set('insuranceCompany', e.target.value)} placeholder="Compagnie d'assurance" />
        </div>
        <div>
          <Label htmlFor="policyNumber">N° de police *</Label>
          <Input id="policyNumber" value={form.policyNumber} onChange={e => set('policyNumber', e.target.value)} placeholder="POL-2026-0001" />
        </div>
        <div>
          <Label><T k="auto.projectinsuranceform.type_de_garantie" fallback="Type de garantie" /></Label>
          <Select value={form.insuranceType} onValueChange={value => set('insuranceType', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INSURANCE_TYPE_OPTIONS.map(type => (
                <SelectItem key={type} value={type}>{getInsuranceTypeLabel(type as any)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="coverageAmount"><T k="auto.projectinsuranceform.montant_couvert_mru" fallback="Montant couvert (MRU)" /></Label>
          <Input id="coverageAmount" type="number" min={0} value={form.coverageAmount} onChange={e => set('coverageAmount', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="contractorName">Titulaire / entrepreneur</Label>
          <Input id="contractorName" value={form.contractorName} onChange={e => set('contractorName', e.target.value)} placeholder="Nom de l'entreprise" />
        </div>
        <div>
          <Label htmlFor="contractorId"><T k="auto.projectinsuranceform.reference_titulaire" fallback="Référence titulaire" /></Label>
          <Input id="contractorId" value={form.contractorId} onChange={e => set('contractorId', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="validFrom"><T k="auto.projectinsuranceform.valide_du" fallback="Valide du" /></Label>
          <Input id="validFrom" type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="validUntil">Valide jusqu'au *</Label>
          <Input id="validUntil" type="date" value={form.validUntil} onChange={e => set('validUntil', e.target.value)} />
        </div>
      </div>

      <div>
        <Label htmlFor="insuranceFile" className="flex items-center gap-2">
          <Upload className="h-4 w-4" /> Attestation / police (PDF, image)
        </Label>
        <Input
          id="insuranceFile"
          type="file"
          accept="application/pdf,image/*"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        {file && <p className="mt-1 text-xs text-muted-foreground">{file.name}</p>}
      </div>

      <div>
        <Label htmlFor="insuranceNotes"><T k="auto.projectinsuranceform.notes" fallback="Notes" /></Label>
        <Textarea id="insuranceNotes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}><T k="auto.projectinsuranceform.annuler" fallback="Annuler" /></Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Enregistrer la police
        </Button>
      </div>
    </form>
  );
}

export default ProjectInsuranceForm;
