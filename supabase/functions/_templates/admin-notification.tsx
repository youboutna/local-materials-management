// Templates HTML (sans dépendances npm externes) pour l'edge function.

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

interface AdminNotificationProps {
  tender_title: string;
  supplier_name: string;
  supplier_email: string;
  submission_id: string;
}

export const renderAdminNotificationEmail = (props: AdminNotificationProps) => {
  const tenderTitle = escapeHtml(props.tender_title);
  const supplierName = escapeHtml(props.supplier_name);
  const supplierEmail = escapeHtml(props.supplier_email);
  const submissionId = escapeHtml(props.submission_id);

  const currentDate = escapeHtml(
    new Date().toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nouvelle soumission</title>
</head>
<body style="margin:0;background:#ffffff;font-family:Arial, sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;padding:30px;border-radius:10px 10px 0 0;text-align:center;">
      <h1 style="margin:0;font-size:24px;">📨 Nouvelle Soumission</h1>
    </div>

    <div style="background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-top:none;">
      <p style="color:#333;font-size:14px;line-height:1.6;margin:16px 0;">Bonjour,</p>
      <p style="color:#333;font-size:14px;line-height:1.6;margin:16px 0;">Une nouvelle soumission a été enregistrée pour l'appel d'offres :</p>

      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;">
          <span><strong>Appel d'offres:</strong></span>
          <span>${tenderTitle}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;">
          <span><strong>Fournisseur:</strong></span>
          <span>${supplierName}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;">
          <span><strong>Email:</strong></span>
          <span>${supplierEmail}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;">
          <span><strong>ID Soumission:</strong></span>
          <span>${submissionId}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;">
          <span><strong>Date:</strong></span>
          <span>${currentDate}</span>
        </div>
      </div>

      <p style="color:#333;font-size:14px;line-height:1.6;margin:16px 0;"><strong>Actions requises :</strong></p>
      <ul style="margin:10px 0;padding-left:20px;font-size:14px;line-height:1.6;color:#333;">
        <li>Vérifier la complétude du dossier</li>
        <li>Procéder à l'évaluation selon les critères définis</li>
        <li>Utiliser le code secret pour accéder aux documents</li>
      </ul>

      <p style="color:#333;font-size:14px;line-height:1.6;margin:16px 0;">Connectez-vous à la plateforme pour consulter les détails de la soumission.</p>
    </div>

    <div style="text-align:center;padding:20px;">
      <p style="color:#6b7280;font-size:12px;margin:0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>`;
};
