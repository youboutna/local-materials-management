import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useInspectorsSelector, type Inspector } from '@/hooks/hexagonal/useSelectorsHex';

interface InspectorSelectorProps {
  projectId?: string;
  value?: string;
  onValueChange: (value: string, name: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
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

  const { data: inspectors = [], isLoading } = useInspectorsSelector(projectId);

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
