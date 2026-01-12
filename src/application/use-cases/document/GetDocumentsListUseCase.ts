/**
 * Get Documents List Use Case
 * Retrieves all documents with optional filtering
 */

import { Document } from '@/domain/entities/Document';
import { IDocumentRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface GetDocumentsListResult {
  success: boolean;
  documents: Document[];
  error?: string;
}

export interface DocumentFilters {
  type?: string;
  status?: string;
  projectId?: string;
}

export class GetDocumentsListUseCase {
  private documentRepository: IDocumentRepository;

  constructor(documentRepository?: IDocumentRepository) {
    this.documentRepository = documentRepository || RepositoryFactory.getDocumentRepository();
  }

  async execute(filters?: DocumentFilters): Promise<GetDocumentsListResult> {
    try {
      let documents: Document[];

      if (filters?.projectId) {
        documents = await this.documentRepository.findByProjectId(filters.projectId);
      } else if (filters?.type) {
        documents = await this.documentRepository.findByType(filters.type as any);
      } else if (filters?.status) {
        documents = await this.documentRepository.findByStatus(filters.status as any);
      } else {
        documents = await this.documentRepository.findAll();
      }

      return { success: true, documents };
    } catch (error) {
      console.error('GetDocumentsListUseCase error:', error);
      return {
        success: false,
        documents: [],
        error: error instanceof Error ? error.message : 'Failed to fetch documents'
      };
    }
  }
}
