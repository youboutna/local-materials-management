import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface AdminNotificationProps {
  tender_title: string;
  supplier_name: string;
  supplier_email: string;
  submission_id: string;
}

export const AdminNotificationEmail = ({
  tender_title,
  supplier_name,
  supplier_email,
  submission_id,
}: AdminNotificationProps) => {
  const currentDate = new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Html>
      <Head />
      <Preview>Nouvelle soumission - {tender_title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={header}>
            <Heading style={h1}>📨 Nouvelle Soumission</Heading>
          </div>
          <Section style={content}>
            <Text style={text}>Bonjour,</Text>
            
            <Text style={text}>
              Une nouvelle soumission a été enregistrée pour l'appel d'offres :
            </Text>
            
            <div style={infoBox}>
              <div style={detailRow}>
                <span style={detailLabel}><strong>Appel d'offres:</strong></span>
                <span style={detailValue}>{tender_title}</span>
              </div>
              <div style={detailRow}>
                <span style={detailLabel}><strong>Fournisseur:</strong></span>
                <span style={detailValue}>{supplier_name}</span>
              </div>
              <div style={detailRow}>
                <span style={detailLabel}><strong>Email:</strong></span>
                <span style={detailValue}>{supplier_email}</span>
              </div>
              <div style={detailRow}>
                <span style={detailLabel}><strong>ID Soumission:</strong></span>
                <span style={detailValue}>{submission_id}</span>
              </div>
              <div style={{ ...detailRow, borderBottom: 'none' }}>
                <span style={detailLabel}><strong>Date:</strong></span>
                <span style={detailValue}>{currentDate}</span>
              </div>
            </div>

            <Text style={text}><strong>Actions requises :</strong></Text>
            <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
              <li>Vérifier la complétude du dossier</li>
              <li>Procéder à l'évaluation selon les critères définis</li>
              <li>Utiliser le code secret pour accéder aux documents</li>
            </ul>

            <Text style={text}>
              Connectez-vous à la plateforme pour consulter les détails de la soumission.
            </Text>
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

export default AdminNotificationEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  maxWidth: '600px',
};

const header = {
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
  backgroundColor: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const detailRow = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid #e5e7eb',
};

const detailLabel = {
  fontSize: '14px',
};

const detailValue = {
  fontSize: '14px',
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
