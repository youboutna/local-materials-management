/**
 * SecretAccessManager — accès global (fil d'Ariane) à la gestion complète des
 * codes secrets de partage : création, copie, lien portail, révocation, suppression.
 *
 * Purement présentationnel : sélection de l'AO via `useTendersHex` (hexagonal)
 * puis délégation à `TenderSecretsPanel` (hooks + services). Aucun appel Supabase direct.
 * Le contenu (et donc le fetch des AO) n'est monté qu'à l'ouverture du dialogue.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTendersHex } from '@/hooks/hexagonal';
import { TenderSecretsPanel } from '@/components/tenders/TenderSecretsPanel';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SecretManagerBody: React.FC<{ initialTenderId?: string }> = ({ initialTenderId }) => {
  const { tenders, loading } = useTendersHex();
  const [tenderId, setTenderId] = useState<string>(initialTenderId ?? '');

  useEffect(() => {
    if (!tenderId && tenders.length > 0) {
      const preselect = initialTenderId && tenders.some((t) => t.id === initialTenderId)
        ? initialTenderId
        : tenders[0].id;
      setTenderId(preselect);
    }
  }, [tenders, tenderId, initialTenderId]);

  const selected = useMemo(
    () => tenders.find((t) => t.id === tenderId) ?? null,
    [tenders, tenderId],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="secret-manager-tender">Appel d'offres</Label>
        <Select value={tenderId} onValueChange={setTenderId} disabled={loading}>
          <SelectTrigger id="secret-manager-tender">
            <SelectValue placeholder={loading ? 'Chargement…' : "Sélectionner un appel d'offres"} />
          </SelectTrigger>
          <SelectContent>
            {tenders.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected ? (
        <TenderSecretsPanel tenderId={selected.id} tenderTitle={selected.title} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {loading
            ? 'Chargement des appels d’offres…'
            : "Aucun appel d'offres disponible : créez-en un pour générer des codes de partage."}
        </p>
      )}
    </div>
  );
};

export const SecretAccessManager: React.FC<{ className?: string; hideLabel?: boolean }> = ({
  className,
  hideLabel = false,
}) => {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const location = useLocation();

  // Contexte : préselection si l'URL courante porte un identifiant d'AO.
  const contextTenderId = useMemo(() => {
    const fromParams = Object.values(params).find(
      (v) => typeof v === 'string' && UUID_RE.test(v),
    ) as string | undefined;
    if (!fromParams) return undefined;
    return location.pathname.includes('tender') ? fromParams : undefined;
  }, [params, location.pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
          title="Créer et gérer les codes secrets de partage"
        >
          <KeyRound className="h-4 w-4" />
          {!hideLabel && <span className="truncate text-sm font-medium">Partage &amp; codes</span>}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partage sécurisé &amp; codes secrets</DialogTitle>
          <DialogDescription>
            Créez, copiez, révoquez ou supprimez les codes d'accès du portail fournisseur pour
            un appel d'offres, sans quitter la page courante.
          </DialogDescription>
        </DialogHeader>
        {open && <SecretManagerBody initialTenderId={contextTenderId} />}
      </DialogContent>
    </Dialog>
  );
};

export default SecretAccessManager;
