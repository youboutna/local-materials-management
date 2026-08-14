import React from 'react';
import ReactPDF, { Document, Page, Text } from '@react-pdf/renderer';
import { ReportHeader, ReportFooter } from '../components/reports/pdf/ReportPageFrame';
await ReactPDF.renderToFile(
  <Document><Page size="A4" style={{ padding: 30, fontSize: 10 }}>
    <ReportHeader title="T" subtitle="S" />
    {Array.from({length:300}).map((_,i)=><Text key={i}>ligne {i}</Text>)}
    <ReportFooter />
  </Page></Document>, '/tmp/pdfqa/d.pdf');
