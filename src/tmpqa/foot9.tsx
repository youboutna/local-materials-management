import React from 'react';
import ReactPDF, { Document, Page, Text } from '@react-pdf/renderer';
import { ReportHeader, ReportFooter } from '../components/reports/pdf/ReportPageFrame';
const variants: Record<string, any> = {
  base: { padding: 30, fontSize: 10 },
  helv: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  lh: { padding: 30, fontSize: 10, lineHeight: 1.4 },
  col: { padding: 30, fontSize: 10, flexDirection: 'column', backgroundColor: '#ffffff' },
};
for (const [k, style] of Object.entries(variants)) {
  await ReactPDF.renderToFile(
    <Document><Page size="A4" style={style}>
      <ReportHeader title="T" subtitle="S" />
      {Array.from({length:60}).map((_,i)=><Text key={i}>ligne {i}</Text>)}
      <ReportFooter />
    </Page></Document>, `/tmp/pdfqa/v-${k}.pdf`);
}
