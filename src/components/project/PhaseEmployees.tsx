import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Edit2, Trash2, Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

interface PhaseEmployeesProps {
  phaseId: string;
}

interface EmployeeFormData {
  employeeName: string;
  employeeRole: string;
  employeeContact: string;
  dailyRate: string;
  startDate: string;
  endDate: string;
  isPrimarySupplier: boolean;
}

const PhaseEmployees: React.FC<PhaseEmployeesProps> = ({ phaseId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeName: '',
    employeeRole: '',
    employeeContact: '',
    dailyRate: '',
    startDate: '',
    endDate: '',
    isPrimarySupplier: false,
  });
  const [memberType, setMemberType] = useState<'employee' | 'supplier'>('employee');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['phase-employees', phaseId],
    queryFn: async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('phase_employees')
        .select('*')
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliersList } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { SupplierService } = await import('@/application/services/SupplierService');
      const supplierService = new SupplierService(RepositoryFactory.getSupplierRepository());
      const result = await supplierService.searchSuppliers({ isActive: true });
      // Map to UI compatible format with dual-casing
      return result.suppliers.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        contactPerson: s.contactPerson || s.contact_person,
        contact_person: s.contact_person || s.contactPerson
      }));
    },
  });

  // Fetch employeesList from your API or context
  const { data: employeesList, isLoading: isEmployeesLoading } = useQuery({
    queryKey: ['employees', employeeSearch],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('id, full_name, position, email, phone')
        .order('full_name');

      if (employeeSearch) {
        query = query.or(`full_name.ilike.%${employeeSearch}%,employee_id.ilike.%${employeeSearch}%,position.ilike.%${employeeSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (employeeData: EmployeeFormData) => {
      const { data, error } = await supabase
        .from('phase_employees')
        .insert({
          phase_id: phaseId,
          employee_name: employeeData.employee_name,
          employee_role: employeeData.employee_role,
          employee_contact: employeeData.employee_contact,
          daily_rate: employeeData.daily_rate ? parseFloat(employeeData.daily_rate) : null,
          start_date: employeeData.start_date || null,
          end_date: employeeData.end_date || null,
          is_primary_supplier: employeeData.is_primary_supplier,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees', phaseId] });
      setIsAdding(false);
      resetForm();
      toast({ title: 'Employé ajouté avec succès' });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => {
      const updateData = {
        employee_name: data.employee_name,
        employee_role: data.employee_role,
        employee_contact: data.employee_contact,
        daily_rate: data.daily_rate ? parseFloat(data.daily_rate) : null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        is_primary_supplier: data.is_primary_supplier,
      };
      
      const { error } = await supabase
        .from('phase_employees')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees', phaseId] });
      setEditingId(null);
      setIsAdding(false);
      resetForm();
      toast({ title: 'Employé mis à jour avec succès' });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('phase_employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-employees', phaseId] });
      toast({ title: 'Employé supprimé avec succès' });
    },
  });

  const resetForm = () => {
    setFormData({
      employee_name: '',
      employee_role: '',
      employee_contact: '',
      daily_rate: '',
      start_date: '',
      end_date: '',
      is_primary_supplier: false,
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateEmployeeMutation.mutate({ id: editingId, data: formData });
    } else {
      addEmployeeMutation.mutate(formData);
    }
  };

  const startEdit = (employee: any) => {
    setFormData({
      employee_name: employee.employee_name || '',
      employee_role: employee.employee_role || '',
      employee_contact: employee.employee_contact || '',
      daily_rate: employee.daily_rate?.toString() || '',
      start_date: employee.start_date || '',
      end_date: employee.end_date || '',
      is_primary_supplier: employee.is_primary_supplier || false,
    });
    setEditingId(employee.id);
    setIsAdding(true);
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement des employés...</div>;
  }

  const primarySupplier = employees?.find(emp => emp.is_primary_supplier);
  const totalDailyCost = employees?.reduce((sum, emp) => sum + (emp.daily_rate || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Équipe de la phase ({employees?.length || 0})
          </CardTitle>
          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un membre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Modifier le membre' : 'Ajouter un membre à l\'équipe'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Member type selector */}
                <div className="flex gap-4 mb-2">
                  <label>
                    <input
                      type="radio"
                      checked={memberType === 'employee'}
                      onChange={() => {
                        setMemberType('employee');
                        setSelectedSupplierId(null);
                        setFormData({
                          ...formData,
                          employee_name: '',
                          employee_role: '',
                          employee_contact: '',
                        });
                      }}
                    />
                    <span className="ml-2">Employé interne</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={memberType === 'supplier'}
                      onChange={() => {
                        setMemberType('supplier');
                        setFormData({
                          ...formData,
                          employee_name: '',
                          employee_role: '',
                          employee_contact: '',
                        });
                      }}
                    />
                    <span className="ml-2">Consultant externe / Fournisseur</span>
                  </label>
                </div>

                {/* If supplier, show dropdown */}
                {memberType === 'supplier' && (
                  <div>
                    <Label htmlFor="supplier_select">Sélectionner un fournisseur/consultant *</Label>
                    <Input
                      id="supplier_select"
                      value={formData.employee_name}
                      onChange={e => {
                        const supplier = suppliersList?.find((s: any) => s.name === e.target.value);
                        setSelectedSupplierId(supplier?.id || null);
                        const contactPerson = supplier?.contactPerson || supplier?.contact_person;
                        setFormData({
                          ...formData,
                          employee_name: supplier?.name || e.target.value,
                          employee_role: 'Consultant externe',
                          employee_contact: contactPerson || supplier?.email || supplier?.phone || '',
                        });
                      }}
                      required={memberType === 'supplier'}
                      list="supplier-list"
                      disabled={memberType !== 'supplier'}
                    />
                    <datalist id="supplier-list">
                      {suppliersList?.map((s: any) => (
                        <option key={s.id} value={s.name} label={s.contactPerson || s.contact_person || ''} />
                      ))}
                    </datalist>
                  </div>
                )}

                {memberType === 'employee' && (
                  <div>
                    <Label htmlFor="employee_name">Nom complet *</Label>
                    <Input
                      id="employee_name"
                      value={formData.employee_name}
                      onChange={e => {
                        setEmployeeSearch(e.target.value);
                        // Find the employee by full_name
                        const emp = employeesList?.find(emp => emp.full_name === e.target.value);
                        setFormData({
                          ...formData,
                          employee_name: e.target.value,
                          employee_role: emp?.position || '', // Use position for role/fonction
                          employee_contact: emp?.email || emp?.phone || '',
                        });
                      }}
                      required
                      disabled={memberType !== 'employee'}
                      list="employee-list"
                      autoComplete="off"
                    />
                    <datalist id="employee-list">
                      {employeesList?.map(emp => (
                        <option key={emp.id} value={emp.full_name} />
                      ))}
                    </datalist>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee_role">Rôle/Fonction *</Label>
                    <Input
                      id="employee_role"
                      value={formData.employee_role}
                      onChange={(e) => setFormData({ ...formData, employee_role: e.target.value })}
                      required
                      placeholder="Ex: Chef de chantier, Maçon, etc."
                      disabled={memberType === 'supplier'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employee_contact">Contact</Label>
                    <Input
                      id="employee_contact"
                      value={formData.employee_contact}
                      onChange={(e) => setFormData({ ...formData, employee_contact: e.target.value })}
                      placeholder="Téléphone ou email"
                      disabled={memberType === 'supplier'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="daily_rate">Tarif journalier (MRU)</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_primary_supplier"
                    checked={formData.is_primary_supplier}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_primary_supplier: !!checked })
                    }
                  />
                  <Label htmlFor="is_primary_supplier" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Fournisseur principal de la phase
                  </Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {employees && employees.length > 0 ? (
          <div className="space-y-4">
            {totalDailyCost > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Coût journalier total: {totalDailyCost.toLocaleString()} MRU/jour
                </p>
              </div>
            )}

            {primarySupplier && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Fournisseur principal</span>
                </div>
                <p className="text-sm text-yellow-700">
                  {primarySupplier.employee_name} - {primarySupplier.employee_role}
                </p>
              </div>
            )}
            
            {employees.map((employee) => (
              <div key={employee.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{employee.employee_name}</h3>
                      {employee.is_primary_supplier && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{employee.employee_role}</p>
                    {employee.employee_contact && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact: {employee.employee_contact}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(employee)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {employee.daily_rate && (
                    <Badge variant="secondary">
                      {employee.daily_rate.toLocaleString()} MRU/jour
                    </Badge>
                  )}
                  {employee.start_date && (
                    <Badge variant="outline">
                      Début: {new Date(employee.start_date).toLocaleDateString()}
                    </Badge>
                  )}
                  {employee.end_date && (
                    <Badge variant="outline">
                      Fin: {new Date(employee.end_date).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun membre assigné à cette phase.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseEmployees;