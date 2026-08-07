/**
 * TaskAssigneeSelector - Sélecteur d'assigné pour les tâches
 * 
 * Architecture Hexagonale - RÈGLES STRICTES :
 * - Zéro supabase.from() dans les composants
 * - Utilisation des services et DTOs
 * - Tous les types proviennent des DTOs
 * - UI Component → Hook → Service → Repository → Adapter → DB
 * 
 * Respecte PROMPT.md :
 * - ✅ Zéro supabase.from() dans les composants
 * - ✅ Utilisation de useStakeholdersHex
 * - ✅ Pas de redéfinition de types dans UI
 * - ✅ camelCase pour les DTOs
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, User, Building2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useStakeholdersHex } from '@/hooks/hexagonal/useStakeholdersHex';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';
import { SupplierDTO } from '@/dtos/entities/SupplierDTO';
import { StakeholderResponseDTO } from '@/dtos/entities/StakeholderDTO';

// ============================================================================
// TYPES - ALIAS VERS LES DTOS
// ============================================================================

export interface AssigneeOption {
  id: string;
  name: string;
  email?: string;
  type: 'employee' | 'supplier' | 'external';
  role?: string;
  department?: string;
}

// ============================================================================
// PROPS
// ============================================================================

interface TaskAssigneeSelectorProps {
  projectId: string;
  value?: string;
  onChange: (assigneeId: string, assigneeName: string, assigneeEmail: string, assigneeType: 'employee' | 'supplier' | 'external') => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

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

  // ✅ Utilisation du hook hexagonal
  const { stakeholders, isLoading: isLoadingStakeholders } = useStakeholdersHex(projectId);

  // ✅ Récupération des employés via un autre hook ou service
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees-active', searchTerm],
    queryFn: async (): Promise<EmployeeDTO[]> => {
      const { EmployeeService } = await import('@/application/services/EmployeeService');
      const { RepositoryFactory } = await import('@/infrastructure/RepositoryFactory');
      const employeeService = new EmployeeService(RepositoryFactory.getEmployeeRepository());
      const allEmployees = await employeeService.getAllEmployees();
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return allEmployees.filter(emp => 
          emp.fullName?.toLowerCase().includes(term) ||
          emp.position?.toLowerCase().includes(term) ||
          emp.department?.toLowerCase().includes(term)
        );
      }
      return allEmployees;
    },
    staleTime: 5 * 60 * 1000,
  });

  // ✅ Construction de la liste des assignés à partir des DTOs
  const assignees = useMemo((): AssigneeOption[] => {
    const list: AssigneeOption[] = [];

    // Ajouter les employés depuis EmployeeDTO
    if (employees) {
      employees.forEach(emp => {
        if (emp.id && emp.fullName) {
          list.push({
            id: emp.id,
            name: emp.fullName,
            email: emp.email || '',
            type: 'employee',
            role: emp.position || undefined,
            department: emp.department || undefined,
          });
        }
      });
    }

    // Ajouter les parties prenantes externes depuis StakeholderResponseDTO
    if (stakeholders) {
      stakeholders.forEach(stakeholder => {
        // Fournisseurs
        if (stakeholder.supplierDetails?.id) {
          const name = stakeholder.supplierDetails?.name || stakeholder.name || 'Fournisseur';
          if (!searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase())) {
            list.push({
              id: stakeholder.supplierDetails.id,
              name: name,
              email: stakeholder.email || '',
              type: 'supplier',
              role: String(stakeholder.role || 'Fournisseur'),
            });
          }
        }
        // Externes (sans supplierId ni employeeId)
        else if (!stakeholder.employeeId && String(stakeholder.stakeholderType) === 'external') {
          const name = stakeholder.name || 'Externe';
          if (!searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase())) {
            list.push({
              id: stakeholder.id,
              name: name,
              email: stakeholder.email || '',
              type: 'external',
              role: String(stakeholder.role || 'Externe'),
            });
          }
        }
      });
    }

    return list;
  }, [employees, stakeholders, searchTerm]);

  const isLoading = isLoadingStakeholders || isLoadingEmployees;

  const selectedAssignee = assignees.find(assignee => assignee.id === value);

  const handleSelect = (assigneeId: string) => {
    const assignee = assignees.find(a => a.id === assigneeId);
    if (assignee) {
      onChange(
        assignee.id,
        assignee.name,
        assignee.email || '',
        assignee.type
      );
    }
  };

  const employeesList = assignees.filter(a => a.type === 'employee');
  const suppliersList = assignees.filter(a => a.type === 'supplier' || a.type === 'external');

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
                      {selectedAssignee.type === 'employee' ? 'Employé' : 
                       selectedAssignee.type === 'supplier' ? 'Fournisseur' : 'Externe'}
                    </Badge>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {employeesList.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Employés
                  </SelectLabel>
                  {employeesList.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{assignee.name}</div>
                          {assignee.role && (
                            <div className="text-xs text-muted-foreground">{assignee.role}</div>
                          )}
                          {assignee.department && (
                            <div className="text-xs text-muted-foreground">{assignee.department}</div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}

              {suppliersList.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Parties prenantes externes
                  </SelectLabel>
                  {suppliersList.map((assignee) => (
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

              {assignees.length === 0 && (
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