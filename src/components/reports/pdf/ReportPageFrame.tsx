import React from 'react';
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Composants d'en-tête / pied de page réutilisables pour l'ensemble des
 * documents PDF (ProjectPDFDocument, CompactProjectPDFDocument, PDFDocument
 * générique, états d'inspection, etc.).
 *
 * Règle métier (Phase 4 — rapports) :
 *  - L'en-tête organisationnel complet (logo, nom, adresse, téléphone, email)
 *    n'apparaît QUE sur la toute première page du document.
 *  - Les pages suivantes affichent un en-tête allégé : titre du projet/rapport
 *    + date + filet de séparation.
 *  - Chaque page affiche systématiquement un pied de page avec la pagination
 *    au format « Page X / Y » (render prop `fixed`, calculé sur l'ensemble du
 *    document, pas seulement sur la page en cours).
 */

export interface ReportCompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

const styles = StyleSheet.create({
  companyHeader: {
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
    paddingBottom: 6,
    marginBottom: 8,
  },
  companyHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    color: '#2563eb',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  companyDetail: {
    marginVertical: 1,
    fontSize: 9,
    color: '#666666',
  },
  companyLogo: {
    maxHeight: 24,
    maxWidth: 60,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 8,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  reportSubtitle: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  // En-tête allégé (pages 2, 3, ...)
  lightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
    marginBottom: 10,
  },
  lightHeaderTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  lightHeaderDate: {
    fontSize: 8,
    color: '#6b7280',
  },
  pageFooter: {
    position: 'absolute',
    bottom: 14,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
  },
});

interface ReportHeaderProps {
  /** Titre affiché en en-tête (allégé sur les pages suivantes). */
  title: string;
  subtitle?: string;
  /** Coordonnées de l'organisation — n'apparaissent que sur la 1ère page. */
  company?: ReportCompanyInfo;
  /** Contenu additionnel (ex: miniature SIG) affiché uniquement en page 1. */
  extra?: React.ReactNode;
}

/**
 * En-tête « intelligent » : plein sur la première page du document (logo,
 * coordonnées organisation), allégé (titre + date + filet) sur les suivantes.
 * Utilise le render prop `fixed`, calculé sur l'ensemble du document.
 */
export function ReportHeader({ title, subtitle, company, extra }: ReportHeaderProps) {
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  const shortDate = format(new Date(), 'dd/MM/yyyy', { locale: fr });

  return (
    <View
      fixed
      render={({ pageNumber }: { pageNumber: number }) =>
        pageNumber === 1 ? (
          <View>
            {company && (
              <View style={styles.companyHeader}>
                <View style={styles.companyHeaderContent}>
                  <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Text style={styles.companyDetail}>{company.address}</Text>
                    <Text style={styles.companyDetail}>Tél: {company.phone}</Text>
                    <Text style={styles.companyDetail}>Email: {company.email}</Text>
                  </View>
                  {company.logo ? <Image src={company.logo} style={styles.companyLogo} /> : null}
                </View>
              </View>
            )}
            <View style={styles.reportHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportTitle}>{title} - Généré le {currentDate}</Text>
                {subtitle && <Text style={styles.reportSubtitle}>{subtitle}</Text>}
              </View>
              {extra}
            </View>
          </View>
        ) : (
          <View style={styles.lightHeader}>
            <Text style={styles.lightHeaderTitle}>{title}</Text>
            <Text style={styles.lightHeaderDate}>{shortDate}</Text>
          </View>
        )
      }
    />
  );
}

interface ReportFooterProps {
  /** Libellé affiché à gauche du pied de page (ex: mention de confidentialité). */
  label?: string;
}

/**
 * Pied de page systématique : pagination "Page X / Y" (calculée sur
 * l'ensemble du document) + mention de confidentialité et date courte.
 */
export function ReportFooter({ label = 'Document confidentiel' }: ReportFooterProps) {
  const shortDate = format(new Date(), 'dd/MM/yyyy', { locale: fr });

  return (
    <View style={styles.pageFooter} fixed>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
      <Text>{label} - {shortDate}</Text>
    </View>
  );
}
