/**
 * Supabase Article Adapter
 * Implements IArticleRepository using Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import type { BtpTables, BtpTablesInsert, BtpTablesUpdate } from '@/integrations/supabase/btp-types';
import type { Json } from '@/integrations/supabase/types';
import { Article, ArticleData, ArticleStatus } from '@/domain/entities/Article';
import { IArticleRepository } from '@/domain/repositories/IArticleRepository';

type ArticleRow = BtpTables<'articles'>;
type ArticleInsert = BtpTablesInsert<'articles'>;
type ArticleUpdate = BtpTablesUpdate<'articles'>;

const toJson = (value?: Record<string, unknown>): Json =>
  JSON.parse(JSON.stringify(value ?? {})) as Json;

const fromJson = (value: Json | null): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;

export class SupabaseArticleAdapter implements IArticleRepository {
  async findById(id: string): Promise<Article | null> {
    if (!id || id.trim() === '') return null;

    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? Article.fromData(this.mapFromDb(data)) : null;
  }

  async findBySlug(slug: string): Promise<Article | null> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? Article.fromData(this.mapFromDb(data)) : null;
  }

  async findAll(status?: ArticleStatus): Promise<Article[]> {
    let query = supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('SupabaseArticleAdapter.findAll error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      Article.fromData(this.mapFromDb(row))
    );
  }

  async findByAuthor(authorId: string): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SupabaseArticleAdapter.findByAuthor error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      Article.fromData(this.mapFromDb(row))
    );
  }

  async findByProject(projectId: string): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SupabaseArticleAdapter.findByProject error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      Article.fromData(this.mapFromDb(row))
    );
  }

  async search(term: string, status?: ArticleStatus): Promise<Article[]> {
    let query = supabase
      .from('articles')
      .select('*')
      .or(`title.ilike.%${term}%,summary.ilike.%${term}%`)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('SupabaseArticleAdapter.search error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(row => 
      Article.fromData(this.mapFromDb(row))
    );
  }

  async save(article: Article): Promise<void> {
    const data = this.mapToDb(article.toData());
    const { error } = await supabase
      .from('articles')
      .insert(data);

    if (error) {
      console.error('SupabaseArticleAdapter.save error:', error);
      throw error;
    }
  }

  async update(id: string, article: Article): Promise<void> {
    const data = article.toData();
    const dbData: ArticleUpdate = {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: data.content,
      status: data.status,
      published_at: data.publishedAt ?? null,
      project_id: data.projectId ?? null,
      document_ids: data.documentIds,
      metadata: toJson(data.metadata),
    };
    dbData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('articles')
      .update(dbData)
      .eq('id', id);

    if (error) {
      console.error('SupabaseArticleAdapter.update error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('SupabaseArticleAdapter.delete error:', error);
      throw error;
    }
  }

  private mapFromDb(row: ArticleRow): ArticleData {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      content: row.content,
      status: row.status,
      publishedAt: row.published_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      projectId: row.project_id ?? undefined,
      documentIds: row.document_ids ?? [],
      authorId: row.author_id,
      metadata: fromJson(row.metadata),
    };
  }

  private mapToDb(entity: ArticleData): ArticleInsert {
    return {
      id: entity.id,
      title: entity.title,
      slug: entity.slug,
      summary: entity.summary,
      content: entity.content,
      status: entity.status,
      published_at: entity.publishedAt ?? null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      project_id: entity.projectId ?? null,
      document_ids: entity.documentIds,
      author_id: entity.authorId,
      metadata: toJson(entity.metadata),
    };
  }
}
