import React from 'react';
import ReactPDF, { Document, Font, Page, Text, View } from '@react-pdf/renderer';
Font.register({ family: "Open Sans", src: "https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0b.woff2" });
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
await ReactPDF.renderToFile(doc, '/tmp/pdfqa/foot4.pdf');
console.log(require('@react-pdf/renderer/package.json').version);
