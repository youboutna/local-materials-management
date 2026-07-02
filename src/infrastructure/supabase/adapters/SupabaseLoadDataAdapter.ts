/**
 * Supabase Load Data Adapter
 * Implements ILoadDataRepository using Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { ILoadDataRepository, LoadDataResult } from '@/domain/repositories/ILoadDataRepository';

export class SupabaseLoadDataAdapter implements ILoadDataRepository {
  // ============= Data Loading Operations =============

  async checkExistingProjects(): Promise<number> {
    const { data: existingProjects, error: fetchError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (fetchError) throw fetchError;
    return existingProjects?.length || 0;
  }

  async loadDemoProjects(): Promise<number> {
    const demoProjects = [
      {
        id: `demo_${Date.now()}_1`,
        title: 'Projet de Démonstration 1',
        description: 'Projet créé via le bouton de chargement',
        status: 'planning',
        created_at: new Date().toISOString()
      },
      {
        id: `demo_${Date.now()}_2`,
        title: 'Projet de Démonstration 2', 
        description: 'Projet créé via le bouton de chargement',
        status: 'planning',
        created_at: new Date().toISOString()
      }
    ];

    const { error: insertError } = await supabase
      .from('projects')
      .insert(demoProjects);

    if (insertError) throw insertError;
    
    return demoProjects.length;
  }

  async executeDataLoading(): Promise<LoadDataResult> {
    try {
      const existingCount = await this.checkExistingProjects();
      
      let projectsLoaded = 0;
      if (existingCount === 0) {
        projectsLoaded = await this.loadDemoProjects();
      }

      return {
        success: true,
        message: `${projectsLoaded} projets ont été ajoutés avec succès`,
        projectsLoaded
      };

    } catch (error) {
      console.error('Error loading data:', error);
      return {
        success: false,
        message: 'Une erreur s\'est produite lors du chargement des données',
        projectsLoaded: 0
      };
    }
  }
}
