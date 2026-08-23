/**
 * Hook hexagonal fournissant les destinataires potentiels d'une action
 * (employés actifs + fournisseurs actifs).
 */
import { getEmployeeService } from '@/application/services/EmployeeService';
import { getSupplierService } from '@/application/services/SupplierService';
import { useCallback, useState } from 'react';

export interface ActionEmployee { id: string; full_name: string; email?: string; position?: string; }
export interface ActionRecipient { id: string; name: string; email?: string; phone?: string; }

export function useActionRecipients() {
  const [employees, setEmployees] = useState<ActionEmployee[]>([]);
  const [recipients, setRecipients] = useState<ActionRecipient[]>([]);

  const load = useCallback(async () => {
    const [activeEmployees, activeSuppliers] = await Promise.all([
      getEmployeeService().getActiveEmployees(),
      getSupplierService().getActiveSuppliers(),
    ]);

    const employeeItems: ActionEmployee[] = activeEmployees
      .filter((e) => e.id && e.fullName)
      .map((e) => ({ id: e.id, full_name: e.fullName, email: e.email ?? undefined, position: e.position ?? undefined }));

    const supplierRecipients: ActionRecipient[] = activeSuppliers
      .filter((s) => s.id && s.name)
      .map((s) => ({ id: s.id, name: s.name, email: s.email ?? undefined, phone: s.phone ?? undefined }));

    const employeeRecipients: ActionRecipient[] = activeEmployees
      .filter((e) => e.id && e.fullName)
      .map((e) => ({ id: e.id, name: e.fullName, email: e.email ?? undefined, phone: e.phone ?? undefined }));

    setEmployees(employeeItems);
    setRecipients([...employeeRecipients, ...supplierRecipients]);
  }, []);

  return { employees, recipients, load };
}
