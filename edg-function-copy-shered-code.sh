#!/bin/bash
set -e

SHARED_DIR="supabase/functions/_shared"
TEMPLATES_DIR="supabase/functions/_templates"

echo "🧹 Nettoyage complet des fichiers _shared/..."

# ============================================================
# 1. Supprimer tous les fichiers avec des noms invalides
# ============================================================
if [ -d "$SHARED_DIR" ]; then
  # Supprimer les fichiers avec des noms contenant des points multiples
  find "$SHARED_DIR" -type f -name "*.*.*" -delete 2>/dev/null || true
  # Supprimer les fichiers avec des noms incorrects
  find "$SHARED_DIR" -type f -name "*Factory.ts.ts*" -delete 2>/dev/null || true
  find "$SHARED_DIR" -type f -name "*Service.ts.ts*" -delete 2>/dev/null || true
  find "$SHARED_DIR" -type f -name "*Adapter.ts.ts*" -delete 2>/dev/null || true
fi

# ============================================================
# 2. Recréer _shared/ avec les bons noms de fichiers
# ============================================================
echo "📁 Recréation de _shared/ avec les bons fichiers..."

rm -rf "$SHARED_DIR"
mkdir -p "$SHARED_DIR"
mkdir -p "$TEMPLATES_DIR"

# Copier les fichiers email (noms exacts)
cp src/application/services/email/EmailProvider.ts "$SHARED_DIR/"
cp src/application/services/email/EmailService.ts "$SHARED_DIR/"
cp src/application/services/email/EmailServiceFactory.ts "$SHARED_DIR/"

# Copier les adaptateurs (chercher dans les deux emplacements possibles)
find src -path "*/email/SmtpAdapter.ts" -exec cp {} "$SHARED_DIR/SmtpAdapter.ts" \; 2>/dev/null || echo "⚠️ SmtpAdapter non trouvé"
find src -path "*/email/ResendAdapter.ts" -exec cp {} "$SHARED_DIR/ResendAdapter.ts" \; 2>/dev/null || echo "⚠️ ResendAdapter non trouvé"
find src -path "*/email/SendGridAdapter.ts" -exec cp {} "$SHARED_DIR/SendGridAdapter.ts" \; 2>/dev/null || echo "⚠️ SendGridAdapter non trouvé"

# DocumentValidationService (service léger)
cat > "$SHARED_DIR/DocumentValidationService.ts" << 'EOF'
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  administrative: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg'],
  technical: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'application/zip'],
  financial: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

const MAX_FILE_SIZES: Record<string, number> = {
  administrative: 10 * 1024 * 1024,
  technical: 20 * 1024 * 1024,
  financial: 15 * 1024 * 1024,
};

const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.msi'];

export class DocumentValidationService {
  async validateDocument(documentId: string, submissionId: string, expectedCategory?: string) {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !doc) throw new Error('Document not found');

    const errors: string[] = [];
    const warnings: string[] = [];

    const category = expectedCategory || 'administrative';
    const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.administrative;
    if (doc.file_size && doc.file_size > maxSize) {
      errors.push(`Taille dépassée (${(doc.file_size / 1024 / 1024).toFixed(2)} MB > ${(maxSize / 1024 / 1024).toFixed(2)} MB)`);
    }

    const allowed = ALLOWED_MIME_TYPES[category] || ALLOWED_MIME_TYPES.administrative;
    if (doc.mime_type && !allowed.includes(doc.mime_type)) {
      errors.push(`Type MIME non autorisé: ${doc.mime_type}`);
    }

    if (!doc.file_name || doc.file_name.trim().length === 0) {
      errors.push('Nom de fichier invalide');
    }

    const ext = doc.file_name?.toLowerCase().split('.').pop() || '';
    if (DANGEROUS_EXTENSIONS.some(e => e === `.${ext}`)) {
      errors.push(`Extension dangereuse: .${ext}`);
    }

