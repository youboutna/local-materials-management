import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TranslatedDepartment } from '@/components/i18n/TranslatedBadges';
import { i18nService } from '@/application/services/I18nService';
import { useEmployeesSelector, type EmployeeOption } from '@/hooks/hexagonal'

interface EmployeeSelectorProps {
  value?: string;
  onChange: (employeeId: string) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  departmentFilter?: string[];
  positionFilter?: string[];
}

const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({
  value,
  onChange,
  label = "Employé",
  disabled = false,
  required = false,
  placeholder = "Sélectionner un employé",
  departmentFilter,
  positionFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: employees, isLoading } = useEmployeesSelector({
    searchTerm,
    departmentFilter,
    positionFilter
  });

  const selectedEmployee = employees?.find(employee => employee.id === value);

  const handleEmployeeSelect = (employeeId: string) => {
    onChange(employeeId);
  };

  const getDepartmentBadgeColor = (department: string | null | undefined) => {
    switch (department?.toLowerCase()) {
      case 'engineering':
        return 'bg-primary/10 text-primary';
      case 'management':
        return 'bg-purple-100 text-purple-800';
      case 'quality':
        return 'bg-success-soft text-success';
      case 'hse':
        return 'bg-warning/10 text-warning';
      case 'finance':
        return 'bg-warning/10 text-warning';
      case 'administration':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un employé..."
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
          <Select value={value || ''} onValueChange={handleEmployeeSelect} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder}>
                {selectedEmployee && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{selectedEmployee.full_name}</span>
                    {selectedEmployee.department && (
                      <Badge className={getDepartmentBadgeColor(selectedEmployee.department)} variant="outline">
                        <TranslatedDepartment code={selectedEmployee.department} />
                      </Badge>
                    )}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {employees?.map((employee) => (
                <SelectItem key={employee.id} value={employee.id} className="max-w-none">
                  <div className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {employee.full_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {employee.position && `${employee.position} • `}
                        ID: {employee.employee_id}
                      </div>
                      {employee.email && (
                        <div className="text-xs text-muted-foreground truncate">{employee.email}</div>
                      )}
                    </div>
                    {employee.department && (
                      <Badge className={getDepartmentBadgeColor(employee.department)} variant="outline">
                        <TranslatedDepartment code={employee.department} />
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              {(!employees || employees.length === 0) && (
                <SelectItem value="no-employees" disabled>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Aucun employé trouvé</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
        
        {selectedEmployee && (
          <div className="text-xs text-muted-foreground">
            {selectedEmployee.position && `${selectedEmployee.position} • `}
            {selectedEmployee.department && `${i18nService.translateDepartment(selectedEmployee.department)} • `}
            ID: {selectedEmployee.employee_id}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSelector;
