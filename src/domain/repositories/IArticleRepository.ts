/**
 * IArticleRepository - Domain Repository Interface
 * Defines the contract for article data access
 */

import { Article, ArticleStatus } from '@/domain/entities/Article';

export interface IArticleRepository {
  findById(id: string): Promise<Article | null>;
  findBySlug(slug: string): Promise<Article | null>;
  findAll(status?: ArticleStatus): Promise<Article[]>;
  findByAuthor(authorId: string): Promise<Article[]>;
  findByProject(projectId: string): Promise<Article[]>;
  search(term: string, status?: ArticleStatus): Promise<Article[]>;
  save(article: Article): Promise<void>;
  update(id: string, article: Article): Promise<void>;
  delete(id: string): Promise<void>;
}
