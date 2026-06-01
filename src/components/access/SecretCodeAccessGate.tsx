/**
 * SecretCodeAccessGate
 * Unified gated entry point used by /supplier-access (document download)
 * and /evaluation-access (submission evaluation). Replaces the duplicate
 * Lock/Input/Validate UI that previously lived in two near-identical pages.
 *
 * - No `supabase.from()` here. Validation is delegated to the caller through
 *   `onValidate`, which returns a normalized `GateValidationResult`.
 * - The unlocked panel is rendered by the caller (`renderUnlocked`), so this
 *   component stays purely presentational and reusable.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface GateValidationResult {
  isValid: boolean;
  message?: string;
  /** Free-form payload the caller's renderUnlocked uses to render its panel. */
  payload?: Record<string, unknown>;
}

export interface SecretCodeAccessGateProps {
  /** Title shown in the hero. */
  title: string;
  /** Subtitle under the title. */
  subtitle: string;
  /** Card title for the code form. */
  formTitle?: string;
  /** Card description for the code form. */
  formDescription?: string;
  /** Placeholder text inside the code input. */
  placeholder?: string;
  /** Validate button label. */
  submitLabel?: string;
  /** Maximum code length (defaults to 14 for XXXX-XXXX-XXXX). */
  maxLength?: number;
  /** If true, the input is auto-formatted as XXXX-XXXX-XXXX. */
  formatHyphenated?: boolean;
  /** Async validator. Receives normalized (uppercase) code. */
  onValidate: (normalizedCode: string) => Promise<GateValidationResult>;
  /** Renders the post-validation UI. */
  renderUnlocked: (result: GateValidationResult, reset: () => void) => React.ReactNode;
  /** Optional regulatory notice rendered under the form. */
  regulatoryNotice?: React.ReactNode;
}

const formatHyphenatedCode = (value: string): string => {
  const cleaned = value.replace(/[^A-Z0-9]/g, '');
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length && i < 12; i += 4) {
    parts.push(cleaned.substring(i, i + 4));
  }
  return parts.join('-');
};

export const SecretCodeAccessGate: React.FC<SecretCodeAccessGateProps> = ({
  title,
  subtitle,
  formTitle = 'Code Secret d\'Accès',
  formDescription = 'Entrez le code secret qui vous a été fourni',
  placeholder = 'XXXX-XXXX-XXXX',
  submitLabel = 'Valider le Code',
  maxLength = 14,
  formatHyphenated = true,
  onValidate,
  renderUnlocked,
  regulatoryNotice,
}) => {
  const [secretCode, setSecretCode] = useState('');
  const [result, setResult] = useState<GateValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const reset = () => {
    setSecretCode('');
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = secretCode.trim().toUpperCase();
    if (normalized.replace(/-/g, '').length < 6) {
      setResult({ isValid: false, message: 'Le code doit contenir au moins 6 caractères.' });
      return;
    }
    setIsValidating(true);
    try {
      const r = await onValidate(normalized);
      setResult(r);
    } catch {
      setResult({ isValid: false, message: 'Erreur de connexion au serveur.' });
    } finally {
      setIsValidating(false);
    }
  };

  if (result?.isValid) {
    return <>{renderUnlocked(result, reset)}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">{formTitle}</CardTitle>
            <CardDescription>{formDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="secret-code" className="text-base font-medium">
                  Code Secret
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="secret-code"
                    type="text"
                    placeholder={placeholder}
                    value={secretCode}
                    onChange={(e) => {
                      const upper = e.target.value.toUpperCase();
                      setSecretCode(formatHyphenated ? formatHyphenatedCode(upper) : upper);
                    }}
                    className="pl-10 text-lg font-mono tracking-wider uppercase"
                    maxLength={maxLength}
                    autoComplete="off"
                    disabled={isValidating}
                  />
                </div>
              </div>

              {result && !result.isValid && (
                <Alert className="border-destructive bg-destructive/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <AlertDescription className="font-medium">
                      {result.message ?? 'Code invalide.'}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isValidating}>
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Vérification...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    {submitLabel}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {regulatoryNotice && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">{regulatoryNotice}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SecretCodeAccessGate;
