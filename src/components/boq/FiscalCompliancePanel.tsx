/**
 * FiscalCompliancePanel — aperçu fiscal temps réel (HT / TVA / RAS / TTC) et
 * contrôles LFR 2026 (NIF fournisseur, plafond espèces, seuil de facture
 * normalisée) avant génération d'un devis / d'une facture.
 *
 * Tout provient des référentiels (`lfr-2026`, `TAX_REGIMES`, PCM × CGI) via
 * `TaxService` : aucun taux ni seuil codé ici.
 */
import * as React from 'react';
import { AlertTriangle, BadgeCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TaxService } from '@/application/services/TaxService';
import { SupplierNifValidationService } from '@/application/services/SupplierNifValidationService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import {
  DEDUCTIBILITY_RULES,
  ELECTRONIC_TRANSACTION_TAX,
  FISCAL_REFERENCE,
  PAYMENT_MEANS,
  getCashDeductibleCeiling,
} from '@/config/referentials/fiscal/lfr-2026.referential';
import { formatCurrency } from '@/utils/phaseDisplayHelpers';

export interface FiscalComplianceValue {
  supplierNif?: string | null;
  supplierNifStatus?: 'active' | 'inactive' | 'unknown' | null;
  paymentMethod?: string | null;
  hasNormalizedInvoice?: boolean | null;
}

interface Props {
  lines: BoqLineDTO[];
  value: FiscalComplianceValue;
  onChange: (patch: FiscalComplianceValue) => void;
  profile?: { vatRate?: number; withholdingRate?: number } | null;
  lang?: 'fr' | 'ar' | 'en';
  disabled?: boolean;
}

export const FiscalCompliancePanel: React.FC<Props> = ({
  lines, value, onChange, profile, lang = 'fr', disabled,
}) => {
  const summary = React.useMemo(() => {
    const enriched = lines.map((l) => ({
      ...l,
      supplierNif: l.supplierNif ?? value.supplierNif ?? null,
      supplierNifStatus: l.supplierNifStatus ?? value.supplierNifStatus ?? 'unknown',
      paymentMethod: l.paymentMethod ?? value.paymentMethod ?? null,
      hasNormalizedInvoice: value.hasNormalizedInvoice ?? null,
    }));
    return TaxService.summarize(enriched, profile ?? null);
  }, [lines, value, profile]);

  const nif = React.useMemo(
    () => SupplierNifValidationService.validate(value.supplierNif, value.supplierNifStatus ?? 'unknown', lang),
    [value.supplierNif, value.supplierNifStatus, lang],
  );

  const cashCeiling = getCashDeductibleCeiling(null);
  const issues = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const i of summary.deductibilityIssues) seen.set(i.code, i.message);
    return [...seen.entries()].map(([code, message]) => ({ code, message }));
  }, [summary.deductibilityIssues]);

  return (
    <div className="space-y-3 border-b bg-muted/20 p-4">
      <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-6">
        <Stat label="Total HT" value={formatCurrency(summary.totalHt)} />
        <Stat label="TVA" value={formatCurrency(summary.totalVat)} />
        <Stat label="Total TTC" value={formatCurrency(summary.totalTtc)} />
        <Stat label="Retenues RAS" value={formatCurrency(summary.totalRas)} />
        <Stat
          label="Taxe transactions élec."
          value={formatCurrency(summary.electronicTransactionTax)}
          hint={`${(ELECTRONIC_TRANSACTION_TAX.rate * 100).toFixed(1)} % plafonné à ${ELECTRONIC_TRANSACTION_TAX.capAmount} MRU`}
        />
        <Stat label="Net à payer" value={formatCurrency(summary.netToPay)} strong />
      </div>

      {summary.buckets.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {summary.buckets.map((b) => (
            <Badge key={`${b.vatCategoryCode}-${b.vatRate}`} variant="outline" className="text-[11px]">
              TVA {(b.vatRate * 100).toFixed(0)}% ({b.vatCategoryCode}) · base {formatCurrency(b.basisAmount)} · taxe {formatCurrency(b.taxAmount)}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">NIF fournisseur</Label>
          <Input
            value={value.supplierNif ?? ''}
            disabled={disabled}
            onChange={(e) => onChange({ supplierNif: e.target.value })}
            placeholder={`${DEDUCTIBILITY_RULES.nifMinLength}–${DEDUCTIBILITY_RULES.nifMaxLength} caractères`}
            className="h-9"
          />
          {value.supplierNif ? (
            <p className={`text-[11px] ${nif.valid ? 'text-muted-foreground' : 'text-destructive'}`}>
              {nif.valid ? `NIF valide : ${nif.normalized}` : nif.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Statut du NIF</Label>
          <Select
            value={value.supplierNifStatus ?? 'unknown'}
            disabled={disabled}
            onValueChange={(v) => onChange({ supplierNifStatus: v as FiscalComplianceValue['supplierNifStatus'] })}
          >
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Actif (vérifié)</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="unknown">Non vérifié</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Moyen de paiement</Label>
          <Select
            value={value.paymentMethod ?? 'virement'}
            disabled={disabled}
            onValueChange={(v) => onChange({ paymentMethod: v })}
          >
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_MEANS.map((m) => (
                <SelectItem key={m.code} value={m.code}>{m.labels[lang]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Plafond espèces déductible : {formatCurrency(cashCeiling)}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Facture normalisée / électronique</Label>
          <Select
            value={value.hasNormalizedInvoice ? 'yes' : 'no'}
            disabled={disabled}
            onValueChange={(v) => onChange({ hasNormalizedInvoice: v === 'yes' })}
          >
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Oui — rattachée</SelectItem>
              <SelectItem value="no">Non</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Exigée au-delà de {formatCurrency(DEDUCTIBILITY_RULES.normalizedInvoiceThreshold)}
          </p>
        </div>
      </div>

      {issues.length === 0 ? (
        <Alert className="border-primary/40">
          <BadgeCheck className="h-4 w-4" />
          <AlertTitle className="text-sm">Charge déductible — conforme {FISCAL_REFERENCE.labels[lang]}</AlertTitle>
          <AlertDescription className="text-xs">
            NIF, moyen de paiement et seuil de facture conformes : le document peut être généré.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="text-sm">Non déductible — {issues.length} contrôle(s) LFR 2026 en échec</AlertTitle>
          <AlertDescription className="space-y-1 text-xs">
            {issues.map((i) => (
              <div key={i.code} className="flex items-start gap-1">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>{i.message}</span>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; hint?: string; strong?: boolean }> = ({ label, value, hint, strong }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={strong ? 'font-semibold' : 'font-medium'}>{value}</div>
    {hint ? <div className="text-[10px] text-muted-foreground">{hint}</div> : null}
  </div>
);
