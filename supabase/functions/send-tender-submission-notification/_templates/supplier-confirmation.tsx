import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface SupplierConfirmationProps {
  supplier_name: string;
  tender_title: string;
  submission_id: string;
  secret_code: string;
}

export const SupplierConfirmationEmail = ({
  supplier_name,
  tender_title,
  submission_id,
  secret_code,
}: SupplierConfirmationProps) => {
  const formatSecretCode = (code: string): string => {
    if (code.length >= 6) {
      return `${code.substring(0, 6)}-${code.substring(6)}`;
    }
    return code;
  };

  const formattedSecret = formatSecretCode(secret_code);

  return (
    <Html>
      <Head />
      <Preview>Confirmation de soumission - {tender_title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={header}>
            <Heading style={h1}>✅ Soumission Confirmée</Heading>
          </div>
          <Section style={content}>
            <Text style={text}>
              Bonjour <strong>{supplier_name}</strong>,
            </Text>
            
            <Text style={text}>
              Nous confirmons la réception de votre dossier de candidature pour l'appel d'offres :
            </Text>
            
            <div style={infoBox}>
              <strong>📋 {tender_title}</strong><br />
              <span style={{ fontSize: '12px', color: '#6b7280' }}>
                ID de soumission: {submission_id}
              </span>
            </div>

            <Text style={text}>
              Votre dossier a été enregistré avec succès. Un code secret a été généré pour permettre 
              à la commission d'évaluation d'accéder à vos documents.
            </Text>

            <div style={secretBox}>
              <Text style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Code Secret
              </Text>
              <div style={secretCode}>{formattedSecret}</div>
              <Text style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                Conservez précieusement ce code
              </Text>
            </div>

            <div style={infoBox}>
              <strong>📌 Instructions importantes :</strong>
              <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                <li>Ce code est strictement confidentiel</li>
                <li>Partagez-le uniquement avec la commission d'évaluation officielle</li>
                <li>Le code permet d'accéder à l'ensemble de vos documents</li>
                <li>Vous pouvez le régénérer si nécessaire depuis votre espace fournisseur</li>
              </ul>
            </div>

            <Text style={text}><strong>Prochaines étapes :</strong></Text>
            <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li>La commission d'évaluation utilisera ce code pour accéder à votre dossier</li>
              <li>Vous serez notifié de l'avancement du processus d'évaluation</li>
              <li>Les résultats seront communiqués selon le calendrier de l'appel d'offres</li>
            </ol>

            <Text style={text}>Merci pour votre candidature !</Text>
          </Section>
          <div style={footer}>
            <Text style={footerText}>
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  );
};

export default SupplierConfirmationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  maxWidth: '600px',
};

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '30px',
  borderRadius: '10px 10px 0 0',
  textAlign: 'center' as const,
};

const h1 = {
  color: 'white',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const content = {
  backgroundColor: '#f9fafb',
  padding: '30px',
  border: '1px solid #e5e7eb',
  borderTop: 'none',
};

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #3b82f6',
  padding: '15px',
  margin: '20px 0',
  fontSize: '14px',
};

const secretBox = {
  backgroundColor: 'white',
  border: '2px dashed #667eea',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const secretCode = {
  fontSize: '28px',
  fontWeight: 'bold',
  fontFamily: "'Courier New', monospace",
  color: '#667eea',
  letterSpacing: '2px',
  margin: '10px 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '20px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0',
};
