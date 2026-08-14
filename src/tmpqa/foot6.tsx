import React from 'react';
import ReactPDF, { Document, Page, Text, View } from '@react-pdf/renderer';
import { ReportHeader, ReportFooter } from '../components/reports/pdf/ReportPageFrame';
const mk = (head: React.ReactNode, foot: React.ReactNode, out: string) => ReactPDF.renderToFile(
  <Document><Page size="A4" style={{ padding: 30, fontSize: 10 }}>
    {head}
    {Array.from({length:60}).map((_,i)=><Text key={i}>ligne {i}</Text>)}
    {foot}
  </Page></Document>, out);
const inlineFoot = (<View style={{ position:'absolute', bottom:14, left:30, right:30, fontSize:7 }} fixed><Text render={({pageNumber,totalPages}: any)=>`Page ${pageNumber} / ${totalPages}`} /></View>);
await mk(<ReportHeader title="T" />, inlineFoot, '/tmp/pdfqa/a.pdf');
await mk(<View><Text>plain</Text></View>, <ReportFooter />, '/tmp/pdfqa/b.pdf');
