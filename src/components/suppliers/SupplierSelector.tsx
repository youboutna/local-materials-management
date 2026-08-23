import React, { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Search, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSuppliersSelector } from '@/hooks/hexagonal';
import { T } from '@/components/i18n/T';

export interface SupplierSelectorValue {
  id?: string;
  name?: string;
  contact?: string;
  leadTime?: number;
}

interface SupplierSelectorProps {
  value?: SupplierSelectorValue;
  onChange: (supplier: { id?: string; name: string; contact: string; leadTime: number }) => void;
  allowCustom?: boolean;
  disabled?: boolean;
  /** Liste préchargée (page Matériaux). Sinon le hook interne prend le relais. */
  suppliers?: readonly unknown[];
}

const CUSTOM_OPTION = 'custom';

const SupplierSelector = React.forwardRef<HTMLDivElement, SupplierSelectorProps>(({
  value,
  onChange,
  allowCustom = true,
  disabled = false,
  suppliers: passedSuppliers,
}, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customSupplier, setCustomSupplier] = useState({
    name: value?.name || '',
    contact: value?.contact || '',
    leadTime: value?.leadTime ?? 7,
  });

  const { data: hookSuppliers, isLoading: hookLoading } = useSuppliersSelector(searchTerm);

  const allSuppliers = (passedSuppliers ?? hookSuppliers ?? []) as Array<Record<string, any>>;
  const isLoading = passedSuppliers ? false : hookLoading;

  // La liste préchargée n'est pas filtrée côté serveur : on filtre localement.
  const suppliers = useMemo(() => {
    if (!passedSuppliers || !searchTerm.trim()) return allSuppliers;
    const q = searchTerm.trim().toLowerCase();
    return allSuppliers.filter((s) =>
      [s.name, s.contact_person, s.email, s.category]
        .filter(Boolean)
        .some((f: string) => String(f).toLowerCase().includes(q))
    );
  }, [allSuppliers, passedSuppliers, searchTerm]);

  // Synchronisation avec les données chargées de façon asynchrone (mode édition).
  useEffect(() => {
    if (value?.id) {
      setIsCustom(false);
      return;
    }
    if (value?.name) {
      setIsCustom(true);
      setCustomSupplier({
        name: value.name,
        contact: value.contact || '',
        leadTime: value.leadTime ?? 7,
      });
    }
  }, [value?.id, value?.name, value?.contact, value?.leadTime]);

  const handleSupplierSelect = (supplierId: string) => {
    if (supplierId === CUSTOM_OPTION) {
      setIsCustom(true);
      onChange({
        name: customSupplier.name,
        contact: customSupplier.contact,
        leadTime: customSupplier.leadTime,
      });
      return;
    }

    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;

    setIsCustom(false);
    onChange({
      id: supplier.id as string,
      name: (supplier.name as string) || '',
      contact: (supplier.contact_person || supplier.phone || supplier.email || '') as string,
      leadTime: (supplier.lead_time_days as number) ?? value?.leadTime ?? 7,
    });
  };

  const handleCustomSupplierChange = (field: 'name' | 'contact' | 'leadTime', val: string | number) => {
    const updated = { ...customSupplier, [field]: val };
    setCustomSupplier(updated);
    onChange({
      name: updated.name,
      contact: updated.contact,
      leadTime: updated.leadTime,
    });
  };

  const renderStars = (rating: number) => (
    <span className="flex items-center" aria-label={`Note ${rating} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < rating ? 'fill-secondary text-secondary' : 'text-muted-foreground/40'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );

  return (
    <div ref={ref} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="supplierSearch"><T k="auto.supplierselector.fournisseur" fallback="Fournisseur" /></Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="supplierSearch"
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4" role="status" aria-live="polite">
          <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="sr-only">Chargement des fournisseurs…</span>
        </div>
      ) : (
        <Select
          value={isCustom ? CUSTOM_OPTION : value?.id || ''}
          onValueChange={handleSupplierSelect}
          disabled={disabled}
        >
          <SelectTrigger aria-label="Sélectionner un fournisseur">
            <SelectValue placeholder="Sélectionner un fournisseur" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.length === 0 && !allowCustom && (
              <div className="px-3 py-2 text-sm text-muted-foreground"><T k="auto.supplierselector.aucun_fournisseur_disponible" fallback="Aucun fournisseur disponible" /></div>
            )}
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id as string} value={supplier.id as string}>
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                    <div>
                      <div className="font-medium">{supplier.name as string}</div>
                      {supplier.contact_person && (
                        <div className="text-xs text-muted-foreground">{supplier.contact_person as string}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {supplier.category && (
                      <Badge variant="outline" className="text-xs">{supplier.category as string}</Badge>
                    )}
                    {typeof supplier.rating === 'number' && renderStars(supplier.rating as number)}
                  </div>
                </div>
              </SelectItem>
            ))}
            {allowCustom && (
              <SelectItem value={CUSTOM_OPTION}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  <span><T k="auto.supplierselector.autre_fournisseur_saisie_manuelle" fallback="Autre fournisseur (saisie manuelle)" /></span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}

      {isCustom && (
        <div className="space-y-3 p-4 border rounded-lg bg-surface-muted">
          <div className="space-y-1.5">
            <Label htmlFor="supplierName"><T k="auto.supplierselector.nom_du_fournisseur" fallback="Nom du fournisseur" /></Label>
            <Input
              id="supplierName"
              value={customSupplier.name}
              disabled={disabled}
              onChange={(e) => handleCustomSupplierChange('name', e.target.value)}
              placeholder="Nom du fournisseur"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplierContact"><T k="auto.supplierselector.contact" fallback="Contact" /></Label>
            <Input
              id="supplierContact"
              value={customSupplier.contact}
              disabled={disabled}
              onChange={(e) => handleCustomSupplierChange('contact', e.target.value)}
              placeholder="Téléphone ou email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leadTime"><T k="auto.supplierselector.delai_de_livraison_jours" fallback="Délai de livraison (jours)" /></Label>
            <Input
              id="leadTime"
              type="number"
              min={1}
              disabled={disabled}
              value={customSupplier.leadTime}
              onChange={(e) => handleCustomSupplierChange('leadTime', parseInt(e.target.value, 10) || 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
});
SupplierSelector.displayName = 'SupplierSelector';

export default SupplierSelector;
