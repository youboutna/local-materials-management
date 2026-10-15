/**
 * ArticleService - Hexagonal Architecture
 * Business logic for article management
 */

import { Article, ArticleStatus } from '@/domain/entities/Article';
import { IArticleRepository } from '@/domain/repositories/IArticleRepository';
import {
  ArticleDTO,
  CreateArticleDTO,
  UpdateArticleDTO,
  ArticleListDTO,
  ArticleDocumentDTO,
} from '@/dtos/entities/ArticleDTO';
import { ArticleTransformer } from '@/dtos/transforms/ArticleTransformer';
import { AppError, ErrorCode } from '@/utils/errorHandling';
import { ProjectService } from './ProjectService';
import { DocumentService } from './DocumentService';

export class ArticleService {
  private articleRepository: IArticleRepository;
  private projectService: ProjectService;
  private documentService: DocumentService;

  constructor(
    repository: IArticleRepository,
    projectService: ProjectService,
    documentService: DocumentService,
  ) {
    this.articleRepository = repository;
    this.projectService = projectService;
    this.documentService = documentService;
  }

  async getAllArticles(status?: ArticleStatus): Promise<ArticleListDTO[]> {
    try {
      const entities = await this.articleRepository.findAll(status);
      const dtos = await Promise.all(
        entities.map(async (entity) => {
          const publicArticle = entity.isPublished();
          const enrichData = await this.getEnrichmentData(entity, publicArticle);
          const article = ArticleTransformer.toListDTO(entity, enrichData);
          if (publicArticle && !article.showProjectInfo) {
            article.projectId = undefined;
          }
          return article;
        })
      );
      return dtos;
    } catch (error) {
      console.error('ArticleService.getAllArticles failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch articles');
    }
  }

  async getArticleById(id: string): Promise<ArticleDTO | null> {
    try {
      const entity = await this.articleRepository.findById(id);
      if (!entity) return null;

      const enrichData = await this.getEnrichmentData(entity);
      return ArticleTransformer.toDTO(entity, enrichData);
    } catch (error) {
      console.error('ArticleService.getArticleById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch article');
    }
  }

  async getArticleBySlug(slug: string): Promise<ArticleDTO | null> {
    try {
      const entity = await this.articleRepository.findBySlug(slug);
      if (!entity) return null;

      // Only return published articles via slug (public access)
      if (!entity.isPublished()) {
        return null;
      }

      const enrichData = await this.getEnrichmentData(entity, true);
      const article = ArticleTransformer.toDTO(entity, enrichData);
      article.documentIds = enrichData.documents?.map((document) => document.id) ?? [];
      article.projectId = article.showProjectInfo ? article.projectId : undefined;
      article.metadata = article.showProjectInfo ? { showProjectInfo: true } : {};
      return article;
    } catch (error) {
      console.error('ArticleService.getArticleBySlug failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch article');
    }
  }

  async createArticle(dto: CreateArticleDTO, authorId: string): Promise<ArticleDTO> {
    try {
      // Validate project if provided
      if (dto.projectId) {
        const project = await this.projectService.getProjectById(dto.projectId);
        if (!project) {
          throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
        }
      }

      // Validate documents if provided
      if (dto.documentIds && dto.documentIds.length > 0) {
        for (const docId of dto.documentIds) {
          const doc = await this.documentService.getDocumentById(docId);
          if (!doc) {
            throw new AppError(ErrorCode.NOT_FOUND, `Document ${docId} not found`);
          }
        }
      }

      const entity = ArticleTransformer.fromCreateDTO(dto, authorId);
      await this.articleRepository.save(entity);

      const enrichData = await this.getEnrichmentData(entity);
      return ArticleTransformer.toDTO(entity, enrichData);
    } catch (error) {
      console.error('ArticleService.createArticle failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create article');
    }
  }

