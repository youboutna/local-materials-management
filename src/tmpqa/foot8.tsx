import React from 'react';
import ReactPDF, { Text } from '@react-pdf/renderer';
import { PDFDocument, PDFSection, PDFCard, PDFText } from '../components/reports/pdf/PDFDocument';
const company = { name:'H', address:'N', phone:'+2', email:'a@b.c' };
await ReactPDF.renderToFile(<PDFDocument title="T" subtitle="S" company={company}>{Array.from({length:60}).map((_,i)=><Text key={i}>l {i}</Text>)}</PDFDocument>, '/tmp/pdfqa/e.pdf');
await ReactPDF.renderToFile(<PDFDocument title="T" subtitle="S">{Array.from({length:40}).map((_,i)=>(<PDFSection key={i} title={`S ${i}`}><PDFCard><PDFText label="L" value={`v${i}`} /></PDFCard></PDFSection>))}</PDFDocument>, '/tmp/pdfqa/f.pdf');
