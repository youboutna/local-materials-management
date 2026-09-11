/**
 * SystemSettingsPanel — exposition et édition des variables d'environnement
 * et des paramètres système persistés (Supabase ou localStorage selon le mode).
 *
 * ⚠️ Ce panneau intègre désormais le sélecteur de profil de déploiement
 *    (DeploymentProfileSelector) qui remplace les anciens panneaux
 *    DatabaseSettings.tsx et ProviderSettings.tsx.
 */

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useConfig } from '@/hooks/useConfig';
import { IS_LOCAL_BYPASS, APP_NAME, APP_VERSION } from '@/config/constants';
import { Loader2, RotateCcw, Save, Search } from 'lucide-react';
import { T } from '@/components/i18n/T';
import { useLanguage } from '@/contexts/LanguageContext';
import DeploymentProfileSelector from './DeploymentProfileSelector';

const asText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const parseValue = (raw: string, previous: unknown): unknown => {
  if (typeof previous === 'boolean') return raw === 'true';
  if (typeof previous === 'number' && raw.trim() !== '' && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  if (Array.isArray(previous) || (previous && typeof previous === 'object')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
};

export default function SystemSettingsPanel() {
  const { t } = useLanguage();
  const { entries, isLoading, error, refetch, saveEntry, isSaving } = useConfig();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => entry.key.toLowerCase().includes(needle));
  }, [entries, search]);

  const handleSave = async (key: string, previous: unknown, category?: string) => {
    const draft = drafts[key];
    if (draft === undefined) return;
    try {
      await saveEntry({
        key,
        value: parseValue(draft, previous),
        category: category ?? 'general',
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast({
        title: t('auto.systemsettingspanel.parametre_enregistre'),
        description: key,
      });
    } catch (err) {
      toast({
        title: "Échec de l'enregistrement",
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ✅ NOUVELLE SECTION : Profil de déploiement */}
      <DeploymentProfileSelector />

      {/* Section existante : variables d'environnement */}
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                <T
                  k="auto.systemsettingspanel.parametres_systeme"
                  fallback="Paramètres système"
                />
              </CardTitle>
              <CardDescription>
                Variables d'environnement et réglages persistés. Les valeurs sensibles (clés,
                secrets, mots de passe) ne sont jamais affichées.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {IS_LOCAL_BYPASS
                  ? 'Persistance : localStorage'
                  : 'Persistance : system_settings'}
              </Badge>
              <Badge variant="secondary">
                {APP_NAME} v{APP_VERSION}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                <T k="auto.systemsettingspanel.recharger" fallback="Recharger" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                'auto.systemsettingspanel.filtrer_par_cle_ex_vite_auth_storage',
              )}
              className="pl-8"
              aria-label={t('auto.systemsettingspanel.filtrer_les_parametres')}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {isLoading && (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des paramètres…
            </div>
          )}

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error.message}
            </p>
          )}

          {!isLoading && filtered.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">
              <T
                k="auto.systemsettingspanel.aucun_parametre_pour_ce_filtre"
                fallback="Aucun paramètre pour ce filtre."
              />
            </p>
          )}

          <div className="divide-y rounded-md border">
            {filtered.map((entry) => {
              const current = drafts[entry.key] ?? asText(entry.value);
              const dirty = drafts[entry.key] !== undefined;
              return (
                <div
                  key={entry.key}
                  className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="min-w-0 sm:w-1/3">
                    <p className="truncate font-mono text-xs font-medium">{entry.key}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {entry.category ?? 'general'}
                    </Badge>
                  </div>
                  <Input
                    value={current}
                    onChange={(event) =>
                      setDrafts((prev) => ({ ...prev, [entry.key]: event.target.value }))
                    }
                    className="min-w-0 flex-1 font-mono text-xs"
                    aria-label={`Valeur de ${entry.key}`}
                  />
                  <Button
                    size="sm"
                    variant={dirty ? 'default' : 'outline'}
                    disabled={!dirty || isSaving}
                    onClick={() => handleSave(entry.key, entry.value, entry.category)}
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    <T k="auto.systemsettingspanel.enregistrer" fallback="Enregistrer" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}