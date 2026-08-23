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
import { useLanguage } from '@/contexts/LanguageContext';
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
import { T } from '@/components/i18n/T';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SecretManagerBody: React.FC<{ initialTenderId?: string }> = ({ initialTenderId }) => {
  const { t } = useLanguage();
  const { tenders, loading } = useTendersHex();
  const [tenderId, setTenderId] = useState<string>(initialTenderId ?? '');

  useEffect(() => {
    if (!tenderId && tenders.length > 0) {
      const preselect = initialTenderId && tenders.some((td) => td.id === initialTenderId)
        ? initialTenderId
        : tenders[0].id;
      setTenderId(preselect);
    }
  }, [tenders, tenderId, initialTenderId]);

  const selected = useMemo(
    () => tenders.find((td) => td.id === tenderId) ?? null,
    [tenders, tenderId],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="secret-manager-tender"><T k="auto.secretaccessmanager.appel_d_offres" fallback="Appel d'offres" /></Label>
        <Select value={tenderId} onValueChange={setTenderId} disabled={loading}>
          <SelectTrigger id="secret-manager-tender">
            <SelectValue placeholder={loading ? t('common.loading') : t('tenders.select_placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {tenders.map((td) => (
              <SelectItem key={td.id} value={td.id}>
                {td.title}
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
            ? t('tenders.loading')
            : t('tenders.none_available_hint')}
        </p>
      )}
    </div>
  );
};

export const SecretAccessManager: React.FC<{ className?: string; hideLabel?: boolean }> = ({
  className,
  hideLabel = false,
}) => {
  const { t } = useLanguage();
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
          title={t('secret_access.manage_title')}
        >
          <KeyRound className="h-4 w-4" />
          {!hideLabel && <span className="truncate text-sm font-medium">{t('secret_access.button')}</span>}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('secret_access.dialog_title')}</DialogTitle>
          <DialogDescription>
{t('secret_access.dialog_description')}
          </DialogDescription>
        </DialogHeader>
        {open && <SecretManagerBody initialTenderId={contextTenderId} />}
      </DialogContent>
    </Dialog>
  );
};

export default SecretAccessManager;
