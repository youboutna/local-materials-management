import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PDFDocument, PDFSection, PDFCard, PDFRow, PDFCol, PDFText } from './PDFDocument';
import { TenderDTO } from '@/dtos/reports/reportDTOs';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
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
        <PDFSection title={t('auto.tenderpdfdocument.apercu_de_l_appel_d_offres')} borderColor="#8b5cf6">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label={t('auto.tenderpdfdocument.reference')} value={tender.projectReference || 'Non défini'} />
                <PDFText label={t('auto.tenderpdfdocument.titre')} value={tender.title || 'Non défini'} />
                <PDFText label={t('auto.tenderpdfdocument.statut')} value={getStatusText(tender.status)} />
              </PDFCol>
              <PDFCol>
                <PDFText
                  label={t('auto.tenderpdfdocument.date_de_lancement')}
                  value={tender.launchDate ? format(new Date(tender.launchDate), 'dd/MM/yyyy') : 'Non défini'}
                />
                <PDFText
                  label={t('auto.tenderpdfdocument.date_d_attribution')}
                  value={tender.attributionDate ? format(new Date(tender.attributionDate), 'dd/MM/yyyy') : 'Non défini'}
                />
                <PDFText
                  label={t('auto.tenderpdfdocument.mode_de_selection')}
                  value={tender.selectionMode || 'Non défini'}
                />
              </PDFCol>
            </PDFRow>
            {tender.description && (
              <PDFRow>
                <PDFCol>
                  <PDFText label={t('auto.tenderpdfdocument.description')} value={tender.description} />
                </PDFCol>
              </PDFRow>
            )}
          </PDFCard>
        </PDFSection>
      )}

      {/* Workflow Status */}
      {reportConfig.includeSections.workflow && (
        <PDFSection title={t('auto.tenderpdfdocument.statut_du_workflow')} borderColor="#10b981">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label={t('auto.tenderpdfdocument.statut_actuel')} value={getStatusText(tender.status)} />
                <PDFText label={t('auto.tenderpdfdocument.type_de_rapport')} value={reportConfig.reportType} />
              </PDFCol>
              <PDFCol>
                <PDFText
                  label={t('auto.tenderpdfdocument.cree_le')}
                  value={tender.createdAt ? format(new Date(tender.createdAt), 'dd/MM/yyyy') : 'Non défini'}
                />
                <PDFText
                  label={t('auto.tenderpdfdocument.derniere_modification')}
                  value={tender.updatedAt ? format(new Date(tender.updatedAt), 'dd/MM/yyyy') : 'Non défini'}
                />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Timeline */}
      {reportConfig.includeSections.timeline && (
        <PDFSection title={t('auto.tenderpdfdocument.calendrier')} borderColor="#f59e0b">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                {tender.launchDate && (
                  <PDFText
                    label={t('auto.tenderpdfdocument.lancement')}
                    value={format(new Date(tender.launchDate), 'dd MMM yyyy', { locale: fr })}
                  />
                )}
                {tender.attributionDate && (
                  <PDFText
                    label={t('auto.tenderpdfdocument.attribution')}
                    value={format(new Date(tender.attributionDate), 'dd MMM yyyy', { locale: fr })}
                  />
                )}
              </PDFCol>
              <PDFCol>
                <PDFText
                  label={t('auto.tenderpdfdocument.type_de_marche')}
                  value={tender.marketType || 'Non défini'}
                />
                <PDFText
                  label={t('auto.tenderpdfdocument.source_de_financement')}
                  value={tender.financingSource || 'Non défini'}
                />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Evaluation Criteria */}
      {reportConfig.includeSections.evaluation && (
        <PDFSection title={t('auto.tenderpdfdocument.informations_sur_l_appel_d_offres')} borderColor="#3b82f6">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label={t('auto.tenderpdfdocument.mode_de_selection')} value={tender.selectionMode || 'Non défini'} />
                <PDFText label={t('auto.tenderpdfdocument.type_de_marche')} value={tender.marketType || 'Non défini'} />
              </PDFCol>
              <PDFCol>
                <PDFText label={t('auto.tenderpdfdocument.source_de_financement')} value={tender.financingSource || 'Non défini'} />
                <PDFText label={t('auto.tenderpdfdocument.reference_projet')} value={tender.projectReference || 'Non défini'} />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}

      {/* Additional Notes */}
      {reportConfig.notes && (
        <PDFSection title={t('auto.tenderpdfdocument.notes')} borderColor="#ef4444">
          <PDFCard>
            <PDFText label="" value={reportConfig.notes} />
          </PDFCard>
        </PDFSection>
      )}

      {/* Signature Section */}
      {reportConfig.requireSignature && reportConfig.signatoryName && (
        <PDFSection title={t('auto.tenderpdfdocument.signature')} borderColor="#6b7280">
          <PDFCard>
            <PDFRow>
              <PDFCol>
                <PDFText label={t('auto.tenderpdfdocument.nom_du_signataire')} value={reportConfig.signatoryName} />
                {reportConfig.signatoryTitle && (
                  <PDFText label={t('auto.tenderpdfdocument.titre')} value={reportConfig.signatoryTitle} />
                )}
                <PDFText label={t('auto.tenderpdfdocument.date')} value={format(new Date(), 'dd MMMM yyyy', { locale: fr })} />
              </PDFCol>
              <PDFCol>
                <PDFText label={t('auto.tenderpdfdocument.signature')} value="[Signature requise]" />
              </PDFCol>
            </PDFRow>
          </PDFCard>
        </PDFSection>
      )}
    </PDFDocument>
  );
}