
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
  contact_person?: string;
  phone?: string;
  email?: string;
  category?: string;
  rating?: number;
  is_active: boolean;
}

interface SupplierSelectorProps {
  value?: {
    id?: string;
    name?: string;
    contact?: string;
    leadTime?: number;
  };
  onChange: (supplier: {
    id?: string;
    name: string;
    contact: string;
    leadTime: number;
  }) => void;
  allowCustom?: boolean;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  value,
  onChange,
  allowCustom = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustom, setIsCustom] = useState(!value?.id);
  const [customSupplier, setCustomSupplier] = useState({
    name: value?.name || '',
    contact: value?.contact || '',
    leadTime: value?.leadTime || 7
  });

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

  const handleSupplierSelect = (supplierId: string) => {
    if (supplierId === 'custom') {
      setIsCustom(true);
      onChange({
        name: customSupplier.name,
        contact: customSupplier.contact,
        leadTime: customSupplier.leadTime
      });
      return;
    }

    const supplier = suppliers?.find(s => s.id === supplierId);
    if (supplier) {
      setIsCustom(false);
      onChange({
        id: supplier.id,
        name: supplier.name,
        contact: supplier.contact_person || supplier.phone || supplier.email || '',
        leadTime: 7 // Default lead time
      });
    }
  };

  const handleCustomSupplierChange = (field: string, value: any) => {
    const updated = { ...customSupplier, [field]: value };
    setCustomSupplier(updated);
    onChange({
      name: updated.name,
      contact: updated.contact,
      leadTime: updated.leadTime
    });
  };

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
    <div className="space-y-4">
      <div>
        <Label>Fournisseur</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un fournisseur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <Select 
          value={isCustom ? 'custom' : value?.id || ''} 
          onValueChange={handleSupplierSelect}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un fournisseur" />
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
            {allowCustom && (
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Autre fournisseur (saisie manuelle)</span>
                </div>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}

      {isCustom && (
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <div>
            <Label htmlFor="supplierName">Nom du fournisseur</Label>
            <Input
              id="supplierName"
              value={customSupplier.name}
              onChange={(e) => handleCustomSupplierChange('name', e.target.value)}
              placeholder="Nom du fournisseur"
            />
          </div>
          
          <div>
            <Label htmlFor="supplierContact">Contact</Label>
            <Input
              id="supplierContact"
              value={customSupplier.contact}
              onChange={(e) => handleCustomSupplierChange('contact', e.target.value)}
              placeholder="Téléphone ou email"
            />
          </div>
          
          <div>
            <Label htmlFor="leadTime">Délai de livraison (jours)</Label>
            <Input
              id="leadTime"
              type="number"
              min="1"
              value={customSupplier.leadTime}
              onChange={(e) => handleCustomSupplierChange('leadTime', parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierSelector;
