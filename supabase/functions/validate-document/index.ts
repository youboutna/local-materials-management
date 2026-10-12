// supabase/functions/validate-document/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { DocumentValidationService } from '../_shared/DocumentValidationService.ts';
import { authorizeRequest, corsHeaders, jsonResponse } from "../_shared/http.ts";

/**
 * Valide un document selon des critères (taille, MIME, extensions, etc.)
 * Reçoit en entrée : { document_id, submission_id, expected_category }
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const auth = await authorizeRequest(req, ['admin', 'director', 'manager']);
    if ('response' in auth) return auth.response;
    const { document_id, submission_id, expected_category } = await req.json();
    if (typeof document_id !== 'string' || typeof submission_id !== 'string') {
      return jsonResponse({ error: 'document_id and submission_id are required' }, 400);
    }

    const service = new DocumentValidationService();
    const result = await service.validateDocument(document_id, submission_id, expected_category);
    return jsonResponse(result);
  } catch (error) {
    console.error('Error in validate-document:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});