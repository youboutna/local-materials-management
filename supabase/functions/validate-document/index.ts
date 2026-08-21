// supabase/functions/validate-document/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { DocumentValidationService } from '../_shared/DocumentValidationService.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Valide un document selon des critères (taille, MIME, extensions, etc.)
 * Reçoit en entrée : { document_id, submission_id, expected_category }
 */
serve(async (req) => {
  // Gestion des requêtes OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier que la méthode est POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire les paramètres
    const { document_id, submission_id, expected_category } = await req.json();

    // Valider les champs obligatoires
    if (!document_id || !submission_id) {
      return new Response(
        JSON.stringify({ error: 'document_id and submission_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Utiliser le service de validation
    const service = new DocumentValidationService();
    const result = await service.validateDocument(document_id, submission_id, expected_category);

    // Répondre avec le résultat
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in validate-document:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});