import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { Text, View } from '@react-pdf/renderer';
import { PDFDocument, PDFSection, PDFCard, PDFText } from '../components/reports/pdf/PDFDocument';

const doc = (
  <PDFDocument title="Rapport de Projet" subtitle="Projet Boucle 33 kV Kaédi (Lot 2)" company={{ name: 'HadraTech', address: 'Nouakchott', phone: '+222', email: 'a@b.c' }}>
    <View wrap={false} style={{ marginBottom: 12, padding: 10, backgroundColor: '#eff6ff' }}>
      <Text>Synthèse du projet</Text>
      <Text>Avancement : 66,00 %</Text>
    </View>
    {Array.from({ length: 40 }).map((_, i) => (
      <PDFSection key={i} title={`Section ${i + 1}`}>
        <PDFCard><PDFText label="Ligne" value={`Valeur ${i}`} /></PDFCard>
      </PDFSection>
    ))}
  </PDFDocument>
);
await ReactPDF.renderToFile(doc, '/tmp/pdfqa/out.pdf');
console.log('ok');
