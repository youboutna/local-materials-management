import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Register fonts for better text rendering
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0b.woff2'
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#2563eb',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 15,
    paddingLeft: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  card: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  col: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  value: {
    color: '#374151',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontSize: 11,
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    fontSize: 10,
  },
  statusBadge: {
    padding: '2 6',
    borderRadius: 4,
    fontSize: 10,
    textAlign: 'center',
  },
  metricCard: {
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 8,
    textAlign: 'center',
    marginRight: 10,
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    color: '#1d4ed8',
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 15,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#6b7280',
  },
});

interface PDFDocumentProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo?: string;
  };
}

export function PDFDocument({ title, subtitle, children, company }: PDFDocumentProps) {
  const currentDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            <Text style={styles.subtitle}>Généré le {currentDate}</Text>
          </View>
          {company && (
            <View style={styles.headerRight}>
              <Text style={[styles.subtitle, { fontWeight: 'bold' }]}>{company.name}</Text>
              <Text style={styles.subtitle}>{company.address}</Text>
              <Text style={styles.subtitle}>{company.phone}</Text>
              <Text style={styles.subtitle}>{company.email}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        {children}

        {/* Footer */}
        <Text style={styles.footer}>
          Ce document a été généré automatiquement le {currentDate} - Document confidentiel
        </Text>
        
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
          `Page ${pageNumber} sur ${totalPages}`
        } fixed />
      </Page>
    </Document>
  );
}

// Reusable components for PDFs
export function PDFSection({ title, children, borderColor = '#2563eb' }: { 
  title: string; 
  children: React.ReactNode; 
  borderColor?: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeader, { borderLeftColor: borderColor }]}>{title}</Text>
      {children}
    </View>
  );
}

export function PDFCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function PDFRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function PDFCol({ children }: { children: React.ReactNode }) {
  return <View style={styles.col}>{children}</View>;
}

export function PDFText({ label, value }: { label: string; value: string }) {
  return (
    <Text>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}> {value}</Text>
    </Text>
  );
}

export function PDFTable({ headers, data, columnWidths }: {
  headers: string[];
  data: string[][];
  columnWidths?: string[];
}) {
  const widths = columnWidths || headers.map(() => `${100/headers.length}%`);

  return (
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableRow}>
        {headers.map((header, index) => (
          <View key={index} style={[styles.tableCol, { width: widths[index] }]}>
            <Text style={styles.tableHeader}>{header}</Text>
          </View>
        ))}
      </View>
      
      {/* Data rows */}
      {data.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.tableRow}>
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={[styles.tableCol, { width: widths[cellIndex] }]}>
              <Text style={styles.tableCell}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function PDFMetricCard({ title, value, color = '#1d4ed8' }: {
  title: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricTitle, { color }]}>{title}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

export function PDFStatusBadge({ status, color }: { status: string; color: string }) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: color }]}>
      <Text style={{ color: '#ffffff', fontSize: 10 }}>{status}</Text>
    </View>
  );
}