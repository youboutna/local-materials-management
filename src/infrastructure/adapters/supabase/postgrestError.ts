/**
 * Normalisation des erreurs PostgREST/Supabase.
 *
 * Certaines erreurs Supabase (RLS, contraintes) arrivent avec un `message` vide :
 * elles restent `instanceof Error`, ce qui produit des messages vides dans l'UI
 * ("Corrections requises" avec une puce vide). Ce helper garantit un message utile.
 */
export function normalizePostgrestError(error: unknown, fallback = 'Erreur base de données'): Error {
  if (!error) return new Error(fallback);

  const e = error as { message?: string; details?: string; hint?: string; code?: string };
  const message =
    (e.message && e.message.trim()) ||
    (e.details && e.details.trim()) ||
    (e.hint && e.hint.trim()) ||
    (e.code ? `Code ${e.code}` : '') ||
    fallback;

  const normalized = new Error(message);
  if (e.code) (normalized as Error & { code?: string }).code = e.code;
  return normalized;
}
