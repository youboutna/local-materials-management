import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Building2, Eye, FileText, Plus, TrendingUp, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface SupplierInspection {
  id: string;
  supplier_id: string;
  inspector_name: string;
  inspection_date: string;
  status: 'passed' | 'failed' | 'pending' | 'requires_improvement';
  score?: number;
  comments?: string;
  recommendations?: string;
  next_inspection_date?: string;
}

interface SupplierPayment {
  id: string;
  supplier_id: string;
  project_id?: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'cancelled';
  payment_date?: string;
  due_date: string;
  description: string;
  invoice_number?: string;
}

const SupplierManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isSupplier, currentUserId } = useCurrentUserRoles();
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isAddInspectionOpen, setIsAddInspectionOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    rating: 5
  });

  const [inspectionForm, setInspectionForm] = useState({
    supplier_id: '',
    inspector_name: '',
    inspection_date: '',
    status: 'pending' as const,
    score: 0,
    comments: '',
    recommendations: '',
    next_inspection_date: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    supplier_id: '',
    project_id: '',
    amount: 0,
    status: 'pending' as const,
    due_date: '',
    description: '',
    invoice_number: ''
  });

  // Fetch suppliers
  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Supplier[];
    }
  });

  // Fetch supplier inspections
  const { data: inspections } = useQuery({
    queryKey: ['supplier-inspections', selectedSupplier],
    queryFn: async () => {
      if (!selectedSupplier) return [];
      
      const { data, error } = await supabase
        .from('supplier_inspections')
        .select('*')
        .eq('supplier_id', selectedSupplier)
        .order('inspection_date', { ascending: false });
      
      if (error) throw error;
      return data as SupplierInspection[];
    },
    enabled: !!selectedSupplier
  });

  // Fetch supplier payments
  const { data: payments } = useQuery({
    queryKey: ['supplier-payments', selectedSupplier],
    queryFn: async () => {
      if (!selectedSupplier) return [];
      
      const { data, error } = await supabase
        .from('supplier_payments')
        .select('*')
        .eq('supplier_id', selectedSupplier)
        .order('due_date', { ascending: false });
      
      if (error) throw error;
      return data as SupplierPayment[];
    },
    enabled: !!selectedSupplier
  });

  // Add supplier mutation
  const addSupplierMutation = useMutation({
    mutationFn: async (data: typeof supplierForm) => {
      const { error } = await supabase
        .from('suppliers')
        .insert([{ ...data, is_active: true }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsAddSupplierOpen(false);
      setSupplierForm({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        category: '',
        rating: 5
      });
      toast({
        title: "Fournisseur ajouté",
        description: "Le fournisseur a été ajouté avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le fournisseur.",
        variant: "destructive",
      });
    }
  });

  // Add inspection mutation
  const addInspectionMutation = useMutation({
    mutationFn: async (data: typeof inspectionForm) => {
      const { error } = await supabase
        .from('supplier_inspections')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-inspections'] });
      setIsAddInspectionOpen(false);
      setInspectionForm({
        supplier_id: '',
        inspector_name: '',
        inspection_date: '',
        status: 'pending',
        score: 0,
        comments: '',
        recommendations: '',
        next_inspection_date: ''
      });
      toast({
        title: "Inspection ajoutée",
        description: "L'inspection a été enregistrée avec succès.",
      });
    }
  });

  // Add payment mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (data: typeof paymentForm) => {
      const { error } = await supabase
        .from('supplier_payments')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      setIsAddPaymentOpen(false);
      setPaymentForm({
        supplier_id: '',
        project_id: '',
        amount: 0,
        status: 'pending',
        due_date: '',
        description: '',
        invoice_number: ''
      });
      toast({
        title: "Paiement ajouté",
        description: "Le paiement a été enregistré avec succès.",
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (suppliersLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Fournisseurs</h1>
          <p className="text-gray-600">
            {isAdmin ? 'Gérez les fournisseurs, inspections et paiements' : 'Consultez vos informations fournisseur'}
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Fournisseur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouveau Fournisseur</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouveau fournisseur au système
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nom de l'entreprise *</Label>
                    <Input
                      value={supplierForm.name}
                      onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nom du fournisseur"
                    />
                  </div>
                  <div>
                    <Label>Personne de contact</Label>
                    <Input
                      value={supplierForm.contact_person}
                      onChange={(e) => setSupplierForm(prev => ({ ...prev, contact_person: e.target.value }))}
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+222 XX XX XX XX"
                    />
                  </div>
                  <div>
                    <Label>Catégorie</Label>
                    <Select
                      value={supplierForm.category}
                      onValueChange={(value) => setSupplierForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="materials">Matériaux</SelectItem>
                        <SelectItem value="equipment">Équipement</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddSupplierOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={() => addSupplierMutation.mutate(supplierForm)}>
                      Ajouter
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suppliers List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Fournisseurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {suppliers?.map((supplier) => (
                  <div
                    key={supplier.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSupplier === supplier.id 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSupplier(supplier.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{supplier.name}</h3>
                      <Badge variant={supplier.is_active ? "default" : "secondary"} className="text-xs">
                        {supplier.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    {supplier.category && (
                      <Badge variant="outline" className="text-xs mb-1">
                        {supplier.category}
                      </Badge>
                    )}
                    {supplier.contact_person && (
                      <p className="text-xs text-gray-600">{supplier.contact_person}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="lg:col-span-2">
          {selectedSupplier ? (
            <Card>
              <CardHeader>
                <CardTitle>Détails du Fournisseur</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="inspections" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="inspections">Inspections</TabsTrigger>
                    <TabsTrigger value="payments">Paiements</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="inspections" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Historique des Inspections</h3>
                      {isAdmin && (
                        <Dialog open={isAddInspectionOpen} onOpenChange={setIsAddInspectionOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Nouvelle Inspection
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Nouvelle Inspection</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Inspecteur</Label>
                                <Input
                                  value={inspectionForm.inspector_name}
                                  onChange={(e) => setInspectionForm(prev => ({ 
                                    ...prev, 
                                    inspector_name: e.target.value,
                                    supplier_id: selectedSupplier || ''
                                  }))}
                                  placeholder="Nom de l'inspecteur"
                                />
                              </div>
                              <div>
                                <Label>Date d'inspection</Label>
                                <Input
                                  type="date"
                                  value={inspectionForm.inspection_date}
                                  onChange={(e) => setInspectionForm(prev => ({ ...prev, inspection_date: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Statut</Label>
                                <Select
                                  value={inspectionForm.status}
                                  onValueChange={(value: any) => setInspectionForm(prev => ({ ...prev, status: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="passed">Validé</SelectItem>
                                    <SelectItem value="failed">Échoué</SelectItem>
                                    <SelectItem value="requires_improvement">À améliorer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Score (/100)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={inspectionForm.score}
                                  onChange={(e) => setInspectionForm(prev => ({ ...prev, score: Number(e.target.value) }))}
                                />
                              </div>
                              <div>
                                <Label>Commentaires</Label>
                                <Textarea
                                  value={inspectionForm.comments}
                                  onChange={(e) => setInspectionForm(prev => ({ ...prev, comments: e.target.value }))}
                                  placeholder="Commentaires sur l'inspection"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsAddInspectionOpen(false)}>
                                  Annuler
                                </Button>
                                <Button onClick={() => addInspectionMutation.mutate(inspectionForm)}>
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {inspections?.map((inspection) => (
                        <Card key={inspection.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(inspection.status)}
                                <span className="font-medium">
                                  {format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}
                                </span>
                              </div>
                              <Badge className={getStatusColor(inspection.status)}>
                                {inspection.status === 'passed' ? 'Validé' :
                                 inspection.status === 'failed' ? 'Échoué' :
                                 inspection.status === 'requires_improvement' ? 'À améliorer' : 'En attente'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Inspecteur: {inspection.inspector_name}
                            </p>
                            {inspection.score && (
                              <div className="mb-2">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Score</span>
                                  <span>{inspection.score}/100</span>
                                </div>
                                <Progress value={inspection.score} className="h-2" />
                              </div>
                            )}
                            {inspection.comments && (
                              <p className="text-sm text-gray-700">{inspection.comments}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      
                      {(!inspections || inspections.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucune inspection enregistrée</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="payments" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Historique des Paiements</h3>
                      {isAdmin && (
                        <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Nouveau Paiement
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Nouveau Paiement</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Montant (MRU)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={paymentForm.amount}
                                  onChange={(e) => setPaymentForm(prev => ({ 
                                    ...prev, 
                                    amount: Number(e.target.value),
                                    supplier_id: selectedSupplier || ''
                                  }))}
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <Label>Date d'échéance</Label>
                                <Input
                                  type="date"
                                  value={paymentForm.due_date}
                                  onChange={(e) => setPaymentForm(prev => ({ ...prev, due_date: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Input
                                  value={paymentForm.description}
                                  onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                                  placeholder="Description du paiement"
                                />
                              </div>
                              <div>
                                <Label>Numéro de facture</Label>
                                <Input
                                  value={paymentForm.invoice_number}
                                  onChange={(e) => setPaymentForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                                  placeholder="FAC-2024-001"
                                />
                              </div>
                              <div>
                                <Label>Statut</Label>
                                <Select
                                  value={paymentForm.status}
                                  onValueChange={(value: any) => setPaymentForm(prev => ({ ...prev, status: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="processing">En cours</SelectItem>
                                    <SelectItem value="paid">Payé</SelectItem>
                                    <SelectItem value="cancelled">Annulé</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>
                                  Annuler
                                </Button>
                                <Button onClick={() => addPaymentMutation.mutate(paymentForm)}>
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {payments?.map((payment) => (
                        <Card key={payment.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(payment.status)}
                                <span className="font-medium">
                                  {payment.amount.toLocaleString()} MRU
                                </span>
                              </div>
                              <Badge className={getStatusColor(payment.status)}>
                                {payment.status === 'paid' ? 'Payé' :
                                 payment.status === 'processing' ? 'En cours' :
                                 payment.status === 'cancelled' ? 'Annulé' : 'En attente'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {payment.description}
                            </p>
                            <p className="text-sm text-gray-500">
                              Échéance: {format(new Date(payment.due_date), 'dd/MM/yyyy')}
                            </p>
                            {payment.invoice_number && (
                              <p className="text-sm text-gray-500">
                                Facture: {payment.invoice_number}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      
                      {(!payments || payments.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucun paiement enregistré</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Sélectionnez un fournisseur</h3>
                  <p>Choisissez un fournisseur dans la liste pour voir ses détails</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierManagement;