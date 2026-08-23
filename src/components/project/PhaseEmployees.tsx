/**
 * PhaseEmployees — main d'œuvre affectée à une phase.
 * Flux hexagonal : UI → usePhaseEmployeesHex → PhaseEmployeeService → Adapter → btp.phase_employees.
 * Aucun accès direct à Supabase dans ce composant.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePhaseEmployeesHex } from '@/hooks/hexagonal/usePhaseEmployeesHex';
import { useActiveEmployeesHex } from '@/hooks/hexagonal/useActiveEmployeesHex';
import { useSuppliersHex } from '@/hooks/hexagonal/useSuppliersHex';
import { Edit2, Plus, Star, Trash2, Users } from 'lucide-react';
import React, { useState } from 'react';
import { T } from '@/components/i18n/T';

interface PhaseEmployeesProps {
  phaseId: string;
}

interface EmployeeFormState {
  employeeName: string;
  employeeRole: string;
  employeeContact: string;
  dailyRate: string;
  startDate: string;
  endDate: string;
  isPrimarySupplier: boolean;
}

const EMPTY_FORM: EmployeeFormState = {
  employeeName: '',
  employeeRole: '',
  employeeContact: '',
  dailyRate: '',
  startDate: '',
  endDate: '',
  isPrimarySupplier: false,
};

const PhaseEmployees: React.FC<PhaseEmployeesProps> = ({ phaseId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EmployeeFormState>(EMPTY_FORM);
  const [memberType, setMemberType] = useState<'employee' | 'supplier'>('employee');

  const {
    employees,
    isLoading,
    totalLaborCost,
    addEmployee,
    updateEmployee,
    removeEmployee,
    isAdding,
    isUpdating,
  } = usePhaseEmployeesHex(phaseId);

  const { data: employeesList = [] } = useActiveEmployeesHex();
  const { suppliers = [] } = useSuppliersHex();

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setMemberType('employee');
  };

  const toInput = (data: EmployeeFormState) => ({
    employeeName: data.employeeName,
    employeeRole: data.employeeRole,
    employeeContact: data.employeeContact || null,
    dailyRate: data.dailyRate ? parseFloat(data.dailyRate) : null,
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    isPrimarySupplier: data.isPrimarySupplier,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateEmployee({ id: editingId, data: toInput(formData) });
    } else {
      await addEmployee(toInput(formData));
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const startEdit = (employee: (typeof employees)[number]) => {
    setFormData({
      employeeName: employee.employeeName,
      employeeRole: employee.employeeRole,
      employeeContact: employee.employeeContact || '',
      dailyRate: employee.dailyRate != null ? String(employee.dailyRate) : '',
      startDate: employee.startDate || '',
      endDate: employee.endDate || '',
      isPrimarySupplier: employee.isPrimarySupplier,
    });
    setEditingId(employee.id);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="animate-pulse text-sm text-muted-foreground">Chargement de l'équipe…</div>;
  }

  const primarySupplier = employees.find((emp) => emp.isPrimarySupplier);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Équipe de la phase ({employees.length})
          </CardTitle>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                <T k="auto.phaseemployees.ajouter_un_membre" fallback="Ajouter un membre" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Modifier le membre' : "Ajouter un membre à l'équipe"}
                </DialogTitle>
                <DialogDescription>
                  <T k="auto.phaseemployees.renseignez_l_affectation_interne_ou_externe_le_t" fallback="Renseignez l'affectation (interne ou externe), le tarif journalier et la période." />
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={memberType === 'employee'}
                      onChange={() => {
                        setMemberType('employee');
                        setFormData({ ...formData, employeeName: '', employeeRole: '', employeeContact: '' });
                      }}
                    />
                    <T k="auto.phaseemployees.employe_interne" fallback="Employé interne" />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={memberType === 'supplier'}
                      onChange={() => {
                        setMemberType('supplier');
                        setFormData({ ...formData, employeeName: '', employeeRole: '', employeeContact: '' });
                      }}
                    />
                    Consultant externe / Fournisseur
                  </label>
                </div>

                {memberType === 'supplier' ? (
                  <div>
                    <Label htmlFor="supplier_select">Fournisseur / consultant *</Label>
                    <Input
                      id="supplier_select"
                      value={formData.employeeName}
                      list="phase-supplier-list"
                      autoComplete="off"
                      required
                      onChange={(e) => {
                        const supplier = suppliers.find((s) => s.name === e.target.value);
                        setFormData({
                          ...formData,
                          employeeName: supplier?.name || e.target.value,
                          employeeRole: formData.employeeRole || 'Consultant externe',
                          employeeContact:
                            supplier?.contactPerson || supplier?.email || supplier?.phone || formData.employeeContact,
                        });
                      }}
                    />
                    <datalist id="phase-supplier-list">
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.name} />
                      ))}
                    </datalist>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="employee_name">Nom complet *</Label>
                    <Input
                      id="employee_name"
                      value={formData.employeeName}
                      list="phase-employee-list"
                      autoComplete="off"
                      required
                      onChange={(e) => {
                        const emp = employeesList.find((item) => item.full_name === e.target.value);
                        setFormData({
                          ...formData,
                          employeeName: e.target.value,
                          employeeRole: emp?.position || formData.employeeRole,
                          employeeContact: formData.employeeContact,
                        });
                      }}
                    />
                    <datalist id="phase-employee-list">
                      {employeesList.map((emp) => (
                        <option key={emp.id} value={emp.full_name} />
                      ))}
                    </datalist>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="employee_role">Rôle / Fonction *</Label>
                    <Input
                      id="employee_role"
                      value={formData.employeeRole}
                      onChange={(e) => setFormData({ ...formData, employeeRole: e.target.value })}
                      required
                      placeholder="Ex : Chef de chantier, Maçon…"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employee_contact"><T k="auto.phaseemployees.contact" fallback="Contact" /></Label>
                    <Input
                      id="employee_contact"
                      value={formData.employeeContact}
                      onChange={(e) => setFormData({ ...formData, employeeContact: e.target.value })}
                      placeholder="Téléphone ou email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="daily_rate"><T k="auto.phaseemployees.tarif_journalier_mru" fallback="Tarif journalier (MRU)" /></Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      step="0.01"
                      value={formData.dailyRate}
                      onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_date"><T k="auto.phaseemployees.date_de_debut" fallback="Date de début" /></Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date"><T k="auto.phaseemployees.date_de_fin" fallback="Date de fin" /></Label>
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
                    checked={formData.isPrimarySupplier}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPrimarySupplier: !!checked })}
                  />
                  <Label htmlFor="is_primary_supplier" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <T k="auto.phaseemployees.fournisseur_principal_de_la_phase" fallback="Fournisseur principal de la phase" />
                  </Label>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    <T k="auto.phaseemployees.annuler" fallback="Annuler" />
                  </Button>
                  <Button type="submit" disabled={isAdding || isUpdating}>
                    {editingId ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {employees.length > 0 ? (
          <div className="space-y-4">
            {totalLaborCost > 0 && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">
                  Coût journalier total : {totalLaborCost.toLocaleString()} MRU/jour
                </p>
              </div>
            )}

            {primarySupplier && (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Star className="h-4 w-4 text-warning" />
                  <span className="font-medium text-warning"><T k="auto.phaseemployees.fournisseur_principal" fallback="Fournisseur principal" /></span>
                </div>
                <p className="text-sm text-warning">
                  {primarySupplier.employeeName} — {primarySupplier.employeeRole}
                </p>
              </div>
            )}

            {employees.map((employee) => (
              <div key={employee.id} className="rounded-lg border p-4">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{employee.employeeName}</h3>
                      {employee.isPrimarySupplier && <Star className="h-4 w-4 text-warning" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{employee.employeeRole}</p>
                    {employee.employeeContact && (
                      <p className="mt-1 text-xs text-muted-foreground">Contact : {employee.employeeContact}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(employee)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => removeEmployee(employee.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {employee.dailyRate != null && (
                    <Badge variant="secondary">{employee.dailyRate.toLocaleString()} MRU/jour</Badge>
                  )}
                  {employee.startDate && (
                    <Badge variant="outline">Début : {new Date(employee.startDate).toLocaleDateString()}</Badge>
                  )}
                  {employee.endDate && (
                    <Badge variant="outline">Fin : {new Date(employee.endDate).toLocaleDateString()}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground"><T k="auto.phaseemployees.aucun_membre_assigne_a_cette_phase" fallback="Aucun membre assigné à cette phase." /></p>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseEmployees;
