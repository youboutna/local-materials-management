import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  department: string | null;
  hireDate: string | null;
  isActive: boolean;
  salary: number | null;
  skills: string[] | null;
  certifications: Record<string, unknown> | null;
  managerId: string | null;
  superiorId: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateEmployeeInput {
  employeeId: string;
  fullName: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hireDate?: string;
  salary?: number;
  skills?: string[];
  managerId?: string;
  superiorId?: string;
}

interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  isActive?: boolean;
}

const mapDbToEmployee = (row: any): Employee => ({
  id: row.id,
  employeeId: row.employee_id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  position: row.position,
  department: row.department,
  hireDate: row.hire_date,
  isActive: row.is_active ?? true,
  salary: row.salary,
  skills: row.skills,
  certifications: row.certifications,
  managerId: row.manager_id,
  superiorId: row.superior_id,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useEmployeesHex() {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ["employees-hex"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return (data || []).map(mapDbToEmployee);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateEmployeeInput) => {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          employee_id: input.employeeId,
          full_name: input.fullName,
          email: input.email,
          phone: input.phone,
          position: input.position,
          department: input.department,
          hire_date: input.hireDate,
          salary: input.salary,
          skills: input.skills,
          manager_id: input.managerId,
          superior_id: input.superiorId,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDbToEmployee(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees-hex"] });
      toast.success("Employé créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateEmployeeInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.employeeId !== undefined) updateData.employee_id = input.employeeId;
      if (input.fullName !== undefined) updateData.full_name = input.fullName;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.position !== undefined) updateData.position = input.position;
      if (input.department !== undefined) updateData.department = input.department;
      if (input.hireDate !== undefined) updateData.hire_date = input.hireDate;
      if (input.salary !== undefined) updateData.salary = input.salary;
      if (input.skills !== undefined) updateData.skills = input.skills;
      if (input.managerId !== undefined) updateData.manager_id = input.managerId;
      if (input.superiorId !== undefined) updateData.superior_id = input.superiorId;
      if (input.isActive !== undefined) updateData.is_active = input.isActive;

      const { data, error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapDbToEmployee(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees-hex"] });
      toast.success("Employé mis à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees-hex"] });
      toast.success("Employé supprimé");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    employees,
    isLoading,
    error,
    createEmployee: createMutation.mutateAsync,
    updateEmployee: updateMutation.mutateAsync,
    deleteEmployee: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useEmployeeHex(id: string | undefined) {
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ["employee-hex", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapDbToEmployee(data);
    },
    enabled: !!id,
  });

  return { employee, isLoading, error };
}
