import React from 'react';
import ReactPDF, { Document, Page, Text, View } from '@react-pdf/renderer';
const doc = (
  <Document>
    <Page size="A4" style={{ padding: 30, fontSize: 10 }}>
      <Text>Contenu page 1</Text>
      <View style={{ position:'absolute', top:10, left:30, right:30 }} fixed render={({pageNumber}: any)=> pageNumber===1?null:(<><Text>Titre léger</Text></>)} />
      {Array.from({length:120}).map((_,i)=><Text key={i}>ligne {i}</Text>)}
      <View style={{ position:'absolute', bottom:14, left:30, right:30, flexDirection:'row', justifyContent:'space-between', fontSize:7 }} fixed>
        <Text render={({pageNumber,totalPages}: any)=>`Page ${pageNumber} / ${totalPages}`} />
        <Text>Confidentiel</Text>
      </View>
    </Page>
  </Document>
);
await ReactPDF.renderToFile(doc, '/tmp/pdfqa/foot2.pdf');
