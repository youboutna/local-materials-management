
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit2, Phone, Mail, Calendar, Building } from 'lucide-react';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  hire_date: string;
  salary: number;
  is_active: boolean;
  skills: string[];
  created_at: string;
}

const EmployeeManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    position: '',
    department: '',
    phone: '',
    email: '',
    hire_date: '',
    salary: 0,
    skills: ''
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Employee[];
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (newEmployee: any) => {
      const skillsArray = newEmployee.skills ? newEmployee.skills.split(',').map((s: string) => s.trim()) : [];
      const { data, error } = await supabase
        .from('employees')
        .insert([{ ...newEmployee, skills: skillsArray }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: "Succès", description: "Employé créé avec succès." });
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating employee:', error);
      toast({ title: "Erreur", description: "Impossible de créer l'employé.", variant: "destructive" });
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const skillsArray = updates.skills ? updates.skills.split(',').map((s: string) => s.trim()) : [];
      const { data, error } = await supabase
        .from('employees')
        .update({ ...updates, skills: skillsArray })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({ title: "Succès", description: "Employé mis à jour avec succès." });
      resetForm();
    },
    onError: (error) => {
      console.error('Error updating employee:', error);
      toast({ title: "Erreur", description: "Impossible de mettre à jour l'employé.", variant: "destructive" });
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
      skills: ''
    });
    setEditingEmployee(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      employee_id: employee.employee_id,
      full_name: employee.full_name,
      position: employee.position || '',
      department: employee.department || '',
      phone: employee.phone || '',
      email: employee.email || '',
      hire_date: employee.hire_date || '',
      salary: employee.salary || 0,
      skills: employee.skills ? employee.skills.join(', ') : ''
    });
    setEditingEmployee(employee);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.full_name) {
      toast({
        title: "Erreur",
        description: "L'ID employé et le nom complet sont obligatoires.",
        variant: "destructive"
      });
      return;
    }

    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, updates: formData });
    } else {
      createEmployeeMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-adrar-600">Chargement des employés...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-adrar-900">Gestion des Employés</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un Employé
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Modifier l\'Employé' : 'Ajouter un Employé'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">ID Employé *</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                    placeholder="EMP001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom Complet *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Nom complet"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Poste</Label>
                  <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un poste" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="director">Directeur</SelectItem>
                      <SelectItem value="project_manager">Chef de Projet</SelectItem>
                      <SelectItem value="inspector">Inspecteur</SelectItem>
                      <SelectItem value="engineer">Ingénieur</SelectItem>
                      <SelectItem value="supervisor">Superviseur</SelectItem>
                      <SelectItem value="technician">Technicien</SelectItem>
                      <SelectItem value="administrator">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Département</Label>
                  <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un département" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="management">Direction</SelectItem>
                      <SelectItem value="projects">Projets</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="engineering">Ingénierie</SelectItem>
                      <SelectItem value="administration">Administration</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+222 XX XX XX XX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Date d'embauche</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salaire (MRU)</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Compétences</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="Séparées par des virgules: Construction, Supervision, AutoCAD"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees?.map((employee) => (
          <Card key={employee.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-terracotta-600" />
                  <div>
                    <CardTitle className="text-lg font-semibold text-adrar-800">
                      {employee.full_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{employee.employee_id}</p>
                  </div>
                </div>
                <Badge variant={employee.is_active ? "default" : "secondary"}>
                  {employee.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {employee.position && (
                  <Badge variant="outline">{employee.position}</Badge>
                )}
                {employee.department && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building className="h-4 w-4" />
                    <span>{employee.department}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                {employee.email && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Embauché le {new Date(employee.hire_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>

              {employee.skills && employee.skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Compétences:</p>
                  <div className="flex flex-wrap gap-1">
                    {employee.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {employee.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{employee.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(employee)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {employees?.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun employé</h3>
          <p className="text-gray-500 mb-4">
            Commencez par ajouter votre premier employé.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
