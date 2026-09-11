/**
 * DeploymentProfileSelector — sélection du profil de déploiement actif.
 *
 * Flow : choix du profil → saisie des paramètres → "Enregistrer et activer"
 *        → persistance dans btp.system_settings → déconnexion → /auth
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useHexagonalAuth } from '@/hooks/hexagonal/useHexagonalAuth';
import {
  getActiveProfile,
  getProfileCustomConfig,
  setActiveProfile,
  setProfileCustomConfig,
  invalidateProfileCache,
  listProfiles,
} from '@/config/profile-manager';
import type { DeploymentProfile } from '@/config/profiles';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';

interface ProfileConfigFieldsProps {
  profile: DeploymentProfile;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

function ProfileConfigFields({ profile, values, onChange }: ProfileConfigFieldsProps) {
  const field = (
    storageKey: string,
    label: string,
    placeholder?: string,
    type: 'text' | 'password' = 'text'
  ) => (
    <div className="space-y-1.5" key={storageKey}>
      <Label htmlFor={storageKey}>{label}</Label>
      <Input
        id={storageKey}
        type={type}
        value={values[storageKey] ?? ''}
        onChange={(e) => onChange(storageKey, e.target.value)}
        placeholder={placeholder}
        className="font-mono text-xs"
      />
    </div>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {profile.auth.urlStorageKey &&
        field(
          profile.auth.urlStorageKey,
          profile.auth.urlLabel ?? 'URL du service d’authentification',
          profile.auth.urlPlaceholder
        )}

      {profile.auth.requiresKey &&
        profile.auth.keyStorageKey &&
        field(
          profile.auth.keyStorageKey,
          profile.auth.keyLabel ?? 'Clé',
          '••••••••••••',
          'password'
        )}

      {profile.auth.extraFields?.map((extra) =>
        field(`VITE_KEYCLOAK_${extra.key.toUpperCase()}`, extra.label, extra.placeholder)
      )}

      {!profile.data.inheritFromAuth &&
        profile.data.urlStorageKey &&
        field(
          profile.data.urlStorageKey,
          profile.data.urlLabel ?? 'URL de données',
          profile.data.urlPlaceholder
        )}

      {!profile.storage.inheritFromAuth &&
        profile.storage.urlStorageKey &&
        field(
          profile.storage.urlStorageKey,
          profile.storage.urlLabel ?? 'Endpoint de stockage',
          profile.storage.urlPlaceholder
        )}

      {profile.storage.requiresKey &&
        profile.storage.keyStorageKey &&
        field(
          profile.storage.keyStorageKey,
          profile.storage.keyLabel ?? 'Access Key',
          undefined,
          'password'
        )}

      {profile.storage.requiresSecret &&
        profile.storage.secretStorageKey &&
        field(
          profile.storage.secretStorageKey,
          profile.storage.secretLabel ?? 'Secret Key',
          undefined,
          'password'
        )}
    </div>
  );
}

export default function DeploymentProfileSelector() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useHexagonalAuth();

  const [profiles] = useState<DeploymentProfile[]>(() => listProfiles());
  const [selectedProfile, setSelectedProfile] = useState<DeploymentProfile | null>(null);
  const [activeProfile, setActiveProfileState] = useState<DeploymentProfile | null>(null);
  const [draftConfig, setDraftConfig] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const active = await getActiveProfile();
        const config = await getProfileCustomConfig(active.id);
        if (cancelled) return;
        setActiveProfileState(active);
        setSelectedProfile(active);
        setDraftConfig(config);
      } catch (err) {
        if (!cancelled) {
          toast({
            title: 'Erreur de chargement',
            description: err instanceof Error ? err.message : 'Erreur inconnue',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleSelect = async (profile: DeploymentProfile) => {
    setSelectedProfile(profile);
    setDraftConfig(await getProfileCustomConfig(profile.id));
  };

  const handleFieldChange = (key: string, value: string) => {
    setDraftConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!selectedProfile) return;
    setIsSaving(true);
    try {
      await setProfileCustomConfig(selectedProfile.id, draftConfig);
      await setActiveProfile(selectedProfile.id);
      invalidateProfileCache();

      toast({
        title: 'Profil activé',
        description: `Profil « ${selectedProfile.label} » activé. Déconnexion en cours…`,
      });

      await signOut();
      navigate('/auth', { replace: true });
    } catch (err) {
      setIsSaving(false);
      toast({
        title: "Erreur d'enregistrement",
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement de la configuration…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium">Changement global et immédiat</p>
          <p className="text-muted-foreground">
            Modifier le profil affecte tous les utilisateurs. Vous serez déconnecté et devrez vous
            reconnecter après le changement.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil de déploiement</CardTitle>
          <CardDescription>
            Choisissez l'architecture backend utilisée par l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfile?.id;
            const isSelected = profile.id === selectedProfile?.id;
            return (
              <button
                type="button"
                key={profile.id}
                onClick={() => handleSelect(profile)}
                aria-pressed={isSelected}
                className={`rounded-lg border-2 p-3 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span aria-hidden className="text-2xl leading-none">
                    {profile.icon}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{profile.label}</span>
                      {profile.recommended && <Badge variant="default">Recommandé</Badge>}
                      {isActive && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Actif
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{profile.description}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {profile.difficulty}
                    </Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {selectedProfile && selectedProfile.requiredEnvVars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration : {selectedProfile.label}</CardTitle>
            <CardDescription>
              Renseignez les paramètres de connexion pour ce profil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileConfigFields
              profile={selectedProfile}
              values={draftConfig}
              onChange={handleFieldChange}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          disabled={isSaving}
          onClick={() => {
            setSelectedProfile(activeProfile);
            if (activeProfile) {
              getProfileCustomConfig(activeProfile.id).then(setDraftConfig);
            }
          }}
        >
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={isSaving || !selectedProfile}>
          {isSaving ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            'Enregistrer et activer'
          )}
        </Button>
      </div>
    </div>
  );
}
