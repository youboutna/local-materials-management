/**
 * PriceSummary — displays Qty × PU = HT + VAT + TTC. Format FR.
 */
interface Props {
  quantity: number;
  unitPrice?: number | null;
  vatRate?: number | null;
}

const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MRU', maximumFractionDigits: 0 }).format(n);

export function PriceSummary({ quantity, unitPrice, vatRate = 0 }: Props) {
  const pu = unitPrice ?? 0;
  const ht = quantity * pu;
  const vat = ht * (vatRate ?? 0);
  const ttc = ht + vat;
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm grid grid-cols-4 gap-3">
      <div><div className="text-muted-foreground">Quantité</div><div className="font-medium">{quantity}</div></div>
      <div><div className="text-muted-foreground">PU</div><div className="font-medium">{fmt(pu)}</div></div>
      <div><div className="text-muted-foreground">HT</div><div className="font-medium">{fmt(ht)}</div></div>
      <div><div className="text-muted-foreground">TTC ({Math.round((vatRate ?? 0) * 100)}% TVA)</div><div className="font-semibold">{fmt(ttc)}</div></div>
    </div>
  );
}
