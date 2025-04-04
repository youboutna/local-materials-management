
import { useProjects } from './projects/useProjects';

// Re-export the hook with the original name for backward compatibility
// This will always use Supabase due to TypeORM browser compatibility issues
export const useTypeOrmProjects = useProjects;
