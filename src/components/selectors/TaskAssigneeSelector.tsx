import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Building2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Assignee {
  id: string;
  name: string;
  email?: string;
  type: 'employee' | 'supplier';
  role?: string;
  department?: string;
}

interface TaskAssigneeSelectorProps {
  projectId: string;
  value?: string;
  onChange: (assigneeId: string, assigneeName: string, assigneeEmail: string, assigneeType: 'employee' | 'supplier') => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

const TaskAssigneeSelector: React.FC<TaskAssigneeSelectorProps> = ({
  projectId,
  value,
  onChange,
  label = "Assigné à",
  disabled = false,
  required = false,
  placeholder = "Sélectionner un assigné",
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: assignees, isLoading } = useQuery({
    queryKey: ['task-assignees', projectId, searchTerm],
    queryFn: async (): Promise<Assignee[]> => {
      const { supabase } = await import('@/integrations/supabase/client');
      const assigneeList: Assignee[] = [];

      // Fetch employees
      let employeeQuery = supabase
        .from('employees')
        .select('id, full_name, email, position, department')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (searchTerm) {
        employeeQuery = employeeQuery.or(`full_name.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`);
      }

      const { data: employees } = await employeeQuery.limit(25);
      
      if (employees) {
        assigneeList.push(...employees.filter(emp => emp.id && emp.full_name).map(emp => ({
          id: emp.id!,
          name: emp.full_name!,
          email: emp.email || '',
          type: 'employee' as const,
          role: emp.position || undefined,
          department: emp.department || undefined,
        })));
      }

      // Fetch project stakeholders (suppliers/contractors)
      let stakeholderQuery = supabase
        .from('project_stakeholders')
        .select(`
          supplier_id,
          suppliers (
            id,
            name,
            email,
            contact_person
          )
        `)
        .eq('project_id', projectId)
        .not('supplier_id', 'is', null);

      const { data: stakeholders } = await stakeholderQuery;

      if (stakeholders) {
        stakeholders.forEach(sh => {
          if (sh.suppliers) {
            const supplier = sh.suppliers as any;
            const supplierName = supplier.contact_person || supplier.name;
            
            if (!searchTerm || supplierName.toLowerCase().includes(searchTerm.toLowerCase())) {
              assigneeList.push({
                id: supplier.id,
                name: supplierName,
                email: supplier.email || '',
                type: 'supplier',
                role: supplier.name,
              });
            }
          }
        });
      }

      return assigneeList;
    },
  });

  const selectedAssignee = assignees?.find(assignee => assignee.id === value);

  const handleSelect = (assigneeId: string) => {
    const assignee = assignees?.find(a => a.id === assigneeId);
    if (assignee) {
      onChange(assignee.id, assignee.name, assignee.email || '', assignee.type);
    }
  };

  const employees = assignees?.filter(a => a.type === 'employee') || [];
  const suppliers = assignees?.filter(a => a.type === 'supplier') || [];

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            disabled={disabled}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <Select value={value || ''} onValueChange={handleSelect} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder}>
                {selectedAssignee && (
                  <div className="flex items-center gap-2">
                    {selectedAssignee.type === 'employee' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                    <span>{selectedAssignee.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {selectedAssignee.type === 'employee' ? 'Employé' : 'Externe'}
                    </Badge>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {employees.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Employés
                  </SelectLabel>
                  {employees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{assignee.name}</div>
                          {assignee.role && (
                            <div className="text-xs text-muted-foreground">{assignee.role}</div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {suppliers.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Parties prenantes externes
                  </SelectLabel>
                  {suppliers.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{assignee.name}</div>
                          {assignee.role && (
                            <div className="text-xs text-muted-foreground">{assignee.role}</div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {(!assignees || assignees.length === 0) && (
                <SelectItem value="no-assignees" disabled>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Aucun assigné trouvé</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default TaskAssigneeSelector;
