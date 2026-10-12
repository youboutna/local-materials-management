/**
 * ArticleDTO - Data Transfer Object
 * Represents article data for API/UI communication
 */

import { BaseEntityDTO } from './BaseEntityDTO';

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface ArticleDTO extends BaseEntityDTO {
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: ArticleStatus;
  publishedAt?: string;
  projectId?: string;
  documentIds: string[];
  authorId: string;
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
  showProjectInfo?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateArticleDTO {
  title: string;
  slug?: string;
  summary: string;
  content: string;
  projectId?: string;
  documentIds?: string[];
  showProjectInfo?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateArticleDTO {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  status?: ArticleStatus;
  projectId?: string;
  documentIds?: string[];
  showProjectInfo?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ArticleListDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: ArticleStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName?: string;
  projectId?: string;
  projectName?: string;
  showProjectInfo?: boolean;
  documents?: Array<{
    id: string;
    title: string;
    type: string;
    url: string;
  }>;
}
