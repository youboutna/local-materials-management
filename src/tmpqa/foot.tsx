import React from 'react';
import ReactPDF, { Document, Page, Text, View } from '@react-pdf/renderer';
const doc = (
  <Document>
    <Page size="A4" style={{ padding: 30, fontSize: 10 }}>
      <Text>Contenu</Text>
      {Array.from({length:60}).map((_,i)=><Text key={i}>ligne {i}</Text>)}
      <View style={{ position:'absolute', bottom:14, left:30, right:30, flexDirection:'row', justifyContent:'space-between', fontSize:7 }} fixed>
        <Text render={({pageNumber,totalPages})=>`Page ${pageNumber} / ${totalPages}`} />
        <Text>Confidentiel</Text>
      </View>
    </Page>
  </Document>
);
await ReactPDF.renderToFile(doc, '/tmp/pdfqa/foot.pdf');
console.log(require('@react-pdf/renderer/package.json').version);
