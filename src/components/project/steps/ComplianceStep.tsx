import React, { useState, useEffect } from 'react';
import { FileCheck, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Progress } from '../../ui/progress';
import { supabase } from '../../../integrations/supabase/client';
import { useToast } from '../../../hooks/use-toast';

interface ComplianceStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  isEditing?: boolean;
}

interface ComplianceItem {
  id: string;
  type: 'regulatory' | 'insurance' | 'bank_guarantee' | 'technical' | 'environmental';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  responsible: string;
  documents: string[];
  notes?: string;
}

const ComplianceStep: React.FC<ComplianceStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  const { toast } = useToast();
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>(formData.compliance || []);
  const [bankGuarantees, setBankGuarantees] = useState<any[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Load compliance data from database
  useEffect(() => {
    if (formData.id && formData.id !== 'new-project') {
      loadBankGuarantees();
      loadInsurancePolicies();
      loadDocuments();
    }
  }, [formData.id]);

  const loadBankGuarantees = async () => {
    if (!formData.id || formData.id === 'new-project') return;
    try {
      const { data, error } = await supabase
        .from('bank_guarantees')
        .select('*')
        .eq('project_id', formData.id);
      
      if (error) throw error;
      setBankGuarantees(data || []);
    } catch (error) {
      console.error('Error loading bank guarantees:', error);
    }
  };

  const loadInsurancePolicies = async () => {
    if (!formData.id || formData.id === 'new-project') return;
    try {
      const { data, error } = await supabase
        .from('insurance_certificates')
        .select('*')
        .eq('project_id', formData.id);
      
      if (error) throw error;
      setInsurancePolicies(data || []);
    } catch (error) {
      console.error('Error loading insurance policies:', error);
    }
  };

  const loadDocuments = async () => {
    if (!formData.id || formData.id === 'new-project') return;
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', formData.id)
        .in('document_type', ['contract', 'project_report', 'tender']);
      
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const calculateComplianceProgress = () => {
    if (complianceItems.length === 0) return 0;
    const completedItems = complianceItems.filter(item => item.status === 'approved').length;
    return (completedItems / complianceItems.length) * 100;
  };

  const addComplianceItem = (type: ComplianceItem['type']) => {
    const newItem: ComplianceItem = {
      id: Date.now().toString(),
      type,
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      responsible: '',
      documents: []
    };
    
    const updatedItems = [...complianceItems, newItem];
    setComplianceItems(updatedItems);
    onUpdate({ compliance: updatedItems });
  };

  const updateComplianceItem = (id: string, updates: Partial<ComplianceItem>) => {
    const updatedItems = complianceItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    setComplianceItems(updatedItems);
    onUpdate({ compliance: updatedItems });
  };

  const removeComplianceItem = (id: string) => {
    const updatedItems = complianceItems.filter(item => item.id !== id);
    setComplianceItems(updatedItems);
    onUpdate({ compliance: updatedItems });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const complianceProgress = calculateComplianceProgress();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-teal-500" />
          Conformités & Validation
        </CardTitle>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Progression de la conformité: {Math.round(complianceProgress)}%
          </span>
          <Progress value={complianceProgress} className="w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="regulatory" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="regulatory">Réglementaire</TabsTrigger>
            <TabsTrigger value="financial">Financier</TabsTrigger>
            <TabsTrigger value="technical">Technique</TabsTrigger>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          </TabsList>

          <TabsContent value="regulatory" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Conformité réglementaire</h4>
              <Button
                onClick={() => addComplianceItem('regulatory')}
                size="sm"
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Ajouter un élément
              </Button>
            </div>

            <div className="space-y-3">
              {complianceItems.filter(item => item.type === 'regulatory').map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Titre de l'exigence réglementaire"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={item.title}
                          onChange={(e) => updateComplianceItem(item.id, { title: e.target.value })}
                        />
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateComplianceItem(item.id, { status: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="approved">Approuvé</SelectItem>
                            <SelectItem value="rejected">Rejeté</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <textarea
                        placeholder="Description de l'exigence et actions nécessaires"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={item.description}
                        onChange={(e) => updateComplianceItem(item.id, { description: e.target.value })}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                          value={item.priority}
                          onValueChange={(value) => updateComplianceItem(item.id, { priority: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Priorité" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Haute</SelectItem>
                            <SelectItem value="critical">Critique</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <input
                          type="date"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={item.deadline || ''}
                          onChange={(e) => updateComplianceItem(item.id, { deadline: e.target.value })}
                        />
                        
                        <input
                          type="text"
                          placeholder="Responsable"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={item.responsible}
                          onChange={(e) => updateComplianceItem(item.id, { responsible: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(item.priority)}`}></div>
                        <span className="text-xs text-muted-foreground">
                          Priorité {item.priority}
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeComplianceItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {complianceItems.filter(item => item.type === 'regulatory').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune exigence réglementaire ajoutée</p>
                <p className="text-sm">Cliquez sur "Ajouter un élément" pour commencer</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bank Guarantees */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Garanties bancaires
                </h4>
                {bankGuarantees.map((guarantee) => (
                  <div key={guarantee.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{guarantee.guarantee_type}</h5>
                      <Badge className={guarantee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {guarantee.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Montant: {guarantee.guarantee_amount?.toLocaleString()}€
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Banque: {guarantee.bank_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Échéance: {new Date(guarantee.expiry_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {bankGuarantees.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune garantie bancaire configurée</p>
                )}
              </div>

              {/* Insurance Policies */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Polices d'assurance
                </h4>
                {insurancePolicies.map((policy) => (
                  <div key={policy.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{policy.coverage_type}</h5>
                      <Badge className={policy.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {policy.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Couverture: {policy.coverage_amount?.toLocaleString()}€
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Assureur: {policy.insurance_company}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Validité: {new Date(policy.valid_until).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {insurancePolicies.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune police d'assurance configurée</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Conformité technique</h4>
              <Button
                onClick={() => addComplianceItem('technical')}
                size="sm"
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Ajouter un élément
              </Button>
            </div>

            <div className="space-y-3">
              {complianceItems.filter(item => item.type === 'technical').map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Norme ou spécification technique"
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={item.title}
                          onChange={(e) => updateComplianceItem(item.id, { title: e.target.value })}
                        />
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateComplianceItem(item.id, { status: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="approved">Conforme</SelectItem>
                            <SelectItem value="rejected">Non conforme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <textarea
                        placeholder="Description des exigences techniques et méthodes de vérification"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={item.description}
                        onChange={(e) => updateComplianceItem(item.id, { description: e.target.value })}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeComplianceItem(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {complianceItems.filter(item => item.type === 'technical').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune exigence technique ajoutée</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Approuvés</span>
                </div>
                <p className="text-2xl font-bold">
                  {complianceItems.filter(item => item.status === 'approved').length}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium">En cours</span>
                </div>
                <p className="text-2xl font-bold">
                  {complianceItems.filter(item => item.status === 'in_progress').length}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  <span className="text-sm font-medium">En attente</span>
                </div>
                <p className="text-2xl font-bold">
                  {complianceItems.filter(item => item.status === 'pending').length}
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Rejetés</span>
                </div>
                <p className="text-2xl font-bold">
                  {complianceItems.filter(item => item.status === 'rejected').length}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Documents de conformité</h4>
              <div className="grid gap-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium">{doc.title}</h5>
                      <p className="text-sm text-muted-foreground">
                        Type: {doc.document_type} - Statut: {doc.status}
                      </p>
                    </div>
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucun document de conformité trouvé
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ComplianceStep;