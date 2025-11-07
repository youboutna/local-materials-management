import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmissionNotificationRequest {
  supplier_email: string;
  supplier_name: string;
  tender_title: string;
  submission_id: string;
  secret_code: string;
  admin_emails?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      supplier_email,
      supplier_name,
      tender_title,
      submission_id,
      secret_code,
      admin_emails = []
    }: SubmissionNotificationRequest = await req.json();

    console.log("Sending submission notifications:", {
      supplier_email,
      tender_title,
      submission_id,
      admin_count: admin_emails.length
    });

    // Format secret code for display
    const formatSecretCode = (code: string): string => {
      if (code.length >= 6) {
        return `${code.substring(0, 6)}-${code.substring(6)}`;
      }
      return code;
    };

    const formattedSecret = formatSecretCode(secret_code);

    // Email to supplier (confirmation)
    const supplierEmailResponse = await resend.emails.send({
      from: "Plateforme d'Appels d'Offres <onboarding@resend.dev>",
      to: [supplier_email],
      subject: `Confirmation de soumission - ${tender_title}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .secret-box {
                background: white;
                border: 2px dashed #667eea;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
              }
              .secret-code {
                font-size: 28px;
                font-weight: bold;
                font-family: 'Courier New', monospace;
                color: #667eea;
                letter-spacing: 2px;
                margin: 10px 0;
              }
              .info-box {
                background: #eff6ff;
                border-left: 4px solid #3b82f6;
                padding: 15px;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #6b7280;
                font-size: 14px;
              }
              .button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 10px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>✅ Soumission Confirmée</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${supplier_name}</strong>,</p>
              
              <p>Nous confirmons la réception de votre dossier de candidature pour l'appel d'offres :</p>
              
              <div class="info-box">
                <strong>📋 ${tender_title}</strong><br>
                <small>ID de soumission: ${submission_id}</small>
              </div>

              <p>Votre dossier a été enregistré avec succès. Un code secret a été généré pour permettre à la commission d'évaluation d'accéder à vos documents.</p>

              <div class="secret-box">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Code Secret</p>
                <div class="secret-code">${formattedSecret}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                  Conservez précieusement ce code
                </p>
              </div>

              <div class="info-box">
                <strong>📌 Instructions importantes :</strong>
                <ul style="margin: 10px 0;">
                  <li>Ce code est strictement confidentiel</li>
                  <li>Partagez-le uniquement avec la commission d'évaluation officielle</li>
                  <li>Le code permet d'accéder à l'ensemble de vos documents</li>
                  <li>Vous pouvez le régénérer si nécessaire depuis votre espace fournisseur</li>
                </ul>
              </div>

              <p><strong>Prochaines étapes :</strong></p>
              <ol>
                <li>La commission d'évaluation utilisera ce code pour accéder à votre dossier</li>
                <li>Vous serez notifié de l'avancement du processus d'évaluation</li>
                <li>Les résultats seront communiqués selon le calendrier de l'appel d'offres</li>
              </ol>

              <p>Merci pour votre candidature !</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Supplier email sent:", supplierEmailResponse);

    // Email to administrators (notification of new submission)
    const adminEmailPromises = admin_emails.map(admin_email =>
      resend.emails.send({
        from: "Plateforme d'Appels d'Offres <onboarding@resend.dev>",
        to: [admin_email],
        subject: `Nouvelle soumission - ${tender_title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white;
                  padding: 30px;
                  border-radius: 10px 10px 0 0;
                  text-align: center;
                }
                .content {
                  background: #f9fafb;
                  padding: 30px;
                  border: 1px solid #e5e7eb;
                  border-top: none;
                }
                .info-box {
                  background: white;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 20px;
                  margin: 20px 0;
                }
                .detail-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 8px 0;
                  border-bottom: 1px solid #e5e7eb;
                }
                .footer {
                  text-align: center;
                  padding: 20px;
                  color: #6b7280;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>📨 Nouvelle Soumission</h1>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                
                <p>Une nouvelle soumission a été enregistrée pour l'appel d'offres :</p>
                
                <div class="info-box">
                  <div class="detail-row">
                    <span><strong>Appel d'offres:</strong></span>
                    <span>${tender_title}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Fournisseur:</strong></span>
                    <span>${supplier_name}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>Email:</strong></span>
                    <span>${supplier_email}</span>
                  </div>
                  <div class="detail-row">
                    <span><strong>ID Soumission:</strong></span>
                    <span>${submission_id}</span>
                  </div>
                  <div class="detail-row" style="border-bottom: none;">
                    <span><strong>Date:</strong></span>
                    <span>${new Date().toLocaleDateString('fr-FR', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>

                <p><strong>Actions requises :</strong></p>
                <ul>
                  <li>Vérifier la complétude du dossier</li>
                  <li>Procéder à l'évaluation selon les critères définis</li>
                  <li>Utiliser le code secret pour accéder aux documents</li>
                </ul>

                <p>Connectez-vous à la plateforme pour consulter les détails de la soumission.</p>
              </div>
              <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              </div>
            </body>
          </html>
        `,
      })
    );

    const adminEmailResults = await Promise.allSettled(adminEmailPromises);
    console.log("Admin emails sent:", adminEmailResults);

    return new Response(
      JSON.stringify({
        success: true,
        supplier_email_sent: supplierEmailResponse.id,
        admin_emails_sent: adminEmailResults.filter(r => r.status === 'fulfilled').length,
        admin_emails_failed: adminEmailResults.filter(r => r.status === 'rejected').length
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-tender-submission-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
