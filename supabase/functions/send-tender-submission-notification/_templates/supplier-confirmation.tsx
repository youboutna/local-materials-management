// Templates HTML (sans dépendances npm externes) pour l'edge function.

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

interface SupplierConfirmationProps {
  supplier_name: string;
  tender_title: string;
  submission_id: string;
  secret_code: string;
}

const formatSecretCode = (code: string): string =>
  code.length >= 6 ? `${code.substring(0, 6)}-${code.substring(6)}` : code;

export const renderSupplierConfirmationEmail = (props: SupplierConfirmationProps) => {
  const supplierName = escapeHtml(props.supplier_name);
  const tenderTitle = escapeHtml(props.tender_title);
  const submissionId = escapeHtml(props.submission_id);
  const secret = escapeHtml(formatSecretCode(props.secret_code));

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirmation de soumission</title>
</head>
<body style="margin:0;background:#ffffff;font-family:Arial, sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:30px;border-radius:10px 10px 0 0;text-align:center;">
      <h1 style="margin:0;font-size:24px;">✅ Soumission Confirmée</h1>
    </div>

    <div style="background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-top:none;">
      <p style="color:#333;font-size:14px;line-height:1.6;margin:16px 0;">Bonjour <strong>${supplierName}</strong>,</p>
      <p style="color:#333;font-size:14px;line-height:1.6;margin:16px 0;">Nous confirmons la réception de votre dossier de candidature pour l'appel d'offres :</p>

      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:15px;margin:20px 0;font-size:14px;">
        <strong>📋 ${tenderTitle}</strong><br />
        <span style="font-size:12px;color:#6b7280;">ID de soumission: ${submissionId}</span>
      </div>

      <p style="color:#333;font-size:14px;line-height:1.6;margin:16px 0;">Votre dossier a été enregistré avec succès. Un code secret a été généré pour permettre à la commission d'évaluation d'accéder à vos documents.</p>

      <div style="background:#fff;border:2px dashed #667eea;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
        <div style="margin:0;font-size:14px;color:#6b7280;">Code Secret</div>
        <div style="font-size:28px;font-weight:bold;font-family:'Courier New', monospace;color:#667eea;letter-spacing:2px;margin:10px 0;">${secret}</div>
        <div style="margin-top:10px;font-size:12px;color:#6b7280;">Conservez précieusement ce code</div>
      </div>

      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:15px;margin:20px 0;font-size:14px;">
        <strong>📌 Instructions importantes :</strong>
        <ul style="margin:10px 0;padding-left:20px;">
          <li>Ce code est strictement confidentiel</li>
          <li>Partagez-le uniquement avec la commission d'évaluation officielle</li>
          <li>Le code permet d'accéder à l'ensemble de vos documents</li>
        </ul>
      </div>

      <p style="color:#333;font-size:14px;line-height:1.6;margin:16px 0;"><strong>Prochaines étapes :</strong></p>
      <ol style="margin:10px 0;padding-left:20px;font-size:14px;line-height:1.6;color:#333;">
        <li>La commission d'évaluation utilisera ce code pour accéder à votre dossier</li>
        <li>Vous serez notifié de l'avancement du processus d'évaluation</li>
        <li>Les résultats seront communiqués selon le calendrier de l'appel d'offres</li>
      </ol>

      <p style="color:#333;font-size:14px;line-height:1.6;margin:16px 0;">Merci pour votre candidature !</p>
    </div>

    <div style="text-align:center;padding:20px;">
      <p style="color:#6b7280;font-size:12px;margin:0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`;
};
