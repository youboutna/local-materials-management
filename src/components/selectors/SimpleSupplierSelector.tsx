import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Supplier {
  id: string;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  category?: string | null;
  rating?: number | null;
  is_active: boolean | null;
}

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
  placeholder = "Sélectionner un fournisseur",
  disabled = false,
  label
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async (): Promise<Supplier[]> => {
      let query = supabase
        .from('suppliers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const selectedSupplier = suppliers?.find(s => s.id === value);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-xs ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
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
          value={value || ''} 
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder}>
              {selectedSupplier && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{selectedSupplier.name}</span>
                  {selectedSupplier.category && (
                    <Badge variant="outline" className="text-xs">
                      {selectedSupplier.category}
                    </Badge>
                  )}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {suppliers?.map((supplier) => (
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
          </SelectContent>
        </Select>
      )}

      {selectedSupplier && (
        <div className="text-xs text-muted-foreground">
          Sélectionné: {selectedSupplier.name}
          {selectedSupplier.contact_person && ` - Contact: ${selectedSupplier.contact_person}`}
        </div>
      )}
    </div>
  );
};

export default SimpleSupplierSelector;