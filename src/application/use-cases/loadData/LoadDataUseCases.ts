/**
 * Load Data Use Cases
 */

import { ILoadDataRepository, LoadDataResult } from '@/domain/repositories/ILoadDataRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

// Execute Data Loading
export class ExecuteDataLoadingUseCase {
  private loadDataRepository: ILoadDataRepository;

  constructor(loadDataRepository?: ILoadDataRepository) {
    this.loadDataRepository = loadDataRepository || RepositoryFactory.getLoadDataRepository();
  }

  async execute(): Promise<LoadDataResult> {
    try {
      const result = await this.loadDataRepository.executeDataLoading();
      return result;
    } catch (error) {
      console.error('ExecuteDataLoadingUseCase error:', error);
      return {
        success: false,
        message: 'Une erreur s\'est produite lors du chargement des données',
        projectsLoaded: 0
      };
    }
  }
}
