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
      const { supabase } = await import('@/integrations/supabase/client');
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
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('phase_employees')
        .insert({
          phase_id: phaseId,
          employee_name: employeeData.employeeName,
          employee_role: employeeData.employeeRole,
          employee_contact: employeeData.employeeContact,
          daily_rate: employeeData.dailyRate ? parseFloat(employeeData.dailyRate) : null,
          start_date: employeeData.startDate || null,
          end_date: employeeData.endDate || null,
          is_primary_supplier: employeeData.isPrimarySupplier,
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
      const { supabase } = await import('@/integrations/supabase/client');
      const updateData = {
        employee_name: data.employeeName,
        employee_role: data.employeeRole,
        employee_contact: data.employeeContact,
        daily_rate: data.dailyRate ? parseFloat(data.dailyRate) : null,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        is_primary_supplier: data.isPrimarySupplier,
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
      const { supabase } = await import('@/integrations/supabase/client');
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
      employeeName: '',
      employeeRole: '',
      employeeContact: '',
      dailyRate: '',
      startDate: '',
      endDate: '',
      isPrimarySupplier: false,
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
      employeeName: employee.employee_name || '',
      employeeRole: employee.employee_role || '',
      employeeContact: employee.employee_contact || '',
      dailyRate: employee.daily_rate?.toString() || '',
      startDate: employee.start_date || '',
      endDate: employee.end_date || '',
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
                          employeeName: '',
                          employeeRole: '',
                          employeeContact: '',
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
                          employeeName: '',
                          employeeRole: '',
                          employeeContact: '',
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
                      value={formData.employeeName}
                      onChange={e => {
                        const supplier = suppliersList?.find((s: any) => s.name === e.target.value);
                        setSelectedSupplierId(supplier?.id || null);
                        const contactPerson = supplier?.contactPerson || supplier?.contact_person;
                        setFormData({
                          ...formData,
                          employeeName: supplier?.name || e.target.value,
                          employeeRole: 'Consultant externe',
                          employeeContact: contactPerson || supplier?.email || supplier?.phone || '',
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
                      value={formData.employeeName}
                      onChange={e => {
                        setEmployeeSearch(e.target.value);
                        const emp = employeesList?.find(emp => emp.full_name === e.target.value);
                        setFormData({
                          ...formData,
                          employeeName: e.target.value,
                          employeeRole: emp?.position || '',
                          employeeContact: emp?.email || emp?.phone || '',
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
                      value={formData.employeeRole}
                      onChange={(e) => setFormData({ ...formData, employeeRole: e.target.value })}
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
                      value={formData.employeeContact}
                      onChange={(e) => setFormData({ ...formData, employeeContact: e.target.value })}
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
                      value={formData.dailyRate}
                      onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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