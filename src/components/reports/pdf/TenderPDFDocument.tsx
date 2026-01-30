import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText } from './PDFDocument';
import { TenderDTO } from '@/dtos/reports/reportDTOs';

interface TenderPDFDocumentProps {
  tender: TenderDTO;
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
      subtitle={`Référence: ${tender.projectReference || 'Non défini'} - ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`}
    >
      {/* Tender Overview */}
      {reportConfig.includeSections.overview && (
        <PDFSection title="Aperçu de l'Appel d'Offres" borderColor="#8b5cf6">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Référence" value={tender.projectReference || 'Non défini'} />
                <PDFText label="Titre" value={tender.title || 'Non défini'} />
                <PDFText label="Statut" value={getStatusText(tender.status)} />
              </PDFCol>
              <PDFCol>
                <PDFText 
                  label="Date de lancement" 
                  value={tender.launchDate ? format(new Date(tender.launchDate), 'dd/MM/yyyy') : 'Non défini'} 
                />
                <PDFText 
                  label="Date d'attribution" 
                  value={tender.attributionDate ? format(new Date(tender.attributionDate), 'dd/MM/yyyy') : 'Non défini'} 
                />
                <PDFText 
                  label="Mode de sélection" 
                  value={tender.selectionMode || 'Non défini'} 
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
                  value={tender.createdAt ? format(new Date(tender.createdAt), 'dd/MM/yyyy') : 'Non défini'} 
                />
                <PDFText 
                  label="Dernière modification" 
                  value={tender.updatedAt ? format(new Date(tender.updatedAt), 'dd/MM/yyyy') : 'Non défini'} 
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
                {tender.launchDate && (
                  <PDFText 
                    label="Lancement" 
                    value={format(new Date(tender.launchDate), 'dd MMM yyyy', { locale: fr })} 
                  />
                )}
                {tender.attributionDate && (
                  <PDFText 
                    label="Attribution" 
                    value={format(new Date(tender.attributionDate), 'dd MMM yyyy', { locale: fr })} 
                  />
                )}
              </PDFCol>
              <PDFCol>
                <PDFText 
                  label="Type de marché" 
                  value={tender.marketType || 'Non défini'} 
                />
                <PDFText 
                  label="Source de financement" 
                  value={tender.financingSource || 'Non défini'} 
                />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Evaluation Criteria */}
      {reportConfig.includeSections.evaluation && (
        <PDFSection title="Informations sur l'appel d'offres" borderColor="#3b82f6">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label="Mode de sélection" value={tender.selectionMode || 'Non défini'} />
                <PDFText label="Type de marché" value={tender.marketType || 'Non défini'} />
              </PDFCol>
              <PDFCol>
                <PDFText label="Source de financement" value={tender.financingSource || 'Non défini'} />
                <PDFText label="Référence projet" value={tender.projectReference || 'Non défini'} />
              </PDFCol>
            </PDFRow>
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