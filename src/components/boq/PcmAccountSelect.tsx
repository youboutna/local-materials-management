/**
 * PcmAccountSelect — sélecteur de compte du Plan Comptable Mauritanien (PCM × CGI)
 * avec recherche fr / ar / code, utilisable directement dans les lignes de DQE,
 * devis et factures.
 *
 * Doctrine : le référentiel `pcm-cgi.referential` est la seule source des comptes ;
 * seul le `code` est persisté sur la ligne (`accountCode`).
 */
import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  PCM_CGI_ACCOUNTS,
  getPcmCgiTreatment,
  resolvePcmCgiAccount,
  type PcmCgiAccount,
} from '@/config/referentials/fiscal/pcm-cgi.referential';

const MAX_RESULTS = 60;

const normalize = (v: string) =>
  v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function search(query: string, statement?: PcmCgiAccount['statement']): PcmCgiAccount[] {
  const base = statement ? PCM_CGI_ACCOUNTS.filter((a) => a.statement === statement) : PCM_CGI_ACCOUNTS;
  const q = normalize(query.trim());
  if (!q) return base.slice(0, MAX_RESULTS);
  const out: PcmCgiAccount[] = [];
  for (const a of base) {
    if (
      a.code.includes(q) ||
      (a.odooCode ?? '').includes(q) ||
      normalize(a.labelFr).includes(q) ||
      a.labelAr.includes(query.trim())
    ) {
      out.push(a);
      if (out.length >= MAX_RESULTS) break;
    }
  }
  return out;
}

interface Props {
  value?: string | null;
  onChange: (code: string | null) => void;
  lang?: 'fr' | 'ar' | 'en';
  disabled?: boolean;
  className?: string;
  /** Restreint la recherche à un état comptable (BILAN / CPC / ANALYTIQUE). */
  statement?: PcmCgiAccount['statement'];
  placeholder?: string;
}

export const PcmAccountSelect: React.FC<Props> = ({
  value,
  onChange,
  lang = 'fr',
  disabled,
  className,
  statement,
  placeholder = 'Compte PCM…',
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const results = React.useMemo(() => search(query, statement), [query, statement]);
  const selected = React.useMemo(() => resolvePcmCgiAccount(value), [value]);
  const labelOf = (a: PcmCgiAccount) => (lang === 'ar' ? a.labelAr || a.labelFr : a.labelFr);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn('h-8 w-full justify-between px-2 text-xs font-normal', className)}
          title={selected ? `${selected.code} — ${labelOf(selected)}` : placeholder}
        >
          <span className="truncate">
            {selected ? `${selected.code} · ${labelOf(selected)}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-2" align="start">
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un compte (code, fr, عربي)…"
          className="h-8 text-xs"
        />
        <div className="mt-2 max-h-72 overflow-y-auto">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
            onClick={() => { onChange(null); setOpen(false); }}
          >
            <span className="text-muted-foreground">— Aucune imputation —</span>
          </button>
          {results.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground">Aucun compte trouvé</div>
          )}
          {results.map((a) => {
            const vat = getPcmCgiTreatment(a.code, 'TVA');
            return (
              <button
                key={a.code}
                type="button"
                className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
                onClick={() => { onChange(a.code); setOpen(false); }}
              >
                {value === a.code ? <Check className="mt-0.5 h-3 w-3 shrink-0" /> : <span className="w-3 shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{a.code}</span> · {labelOf(a)}
                  <span className="block truncate text-[11px] text-muted-foreground" dir={lang === 'ar' ? 'ltr' : undefined}>
                    {lang === 'ar' ? a.labelFr : a.labelAr}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant="outline" className="text-[10px]">{a.statement}</Badge>
                  {vat ? (
                    <Badge variant={vat.qualification === 'Exonéré' ? 'secondary' : 'outline'} className="text-[10px]">
                      {vat.qualification}
                    </Badge>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
          Référentiel PCM × CGI ({PCM_CGI_ACCOUNTS.length} comptes) — harmonisé LFR 2026.
        </p>
      </PopoverContent>
    </Popover>
  );
};
