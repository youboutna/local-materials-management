import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2, Search, Settings } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';
import OrganizationalHierarchyManager from '@/components/admin/OrganizationalHierarchyManager';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

type Employee = Database['public']['Tables']['employees']['Row'];

const EmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHierarchyDialog, setShowHierarchyDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    position: '',
    department: '',
    phone: '',
    email: '',
    hire_date: '',
    salary: 0,
    skills: [] as string[],
    is_active: true
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('*')
        .order('full_name');

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as Employee[]) || [];
    },
  });

  const {
    currentData: paginatedEmployees,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage,
  } = usePagination({
    data: employees,
    itemsPerPage: 10
  });

  const createMutation = useMutation({
    mutationFn: async (employeeData: typeof formData) => {
      const { data, error } = await supabase
        .from('employees')
        .insert(employeeData as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: t('common.success'), description: t('documents.employee.created_successfully') });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: t('common.success'), description: t('documents.employee.deleted_successfully') });
    },
    onError: (error) => {
      toast({
        title: t('common.error'),
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      employee_id: '',
      full_name: '',
      position: '',
      department: '',
      phone: '',
      email: '',
      hire_date: '',
      salary: 0,
      skills: [],
      is_active: true
    });
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      position: employee.position || '',
      department: employee.department || '',
      phone: employee.phone || '',
      email: employee.email || '',
      hire_date: employee.hire_date || '',
      salary: employee.salary || 0,
      skills: employee.skills || [],
      is_active: employee.is_active || true
    });
    setShowCreateDialog(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-4">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {t('documents.tabs.employees')}
            </div>
            <div className="flex gap-2">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('documents.employee.add')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmployee ? t('documents.employee.edit_title') : t('documents.employee.add_title')}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('documents.employee.employee_id')} *</Label>
                        <Input
                          value={formData.employee_id}
                          onChange={(e) => setFormData(prev => ({...prev, employee_id: e.target.value}))}
                          required
                          placeholder={t('documents.employee.employee_id_placeholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('documents.employee.full_name')} *</Label>
                        <Input
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
                          required
                          placeholder={t('documents.employee.full_name_placeholder')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('documents.employee.position')}</Label>
                        <Input
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({...prev, position: e.target.value}))}
                          placeholder={t('documents.employee.position_placeholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('documents.employee.department')}</Label>
                        <Select
                          value={formData.department}
                          onValueChange={(value) => setFormData(prev => ({...prev, department: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un département..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Production et Commercialisation">Production et Commercialisation</SelectItem>
                            <SelectItem value="Études et Travaux">Études et Travaux</SelectItem>
                            <SelectItem value="Centre de Développement">Centre de Développement</SelectItem>
                            <SelectItem value="Logistique et Approvisionnement">Logistique et Approvisionnement</SelectItem>
                            <SelectItem value="Support">Support</SelectItem>
                            <SelectItem value="Direction Financière">Direction Financière</SelectItem>
                            <SelectItem value="Conseillers">Conseillers</SelectItem>
                            <SelectItem value="Direction Générale">Direction Générale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('documents.employee.phone')}</Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                          placeholder={t('documents.employee.phone_placeholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('documents.employee.email')}</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                          placeholder={t('documents.employee.email_placeholder')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('documents.employee.hire_date')}</Label>
                        <Input
                          type="date"
                          value={formData.hire_date}
                          onChange={(e) => setFormData(prev => ({...prev, hire_date: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('documents.employee.salary')}</Label>
                        <Input
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData(prev => ({...prev, salary: Number(e.target.value)}))}
                          placeholder={t('documents.employee.salary_placeholder')}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit">
                        {editingEmployee ? t('common.update') : t('common.save')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showHierarchyDialog} onOpenChange={setShowHierarchyDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Hiérarchie
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Gestion de la Hiérarchie Organisationnelle</DialogTitle>
                  </DialogHeader>
                  <OrganizationalHierarchyManager />
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('documents.employee.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            {paginatedEmployees.map((employee) => (
              <Card key={employee.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-medium">{employee.full_name}</h3>
                        <p className="text-sm text-gray-500">{t('documents.employee.id_label')}: {employee.employee_id}</p>
                      </div>
                      <div>
                        <p className="text-sm">{employee.position}</p>
                        <p className="text-sm text-gray-500">{employee.department}</p>
                      </div>
                      <Badge variant={employee.is_active ? "default" : "secondary"}>
                        {employee.is_active ? t('documents.employee.active') : t('documents.employee.inactive')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(employee)}
                    >
                      <Edit className="h-4 w-4" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(employee.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {employees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('documents.employee.no_employees')}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={goToPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement;