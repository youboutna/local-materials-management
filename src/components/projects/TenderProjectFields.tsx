
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, FileText, Building } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { T } from '@/components/i18n/T';

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
          <T k="auto.tenderprojectfields.informations_d_appel_d_offres_et_contrat" fallback="Informations d'appel d'offres et contrat" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tender Launch and Attribution Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="launchDate" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <T k="auto.tenderprojectfields.date_de_lancement_de_l_appel_d_offres" fallback="Date de lancement de l'appel d'offres" />
            </Label>
            {readOnly ? (
              <div className="p-2 border border-border rounded-md bg-muted">
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
            <p className="text-xs text-muted-foreground">
              <T k="auto.tenderprojectfields.date_de_publication_de_l_appel_d_offres" fallback="Date de publication de l'appel d'offres" />
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attributionDate" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <T k="auto.tenderprojectfields.date_d_attribution_du_marche" fallback="Date d'attribution du marché" />
            </Label>
            {readOnly ? (
              <div className="p-2 border border-border rounded-md bg-muted">
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
            <p className="text-xs text-muted-foreground">
              <T k="auto.tenderprojectfields.date_d_attribution_officielle_du_contrat" fallback="Date d'attribution officielle du contrat" />
            </p>
          </div>
        </div>

        {/* Market and Selection Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="marketType"><T k="auto.tenderprojectfields.type_de_marche" fallback="Type de marché" /></Label>
            {readOnly ? (
              <div className="p-2 border border-border rounded-md bg-muted">
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
                  <SelectItem value="public"><T k="auto.tenderprojectfields.marche_public" fallback="Marché public" /></SelectItem>
                  <SelectItem value="private"><T k="auto.tenderprojectfields.marche_prive" fallback="Marché privé" /></SelectItem>
                  <SelectItem value="ppp"><T k="auto.tenderprojectfields.partenariat_public_prive_ppp" fallback="Partenariat Public-Privé (PPP)" /></SelectItem>
                  <SelectItem value="framework"><T k="auto.tenderprojectfields.marche_cadre" fallback="Marché cadre" /></SelectItem>
                  <SelectItem value="emergency"><T k="auto.tenderprojectfields.marche_d_urgence" fallback="Marché d'urgence" /></SelectItem>
                  <SelectItem value="Supply"><T k="auto.tenderprojectfields.fournitures" fallback="Fournitures" /></SelectItem>
                  <SelectItem value="construction"><T k="auto.tenderprojectfields.travaux" fallback="Travaux" /></SelectItem>
                  

                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="selectionMode"><T k="auto.tenderprojectfields.mode_de_selection" fallback="Mode de sélection" /></Label>
            {readOnly ? (
              <div className="p-2 border border-border rounded-md bg-muted">
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
                  <SelectItem value="open_tender"><T k="auto.tenderprojectfields.appel_d_offres_ouvert" fallback="Appel d'offres ouvert" /></SelectItem>
                  <SelectItem value="restricted_tender"><T k="auto.tenderprojectfields.appel_d_offres_restreint" fallback="Appel d'offres restreint" /></SelectItem>
                  <SelectItem value="restricted_tender_national"><T k="auto.tenderprojectfields.appel_d_offres_restreint_national" fallback="Appel d'offres restreint national" /></SelectItem>
                  <SelectItem value="negotiated"><T k="auto.tenderprojectfields.procedure_negociee" fallback="Procédure négociée" /></SelectItem>
                  <SelectItem value="competitive_dialogue"><T k="auto.tenderprojectfields.dialogue_competitif" fallback="Dialogue compétitif" /></SelectItem>
                  <SelectItem value="direct_award"><T k="auto.tenderprojectfields.attribution_directe" fallback="Attribution directe" /></SelectItem>
                   <SelectItem value="direct_award_supply"> <T k="auto.tenderprojectfields.consultation_simplifiee" fallback="Consultation Simplifiée" /></SelectItem>

                 
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Financing Source */}
        <div className="space-y-2">
          <Label htmlFor="financingSource" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <T k="auto.tenderprojectfields.source_de_financement" fallback="Source de financement" />
          </Label>
          {readOnly ? (
            <div className="p-2 border border-border rounded-md bg-muted">
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
                <SelectItem value="state_budget"><T k="auto.tenderprojectfields.budget_de_l_etat" fallback="Budget de l'État" /></SelectItem>
                <SelectItem value="world_bank"><T k="auto.tenderprojectfields.banque_mondiale" fallback="Banque Mondiale" /></SelectItem>
                <SelectItem value="african_dev_bank"><T k="auto.tenderprojectfields.banque_africaine_de_developpement" fallback="Banque Africaine de Développement" /></SelectItem>
                <SelectItem value="islamic_dev_bank"><T k="auto.tenderprojectfields.banque_islamique_de_developpement" fallback="Banque Islamique de Développement" /></SelectItem>
                <SelectItem value="european_union"><T k="auto.tenderprojectfields.union_europeenne" fallback="Union Européenne" /></SelectItem>
                <SelectItem value="arab_fund"><T k="auto.tenderprojectfields.fonds_arabe_de_developpement" fallback="Fonds Arabe de Développement" /></SelectItem>
                <SelectItem value="kuwait_fund"><T k="auto.tenderprojectfields.fonds_koweitien" fallback="Fonds Koweïtien" /></SelectItem>
                <SelectItem value="saudi_fund"><T k="auto.tenderprojectfields.fonds_saoudien" fallback="Fonds Saoudien" /></SelectItem>
                <SelectItem value="private_financing"><T k="auto.tenderprojectfields.financement_prive" fallback="Financement privé" /></SelectItem>
                <SelectItem value="mixed_financing"><T k="auto.tenderprojectfields.financement_mixte" fallback="Financement mixte" /></SelectItem>
                <SelectItem value="other"><T k="auto.tenderprojectfields.autre" fallback="Autre" /></SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Project Reference */}
        <div className="space-y-2">
          <Label htmlFor="projectReference">Référence du projet/contrat</Label>
          {readOnly ? (
            <div className="p-2 border border-border rounded-md bg-muted">
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
          <p className="text-xs text-muted-foreground">
            <T k="auto.tenderprojectfields.reference_officielle_du_projet_ou_du_contrat" fallback="Référence officielle du projet ou du contrat" />
          </p>
        </div>

        {/* Timeline Summary */}
        {(formData.launchDate || formData.attributionDate) && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2"><T k="auto.tenderprojectfields.chronologie_de_l_appel_d_offres" fallback="Chronologie de l'appel d'offres" /></h4>
            <div className="space-y-1 text-sm text-primary">
              {formData.launchDate && (
                <div className="flex justify-between">
                  <span><T k="auto.tenderprojectfields.lancement_de_l_appel_d_offres" fallback="Lancement de l'appel d'offres:" /></span>
                  <span className="font-medium">{formatDateForDisplay(formData.launchDate)}</span>
                </div>
              )}
              {formData.attributionDate && (
                <div className="flex justify-between">
                  <span><T k="auto.tenderprojectfields.attribution_du_marche" fallback="Attribution du marché:" /></span>
                  <span className="font-medium">{formatDateForDisplay(formData.attributionDate)}</span>
                </div>
              )}
              {formData.launchDate && formData.attributionDate && (
                <div className="flex justify-between border-t border-primary/30 pt-1 mt-2">
                  <span><T k="auto.tenderprojectfields.duree_de_la_procedure" fallback="Durée de la procédure:" /></span>
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
