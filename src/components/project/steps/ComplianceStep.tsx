import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ComplianceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement: string;
  status: string;
  deadline: string;
  responsible: string;
  documentation: string;
  notes: string;
}

interface ComplianceStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  isEditing?: boolean;
}

const ComplianceStep: React.FC<ComplianceStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>(
    formData.compliance || []
  );
  const [newItem, setNewItem] = useState<Partial<ComplianceItem>>({
    name: '',
    description: '',
    category: 'technique',
    requirement: '',
    status: 'pending',
    deadline: '',
    responsible: '',
    documentation: '',
    notes: ''
  });

  const complianceCategories = [
    { value: 'technique', label: 'Technique' },
    { value: 'environnemental', label: 'Environnemental' },
    { value: 'securite', label: 'Sécurité' },
    { value: 'juridique', label: 'Juridique' },
    { value: 'qualite', label: 'Qualité' },
    { value: 'administratif', label: 'Administratif' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'En attente', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'En cours', icon: AlertCircle, color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Conforme', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
    { value: 'non_compliant', label: 'Non conforme', icon: AlertCircle, color: 'bg-red-100 text-red-800' }
  ];

  const getStatusInfo = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const addComplianceItem = () => {
    if (!newItem.name || !newItem.requirement) return;
    
    const item: ComplianceItem = {
      id: Date.now().toString(),
      name: newItem.name,
      description: newItem.description || '',
      category: newItem.category || 'technique',
      requirement: newItem.requirement,
      status: newItem.status || 'pending',
      deadline: newItem.deadline || '',
      responsible: newItem.responsible || '',
      documentation: newItem.documentation || '',
      notes: newItem.notes || ''
    };
    
    const updatedItems = [...complianceItems, item];
    setComplianceItems(updatedItems);
    onUpdate({ compliance: updatedItems });
    
    setNewItem({
      name: '',
      description: '',
      category: 'technique',
      requirement: '',
      status: 'pending',
      deadline: '',
      responsible: '',
      documentation: '',
      notes: ''
    });
  };

  const updateItemStatus = (id: string, status: string) => {
    const updatedItems = complianceItems.map(item =>
      item.id === id ? { ...item, status } : item
    );
    setComplianceItems(updatedItems);
    onUpdate({ compliance: updatedItems });
  };

  const removeItem = (id: string) => {
    const updatedItems = complianceItems.filter(item => item.id !== id);
    setComplianceItems(updatedItems);
    onUpdate({ compliance: updatedItems });
  };

  const getComplianceStats = () => {
    const total = complianceItems.length;
    const completed = complianceItems.filter(item => item.status === 'completed').length;
    const pending = complianceItems.filter(item => item.status === 'pending').length;
    const inProgress = complianceItems.filter(item => item.status === 'in_progress').length;
    const nonCompliant = complianceItems.filter(item => item.status === 'non_compliant').length;
    
    return { total, completed, pending, inProgress, nonCompliant };
  };

  const stats = getComplianceStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-teal-500" />
          Conformités & Validation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Statistiques de conformité */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
              <div className="text-sm text-green-600">Conformes</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-800">{stats.inProgress}</div>
              <div className="text-sm text-blue-600">En cours</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-800">{stats.nonCompliant}</div>
              <div className="text-sm text-red-600">Non conformes</div>
            </div>
          </div>

          {/* Formulaire d'ajout d'exigence */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="text-lg font-medium mb-4">Ajouter une exigence de conformité</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nom de l'exigence *</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ex: Étude d'impact environnemental"
                    value={newItem.name || ''}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Catégorie</label>
                  <select 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={newItem.category || 'technique'}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  >
                    {complianceCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Description de l'exigence de conformité"
                  rows={2}
                  value={newItem.description || ''}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Exigence légale/réglementaire *</label>
                <textarea 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Référence à la norme, loi ou règlement applicable"
                  rows={2}
                  value={newItem.requirement || ''}
                  onChange={(e) => setNewItem({...newItem, requirement: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date limite</label>
                  <input 
                    type="date" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={newItem.deadline || ''}
                    onChange={(e) => setNewItem({...newItem, deadline: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Responsable</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Personne responsable de la conformité"
                    value={newItem.responsible || ''}
                    onChange={(e) => setNewItem({...newItem, responsible: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Documentation requise</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Types de documents nécessaires"
                  value={newItem.documentation || ''}
                  onChange={(e) => setNewItem({...newItem, documentation: e.target.value})}
                />
              </div>
              
              <Button onClick={addComplianceItem} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter l'exigence
              </Button>
            </div>
          </div>

          {/* Liste des exigences de conformité */}
          <div>
            <h3 className="text-lg font-medium mb-4">Exigences de conformité ({complianceItems.length})</h3>
            {complianceItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune exigence de conformité définie
              </div>
            ) : (
              <div className="space-y-4">
                {complianceItems.map((item) => {
                  const statusInfo = getStatusInfo(item.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={item.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <select
                            value={item.status}
                            onChange={(e) => updateItemStatus(item.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{item.category}</Badge>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        {item.deadline && (
                          <Badge variant="outline">
                            Échéance: {new Date(item.deadline).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm space-y-1">
                        <div><strong>Exigence:</strong> {item.requirement}</div>
                        {item.documentation && (
                          <div><strong>Documentation:</strong> {item.documentation}</div>
                        )}
                        {item.responsible && (
                          <div><strong>Responsable:</strong> {item.responsible}</div>
                        )}
                        {item.notes && (
                          <div><strong>Notes:</strong> {item.notes}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceStep;