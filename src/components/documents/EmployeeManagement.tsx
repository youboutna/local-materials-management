/**
 * EmployeeManagement - HEXAGONAL ARCHITECTURE
 * Full round-trip UI -> DTO -> Service -> DB for employees,
 * including organisation linkage and organigramme (hierarchy) placement.
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2, Search, Settings, Building2, Network } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import OrganizationalHierarchyManager from '@/components/admin/OrganizationalHierarchyManager';
import OrganizationsManager from '@/components/admin/OrganizationsManager';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  useEmployeesList,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '@/hooks/hexagonal';
import { useOrganizations } from '@/hooks/useOrganizations';
import { getOrganizationHierarchyService } from '@/application/services/OrganizationHierarchyService';
import { EmployeeDTO } from '@/dtos/entities/EmployeeDTO';

const NONE = '__none__';

interface EmployeeFormData {
  employee_id: string;
  full_name: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  hire_date: string;
  end_date: string;
  salary: number;
  hourly_rate: number;
  currency: string;
  national_id: string;
  employee_type: string;
  status: string;
  availability: string;
  organization_id: string;
  manager_id: string;
  hierarchy_level: number;
  address: string;
  city: string;
  notes: string;
  skills: string[];
  is_active: boolean;
}

const emptyForm: EmployeeFormData = {
  employee_id: '',
  full_name: '',
  position: '',
  department: '',
  phone: '',
  email: '',
  hire_date: '',
  end_date: '',
  salary: 0,
  hourly_rate: 0,
  currency: 'MRU',
  national_id: '',
  employee_type: 'full_time',
  status: 'active',
  availability: 'available',
  organization_id: '',
  manager_id: '',
  hierarchy_level: 3,
  address: '',
  city: '',
  notes: '',
  skills: [],
  is_active: true,
};

const EmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHierarchyDialog, setShowHierarchyDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDTO | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const [formData, setFormData] = useState<EmployeeFormData>(emptyForm);

  // Hexagonal hooks
  const { data: employees = [], isLoading } = useEmployeesList(searchTerm);
  const { data: organizations = [], defaultOrganization } = useOrganizations();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    organizations.forEach((o) => map.set(o.id, o.name));
    return map;
  }, [organizations]);

  const filteredEmployees = useMemo(() => {
    if (orgFilter === 'all') return employees;
    if (orgFilter === NONE) return employees.filter((e: EmployeeDTO) => !e.organizationId);
    return employees.filter((e: EmployeeDTO) => e.organizationId === orgFilter);
  }, [employees, orgFilter]);

  const {
    currentData: paginatedEmployees,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage,
  } = usePagination({
    data: filteredEmployees,
    itemsPerPage: 10
  });

  const resetForm = () => {
    setFormData({ ...emptyForm, organization_id: defaultOrganization?.id || '' });
    setEditingEmployee(null);
  };

  /** Keep the organigramme (btp.organizational_hierarchy) in sync with the employee record */
  const syncHierarchyNode = async (employeeId: string) => {
    if (!formData.organization_id || !employeeId) return;
    try {
      const service = getOrganizationHierarchyService();
      const nodes = await service.list(formData.organization_id);
      const existing = nodes.find((n) => n.employeeId === employeeId);
      const payload = {
        organizationId: formData.organization_id,
        employeeId,
        department: formData.department || undefined,
        positionTitle: formData.position || formData.full_name,
        level: Number(formData.hierarchy_level) || 3,
      };
      if (existing) {
        await service.update(existing.id, payload);
      } else {
        await service.create(payload);
      }
    } catch (error) {
      console.warn('Hierarchy sync skipped:', error);
    }
  };

  const buildPayload = () => ({
    employeeId: formData.employee_id || undefined,
    fullName: formData.full_name,
    firstName: formData.full_name.split(' ')[0] || formData.full_name,
    lastName: formData.full_name.split(' ').slice(1).join(' '),
    position: formData.position || undefined,
    department: (formData.department || undefined) as EmployeeDTO['department'],
    phone: formData.phone || undefined,
    email: formData.email || undefined,
    startDate: formData.hire_date || undefined,
    endDate: formData.end_date || undefined,
    salary: formData.salary || undefined,
    hourlyRate: formData.hourly_rate || undefined,
    currency: formData.currency || undefined,
    nationalId: formData.national_id || undefined,
    type: formData.employee_type as EmployeeDTO['type'],
    status: formData.status as EmployeeDTO['status'],
    availability: formData.availability as EmployeeDTO['availability'],
    organizationId: formData.organization_id || null,
    managerId: formData.manager_id || null,
    address: formData.address || undefined,
    city: formData.city || undefined,
    notes: formData.notes || undefined,
    skills: formData.skills,
    isActive: formData.is_active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await updateMutation.mutateAsync({ id: editingEmployee.id, data: buildPayload() as never });
        await syncHierarchyNode(editingEmployee.id);
        toast({ title: t('common.success'), description: t('documents.employee.updated_successfully') });
      } else {
        const created = await createMutation.mutateAsync(buildPayload() as never);
        await syncHierarchyNode(created?.id);
        toast({ title: t('common.success'), description: t('documents.employee.created_successfully') });
      }
      setShowCreateDialog(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error?.message || 'Erreur inconnue',
        variant: "destructive"
      });
    }
  };

  const handleEdit = (employee: EmployeeDTO) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employeeId || '',
      full_name: employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      position: employee.position || '',
      department: (employee.department as string) || '',
      phone: employee.phone || '',
      email: employee.email || '',
      hire_date: (employee.startDate || '').slice(0, 10),
      end_date: (employee.endDate || '').slice(0, 10),
      salary: employee.salary || 0,
      hourly_rate: employee.hourlyRate || 0,
      currency: employee.currency || 'MRU',
      national_id: employee.nationalId || '',
      employee_type: (employee.type as string) || 'full_time',
      status: (employee.status as string) || 'active',
      availability: (employee.availability as string) || 'available',
      organization_id: employee.organizationId || '',
      manager_id: employee.managerId || '',
      hierarchy_level: employee.hierarchyLevel || 3,
      address: employee.address || '',
      city: employee.city || '',
      notes: employee.notes || '',
      skills: employee.skills || [],
      is_active: employee.isActive ?? true
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: t('common.success'), description: t('documents.employee.deleted_successfully') });
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error?.message || 'Erreur inconnue',
        variant: "destructive"
      });
    }
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                        <Label>Organisation</Label>
                        <Select
                          value={formData.organization_id || NONE}
                          onValueChange={(value) => setFormData(prev => ({...prev, organization_id: value === NONE ? '' : value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Rattacher à une organisation..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Aucune organisation</SelectItem>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Niveau organigramme</Label>
                        <Select
                          value={String(formData.hierarchy_level)}
                          onValueChange={(value) => setFormData(prev => ({...prev, hierarchy_level: Number(value)}))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 — Direction</SelectItem>
                            <SelectItem value="2">2 — Encadrement</SelectItem>
                            <SelectItem value="3">3 — Opérationnel</SelectItem>
                            <SelectItem value="4">4 — Terrain</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <SelectItem value="engineering">Ingénierie / Études</SelectItem>
                            <SelectItem value="construction">Travaux / Opérations</SelectItem>
                            <SelectItem value="quality">Qualité / HSE</SelectItem>
                            <SelectItem value="procurement">Approvisionnement</SelectItem>
                            <SelectItem value="finance">Direction Financière</SelectItem>
                            <SelectItem value="administration">Administration / Direction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Type de contrat</Label>
                        <Select
                          value={formData.employee_type}
                          onValueChange={(value) => setFormData(prev => ({...prev, employee_type: value}))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full_time">Temps plein</SelectItem>
                            <SelectItem value="part_time">Temps partiel</SelectItem>
                            <SelectItem value="contract">Contractuel</SelectItem>
                            <SelectItem value="consultant">Consultant</SelectItem>
                            <SelectItem value="intern">Stagiaire</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData(prev => ({...prev, status: value, is_active: value === 'active'}))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                            <SelectItem value="on_leave">En congé</SelectItem>
                            <SelectItem value="terminated">Sorti</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Disponibilité</Label>
                        <Select
                          value={formData.availability}
                          onValueChange={(value) => setFormData(prev => ({...prev, availability: value}))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Disponible</SelectItem>
                            <SelectItem value="busy">Affecté</SelectItem>
                            <SelectItem value="unavailable">Indisponible</SelectItem>
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
                        <Label>NNI / Pièce d'identité</Label>
                        <Input
                          value={formData.national_id}
                          onChange={(e) => setFormData(prev => ({...prev, national_id: e.target.value}))}
                          placeholder="Numéro national d'identité"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Responsable hiérarchique</Label>
                        <Select
                          value={formData.manager_id || NONE}
                          onValueChange={(value) => setFormData(prev => ({...prev, manager_id: value === NONE ? '' : value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un responsable..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Aucun</SelectItem>
                            {employees
                              .filter((emp: EmployeeDTO) => emp.id !== editingEmployee?.id)
                              .map((emp: EmployeeDTO) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.fullName} {emp.position ? `• ${emp.position}` : ''}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
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
                        <Label>Date de fin de contrat</Label>
                        <Input
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData(prev => ({...prev, end_date: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t('documents.employee.salary')}</Label>
                        <Input
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData(prev => ({...prev, salary: Number(e.target.value)}))}
                          placeholder={t('documents.employee.salary_placeholder')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Coût horaire</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.hourly_rate}
                          onChange={(e) => setFormData(prev => ({...prev, hourly_rate: Number(e.target.value)}))}
                          placeholder="Ex: 250"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Devise</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value) => setFormData(prev => ({...prev, currency: value}))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MRU">MRU</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Adresse</Label>
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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
                  <div className="space-y-6">
                    <OrganizationsManager />
                    <OrganizationalHierarchyManager />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('documents.employee.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrer par organisation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les organisations</SelectItem>
                <SelectItem value={NONE}>Non rattachés</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {paginatedEmployees.map((employee: EmployeeDTO) => (
              <Card key={employee.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <h3 className="font-medium">{employee.fullName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('documents.employee.id_label')}: {employee.employeeId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">{employee.position}</p>
                        <p className="text-sm text-muted-foreground">{employee.department}</p>
                      </div>
                      {employee.organizationId && (
                        <Badge variant="outline" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          {orgNameById.get(employee.organizationId) || 'Organisation'}
                        </Badge>
                      )}
                      {employee.managerId && (
                        <Badge variant="outline" className="gap-1">
                          <Network className="h-3 w-3" />
                          {employees.find((e: EmployeeDTO) => e.id === employee.managerId)?.fullName || 'Responsable'}
                        </Badge>
                      )}
                      {!!employee.hourlyRate && (
                        <Badge variant="secondary">
                          {employee.hourlyRate} {employee.currency || 'MRU'}/h
                        </Badge>
                      )}
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? t('documents.employee.active') : t('documents.employee.inactive')}
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
                      onClick={() => handleDelete(employee.id)}
                      className="text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('documents.employee.no_employees')}
            </div>
          )}

          {filteredEmployees.length > 0 && (
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
