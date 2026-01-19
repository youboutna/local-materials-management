/**
 * Load Data Repository Interface
 * Defines contract for data loading operations
 */

export interface LoadDataResult {
  success: boolean;
  message: string;
  projectsLoaded: number;
}

export interface ILoadDataRepository {
  // ============= Data Loading Operations =============
  
  /**
   * Check if projects exist
   */
  checkExistingProjects(): Promise<number>;

  /**
   * Load demo projects
   */
  loadDemoProjects(): Promise<number>;

  /**
   * Execute complete data loading process
   */
  executeDataLoading(): Promise<LoadDataResult>;
}
