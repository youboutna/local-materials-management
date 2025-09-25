import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Search, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
  employee_id: string;
  is_active?: boolean | null;
}

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

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', searchTerm, departmentFilter, positionFilter],
    queryFn: async (): Promise<Employee[]> => {
      let query = supabase
        .from('employees')
        .select('id, full_name, position, department, email, phone, employee_id, is_active')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%`);
      }

      if (departmentFilter && departmentFilter.length > 0) {
        query = query.in('department', departmentFilter);
      }

      if (positionFilter && positionFilter.length > 0) {
        query = query.in('position', positionFilter);
      }

      const { data, error } = await query.limit(50);
      if (error) {
        console.error('Error fetching employees:', error);
        return [];
      }

      return data || [];
    },
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
                        {employee.position && `${employee.position} • `}
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
            {selectedEmployee.department && `${selectedEmployee.department} • `}
            ID: {selectedEmployee.employee_id}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSelector;