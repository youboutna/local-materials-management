import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  label = "EmployÃ©",
  disabled = false,
  required = false,
  placeholder = "SÃ©lectionner un employÃ©",
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
        return 'bg-blue-100 text-blue-800';
      case 'management':
        return 'bg-purple-100 text-purple-800';
      case 'quality':
        return 'bg-green-100 text-green-800';
      case 'hse':
        return 'bg-orange-100 text-orange-800';
      case 'finance':
        return 'bg-yellow-100 text-yellow-800';
      case 'administration':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
            placeholder="Rechercher un employÃ©..."
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
                        {selectedEmployee.department}
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
                        {employee.position && `${employee.position} â€¢ `}
                        ID: {employee.employee_id}
                      </div>
                      {employee.email && (
                        <div className="text-xs text-muted-foreground truncate">{employee.email}</div>
                      )}
                    </div>
                    {employee.department && (
                      <Badge className={getDepartmentBadgeColor(employee.department)} variant="outline">
                        {employee.department}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
              {(!employees || employees.length === 0) && (
                <SelectItem value="no-employees" disabled>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Aucun employÃ© trouvÃ©</span>
                  </div>
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
        
        {selectedEmployee && (
          <div className="text-xs text-muted-foreground">
            {selectedEmployee.position && `${selectedEmployee.position} â€¢ `}
            {selectedEmployee.department && `${selectedEmployee.department} â€¢ `}
            ID: {selectedEmployee.employee_id}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSelector;
