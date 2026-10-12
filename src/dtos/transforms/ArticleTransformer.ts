/**
 * ArticleTransformer - Data Mapper
 * Converts between Article entities and DTOs
 */

import { Article } from '@/domain/entities/Article';
import {
  ArticleDTO,
  CreateArticleDTO,
  UpdateArticleDTO,
  ArticleListDTO,
} from '@/dtos/entities/ArticleDTO';

export class ArticleTransformer {
  static toDTO(entity: Article, enrichData?: {
    authorName?: string;
    projectName?: string;
    projectProgress?: number;
    projectDuration?: string;
    documents?: Array<{
      id: string;
      title: string;
      type: string;
      url: string;
    }>;
  }): ArticleDTO {
    const data = entity.toData();
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: data.content,
      status: data.status,
      publishedAt: data.publishedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      projectId: data.projectId,
      documentIds: data.documentIds,
      authorId: data.authorId,
      authorName: enrichData?.authorName,
      projectName: enrichData?.projectName,
      projectProgress: enrichData?.projectProgress,
      projectDuration: enrichData?.projectDuration,
      documents: enrichData?.documents,
      showProjectInfo: data.metadata?.showProjectInfo as boolean,
      metadata: data.metadata,
    };
  }

  static toListDTO(entity: Article, enrichData?: {
    authorName?: string;
    projectName?: string;
    documents?: ArticleDTO['documents'];
  }): ArticleListDTO {
    const data = entity.toData();
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      status: data.status,
      publishedAt: data.publishedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      authorId: data.authorId,
      authorName: enrichData?.authorName,
      projectId: data.projectId,
      projectName: enrichData?.projectName,
      showProjectInfo: data.metadata?.showProjectInfo as boolean,
      documents: enrichData?.documents,
    };
  }

  static fromCreateDTO(dto: CreateArticleDTO, authorId: string): Article {
    return Article.create({
      title: dto.title,
      slug: dto.slug ?? '',
      summary: dto.summary,
      content: dto.content,
      status: 'draft',
      projectId: dto.projectId,
      documentIds: dto.documentIds || [],
      authorId,
      metadata: dto.showProjectInfo !== undefined 
        ? { ...dto.metadata, showProjectInfo: dto.showProjectInfo }
        : dto.metadata,
    });
  }

  static toUpdateData(dto: UpdateArticleDTO): Partial<Parameters<Article['update']>[0]> {
    const data: Partial<Parameters<Article['update']>[0]> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.slug !== undefined) data.slug = dto.slug;
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.projectId !== undefined) data.projectId = dto.projectId;
    if (dto.documentIds !== undefined) data.documentIds = dto.documentIds;
    if (dto.showProjectInfo !== undefined || dto.metadata !== undefined) {
      data.metadata = {
        ...dto.metadata,
        showProjectInfo: dto.showProjectInfo,
      };
    }
    return data;
  }
}
