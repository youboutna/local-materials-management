import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText } from './PDFDocument';

interface TenderPDFDocumentProps {
  tender: any;
  reportConfig: {
    title: string;
    includeSections: {
      overview: boolean;
      workflow: boolean;
      suppliers: boolean;
      documents: boolean;
      evaluation: boolean;
      timeline: boolean;
      signatures: boolean;
    };
    reportType: 'workflow' | 'evaluation' | 'final';
    notes?: string;
    requireSignature: boolean;
    signatoryName?: string;
    signatoryTitle?: string;
  };
}

export function TenderPDFDocument({ tender, reportConfig }: TenderPDFDocumentProps) {
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'Brouillon',
      'published': 'Publié',
      'open': 'Ouvert',
      'evaluation': 'En évaluation',
      'awarded': 'Attribué',
      'closed': 'Fermé'
    };
    return statusMap[status] || status;
  };

  return (
    <PDFDocument
      title={reportConfig.title}
      subtitle={`Référence: ${tender.reference || 'Non défini'} - ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`}
    >
      {/* Tender Overview */}
      {reportConfig.includeSections.overview && (
        <PDFSection title="Aperçu de l'Appel d'Offres" borderColor="#8b5cf6">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Référence" value={tender.reference || 'Non défini'} />
                <PDFText label="Titre" value={tender.title || 'Non défini'} />
                <PDFText label="Statut" value={getStatusText(tender.status)} />
              </PDFCol>
              <PDFCol>
                <PDFText 
                  label="Budget Min" 
                  value={tender.budget_min ? `${tender.budget_min.toLocaleString('fr-FR')} MRU` : 'Non défini'} 
                />
                <PDFText 
                  label="Budget Max" 
                  value={tender.budget_max ? `${tender.budget_max.toLocaleString('fr-FR')} MRU` : 'Non défini'} 
                />
                <PDFText 
                  label="Date limite" 
                  value={tender.deadline_date ? format(new Date(tender.deadline_date), 'dd/MM/yyyy') : 'Non défini'} 
                />
              </PDFCol>
            </PDFRow>
            {tender.description && (
              <PDFRow>
                <PDFCol>
                  <PDFText label="Description" value={tender.description} />
                </PDFCol>
              </PDFRow>
            )}
          </PDFCard>
        </PDFSection>
      )}

      {/* Workflow Status */}
      {reportConfig.includeSections.workflow && (
        <PDFSection title="Statut du Workflow" borderColor="#10b981">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Statut actuel" value={getStatusText(tender.status)} />
                <PDFText label="Type de rapport" value={reportConfig.reportType} />
              </PDFCol>
              <PDFCol>
                <PDFText 
                  label="Créé le" 
                  value={tender.created_at ? format(new Date(tender.created_at), 'dd/MM/yyyy') : 'Non défini'} 
                />
                <PDFText 
                  label="Dernière modification" 
                  value={tender.updated_at ? format(new Date(tender.updated_at), 'dd/MM/yyyy') : 'Non défini'} 
                />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Timeline */}
      {reportConfig.includeSections.timeline && (
        <PDFSection title="Calendrier" borderColor="#f59e0b">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                {tender.publication_date && (
                  <PDFText 
                    label="Publication" 
                    value={format(new Date(tender.publication_date), 'dd MMM yyyy', { locale: fr })} 
                  />
                )}
                {tender.deadline_date && (
                  <PDFText 
                    label="Date limite" 
                    value={format(new Date(tender.deadline_date), 'dd MMM yyyy', { locale: fr })} 
                  />
                )}
              </PDFCol>
              <PDFCol>
                {tender.attribution_date && (
                  <PDFText 
                    label="Attribution" 
                    value={format(new Date(tender.attribution_date), 'dd MMM yyyy', { locale: fr })} 
                  />
                )}
                {tender.contract_start_date && (
                  <PDFText 
                    label="Début contrat" 
                    value={format(new Date(tender.contract_start_date), 'dd MMM yyyy', { locale: fr })} 
                  />
                )}
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Evaluation Criteria */}
      {reportConfig.includeSections.evaluation && (
        <PDFSection title="Critères d'Évaluation" borderColor="#3b82f6">
          <PDFCard>
            {tender.evaluation_criteria ? (
              <PDFText label="Critères" value={tender.evaluation_criteria} />
            ) : (
              <PDFText label="Critères" value="Aucun critère d'évaluation défini." />
            )}
          </PDFCard>
        </PDFSection>
      )}

      {/* Additional Notes */}
      {reportConfig.notes && (
        <PDFSection title="Notes" borderColor="#ef4444">
          <PDFCard>
            <PDFText label="" value={reportConfig.notes} />
          </PDFCard>
        </PDFSection>
      )}

      {/* Signature Section */}
      {reportConfig.requireSignature && reportConfig.signatoryName && (
        <PDFSection title="Signature" borderColor="#6b7280">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Nom du signataire" value={reportConfig.signatoryName} />
                {reportConfig.signatoryTitle && (
                  <PDFText label="Titre" value={reportConfig.signatoryTitle} />
                )}
                <PDFText label="Date" value={format(new Date(), 'dd MMMM yyyy', { locale: fr })} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Signature" value="[Signature requise]" />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}
    </PDFDocument>
  );
}