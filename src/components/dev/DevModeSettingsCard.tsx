/**
 * DevModeSettingsCard — bloc DEV/API, exclusivement affiché dans /settings.
 * Aucune logique métier locale : tout passe par useDevModeSettingsHex.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, LogOut, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TranslatedRole } from '@/components/i18n/TranslatedBadges';
import { useDevModeSettingsHex } from '@/hooks/hexagonal/useDevModeSettingsHex';
import { useToast } from '@/hooks/use-toast';

const DevModeSettingsCard: React.FC = () => {
  const {
    state,
    isAuthenticated,
    isSwitching,
    switchToLocal,
    switchToApi,
    canManageDevMode,
    setDevModeEnabled,
  } = useDevModeSettingsHex();
  const { toast } = useToast();

  // Le mode DEV est une responsabilité administrateur : rien n'est visible ailleurs.
  if (!canManageDevMode) return null;

  const handleToggle = async (enabled: boolean) => {
    try {
      await setDevModeEnabled(enabled);
    } catch (error) {
      toast({
        title: 'Modification refusée',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  const handleLocal = async (roleCode: string) => {
    try {
      await switchToLocal(roleCode);
      toast({ title: 'Rôle DEV activé', description: `${roleCode} — permissions rechargées` });
    } catch (error) {
      toast({
        title: 'Bascule impossible',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="mb-8 border-warning/30 bg-warning/10">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Mode développement
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={state.mode === 'LOCAL' ? 'secondary' : 'default'}>
              {state.mode === 'LOCAL' ? 'SESSION LOCALE (DEV)' : 'SESSION API'}
            </Badge>
            <Badge variant="outline">adapter: {state.adapter}</Badge>
            {state.activeRole && (
              <Badge variant="outline">
                <TranslatedRole code={state.activeRole.toLowerCase()} />
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Outil de test des permissions : bascule instantanée entre profils locaux ou retour à une
          session API réelle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-background/60 p-3">
          <div className="min-w-0">
            <Label htmlFor="dev-mode-toggle" className="font-medium">
              Activer le mode développement
            </Label>
            <p className="text-xs text-muted-foreground">
              Réglage administrateur persisté en base ({state.devModeSource === 'ADMIN' ? 'override administrateur' : 'valeur de configuration'}).
            </p>
          </div>
          <Switch
            id="dev-mode-toggle"
            checked={state.devModeEnabled}
            disabled={isSwitching}
            onCheckedChange={handleToggle}
          />
        </div>

        {!state.devModeEnabled && (
          <p className="text-sm text-muted-foreground">
            Mode développement désactivé : l'application utilise exclusivement la session API réelle.
          </p>
        )}

        <div hidden={!state.devModeEnabled} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {state.availableRoles.map((role) => {
            const isActive = state.activeRole === role.code && state.mode === 'LOCAL';
            return (
              <Button
                key={role.code}
                variant={isActive ? 'default' : 'outline'}
                disabled={isSwitching}
                className="h-auto justify-start gap-2 py-2 text-left"
                onClick={() => handleLocal(role.code)}
              >
                <span className="flex-1">
                  <span className="block font-medium">
                    <TranslatedRole code={role.code.toLowerCase()} />
                  </span>
                  <span className="block text-xs opacity-80">{role.email}</span>
                </span>
                {isActive && isAuthenticated && <Check className="h-4 w-4" />}
              </Button>
            );
          })}
        </div>

        <div hidden={!state.devModeEnabled} className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="gap-2" disabled={isSwitching} onClick={switchToApi}>
            <LogOut className="h-4 w-4" /> Session réelle (API)
          </Button>
          <p className="text-sm text-muted-foreground">
            La bascule API purge le cache local et redirige vers la connexion réelle.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DevModeSettingsCard;