  async updateArticle(id: string, dto: UpdateArticleDTO): Promise<ArticleDTO> {
    try {
      const entity = await this.articleRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Article not found');
      }

      // Validate project if changed
      if (dto.projectId && dto.projectId !== entity.getProjectId()) {
        const project = await this.projectService.getProjectById(dto.projectId);
        if (!project) {
          throw new AppError(ErrorCode.NOT_FOUND, 'Project not found');
        }
      }

      const documentIds = dto.documentIds === undefined ? undefined : [...new Set(dto.documentIds)];
      if (documentIds) {
        for (const docId of documentIds) {
          const doc = await this.documentService.getDocumentById(docId);
          if (!doc) {
            throw new AppError(ErrorCode.NOT_FOUND, `Document ${docId} not found`);
          }
        }
      }

      const updateData = ArticleTransformer.toUpdateData({ ...dto, documentIds });
      entity.update(updateData);
      await this.articleRepository.update(id, entity);

      const enrichData = await this.getEnrichmentData(entity);
      return ArticleTransformer.toDTO(entity, enrichData);
    } catch (error) {
      console.error('ArticleService.updateArticle failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update article');
    }
  }

  async publishArticle(id: string): Promise<ArticleDTO> {
    try {
      const entity = await this.articleRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Article not found');
      }

      entity.publish();
      await this.articleRepository.update(id, entity);

      const enrichData = await this.getEnrichmentData(entity);
      return ArticleTransformer.toDTO(entity, enrichData);
    } catch (error) {
      console.error('ArticleService.publishArticle failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to publish article');
    }
  }

  async archiveArticle(id: string): Promise<void> {
    try {
      const entity = await this.articleRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Article not found');
      }

      entity.archive();
      await this.articleRepository.update(id, entity);
    } catch (error) {
      console.error('ArticleService.archiveArticle failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to archive article');
    }
  }

  async deleteArticle(id: string): Promise<void> {
    try {
      const entity = await this.articleRepository.findById(id);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Article not found');
      }

      await this.articleRepository.delete(id);
    } catch (error) {
      console.error('ArticleService.deleteArticle failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete article');
    }
  }

  async searchArticles(term: string, status?: ArticleStatus): Promise<ArticleListDTO[]> {
    try {
      const entities = await this.articleRepository.search(term, status);
      const dtos = await Promise.all(
        entities.map(async (entity) => {
          const enrichData = await this.getEnrichmentData(entity);
          return ArticleTransformer.toListDTO(entity, enrichData);
        })
      );
      return dtos;
    } catch (error) {
      console.error('ArticleService.searchArticles failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search articles');
    }
  }

  async addDocumentToArticle(articleId: string, documentId: string): Promise<ArticleDTO> {
    try {
      const entity = await this.articleRepository.findById(articleId);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Article not found');
      }

      const doc = await this.documentService.getDocumentById(documentId);
      if (!doc) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Document not found');
      }

      entity.addDocument(documentId);
      await this.articleRepository.update(articleId, entity);

      const enrichData = await this.getEnrichmentData(entity);
      return ArticleTransformer.toDTO(entity, enrichData);
    } catch (error) {
      console.error('ArticleService.addDocumentToArticle failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add document to article');
    }
  }

  async removeDocumentFromArticle(articleId: string, documentId: string): Promise<ArticleDTO> {
    try {
      const entity = await this.articleRepository.findById(articleId);
      if (!entity) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Article not found');
      }

      entity.removeDocument(documentId);
      await this.articleRepository.update(articleId, entity);

      const enrichData = await this.getEnrichmentData(entity);
      return ArticleTransformer.toDTO(entity, enrichData);
    } catch (error) {
      console.error('ArticleService.removeDocumentFromArticle failed:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to remove document from article');
    }
  }

  private async getEnrichmentData(entity: Article, publicDocumentsOnly = false): Promise<{
    authorName?: string;
    projectName?: string;
    projectProgress?: number;
    projectDuration?: string;
    documents?: ArticleDocumentDTO[];
  }> {
    const enrichData: {
      authorName?: string;
      projectName?: string;
      projectProgress?: number;
      projectDuration?: string;
      documents?: ArticleDocumentDTO[];
    } = {};

    // Get project info if linked
    const projectId = entity.getProjectId();
    if (projectId && (!publicDocumentsOnly || entity.toData().metadata?.showProjectInfo === true)) {
      const project = await this.projectService.getProjectById(projectId);
      if (project) {
        enrichData.projectName = project.title;
        enrichData.projectProgress = project.progress;
        
        // Calculate duration from dates
        if (project.startDate && project.endDate) {
          const start = new Date(project.startDate);
          const end = new Date(project.endDate);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          enrichData.projectDuration = `${days} days`;
        }
      }
    }

    // Get documents if linked
    const documentIds = entity.getDocumentIds();
    if (documentIds.length > 0) {
      const documents = await Promise.all(
        documentIds.map(async (docId) => {
          const doc = await this.documentService.getDocumentById(docId);
          if (!doc?.fileUrl || (publicDocumentsOnly && doc.isInternalOnly)) return null;
          let url: URL;
          try {
            url = new URL(doc.fileUrl);
          } catch {
            return null;
          }
          if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
          const hasAccessParameter = [...url.searchParams.keys()].some((key) =>
            /token|signature|(^|[_-])sig($|[_-])|credential|api[_-]?key|auth/i.test(key)
          );
          if (publicDocumentsOnly && (url.hash || hasAccessParameter)) {
            return null;
          }
          return {
            id: doc.id,
            title: doc.title,
            type: doc.documentType,
            url: url.toString(),
            fileName: doc.fileName,
            mimeType: doc.mimeType,
            fileSize: doc.fileSize,
            status: doc.status,
          };
        })
      );
      enrichData.documents = documents.filter((document): document is ArticleDocumentDTO => document !== null);
    }

    return enrichData;
  }
}
