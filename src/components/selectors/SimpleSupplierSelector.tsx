import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSuppliersSelector } from '@/hooks/hexagonal'

interface SimpleSupplierSelectorProps {
  value?: string;
  onChange: (supplierId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

const SimpleSupplierSelector: React.FC<SimpleSupplierSelectorProps> = ({
  value,
  onChange,
  placeholder = "SÃ©lectionner un fournisseur",
  disabled = false,
  label
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: suppliers, isLoading } = useSuppliersSelector(searchTerm);

  const selectedSupplier = suppliers?.find(s => s.id === value);
  
  // 🔧 Debug: Log supplier selection issues
  useEffect(() => {
    if (value && suppliers && suppliers.length > 0) {
      const found = suppliers.find(s => s.id === value);
      if (!found) {
        console.warn('Fournisseur inconnu - ID non trouvé:', {
          searchedId: value,
          availableIds: suppliers.map(s => s.id),
          availableNames: suppliers.map(s => ({ id: s.id, name: s.name }))
        });
      }
    }
  }, [value, suppliers]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-xs ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        â˜…
      </span>
    ));
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <Input
          placeholder="Rechercher un fournisseur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <Select 
          value={value || undefined} 
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder}>
              {selectedSupplier ? (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedSupplier.name}</span>
                  {selectedSupplier.category && (
                    <Badge variant="outline" className="text-xs">
                      {selectedSupplier.category}
                    </Badge>
                  )}
                </div>
              ) : value ? (
                <div className="flex items-center gap-2 text-orange-600">
                  <Building2 className="h-4 w-4" />
                  <span>Fournisseur sÃ©lectionnÃ© (ID: {value})</span>
                </div>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {suppliers?.filter(s => s.id && s.id.trim() !== '').map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      {supplier.contact_person && (
                        <div className="text-xs text-gray-500">{supplier.contact_person}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {supplier.category && (
                      <Badge variant="outline" className="text-xs">
                        {supplier.category}
                      </Badge>
                    )}
                    {supplier.rating && (
                      <div className="flex">
                        {renderStars(supplier.rating)}
                      </div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
            {(!suppliers || suppliers.filter(s => s.id && s.id.trim() !== '').length === 0) && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                Aucun fournisseur trouvÃ©
              </div>
            )}
          </SelectContent>
        </Select>
      )}

      {selectedSupplier && (
        <div className="text-xs text-muted-foreground">
          SÃ©lectionnÃ©: {selectedSupplier.name}
          {selectedSupplier.contact_person && ` - Contact: ${selectedSupplier.contact_person}`}
        </div>
      )}
    </div>
  );
};

export default SimpleSupplierSelector;
