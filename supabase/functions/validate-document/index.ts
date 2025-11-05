import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  document_id: string;
  submission_id: string;
  expected_category?: string;
  expected_subcategory?: string;
}

interface ValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    file_size: number;
    mime_type: string;
    file_name: string;
  };
}

// Allowed MIME types by category
const ALLOWED_MIME_TYPES = {
  administrative: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ],
  technical: [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'application/zip'
  ],
  financial: [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

// Max file sizes by category (in bytes)
const MAX_FILE_SIZES = {
  administrative: 10 * 1024 * 1024, // 10MB
  technical: 20 * 1024 * 1024, // 20MB
  financial: 15 * 1024 * 1024 // 15MB
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { document_id, submission_id, expected_category } = await req.json() as ValidationRequest;

    console.log('Validating document:', { document_id, submission_id, expected_category });

    // Fetch document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || 'Unknown error'}`);
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate file size
    const category = expected_category || 'administrative';
    const maxSize = MAX_FILE_SIZES[category as keyof typeof MAX_FILE_SIZES] || MAX_FILE_SIZES.administrative;
    
    if (document.file_size && document.file_size > maxSize) {
      errors.push(`La taille du fichier (${(document.file_size / 1024 / 1024).toFixed(2)} MB) dépasse la limite autorisée (${(maxSize / 1024 / 1024).toFixed(2)} MB)`);
    }

    // 2. Validate MIME type
    const allowedTypes = ALLOWED_MIME_TYPES[category as keyof typeof ALLOWED_MIME_TYPES] || ALLOWED_MIME_TYPES.administrative;
    
    if (document.mime_type && !allowedTypes.includes(document.mime_type)) {
      errors.push(`Type de fichier non autorisé: ${document.mime_type}. Types acceptés: ${allowedTypes.join(', ')}`);
    }

    // 3. Validate file name
    if (!document.file_name || document.file_name.trim().length === 0) {
      errors.push('Le nom du fichier est invalide');
    }

    // 4. Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.msi'];
    const fileExtension = document.file_name?.toLowerCase().split('.').pop() || '';
    
    if (dangerousExtensions.some(ext => fileExtension.endsWith(ext.substring(1)))) {
      errors.push(`Extension de fichier dangereuse détectée: .${fileExtension}`);
    }

    // 5. Validate file URL accessibility
    if (!document.file_url) {
      errors.push('URL du fichier manquante');
    } else {
      // Check if file is accessible (basic validation)
      try {
        const fileResponse = await fetch(document.file_url, { method: 'HEAD' });
        if (!fileResponse.ok) {
          warnings.push('Le fichier pourrait ne pas être accessible');
        }
      } catch (error) {
        warnings.push(`Erreur lors de la vérification de l'accessibilité du fichier: ${error.message}`);
      }
    }

    // 6. Content-based validation for PDFs
    if (document.mime_type === 'application/pdf') {
      if (document.file_size && document.file_size < 1024) {
        warnings.push('Le fichier PDF semble être très petit, vérifiez qu\'il n\'est pas vide');
      }
    }

    const is_valid = errors.length === 0;

    const validationResult: ValidationResult = {
      is_valid,
      errors,
      warnings,
      metadata: {
        file_size: document.file_size || 0,
        mime_type: document.mime_type || 'unknown',
        file_name: document.file_name || 'unknown'
      }
    };

    // Update document validation status
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: {
          ...document.metadata,
          validation_result: validationResult,
          validated_at: new Date().toISOString()
        }
      })
      .eq('id', document_id);

    if (updateError) {
      console.error('Error updating document validation status:', updateError);
    }

    // Create validation log
    await supabase
      .from('document_validation_logs')
      .insert({
        document_id,
        submission_id,
        is_valid,
        errors: errors.length > 0 ? errors : null,
        warnings: warnings.length > 0 ? warnings : null,
        validated_at: new Date().toISOString()
      });

    console.log('Validation result:', validationResult);

    return new Response(
      JSON.stringify(validationResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in validate-document function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        is_valid: false,
        errors: [error.message],
        warnings: []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
