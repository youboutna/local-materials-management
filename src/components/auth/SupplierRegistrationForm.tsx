/**
 * SupplierRegistrationForm — inscription self-service d'un fournisseur.
 * Aucun libellé métier codé en dur : types d'activité et zones viennent des référentiels.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSupplierActivityOptions } from '@/config/referentials/suppliers/supplier-activity-types.referential';
import { GEO_WILAYA_LABELS } from '@/config/referentials/geo/mauritania-geo.referential';
import { getSupplierRegistrationService } from '@/application/services/SupplierRegistrationService';
import { ROUTES } from '@/config/routes';

const SupplierRegistrationForm = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    fiscalId: '',
    activityType: '',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    documentsNote: '',
  });
  const [zones, setZones] = useState<string[]>([]);

  const activityOptions = useMemo(() => getSupplierActivityOptions('fr'), []);
  const zoneOptions = useMemo(
    () =>
      Object.entries(GEO_WILAYA_LABELS).map(([code, entry]) => ({
        value: code,
        label: entry.fr ?? code,
      })),
    []
  );

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleZone = (code: string) =>
    setZones((prev) => (prev.includes(code) ? prev.filter((z) => z !== code) : [...prev, code]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.fiscalId.trim() || !form.activityType) {
      toast.error('Raison sociale, identifiant fiscal et type d’activité sont obligatoires.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await getSupplierRegistrationService().register({
        ...form,
        interventionZones: zones,
        documentsNote: form.documentsNote || undefined,
      });
      toast.success(result.message);
      navigate(ROUTES.pendingValidation, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "L'inscription a échoué.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company-name">Raison sociale</Label>
          <Input
            id="company-name"
            value={form.companyName}
            onChange={(e) => set('companyName')(e.target.value)}
            required
            maxLength={160}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fiscal-id">NIF / NINEA</Label>
          <Input
            id="fiscal-id"
            value={form.fiscalId}
            onChange={(e) => set('fiscalId')(e.target.value)}
            required
            maxLength={40}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity-type">Type d’activité</Label>
        <Select value={form.activityType} onValueChange={set('activityType')}>
          <SelectTrigger id="activity-type">
            <SelectValue placeholder="Sélectionner une activité" />
          </SelectTrigger>
          <SelectContent>
            {activityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Zones d’intervention</legend>
        <div className="grid max-h-44 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
          {zoneOptions.map((zone) => (
            <label key={zone.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={zones.includes(zone.value)}
                onCheckedChange={() => toggleZone(zone.value)}
                aria-label={zone.label}
              />
              <span>{zone.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Nom du contact</Label>
          <Input
            id="contact-name"
            value={form.contactName}
            onChange={(e) => set('contactName')(e.target.value)}
            required
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Téléphone</Label>
          <Input
            id="contact-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone')(e.target.value)}
            placeholder="+222 XX XX XX XX"
            maxLength={30}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
            required
            maxLength={255}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier-password">Mot de passe</Label>
          <Input
            id="supplier-password"
            type="password"
            value={form.password}
            onChange={(e) => set('password')(e.target.value)}
            required
            minLength={6}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="documents-note">Documents (RCCM, attestation fiscale)</Label>
        <Textarea
          id="documents-note"
          value={form.documentsNote}
          onChange={(e) => set('documentsNote')(e.target.value)}
          placeholder="Précisez les pièces disponibles ; elles seront demandées après validation."
          maxLength={1000}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Envoi en cours…' : 'Envoyer ma demande'}
      </Button>
    </form>
  );
};

export default SupplierRegistrationForm;
