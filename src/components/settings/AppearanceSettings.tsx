/**
 * AppearanceSettings — onglet « Apparence » : galerie de thèmes (référentiel UI_THEMES)
 * et identité de marque paramétrable (référentiel BRANDING_PROFILES + surcharges).
 * Purement présentation : délègue au UiThemeContext.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, Moon, RotateCcw, Sun } from 'lucide-react';
import { useUiTheme } from '@/contexts/UiThemeContext';
import { BrandBandsBackground, BrandIdentity } from '@/components/branding/BrandIdentity';
import { useOwnerOrganization } from '@/hooks/useOwnerOrganization';
import { cn } from '@/lib/utils';

export const AppearanceSettings: React.FC = () => {
  const {
    themes,
    themeId,
    setThemeId,
    darkMode,
    toggleDarkMode,
    branding,
    brandingId,
    brandingProfiles,
    setBrandingId,
    brandingOverrides,
    setBrandingOverrides,
    resetBrandingOverrides,
  } = useUiTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thème de l'application</CardTitle>
          <CardDescription>
            Palettes définies dans le référentiel des thèmes UI. Aucun impact fonctionnel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {themes.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setThemeId(entry.id)}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/10',
                  entry.id === themeId ? 'border-primary ring-1 ring-primary' : 'border-border',
                )}
              >
                <span className="mt-1 flex gap-1">
                  {[entry.preview.primary, entry.preview.accent, entry.preview.background].map((c) => (
                    <span
                      key={c}
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${c})` }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {entry.label}
                    {entry.id === themeId && <Check className="h-3.5 w-3.5 text-primary" />}
                  </span>
                  <span className="block text-xs text-muted-foreground">{entry.description}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm">
              {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>Mode sombre</span>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} aria-label="Mode sombre" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identité du client</CardTitle>
          <CardDescription>
            Profil d'identité (sceau, organisation propriétaire, bandeaux). Multi-clients : chaque profil
            provient du référentiel, les champs ci-dessous permettent de le personnaliser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branding-profile">Profil d'identité</Label>
            <Select value={brandingId} onValueChange={setBrandingId}>
              <SelectTrigger id="branding-profile">
                <SelectValue placeholder="Choisir un profil" />
              </SelectTrigger>
              <SelectContent>
                {brandingProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="owner-name">Organisation propriétaire</Label>
              <Input
                id="owner-name"
                value={brandingOverrides.ownerName ?? ''}
                placeholder={ownerOrganization?.name ?? branding.ownerName}
                onChange={(e) => setBrandingOverrides({ ownerName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-subtitle">Sous-titre</Label>
              <Input
                id="owner-subtitle"
                value={brandingOverrides.ownerSubtitle ?? ''}
                placeholder={ownerOrganization?.description ?? branding.ownerSubtitle ?? '—'}
                onChange={(e) => setBrandingOverrides({ ownerSubtitle: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="seal-url">URL du sceau / logo</Label>
              <Input
                id="seal-url"
                value={brandingOverrides.sealUrl ?? ''}
                placeholder={branding.sealUrl ?? 'https://…'}
                onChange={(e) => setBrandingOverrides({ sealUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Afficher le sceau</span>
              <Switch
                checked={branding.showSeal}
                onCheckedChange={(v) => setBrandingOverrides({ showSeal: v })}
                aria-label="Afficher le sceau"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Afficher les bandeaux</span>
              <Switch
                checked={branding.showBands}
                onCheckedChange={(v) => setBrandingOverrides({ showBands: v })}
                aria-label="Afficher les bandeaux"
              />
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary">Aperçu</Badge>
            </div>
            <div className="relative isolate overflow-hidden rounded-md p-3">
              <BrandBandsBackground />
              <BrandIdentity size="md" withBands />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={resetBrandingOverrides} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser les personnalisations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppearanceSettings;
