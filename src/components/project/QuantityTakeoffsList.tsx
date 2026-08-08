import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Calculator, Save, DownloadCloud } from 'lucide-react';
import { QuantityTakeoffWithDetails } from '@/dtos/types/quantityTakeoff';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { usePagination } from '@/hooks/usePagination';
import { useQuantityTakeoffsHex } from '@/hooks/hexagonal';

interface QuantityTakeoffsListProps {
  projectId: string;
}

interface RowDraft { quantity: number; unit_price: number; dirty: boolean }

const QuantityTakeoffsList = ({ projectId }: QuantityTakeoffsListProps) => {
  const {
    quantityTakeoffs,
    isLoading,
    deleteMutation,
    updateMutation,
    getTotalQuantityByUnit,
    getTotalValue,
  } = useQuantityTakeoffsHex(projectId);

  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});

  useEffect(() => {
    if (!quantityTakeoffs) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const t of quantityTakeoffs as QuantityTakeoffWithDetails[]) {
        if (!next[t.id] || !next[t.id].dirty) {
          next[t.id] = {
            quantity: Number(t.quantity ?? 0),
            unit_price: Number((t as { unit_price?: number }).unit_price ?? t.material?.price_per_unit ?? 0),
            dirty: false,
          };
        }
      }
      return next;
    });
  }, [quantityTakeoffs]);

  const {
    currentData: paginatedTakeoffs,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage,
  } = usePagination({ data: (quantityTakeoffs as QuantityTakeoffWithDetails[]) || [], itemsPerPage: 10 });

  const patchDraft = (id: string, patch: Partial<RowDraft>) =>
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch, dirty: true } }));

  const pullFromDepot = (t: QuantityTakeoffWithDetails) => {
    const pu = Number(t.material?.price_per_unit ?? 0);
    if (!pu) return;
    patchDraft(t.id, { unit_price: pu });
  };

  const save = (id: string) => {
    const d = drafts[id];
    if (!d) return;
    updateMutation.mutate(
      { id, quantity: d.quantity, unit_price: d.unit_price },
      { onSuccess: () => setDrafts((p) => ({ ...p, [id]: { ...p[id], dirty: false } })) },
    );
  };

  const handleDelete = async (id: string) => {
    try { await deleteMutation.mutateAsync(id); } catch (e) { console.error(e); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Liste des Métrés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {paginatedTakeoffs.map((takeoff) => {
            const d = drafts[takeoff.id] ?? { quantity: takeoff.quantity, unit_price: (takeoff as { unit_price?: number }).unit_price ?? takeoff.material?.price_per_unit ?? 0, dirty: false };
            const depotPrice = Number(takeoff.material?.price_per_unit ?? 0);
            const total = (d.quantity || 0) * (d.unit_price || 0);
            return (
              <div key={takeoff.id} className="border rounded-lg p-3 flex flex-wrap items-center gap-3">
                <div className="min-w-[180px] flex-1">
                  <div className="font-semibold">{takeoff.material?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {takeoff.material?.unit ?? 'unité'} · dépôt : {depotPrice ? `${depotPrice.toLocaleString('fr-FR')} MRU` : '—'}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-muted-foreground">Quantité</label>
                  <Input
                    type="number"
                    className="h-8 w-24"
                    value={d.quantity}
                    onChange={(e) => patchDraft(takeoff.id, { quantity: Number(e.target.value) })}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] text-muted-foreground">PU (MRU)</label>
                  <Input
                    type="number"
                    className="h-8 w-28"
                    value={d.unit_price}
                    onChange={(e) => patchDraft(takeoff.id, { unit_price: Number(e.target.value) })}
                  />
                </div>

                <div className="min-w-[110px] text-right">
                  <div className="text-[10px] text-muted-foreground">Total</div>
                  <div className="font-semibold">{total.toLocaleString('fr-FR')} MRU</div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">{takeoff.material?.category}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    title="Récupérer PU depuis dépôt matériaux"
                    disabled={!depotPrice}
                    onClick={() => pullFromDepot(takeoff)}
                  >
                    <DownloadCloud className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={d.dirty ? 'default' : 'outline'}
                    disabled={!d.dirty || updateMutation.isPending}
                    onClick={() => save(takeoff.id)}
                    title="Enregistrer"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(takeoff.id)}
                    disabled={deleteMutation.isPending}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {paginatedTakeoffs.length === 0 && (
            <div className="text-center py-8">
              <Calculator className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-600 mt-2">Aucun métré trouvé pour ce projet</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="font-medium">Total par unité</h5>
              <div className="space-y-2">
                {['m', 'm²', 'm³', 'kg', 't', 'ml'].map((unit) => {
                  const quantity = getTotalQuantityByUnit(unit);
                  return (
                    <div key={unit} className="flex justify-between">
                      <span className="text-sm">{unit}:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {(() => {
              const totalHt = getTotalValue();
              const profile = { vatRate: 0.16, withholdingRate: 0.03 };
              const tva = totalHt * profile.vatRate;
              const ttc = totalHt + tva;
              const ras = totalHt * profile.withholdingRate;
              return (
                <div className="md:col-span-2">
                  <h5 className="font-medium">Valeur totale (fiscalité MR)</h5>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div className="flex justify-between"><span>Total HT</span><span className="font-semibold">{totalHt.toLocaleString('fr-FR')} MRU</span></div>
                    <div className="flex justify-between"><span>TVA 16%</span><span>{tva.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MRU</span></div>
                    <div className="flex justify-between"><span>RAS BIC 3%</span><span className="text-destructive">-{ras.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MRU</span></div>
                    <div className="flex justify-between border-t pt-1"><span className="font-medium">Total TTC</span><span className="font-bold text-green-600">{ttc.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MRU</span></div>
                  </div>
                </div>
              );
            })()}
          </div>


          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={goToPage}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default QuantityTakeoffsList;
