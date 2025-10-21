import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface InspectorSelectorProps {
  projectId?: string;
  value?: string;
  onValueChange: (value: string, name: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

interface Inspector {
  id: string;
  name: string;
  type: 'employee' | 'supplier';
  position?: string;
  role?: string;
}

export function InspectorSelector({
  projectId,
  value,
  onValueChange,
  label = "Inspecteur",
  placeholder = "Sélectionner un inspecteur",
  className
}: InspectorSelectorProps) {
  const [open, setOpen] = useState(false);

  // Fetch inspectors from project stakeholders if projectId is provided, otherwise fetch all
  const { data: inspectors = [], isLoading } = useQuery({
    queryKey: ['inspectors', projectId],
    queryFn: async () => {
      const inspectorsList: Inspector[] = [];

      if (projectId) {
        // Fetch from project stakeholders
        const { data: stakeholders, error } = await supabase
          .from('project_stakeholders')
          .select(`
            id,
            stakeholder_type,
            stakeholder_entity_type,
            role_description,
            employee_id,
            supplier_id,
            employees:employee_id (
              id,
              full_name,
              position,
              department
            ),
            suppliers:supplier_id (
              id,
              name,
              contact_person,
              category
            )
          `)
          .eq('project_id', projectId);

        if (error) throw error;

        stakeholders?.forEach((stakeholder: any) => {
          if (stakeholder.employee_id && stakeholder.employees) {
            inspectorsList.push({
              id: stakeholder.employees.id,
              name: stakeholder.employees.full_name,
              type: 'employee',
              position: stakeholder.employees.position,
              role: stakeholder.role_description || stakeholder.stakeholder_type
            });
          } else if (stakeholder.supplier_id && stakeholder.suppliers) {
            inspectorsList.push({
              id: stakeholder.suppliers.id,
              name: stakeholder.suppliers.contact_person || stakeholder.suppliers.name,
              type: 'supplier',
              position: `Bureau d'études - ${stakeholder.suppliers.name}`,
              role: stakeholder.role_description || stakeholder.stakeholder_type
            });
          }
        });
      } else {
        // Fetch all employees and suppliers
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('id, full_name, position, department')
          .eq('is_active', true)
          .order('full_name');

        if (empError) throw empError;

        const { data: suppliers, error: suppError } = await supabase
          .from('suppliers')
          .select('id, name, contact_person, category')
          .eq('is_active', true)
          .order('name');

        if (suppError) throw suppError;

        employees?.forEach(emp => {
          inspectorsList.push({
            id: emp.id,
            name: emp.full_name,
            type: 'employee',
            position: emp.position || undefined
          });
        });

        suppliers?.forEach(sup => {
          inspectorsList.push({
            id: sup.id,
            name: sup.contact_person || sup.name,
            type: 'supplier',
            position: `Bureau d'études - ${sup.name}`,
            role: undefined
          });
        });
      }

      return inspectorsList;
    }
  });

  const selectedInspector = inspectors.find(i => i.id === value);

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedInspector ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{selectedInspector.name}</span>
                {selectedInspector.type === 'supplier' && (
                  <Badge variant="secondary" className="text-xs">Bureau d'études</Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher un inspecteur..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Chargement..." : "Aucun inspecteur trouvé"}
              </CommandEmpty>
              <CommandGroup heading="Employés">
                {inspectors
                  .filter(i => i.type === 'employee')
                  .map((inspector) => (
                    <CommandItem
                      key={inspector.id}
                      value={`${inspector.name}-${inspector.id}`}
                      onSelect={() => {
                        onValueChange(inspector.id, inspector.name);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === inspector.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{inspector.name}</span>
                        {inspector.position && (
                          <span className="text-xs text-muted-foreground">{inspector.position}</span>
                        )}
                        {inspector.role && (
                          <span className="text-xs text-muted-foreground">Rôle: {inspector.role}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="Bureaux d'études">
                {inspectors
                  .filter(i => i.type === 'supplier')
                  .map((inspector) => (
                    <CommandItem
                      key={inspector.id}
                      value={`${inspector.name}-${inspector.id}`}
                      onSelect={() => {
                        onValueChange(inspector.id, inspector.name);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === inspector.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{inspector.name}</span>
                        {inspector.position && (
                          <span className="text-xs text-muted-foreground">{inspector.position}</span>
                        )}
                        {inspector.role && (
                          <span className="text-xs text-muted-foreground">Rôle: {inspector.role}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
