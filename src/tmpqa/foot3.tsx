import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { Text } from '@react-pdf/renderer';
import { PDFDocument } from '../components/reports/pdf/PDFDocument';
import { ReportFooter } from '../components/reports/pdf/ReportPageFrame';
const doc = (
  <PDFDocument title="T" subtitle="S">
    <Text>Bloc unique</Text>
  </PDFDocument>
);
await ReactPDF.renderToFile(doc, '/tmp/pdfqa/foot3.pdf');
console.log(String(ReportFooter));
