/**
 * Get Documents By Project Use Case
 * Retrieves all documents for a specific project
 */

import { Document } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface GetDocumentsByProjectResult {
  success: boolean;
  documents: Document[];
  error?: string;
}

export class GetDocumentsByProjectUseCase {
  private documentRepository: IDocumentRepository;

  constructor(documentRepository?: IDocumentRepository) {
    this.documentRepository = documentRepository || RepositoryFactory.getDocumentRepository();
  }

  async execute(projectId: string): Promise<GetDocumentsByProjectResult> {
    try {
      if (!projectId) {
        return { success: false, documents: [], error: 'Project ID is required' };
      }

      const documents = await this.documentRepository.findByProjectId(projectId);

      return { success: true, documents };
    } catch (error) {
      console.error('GetDocumentsByProjectUseCase error:', error);
      return {
        success: false,
        documents: [],
        error: error instanceof Error ? error.message : 'Failed to fetch documents'
      };
    }
  }
}
