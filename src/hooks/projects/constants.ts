
// Flag to determine whether to use TypeORM or Supabase
// For development, we'll use Supabase by default
export const USE_TYPEORM = import.meta.env.VITE_USE_TYPEORM === 'true';
