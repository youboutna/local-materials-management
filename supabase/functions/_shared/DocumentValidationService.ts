import { createAdminClient } from './http.ts';

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
    const supabase = createAdminClient().schema('btp');
    const category = expectedCategory ?? 'administrative';
    if (!Object.prototype.hasOwnProperty.call(ALLOWED_MIME_TYPES, category)) {
      throw new Error(`Unsupported document category: ${category}`);
    }

    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new Error('Document not found');
      throw error;
    }
    if (!doc) throw new Error('Document not found');

    const errors: string[] = [];
    const warnings: string[] = [];

    const maxSize = MAX_FILE_SIZES[category];
    if (doc.file_size && doc.file_size > maxSize) {
      errors.push(`Taille dépassée (${(doc.file_size / 1024 / 1024).toFixed(2)} MB > ${(maxSize / 1024 / 1024).toFixed(2)} MB)`);
    }

    const allowed = ALLOWED_MIME_TYPES[category];
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

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: {
          ...(doc.metadata || {}),
          validationResult: result,
          validatedAt: new Date().toISOString(),
        },
      })
      .eq('id', documentId);
    if (updateError) throw updateError;

    const { error: logError } = await supabase.from('document_validation_logs').insert({
      document_id: documentId,
      submission_id: submissionId,
      is_valid: isValid,
      errors: errors.length ? errors : null,
      warnings: warnings.length ? warnings : null,
      validated_at: new Date().toISOString(),
    });
    if (logError) console.warn('Failed to log document validation:', logError);

    return result;
  }
}
