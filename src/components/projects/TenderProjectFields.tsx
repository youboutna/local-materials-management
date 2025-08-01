
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, FileText, Building } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TenderProjectFieldsProps {
  formData: {
    launchDate?: string;
    attributionDate?: string;
    selectionMode?: string;
    marketType?: string;
    financingSource?: string;
    projectReference?: string;
  };
  onChange: (field: string, value: string) => void;
  readOnly?: boolean;
}

const TenderProjectFields: React.FC<TenderProjectFieldsProps> = ({
  formData,
  onChange,
  readOnly = false
}) => {
  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Informations d'appel d'offres et contrat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tender Launch and Attribution Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="launchDate" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date de lancement de l'appel d'offres
            </Label>
            {readOnly ? (
              <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
                {formatDateForDisplay(formData.launchDate) || 'Non spécifiée'}
              </div>
            ) : (
              <Input
                id="launchDate"
                type="date"
                value={formData.launchDate || ''}
                onChange={(e) => onChange('launchDate', e.target.value)}
              />
            )}
            <p className="text-xs text-gray-500">
              Date de publication de l'appel d'offres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attributionDate" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Date d'attribution du marché
            </Label>
            {readOnly ? (
              <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
                {formatDateForDisplay(formData.attributionDate) || 'Non spécifiée'}
              </div>
            ) : (
              <Input
                id="attributionDate"
                type="date"
                value={formData.attributionDate || ''}
                onChange={(e) => onChange('attributionDate', e.target.value)}
              />
            )}
            <p className="text-xs text-gray-500">
              Date d'attribution officielle du contrat
            </p>
          </div>
        </div>

        {/* Market and Selection Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="marketType">Type de marché</Label>
            {readOnly ? (
              <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
                {formData.marketType || 'Non spécifié'}
              </div>
            ) : (
              <Select 
                value={formData.marketType || ''} 
                onValueChange={(value) => onChange('marketType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type de marché" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Marché public</SelectItem>
                  <SelectItem value="private">Marché privé</SelectItem>
                  <SelectItem value="ppp">Partenariat Public-Privé (PPP)</SelectItem>
                  <SelectItem value="framework">Marché cadre</SelectItem>
                  <SelectItem value="emergency">Marché d'urgence</SelectItem>
                  <SelectItem value="Supply">Fournitures</SelectItem>
                  <SelectItem value="construction">Travaux</SelectItem>
                  

                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="selectionMode">Mode de sélection</Label>
            {readOnly ? (
              <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
                {formData.selectionMode || 'Non spécifié'}
              </div>
            ) : (
              <Select 
                value={formData.selectionMode || ''} 
                onValueChange={(value) => onChange('selectionMode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le mode de sélection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open_tender">Appel d'offres ouvert</SelectItem>
                  <SelectItem value="restricted_tender">Appel d'offres restreint</SelectItem>
                  <SelectItem value="restricted_tender_national">Appel d'offres restreint national</SelectItem>
                  <SelectItem value="negotiated">Procédure négociée</SelectItem>
                  <SelectItem value="competitive_dialogue">Dialogue compétitif</SelectItem>
                  <SelectItem value="direct_award">Attribution directe</SelectItem>
                   <SelectItem value="direct_award_supply"> Consultation Simplifiée</SelectItem>

                 
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Financing Source */}
        <div className="space-y-2">
          <Label htmlFor="financingSource" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Source de financement
          </Label>
          {readOnly ? (
            <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
              {formData.financingSource || 'Non spécifiée'}
            </div>
          ) : (
            <Select 
              value={formData.financingSource || ''} 
              onValueChange={(value) => onChange('financingSource', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la source de financement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="state_budget">Budget de l'État</SelectItem>
                <SelectItem value="world_bank">Banque Mondiale</SelectItem>
                <SelectItem value="african_dev_bank">Banque Africaine de Développement</SelectItem>
                <SelectItem value="islamic_dev_bank">Banque Islamique de Développement</SelectItem>
                <SelectItem value="european_union">Union Européenne</SelectItem>
                <SelectItem value="arab_fund">Fonds Arabe de Développement</SelectItem>
                <SelectItem value="kuwait_fund">Fonds Koweïtien</SelectItem>
                <SelectItem value="saudi_fund">Fonds Saoudien</SelectItem>
                <SelectItem value="private_financing">Financement privé</SelectItem>
                <SelectItem value="mixed_financing">Financement mixte</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Project Reference */}
        <div className="space-y-2">
          <Label htmlFor="projectReference">Référence du projet/contrat</Label>
          {readOnly ? (
            <div className="p-2 border border-gray-200 rounded-md bg-gray-50">
              {formData.projectReference || 'Non spécifiée'}
            </div>
          ) : (
            <Input
              id="projectReference"
              value={formData.projectReference || ''}
              onChange={(e) => onChange('projectReference', e.target.value)}
              placeholder="Ex: PRJ-2024-001, CONT-MR-2024-INF-001"
            />
          )}
          <p className="text-xs text-gray-500">
            Référence officielle du projet ou du contrat
          </p>
        </div>

        {/* Timeline Summary */}
        {(formData.launchDate || formData.attributionDate) && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Chronologie de l'appel d'offres</h4>
            <div className="space-y-1 text-sm text-blue-800">
              {formData.launchDate && (
                <div className="flex justify-between">
                  <span>Lancement de l'appel d'offres:</span>
                  <span className="font-medium">{formatDateForDisplay(formData.launchDate)}</span>
                </div>
              )}
              {formData.attributionDate && (
                <div className="flex justify-between">
                  <span>Attribution du marché:</span>
                  <span className="font-medium">{formatDateForDisplay(formData.attributionDate)}</span>
                </div>
              )}
              {formData.launchDate && formData.attributionDate && (
                <div className="flex justify-between border-t border-blue-300 pt-1 mt-2">
                  <span>Durée de la procédure:</span>
                  <span className="font-medium">
                    {Math.ceil((new Date(formData.attributionDate).getTime() - new Date(formData.launchDate).getTime()) / (1000 * 60 * 60 * 24))} jours
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenderProjectFields;