    if (!doc.file_url) {
      errors.push('URL du fichier manquante');
    } else {
      try {
        const res = await fetch(doc.file_url, { method: 'HEAD' });
        if (!res.ok) warnings.push('Fichier potentiellement inaccessible');
      } catch {
        warnings.push('Erreur de vérification d\'accessibilité');
      }
    }

    if (doc.mime_type === 'application/pdf' && doc.file_size && doc.file_size < 1024) {
      warnings.push('PDF semble vide');
    }

    const isValid = errors.length === 0;
    const result = {
      isValid,
      errors,
      warnings,
      metadata: {
        fileSize: doc.file_size || 0,
        mimeType: doc.mime_type || 'unknown',
        fileName: doc.file_name || 'unknown',
      },
    };

    await supabase
      .from('documents')
      .update({
        metadata: {
          ...(doc.metadata || {}),
          validationResult: result,
          validatedAt: new Date().toISOString(),
        },
      })
      .eq('id', documentId);

    try {
      await supabase.from('document_validation_logs').insert({
        document_id: documentId,
        submission_id: submissionId,
        is_valid: isValid,
        errors: errors.length ? errors : null,
        warnings: warnings.length ? warnings : null,
        validated_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.warn('Failed to log validation:', logError);
    }

    return result;
  }
}
EOF

# ============================================================
# 3. Correction des imports dans _shared/
# ============================================================
echo "🔧 Correction des imports dans _shared/..."

for file in "$SHARED_DIR"/*.ts; do
  [ -f "$file" ] || continue
  # Remplacer les imports @/ par des imports relatifs
  sed -i 's|@/infrastructure/email/SmtpAdapter|./SmtpAdapter.ts|g' "$file"
  sed -i 's|@/infrastructure/email/ResendAdapter|./ResendAdapter.ts|g' "$file"
  sed -i 's|@/infrastructure/email/SendGridAdapter|./SendGridAdapter.ts|g' "$file"
  sed -i 's|@/application/services/email/EmailProvider|./EmailProvider.ts|g' "$file"
  sed -i 's|@/application/services/email/EmailService|./EmailService.ts|g' "$file"
  # Ajouter .ts aux imports relatifs si manquant
  sed -i -E "s|from '\./([^'\.]+)'|from './\1.ts'|g" "$file"
  sed -i -E 's|from "\./([^"\.]+)"|from "./\1.ts"|g' "$file"
done

# ============================================================
# 4. Correction des imports dans les Edge Functions
# ============================================================
echo "🔧 Correction des imports dans les Edge Functions..."

FUNCTIONS=(
  "assign-task-to-employee"
  "send-email-notification"
  "send-project-report"
  "send-supplier-notification"
  "send-tender-report"
  "send-tender-submission-notification"
  "validate-document"
)

for func in "${FUNCTIONS[@]}"; do
  index_file="supabase/functions/$func/index.ts"
  [ -f "$index_file" ] || continue

  echo "  - Correction de $func..."

  # Remplacer les imports @/ par des imports vers _shared/ (sans extension)
  sed -i 's|@/application/services/email/EmailServiceFactory|../_shared/EmailServiceFactory|g' "$index_file"
  sed -i 's|@/application/services/email/EmailService|../_shared/EmailService|g' "$index_file"
  sed -i 's|@/application/services/email/EmailProvider|../_shared/EmailProvider|g' "$index_file"
  sed -i 's|@/infrastructure/email/SmtpAdapter|../_shared/SmtpAdapter|g' "$index_file"
  sed -i 's|@/infrastructure/email/ResendAdapter|../_shared/ResendAdapter|g' "$index_file"
  sed -i 's|@/infrastructure/email/SendGridAdapter|../_shared/SendGridAdapter|g' "$index_file"
  sed -i 's|@/application/services/DocumentService|../_shared/DocumentValidationService|g' "$index_file"

  # Ajouter .ts UNIQUEMENT si l'import ne se termine pas déjà par .ts
  sed -i -E 's|\.\./_shared/EmailServiceFactory([^\.])|../_shared/EmailServiceFactory.ts\1|g' "$index_file"
  sed -i -E 's|\.\./_shared/EmailService([^\.])|../_shared/EmailService.ts\1|g' "$index_file"
  sed -i -E 's|\.\./_shared/EmailProvider([^\.])|../_shared/EmailProvider.ts\1|g' "$index_file"
  sed -i -E 's|\.\./_shared/SmtpAdapter([^\.])|../_shared/SmtpAdapter.ts\1|g' "$index_file"
  sed -i -E 's|\.\./_shared/ResendAdapter([^\.])|../_shared/ResendAdapter.ts\1|g' "$index_file"
  sed -i -E 's|\.\./_shared/SendGridAdapter([^\.])|../_shared/SendGridAdapter.ts\1|g' "$index_file"
  sed -i -E 's|\.\./_shared/DocumentValidationService([^\.])|../_shared/DocumentValidationService.ts\1|g' "$index_file"
done

# ============================================================
# 5. Supprimer les fichiers inutiles
# ============================================================
rm -f supabase/functions/send-email-notification/deno.json 2>/dev/null || true
rm -f supabase/import_map.json 2>/dev/null || true

# ============================================================
# 6. Templates
# ============================================================
echo "📄 Vérification des templates dans $TEMPLATES_DIR..."

copy_template_if_missing() {
  local src_file=$1
  local dst_file="$TEMPLATES_DIR/$(basename "$src_file")"
  if [ ! -f "$dst_file" ]; then
    if [ -f "$src_file" ]; then
      cp "$src_file" "$dst_file"
      echo "✅ Template copié : $(basename "$src_file")"
    else
      echo "⚠️ Fichier source manquant : $src_file"
    fi
  else
    echo "⏭️ Template existant, conservé : $(basename "$src_file")"
  fi
}

find src -name "admin-notification.tsx" -exec copy_template_if_missing {} \; 2>/dev/null || echo "⚠️ admin-notification.tsx non trouvé"
find src -name "supplier-confirmation.tsx" -exec copy_template_if_missing {} \; 2>/dev/null || echo "⚠️ supplier-confirmation.tsx non trouvé"

if [ ! -f "$TEMPLATES_DIR/admin-notification.tsx" ]; then
  cat > "$TEMPLATES_DIR/admin-notification.tsx" << 'EOF'
export const renderAdminNotificationEmail = (props: { tender_title: string; supplier_name: string; supplier_email: string; submission_id: string }) => `
<!DOCTYPE html>
<html><body>
<h1>Nouvelle soumission</h1>
<p>Appel d'offres: ${props.tender_title}</p>
<p>Fournisseur: ${props.supplier_name}</p>
<p>Email: ${props.supplier_email}</p>
<p>ID: ${props.submission_id}</p>
</body></html>
`;
EOF
fi

if [ ! -f "$TEMPLATES_DIR/supplier-confirmation.tsx" ]; then
  cat > "$TEMPLATES_DIR/supplier-confirmation.tsx" << 'EOF'
export const renderSupplierConfirmationEmail = (props: { supplier_name: string; tender_title: string; submission_id: string; secret_code: string }) => `
<!DOCTYPE html>
<html><body>
<h1>Confirmation de soumission</h1>
<p>Bonjour ${props.supplier_name},</p>
<p>Votre soumission pour ${props.tender_title} a été reçue.</p>
<p>ID: ${props.submission_id}</p>
<p>Code secret: ${props.secret_code}</p>
</body></html>
`;
EOF
fi

echo "✅ Terminé !"
echo "   - Fichiers recréés avec les noms corrects dans _shared/"
echo "   - Imports relatifs dans _shared/"
echo "   - Edge Functions importent depuis '../_shared/NomFichier.ts'"
echo "👉 Lancez le déploiement : npx supabase functions deploy --project-ref ( voir .env)"