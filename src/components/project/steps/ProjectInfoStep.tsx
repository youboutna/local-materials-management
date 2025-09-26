import React from 'react';
import { Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectInfoStepProps {
  formData: any;
  onUpdate: (data: any) => void;
  isEditing?: boolean;
}

const ProjectInfoStep: React.FC<ProjectInfoStepProps> = ({
  formData,
  onUpdate,
  isEditing = false
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-500" />
          Informations Générales du Projet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titre du projet *</label>
              <input 
                type="text" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Nom du projet de construction"
                required
                value={formData.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Référence du projet</label>
              <input 
                type="text" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="REF-2025-001"
                value={formData.project_reference || ''}
                onChange={(e) => onUpdate({ project_reference: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description détaillée *</label>
            <textarea 
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
              placeholder="Description complète du projet, objectifs et spécifications techniques"
              required
              value={formData.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Budget total *</label>
              <input 
                type="number" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="1000000"
                required
                value={formData.budget || ''}
                onChange={(e) => onUpdate({ budget: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type de marché *</label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.market_type || ''}
                onChange={(e) => onUpdate({ market_type: e.target.value })}
                required
              >
                <option value="">Sélectionner le type de marché</option>
                <option value="public">Marché public</option>
                <option value="private">Marché privé</option>
                <option value="ppp">Partenariat public-privé (PPP)</option>
                <option value="concession">Concession</option>
                <option value="delegation">Délégation de service public</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mode de sélection</label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.selection_mode || ''}
                onChange={(e) => onUpdate({ selection_mode: e.target.value })}
              >
                <option value="">Sélectionner le mode</option>
                <option value="open">Appel d'offres ouvert</option>
                <option value="restricted">Appel d'offres restreint</option>
                <option value="negotiated">Procédure négociée</option>
                <option value="competitive">Dialogue compétitif</option>
                <option value="innovation">Partenariat d'innovation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Source de financement</label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.financing_source || ''}
                onChange={(e) => onUpdate({ financing_source: e.target.value })}
              >
                <option value="">Sélectionner la source</option>
                <option value="budget_state">Budget de l'État</option>
                <option value="budget_local">Budget collectivité locale</option>
                <option value="eu_funds">Fonds européens</option>
                <option value="private">Financement privé</option>
                <option value="mixed">Financement mixte</option>
                <option value="loan">Emprunt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date de début prévue</label>
              <input 
                type="date" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.start_date || formData.startDate || ''}
                onChange={(e) => onUpdate({ start_date: e.target.value, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date de fin prévue</label>
              <input 
                type="date" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.end_date || formData.endDate || ''}
                onChange={(e) => onUpdate({ end_date: e.target.value, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Taille estimée de l'équipe</label>
              <input 
                type="number" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="10"
                min="1"
                value={formData.team_size || ''}
                onChange={(e) => onUpdate({ team_size: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Statut du projet</label>
              <select 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.status || 'planning'}
                onChange={(e) => onUpdate({ status: e.target.value })}
              >
                <option value="planning">En planification</option>
                <option value="en cours">En cours</option>
                <option value="suspendu">Suspendu</option>
                <option value="terminé">Terminé</option>
                <option value="annulé">Annulé</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              id="allowsInitialPayment"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              checked={formData.allows_initial_payment || false}
              onChange={(e) => onUpdate({ allows_initial_payment: e.target.checked })}
            />
            <label htmlFor="allowsInitialPayment" className="text-sm font-medium">
              Autoriser un paiement initial
            </label>
          </div>

          {formData.allows_initial_payment && (
            <div>
              <label className="block text-sm font-medium mb-2">Pourcentage de paiement initial (%)</label>
              <input 
                type="number" 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="15"
                min="0"
                max="100"
                value={formData.initial_payment_percentage || ''}
                onChange={(e) => onUpdate({ initial_payment_percentage: parseFloat(e.target.value) })}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectInfoStep;